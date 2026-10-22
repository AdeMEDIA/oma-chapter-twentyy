# Oma — Chapter Twenty

Ade’s twentieth-birthday website for Oma, built with React and Vite. The birthday room is the homepage. Photos, Orente and the birthday film are served from `public/`.

## Run locally

```powershell
npm.cmd ci
npm.cmd run dev
```

## Check the production build

```powershell
npm.cmd run lint
npm.cmd run build
npm.cmd run preview
```

## Deploy to Vercel

1. Push this project to a private GitHub repository.
2. In Vercel, select **Add New → Project** and import that repository.
3. Use the **Vite** preset, project root `./`, build command `npm run build`, and output directory `dist`. No environment variables are required.
4. Deploy, then check the Vercel URL, room links, photos, sound and film.
5. Under **Settings → Domains**, add `sylverat20.com.ng` and optionally `www.sylverat20.com.ng`.
6. At WhoGoHost, enter the exact DNS records displayed by Vercel. Keep existing unrelated mail/DNS records. Wait for Vercel to confirm the domain and HTTPS certificate.

GitHub holds the source and Vercel hosts the website. Future pushes to the connected production branch trigger deployment. GitHub is optional if deploying with the Vercel CLI instead.

The app uses hash routes such as `/#/scrapbook`; no catch-all rewrite is needed. The repository should include `src/`, `public/`, `index.html`, the package files and build configuration. `node_modules/`, `dist/`, local environment files and `review-artifacts/` are excluded from Git.

## Content

- `src/data/birthday.js`: media, scrapbook titles/photos, letters and little notes.
- `src/data/wishes.js`: the ten collected wishes and optional birthday-post URL.
- `src/components/`: room and page interactions, scrapbook, film and soundtrack.
- `public/`: all website images, audio, video and local fonts.

Wish-journal entries, note progress and music preferences stay in the visitor’s browser. They are not stored on a server. The deferred gift and X-post buttons remain hidden while their data is empty.

The supplied film contains an embedded “Chapter Nineteen” opening card; replacing it requires a corrected video export. See `FILM.md` for details. `RELEASE-CHECKLIST.md` records completed reviews and remaining items.
