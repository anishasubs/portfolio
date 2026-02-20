"use client";

import Sparkle from "./Sparkle";

const STROKE = "#5C3D4A";
const GLASS = "#D2B5D6";
const GLASS_LIGHT = "#E4D0E8";
const GOLD = "#C9A85C";
const GOLD_LIGHT = "#DFC88A";
const CREAM = "#F5EDE0";

// Potion colors — warm nostalgic palette
const POTIONS = [
  { color: "#E8A0B8", label: "rose" },      // dusty pink
  { color: "#A8D4C8", label: "green tea" },  // sage green
  { color: "#D4B088", label: "amber" },      // warm amber
  { color: "#B8A0D8", label: "violet" },     // soft purple
];

interface MixingAnimationProps {
  phase: number;
  notes: string[];
}

export default function MixingAnimation({ phase, notes }: MixingAnimationProps) {
  const fillH = phase === 0 ? 0 : phase === 1 ? 20 : phase === 2 ? 50 : 58;

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

      {/* Vintage bottle with liquid pouring in */}
      <div className="relative w-[220px] h-[210px]">
        <svg viewBox="0 0 220 210" width="220" height="210" style={{ overflow: "visible" }}>
          <defs>
            <clipPath id="bottle-clip">
              <circle cx="110" cy="142" r="42" />
            </clipPath>
            <linearGradient id="mixed-liquid" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={phase >= 3 ? "#D4B8D8" : phase >= 2 ? POTIONS[2].color : POTIONS[0].color} stopOpacity="0.7" />
              <stop offset="40%" stopColor={phase >= 2 ? POTIONS[1].color : POTIONS[0].color} stopOpacity="0.6" />
              <stop offset="100%" stopColor={phase >= 3 ? POTIONS[3].color : POTIONS[0].color} stopOpacity="0.8" />
            </linearGradient>
          </defs>

          {/* === TWO LIQUID POURS — smooth tapered ribbon arcs === */}

          {/* Left pour — dusty pink, arcs from upper-left into bottle */}
          {phase >= 1 && phase < 3 && (
            <g>
              {/* Ribbon shape: wide at source, tapers through arc, meets bottle opening */}
              <path
                d="M 12 -12 Q 76 -10, 102 92 L 112 92 Q 78 6, 36 -12 Z"
                fill={POTIONS[0].color} opacity="0.8"
              >
                <animate attributeName="d"
                  values="M 12 -12 Q 76 -10, 102 92 L 112 92 Q 78 6, 36 -12 Z;M 12 -12 Q 80 -6, 103 92 L 113 92 Q 82 10, 36 -12 Z;M 12 -12 Q 76 -10, 102 92 L 112 92 Q 78 6, 36 -12 Z"
                  dur="2s" repeatCount="indefinite" />
              </path>
              {/* Glossy highlight */}
              <path
                d="M 22 -8 Q 76 -4, 106 90"
                fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.35"
              />
              {/* Drip blob following the arc */}
              <circle r="2.5" fill={POTIONS[0].color} opacity="0">
                <animate attributeName="cx" values="60;86;104" dur="0.8s" repeatCount="indefinite" />
                <animate attributeName="cy" values="10;50;90" dur="0.8s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.6;0.4;0" dur="0.8s" repeatCount="indefinite" />
              </circle>
            </g>
          )}

          {/* Right pour — sage green, arcs from upper-right into bottle */}
          {phase >= 1 && phase < 3 && (
            <g>
              <path
                d="M 208 -12 Q 144 -10, 118 92 L 108 92 Q 142 6, 184 -12 Z"
                fill={POTIONS[1].color} opacity="0.75"
              >
                <animate attributeName="d"
                  values="M 208 -12 Q 144 -10, 118 92 L 108 92 Q 142 6, 184 -12 Z;M 208 -12 Q 140 -6, 117 92 L 107 92 Q 138 10, 184 -12 Z;M 208 -12 Q 144 -10, 118 92 L 108 92 Q 142 6, 184 -12 Z"
                  dur="2.3s" repeatCount="indefinite" />
              </path>
              <path
                d="M 198 -8 Q 144 -4, 114 90"
                fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.3"
              />
              <circle r="2" fill={POTIONS[1].color} opacity="0">
                <animate attributeName="cx" values="160;134;116" dur="0.9s" begin="0.3s" repeatCount="indefinite" />
                <animate attributeName="cy" values="10;50;90" dur="0.9s" begin="0.3s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.55;0.35;0" dur="0.9s" begin="0.3s" repeatCount="indefinite" />
              </circle>
            </g>
          )}

          {/* === BOTTLE BODY — open top, vintage outlined === */}
          <circle cx="110" cy="142" r="42" fill={GLASS} stroke={STROKE} strokeWidth="2.2" />
          <path d="M 82 120 Q 78 142 90 164" fill="none" stroke={GLASS_LIGHT} strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
          <path d="M 88 116 Q 82 140 94 160" fill="none" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity="0.3" />

          {/* Cameo decoration */}
          <circle cx="112" cy="138" r="8" fill={CREAM} stroke={STROKE} strokeWidth="0.9" opacity="0.5" />
          <circle cx="106" cy="133" r="4.5" fill={CREAM} stroke={STROKE} strokeWidth="0.7" opacity="0.4" />
          <circle cx="118" cy="133" r="4" fill={CREAM} stroke={STROKE} strokeWidth="0.7" opacity="0.4" />
          <circle cx="106" cy="144" r="3.8" fill={CREAM} stroke={STROKE} strokeWidth="0.7" opacity="0.35" />
          <circle cx="118" cy="143" r="3.8" fill={CREAM} stroke={STROKE} strokeWidth="0.7" opacity="0.35" />

          {/* Liquid inside bottle */}
          <g clipPath="url(#bottle-clip)">
            <rect
              x="68"
              y={184 - fillH}
              width="84"
              height={fillH}
              fill="url(#mixed-liquid)"
              style={{ transition: "all 1.4s cubic-bezier(.4,0,.2,1)" }}
            >
              {phase >= 2 && (
                <animate attributeName="y" values={`${184 - fillH};${182 - fillH};${184 - fillH}`} dur="2.5s" repeatCount="indefinite" />
              )}
            </rect>
            {fillH > 0 && (
              <ellipse
                cx="110"
                cy={184 - fillH}
                rx="40"
                ry="3"
                fill="white"
                opacity="0.35"
                style={{ transition: "cy 1.4s cubic-bezier(.4,0,.2,1)" }}
              >
                <animate attributeName="ry" values="2;4;2" dur="2s" repeatCount="indefinite" />
              </ellipse>
            )}
          </g>

          {/* Bubbles rising inside */}
          {phase >= 2 &&
            [
              { cx: 102, d: 0, dur: 2.4 },
              { cx: 110, d: 0.5, dur: 1.9 },
              { cx: 118, d: 1, dur: 2.6 },
            ].map((b, i) => (
              <circle key={i} cx={b.cx} r="1.6" fill="white" opacity="0">
                <animate attributeName="cy" values="175;125" dur={`${b.dur}s`} begin={`${b.d}s`} repeatCount="indefinite" />
                <animate attributeName="opacity" values="0;0.6;0" dur={`${b.dur}s`} begin={`${b.d}s`} repeatCount="indefinite" />
              </circle>
            ))}

          {/* Open neck — gold collar ring */}
          <rect x="96" y="96" width="28" height="10" rx="2" fill={GOLD} stroke={STROKE} strokeWidth="1.5" />
          <line x1="99" y1="102" x2="121" y2="102" stroke={GOLD_LIGHT} strokeWidth="1.2" strokeLinecap="round" />
          <rect x="100" y="92" width="20" height="5" rx="1.5" fill={GOLD_LIGHT} stroke={STROKE} strokeWidth="1.2" />
          <ellipse cx="110" cy="93" rx="8" ry="2.5" fill={STROKE} opacity="0.3" />
        </svg>

        {/* Sparkles when ready */}
        {phase >= 3 &&
          [
            { x: 20, y: 100 },
            { x: 180, y: 110 },
            { x: 35, y: 160 },
            { x: 170, y: 165 },
            { x: 100, y: 75 },
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
