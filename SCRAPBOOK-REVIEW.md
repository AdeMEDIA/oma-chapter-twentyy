# Scrapbook refinement

Local preview: **http://127.0.0.1:5180/#/scrapbook**

This document records the local review. Ade approved publishing the reviewed revision on 23 October 2026; see `RELEASE-CHECKLIST.md` for release verification.

## The five chapters

One desktop spread is one chapter. On phones, its left and right leaves are viewed sequentially.

| Chapter | Title | Left page | Right page |
| --- | --- | --- | --- |
| 1 | Before the new chapter | Childhood sitting-room photo | School photo |
| 2 | The beginning of us | Reserved for another photo | Purple-lit couple photo |
| 3 | Oma being Oma | Pink-hat photo | Black-and-white couple mirror photo |
| 4 | Through my eyes | Placeholder for your upload | Placeholder for your upload |
| 5 | Pages yet to be written | Black-vest photo | Red-glasses portrait in black |

Original chapter five is absent from the book and navigation. Its source data is retained in `archivedSpreads` so no personal content or actual image file is lost. The original chapter six is now chapter five.

## Reading and controls

- Desktop keeps two cream paper leaves, burgundy binding, spine shadows and compact Polaroids with the full photograph visible.
- Mobile shows one bounded book page, including compact landscape layouts. Page proportions and book height remain stable through every chapter. There is no stacked second leaf or horizontal panning.
- Tap the subtle lower page corners, swipe horizontally, or use Left/Right arrow keys. Desktop turns complete chapters; mobile turns individual leaves. Home/End reach the first/last available view; Escape closes the cover.
- The discreet chapter numerals jump to each chapter's first page. Mobile progress also identifies the left/right leaf and page number out of ten.
- The small-screen viewing recommendation is dismissible and remembered for the browsing session. It uses a matching SVG heart instead of a platform emoji.
- Reduced motion skips the folds. Resizing or changing motion preference during an animation safely settles the requested page. Keyboard focus returns to the book when appropriate without interrupting someone using the music controls.

The existing chapter titles are unchanged. No personal descriptions, captions or replacement photographs have been invented.

## Checks

- Production build and lint pass.
- Edge/Chromium and Windows WebKit 26.5 each pass **110 settled layouts** across 13 viewport sizes, including all five paired spreads and all ten individual mobile pages.
- Sizes checked: 320x568, 360x740, 375x812, 390x844, 414x896, 600x960, 768x1024, 800x1000, 801x1000, 1024x1366, 1440x1000, 1920x1080 and 844x390.
- Checks verify exact source-image placement, full natural proportions, intentional placeholders, title fit, photographs inside the binding, corner touch targets, endpoints and no horizontal overflow. Screenshots were inspected at phone, landscape and desktop sizes.
- State checks cover chapter jumps, swipe guards, rapid input, close/reopen, route changes, orientation changes, reduced motion and session-only notice behavior. Final focus/busy probes pass 10/10; the viewport/motion follow-up passes 27/27 and landscape/notice follow-up passes 17/17.
- Normal-motion cover and forward/backward folds were checked in both engines at phone and desktop sizes, including transient overflow and removal of finished animation layers.
- All **22 original public assets** remain byte-for-byte unchanged. Other personal data exports and wishes are unchanged; only the requested scrapbook mapping was edited.

Reports and screenshots are in the ignored local `review-artifacts/` folder, particularly `scrapbook-layout-edge-report.json`, `scrapbook-layout-webkit-report.json`, `scrapbook-state-focus-probe.json` and `scrapbook-motion-report.json`.

These are Windows browser-engine checks with emulated phone viewports. Physical iPhone Safari and Android Chrome were not tested. The three reserved slots remain intentionally empty until you supply their photographs.

## Files

`src/components/Scrapbook.jsx` owns reading state, cover/turn lifecycle, gestures, keyboard controls and the notice. `src/components/scrapbook.css` owns the book's visual layouts. `src/data/birthday.js` contains the five `spreads`; replace the relevant null image value and accessible label when the new photographs arrive.
