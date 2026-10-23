#!/usr/bin/env node
/* Render the LOCAL React application, never the deployed website or desktop.
 * Screenshot frames are clocked at 60 Hz, piped to FFmpeg, and never saved as
 * thousands of temporary images. Export-only presentation lives in this file.
 */
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const ROOT = path.resolve(__dirname, '../..');
const OUT = path.join(ROOT, 'review-artifacts/showcase');
const argv = process.argv.slice(2);
const flag = (name, fallback) => argv.includes(`--${name}`) ? argv[argv.indexOf(`--${name}`) + 1] : fallback;
const URL = flag('url', 'http://127.0.0.1:5180');
if (!/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?\/?$/.test(URL)) throw Error('Capture requires a local development server URL.');
const FFMPEG = flag('ffmpeg', process.env.FFMPEG || path.join(OUT, 'tools/gyan/ffmpeg-9.0.2-essentials_build/bin/ffmpeg.exe'));
const PLAYWRIGHT = flag('playwright', process.env.PLAYWRIGHT_PATH || 'C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const { chromium } = require(PLAYWRIGHT);
const SELECT = flag('only', '').split(',').filter(Boolean);
const FORCE = argv.includes('--force');
const manifestFile = path.join(OUT, 'capture-manifest.json');
fs.mkdirSync(path.join(OUT, 'clips'), { recursive: true });
fs.mkdirSync(path.join(OUT, 'stills'), { recursive: true });
const manifest = fs.existsSync(manifestFile) ? JSON.parse(fs.readFileSync(manifestFile)) : { clips: [], events: [], runtimeErrors: [], assetErrors: [], viewport: {width:540,height:960,deviceScaleFactor:2}, fps:60, localUrl:URL };
function save() { fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2)+'\n'); }
function wanted(id) { return !SELECT.length || SELECT.some(part => id.startsWith(part)); }
function existing(id) { const entry=manifest.clips.find(c=>c.id===id); return !FORCE && entry && fs.existsSync(path.resolve(ROOT,entry.path)); }
function add(entry) { manifest.clips=manifest.clips.filter(c=>c.id!==entry.id);manifest.clips.push(entry);save(); }
const relative = file=>path.relative(ROOT,file).replaceAll('\\','/');
let browser, context, page;
const FPS=60, FRAME=1000/FPS;

