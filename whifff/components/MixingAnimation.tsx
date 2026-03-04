"use client";

import Sparkle from "./Sparkle";
import ScentKeyAnim from "./ScentKeyAnim";

interface MixingAnimationProps {
  phase: number;
  notes: string[];
}

export default function MixingAnimation({ phase, notes }: MixingAnimationProps) {
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

      {/* Scent Key + capsules animation */}
      <div className="relative">
        <div className={phase >= 3 ? "animate-keyFloat" : phase >= 2 ? "animate-keyAssemble" : ""}>
          <ScentKeyAnim size={240} loop={phase >= 3} />
        </div>

        {/* Sparkles when ready */}
        {phase >= 3 &&
          [
            { x: 10, y: 30 },
            { x: 220, y: 40 },
            { x: 30, y: 130 },
            { x: 210, y: 135 },
            { x: 120, y: 15 },
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
            ? "selecting your capsules..."
            : phase < 3
              ? "assembling your scent key..."
              : "your discovery kit is ready \u2726"}
      </p>
    </div>
  );
}
