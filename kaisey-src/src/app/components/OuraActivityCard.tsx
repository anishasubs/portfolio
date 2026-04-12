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
  let levelBg: string;
  let levelAdvice: string;
  if (avgEnergy < 350) {
    level = "low";
    levelColor = "text-yellow-600";
    levelBg = "bg-yellow-50 border-yellow-200";
    levelAdvice = "Schedule workouts or movement breaks between tasks.";
  } else if (avgEnergy >= 500) {
    level = "high";
    levelColor = "text-green-600";
    levelBg = "bg-green-50 border-green-200";
    levelAdvice = "Great activity! Include adequate recovery time.";
  } else {
    level = "moderate";
    levelColor = "text-blue-600";
    levelBg = "bg-blue-50 border-blue-200";
    levelAdvice = "Maintain this consistent routine.";
  }

  // Readiness
  const latestReadiness = metrics.readiness.length > 0
    ? metrics.readiness[metrics.readiness.length - 1].score
    : null;

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-orange-100">
            <Activity className="w-5 h-5 text-orange-600" />
          </div>
          <h3 className="font-semibold text-base">Activity & Energy</h3>
        </div>
        {latestReadiness !== null && (
          <div className="text-right">
            <p className="text-xs text-muted-foreground mb-0.5">Readiness</p>
            <span className="text-3xl font-bold">{latestReadiness}</span>
            <span className="text-sm text-muted-foreground ml-1">/100</span>
          </div>
        )}
      </div>

      {/* Active Energy */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1.5">
          <span className="text-muted-foreground">Active Energy</span>
          <span className="font-medium">{today.activeEnergy} kcal / {energyTarget}</span>
        </div>
        <div className="h-3 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-orange-500 transition-all duration-500"
            style={{ width: `${energyPct}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1.5">
          <span className="text-muted-foreground">Steps</span>
          <span className="font-medium">{today.steps.toLocaleString()} / {stepsTarget.toLocaleString()}</span>
        </div>
        <div className="h-3 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-blue-500 transition-all duration-500"
            style={{ width: `${stepsPct}%` }}
          />
        </div>
      </div>

      {/* Activity level */}
      <div className={`rounded-lg border p-3 mb-4 ${levelBg}`}>
        <p className={`text-sm font-semibold ${levelColor} mb-1`}>
          {level === "low" ? "Low Activity" : level === "high" ? "High Activity" : "Moderate Activity"}
        </p>
        <p className="text-sm text-muted-foreground">{levelAdvice}</p>
      </div>

      {/* 7-day average */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground border-t pt-3">
        <TrendingUp className="w-4 h-4" />
        <span>7-day avg: <span className="font-medium text-foreground">{avgEnergy} kcal/day</span> | {avgSteps.toLocaleString()} steps/day</span>
      </div>
    </Card>
  );
}
