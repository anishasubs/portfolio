"use client";

import { PRICES } from "@/lib/constants";
import type { PriceOption } from "@/lib/types";

interface PriceSelectorProps {
  onSelect: (id: PriceOption) => void;
}

export default function PriceSelector({ onSelect }: PriceSelectorProps) {
  return (
    <div className="flex flex-col gap-2 animate-fadeUp">
      {PRICES.map((p) => (
        <div
          key={p.id}
          className="oc bg-white/[0.88] rounded-2xl py-3.5 px-5 flex justify-between items-center shadow-[0_2px_8px_rgba(0,40,80,0.04)]"
          onClick={() => onSelect(p.id)}
        >
          <div>
            <div className="text-sm font-extrabold text-[#1B3A5C]">{p.label}</div>
            <div className="text-[11px] text-[#5A7D99] font-medium mt-[1px]">{p.sub}</div>
          </div>
          <div className="text-base text-[#4A8EC2] font-extrabold">
            {p.id === "all" ? "\u2726" : p.id}
          </div>
        </div>
      ))}
    </div>
  );
}
