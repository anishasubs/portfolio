"use client";

import Sparkle from "./Sparkle";

interface MixingAnimationProps {
  phase: number;
  notes: string[];
}

export default function MixingAnimation({ phase, notes }: MixingAnimationProps) {
  const h = phase === 0 ? 0 : phase === 1 ? 25 : phase === 2 ? 65 : 72;

  return (
    <div className="flex flex-col items-center py-2 pb-5">
      {/* Note pills */}
      <div className="flex flex-wrap justify-center gap-1.5 mb-6 min-h-[30px] max-w-[340px]">
        {phase >= 1 &&
          notes.map((n, i) => (
            <span
              key={n}
              className="text-[11px] font-bold text-[#1B3A5C] py-[5px] px-3.5 rounded-[20px] bg-white/[0.88] shadow-[0_2px_8px_rgba(0,40,80,0.06)] animate-dropIn"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              {n}
            </span>
          ))}
      </div>

      {/* Flask */}
      <div className="relative w-[90px] h-[140px]">
        <svg viewBox="0 0 90 140" width="90" height="140" style={{ overflow: "visible" }}>
          <defs>
            <linearGradient id="lq" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(255,255,255,0.6)" />
              <stop offset="100%" stopColor="rgba(74,142,194,0.5)" />
            </linearGradient>
            <clipPath id="fc">
              <path d="M33 48 L24 102 Q20 126 45 130 Q70 126 66 102 L57 48 Z" />
            </clipPath>
          </defs>

          {/* Flask body */}
          <path
            d="M33 48 L24 102 Q20 126 45 130 Q70 126 66 102 L57 48 Z"
            fill="rgba(255,255,255,0.15)"
            stroke="rgba(255,255,255,0.5)"
            strokeWidth="1.3"
          />
          {/* Flask neck */}
          <rect x="37" y="20" width="16" height="30" rx="2" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.45)" strokeWidth="1.3" />
          {/* Flask cap */}
          <rect x="35" y="12" width="20" height="10" rx="3.5" fill="rgba(255,255,255,0.45)" />

          {/* Liquid */}
          <g clipPath="url(#fc)">
            <rect
              x="20"
              y={130 - h}
              width="52"
              height={h}
              fill="url(#lq)"
              style={{ transition: "all 1.4s cubic-bezier(.4,0,.2,1)" }}
            >
              {phase >= 2 && (
                <animate attributeName="y" values={`${130 - h};${128 - h};${130 - h}`} dur="2.5s" repeatCount="indefinite" />
              )}
            </rect>
            {h > 0 && (
              <ellipse
                cx="45"
                cy={130 - h}
                rx="22"
                ry="2.5"
                fill="rgba(255,255,255,0.4)"
                style={{ transition: "cy 1.4s cubic-bezier(.4,0,.2,1)" }}
              >
                <animate attributeName="ry" values="2;3.5;2" dur="2s" repeatCount="indefinite" />
              </ellipse>
            )}
          </g>

          {/* Bubbles */}
          {phase >= 2 &&
            [
              { cx: 37, d: 0, r: 2.4 },
              { cx: 45, d: 0.5, r: 1.9 },
              { cx: 52, d: 1, r: 2.6 },
            ].map((b, i) => (
              <circle key={i} cx={b.cx} r="1.8" fill="rgba(255,255,255,0.6)">
                <animate attributeName="cy" values="122;85" dur={`${b.r}s`} begin={`${b.d}s`} repeatCount="indefinite" />
                <animate attributeName="opacity" values="0;.6;0" dur={`${b.r}s`} begin={`${b.d}s`} repeatCount="indefinite" />
              </circle>
            ))}
        </svg>

        {/* Sparkles */}
        {phase >= 3 &&
          [
            { x: -6, y: 36 },
            { x: 78, y: 48 },
            { x: 8, y: 85 },
            { x: 70, y: 90 },
            { x: 40, y: 6 },
          ].map((s, i) => (
            <div key={i} className="absolute animate-sparkle" style={{ left: s.x, top: s.y, animationDelay: `${i * 0.15}s` }}>
              <Sparkle size={10} />
            </div>
          ))}
      </div>

      {/* Status text */}
      <p className="text-[13px] text-[#1B3A5C] font-semibold mt-4 text-center opacity-70">
        {phase < 1
          ? "gathering your notes..."
          : phase < 2
            ? "adding ingredients..."
            : phase < 3
              ? "mixing your blend..."
              : "your scent is ready \u2726"}
      </p>
    </div>
  );
}
