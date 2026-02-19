"use client";

import { FAMILIES } from "@/lib/constants";
import type { ScentFamily } from "@/lib/types";

interface ScentFamilyGridProps {
  selected: ScentFamily[];
  onToggle: (id: ScentFamily) => void;
  onNext: () => void;
}

export default function ScentFamilyGrid({ selected, onToggle, onNext }: ScentFamilyGridProps) {
  return (
    <div className="animate-fadeUp">
      <div className="grid grid-cols-2 gap-2.5 mb-[18px]">
        {FAMILIES.map((f) => {
          const sel = selected.includes(f.id);
          return (
            <div
              key={f.id}
              className="oc rounded-[18px] p-4 px-3 text-center"
              onClick={() => onToggle(f.id)}
              role="checkbox"
              aria-checked={sel}
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && onToggle(f.id)}
              style={{
                background: sel ? "white" : "rgba(255,255,255,0.82)",
                border: sel ? "2px solid #4A8EC2" : "2px solid transparent",
                boxShadow: sel ? "0 4px 16px rgba(0,40,80,0.12)" : "0 2px 8px rgba(0,40,80,0.04)",
              }}
            >
              <div className="text-2xl mb-[5px]">{f.emoji}</div>
              <div className="text-[13px] font-extrabold text-[#1B3A5C] mb-0.5">{f.label}</div>
              <div className="text-[10px] text-[#5A7D99] font-medium">{f.desc}</div>
            </div>
          );
        })}
      </div>
      <button
        className="bp w-full p-[15px] rounded-full text-sm font-extrabold text-[#4A8EC2]"
        disabled={selected.length === 0}
        onClick={onNext}
        style={{
          background: selected.length > 0 ? "white" : "rgba(255,255,255,0.5)",
          boxShadow: selected.length > 0 ? "0 4px 16px rgba(0,40,80,0.1)" : "none",
        }}
      >
        next &rarr;
      </button>
    </div>
  );
}
