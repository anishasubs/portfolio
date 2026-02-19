"use client";

import { OCCASIONS } from "@/lib/constants";
import type { Occasion } from "@/lib/types";

interface OccasionGridProps {
  onSelect: (id: Occasion) => void;
}

export default function OccasionGrid({ onSelect }: OccasionGridProps) {
  return (
    <div className="grid grid-cols-2 gap-2.5 animate-fadeUp">
      {OCCASIONS.map((o) => (
        <div
          key={o.id}
          className="oc bg-white/[0.88] rounded-[18px] py-5 px-3.5 text-center shadow-[0_2px_8px_rgba(0,40,80,0.04)]"
          onClick={() => onSelect(o.id)}
        >
          <div className="text-[26px] mb-1.5">{o.emoji}</div>
          <div className="text-[13px] font-extrabold text-[#1B3A5C]">{o.label}</div>
        </div>
      ))}
    </div>
  );
}
