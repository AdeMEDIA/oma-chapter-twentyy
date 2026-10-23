# Local cinematic review

This document records the local review of the overhaul. Ade approved publishing the reviewed changes on 23 October 2026. See `RELEASE-CHECKLIST.md` for the release verification record; normal releases keep the existing GitHub, Vercel and custom-domain setup.

## Open the website

Development preview: **http://127.0.0.1:5180/**

Production-build preview: **http://127.0.0.1:4180/**

Both servers were running when this review was prepared. If the development server stops, run this in the project's VS Code terminal:

```powershell
npm.cmd run dev -- --host 127.0.0.1 --port 5180 --strictPort
```

Use a fresh private browser window to review the welcome screen. Internal navigation remembers the welcome choice for the current browsing session. A reload does not attempt audible autoplay; use the sound control to resume.

## What changed

- The original labelled room has been restored, including its OMA / Chapter Twenty heading on the wall and glowing serif object labels. Phones and tablets keep those labels over the artwork; smaller-screen spacing is adjusted without sideways panning. The separate mobile heading, duplicate portrait and music interlude have been removed. Responsive corrections are scoped in `src/room-fit.css`.
- A burgundy welcome dialog offers explicit music and quiet entry, with a gentle exit into the room. Reduced motion skips the animation.
- One persistent soundtrack player serves every route. X and Escape dismiss its controls while the music continues. Reopening keeps its position. Header controls, volume, mute and loading/error feedback share the actual audio state. The small mobile launcher replaces the recurring music card.
- The collection below the room uses numbered editorial links and consistent SVG icons. Reading surfaces, letters, portrait notes, wishes, candle feedback and dialogs have refined spacing, contrast and touch controls.
- The scrapbook now has five two-page chapters with the requested photograph arrangement. Desktop retains paired pages; phones use ten sequential single pages, corner controls and swipe navigation. See `SCRAPBOOK-REVIEW.md` for the latest mapping and checks.
- The film keeps native playback controls, its full aspect ratio, complete original audio and restrained surrounding blur. Images have responsive WebP alternatives; audio and video are not fetched during quiet room entry. No animation library or other frontend dependency was added.

## Existing architecture

The project remains React 19 with Vite 8, hash-based routes and the existing plain CSS cascade. Wishes and scrapbook stay lazy-loaded. Motion uses CSS, native Web Animations, a shared IntersectionObserver and bounded pointer events. It does not run a continuous JavaScript render loop.

Room composition is in `src/components/BirthdayRoom.jsx`. The welcome and shared audio lifecycle live in `WelcomeExperience.jsx` and `Soundtrack.jsx`. Section and global finishing rules are in `src/section-polish.css` and `src/cinematic.css`. Original content remains in `src/data/birthday.js` and `src/data/wishes.js`.

All 22 pre-existing public assets match the original Git versions byte for byte. The scrapbook data now reflects Ade's requested photograph moves, three reserved slots and five active chapters; the removed chapter's source data is archived. All other personal exports and the wishes remain unchanged. Responsive images are additional files in `public/images/responsive/`, mapped in `src/data/imageVariants.js`. A new photo filename in the content data automatically uses the original-image fallback; replacing a mapped photo under the same filename also requires refreshing its generated alternatives.

## Verification

- `npm.cmd run build` and `npm.cmd run lint` pass. There is no pre-existing `npm test` script.
- The earlier site-wide overhaul passed 99 route layouts per engine and interaction checks in Edge/Chromium and Windows WebKit. Those reports predate the latest scrapbook revision.
- Latest scrapbook revision: 110 settled layouts in each engine across 13 viewport sizes pass, including exact placement, three intentional placeholders, natural image proportions, stable book height, 44px corner controls and no horizontal overflow. Navigation, swipe, keyboard, session notice, orientation, reduced motion and animation-interruption checks also pass; details are in `SCRAPBOOK-REVIEW.md`.
- Widths checked: 320, 360, 375, 390, 414, 768, 1024, 1440, 1920 and 2560 pixels, plus 844 by 390 landscape. No unintended horizontal overflow or horizontal page scrollers were found.
- Music/welcome: 39 integrated Edge checks and 12 additional WebKit checks pass, including explicit audio start, quiet entry, dismissal/reopening, volume/mute, playback across routes, focus and remembered-session behavior.
- Screenshots of every section at phone and desktop sizes were reviewed. Supporting reports and images are in the ignored local `review-artifacts/` folder.
- Footer links were checked against the compact player in 15 route/viewport combinations after the final spacing adjustment.

## Practical limits

Physical iPhone/iOS Safari and Android/Chrome were not available. Emulated phone layouts and Windows WebKit checks do not establish hardware audio, fullscreen or browser-toolbar behavior on those devices. A quick real-phone check is still appropriate before publishing.

No field Core Web Vitals score is claimed. A cold-cache, throttled Edge lab run recorded no unexpected layout shifts and no initial MP3/MP4 request; its LCP observer did not produce a usable measurement.

The original film is unchanged. Any black bars or titles embedded in the MP4 require a new video export to alter; the player does not zoom or crop Oma to hide them. Film audio and background music remain independently controlled, as previously requested.

The gift stays hidden because its personal reveal has not been supplied. The ten existing wishes remain the complete current collection, without a 100-wish gate or X handles. No collection backend or new submission service has been introduced.
