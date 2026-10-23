#!/usr/bin/env node
/* Native browser QA for the FINISHED local MP4 exports, never the live site.
 * Checks metadata, normal-speed unmuted playback, decoded PCM, representative
 * seeks, decoded image frames and the natural ended event. FFmpeg verification
 * separately decodes every packet; this is a browser playback compatibility test.
 *
 * node tools/showcase/playback-qa.cjs --url http://127.0.0.1:5180 --wait-seconds 1800
 */
const fs = require('node:fs');
const path = require('node:path');
const { setTimeout: delay } = require('node:timers/promises');
const ROOT = path.resolve(__dirname, '../..');
const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  return index < 0 ? fallback : args[index + 1];
};
const URL = flag('url', 'http://127.0.0.1:5180').replace(/\/$/, '');
if (!/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(URL)) throw Error('Browser playback QA requires the LOCAL development server.');
const PLAYWRIGHT = flag('playwright', process.env.PLAYWRIGHT_PATH || 'C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const { chromium } = require(PLAYWRIGHT);
const OUT = path.resolve(ROOT, flag('artifacts', 'review-artifacts/showcase/verification'));
const OUTPUT = path.resolve(ROOT, flag('output', 'video-output'));
const READY_MARKER = path.resolve(ROOT, flag('ready-marker', 'review-artifacts/showcase/exports-ready.json'));
const REEL_ONLY = args.includes('--reel-only');
const outputRelative = path.relative(ROOT, OUTPUT);
if (!outputRelative || outputRelative.startsWith('..') || path.isAbsolute(outputRelative)) throw Error('--output must be a directory inside the local project.');
const outputUrl = `${URL}/${outputRelative.split(path.sep).map(encodeURIComponent).join('/')}`;
const expectations = [
  { timeline: 'full', filename: 'Oma_Chapter_Twenty_Full_1080p.mp4', duration: 170 },
  { timeline: 'reel', filename: 'Oma_Chapter_Twenty_60s_1080p.mp4', duration: 60 },
].filter(item => !REEL_ONLY || item.timeline === 'reel');
const report = {
  testedAt: new Date().toISOString(), localUrl: URL,
  scope: 'Headless Microsoft Edge native MP4 playback on Windows; no physical iOS or Android device claim.',
  checks: [], videos: [], runtimeErrors: [], networkErrors: [],
};
function check(name, passed, details) {
  report.checks.push({ name, passed: Boolean(passed), details });
  console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
}
function ready() {
  // The editor may be followed by a lossless color-metadata remux. Only the
  // final delivery owner creates this marker after both finished files exist.
  if (!fs.existsSync(READY_MARKER)) return false;
  const markedAt = fs.statSync(READY_MARKER).mtimeMs;
  return expectations.every(item => {
    const file = path.join(OUTPUT, item.filename);
    const editReport = path.join(OUTPUT, `${item.timeline}-edit-report.json`);
    if (!fs.existsSync(file) || !fs.existsSync(editReport)) return false;
    try {
      const edit = JSON.parse(fs.readFileSync(editReport));
      const outputStat = fs.statSync(file);
      return edit.timeline === item.timeline && Math.abs(edit.duration - item.duration) < .001
        && edit.bytes === outputStat.size && markedAt >= outputStat.mtimeMs
        && markedAt >= fs.statSync(editReport).mtimeMs;
    } catch { return false; }
  });
}
async function waitForFinalExports() {
  const seconds = Number(flag('wait-seconds', '0'));
  const deadline = Date.now() + seconds * 1000;
  while (!ready()) {
    if (Date.now() >= deadline) throw Error(`The final ${REEL_ONLY ? 'reel MP4 and matching completed edit report are' : 'MP4s and matching completed full/reel edit reports are'} not ready. Smoke-test files are deliberately excluded.`);
    console.log(`Waiting for final exports-ready marker and matching completed ${REEL_ONLY ? 'reel edit report' : 'full/reel edit reports'}...`);
    await delay(Math.min(15000, Math.max(1, deadline - Date.now())));
  }
}
function seekSamples(edit) {
  const wanted = new Set([
    'room-interface', 'book-leaf-1', 'book-leaf-4', 'book-leaf-5', 'book-leaf-7', 'book-leaf-9',
    'letter-1-start', 'letter-2-start', 'letter-3-start', 'letter-4-start',
    'portrait', 'film-highlight', 'cake-blow', 'wishes-collection', 'closing',
    'desktop-room', 'desktop-book-1', 'desktop-book-3', 'desktop-book-5', 'desktop-portrait', 'desktop-cake-blow',
  ]);
  const points = [{ id: 'start', time: .6 }];
  let at = 0;
  for (const segment of edit.segments) {
    if (wanted.has(segment.id)) points.push({ id: segment.id, time: at + Math.min(segment.duration / 2, 1.3) });
    at += segment.duration;
  }
  points.push({ id: 'middle', time: edit.duration / 2 });
  // A fresh edit can use new scene names. Always retain an ending sample in
  // single-reel mode even when no known scene IDs are present in its report.
  if (REEL_ONLY) points.push({ id: 'end', time: Math.max(.6, edit.duration - 1.4) });
  return points.sort((a, b) => a.time - b.time);
}
async function seek(page, time) {
  return page.evaluate(async time => {
    const video = document.querySelector('video');
    video.pause();
    await new Promise((resolve, reject) => {
      if (Math.abs(video.currentTime - time) < .02 && video.readyState >= 2) return resolve();
      const timer = setTimeout(() => reject(Error('Native video seek timed out')), 25000);
      video.addEventListener('seeked', () => { clearTimeout(timer); resolve(); }, { once: true });
      video.currentTime = time;
    });
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const canvas = document.createElement('canvas');
    canvas.width = 135; canvas.height = 240;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let sum = 0, sumSquares = 0, min = 255, max = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      const value = .2126 * pixels[i] + .7152 * pixels[i + 1] + .0722 * pixels[i + 2];
      sum += value; sumSquares += value * value; min = Math.min(min, value); max = Math.max(max, value);
    }
    const count = pixels.length / 4, mean = sum / count;
    return { requestedTime: time, currentTime: video.currentTime, readyState: video.readyState, seeking: video.seeking, error: video.error?.message || null, luminance: { mean, variance: sumSquares / count - mean * mean, min, max } };
  }, time);
}
async function inspectVideo(browser, item) {
  const context = await browser.newContext({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 2, colorScheme: 'dark' });
  const page = await context.newPage();
  page.on('pageerror', error => report.runtimeErrors.push({ timeline: item.timeline, message: error.message }));
  page.on('requestfailed', request => {
    if (request.failure()?.errorText !== 'net::ERR_ABORTED') report.networkErrors.push({ timeline: item.timeline, url: request.url(), error: request.failure()?.errorText });
  });
  page.on('response', response => {
    if (response.status() >= 400) report.networkErrors.push({ timeline: item.timeline, url: response.url(), status: response.status() });
  });
  const route = `${URL}/__showcase-native-playback-qa.html`;
  await page.route(route, interception => interception.fulfill({
    contentType: 'text/html',
    body: '<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;background:#231019;overflow:hidden}video{display:block;width:100vw;height:100vh;object-fit:contain}button{position:fixed;top:0;left:0;z-index:5}</style><video controls playsinline preload="auto"></video><button id="play">Play</button>',
  }));
  await page.goto(route);
  const mediaEvents = [];
  await page.exposeFunction('recordMediaEvent', (name, currentTime) => mediaEvents.push({ name, currentTime }));
  await page.evaluate(src => {
    const video = document.querySelector('video');
    for (const name of ['loadedmetadata', 'loadeddata', 'playing', 'pause', 'seeked', 'ended', 'error']) video.addEventListener(name, () => window.recordMediaEvent(name, video.currentTime));
    video.src = src;
    video.muted = false; video.volume = 1; video.playbackRate = 1;
    document.querySelector('#play').addEventListener('click', async () => {
      window.qaAudio = new AudioContext();
      window.qaAnalyser = window.qaAudio.createAnalyser(); window.qaAnalyser.fftSize = 2048;
      window.qaSource = window.qaAudio.createMediaElementSource(video);
      window.qaSource.connect(window.qaAnalyser); window.qaAnalyser.connect(window.qaAudio.destination);
      await window.qaAudio.resume(); await video.play();
    });
  }, `${outputUrl}/${encodeURIComponent(item.filename)}`);
  await page.waitForFunction(() => document.querySelector('video').readyState >= 2 || document.querySelector('video').error, null, { timeout: 45000 });
  const metadata = await page.evaluate(() => {
    const video = document.querySelector('video');
    return { width: video.videoWidth, height: video.videoHeight, duration: video.duration, readyState: video.readyState, error: video.error?.message || null, support: video.canPlayType('video/mp4; codecs="avc1.64002A, mp4a.40.2"') };
  });
  check(`${item.timeline}: native metadata`, !metadata.error && metadata.width === 1080 && metadata.height === 1920 && Math.abs(metadata.duration - item.duration) < .05, metadata);
  await seek(page, 5);
  await page.locator('#play').click();
  const before = await page.evaluate(() => ({ time: document.querySelector('video').currentTime, wall: performance.now() }));
  const rms = [];
  for (let i = 0; i < 8; i++) {
    await delay(500);
    rms.push(await page.evaluate(() => {
      const values = new Float32Array(window.qaAnalyser.fftSize); window.qaAnalyser.getFloatTimeDomainData(values);
      let energy = 0; for (const value of values) energy += value * value;
      return Math.sqrt(energy / values.length);
    }));
  }
  const playback = await page.evaluate(() => {
    const video = document.querySelector('video');
    return { time: video.currentTime, wall: performance.now(), muted: video.muted, volume: video.volume, playbackRate: video.playbackRate, paused: video.paused, error: video.error?.message || null, decodedAudioBytes: video.webkitAudioDecodedByteCount || null, audioContextState: window.qaAudio.state };
  });
  playback.mediaSeconds = playback.time - before.time;
  playback.wallSeconds = (playback.wall - before.wall) / 1000;
  playback.rms = rms;
  check(`${item.timeline}: normal-speed unmuted native playback`, !playback.error && !playback.paused && playback.muted === false && playback.volume === 1 && playback.playbackRate === 1 && playback.mediaSeconds >= 2.5, playback);
  check(`${item.timeline}: AAC decoded to non-silent PCM`, Math.max(...rms) > .001 && playback.audioContextState === 'running', { rms, maxRms: Math.max(...rms), decodedAudioBytes: playback.decodedAudioBytes });
  const edit = JSON.parse(fs.readFileSync(path.join(OUTPUT, `${item.timeline}-edit-report.json`)));
  const frames = [];
  for (const sample of seekSamples(edit)) {
    const frame = await seek(page, sample.time);
    frame.id = sample.id;
    check(`${item.timeline}: seek ${sample.id}`, !frame.error && !frame.seeking && frame.readyState >= 2 && Math.abs(frame.currentTime - sample.time) < .1 && frame.luminance.max > 15 && frame.luminance.variance > 1, frame);
    frames.push(frame);
    if (['book-leaf-1', 'film-highlight', 'cake-blow', 'closing', 'desktop-room', 'desktop-book-1', 'desktop-book-3', 'desktop-book-5', 'desktop-portrait', 'desktop-cake-blow', 'end'].includes(sample.id)) {
      const image = await page.evaluate(() => {
        const video = document.querySelector('video'), canvas = document.createElement('canvas');
        canvas.width = video.videoWidth; canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        return canvas.toDataURL('image/png').split(',')[1];
      });
      fs.writeFileSync(path.join(OUT, `browser-${item.timeline}-${sample.id}.png`), Buffer.from(image, 'base64'));
    }
  }
  await seek(page, item.duration - .65);
  const ended = await page.evaluate(async () => {
    const video = document.querySelector('video');
    const completion = new Promise(resolve => {
      const timer = setTimeout(() => resolve({ ended: false, time: video.currentTime, error: video.error?.message || 'Ended event timed out' }), 10000);
      video.addEventListener('ended', () => { clearTimeout(timer); resolve({ ended: video.ended, time: video.currentTime, error: video.error?.message || null }); }, { once: true });
    });
    await video.play();
    return completion;
  });
  check(`${item.timeline}: natural ended event`, ended.ended && !ended.error && Math.abs(ended.time - item.duration) < .1, ended);
  report.videos.push({ ...item, metadata, playback, frames, ended, mediaEvents });
  await context.close();
}
async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  await waitForFinalExports();
  let browser;
  try {
    browser = await chromium.launch({ executablePath: flag('browser', process.env.BROWSER_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'), headless: true, args: ['--autoplay-policy=no-user-gesture-required', '--disable-background-timer-throttling', '--hide-scrollbars'] });
    report.browserVersion = browser.version();
    for (const item of expectations) await inspectVideo(browser, item);
    check('No browser runtime errors', report.runtimeErrors.length === 0, report.runtimeErrors);
    check('No failed media requests', report.networkErrors.length === 0, report.networkErrors);
  } catch (error) {
    check('Browser playback workflow completed', false, error.stack);
  } finally {
    if (browser) await browser.close();
    report.completedAt = new Date().toISOString();
    report.total = report.checks.length;
    report.failed = report.checks.filter(item => !item.passed).length;
    fs.writeFileSync(path.join(OUT, 'browser-playback.json'), JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify({ total: report.total, failed: report.failed, report: path.relative(ROOT, path.join(OUT, 'browser-playback.json')) }));
    if (report.failed) process.exitCode = 1;
  }
}
main().catch(error => { console.error(error.stack); process.exitCode = 1; });
