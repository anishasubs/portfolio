import { Activity, TrendingUp } from "lucide-react";
import { Card } from "@/app/components/ui/card";
import type { OuraMetrics } from "@/utils/ouraClient";

interface OuraActivityCardProps {
  metrics: Omit<OuraMetrics, "auth"> | null;
  isLoading?: boolean;
}

export function OuraActivityCard({ metrics, isLoading }: OuraActivityCardProps) {
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

  if (!metrics || metrics.activity.length === 0) return null;

  const today = metrics.activity[metrics.activity.length - 1];
  const energyTarget = 500;
  const stepsTarget = 10000;
  const energyPct = Math.min(100, Math.round((today.activeEnergy / energyTarget) * 100));
  const stepsPct = Math.min(100, Math.round((today.steps / stepsTarget) * 100));

  // 7-day averages
  const avgEnergy = Math.round(metrics.activity.reduce((s, a) => s + a.activeEnergy, 0) / metrics.activity.length);
  const avgSteps = Math.round(metrics.activity.reduce((s, a) => s + a.steps, 0) / metrics.activity.length);

  // Activity assessment
  let level: "low" | "moderate" | "high";
  let levelColor: string;
  let levelAdvice: string;
  if (avgEnergy < 350) {
    level = "low";
    levelColor = "text-yellow-500";
    levelAdvice = "Schedule workouts or movement breaks between tasks.";
  } else if (avgEnergy >= 500) {
    level = "high";
    levelColor = "text-green-500";
    levelAdvice = "Great activity! Include adequate recovery time.";
  } else {
    level = "moderate";
    levelColor = "text-blue-500";
    levelAdvice = "Maintain this consistent routine.";
  }

  // Readiness
  const latestReadiness = metrics.readiness.length > 0
    ? metrics.readiness[metrics.readiness.length - 1].score
    : null;

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-orange-500" />
          <h3 className="font-semibold text-sm">Activity & Energy</h3>
        </div>
        {latestReadiness !== null && (
          <div className="text-right">
            <span className="text-[10px] text-muted-foreground">Readiness</span>
            <div className="text-lg font-bold">{latestReadiness}</div>
          </div>
        )}
      </div>

      {/* Active Energy */}
      <div className="mb-3">
        <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
          <span>Active Energy</span>
          <span>{today.activeEnergy} kcal / {energyTarget}</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-orange-500 transition-all duration-500"
            style={{ width: `${energyPct}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="mb-3">
        <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
          <span>Steps</span>
          <span>{today.steps.toLocaleString()} / {stepsTarget.toLocaleString()}</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-blue-500 transition-all duration-500"
            style={{ width: `${stepsPct}%` }}
          />
        </div>
      </div>

      {/* Activity level */}
      <div className={`text-xs ${levelColor} font-medium mb-1`}>
        {level === "low" ? "↓ Low Activity" : level === "high" ? "↑ High Activity" : "→ Moderate Activity"}
      </div>
      <p className="text-[10px] text-muted-foreground mb-3">{levelAdvice}</p>

      {/* 7-day average */}
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground border-t pt-2">
        <TrendingUp className="w-3 h-3" />
        <span>7-day avg: {avgEnergy} kcal/day | {avgSteps.toLocaleString()} steps/day</span>
      </div>
    </Card>
  );
}
