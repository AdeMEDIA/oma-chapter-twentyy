#!/usr/bin/env node
// One-command local capture, two independent edits and full export validation.
const fs=require('node:fs');
const path=require('node:path');
const {spawn}=require('node:child_process');
const ROOT=path.resolve(__dirname,'../..');
const argv=process.argv.slice(2);
const flag=(name,fallback)=>argv.includes('--'+name)?argv[argv.indexOf('--'+name)+1]:fallback;
const url=flag('url','http://127.0.0.1:5180');
let server;
async function run(script,args=[]){
 return new Promise((resolve,reject)=>{
   const child=spawn(process.execPath,[path.join(__dirname,script),...args],{cwd:ROOT,windowsHide:true,stdio:'inherit',env:process.env});
   child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(Error(script+' exited '+code)));
 });
}
async function available(){try{return(await fetch(url,{signal:AbortSignal.timeout(2000)})).ok;}catch{return false;}}
async function main(){
 const portable=path.join(ROOT,'review-artifacts/showcase/tools/toolchain.json');
 const installed=fs.existsSync(portable)?JSON.parse(fs.readFileSync(portable)):{};
 const ffmpeg=flag('ffmpeg',process.env.FFMPEG||installed.ffmpeg);
 const ffprobe=flag('ffprobe',process.env.FFPROBE||installed.ffprobe);
 const bins=[];if(ffmpeg)bins.push('--ffmpeg',path.resolve(ROOT,ffmpeg));if(ffprobe)bins.push('--ffprobe',path.resolve(ROOT,ffprobe));
 if(!argv.includes('--edit-only')){
   if(!await available()){
     const port=new globalThis.URL(url).port||'5180';
     server=spawn(process.execPath,[path.join(ROOT,'node_modules/vite/bin/vite.js'),'--host','127.0.0.1','--port',port,'--strictPort'],{cwd:ROOT,windowsHide:true,stdio:'inherit'});
     for(let attempt=0;attempt<40&&!await available();attempt++)await new Promise(resolve=>setTimeout(resolve,500));
     if(!await available())throw Error('Could not start the local Vite server.');
   }
   const captureArgs=['--url',url];if(ffmpeg)captureArgs.push('--ffmpeg',path.resolve(ROOT,ffmpeg));
   if(!argv.includes('--resume'))captureArgs.push('--force');
   if(flag('playwright'))captureArgs.push('--playwright',flag('playwright'));
   if(flag('browser'))captureArgs.push('--browser',flag('browser'));
   await run('capture.cjs',captureArgs);
   await run('film.cjs',bins);
 }
 // film.cjs keeps its entry separate while capture may be writing its manifest.
 const manifestPath=path.join(ROOT,'review-artifacts/showcase/capture-manifest.json');
 const manifest=JSON.parse(fs.readFileSync(manifestPath));
 const filmEntryPath=path.join(ROOT,'review-artifacts/showcase/film-highlight-entry.json');
 if(fs.existsSync(filmEntryPath)){
   const entry=JSON.parse(fs.readFileSync(filmEntryPath));
   manifest.clips=manifest.clips.filter(clip=>clip.id!==entry.id);manifest.clips.push(entry);
   fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n');
 }
 await run('plan.cjs');
 const editArgs=['--timeline',flag('timeline','all'),'--plan','tools/showcase/edit-plan.json',...bins];
 if(flag('preset'))editArgs.push('--preset',flag('preset'));
 await run('edit.cjs',editArgs);
 await run('finalize.cjs',['--timeline',flag('timeline','all'),...bins]);
 await run('verify.cjs',['--timeline',flag('timeline','all'),...bins]);
 if(flag('timeline','all')==='all'&&await available())await run('playback-qa.cjs',['--url',url,'--wait-seconds','60']);
 console.log('Both portrait exports are in video-output/. Website source and deployment have not been changed.');
}
main().catch(error=>{console.error(error.stack||error);process.exitCode=1;}).finally(()=>server?.kill());
