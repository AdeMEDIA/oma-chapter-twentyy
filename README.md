# Oma — Chapter Twenty

Ade's twentieth-birthday website for Oma, built with React and Vite. The labelled birthday room is the homepage. Photographs, Orente and the complete birthday film are served from public/.

- Website: https://sylverat20.com.ng
- Vercel URL: https://oma-chapter-twenty.vercel.app
- Source: https://github.com/AdeMEDIA/oma-chapter-twentyy
- Production project: adepoju-abdullahis-projects/oma-chapter-twenty, connected to main.

## Run locally

    npm.cmd ci
    npm.cmd run dev

For the local review address used during development:

    npm.cmd run dev -- --host 127.0.0.1 --port 5180 --strictPort

## Verify and deploy

    npm.cmd run lint
    npm.cmd run build
    npm.cmd run preview

Review changes before pushing to main. The connected Vercel project builds production releases from that branch. Confirm the deployment is Ready and check the custom domain, room labels, scrapbook, wishes, soundtrack and film afterward. The custom domain is already connected; no registrar changes are needed for normal releases.

The app uses hash routes such as /#/scrapbook; no catch-all rewrite is needed. Source, original public assets and responsive image alternatives belong in Git. Dependencies, build output, local environment files, .vercel/ and review-artifacts/ remain excluded. No application environment variables are required.

## Content and behavior

- src/data/birthday.js: media, five active scrapbook spreads, archived chapter, letters and little notes.
- src/data/wishes.js: the ten collected wishes and optional birthday-post URL.
- src/components/Scrapbook.jsx and scrapbook.css: paired desktop chapters and sequential mobile leaves.
- src/components/BirthdayRoom.jsx and src/room-fit.css: the original labelled room with responsive positions.
- src/components/Soundtrack.jsx: one persistent Orente player; dismissing the panel does not stop the song.

The welcome screen starts music only after an explicit choice and remembers the introduction for the browsing session. Its 2.6-second door opening has a short fade alternative for reduced motion. Audio position survives internal navigation. The player stays minimized until opened; dismissing it keeps Orente playing. Phones and tablets reserve a small safe-area music dock so the circular control cannot cover page actions; desktop uses one Orente control in the header. The film keeps its original audio, independently controlled as requested.

Wish-journal entries and note progress stay in the visitor's browser. The deferred gift and X-post controls stay hidden while their data is empty. All ten scrapbook photograph slots are filled; original uploads are retained alongside responsive derivatives.

## Entrance release and recovery

The complete pre-entrance project, including the latest scrapbook photos and captions, is saved at `backup/pre-final-entrance-2026-10-23` (`e8e0d59`). The entrance update is tagged `release/final-entrance-2026-10-23`. To undo only that update while retaining the scrapbook:

```powershell
git revert release/final-entrance-2026-10-23
git push origin main
```

This creates a normal recovery commit; it does not reset or rewrite history. The local verification record is in `review-artifacts/final-entrance/`: 880 Chromium/WebKit checks plus 27 integration checks cover music, welcome, responsive layouts, keyboard controls, resize continuity, letters, notes, cake and film. No physical iPhone or Android test is claimed.

All original media is retained. The supplied film's embedded Chapter Nineteen opening card requires a revised video export to change; CSS does not remove embedded bars or crop faces. See FILM.md, SOUNDTRACK.md and SCRAPBOOK-REVIEW.md.

