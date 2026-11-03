# Legora deck — working notes

Figma design file (current deck): https://www.figma.com/design/ncrt6W6GMXesoevfG2LTet
Original Figma Slides deck (earlier version): `gRCLSVJLyXUKteE40F3hv4`

## Slides (1920×1080 frames, auto-layout)

1. **Why Legora, and why me**: portrait header, "Why Legora" and "What I bring" columns.
   Kaisey (links to the case study) + get-me-a-job (links to GitHub) paragraph with two demo slots: `video/Kaisey demo`, `video/Job-search skill demo`.
2. **From "we signed" to "wait, you don't have Legora?"**: relationship section
   (Land → Adopt → Anticipate → Pull) plus six creative ideas: Legora × Rogo bundle,
   Legora in the classroom, AI-first community hackathon (Luma phone mockup),
   Legora Certified (profile mockup), Legora behind the scenes, "Every firm needs a Mike".
3. **Where I want to be**: closing quote ("Legora anticipates the features I need." —
   Angela Prochnow, Director of Legal Operations, Y Combinator), closing line, sign-off,
   Legora × Jude Law campaign clip (bottom right).

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

- Drop `demos/Kaisey-demo.mp4` into Figma and swap it into `video/Kaisey demo`.
- Confirm the YC quote is verbatim (it's in quotation marks on slide 3).
- Check the Anthropic comparison on the Legora Certified card.
