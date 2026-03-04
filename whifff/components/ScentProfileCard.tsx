"use client";

import { VIBES, FAMILIES } from "@/lib/constants";
import type { Vibe, ScentFamily, Occasion } from "@/lib/types";

interface ScentProfileCardProps {
  vibe: Vibe;
  scents: ScentFamily[];
  occasion: Occasion | null;
  strength: string | null;
}

const VIBE_COLORS: Record<Vibe, { from: string; to: string }> = {
  sensorial: { from: "#C2544A", to: "#D4766E" },
  assertion: { from: "#8B6EC2", to: "#A88ED8" },
  social: { from: "#4A8EC2", to: "#6BA8D8" },
  wellness: { from: "#5AAF6A", to: "#7CC48A" },
};

const OCCASION_LABELS: Record<string, string> = {
  everyday: "everyday wear",
  datenight: "date night",
  work: "the office",
  special: "going out",
};

const STRENGTH_LABELS: Record<string, string> = {
  soft: "a soft whisper",
  moderate: "a balanced presence",
  strong: "a bold entrance",
};

function buildExplanation(vibe: Vibe, scents: ScentFamily[], occasion: Occasion | null, strength: string | null): string {
  const v = VIBES.find((x) => x.id === vibe);
  if (!v) return "";

  const scentLabels = scents
    .map((s) => FAMILIES.find((f) => f.id === s)?.label.toLowerCase())
    .filter(Boolean)
    .slice(0, 2);

  const parts: string[] = [];
  parts.push(`you want to be perceived as ${v.label.toLowerCase()}`);
  if (scentLabels.length > 0) {
    parts.push(`you're drawn to ${scentLabels.join(" & ")} scents`);
  }
  if (occasion) {
    parts.push(`you're looking for ${OCCASION_LABELS[occasion] || occasion}`);
  }
  if (strength) {
    parts.push(`you prefer ${STRENGTH_LABELS[strength] || strength}`);
  }

  return parts.join(" · ");
}

function ShareIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

export default function ScentProfileCard({ vibe, scents, occasion, strength }: ScentProfileCardProps) {
  const v = VIBES.find((x) => x.id === vibe);
  if (!v) return null;

  const colors = VIBE_COLORS[vibe];
  const explanation = buildExplanation(vibe, scents, occasion, strength);

  const handleShare = async () => {
    const text = `I got "${v.profileName}" on the whifff scent quiz! ${v.profileDesc}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "My Scent Profile — whifff", text, url: window.location.href });
      } catch {}
    } else {
      await navigator.clipboard.writeText(text);
    }
  };

  return (
    <div className="mb-5 animate-cardIn">
      <div
        className="rounded-[22px] p-5 pb-6 text-center relative overflow-hidden"
        style={{
          background: `linear-gradient(145deg, ${colors.from} 0%, ${colors.to} 100%)`,
        }}
      >
        {/* Pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: "radial-gradient(circle at 20% 30%, white 1px, transparent 1px), radial-gradient(circle at 80% 70%, white 1px, transparent 1px)",
            backgroundSize: "40px 40px, 60px 60px",
          }}
        />

        {/* Share button */}
        <button
          onClick={handleShare}
          className="absolute top-4 right-4 text-white/50 hover:text-white/90 transition-colors z-10"
          aria-label="Share your scent profile"
        >
          <ShareIcon />
        </button>

        <div className="relative">
          <div className="text-[9px] font-extrabold text-white/60 tracking-[2px] uppercase mb-1">
            Your Scent Profile
          </div>

          <div className="text-[28px] mb-1">{v.emoji}</div>

          <h3 className="font-playfair text-[22px] font-bold text-white leading-tight mb-2">
            {v.profileName}
          </h3>

          <p className="text-[12px] text-white/85 leading-relaxed max-w-[300px] mx-auto mb-3">
            {v.profileDesc}
          </p>

          {/* Choice-based explanation */}
          <p className="text-[10px] text-white/55 leading-relaxed max-w-[320px] mx-auto italic">
            {explanation}
          </p>
        </div>
      </div>
    </div>
  );
}
