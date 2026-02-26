# Portfolio Repository

## Overview
Personal portfolio site deployed to GitHub Pages at `anishasubs.github.io/portfolio/`.
Remote: `anishasubs/portfolio`, branch: `master`.

## Structure
- `index.html` — Homepage (single-file HTML/CSS/JS). Figma: `iV0QYcCHRSLhCYJD841pol`.
- `assets/` — Homepage images (webp/svg). Keep transparency when converting images.
- `kaisey-src/` — Kaisey app source (React + Vite + Tailwind + shadcn). Edit here.
- `kaisey/` — Kaisey built output (Vite `outDir: '../kaisey'`). Do not edit directly.
- `kaisey-proxy/` — OpenAI proxy for Kaisey (Vercel serverless function). Deployed separately.
- `kaisey-case-study/` — Kaisey case study page (single-file HTML/CSS/JS).
- `whifff/` — Whifff perfume quiz app (Next.js 16 + React 19 + Tailwind v4 + Framer Motion).
- `whifff-case-study/` — Whifff case study page (single-file HTML/CSS/JS).
- `coffeechain/` — CoffeeChain crypto case study page (single-file HTML/CSS/JS).
- `inde-wild-case-study/` — Indē Wild beauty brand growth case study page.

## Deploy
- **Homepage + case studies**: Push to `master` → GitHub Pages auto-deploys.
- **Kaisey app**: `cd kaisey-src && npx vite build` (clean old `kaisey/assets/` first), then commit `kaisey/` + `kaisey-src/`.
- **Kaisey proxy**: `cd kaisey-proxy && npx vercel --prod`. Deployed at `kaisey-proxy.vercel.app`. Env var `OPENAI_API_KEY` set in Vercel dashboard.
- **Whifff**: Deployed separately on Vercel (root directory: `whifff`). Pushes to `master` trigger Vercel build.

## Key URLs
- Portfolio: `https://anishasubs.github.io/portfolio/`
- Kaisey app: `https://anishasubs.github.io/portfolio/kaisey/index.html`
- Kaisey proxy: `https://kaisey-proxy.vercel.app/api/chat`
- Kaisey case study: `https://anishasubs.github.io/portfolio/kaisey-case-study/`
- Whifff: Vercel (separate domain)
- Whifff case study: `https://anishasubs.github.io/portfolio/whifff-case-study/`
- CoffeeChain: `https://anishasubs.github.io/portfolio/coffeechain/`
- Indē Wild: `https://anishasubs.github.io/portfolio/inde-wild-case-study/`

## Case Study Pages
All case study pages are single-file HTML/CSS/JS (vanilla, no frameworks). Always append CSS, never create new stylesheets. Match existing fonts, colors, and spacing.

## Demo Videos
Rendered from Remotion project at `C:\Users\Anisha\kaisey-demo` (separate from this repo).
- `kaisey/kaisey-instruction.mp4` + portrait variant — plays on WelcomePage before login
- `kaisey/kaisey-demo.mp4` + portrait variant — used on case study page
- Render: `cd C:\Users\Anisha\kaisey-demo && npm run render:all`, then copy `out/*.mp4` to `kaisey/`
