# Birthday review — updated 22 October 2026

The scrapbook’s six chapters are filled with Ade’s supplied photos and short personal notes. The latest wording review removes extra slogans and sentence fragments across the pages, letters, notes and scrapbook. The scrapbook’s fixed dimensions and interactions, realistic room artwork and cake placement are preserved. Nothing has been published.

## Finished presentation

- Removed the experience/design/collection preview banners and setup instructions from the pages.
- Rewrote the room, wishes, letters headings, portrait introduction and little-note filler using Ade and Oma’s details. The four approved letter bodies and contributor wishes are preserved.
- The wishes page shows ten supplied messages, including Boluwatife’s wish added on October 22. At Ade’s request, cards and dialogs credit contributors by name only, without X handles, logos or source badges. There is no 100-wish target or count-based reveal.
- No empty X-post/share buttons or empty Ade’s picks filter. These appear when their data exists.
- The cake page uses a close view of the cake in the existing room artwork when no standalone photo exists. Candles and the private wish journal remain functional.
- The starter favicon and page metadata are replaced with Oma’s branding.
- Orente uses Ade’s supplied MP3 at `public/audio/orente.mp3`. All YouTube playback code, embeds, links and fallback are removed.
- The birthday film is installed at `public/videos/oma-on-film.mp4`, unchanged from Ade’s supplied MP4. The responsive player preserves its 960×540 frame and original Orente audio, with native controls and a lightweight poster. Background music now stays on during the film at Ade’s request, with independent controls.
- The scrapbook is filled: mirror photos for “The beginning of us,” the pink hat and red glasses for “Oma being Oma,” her framed portrait and a couple photo for “Through my eyes,” the school photo and red glasses for “The woman you are becoming,” and the black vest for “Pages yet to be written.” The last chapter pictures her becoming a successful Medical Laboratory Scientist and both of them qualifying. No achievements, dates or first-meeting story have been invented.
- Five distinct supplied photos are served as uncropped WebP copies, approximately 550 KB combined. The repeated purple mirror attachment is stored once; some photos recur across related chapters. Original supplied images are retained in `review-artifacts/scrapbook-originals/`. Chapter One is unchanged.

## Still needed

1. **Film title review:** the supplied MP4’s opening card says “Chapter Nineteen.” This is embedded in the video and has been preserved. Correcting it requires a revised video export.
2. **X post link — deferred by Ade:** `campaign.postUrl` is empty. No broken posting/sharing buttons are displayed.
3. **Gift reveal — deferred by Ade:** title/details are empty. Its hotspot and directory entry stay hidden until supplied; its room artwork remains intact. A direct empty gift route returns to the room.
4. **Deployment:** not published. Vercel hosting and connecting `sylverat20.com.ng` at WhoGoHost are planned after the remaining content is finished. A wish-count gate is no longer part of the project. Private access has not been implemented.

The birthday journal and discovered-note progress are saved only in the current browser. They are not sent to Ade or a server.

## Verification

- `npm.cmd run build` and `npm.cmd run lint` pass, with no lint warnings.
- Browser checks passed at widths 320, 390, 768 and 1440, including reduced motion. No page errors, broken local assets, or horizontal overflow were found on the reviewed routes.
- Opened and closed all four letters and all twenty notes with keyboard focus checks. Note progress persists after reload.
- Initially checked all nine collected wishes against their data, filters, sorting, more-wishes loading, the empty search state and the collection jump link. Search now uses contributor names and message text, matching the name-only presentation.
- Checked candle extinguishing/relighting, wish saving after reload, download contents, and recovery from invalid saved data.
- The earlier YouTube playback checks are superseded by the supplied MP3. The website now serves the soundtrack itself.
- October 22 live checks at 1440 and 390 pixels confirmed the full 3:36 track playing with sound, pause/resume, uninterrupted playback between the room and wishes, and stopping on close. The nine wishes remain intact, with no target/progress bar/reveal wording. Build and lint pass cleanly.
- The earlier content review preserved the scrapbook component, styles and chapter data. The subsequent responsive pass changes its component/styles only; the chapter data and room artwork remain intact.

## Responsive update — 22 October

