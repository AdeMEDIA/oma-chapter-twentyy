#!/usr/bin/env node
// A NEW, independent 60-second portrait edit of the actual desktop layouts.
// Previous videos and production source files are never written by this tool.
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {spawn}=require('node:child_process');
const {once}=require('node:events');
const ROOT=path.resolve(__dirname,'../..');
const args=process.argv.slice(2);
const flag=(name,fallback)=>args.includes('--'+name)?args[args.indexOf('--'+name)+1]:fallback;
const OUT=path.join(ROOT,'review-artifacts/showcase-desktop');
const URL=flag('url','http://127.0.0.1:5180');
if(!/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?\/?$/.test(URL))throw Error('Only a local Vite server is allowed.');
const FF=flag('ffmpeg',process.env.FFMPEG||path.join(ROOT,'review-artifacts/showcase/tools/gyan/ffmpeg-9.0.2-essentials_build/bin/ffmpeg.exe'));
const FP=flag('ffprobe',process.env.FFPROBE||path.join(path.dirname(FF),'ffprobe.exe'));
const {chromium}=require(flag('playwright',process.env.PLAYWRIGHT_PATH||'C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
const FINAL='Oma_Chapter_Twenty_Desktop_Style_60s_1080p.mp4';
const resume=args.includes('--resume');
const recapture=flag('recapture','').split(',').filter(Boolean);
fs.mkdirSync(path.join(OUT,'stills'),{recursive:true});fs.mkdirSync(path.join(OUT,'clips'),{recursive:true});
const mp=path.join(OUT,'capture-manifest.json');
const manifest=(resume||recapture.length||args.includes('--edit-only'))&&fs.existsSync(mp)?JSON.parse(fs.readFileSync(mp)): {clips:[],runtimeErrors:[],assetErrors:[],viewport:{width:1080,height:1920,deviceScaleFactor:1,isMobile:false},fps:60,localUrl:URL,chapters:[]};
const previousNames=['Oma_Chapter_Twenty_Full_1080p.mp4','Oma_Chapter_Twenty_60s_1080p.mp4','Oma_Chapter_Twenty_Portrait_1080p.mp4'];
const digest=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const previous=previousNames.map(name=>({name,hash:digest(path.join(ROOT,'video-output',name))}));
const relative=file=>path.relative(ROOT,file).replaceAll('\\','/');
const save=()=>fs.writeFileSync(mp,JSON.stringify(manifest,null,2)+'\n');
function add(entry){manifest.clips=manifest.clips.filter(c=>c.id!==entry.id);manifest.clips.push(entry);save();}
const cached=id=>!recapture.some(prefix=>id.startsWith(prefix))&&(resume||recapture.length)&&manifest.clips.some(c=>c.id===id&&fs.existsSync(path.resolve(ROOT,c.path)));
let browser,page,server;
async function run(binary,parameters,label){return new Promise((resolve,reject)=>{const p=spawn(binary,parameters,{cwd:ROOT,windowsHide:true,stdio:['ignore','pipe','pipe']});let log='';p.stdout.on('data',b=>{log+=b;if(binary===process.execPath)process.stdout.write(b);});p.stderr.on('data',b=>log+=b);p.on('error',reject);p.on('exit',c=>{if(c===0)resolve(log);else reject(Error(label+' failed:\n'+log.slice(-14000)));});});}
const tool=(script,parameters)=>run(process.execPath,[path.join(__dirname,script),...parameters],script);
async function tick(ms){
 await page.clock.runFor(ms);
 await page.evaluate(delta=>{window.__desktopAnimations||=new WeakMap();for(const a of document.getAnimations()){
  let r=window.__desktopAnimations.get(a);if(!r){r={time:Number(a.currentTime)||0,done:false};window.__desktopAnimations.set(a,r);a.pause();}if(r.done)continue;r.time+=delta;
  const end=a.effect.getComputedTiming().endTime;try{if(Number.isFinite(end)&&r.time>=end){a.finish();r.done=true;}else a.currentTime=r.time;}catch{}
 }const c=document.querySelector('.memory-chapter-status>span');if(document.body.dataset.desktopScene==='book'&&c)document.querySelector('#ds-caption').textContent=c.textContent;},ms);
}
async function assets(){await page.evaluate(async()=>{await document.fonts.ready;for(const s of document.querySelectorAll('picture source'))s.remove();await Promise.all([...document.images].map(async i=>{i.loading='eager';try{await i.decode();}catch{}}));});}
async function settle(ms=1000){await assets();await tick(ms);await tick(30);}
async function completed(){await settle(500);await page.evaluate(()=>{for(const e of document.querySelectorAll('[data-reveal]')){e.dataset.revealState='visible';e.style.transition='none';e.style.opacity='1';e.style.translate='0 0';for(const a of e.getAnimations())a.cancel();}for(const a of document.getAnimations()){const end=a.effect.getComputedTiming().endTime;if(Number.isFinite(end)){try{a.finish();window.__desktopAnimations.set(a,{time:end,done:true});}catch{}}}});await tick(30);}
async function route(name){await page.evaluate(n=>location.hash='#/'+n,name);await page.locator(`.cinematic-app[data-route="${name}"] main`).waitFor({state:'attached'});if(name==='scrapbook')await page.locator('.cover-open-button').waitFor({state:'attached'});if(name==='wishes')await page.locator('.wish-card').first().waitFor({state:'attached'});await settle(1000);}
async function stage(selector,title,scene,{width=1000,caption='',dark=false,heading=true}={}){
 await page.evaluate(({selector,title,scene,width,caption,dark,heading})=>{
  document.querySelectorAll('[data-desktop-target]').forEach(e=>e.removeAttribute('data-desktop-target'));
  const target=document.querySelector(selector);if(!target)throw Error('Missing desktop component '+selector);target.setAttribute('data-desktop-target','');target.style.setProperty('--desktop-width',width+'px');
  document.body.dataset.desktopScene=scene;document.body.dataset.desktopTone=dark?'dark':'paper';
  document.querySelector('#ds-heading').textContent=title;document.querySelector('#ds-caption').textContent=caption;document.querySelector('#ds-titles').style.display=heading?'block':'none';
  scrollTo({top:0,behavior:'instant'});
 },{selector,title,scene,width,caption,dark,heading});
 await completed();
}
async function still(id,meta={}){
 if(cached(id))return;await completed();const file=path.join(OUT,'stills',id+'.png');await page.screenshot({path:file,type:'png'});add({id,path:relative(file),kind:'still',width:1080,height:1920,...meta});console.log('DESKTOP STILL '+id);
}
async function frames(id,duration,{action,pose,meta={}}={}){
 if(cached(id)){if(action){await action();await settle(duration*1000+200);}return;}
 const file=path.join(OUT,'clips',id+'.mp4'),temp=path.join(OUT,'clips',id+'.partial.mp4');const count=Math.round(duration*60);
 console.log(`DESKTOP MOTION ${id}: ${count} frames`);
 const p=spawn(FF,['-hide_banner','-loglevel','warning','-y','-f','image2pipe','-vcodec','mjpeg','-framerate','60','-i','pipe:0','-an','-c:v','libx264','-preset','ultrafast','-crf','15','-threads','3','-pix_fmt','yuv420p','-r','60','-fps_mode','cfr','-video_track_timescale','15360','-movflags','+faststart',temp],{cwd:ROOT,windowsHide:true,stdio:['pipe','ignore','pipe']});
 let log='',pipeError;p.stderr.on('data',b=>log+=b);p.stdin.on('error',e=>pipeError=e);const done=new Promise((resolve,reject)=>{p.on('error',reject);p.on('exit',c=>{if(c===0)resolve();else reject(Error(id+' failed '+log));});});
 if(action)await action();
 for(let i=0;i<count;i++){await tick(1000/60);if(pose)await pose(i/count,i);const frame=await page.screenshot({type:'jpeg',quality:95,timeout:45000});if(pipeError)throw pipeError;if(!p.stdin.write(frame))await once(p.stdin,'drain');}
 p.stdin.end();await done;fs.renameSync(temp,file);add({id,path:relative(file),kind:'video',duration,width:1080,height:1920,fps:60,...meta});
}
const CSS=`
*{cursor:none!important}html{scroll-behavior:auto!important;overflow:hidden!important;scrollbar-gutter:auto!important}::-webkit-scrollbar{display:none!important}*:focus{outline:none!important}
body *{visibility:hidden!important}
#ds-frame,#ds-frame *{visibility:visible!important}
[data-desktop-target],[data-desktop-target] *{visibility:visible!important}
[data-desktop-target]{position:fixed!important;left:50%!important;top:50%!important;transform:translate(-50%,-50%)!important;width:var(--desktop-width)!important;max-width:none!important;margin:0!important;z-index:10!important}
#ds-frame{position:fixed;inset:0;z-index:0;pointer-events:none;background:radial-gradient(ellipse at 80% 15%,#ecdbc1a0,transparent 58%),#fbf6ed;color:#650c26}
#ds-frame:before{content:'';position:absolute;inset:36px;border:1px solid #b4935e45}
#ds-titles{position:absolute;top:240px;left:65px;right:65px;text-align:center}
#ds-kicker{font:13px 'DM Sans',sans-serif;letter-spacing:6px;color:#9e7a4c}
#ds-heading{font:400 88px/1.02 var(--serif);letter-spacing:-2px;color:inherit;margin:32px 0 0;text-wrap:balance}
#ds-rule{height:1px;width:58px;margin:30px auto 0;background:#b18a56}
#ds-caption{position:absolute;top:1450px;left:80px;right:80px;text-align:center;font:400 26px/1.5 var(--serif);color:#806345;letter-spacing:.3px}
body[data-desktop-tone=dark] #ds-frame{background:radial-gradient(ellipse at 50% 48%,#63342a65,transparent 70%),#32131c;color:#f1e0bf}
body[data-desktop-tone=dark] #ds-caption{color:#d3b384}
body[data-desktop-scene=book] .memory-stage{overflow:visible!important}
body[data-desktop-scene=book] .memory-leaf h2{font-size:34px!important}
body[data-desktop-scene=book] .memory-right h2{font-size:29px!important}
body[data-desktop-scene=book] .memory-date{font-size:10px!important}
body[data-desktop-scene=room] [data-desktop-target]{box-shadow:0 24px 80px #16060a70}
body[data-desktop-scene=letters] .letter-envelope{min-height:275px}
body[data-desktop-scene=letter] [data-desktop-target]{position:fixed!important;top:50%!important;left:50%!important;margin:0!important;max-height:1400px!important}
body[data-desktop-scene=letter] .wish-dialog::backdrop{background:transparent;backdrop-filter:none}
body[data-desktop-scene=letter] .letter-body{font-size:28px!important;line-height:1.55!important}
body[data-desktop-scene=letter] .dialog-paper h2{font-size:40px!important}
body[data-desktop-scene=portrait] .portrait-copy details p{font-size:16px;line-height:1.7}
body[data-desktop-scene=cake] .cake-page>.experience-title,body[data-desktop-scene=cake] .wish-journal{display:none!important}
body[data-desktop-scene=cake] .birthday-cake.photo-cake{width:560px;max-width:560px;margin-bottom:44px}
body[data-desktop-scene=wishes] .wish-grid{gap:20px}
body[data-desktop-scene=wishes] .wish-card{min-height:300px}
body[data-desktop-scene=wishes] .wish-card:nth-child(n+4){display:none!important}
`;
async function installFrame(){await page.addStyleTag({content:CSS});await page.evaluate(()=>{const div=document.createElement('div');div.id='ds-frame';div.innerHTML='<div id="ds-titles"><div id="ds-kicker">OMA — CHAPTER TWENTY</div><h1 id="ds-heading"></h1><div id="ds-rule"></div></div><div id="ds-caption"></div>';document.body.prepend(div);});}
async function capture(){
 const context=await browser.newContext({viewport:{width:1080,height:1920},deviceScaleFactor:1,isMobile:false,hasTouch:false,reducedMotion:'no-preference'});page=await context.newPage();
 page.on('pageerror',e=>{manifest.runtimeErrors.push(e.message);save();});page.on('response',r=>{if(r.status()>=400){manifest.assetErrors.push({status:r.status(),url:r.url()});save();}});
 await context.addInitScript(()=>localStorage.clear());await page.goto(URL,{waitUntil:'networkidle'});await assets();
 await page.addStyleTag({content:'*{cursor:none!important}::-webkit-scrollbar{display:none!important}*:focus{outline:none!important}'});
 const captureEpoch=new Date('2026-10-24T12:00:00Z');await page.clock.install({time:captureEpoch});await page.clock.pauseAt(new Date(captureEpoch.getTime()+1000));
 await page.evaluate(()=>{for(const a of document.getAnimations()){if(a.effect?.target?.classList?.contains('welcome-content')){a.pause();a.currentTime=0;}}});
 await frames('desktop-welcome-arrive',1.2);await still('desktop-welcome');
 await page.locator('.welcome-quiet').dispatchEvent('click');await settle(1200);await installFrame();
 await route('room');await stage('.room-viewport','Your birthday room','room',{width:1080,dark:true,caption:'I made this for you, Oma.'});await still('desktop-room',{route:'room'});
 await frames('desktop-room-hover',3,{meta:{route:'room'},pose:async(_t,i)=>{if([0,60,120].includes(i)){await page.locator(['.spot-book','.spot-letters','.spot-cake'][i/60]).hover();}}});
 await route('scrapbook');await stage('.memory-stage','The scrapbook','book',{width:460,caption:'With love, Ade.'});await still('desktop-book-cover',{route:'scrapbook'});
 await frames('desktop-book-opening',1.2,{action:async()=>{await page.locator('.memory-stage').evaluate(e=>e.style.setProperty('--desktop-width','1000px'));await page.locator('.cover-open-button').dispatchEvent('click');},meta:{route:'scrapbook',chapter:1}});
 for(let chapter=1;chapter<=5;chapter++){
  await completed();
  const state=await page.locator('.memory-book').evaluate(e=>({chapter:+e.dataset.chapter,page:+e.dataset.page,single:!!e.querySelector('.memory-spread--single'),leaves:[...e.querySelectorAll('.memory-spread>.memory-leaf')].map(leaf=>({side:leaf.dataset.side,title:leaf.querySelector('h2').textContent,image:leaf.querySelector('img')?.getAttribute('src')||null}))}));
  if(state.single||state.leaves.length!==2||state.chapter!==chapter)throw Error('Desktop chapter layout failed '+chapter);
  manifest.chapters[chapter-1]=state;save();await still('desktop-book-'+chapter,{route:'scrapbook',chapter,...state});
  if(chapter<5)await frames('desktop-book-turn-'+chapter,.9,{action:()=>page.locator('.memory-flip--next').dispatchEvent('click'),meta:{route:'scrapbook',chapter,chapters:[chapter,chapter+1]}});
 }
 await route('letters');await stage('.letter-grid','Letters for you','letters',{width:920,caption:'With love, Ade.'});await still('desktop-letters',{route:'letters'});
 for(const index of [0,2]){
  await page.locator('.letter-envelope').nth(index).dispatchEvent('click');await page.locator('.letter-dialog[open] .letter-body').waitFor({state:'attached'});await settle(800);
  await stage('.letter-dialog','Letters for you','letter',{width:860,heading:false,dark:true});await still(index===0?'desktop-letter-birthday':'desktop-letter-mls',{route:'letters',letter:index+1});
  await page.locator('.letter-dialog .dialog-close').dispatchEvent('click');await settle(300);await page.waitForTimeout(80);
  await stage('.letter-grid','Letters for you','letters',{width:920});
 }
 await route('portrait');await page.locator('.portrait-copy details summary').first().dispatchEvent('click');await stage('.portrait-page','Through Ade’s eyes','portrait',{width:980});await still('desktop-portrait',{route:'portrait'});
 await route('film');await stage('.film-player','Oma on film','film',{width:1000,dark:true,caption:'For Oma, from Ade.'});
 const video=page.locator('.film-player video');await video.evaluate(async e=>{e.pause();e.muted=true;e.controls=false;e.currentTime=62;await new Promise(r=>e.addEventListener('seeked',r,{once:true}));});await still('desktop-film-shell',{route:'film'});
 manifest.film={source:'public/videos/oma-on-film.mp4',playerBounds:await video.boundingBox()};save();
 await route('cake');await stage('.cake-page','Make a wish','cake',{width:900,caption:'Happy twentieth, my one in a million.'});await still('desktop-cake-lit',{route:'cake'});
 await frames('desktop-cake-blow',3.2,{action:()=>page.getByRole('button',{name:'Blow out your candles'}).dispatchEvent('click'),meta:{route:'cake'}});await still('desktop-cake-out',{route:'cake'});
 await route('wishes');await stage('.wish-grid','Your birthday wishes','wishes',{width:980,caption:'I asked a few friends to wish you a happy birthday.'});await still('desktop-wishes',{route:'wishes',privacy:'Public contributor display names only; isolated new browser context.'});
 await route('notes');await stage('.notes-grid','20 little notes','notes',{width:960,caption:'With love, Ade.'});await still('desktop-notes',{route:'notes'});
 await browser.close();browser=null;manifest.capturedAt=new Date().toISOString();manifest.previousOutputs=previous;save();
}
async function film(){
 if(cached('desktop-film'))return;const b=manifest.film.playerBounds;const x=Math.round(b.x),y=Math.round(b.y),w=Math.round(b.width/2)*2,h=Math.round(b.height/2)*2;
 const mask=path.join(OUT,'film-mask.pgm'),pixels=Buffer.alloc(w*h);for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++){const cx=Math.min(w-10,Math.max(10,xx+.5)),cy=Math.min(h-10,Math.max(10,yy+.5));pixels[yy*w+xx]=Math.round(255*Math.max(0,Math.min(1,10.5-Math.hypot(xx+.5-cx,yy+.5-cy))));}fs.writeFileSync(mask,Buffer.concat([Buffer.from(`P5\n${w} ${h}\n255\n`),pixels]));
 const file=path.join(OUT,'clips/desktop-film.mp4');
 const graph=`[0:v]setpts=PTS-STARTPTS,format=yuv420p[plate];[1:v]setpts=PTS-STARTPTS,scale=${w}:${h}:force_original_aspect_ratio=decrease:force_divisible_by=2:in_range=full:out_range=tv:in_color_matrix=bt470bg:out_color_matrix=bt709,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2:color=0x24151b,setsar=1,fps=60,format=yuv420p[movie];[2:v]format=gray[mask];[movie][mask]alphamerge[rounded];[plate][rounded]overlay=x=${x}:y=${y}:shortest=1:format=auto,format=yuv420p[out]`;
 await run(FF,['-hide_banner','-loglevel','warning','-y','-loop','1','-framerate','60','-i',path.join(OUT,'stills/desktop-film-shell.png'),'-ss','62','-reinit_filter','0','-i',path.join(ROOT,manifest.film.source),'-loop','1','-framerate','60','-i',mask,'-filter_complex_threads','2','-filter_complex',graph,'-map','[out]','-an','-t','5','-frames:v','300','-c:v','libx264','-preset','ultrafast','-crf','15','-threads','3','-pix_fmt','yuv420p','-r','60','-fps_mode','cfr','-video_track_timescale','15360','-movflags','+faststart',file],'desktop film');
 add({id:'desktop-film',path:relative(file),kind:'video',route:'film',duration:5,width:1080,height:1920,fps:60,sourceStart:62,sourceEnd:67,fit:'contain'});
}
function plan(){
 const old=JSON.parse(fs.readFileSync(path.join(ROOT,'review-artifacts/showcase/capture-manifest.json')));
 for(const id of ['opening-reveal','opening','closing-reveal','closing']){const c=old.clips.find(c=>c.id===id);if(!c)throw Error('Original title card missing '+id);add(c);}
 const s=(id,duration,extra={})=>({id,duration,...extra});const c=(id,duration,extra={})=>s(id,duration,{fadeIn:0,fadeOut:0,...extra});
 const segments=[s('opening-reveal',2,{fadeOut:0}),s('opening',1.5,{fadeIn:0}),s('desktop-welcome-arrive',1.2,{fadeOut:0}),s('desktop-welcome',1.8,{fadeIn:0}),s('desktop-room',6,{fadeOut:0}),c('desktop-room-hover',1.5),s('desktop-book-cover',2,{fadeOut:0}),c('desktop-book-opening',1.2)];
 const durations=[2.8,2,2.6,1.2,2.6];for(let n=1;n<=5;n++){segments.push(s('desktop-book-'+n,durations[n-1],{chapter:n,fadeIn:0,fadeOut:n===5?.2:0}));if(n<5)segments.push(c('desktop-book-turn-'+n,.9,{chapter:n}));}
 segments.push(s('desktop-letters',2),s('desktop-letter-birthday',2.5),s('desktop-letter-mls',1.5),s('desktop-portrait',3.5),s('desktop-film',5),s('desktop-cake-lit',1.5,{fadeOut:0}),c('desktop-cake-blow',3.2),s('desktop-cake-out',1.3,{fadeIn:0}),s('desktop-wishes',2),s('desktop-notes',2),s('closing-reveal',2,{fadeOut:0}),s('closing',1.5,{fadeIn:0,fadeOut:.65}));
 const duration=segments.reduce((sum,s)=>sum+s.duration,0);if(Math.abs(duration-60)>.001)throw Error('Desktop timeline is '+duration);
 const p={reel:{musicStart:32.183,musicVolume:.9,audioFadeIn:.3,audioFadeOut:1.3,transitionDuration:.18,segments}};fs.writeFileSync(path.join(OUT,'edit-plan.json'),JSON.stringify(p,null,2)+'\n');
}
async function main(){
 let running=false;try{running=(await fetch(URL,{signal:AbortSignal.timeout(2000)})).ok;}catch{}
 if(!running){server=spawn(process.execPath,[path.join(ROOT,'node_modules/vite/bin/vite.js'),'--host','127.0.0.1','--port',new globalThis.URL(URL).port||'5180','--strictPort'],{cwd:ROOT,windowsHide:true,stdio:'ignore'});for(let i=0;i<30;i++){await new Promise(r=>setTimeout(r,500));try{if((await fetch(URL)).ok){running=true;break;}}catch{}}if(!running)throw Error('Local Vite server unavailable.');}
 if(!args.includes('--edit-only')){browser=await chromium.launch({executablePath:flag('browser',process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'),headless:true,args:['--hide-scrollbars','--autoplay-policy=no-user-gesture-required']});await capture();await film();}
 plan();
 if(args.includes('--capture-only'))return;
 const exportDir=path.join(OUT,'export');const bins=['--ffmpeg',FF,'--ffprobe',FP];
 await tool('edit.cjs',['--timeline','reel','--manifest',relative(mp),'--plan',relative(path.join(OUT,'edit-plan.json')),'--output',relative(exportDir),'--threads','3',...bins]);
 await tool('verify.cjs',['--timeline','reel','--output',relative(exportDir),'--artifacts',relative(path.join(OUT,'verification')),...bins]);
 fs.writeFileSync(path.join(OUT,'exports-ready.json'),JSON.stringify({completedAt:new Date().toISOString()})+'\n');
 await tool('playback-qa.cjs',['--url',URL,'--reel-only','--output',relative(exportDir),'--artifacts',relative(path.join(OUT,'verification')),'--ready-marker',relative(path.join(OUT,'exports-ready.json')),'--wait-seconds','30']);
 for(const item of previous)if(digest(path.join(ROOT,'video-output',item.name))!==item.hash)throw Error('Previous export changed: '+item.name);
 const target=path.join(ROOT,'video-output',FINAL);fs.copyFileSync(path.join(exportDir,'Oma_Chapter_Twenty_60s_1080p.mp4'),target);
 fs.copyFileSync(path.join(exportDir,'reel-edit-report.json'),path.join(ROOT,'video-output','desktop-style-edit-report.json'));
 manifest.finished={file:relative(target),bytes:fs.statSync(target).size,sha256:digest(target),previousOutputsUnchanged:true};save();
 console.log('NEW DESKTOP-STYLE PORTRAIT VIDEO READY: '+relative(target));
}
main().catch(error=>{console.error(error.stack||error);save();process.exitCode=1;}).finally(async()=>{await browser?.close();server?.kill();});