// Freeze native CSS/Web Animations as well as JS timers. Browser encoding speed
// cannot skip an animation frame: every recorded frame advances exactly 1/60 s.
async function tick(ms) {
 await page.clock.runFor(ms);
 await page.evaluate(delta=>{
   window.__captureAnimations ||= new WeakMap();
   for(const animation of document.getAnimations()){
     let record=window.__captureAnimations.get(animation);
     if(!record){record={time:Number(animation.currentTime)||0,done:false};window.__captureAnimations.set(animation,record);animation.pause();}
     if(record.done)continue;
     record.time+=delta;
     const end=animation.effect.getComputedTiming().endTime;
     try{
       if(Number.isFinite(end)&&record.time>=end){animation.finish();record.done=true;}
       else animation.currentTime=record.time;
     }catch{/* An unmounted transition can disappear between frames. */}
   }
 },ms);
}
async function assets() {
 await page.evaluate(async()=>{
   await document.fonts.ready;
   await Promise.all([...document.images].map(async image=>{if(image.getAttribute('loading')==='lazy')image.loading='eager';try{await image.decode();}catch{}}));
 });
}
async function settle(ms=1000){await assets();await tick(ms);await tick(20);}
async function route(name){
 await page.evaluate(name=>{location.hash='#/'+name;},name);
 // React's route render is synchronous; Suspense imports resolve through I/O.
 await page.locator(`.cinematic-app[data-route="${name}"] main`).waitFor();
 await page.locator(name==='scrapbook'?'.cover-open-button':name==='wishes'?'.hero':`main`).waitFor();
 await settle(1200);
 await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
}
async function topOf(selector,top=100){return page.locator(selector).first().evaluate((e,t)=>{const y=e.getBoundingClientRect().top+scrollY-t;scrollTo({top:Math.max(0,y),behavior:'instant'});return scrollY;},top);}
async function still(id,meta={}) {
 if(!wanted(id)||existing(id))return;
 await settle(450);
 // A paused browser clock does not guarantee delivery of IntersectionObserver
 // notifications. Held shots use the real reveal's completed presentation;
 // cover turns, flames and celebration animation continue to be frame-clocked.
 await page.evaluate(()=>{for(const e of document.querySelectorAll('[data-reveal]')){const b=e.getBoundingClientRect();if(b.bottom>0&&b.top<innerHeight){e.dataset.revealState='visible';e.style.transition='none';e.style.opacity='1';e.style.translate='0 0';for(const a of e.getAnimations()){a.cancel();}}}});
 // IntersectionObserver can start a CSS reveal on the last clock tick. Finish
 // finite entrances for a held photograph, while leaving ambient loops intact.
 await page.evaluate(()=>{document.documentElement.getBoundingClientRect();for(const a of document.getAnimations()){const end=a.effect.getComputedTiming().endTime;if(Number.isFinite(end)){try{a.finish();window.__captureAnimations?.set(a,{time:end,done:true});}catch{}}}});
 await tick(30);
 const heading=await page.evaluate(()=>{const h=document.querySelector('#capture-presentation')?null:document.querySelector('main h1');if(!h)return null;const b=h.getBoundingClientRect();if(b.top<0||b.bottom>innerHeight)return null;let opacity=1;for(let e=h;e;e=e.parentElement)opacity*=Number(getComputedStyle(e).opacity);return{title:h.textContent,opacity};});
 if(heading&&heading.opacity<.98)throw Error(id+': held heading has not finished revealing ('+heading.opacity+').');
 const file=path.join(OUT,'stills',id+'.png');
 await page.screenshot({path:file,type:'png'});
 add({id,path:relative(file),kind:'still',width:1080,height:1920,...meta,...(heading?{heading}: {})});
 console.log('STILL '+id);
}
async function frames(id,duration,{pose,action,meta={}}={}){
 if(!wanted(id)||existing(id)){if(action){await action();await settle(duration*1000+200);}return;}
 const file=path.join(OUT,'clips',id+'.mp4');
 const temporary=path.join(OUT,'clips',id+'.partial.mp4');
 console.log(`CAPTURE ${id} ${duration.toFixed(2)}s (${Math.round(duration*FPS)} frames)`);
 const ff=spawn(FFMPEG,['-hide_banner','-loglevel','warning','-y','-f','image2pipe','-vcodec','mjpeg','-framerate','60','-i','pipe:0','-an','-c:v','libx264','-preset','ultrafast','-crf','15','-threads','3','-pix_fmt','yuv420p','-r','60','-fps_mode','cfr','-video_track_timescale','15360','-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709','-movflags','+faststart',temporary],{cwd:ROOT,windowsHide:true,stdio:['pipe','ignore','pipe']});
 let log='';ff.stderr.on('data',x=>{log+=x;});let pipeError;ff.stdin.on('error',e=>{pipeError=e;});
 const complete=new Promise((resolve,reject)=>{ff.on('error',reject);ff.on('exit',code=>code===0?resolve():reject(Error(id+' encoding failed '+code+'\n'+log)));});
 if(action)await action();
 const count=Math.round(duration*FPS);
 for(let i=0;i<count;i++){
   await tick(FRAME);
   if(pose)await pose(i/Math.max(1,count-1),i);
   const buffer=await page.screenshot({type:'jpeg',quality:94,timeout:45000});
   if(pipeError)throw pipeError;
   if(!ff.stdin.write(buffer))await once(ff.stdin,'drain');
   if(i&&i%120===0)console.log(`  ${id}: ${i}/${count}`);
 }
 ff.stdin.end();await complete;fs.renameSync(temporary,file);
 add({id,path:relative(file),kind:'video',duration:count/FPS,width:1080,height:1920,fps:60,...meta});
}
async function overlay(html,extra=''){
 await page.evaluate(({html,extra})=>{
   document.querySelector('#capture-presentation')?.remove();
   const node=document.createElement('section');node.id='capture-presentation';node.innerHTML=html;
   const style=document.createElement('style');style.textContent=`#capture-presentation{position:fixed;inset:0;z-index:50000;overflow:hidden;background:#32131c;color:#f4e6cc;font-family:var(--serif);text-align:center;display:flex;align-items:center;justify-content:center;isolation:isolate}#capture-presentation:before{content:'';position:absolute;inset:24px;border:1px solid #c8a47045;pointer-events:none;z-index:4}#capture-presentation:after{content:'';position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at 50% 38%,#ac654324,transparent 65%),linear-gradient(150deg,#08020c1a,transparent 50%,#05020a44);z-index:0}.capture-title{position:relative;z-index:3;width:100%;padding:60px 42px}.capture-xx{font-size:25px;letter-spacing:-2px;color:#d5b27d;border:1px solid #c8a47066;border-radius:50%;width:58px;height:58px;display:grid;place-items:center;margin:0 auto 58px}.capture-kicker{font-family:'DM Sans',Arial,sans-serif;letter-spacing:5px;text-transform:uppercase;font-size:10px;color:#d5b27d}.capture-name{font-size:109px;line-height:1;font-weight:400;letter-spacing:10px;margin:30px 0 20px;color:#f5e8d0}.capture-chapter{font-size:54px;line-height:1.05;letter-spacing:-1px;font-weight:400;margin:0;color:#ecd9b5}.capture-chapter em{display:block;font-size:72px;font-weight:400}.capture-rule{width:44px;height:1px;background:#c4a16c;margin:35px auto 25px}.capture-line{font-size:29px;font-style:italic;color:#dabc88;line-height:1.25}.capture-date{font:8px 'DM Sans',Arial,sans-serif;letter-spacing:3px;color:#d5bda4;margin-top:53px}.capture-closing{font-size:56px;font-weight:400;line-height:1.06;letter-spacing:-1.3px;color:#f2dfbf}.capture-closing em{font-size:83px;display:block;font-weight:400}.capture-domain{font-family:'DM Sans',Arial,sans-serif;font-size:19px;letter-spacing:.8px;color:#edd5b0;margin-top:35px}.capture-sign{font-size:24px;font-style:italic;margin-top:55px;color:#d9b686}.capture-room-photo{position:relative;z-index:2;width:100%;height:auto;display:block;border-block:1px solid #d6b67c55;box-shadow:0 20px 70px #16081088}.capture-room-back{position:absolute;inset:-30px;width:calc(100% + 60px);height:calc(100% + 60px);object-fit:cover;filter:blur(25px) brightness(.3);opacity:.7}.capture-room-heading{position:absolute;z-index:3;top:128px;width:100%;left:0;color:#f5e5c9;font-size:51px;font-weight:400;font-style:italic}.capture-room-label{position:absolute;z-index:3;bottom:145px;width:100%;left:0;font-size:25px;font-style:italic;color:#e4c697}.capture-room-label small{display:block;margin-top:13px;font:9px 'DM Sans',sans-serif;letter-spacing:2px;color:#c9a980}${extra}`;
   node.prepend(style);document.body.append(node);
 },{html,extra});
 await settle(30);
}
async function removeOverlay(){await page.evaluate(()=>document.querySelector('#capture-presentation')?.remove());}
async function animateTitle(){
 await page.evaluate(()=>document.querySelector('.capture-title').animate([{opacity:0,transform:'translateY(14px)'},{opacity:1,transform:'translateY(0)'}],{duration:1600,fill:'both',easing:'cubic-bezier(.2,.65,.2,1)'}));
}
async function main(){
 if(!fs.existsSync(FFMPEG))throw Error('FFmpeg unavailable: '+FFMPEG);
 const response=await fetch(URL);if(!response.ok)throw Error('Local server is not running at '+URL);
 browser=await chromium.launch({executablePath:flag('browser',process.env.BROWSER_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'),headless:true,args:['--hide-scrollbars','--disable-background-timer-throttling','--autoplay-policy=no-user-gesture-required']});
 context=await browser.newContext({viewport:{width:540,height:960},deviceScaleFactor:2,isMobile:true,hasTouch:true,reducedMotion:'no-preference',colorScheme:'light'});
 page=await context.newPage();
 page.on('pageerror',e=>{manifest.runtimeErrors.push(e.message);save();});
 page.on('response',r=>{if(r.status()>=400){manifest.assetErrors.push({status:r.status(),url:r.url()});save();}});
 await context.addInitScript(()=>{sessionStorage.setItem('oma-scrapbook-viewing-note-v1','shown');localStorage.clear();});
 await page.goto(URL,{waitUntil:'networkidle'});await assets();
 await page.addStyleTag({content:'*{cursor:none!important}html{scroll-behavior:auto!important}::-webkit-scrollbar{display:none!important}*:focus{outline:none!important}.soundtrack-launcher,.soundtrack-panel,.header-audio{visibility:hidden!important}'});
 await page.clock.install({time:new Date('2026-10-24T12:00:00Z')});await page.clock.pauseAt(new Date('2026-10-24T12:00:00Z'));
 await settle(100);

 // Start the original welcome entrance after fonts/assets are warm, instead
 // of losing its first frames to the initial browser load.
 await page.evaluate(()=>{for(const animation of document.getAnimations()){if(animation.effect?.target?.classList?.contains('welcome-content')){animation.currentTime=0;window.__captureAnimations?.delete(animation);}}});
 // Welcome is recorded before the one-session choice is made.
 await frames('welcome-arrive',1.6);
 await still('welcome');
 await frames('welcome-enter',.8,{action:()=>page.locator('.welcome-enter').dispatchEvent('click')});
 await settle(1200);
 await page.evaluate(()=>{for(const media of document.querySelectorAll('audio,video'))media.muted=true;});

 const title='<div class="capture-title"><div class="capture-xx">XX</div><div class="capture-kicker">OMA — CHAPTER TWENTY</div><div class="capture-name">OMA</div><h1 class="capture-chapter">Chapter <em>Twenty</em></h1><div class="capture-rule"></div><div class="capture-line">One in a Million</div><div class="capture-date">24 OCTOBER 2026</div></div>';
 await overlay(title);await animateTitle();await frames('opening-reveal',2);await still('opening');await removeOverlay();

 await route('room');
 await still('room-interface',{route:'room'});
 // A camera plate of the real DOM keeps every object and label in the portrait
 // frame; only its decorative blurred surround is cropped.
 await assets();
 const roomImage=await page.locator('.room-scene-canvas').screenshot({type:'png'});
 const roomData='data:image/png;base64,'+roomImage.toString('base64');
 const roomArt=URL+'/images/room/birthday-room.webp';
 await overlay(`<img class="capture-room-back" src="${roomArt}" alt=""><h2 class="capture-room-heading">Your birthday room</h2><img class="capture-room-photo" src="${roomData}" alt="The actual interactive birthday room"><div class="capture-room-label">I made this for you, Oma.<small>WITH LOVE, ADE.</small></div>`);
 await still('room-cinema',{route:'room',source:'actual room DOM snapshot'});
 // An intentional gentle sweep across the captured DOM plate, with a maximum
 // 1.5% push, shows the interaction labels without moving them off-screen.
 await frames('room-drift',2,{pose:async t=>page.evaluate(t=>{const p=document.querySelector('.capture-room-photo');p.style.transform=`translateY(${(t-.5)*9}px) scale(${1+.012*t})`;},t),meta:{route:'room'}});
 await removeOverlay();
 await route('room');await topOf('.birthday-room__collection',80);await settle(500);
 await still('collection',{route:'room'});

 await route('scrapbook');
 await topOf('.memory-stage',170);await settle(800);
 await still('book-cover',{route:'scrapbook'});
 await frames('book-opening',1.25,{action:()=>page.locator('.cover-open-button').dispatchEvent('click'),meta:{route:'scrapbook',chapter:1}});
 // Opening may request a center-scroll. Fix the camera once, then leave its
 // layout and real page-turn implementation completely intact.
 await topOf('.memory-book',170);await settle(800);
 for(let leaf=1;leaf<=10;leaf++){
   await page.waitForFunction(n=>document.querySelector('.memory-book')?.dataset.page===String(n)&&document.querySelector('.memory-book')?.getAttribute('aria-busy')==='false',leaf);
   await settle(600);
   const chapter=Math.ceil(leaf/2);
   const state=await page.locator('.memory-spread > .memory-leaf').evaluate(e=>({title:e.querySelector('h2').textContent,side:e.dataset.side,image:e.querySelector('img')?.getAttribute('src')||null,placeholder:e.querySelector('.memory-placeholder small')?.textContent||null}));
   await still(`book-leaf-${leaf}`,{route:'scrapbook',chapter,leaf,...state});
   if(leaf<10)await frames(`book-turn-${leaf}`,0.8,{action:()=>page.locator('.memory-flip--next').dispatchEvent('click'),meta:{route:'scrapbook',chapter,fromLeaf:leaf,toLeaf:leaf+1}});
 }

 await route('letters');await topOf('.experience-title',40);await settle(600);
 await still('letters-collection',{route:'letters'});
 for(let index=0;index<4;index++){
   const n=index+1;
   if(!wanted(`letter-${n}-start`)&&!wanted(`letter-${n}-scroll`)&&!wanted(`letter-${n}-end`))continue;
   await page.locator('.letter-envelope').nth(index).dispatchEvent('click');await settle(1000);
   await page.locator('.letter-dialog[open] .letter-body').waitFor();
   const dialog=page.locator('.letter-dialog');await dialog.evaluate(e=>e.scrollTop=0);await settle(300);
   const info=await dialog.evaluate(e=>({title:e.querySelector('h2').textContent,scrollHeight:e.scrollHeight,clientHeight:e.clientHeight,maxScroll:e.scrollHeight-e.clientHeight}));
   await still(`letter-${n}-start`,{route:'letters',letter:n,...info});
   await frames(`letter-${n}-scroll`,2.4,{pose:async t=>{const ease=t*t*(3-2*t);await dialog.evaluate((e,y)=>e.scrollTop=y,info.maxScroll*ease);},meta:{route:'letters',letter:n}});
   await still(`letter-${n}-end`,{route:'letters',letter:n});
   await page.locator('.letter-dialog .dialog-close').dispatchEvent('click');await settle(400);await page.waitForTimeout(80);
 }

 await route('portrait');await topOf('.large-portrait',80);await settle(800);
 await still('portrait',{route:'portrait'});
 await page.locator('.portrait-copy details summary').nth(0).dispatchEvent('click');
 await topOf('.portrait-copy',140);await settle(900);
 const portraitPlate=async()=>{
   await settle(1000);
   await page.evaluate(()=>{for(const a of document.getAnimations()){if(Number.isFinite(a.effect.getComputedTiming().endTime)){try{a.finish();}catch{}}}});
   const png=await page.locator('.portrait-copy').screenshot({type:'png'});
   await overlay(`<img src="data:image/png;base64,${png.toString('base64')}" alt="The original Through my eyes notes" style="position:relative;z-index:3;width:86%;height:auto;max-height:84%;object-fit:contain">`,'#capture-presentation{background:radial-gradient(ellipse at 80% 10%,#f4e6d6,transparent 55%),#fbf6ed}#capture-presentation:after{display:none}#capture-presentation:before{border-color:#ad864933}');
 };
 await portraitPlate();
 await still('portrait-laugh',{route:'portrait'});
 await removeOverlay();
 await page.locator('.portrait-copy details summary').nth(1).dispatchEvent('click');
 await page.locator('.portrait-copy details summary').nth(2).dispatchEvent('click');
 await settle(900);await portraitPlate();await still('portrait-notes',{route:'portrait'});await removeOverlay();

 await route('film');await topOf('.film-page',100);await settle(800);
 const video=page.locator('.film-player video');
 await video.evaluate(async e=>{e.muted=true;e.pause();e.currentTime=22;await new Promise(resolve=>e.addEventListener('seeked',resolve,{once:true}));e.controls=false;});
 await still('film-frame',{route:'film',filmTime:22});
 // A frame cut-out permits FFmpeg to insert the real MP4 highlight into the
 // real player shell, at its original 16:9 ratio without a face crop.
 const bounds=await video.boundingBox();
 const info=await video.evaluate(e=>({duration:e.duration,width:e.videoWidth,height:e.videoHeight}));
 manifest.film={...info,playerBounds:bounds,source:'public/videos/oma-on-film.mp4',insertAt:22};save();

 await route('cake');await topOf('.cake-page',65);await settle(800);
 await still('cake-lit',{route:'cake'});
 await frames('cake-flame',1.5,{meta:{route:'cake'}});
 await frames('cake-blow',3.2,{action:()=>page.getByRole('button',{name:'Blow out your candles'}).dispatchEvent('click'),meta:{route:'cake'}});
 await still('cake-celebration',{route:'cake'});

 await route('wishes');await settle(900);await topOf('.hero',90);await settle(600);
 await still('wishes-intro',{route:'wishes',privacy:'Fresh browser context. Existing public contributor display names only.'});
 await topOf('#collection',80);await settle(800);await still('wishes-collection',{route:'wishes'});
 if(await page.locator('.load-button').count()){await page.locator('.load-button').dispatchEvent('click');await settle(800);}
 const wishes=page.locator('.wish-card');
 const count=await wishes.count();manifest.wishesShown=count;save();
 // Boluwatife's user-supplied wish; public content only, no saved journal.
 await wishes.nth(count-1).dispatchEvent('click');await settle(900);
 await still('wish-letter',{route:'wishes'});
 await page.locator('.wish-dialog .dialog-close').dispatchEvent('click');await settle(300);

 await route('notes');await topOf('.notes-page',100);await settle(500);
 await still('little-notes',{route:'notes'});
 await page.locator('.notes-grid button').nth(7).dispatchEvent('click');await settle(900);
 await still('little-note-open',{route:'notes',note:8});
 await page.locator('.wish-dialog .dialog-close').dispatchEvent('click');await settle(300);

 await overlay('<div class="capture-title"><div class="capture-xx">XX</div><div class="capture-kicker">OMA — CHAPTER TWENTY</div><h1 class="capture-closing">Made with love,<em>for Oma</em></h1><div class="capture-rule"></div><div class="capture-domain">sylverat20.com.ng</div><div class="capture-sign">With love, Ade.</div></div>');
 await animateTitle();await frames('closing-reveal',2);await still('closing');
 manifest.completedAt=new Date().toISOString();manifest.sourcePolicy='Local app and original personal assets; export-only framing never changes production files.';save();
 await browser.close();browser=null;
 console.log('CAPTURE COMPLETE '+manifest.clips.length+' shots; runtimeErrors='+manifest.runtimeErrors.length+' assetErrors='+manifest.assetErrors.length);
}
main().catch(async error=>{console.error(error.stack||error);save();if(page)await page.screenshot({path:path.join(OUT,'capture-failure.png')}).catch(()=>{});await browser?.close();process.exitCode=1;});
