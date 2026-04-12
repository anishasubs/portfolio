import { Moon, TrendingUp } from "lucide-react";
import { Card } from "@/app/components/ui/card";
import type { OuraMetrics } from "@/utils/ouraClient";

interface OuraSleepCardProps {
  metrics: Omit<OuraMetrics, "auth"> | null;
  isLoading?: boolean;
}

export function OuraSleepCard({ metrics, isLoading }: OuraSleepCardProps) {
  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-muted rounded w-1/3" />
          <div className="h-8 bg-muted rounded w-1/4" />
          <div className="h-3 bg-muted rounded w-full" />
          <div className="h-3 bg-muted rounded w-2/3" />
        </div>
      </Card>
    );
  }

  if (!metrics || metrics.sleep.length === 0) return null;

  const lastNight = metrics.sleep[metrics.sleep.length - 1];
  const durationHours = Math.round((lastNight.duration / 3600) * 10) / 10;
  const targetHours = 8;
  const progressPct = Math.min(100, Math.round((durationHours / targetHours) * 100));

  const deepHours = Math.round((lastNight.deep / 3600) * 10) / 10;
  const remHours = Math.round((lastNight.rem / 3600) * 10) / 10;
  const lightHours = Math.max(0, Math.round((durationHours - deepHours - remHours) * 10) / 10);

  const totalComposition = deepHours + remHours + lightHours || 1;
  const deepPct = Math.round((deepHours / totalComposition) * 100);
  const remPct = Math.round((remHours / totalComposition) * 100);
  const lightPct = 100 - deepPct - remPct;

  // 3-day average
  const last3 = metrics.sleep.slice(-3);
  const avg3Duration = Math.round((last3.reduce((s, d) => s + d.duration, 0) / last3.length / 3600) * 10) / 10;
  const avg3Efficiency = Math.round(last3.reduce((s, d) => s + d.efficiency, 0) / last3.length);

  // Quality assessment
  let quality: "poor" | "fair" | "good";
  let qualityColor: string;
  let qualityAdvice: string;
  if (lastNight.efficiency < 70 || durationHours < 5) {
    quality = "poor";
    qualityColor = "text-red-500";
    qualityAdvice = "Consider a rest day. Avoid scheduling intensive tasks.";
  } else if (lastNight.efficiency < 85 || durationHours < 6.5) {
    quality = "fair";
    qualityColor = "text-yellow-500";
    qualityAdvice = "Try to get more sleep tonight. Avoid late scheduling.";
  } else {
    quality = "good";
    qualityColor = "text-green-500";
    qualityAdvice = "Great recovery! Ready for productivity.";
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Moon className="w-4 h-4 text-indigo-500" />
          <h3 className="font-semibold text-sm">Sleep Quality</h3>
        </div>
        <span className="text-2xl font-bold">{lastNight.efficiency}</span>
      </div>

      <p className="text-xs text-muted-foreground mb-3">
        Last night: {durationHours}h ({lastNight.efficiency}% efficiency)
      </p>

      {/* Duration progress */}
      <div className="mb-3">
        <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
          <span>Sleep Duration</span>
          <span>{durationHours}h / {targetHours}h target</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-indigo-500 transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Sleep composition */}
      <div className="mb-3">
        <p className="text-[10px] text-muted-foreground mb-1">Sleep Composition</p>
        <div className="h-2 rounded-full overflow-hidden flex">
          <div className="bg-indigo-700" style={{ width: `${deepPct}%` }} />
          <div className="bg-purple-500" style={{ width: `${remPct}%` }} />
          <div className="bg-blue-300" style={{ width: `${lightPct}%` }} />
        </div>
        <div className="flex gap-3 mt-1 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-700" />Deep {deepHours}h</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500" />REM {remHours}h</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-300" />Light {lightHours}h</span>
        </div>
      </div>

      {/* Quality assessment */}
      <div className={`text-xs ${qualityColor} font-medium mb-2`}>
        {quality === "poor" ? "⚠ Poor Sleep" : quality === "fair" ? "⚠ Fair Sleep" : "✓ Good Sleep"}
      </div>
      <p className="text-[10px] text-muted-foreground mb-3">{qualityAdvice}</p>

      {/* 3-day average */}
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground border-t pt-2">
        <TrendingUp className="w-3 h-3" />
        <span>3-day avg: {avg3Duration}h ({avg3Efficiency}% efficiency)</span>
      </div>
    </Card>
  );
}
