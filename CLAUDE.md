# Portfolio Repository

## Overview
Personal portfolio site deployed to GitHub Pages at `anishasubs.github.io/portfolio/`.
Remote: `anishasubs/portfolio`, branch: `master`.

## Structure
- `index.html` — Homepage (single-file HTML/CSS/JS). Figma: `iV0QYcCHRSLhCYJD841pol`.
- `assets/` — Homepage images (webp/svg). Keep transparency when converting images.
- `kaisey-src/` — Kaisey app source (React + Vite + Tailwind + shadcn). Edit here.
- `kaisey/` — Kaisey built output (Vite `outDir: '../kaisey'`). Do not edit directly.
- `kaisey-case-study/` — Kaisey case study page.
- `whifff/` — Whifff perfume quiz app (Next.js 16 + React 19 + Tailwind v4 + Framer Motion).
- `whifff-case-study/` — Whifff case study page.
- `coffeechain/` — CoffeeChain crypto case study page.
- `inde-wild-case-study/` — Beauty brand growth case study page.

## Deploy
- **Homepage + case studies**: Push to `master` → GitHub Pages auto-deploys.
- **Kaisey**: `cd kaisey-src && npx vite build` (clean old `kaisey/assets/` first), then commit `kaisey/` + `kaisey-src/`.
- **Whifff**: Deployed separately on Vercel (root directory: `whifff`). Pushes to `master` trigger Vercel build.

## Key URLs
- Portfolio: `https://anishasubs.github.io/portfolio/`
- Kaisey: `https://anishasubs.github.io/portfolio/kaisey/index.html`
- Whifff: Vercel (separate domain)
