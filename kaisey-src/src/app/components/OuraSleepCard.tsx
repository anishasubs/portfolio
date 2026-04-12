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
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-5 bg-muted rounded w-1/3" />
          <div className="h-10 bg-muted rounded w-1/4" />
          <div className="h-4 bg-muted rounded w-full" />
          <div className="h-4 bg-muted rounded w-2/3" />
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
  let qualityBg: string;
  let qualityAdvice: string;
  if (lastNight.efficiency < 70 || durationHours < 5) {
    quality = "poor";
    qualityColor = "text-red-600";
    qualityBg = "bg-red-50 border-red-200";
    qualityAdvice = "Consider a rest day. Avoid scheduling intensive tasks.";
  } else if (lastNight.efficiency < 85 || durationHours < 6.5) {
    quality = "fair";
    qualityColor = "text-yellow-600";
    qualityBg = "bg-yellow-50 border-yellow-200";
    qualityAdvice = "Try to get more sleep tonight. Avoid late scheduling.";
  } else {
    quality = "good";
    qualityColor = "text-green-600";
    qualityBg = "bg-green-50 border-green-200";
    qualityAdvice = "Great recovery! Ready for productivity.";
  }

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-indigo-100">
            <Moon className="w-5 h-5 text-indigo-600" />
          </div>
          <h3 className="font-semibold text-base">Sleep Quality</h3>
        </div>
        <div className="text-right">
          <span className="text-3xl font-bold">{lastNight.efficiency}</span>
          <span className="text-sm text-muted-foreground ml-1">/100</span>
        </div>
      </div>

      {/* Last night summary */}
      <p className="text-sm text-muted-foreground mb-4">
        Last night: <span className="font-medium text-foreground">{durationHours}h</span> ({lastNight.efficiency}% efficiency)
      </p>

      {/* Duration progress */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1.5">
          <span className="text-muted-foreground">Sleep Duration</span>
          <span className="font-medium">{durationHours}h / {targetHours}h</span>
        </div>
        <div className="h-3 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-indigo-500 transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Sleep composition */}
      <div className="mb-4">
        <p className="text-sm text-muted-foreground mb-1.5">Sleep Composition</p>
        <div className="h-3 rounded-full overflow-hidden flex">
          <div className="bg-indigo-700" style={{ width: `${deepPct}%` }} />
          <div className="bg-purple-500" style={{ width: `${remPct}%` }} />
          <div className="bg-blue-300" style={{ width: `${lightPct}%` }} />
        </div>
        <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-700" />Deep {deepHours}h</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500" />REM {remHours}h</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-300" />Light {lightHours}h</span>
        </div>
      </div>

      {/* Quality assessment */}
      <div className={`rounded-lg border p-3 mb-4 ${qualityBg}`}>
        <p className={`text-sm font-semibold ${qualityColor} mb-1`}>
          {quality === "poor" ? "Poor Sleep" : quality === "fair" ? "Fair Sleep" : "Good Sleep"}
        </p>
        <p className="text-sm text-muted-foreground">{qualityAdvice}</p>
      </div>

      {/* 3-day average */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground border-t pt-3">
        <TrendingUp className="w-4 h-4" />
        <span>3-day avg: <span className="font-medium text-foreground">{avg3Duration}h</span> ({avg3Efficiency}% efficiency)</span>
      </div>
    </Card>
  );
}
