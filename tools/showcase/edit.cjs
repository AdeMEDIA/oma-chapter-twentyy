#!/usr/bin/env node
/*
 * Local-only portrait showcase editor. No website source files are changed.
 *
 * node tools/showcase/edit.cjs --timeline all --ffmpeg /path/to/ffmpeg
 *
 * Capture manifest: { clips: [{ id, path, duration, kind? }] }
 * Edit plan: {
 *   full: { musicStart: 0, segments: [{ id, start: 0, duration: 7 }] },
 *   reel: { musicStart: 30, segments: [...] }
 * }
 * Segment durations are FINAL contributions, so the reel must sum to 60.
 * Optional per-segment fadeIn/fadeOut, holdEnd, label and still-image motion
 * ('push' or 'pull', with motionAmount up to 0.015) are supported.
 * --smoke-test permits a 2–10-second test and writes to review-artifacts.
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawn, spawnSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '../..');
const args = process.argv.slice(2);
function flag(name, fallback) {
  const index = args.indexOf(`--${name}`);
  return index < 0 ? fallback : args[index + 1];
}
const selected = flag('timeline', 'all');
const manifestPath = path.resolve(ROOT, flag('manifest', 'review-artifacts/showcase/capture-manifest.json'));
const planPath = path.resolve(ROOT, flag('plan', 'review-artifacts/showcase/edit-plan.json'));
const smokeTest = args.includes('--smoke-test');
const outputDirectory = path.resolve(ROOT, flag('output', smokeTest ? 'review-artifacts/showcase/smoke-output' : 'video-output'));
const cacheDirectory = path.resolve(ROOT, 'review-artifacts/showcase/edit-cache');
const WIDTH = 1080;
const HEIGHT = 1920;
const FPS = 60;
const PRESET = flag('preset', 'veryfast');
const THREADS = flag('threads', '4');
const CRF = flag('crf', '18');
const FADE_COLOR = '0x35131c';
const FILENAMES = {
  full: 'Oma_Chapter_Twenty_Full_1080p.mp4',
  reel: 'Oma_Chapter_Twenty_60s_1080p.mp4',
};

function findBinary(kind, explicit) {
  const executable = process.platform === 'win32' ? `${kind}.exe` : kind;
  const candidates = [
    explicit,
    process.env[kind.toUpperCase()],
    path.resolve(ROOT, 'review-artifacts/showcase/ffmpeg', executable),
    path.resolve(ROOT, 'review-artifacts/showcase/ffmpeg/bin', executable),
  ].filter(Boolean);
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return path.resolve(candidate);
  }
  const probe = spawnSync(kind, ['-version'], { encoding: 'utf8', windowsHide: true });
  if (probe.status === 0) return kind;
  throw new Error(`${kind} is unavailable. Pass --${kind} <executable> or set ${kind.toUpperCase()}.`);
}

const ffmpeg = findBinary('ffmpeg', flag('ffmpeg'));
const ffprobe = findBinary('ffprobe', flag('ffprobe', path.join(path.dirname(ffmpeg), process.platform === 'win32' ? 'ffprobe.exe' : 'ffprobe')));
const ffmpegHelp = spawnSync(ffmpeg, ['-hide_banner', '-h', 'full'], {
  encoding: 'utf8', windowsHide: true, maxBuffer: 12 * 1024 * 1024,
});
const constantFrameRateOption = `${ffmpegHelp.stdout || ''}${ffmpegHelp.stderr || ''}`.includes('-fps_mode')
  ? ['-fps_mode', 'cfr'] : ['-vsync', 'cfr'];

function run(binary, parameters, label) {
  return new Promise((resolve, reject) => {
    const child = spawn(binary, parameters, { cwd: ROOT, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    let diagnostic = '';
    child.stdout.on('data', chunk => { diagnostic += chunk; });
    child.stderr.on('data', chunk => { diagnostic += chunk; });
    child.on('error', reject);
    child.on('exit', code => {
      if (code === 0) resolve(diagnostic);
      else reject(new Error(`${label} failed (${code}):\n${diagnostic.slice(-14000)}`));
    });
  });
}

function probe(file) {
  const result = spawnSync(ffprobe, ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', file], {
    cwd: ROOT, windowsHide: true, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024,
  });
  if (result.status !== 0) throw new Error(`Cannot inspect ${file}: ${result.stderr || result.error}`);
  return JSON.parse(result.stdout);
}

function seconds(value) { return Number(value).toFixed(6); }
function frameRound(value) { return Math.round(value * FPS) / FPS; }
function readJson(file) {
  if (!fs.existsSync(file)) throw new Error(`Missing required input: ${file}`);
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}
function absoluteMedia(file) { return path.isAbsolute(file) ? file : path.resolve(ROOT, file); }
function concatEscape(file) { return file.replaceAll('\\', '/').replaceAll("'", "'\\''"); }

async function editTimeline(name, timeline, clips) {
  if (!timeline || !Array.isArray(timeline.segments) || !timeline.segments.length) {
    throw new Error(`The edit plan has no ${name}.segments.`);
  }
  const segments = timeline.segments.map((segment, index) => {
    const capture = clips.get(segment.id);
    if (!capture) throw new Error(`Unknown clip ID "${segment.id}" in ${name} segment ${index + 1}.`);
    const file = absoluteMedia(capture.path);
    if (!fs.existsSync(file)) throw new Error(`Source clip not found: ${file}`);
    const duration = frameRound(Number(segment.duration));
    const start = frameRound(Number(segment.start || 0));
    if (!(duration > 0) || start < 0) throw new Error(`Invalid duration/start in ${name}/${segment.id}.`);
    const isStill = /\.(png|jpe?g|webp)$/i.test(file);
    if (segment.motion && !['push', 'pull'].includes(segment.motion)) throw new Error(`Unknown motion "${segment.motion}" in ${name}/${segment.id}.`);
    if (segment.motion && !isStill) throw new Error(`Motion is supported for still captures only: ${name}/${segment.id}.`);
    if (segment.motionAmount != null && !(Number(segment.motionAmount) > 0 && Number(segment.motionAmount) <= 0.015)) {
      throw new Error(`motionAmount must be greater than 0 and no more than 0.015 in ${name}/${segment.id}.`);
    }
    const metadata = isStill ? null : probe(file);
    const video = metadata?.streams.find(stream => stream.codec_type === 'video');
    const sourceDuration = Number(video?.duration || metadata?.format.duration || capture.duration || 0);
    if (!isStill && sourceDuration + 0.075 < start + duration && !segment.holdEnd) {
      throw new Error(`${segment.id} is ${sourceDuration.toFixed(3)} s, but ${name} requests ${start + duration} s. Capture more footage or explicitly set holdEnd.`);
    }
    const first = index === 0;
    const last = index === timeline.segments.length - 1;
    const defaultFade = timeline.transitionDuration ?? 0.20;
    const fadeIn = Math.min(Number(segment.fadeIn ?? (first ? 0.7 : defaultFade)), duration / 3);
    const fadeOut = Math.min(Number(segment.fadeOut ?? (last ? 0.9 : defaultFade)), duration / 3);
    return { ...segment, file, duration, start, fadeIn, fadeOut, isStill, sourceDuration };
  });
  const duration = frameRound(segments.reduce((total, segment) => total + segment.duration, 0));
  if (smokeTest && (duration < 2 || duration > 10)) throw new Error('A smoke test must total 2–10 seconds.');
  if (!smokeTest && name === 'reel' && Math.abs(duration - 60) > 1 / FPS / 2) {
    throw new Error(`The independent reel edit is ${duration.toFixed(6)} s; it must total exactly 60 s.`);
  }
  if (!smokeTest && name === 'full' && (duration < 120 || duration > 180)) {
    throw new Error(`The full edit is ${duration} s; expected 120–180 s.`);
  }
  const soundtrack = absoluteMedia(timeline.audio || 'public/audio/orente.mp3');
  if (!fs.existsSync(soundtrack)) throw new Error(`Soundtrack not found: ${soundtrack}`);
  const cache = path.join(cacheDirectory, name);
  fs.mkdirSync(cache, { recursive: true });
  const encoded = [];
  for (const [index, segment] of segments.entries()) {
    const stat = fs.statSync(segment.file);
    const signature = crypto.createHash('sha256').update(JSON.stringify({
      version: 3, segment, input: [stat.size, stat.mtimeMs], preset: PRESET, crf: CRF, width: WIDTH, height: HEIGHT, fps: FPS,
    })).digest('hex').slice(0, 16);
    const file = path.join(cache, `${String(index + 1).padStart(2, '0')}-${segment.id.replace(/[^a-zA-Z0-9_-]/g, '-')}-${signature}.mp4`);
    if (fs.existsSync(file) && fs.statSync(file).size > 1000) {
      console.log(`[${name} ${index + 1}/${segments.length}] Cached: ${segment.label || segment.id}`);
    } else {
      console.log(`[${name} ${index + 1}/${segments.length}] Rendering ${segment.label || segment.id} (${segment.duration.toFixed(2)} s)`);
      const input = segment.isStill ? ['-loop', '1', '-framerate', '1', '-i', segment.file]
        : ['-ss', seconds(segment.start), '-i', segment.file];
      const filters = [
        `scale=${WIDTH}:${HEIGHT}:flags=lanczos:force_original_aspect_ratio=decrease:out_color_matrix=bt709:out_range=tv`,
        `pad=${WIDTH}:${HEIGHT}:(ow-iw)/2:(oh-ih)/2:color=${FADE_COLOR}`,
        'setsar=1',
      ];
      if (segment.motion) {
        const amount = Number(segment.motionAmount ?? 0.012);
        const frames = Math.round(segment.duration * FPS);
        const progress = `min(on/${Math.max(1, frames - 1)},1)`;
        const zoom = segment.motion === 'push' ? `1+${amount}*${progress}` : `1+${amount}*(1-${progress})`;
        // Supersampling avoids the visible one-pixel stepping of a slow native-size zoom.
        // The maximum 1.5% center crop consumes at most 8 px per side at 1080p.
        filters.push(`scale=${WIDTH * 2}:${HEIGHT * 2}:flags=lanczos`, 'format=yuv444p');
        filters.push(`zoompan=z='${zoom}':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d=${frames}:s=${WIDTH}x${HEIGHT}:fps=${FPS}`);
      }
      filters.push(`fps=${FPS}`, 'format=yuv420p', 'setpts=PTS-STARTPTS');
      if (segment.holdEnd) filters.push(`tpad=stop_mode=clone:stop_duration=${seconds(segment.duration)}`);
      if (segment.fadeIn > 0) filters.push(`fade=t=in:st=0:d=${seconds(segment.fadeIn)}:color=${FADE_COLOR}`);
      if (segment.fadeOut > 0) filters.push(`fade=t=out:st=${seconds(segment.duration - segment.fadeOut)}:d=${seconds(segment.fadeOut)}:color=${FADE_COLOR}`);
      const output = `${file}.partial.mp4`;
      await run(ffmpeg, [
        '-hide_banner', '-loglevel', 'warning', '-y', ...input,
        '-t', seconds(segment.duration), '-an', '-vf', filters.join(','),
        '-c:v', 'libx264', '-preset', PRESET, '-crf', CRF, '-threads', THREADS,
        '-profile:v', 'high', '-level:v', '4.2', '-pix_fmt', 'yuv420p',
        '-r', String(FPS), ...constantFrameRateOption, '-g', '120', '-keyint_min', '60',
        '-maxrate', '24M', '-bufsize', '48M', '-video_track_timescale', '15360',
        '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-color_range', 'tv',
        '-movflags', '+faststart', output,
      ], `${name}/${segment.id}`);
      fs.renameSync(output, file);
    }
    encoded.push(file);
  }
  const concatList = path.join(cache, 'concat.txt');
  fs.writeFileSync(concatList, encoded.map(file => `file '${concatEscape(file)}'`).join('\n') + '\n');
  const output = path.join(outputDirectory, FILENAMES[name]);
  const temporary = path.join(cache, 'complete.partial.mp4');
  const musicStart = Number(timeline.musicStart || 0);
  const audioFilters = [
    'aresample=48000', `volume=${Number(timeline.musicVolume ?? 0.88)}`,
    `afade=t=in:st=0:d=${seconds(timeline.audioFadeIn ?? 0.55)}`,
    `afade=t=out:st=${seconds(duration - (timeline.audioFadeOut ?? 2.0))}:d=${seconds(timeline.audioFadeOut ?? 2.0)}`,
    'alimiter=limit=0.95:level=false',
  ].join(',');
  console.log(`[${name}] Assembling ${duration.toFixed(3)} s with one Orente soundtrack`);
  await run(ffmpeg, [
    '-hide_banner', '-loglevel', 'warning', '-y',
    '-f', 'concat', '-safe', '0', '-i', concatList,
    '-stream_loop', '-1', '-ss', seconds(musicStart), '-i', soundtrack,
    '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy',
    '-bsf:v', 'h264_metadata=colour_primaries=1:transfer_characteristics=1:matrix_coefficients=1:video_full_range_flag=0',
    '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-color_range', 'tv',
    '-af', audioFilters, '-c:a', 'aac', '-b:a', '320k', '-ar', '48000', '-ac', '2',
    '-t', seconds(duration), '-movflags', '+faststart+write_colr',
    '-metadata', 'title=OMA — Chapter Twenty', '-metadata', 'artist=Ade',
    '-metadata', `comment=Locally rendered website showcase; ${name === 'reel' ? 'independent 60-second edit' : 'complete cinematic edit'}`,
    temporary,
  ], `${name} assembly`);
  fs.copyFileSync(temporary, output);
  const rendered = probe(output);
  const video = rendered.streams.find(stream => stream.codec_type === 'video');
  if (video.width !== WIDTH || video.height !== HEIGHT || Math.abs(Number(rendered.format.duration) - duration) > 0.05) {
    throw new Error(`Unexpected output dimensions/duration in ${output}.`);
  }
  return {
    timeline: name, output: path.relative(ROOT, output).replaceAll('\\', '/'), duration,
    width: WIDTH, height: HEIGHT, fps: FPS, bytes: fs.statSync(output).size,
    soundtrack: path.relative(ROOT, soundtrack).replaceAll('\\', '/'), musicStart,
    audioPolicy: 'One supplied Orente MP3 bed. Source clip audio is deliberately unmapped to prevent doubling.',
    segments: segments.map(({ file, isStill: _isStill, sourceDuration: _sourceDuration, ...segment }) => ({ ...segment, source: path.relative(ROOT, file).replaceAll('\\', '/') })),
  };
}

async function main() {
  if (!['all', 'full', 'reel'].includes(selected)) throw new Error('--timeline must be all, full or reel.');
  fs.mkdirSync(outputDirectory, { recursive: true });
  fs.mkdirSync(cacheDirectory, { recursive: true });
  const manifest = readJson(manifestPath);
  const plan = readJson(planPath);
  if (!Array.isArray(manifest.clips)) throw new Error('Capture manifest must have a clips array.');
  const clips = new Map(manifest.clips.map(clip => [clip.id, clip]));
  const reports = [];
  for (const name of selected === 'all' ? ['full', 'reel'] : [selected]) {
    const report = await editTimeline(name, plan[name], clips);
    reports.push(report);
    fs.writeFileSync(path.join(outputDirectory, `${name}-edit-report.json`), JSON.stringify(report, null, 2) + '\n');
  }
  // The original requested filename is a hardlink, so a third copy consumes no disk space.
  const full = path.join(outputDirectory, FILENAMES.full);
  const alias = path.join(outputDirectory, 'Oma_Chapter_Twenty_Portrait_1080p.mp4');
  if (fs.existsSync(full)) {
    if (fs.existsSync(alias)) fs.unlinkSync(alias);
    try { fs.linkSync(full, alias); }
    catch (error) { console.warn(`Optional original-name hardlink was unavailable: ${error.message}`); }
  }
  console.log(JSON.stringify({ complete: true, exports: reports.map(report => ({ output: report.output, duration: report.duration, bytes: report.bytes })) }, null, 2));
}

main().catch(error => { console.error(error.stack || error.message); process.exitCode = 1; });
