# Release review — 23 October 2026

Ade approved publishing the reviewed version after the original labelled room was restored. This release uses the existing GitHub main branch, Vercel project and sylverat20.com.ng domain.

## Included

- Original room artwork, registered portrait, OMA / Chapter Twenty heading and glowing on-object labels restored. Narrow-screen positions fit without horizontal swiping or the separate heading/portrait/music interlude.
- Five scrapbook chapters: childhood pair; reserved + purple couple; pink hat + black-and-white couple; two reserved slots; black vest + red glasses. Original chapter five is archived. Desktop shows paired leaves; phones show ten sequential pages.
- Page-corner controls, swipe and keyboard navigation, restrained page folds, reduced motion and session-only viewing recommendation.
- Explicit music/quiet welcome, one persistent Orente audio instance, accurate transport/volume controls, and player dismissal that leaves audio playing.
- Refined reading surfaces, SVG interface icons, responsive image alternatives and the unchanged complete birthday film.

## Release checks

- npm.cmd run build: pass.
- npm.cmd run lint: pass.
- Final built preview: 144/144 assertions pass in headless Edge, at 390px and 1440px, across all eight routes. Zero runtime errors and zero failed asset responses.
- Restored room: 14 widths from 320 to 1440 checked for visible nonoverlapping 44px controls, center/bottom hit testing, and no horizontal overflow. All seven links navigate correctly; the Orente label starts playback, and closing the player leaves it running.
- Scrapbook: earlier Edge and Windows WebKit runs each passed 110 settled layouts across 13 viewport sizes, plus swipe, chapter navigation, keyboard, rotation, motion preferences, animation interruption and notice persistence. Final release repeats the ten mobile leaves and five desktop pairs.
- All 22 original public assets remain byte-for-byte unchanged. The existing personal letters, notes, portrait text and wishes remain intact. Only the requested scrapbook photo mapping changes.
- Review artifacts, dependencies, generated builds, Vercel metadata and local environment files are excluded from Git and deployment uploads.

The final production build was reviewed before deployment. Local reports are in the ignored review-artifacts/ directory. Physical iPhone Safari and Android Chrome were not tested; Windows engine tests with emulated viewports are not a hardware-device guarantee.

## Existing limitations retained

The three scrapbook photo slots intentionally await Ade's uploads. The gift reveal and X-post URL remain deferred and their empty controls stay hidden. Wishes show the ten collected messages by name, without a 100-wish target.

The supplied film includes an embedded Chapter Nineteen opening card. It is preserved unchanged; changing it or removing embedded bars requires a revised video export. The player does not crop faces. Film and background audio remain independently controlled as requested.

Wish-journal entries and discovered-note progress are local to each visitor's browser. No collection backend or new submission service is claimed.

## Deployment workflow

Push the reviewed commit to main, wait for Vercel to report Ready, then verify the custom-domain routes, photo mapping and media playback. Current domain configuration is already working and needs no registrar changes.

