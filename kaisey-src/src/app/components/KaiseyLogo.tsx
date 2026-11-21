/**
 * Kaisey brand mark: a "K" built from four calendar blocks.
 * One block is violet (the brand accent); the rest take the foreground
 * colour of wherever the mark sits.
 */

const BRAND_VIOLET = "#8B7FFF";

/** The bare K, sized by `size` (its height in px). */
export function KaiseyK({
  size = 24,
  color = "currentColor",
  accent = BRAND_VIOLET,
}: {
  size?: number;
  color?: string;
  accent?: string;
}) {
  // Drawn on a 40 x 46 grid, matching the brand board.
  return (
    <svg
      width={(size * 40) / 46}
      height={size}
      viewBox="0 0 40 46"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="0" y="0" width="11" height="46" rx="3" fill={color} />
      <rect x="14" y="17" width="10" height="12" rx="3" fill={color} />
      <rect x="27" y="0" width="13" height="14" rx="3" fill={accent} />
      <rect x="27" y="32" width="13" height="14" rx="3" fill={color} />
    </svg>
  );
}

/** The K on an ink tile: the app icon. `size` is the tile's width in px. */
export function KaiseyMark({
  size = 40,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 bg-[#0E0E12] ${className}`}
      style={{ width: size, height: size, borderRadius: size * 0.24 }}
      role="img"
      aria-label="Kaisey"
    >
      <KaiseyK size={size * 0.55} color="#FAFAFC" />
    </span>
  );
}

/** Mark plus "Kaisey" wordmark, for headers. */
export function KaiseyLogo({
  size = 36,
  subtitle,
}: {
  size?: number;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <KaiseyMark size={size} />
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
