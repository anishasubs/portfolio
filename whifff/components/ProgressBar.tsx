import { TOTAL_STEPS } from "@/lib/constants";

interface ProgressBarProps {
  step: number;
}

export default function ProgressBar({ step }: ProgressBarProps) {
  return (
    <div className="max-w-[420px] mx-auto my-[18px] mb-[22px] px-9 flex gap-[5px]">
      {[...Array(TOTAL_STEPS)].map((_, i) => (
        <div
          key={i}
          className="flex-1 h-1 rounded-sm transition-all duration-500 ease-in-out"
          style={{
            background: i <= step ? "white" : "rgba(255,255,255,0.3)",
            boxShadow: i <= step ? "0 1px 6px rgba(0,40,80,0.1)" : "none",
          }}
        />
      ))}
    </div>
  );
}
