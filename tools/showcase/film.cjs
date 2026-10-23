#!/usr/bin/env node
/* Insert an uncropped excerpt of the ORIGINAL local birthday film into the
 * actual locally captured React player shell. This never changes the app or
 * the source MP4, and writes a separate manifest entry for the capture owner.
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawn, spawnSync } = require('node:child_process');
const ROOT = path.resolve(__dirname, '../..');
const OUT = path.join(ROOT, 'review-artifacts/showcase');
const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  return index < 0 ? fallback : args[index + 1];
};
const FFMPEG = flag('ffmpeg', process.env.FFMPEG || path.join(OUT, 'tools/gyan/ffmpeg-9.0.2-essentials_build/bin/ffmpeg.exe'));
const FFPROBE = flag('ffprobe', process.env.FFPROBE || path.join(path.dirname(FFMPEG), process.platform === 'win32' ? 'ffprobe.exe' : 'ffprobe'));
const MANIFEST = path.resolve(ROOT, flag('manifest', 'review-artifacts/showcase/capture-manifest.json'));
const START = Number(flag('start', '62'));
const DURATION = Number(flag('duration', '12'));
const FPS = 60;
const relative = file => path.relative(ROOT, file).replaceAll('\\', '/');
function probe(file) {
  const child = spawnSync(FFPROBE, ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', file], { encoding: 'utf8', windowsHide: true });
  if (child.status !== 0) throw Error(child.stderr || 'ffprobe failed');
  return JSON.parse(child.stdout);
}
function run(parameters, logFile) {
  return new Promise((resolve, reject) => {
    const log = fs.createWriteStream(logFile);
    const child = spawn(FFMPEG, parameters, { cwd: ROOT, windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] });
    let diagnostic = '';
    child.stderr.on('data', chunk => { log.write(chunk); diagnostic = (diagnostic + chunk).slice(-14000); });
    child.on('error', error => { log.end(); reject(error); });
    child.on('exit', code => { log.end(); if (code === 0) resolve(); else reject(Error(`Film composition failed (${code}):\n${diagnostic}`)); });
  });
}
function roundedMask(file, width, height, radius) {
  // Static antialiased grayscale alpha mask. PGM is a standard FFmpeg-supported
  // image and avoids adding an image-processing dependency to the website.
  const pixels = Buffer.alloc(width * height);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const px = x + .5, py = y + .5;
    const cx = Math.min(width - radius, Math.max(radius, px));
    const cy = Math.min(height - radius, Math.max(radius, py));
    pixels[y * width + x] = Math.round(255 * Math.max(0, Math.min(1, radius + .5 - Math.hypot(px - cx, py - cy))));
  }
  fs.writeFileSync(file, Buffer.concat([Buffer.from(`P5\n${width} ${height}\n255\n`), pixels]));
}
async function main() {
  if (!Number.isFinite(START) || START < 0 || !Number.isFinite(DURATION) || DURATION <= 0) throw Error('Invalid excerpt start or duration.');
  if (!fs.existsSync(MANIFEST)) throw Error('Run the local capture first; capture-manifest.json is missing.');
  const manifest = JSON.parse(fs.readFileSync(MANIFEST));
  if (!manifest.film?.playerBounds) throw Error('The local capture has not reached the birthday film yet.');
  const shellEntry = manifest.clips.find(item => item.id === 'film-frame');
  const shell = path.resolve(ROOT, shellEntry?.path || 'review-artifacts/showcase/stills/film-frame.png');
  const source = path.resolve(ROOT, manifest.film.source || 'public/videos/oma-on-film.mp4');
  if (!fs.existsSync(shell) || !fs.existsSync(source)) throw Error('Film source or captured player shell is missing.');
  const sourceProbe = probe(source);
  if (START + DURATION > Number(sourceProbe.format.duration) + .01) throw Error('Excerpt extends past original film.');
  const dpr = manifest.viewport?.deviceScaleFactor || 2;
  const bounds = manifest.film.playerBounds;
  const x = Math.round(bounds.x * dpr), y = Math.round(bounds.y * dpr);
  const width = Math.round(bounds.width * dpr / 2) * 2;
  const height = Math.round(bounds.height * dpr / 2) * 2;
  if (x < 0 || y < 0 || x + width > 1080 || y + height > 1920) throw Error('Film player extends outside the captured portrait frame.');
  fs.mkdirSync(path.join(OUT, 'clips'), { recursive: true });
  const mask = path.join(OUT, 'film-player-mask.pgm');
  roundedMask(mask, width, height, 5 * dpr);
  const target = path.join(OUT, 'clips/film-highlight.mp4');
  const temp = path.join(OUT, 'clips/film-highlight.partial.mp4');
  // Pixel format/color range changes within the original MP4 must not reset
  // the overlay clock. The selected portrait montage is full-range BT470BG;
  // explicitly convert its image data to limited-range BT709 for the export.
  const graph = [
    `[0:v]setpts=PTS-STARTPTS,format=yuv420p[plate]`,
    `[1:v]setpts=PTS-STARTPTS,scale=${width}:${height}:force_original_aspect_ratio=decrease:force_divisible_by=2:in_range=full:out_range=tv:in_color_matrix=bt470bg:out_color_matrix=bt709,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=0x24151b,setsar=1,fps=${FPS},format=yuv420p[movie]`,
    `[2:v]format=gray[mask]`,
    `[movie][mask]alphamerge[rounded]`,
    `[plate][rounded]overlay=x=${x}:y=${y}:shortest=1:format=auto,format=yuv420p[out]`,
  ].join(';');
  console.log(`Composing original film ${START}–${START + DURATION}s at ${x},${y},${width}×${height}; no face crop.`);
  await run([
    '-hide_banner', '-y', '-loop', '1', '-framerate', String(FPS), '-i', shell,
    '-ss', String(START), '-reinit_filter', '0', '-i', source,
    '-loop', '1', '-framerate', String(FPS), '-i', mask,
    '-filter_complex_threads', '2', '-filter_complex', graph, '-map', '[out]',
    '-an', '-t', String(DURATION), '-frames:v', String(Math.round(DURATION * FPS)),
    '-c:v', 'libx264', '-preset', flag('preset', 'ultrafast'), '-crf', '15', '-threads', '3',
    '-pix_fmt', 'yuv420p', '-r', String(FPS), '-fps_mode', 'cfr', '-video_track_timescale', '15360',
    '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-movflags', '+faststart', temp,
  ], path.join(OUT, 'film-highlight-encode.log'));
  fs.renameSync(temp, target);
  const exported = probe(target);
  const video = exported.streams.find(item => item.codec_type === 'video');
  if (video.width !== 1080 || video.height !== 1920 || video.codec_name !== 'h264' || video.avg_frame_rate !== '60/1' || exported.streams.some(item => item.codec_type === 'audio') || Math.abs(Number(exported.format.duration) - DURATION) > 1 / FPS) throw Error('Film composition validation failed.');
  const entry = {
    id: 'film-highlight', path: relative(target), kind: 'video', duration: DURATION,
    width: 1080, height: 1920, fps: FPS, route: 'film',
    source: relative(source), sourceStart: START, sourceEnd: START + DURATION,
    sourceSha256: crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex'),
    composition: { x, y, width, height, fit: 'contain', cornerRadius: 5 * dpr, originalEmbeddedBarsPreserved: true },
    audio: 'Silent intermediate. Final editor adds one original Orente soundtrack bed.',
  };
  fs.writeFileSync(path.join(OUT, 'film-highlight-entry.json'), JSON.stringify(entry, null, 2) + '\n');
  await run([
    '-hide_banner', '-loglevel', 'error', '-i', target,
    '-vf', "select='eq(n,0)+eq(n,120)+eq(n,240)+eq(n,360)+eq(n,480)+eq(n,600)',scale=270:480,tile=3x2",
    '-frames:v', '1', '-y', path.join(OUT, 'film-highlight-contact.jpg'),
  ], path.join(OUT, 'film-highlight-contact.log'));
  console.log(`Film highlight verified: ${relative(target)}. Separate entry ready; capture manifest was not modified.`);
}
main().catch(error => { console.error(error.stack); process.exitCode = 1; });
