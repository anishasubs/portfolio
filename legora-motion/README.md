# legora-motion

Animated icons (Remotion → GIF) for the Legora interview deck (Figma Slides file `gRCLSVJLyXUKteE40F3hv4`).

Each GIF maps to a slot rectangle in the deck; a static vector icon (`static/<Name>`) currently sits on top of each slot.

| GIF | Slot node | Static icon node | Slide |
|---|---|---|---|
| Scale.gif | 5:2 | 5:10 | 1 — Why Legora |
| Hammer.gif | 5:3 | 5:16 | 1 — What I bring |
| Copy.gif | 5:4 | 5:20 | 2 — 01 feature war |
| Tag.gif | 5:5 | 5:23 | 2 — 02 price war |
| Compound.gif | 5:6 | 5:26 | 2 — 03 compounds |
| Lock.gif | 5:7 | 5:31 | 2 — callout |
| Landmark.gif | 5:8 | 5:34 | 3 — Law firms |
| Building.gif | 5:9 | 5:41 | 3 — In-house |

To place: `upload_assets` with `nodeIds` = slot IDs, POST each GIF, then delete the static icon nodes.
Re-render: `npm i && npm run render` (pass `--browser-executable` if Chrome can't be downloaded).
