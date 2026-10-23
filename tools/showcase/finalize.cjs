#!/usr/bin/env node
// Normalize explicit Rec.709 H.264/MP4 color tags without re-encoding pixels or
// audio. This also stamps a fresh readiness marker for native playback QA.
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {spawn,spawnSync}=require('node:child_process');
const ROOT=path.resolve(__dirname,'../..');
const args=process.argv.slice(2);
const flag=(name,fallback)=>args.includes('--'+name)?args[args.indexOf('--'+name)+1]:fallback;
const ffmpeg=path.resolve(ROOT,flag('ffmpeg',process.env.FFMPEG||'review-artifacts/showcase/tools/gyan/ffmpeg-9.0.2-essentials_build/bin/ffmpeg.exe'));
const ffprobe=path.resolve(ROOT,flag('ffprobe',process.env.FFPROBE||path.join(path.dirname(ffmpeg),'ffprobe.exe')));
const selected=flag('timeline','all');
const directory=path.join(ROOT,'video-output');
const outputNames={full:'Oma_Chapter_Twenty_Full_1080p.mp4',reel:'Oma_Chapter_Twenty_60s_1080p.mp4'};
function probe(file){const result=spawnSync(ffprobe,['-v','error','-show_streams','-show_format','-of','json',file],{encoding:'utf8',windowsHide:true});if(result.status!==0)throw Error(result.stderr);return JSON.parse(result.stdout);}
function run(parameters){return new Promise((resolve,reject)=>{const child=spawn(ffmpeg,parameters,{windowsHide:true,stdio:['ignore','ignore','pipe']});let log='';child.stderr.on('data',c=>log+=c);child.on('error',reject);child.on('exit',code=>{if(code===0)resolve();else reject(Error(log));});});}
async function main(){
 const targets=selected==='all'?['full','reel']:[selected];
 for(const name of targets){
  if(!outputNames[name])throw Error('Unknown timeline '+name);
  const file=path.join(directory,outputNames[name]);if(!fs.existsSync(file))throw Error('Missing final export '+file);
  const metadata=probe(file);const video=metadata.streams.find(s=>s.codec_type==='video');
  if(video.color_primaries!=='bt709'||video.color_transfer!=='bt709'||video.color_space!=='bt709'){
   const temp=path.join(ROOT,'review-artifacts/showcase',name+'-color-finalized.mp4');
   console.log('Finalizing Rec.709 tags: '+name+' (stream copy, no quality loss)');
   await run(['-hide_banner','-loglevel','warning','-y','-i',file,'-map','0','-c','copy','-bsf:v','h264_metadata=colour_primaries=1:transfer_characteristics=1:matrix_coefficients=1:video_full_range_flag=0','-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709','-color_range','tv','-movflags','+faststart+write_colr',temp]);
   const after=probe(temp);const v=after.streams.find(s=>s.codec_type==='video');
   if(v.color_primaries!=='bt709'||v.color_transfer!=='bt709'||v.color_space!=='bt709'||Math.abs(Number(metadata.format.duration)-Number(after.format.duration))>.001)throw Error('Color finalization verification failed.');
   fs.copyFileSync(temp,file);
  }
  const reportPath=path.join(directory,name+'-edit-report.json');
  const report=JSON.parse(fs.readFileSync(reportPath));report.bytes=fs.statSync(file).size;report.explicitBT709Tags=true;
  fs.writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');
 }
 const full=path.join(directory,outputNames.full),alias=path.join(directory,'Oma_Chapter_Twenty_Portrait_1080p.mp4');
 if(fs.existsSync(full)){if(fs.existsSync(alias))fs.unlinkSync(alias);fs.linkSync(full,alias);}
 if(Object.values(outputNames).every(name=>fs.existsSync(path.join(directory,name)))){
  const files=Object.values(outputNames).map(name=>{const file=path.join(directory,name);return{name,bytes:fs.statSync(file).size,sha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')};});
  fs.writeFileSync(path.join(ROOT,'review-artifacts/showcase/exports-ready.json'),JSON.stringify({completedAt:new Date().toISOString(),files},null,2)+'\n');
 }
 console.log('Finalized color metadata and original-name alias.');
}
main().catch(error=>{console.error(error.stack||error);process.exitCode=1;});
