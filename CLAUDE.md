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
- `finance/` — Ledger, a private personal finance app (single-file HTML + vendored
  pdf.js/tesseract.js in `finance/vendor/`). Real financial data; see its README.
  Data lives in browser localStorage only and must never be committed.

## Deploy
- **Homepage + case studies**: Push to `master` → GitHub Pages auto-deploys.
- **Kaisey app**: `cd kaisey-src && npx vite build` (clean old `kaisey/assets/` first), then commit `kaisey/` + `kaisey-src/`.
- **Kaisey proxy**: `cd kaisey-proxy && npx vercel --prod`. Deployed at `kaisey-proxy.vercel.app`. Env var `OPENAI_API_KEY` set in Vercel dashboard.
- **Whifff**: Deployed separately on Vercel (root directory: `whifff`). Pushes to `master` trigger Vercel build.
- **Ledger (`finance/`)**: Static, deploys with the site. Screenshot OCR needs an http origin, so it works on the Pages URL but not from `file://`.
- **Ledger advisor**: Optional, off by default. Backed by `kaisey-proxy/api/advice.ts`; deploy with `cd kaisey-proxy && npx vercel --prod`. Reuses `OPENAI_API_KEY`; `ADVICE_MODEL` optionally overrides the model (defaults to `gpt-4o`, falls back to `gpt-4o-mini`).

## Key URLs
- Portfolio: `https://anishasubs.github.io/portfolio/`
- Kaisey app: `https://anishasubs.github.io/portfolio/kaisey/index.html`
- Kaisey proxy: `https://kaisey-proxy.vercel.app/api/chat`
- Kaisey case study: `https://anishasubs.github.io/portfolio/kaisey-case-study/`
- Whifff: Vercel (separate domain)
- Whifff case study: `https://anishasubs.github.io/portfolio/whifff-case-study/`
- CoffeeChain: `https://anishasubs.github.io/portfolio/coffeechain/`
- Indē Wild: `https://anishasubs.github.io/portfolio/inde-wild-case-study/`
- Ledger: `https://anishasubs.github.io/portfolio/finance/`
- Ledger advisor endpoint: `https://kaisey-proxy.vercel.app/api/advice`

## Case Study Pages
All case study pages are single-file HTML/CSS/JS (vanilla, no frameworks). Always append CSS, never create new stylesheets. Match existing fonts, colors, and spacing.

## Demo Videos
Rendered from Remotion project at `C:\Users\Anisha\kaisey-demo` (separate from this repo).
- `kaisey/kaisey-instruction.mp4` — plays on WelcomePage before login, on every screen size (no portrait variant since Nov 2026). A ~20s cut of the rebrand demo: the chat, the recommendation and rebalance, then the logo.
- `kaisey/kaisey-demo.mp4` + `kaisey/kaisey-demo-poster.jpg` — the case study demo (hero loop and the "See Kaisey in Action" player). Since Nov 2026 this is the Time Blocks rebrand demo, rendered from the animatic on the "Kaisey Rebrand" design canvas (24s, 1920x1080), not from Remotion.
- `kaisey/archive/v1/` and `kaisey-case-study/assets/archive/v1/` — the original Remotion demo and hero loop, kept to rebuild later. Not referenced by any page.
- Render: `cd C:\Users\Anisha\kaisey-demo && npm run render:all`, then copy `out/*.mp4` to `kaisey/`
