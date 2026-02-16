"use client";

import { STRENGTHS } from "@/lib/constants";
import type { Strength } from "@/lib/types";

interface StrengthPickerProps {
  onSelect: (id: Strength) => void;
}

export default function StrengthPicker({ onSelect }: StrengthPickerProps) {
  return (
    <div className="flex flex-col gap-2.5 animate-fadeUp">
      {STRENGTHS.map((s) => (
        <div
          key={s.id}
          className="oc bg-white/[0.88] rounded-[18px] py-[18px] px-5 flex items-center gap-4 shadow-[0_2px_8px_rgba(0,40,80,0.04)]"
          onClick={() => onSelect(s.id)}
        >
          <div className="text-[32px] shrink-0">{s.emoji}</div>
          <div>
            <div className="text-[15px] font-extrabold text-[#1B3A5C]">{s.label}</div>
            <div className="text-xs text-[#5A7D99] font-medium mt-0.5">{s.desc}</div>
          </div>
          <div className="ml-auto flex gap-[3px] items-end">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-1 rounded-sm"
                style={{
                  background: i <= (s.id === "soft" ? 1 : s.id === "moderate" ? 2 : 3) ? "#4A8EC2" : "#D8E4EE",
                  height: i === 1 ? 10 : i === 2 ? 16 : 22,
                }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
