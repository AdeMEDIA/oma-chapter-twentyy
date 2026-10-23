# Oma — Chapter Twenty portrait showcase

This local workflow produces two **independently edited** videos from the actual React 19 / Vite 8 application. It does not access the live site, record the desktop, edit production components, or deploy anything.

## Finished files

The exports are saved in `video-output/`:

- `Oma_Chapter_Twenty_Full_1080p.mp4` — complete 170-second / 2:50 showcase.
- `Oma_Chapter_Twenty_60s_1080p.mp4` — exactly 60 seconds, with separate selections, rhythm and timing.
- `Oma_Chapter_Twenty_Portrait_1080p.mp4` — a hardlink to the full version using the original requested name; it occupies no additional video storage on this drive.

Both use 1080 × 1920, constant 60 FPS, H.264 High, YUV420P, BT.709, AAC stereo at 48 kHz / 320 kbps, and MP4 fast-start. Source interaction frames are captured at 60 Hz. The birthday-film excerpt retains its original 20 FPS cadence inside the 60 FPS export; no artificial face interpolation is used. Older low-resolution source photographs retain their original detail.

## Regenerate after website updates

### Additional desktop-style portrait reel

`video-output/Oma_Chapter_Twenty_Desktop_Style_60s_1080p.mp4` is a separate 60-second edit using the real desktop layouts inside a 1080 × 1920 portrait composition. It includes the full labelled room, all five paired scrapbook spreads and page turns, letters, the two-column portrait, film, candles, wishes and twenty-note grid. Orente remains one continuous soundtrack. The original three MP4 files are checked by SHA-256 and remain unchanged.

```powershell
# Capture, edit and verify the desktop-style version independently.
node tools/showcase/desktop-reel.cjs

# Re-edit its existing captures.
node tools/showcase/desktop-reel.cjs --edit-only
```

The script uses a 1080-pixel-wide desktop browser viewport and recording-only styling. Its captures, edit plan and verification reports are isolated in `review-artifacts/showcase-desktop/`. It fully decodes the export and checks actual local Edge playback before copying the finished video into `video-output/`. It never changes the production website or deploys it.

### Original full showcase and mobile reel

From the project root in VS Code's terminal:

```powershell
node tools/showcase/render.cjs
```

The script starts a local Vite server if needed, captures fresh scenes, composes the original film into its real player, renders both edits, and verifies them. A fresh browser context prevents saved visitor wishes or personal browser data from entering the video. Production source and deployment are untouched.

The current workstation already has Playwright, Edge, FFmpeg and FFprobe. Portable FFmpeg 9.0.2 and its verified checksum/source details are retained under `review-artifacts/showcase/tools/`. The files need to remain there, or explicit executable paths must be supplied:

```powershell
node tools/showcase/render.cjs --ffmpeg "C:/path/to/ffmpeg.exe" --ffprobe "C:/path/to/ffprobe.exe"
```

An alternate Playwright package path and Chromium/Edge executable can be provided with `--playwright` and `--browser`. `--url http://127.0.0.1:5180` selects the local server. Capture rejects public website URLs. The workflow requires the installed project dependencies (`npm install` if recreating the workspace).

Useful variations:

```powershell
# Resume interrupted captures for the SAME website revision.
node tools/showcase/render.cjs --resume

# Re-edit existing captures without opening the app again.
node tools/showcase/render.cjs --edit-only

# Export just the short version.
node tools/showcase/render.cjs --edit-only --timeline reel
```

Full fresh capture is the default. Use `--resume` only when the website has not changed. Encoded edit segments are cached by input size/time, settings and timeline, so unchanged segments can be reused safely.

## Scripts and editorial choices

- `capture.cjs`: 540 × 960 CSS mobile viewport, device scale 2; local fonts/images warmed first; hidden cursor/scrollbars; browser-clocked screenshots piped directly into FFmpeg. Export-only title cards and camera framing are injected into the capture tab, never saved into the app.
- `film.cjs`: original film at 62–74 seconds, contained inside the captured player with rounded corners. It preserves the original aspect ratio and all faces.
- `plan.cjs`: creates `edit-plan.json`. Change this file to adjust durations and selections. The reel is separately edited; it is not a sped-up full version. Major reel cuts follow a measured approximate Orente pulse, starting at 32.183 seconds of the supplied MP3.
- `edit.cjs`: subtle camera pushes, burgundy transitions, original-speed interactions, H.264 encoding and one continuous Orente audio bed.
- `finalize.cjs`: explicit Rec.709 color tags, the original-name hardlink and fresh export hashes, without re-encoding picture or sound.
- `verify.cjs`: complete bitstream/audio decode, format/FPS/duration checks, audio alignment and level checks, blank/silence detection, chapter coverage, and visual contact sheets.
- `playback-qa.cjs`: native local Edge playback, actual decoded audio samples, scene seeking and natural video ending.
- `render.cjs`: runs the complete workflow.

The complete video includes all ten mobile scrapbook leaves across **five chapters**, all four personal letters, the welcome, labelled room, portrait notes, film excerpt, candle interaction, birthday wishes, little notes and closing domain reveal. The three intentionally reserved scrapbook photo slots remain visible. There are no scrapbook captions in the current site, so none are invented for the video.

Both final videos use the supplied `public/audio/orente.mp3`. The film excerpt's audio is unmapped in the showcase to prevent two recordings of Orente playing together. The website's complete original MP4 and its soundtrack remain unchanged. Any black bars embedded inside that MP4 belong to the source and cannot be removed with CSS; the workflow does not crop Oma to hide them. The selected highlight uses the original montage's existing soft background.

Full verification reports, scene metadata, original captures and review contact sheets are retained in `review-artifacts/showcase/`. Intermediate renders and final videos are ignored by Git so they cannot accidentally enter the Vercel upload. No Git commit, push or deployment is part of this workflow.

## Completed verification — 23 October 2026

The final full export passed **22/22** FFmpeg/format/content checks; the reel passed **18/18**. Every video frame and audio packet in both final files was decoded successfully. The reel contains exactly 3,600 frames and lasts exactly 60.000 seconds. No unexpected black scenes, audio silence or clipping were detected.

Native Windows Edge playback passed **40/40** checks across both finalized files, including unmuted normal-speed playback, nonzero decoded audio samples, section seeking and natural ended events. Visual review sampled all **58 full-edit scenes** and **30 reel scenes**, plus the actual cover and page-turn animations. No physical iPhone or Android playback test is claimed.

Build and lint pass. The tracked `src/`, `public/`, package manifest and lockfile remain unchanged. The initial local-server connection failure is retained separately in the QA artifacts; the completed repeat passed with no runtime or network errors.
