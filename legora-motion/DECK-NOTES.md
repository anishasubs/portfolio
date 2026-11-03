# Legora deck — working notes

Figma design file (current deck): https://www.figma.com/design/ncrt6W6GMXesoevfG2LTet
Original Figma Slides deck (earlier version): `gRCLSVJLyXUKteE40F3hv4`

## Slides (1920×1080 frames, auto-layout, prototype flow "Legora deck": click / → advances)

1. **Why Legora, and why me**: portrait header; "Why Legora" and "What I bring" columns
   (one lead line each); "Fun things I've built" with Kaisey (→ case study) and
   get-me-a-job (→ GitHub) demo clips; "More on my portfolio →" link. Animates in reading order (~9s).
2. **When everyone throws everything… how do you keep winning?** Subtext: From "let's pilot first"
   to "wait, you don't have Legora?". How Legora does it today: Land → Adopt → Expand;
   firm dot-cluster chain reaction; green banner "Winning continuously is about the relationship."
3. **Creative, crazy ideas only**: six idea cards (Rogo bundle, classroom, Luma hackathon,
   Legora Certified, behind the scenes, "Every firm needs a Mike"), images at 1.5×, pop-in animation;
   "And of course, the core GTM work" row based on the GTM Associate – Strategic Accounts postings.
4. **Where I want to be**: closing quote (Angela Prochnow, Director of Legal Operations, Y Combinator),
   closing line, sign-off, Legora × Jude Law campaign clip.

Type scale: Eyebrow Semi Bold 15 caps · Title Semi Bold 62 · Lead Medium 26 · Heading Semi Bold 22 ·
Body 19 · Caption 15. Animated timelines are extended to 600s so they play once and hold.

## Hard rules

- No invented numbers. Indē Wild figures come from `inde-wild-case-study/`.
- Never mention the J.P. Morgan separation.

## Animated media hand-off

GIFs/MP4s uploaded through the Figma MCP do **not** animate. Drag the file into
Figma by hand, then swap the dropped layer into its `anim/*` or `video/*` slot.
Re-saving a GIF with new bytes (e.g. the `-v2` files) avoids Figma reusing a
non-animated copy with the same hash.

## Assets in this folder

- `gif/`: 192px animated icons (Remotion, `src/Root.jsx`). `Relationship` and
  `LawBook` replaced `Compound` and `Landmark`.
- `demos/Kaisey-demo.mp4|gif`: 14s cut of `kaisey/kaisey-demo.mp4`
  (priorities → brain dump → proposed schedule → calendar). Avoids the 10.0s layout
  jump in the source. Text labels added: "Powered by OpenAI · gpt-4o-mini" (brain dump +
  schedule) and "Google Calendar · read/write sync" (calendar), per `kaisey-src`.
- `demos/JobSkill-demo.mp4|gif`: illustrative 15s walkthrough of
  [get-me-a-job](https://github.com/anishasubs/get-me-a-job), ending with the resume
  and cover letter PDFs dragged into an application. Re-render with
  `npx remotion render src/index.jsx JobSkill …`.

Third-party media (the Jude Law campaign clip, the *Suits* still) is only in the
Figma file, not in this public repo.

## Open items

- Confirm the YC quote is verbatim (in quotation marks on slide 4).
- Check the core GTM line against the actual New York job posting.
- Check the Anthropic comparison on the Legora Certified card.
