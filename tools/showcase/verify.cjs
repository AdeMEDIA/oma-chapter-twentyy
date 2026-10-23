#!/usr/bin/env node
/* Decode and inspect BOTH final exports. Requires FFmpeg and FFprobe. */
const fs = require('node:fs');
const path = require('node:path');
const { spawn, spawnSync } = require('node:child_process');
const ROOT = path.resolve(__dirname, '../..');
const args = process.argv.slice(2);
function flag(name, fallback) { const index = args.indexOf(`--${name}`); return index < 0 ? fallback : args[index + 1]; }
function binary(kind, explicit) {
  const filename = process.platform === 'win32' ? `${kind}.exe` : kind;
  for (const candidate of [explicit, process.env[kind.toUpperCase()], path.join(ROOT, 'review-artifacts/showcase/ffmpeg', filename), path.join(ROOT, 'review-artifacts/showcase/ffmpeg/bin', filename)].filter(Boolean)) {
    if (fs.existsSync(candidate)) return path.resolve(candidate);
  }
  if (spawnSync(kind, ['-version'], { windowsHide: true }).status === 0) return kind;
  throw new Error(`${kind} unavailable; pass --${kind} <path>.`);
}
const ffmpeg = binary('ffmpeg', flag('ffmpeg'));
const ffprobe = binary('ffprobe', flag('ffprobe', path.join(path.dirname(ffmpeg), process.platform === 'win32' ? 'ffprobe.exe' : 'ffprobe')));
const outputDirectory = path.resolve(ROOT, flag('output', 'video-output'));
const artifactDirectory = path.resolve(ROOT, flag('artifacts', 'review-artifacts/showcase/verification'));
fs.mkdirSync(artifactDirectory, { recursive: true });