- Fonts are served locally with their SIL Open Font Licenses; no Google Fonts request is needed. Wishes and scrapbook code load when their pages are opened.
- Room controls have 44-pixel touch targets. Tablet overlays fit around the title; narrow screens retain room panning and preserve their position on resize. Twenty little notes are also reachable from the directory.
- Improved small-screen reading, search fields, safe-area spacing, keyboard access, dialog scrolling and focus restoration. The compact music panel stays below the header on short landscape screens and scrolls if needed.
- Scrapbook layouts switch at 800 pixels. Chapter buttons wrap on narrow phones. Verified all six chapters remain 1174 pixels high in the stacked layout and 660 pixels high in the desktop layout.
- Tested reduced motion and animated page turns, wishes/search/collection links, letter and note dialogs, candles, touch controls and rotation. Screenshots are in `review-artifacts/optimized-*.png`.
- Browser testing uses Edge/Chromium with desktop and touch emulation. A final check on a physical iPhone/iPad or Safari is still useful before sharing.
- Final production review: all 72 combinations of eight routes and nine screen sizes (320–2560 pixels, including short landscape) passed without page errors, broken local images or page overflow. See `review-artifacts/responsive-report.json`.
- Verified fonts load locally and scrapbook/wishes chunks are not requested on initial room load. The supplied MP3 loads after a tap; no YouTube requests are made.
- Supplied MP3 verification: unmuted playback, pause/resume, looping, page-to-page continuity, close/stop/reset, and recovery after a simulated missing file all passed. Phone (390px), desktop (1440px) and landscape (844×390) panels fit on screen. Build and lint pass; `review-artifacts/local-audio-report.json` records the checks.
- Film verification: 320, 390, 768, 1024, 1440 and 844×390 layouts passed with no page errors or overflow. Original aspect ratio, stable player height, unmuted audio, volume, fullscreen, stopping on navigation and failed-load retry were checked. No film media/poster request occurs on the room homepage. Screenshots and results: `review-artifacts/film-final-*.png`, `review-artifacts/film-report.json`. Build and lint pass.
- Updated music preference: Orente starts on the first interaction and stays on until manually paused or closed, including during film playback. Manual off is remembered after reload. The card is reduced from 352×252 to approximately 290×208 pixels. Phone, desktop and landscape checks passed, including first-tap playback, independent film controls and remembered off/on preferences. See `review-artifacts/music-preference-report.json`.
- Music card timing: the card now hides after 4 seconds and returns for 4 seconds every 30 seconds while music plays. Audio continues independently. Keyboard interaction keeps its controls available; automatic reminders do not steal focus. Manual pause/close stops reminders, and header controls remain usable. Desktop/phone timer, scrapbook and preference checks passed; build and lint are clean. See `review-artifacts/music-card-timer-report.json` and `review-artifacts/music-reminder-*.png`.
- Boluwatife’s message is preserved as supplied. The collection now totals ten wishes, with names only on cards and dialogs. Confirmed the new message, pagination and name search at 390 and 1440 pixels. Build and lint pass.
- Completed scrapbook checks: all six chapters reviewed at 320, 390, 768, 1024 and 1440 pixels. Every photo loads, no placeholders remain, captions and notes fit the existing spaces, and book heights stay constant across chapters and photo flips (1174px stacked; 660px desktop). Keyboard navigation, animated cover/page turns and reduced motion passed. Renderer/CSS and room artwork remain unchanged. Build and lint pass. Screenshots: `review-artifacts/scrapbook-complete-*.png`; results: `review-artifacts/scrapbook-complete-report.json`.

## Wording review — 22 October

- Removed extra slogans, repeated labels and fragmented prose from the room directory, wishes page, scrapbook, letters and little notes. Page headings and instructions now describe their content directly. The photograph fallback and film error use plain loading/error messages.
- Kept the Chapter Twenty / One in a Million theme, personal references to Fayekemi, AdaOra, their photos, arguments and shared MLS studies, and the “With love, Ade” signatures. The supplied portrait paragraphs and all ten contributor messages are preserved.
- No media, soundtrack behavior, scrapbook styles or fixed book dimensions changed. The black-vest photo stays in the final chapter.
- Production browser review passed across eight routes at widths 320, 390, 768 and 1440. All six scrapbook chapters and both sides of every photo fit their existing spaces. Opened all four letters, twenty notes and ten wishes; no page errors or broken images occurred. Results and screenshots: `review-artifacts/copy-review-report.json` and `review-artifacts/copy-review-*.png`.

## Scrapbook titles only — 22 October

- Restored the room directory descriptions after Ade clarified that the removal applies to the scrapbook only.
- Scrapbook pages now contain the existing chapter titles and photos, without captions, slogans, handwritten descriptions or reverse-side notes. Photos no longer present an empty note-flip control. Image descriptions remain available to screen readers.
- Kept the cover branding, page navigation, animations and fixed book dimensions. All six chapters passed browser checks at 320, 390, 768 and 1440 pixels, along with keyboard and animated page turns. Build and lint pass. Screenshots and results: `review-artifacts/scrapbook-titles-only-*`.
