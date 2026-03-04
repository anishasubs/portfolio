"use client";

import { VIBES } from "@/lib/constants";
import type { Vibe } from "@/lib/types";

interface VibeGridProps {
  onSelect: (id: Vibe) => void;
}

export default function VibeGrid({ onSelect }: VibeGridProps) {
  return (
    <div className="grid grid-cols-2 gap-2.5 animate-fadeUp">
      {VIBES.map((v) => (
        <div
          key={v.id}
          className="oc bg-white/[0.88] rounded-[18px] py-5 px-3.5 text-center shadow-[0_2px_8px_rgba(0,40,80,0.04)]"
          onClick={() => onSelect(v.id)}
        >
          <div className="text-[26px] mb-1.5">{v.emoji}</div>
          <div className="text-[13px] font-extrabold text-[#1B3A5C]">{v.label}</div>
          <div className="text-[10px] text-[#6B8CAE] mt-1 font-semibold leading-tight">{v.desc}</div>
        </div>
      ))}
    </div>
  );
}
