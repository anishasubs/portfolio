import type { ScoredPerfume } from "@/lib/types";
import SillageBadge from "./SillageBadge";

interface ResultCardProps {
  p: ScoredPerfume;
  i: number;
}

export default function ResultCard({ p, i }: ResultCardProps) {
  return (
    <div
      className="rc bg-white/[0.93] rounded-[22px] p-5 mb-4 shadow-[0_4px_24px_rgba(0,40,80,0.08)] relative overflow-hidden animate-cardIn"
      style={{ animationDelay: `${i * 0.25}s` }}
    >
      {i === 0 && (
        <div className="absolute top-3.5 right-3.5 bg-gradient-to-br from-[#4A8EC2] to-[#5BA3D9] text-white text-[9px] font-extrabold py-[5px] px-3 rounded-[20px] tracking-[1.5px]">
          BEST MATCH {"\u2726"}
        </div>
      )}

      <div className="flex gap-4">
        <div className="w-[85px] h-[105px] rounded-2xl bg-[#F0F5FA] flex items-center justify-center shrink-0 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={p.img}
            alt={p.name}
            className="max-w-[78%] max-h-[88%] object-contain"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
              target.parentElement!.innerHTML = '<div style="font-size:32px">\u{1F9F4}</div>';
            }}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-[10px] text-[#6B8CAE] font-bold tracking-[1.5px] mb-[3px]">{p.brand.toUpperCase()}</div>
          <div className="font-playfair text-[17px] font-bold text-[#1B3A5C] mb-1 leading-[1.25]">{p.name}</div>
          <SillageBadge level={p.sillage} />
          <div className="mt-1.5">
            <span className="text-lg font-black text-[#4A8EC2]">${p.price}</span>
            <span className="text-[10px] text-[#6B8CAE] font-semibold ml-1">full size bottle</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="mt-3.5 flex flex-wrap gap-[5px]">
        {p.notes.slice(0, 5).map((n) => (
          <span key={n} className="text-[10px] py-1 px-[11px] rounded-[20px] bg-[#EDF3F9] text-[#3A6B8C] font-semibold">
            {n}
          </span>
        ))}
      </div>

      {/* Match reasons */}
      {p.reasons.length > 0 && (
        <p className="mt-2.5 text-[11px] italic text-[#7A9BB5] leading-[1.5]">
          {p.reasons.slice(0, 2).join(" \u00B7 ")}
        </p>
      )}

    </div>
  );
}