function run(parameters, label) {
  return new Promise((resolve, reject) => {
    const child = spawn(ffmpeg, parameters, { cwd: ROOT, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    let diagnostic = '';
    child.stdout.on('data', chunk => { diagnostic += chunk; });
    child.stderr.on('data', chunk => { diagnostic += chunk; });
    child.on('error', reject);
    child.on('exit', code => code === 0 ? resolve(diagnostic) : reject(new Error(`${label} failed (${code}):\n${diagnostic.slice(-12000)}`)));
  });
}
function probe(file) {
  const result = spawnSync(ffprobe, ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', file], { windowsHide: true, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(result.stderr || `Cannot inspect ${file}.`);
  return JSON.parse(result.stdout);
}
function ratio(value) { const [a, b] = String(value).split('/').map(Number); return b ? a / b : Number(a); }
function near(actual, expected, tolerance) { return Math.abs(actual - expected) <= tolerance; }

async function verify(name, filename, expectedDuration) {
  const file = path.join(outputDirectory, filename);
  if (!fs.existsSync(file)) throw new Error(`Missing export: ${file}`);
  const metadata = probe(file);
  const video = metadata.streams.find(stream => stream.codec_type === 'video');
  const audio = metadata.streams.find(stream => stream.codec_type === 'audio');
  const checks = [];
  const add = (label, passed, actual) => checks.push({ label, passed: Boolean(passed), actual });
  add('Exact portrait Full HD', video?.width === 1080 && video?.height === 1920, `${video?.width}×${video?.height}`);
  add('H.264 video', video?.codec_name === 'h264', video?.codec_name);
  add('60 FPS constant timing', near(ratio(video?.r_frame_rate), 60, 0.001) && near(ratio(video?.avg_frame_rate), 60, 0.001), { rate: video?.r_frame_rate, average: video?.avg_frame_rate });
  add('Widely compatible pixel format', video?.pix_fmt === 'yuv420p', video?.pix_fmt);
  add('Square pixels', !video?.sample_aspect_ratio || video.sample_aspect_ratio === '1:1', video?.sample_aspect_ratio);
  add('BT.709 color metadata', video?.color_space === 'bt709' && video?.color_transfer === 'bt709' && video?.color_primaries === 'bt709', { space: video?.color_space, transfer: video?.color_transfer, primaries: video?.color_primaries });
  add('AAC stereo soundtrack', audio?.codec_name === 'aac' && audio?.channels === 2 && Number(audio?.sample_rate) === 48000, { codec: audio?.codec_name, channels: audio?.channels, sampleRate: audio?.sample_rate });
  add('Exactly one video and one audio stream', metadata.streams.length === 2 && Boolean(video && audio), metadata.streams.length);
  const duration = Number(metadata.format.duration);
  add(name === 'reel' ? 'Exactly 60 seconds' : 'Two-to-three-minute complete edit', expectedDuration ? near(duration, expectedDuration, 0.035) : duration >= 120 && duration <= 180.035, duration);
  if (name === 'reel') add('Exactly 3,600 video frames', Number(video.nb_frames) === 3600, video.nb_frames);
  const start = Number(video?.start_time || 0);
  const audioStart = Number(audio?.start_time || 0);
  add('Audio/video start alignment', near(start, audioStart, 0.05), { video: start, audio: audioStart });
  const atomHeader=fs.openSync(file,'r');
  let atomOffset=0,moovOffset=-1,mdatOffset=-1;
  const atomBuffer=Buffer.alloc(16);
  while(atomOffset+8<fs.statSync(file).size){
    fs.readSync(atomHeader,atomBuffer,0,16,atomOffset);
    let atomSize=atomBuffer.readUInt32BE(0);const atomType=atomBuffer.toString('ascii',4,8);
    if(atomSize===1)atomSize=Number(atomBuffer.readBigUInt64BE(8));
    if(atomType==='moov')moovOffset=atomOffset;if(atomType==='mdat')mdatOffset=atomOffset;
    if(!atomSize||atomSize<8)break;atomOffset+=atomSize;
  }
  fs.closeSync(atomHeader);
  add('Fast-start MP4 for progressive mobile loading',moovOffset>=0&&mdatOffset>=0&&moovOffset<mdatOffset,{moovOffset,mdatOffset});
  console.log(`[${name}] Decoding the entire ${duration.toFixed(3)}-second export and detecting blank/silent intervals…`);
  // One complete decode verifies the bitstream AND samples every frame/audio packet.
  const diagnostic = await run([
    '-hide_banner', '-xerror', '-err_detect', 'explode', '-i', file,
    '-map', '0:v:0', '-map', '0:a:0',
    '-vf', 'blackdetect=d=1.2:pix_th=0.025:pic_th=0.985',
    '-af', 'silencedetect=n=-48dB:d=1.5,volumedetect', '-f', 'null', '-',
  ], `${name} complete decode`);
  fs.writeFileSync(path.join(artifactDirectory, `${name}-decode.log`), diagnostic);
  add('Complete decode without corrupt packets', true, 'All frames and audio decoded with -xerror -err_detect explode.');
  const black = [...diagnostic.matchAll(/black_start:([\d.]+) black_end:([\d.]+) black_duration:([\d.]+)/g)].map(match => ({ start: Number(match[1]), end: Number(match[2]), duration: Number(match[3]) }));
  const silence = [...diagnostic.matchAll(/silence_start: ([\d.]+)[\s\S]*?silence_end: ([\d.]+) \| silence_duration: ([\d.]+)/g)].map(match => ({ start: Number(match[1]), end: Number(match[2]), duration: Number(match[3]) }));
  const interiorBlack = black.filter(interval => interval.start > 1.1 && interval.end < duration - 1.1);
  const interiorSilence = silence.filter(interval => interval.start > 1 && interval.end < duration - 2.5);
  add('No interior blank/black scenes', interiorBlack.length === 0, interiorBlack);
  add('No unexpected interior audio silence', interiorSilence.length === 0, interiorSilence);
  const meanVolume = diagnostic.match(/mean_volume: ([\d.-]+) dB/);
  const maxVolume = diagnostic.match(/max_volume: ([\d.-]+) dB/);
  add('Audible, non-clipped soundtrack', Boolean(meanVolume && Number(meanVolume[1]) > -40 && maxVolume && Number(maxVolume[1]) <= 0), { meanDb: meanVolume ? Number(meanVolume[1]) : null, maxDb: maxVolume ? Number(maxVolume[1]) : null });
  const reportPath = path.join(outputDirectory, `${name}-edit-report.json`);
  let edit = null;
  if (fs.existsSync(reportPath)) {
    edit = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    add('Timeline duration matches encoded export', near(duration, edit.duration, 0.035), { encoded: duration, timeline: edit.duration });
    if (name === 'full') {
      const manifestPath = path.resolve(ROOT, flag('manifest', 'review-artifacts/showcase/capture-manifest.json'));
      const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : { clips: [] };
      const captures = new Map(manifest.clips.map(clip => [clip.id, clip]));
      const chapterIds = new Set();
      for (const segment of edit.segments) {
        const capture = captures.get(segment.id) || {};
        for (const candidate of [segment.chapter, capture.chapter, ...(segment.chapters || []), ...(capture.chapters || [])]) {
          const chapter = Number(candidate);
          if (chapter >= 1 && chapter <= 5) chapterIds.add(chapter);
        }
        const match = `${segment.id} ${segment.label || ''}`.match(/(?:chapter|scrapbook)[-_\s]*(\d)(?:\D|$)/i);
        if (match) chapterIds.add(Number(match[1]));
      }
      add('All five scrapbook chapters in timeline', [1, 2, 3, 4, 5].every(chapter => chapterIds.has(chapter)), [...chapterIds].sort());
      const usedIds=new Set(edit.segments.map(segment=>segment.id));
      add('All ten scrapbook leaves are included',Array.from({length:10},(_,i)=>`book-leaf-${i+1}`).every(id=>usedIds.has(id)),[...usedIds].filter(id=>/^book-leaf-/.test(id)));
      add('All four personal letters are included',[1,2,3,4].every(number=>usedIds.has(`letter-${number}-start`)&&usedIds.has(`letter-${number}-end`)),[1,2,3,4]);
      const usedRoutes=new Set(edit.segments.map(segment=>captures.get(segment.id)?.route).filter(Boolean));
      add('Every major website section is represented',['room','scrapbook','letters','portrait','film','cake','wishes','notes'].every(route=>usedRoutes.has(route)),[...usedRoutes]);
      add('No runtime or missing-asset errors during capture',!(manifest.runtimeErrors?.length||manifest.assetErrors?.length),{runtimeErrors:manifest.runtimeErrors||[],assetErrors:manifest.assetErrors||[]});
    }
  }
  const interval = duration / 20;
  const contactSheet = path.join(artifactDirectory, `${name}-contact-sheet.jpg`);
  await run([
    '-hide_banner', '-loglevel', 'error', '-y', '-i', file,
    '-vf', `select='gte(t,${(interval / 2).toFixed(6)}+selected_n*${interval.toFixed(6)})',scale=216:384:flags=lanczos,tile=5x4:padding=8:margin=8:color=0x35131c`,
    '-frames:v', '1', '-q:v', '2', contactSheet,
  ], `${name} visual contact sheet`);
  add('Visual review contact sheet generated', fs.existsSync(contactSheet), path.relative(ROOT, contactSheet).replaceAll('\\', '/'));
  const report = { name, output: path.relative(ROOT, file).replaceAll('\\', '/'), verifiedAt: new Date().toISOString(), duration, bytes: fs.statSync(file).size, checks, passed: checks.every(check => check.passed), blackIntervals: black, silenceIntervals: silence, metadata };
  fs.writeFileSync(path.join(artifactDirectory, `${name}-verification.json`), JSON.stringify(report, null, 2) + '\n');
  console.log(`[${name}] ${checks.filter(check => check.passed).length}/${checks.length} checks passed`);
  return report;
}

async function main() {
  const selected = flag('timeline', 'all');
  if (!['all', 'full', 'reel'].includes(selected)) throw new Error('--timeline must be all, full or reel.');
  const reports = [];
  if (selected === 'all' || selected === 'full') reports.push(await verify('full', 'Oma_Chapter_Twenty_Full_1080p.mp4'));
  if (selected === 'all' || selected === 'reel') reports.push(await verify('reel', 'Oma_Chapter_Twenty_60s_1080p.mp4', 60));
  const summary = { passed: reports.every(report => report.passed), exports: reports.map(({ name, output, duration, bytes, checks, passed }) => ({ name, output, duration, bytes, checks: checks.length, failed: checks.filter(check => !check.passed), passed })) };
  fs.writeFileSync(path.join(artifactDirectory, 'verification-summary.json'), JSON.stringify(summary, null, 2) + '\n');
  console.log(JSON.stringify(summary, null, 2));
  if (!summary.passed) process.exitCode = 1;
}
main().catch(error => { console.error(error.stack || error.message); process.exitCode = 1; });
