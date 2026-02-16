import type { Strength } from "@/lib/types";

interface SillageBadgeProps {
  level: Strength;
}

const labels: Record<Strength, string> = { soft: "Soft", moderate: "Moderate", strong: "Strong" };
const colors: Record<Strength, string> = { soft: "#7BC8A4", moderate: "#4A8EC2", strong: "#C75A7A" };
const bars: Record<Strength, number> = { soft: 1, moderate: 2, strong: 3 };

export default function SillageBadge({ level }: SillageBadgeProps) {
  return (
    <div className="flex items-center gap-[5px] mt-1">
      <div className="flex gap-0.5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="w-[3px] rounded-sm transition-colors duration-300"
            style={{
              height: i === 1 ? 8 : i === 2 ? 12 : 16,
              background: i <= bars[level] ? colors[level] : "#E0E8F0",
            }}
          />
        ))}
      </div>
      <span className="text-[9px] font-bold tracking-[0.5px]" style={{ color: colors[level] }}>
        {labels[level]}
      </span>
    </div>
  );
}
