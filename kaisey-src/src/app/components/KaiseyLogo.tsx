/**
 * Kaisey brand mark: a "K" built from four calendar blocks.
 * One block is violet (the brand accent); the rest take the foreground
 * colour of wherever the mark sits.
 *
 * Motion:
 *  - "assemble": plays once. The blocks slide into place like events being
 *    scheduled; the two right-hand blocks start swapped and trade places, so
 *    the violet one lands on top.
 *  - "shuffle": loops. The right-hand blocks keep trading places while the
 *    middle block nudges, like Kaisey rescheduling. Use while it's thinking.
 * Both fall back to the still mark when the viewer prefers reduced motion.
 */
import { motion, useReducedMotion, type Transition } from "motion/react";

const BRAND_VIOLET = "#8B7FFF";

export type KaiseyMotion = "none" | "assemble" | "shuffle";

// Block geometry on a 40 x 46 grid, matching the brand board.
const STEM = { x: 0, y: 0, w: 11, h: 46 };
const MID = { x: 14, y: 17, w: 10, h: 12 };
const TOP = { x: 27, y: 0, w: 13, h: 14 };
const BOTTOM = { x: 27, y: 32, w: 13, h: 14 };

// Motion's x/y on SVG shapes are translate offsets from the drawn position,
// not positions: SWAP is the distance between the two right-hand slots.
const SWAP = BOTTOM.y - TOP.y;

const snap: Transition = { type: "spring", stiffness: 420, damping: 30, mass: 0.8 };

/** The bare K, sized by `size` (its height in px). */
export function KaiseyK({
  size = 24,
  color = "currentColor",
  accent = BRAND_VIOLET,
  motion: mode = "none",
}: {
  size?: number;
  color?: string;
  accent?: string;
  motion?: KaiseyMotion;
}) {
  const reduce = useReducedMotion();
  const m = reduce ? "none" : mode;

  const rect = (b: typeof STEM, fill: string) => ({
    x: b.x, y: b.y, width: b.w, height: b.h, rx: 3, fill,
  });

  let stem, mid, top, bottom;

  if (m === "assemble") {
    stem = (
      <motion.rect {...rect(STEM, color)}
        initial={{ y: -46, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ ...snap, delay: 0 }} />
    );
    mid = (
      <motion.rect {...rect(MID, color)}
        initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
        transition={{ ...snap, delay: 0.12 }} />
    );
    // Violet starts at the bottom slot and slides up; the ink block goes down.
    top = (
      <motion.rect {...rect(TOP, accent)}
        initial={{ y: SWAP, opacity: 0 }}
        animate={{ y: [SWAP, SWAP, 0], opacity: [0, 1, 1] }}
        transition={{ duration: 0.75, times: [0, 0.35, 1], ease: [0.65, 0, 0.35, 1], delay: 0.22 }} />
    );
    bottom = (
      <motion.rect {...rect(BOTTOM, color)}
        initial={{ y: -SWAP, opacity: 0 }}
        animate={{ y: [-SWAP, -SWAP, 0], opacity: [0, 1, 1] }}
        transition={{ duration: 0.75, times: [0, 0.35, 1], ease: [0.65, 0, 0.35, 1], delay: 0.22 }} />
    );
  } else if (m === "shuffle") {
    const loop: Transition = {
      duration: 2.4, repeat: Infinity, ease: [0.65, 0, 0.35, 1],
      times: [0, 0.3, 0.5, 0.8, 1],
    };
    stem = <rect {...rect(STEM, color)} />;
    mid = (
      <motion.rect {...rect(MID, color)}
        animate={{ x: [0, 2, 0, 2, 0] }}
        transition={loop} />
    );
    top = (
      <motion.rect {...rect(TOP, accent)}
        animate={{ y: [0, SWAP, SWAP, 0, 0] }}
        transition={loop} />
    );
    bottom = (
      <motion.rect {...rect(BOTTOM, color)}
        animate={{ y: [0, -SWAP, -SWAP, 0, 0] }}
        transition={loop} />
    );
  } else {
    stem = <rect {...rect(STEM, color)} />;
    mid = <rect {...rect(MID, color)} />;
    top = <rect {...rect(TOP, accent)} />;
    bottom = <rect {...rect(BOTTOM, color)} />;
  }

  return (
    <svg
      width={(size * 40) / 46}
      height={size}
      viewBox="0 0 40 46"
      overflow="visible"
      aria-hidden="true"
      focusable="false"
    >
      {stem}
      {mid}
      {bottom}
      {top}
    </svg>
  );
}

/** The K on an ink tile: the app icon. `size` is the tile's width in px. */
export function KaiseyMark({
  size = 40,
  className = "",
  motion: mode = "none",
}: {
  size?: number;
  className?: string;
  motion?: KaiseyMotion;
}) {
  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 overflow-hidden bg-[#0E0E12] ${className}`}
      style={{ width: size, height: size, borderRadius: size * 0.24 }}
      role="img"
      aria-label="Kaisey"
    >
      <KaiseyK size={size * 0.55} color="#FAFAFC" motion={mode} />
    </span>
  );
}

/** Mark plus "Kaisey" wordmark, for headers. */
export function KaiseyLogo({
  size = 36,
  subtitle,
  motion: mode = "none",
}: {
  size?: number;
  subtitle?: string;
  motion?: KaiseyMotion;
}) {
  return (
    <div className="flex items-center gap-3">
      <KaiseyMark size={size} motion={mode} />
      <div className="leading-none">
        <div
          className="font-semibold text-foreground"
          style={{ fontSize: size * 0.62, letterSpacing: "-0.04em", lineHeight: 1 }}
        >
          Kaisey
        </div>
        {subtitle && (
          <div className="mt-1 font-mono text-[11px] text-muted-foreground lowercase">
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}
