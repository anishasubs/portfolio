import type { OuraMetrics } from "./ouraClient";

interface OuraContext {
  activityLevelLast7Days: "low" | "moderate" | "high";
  averageActiveEnergy: number;
  averageSteps: number;
  averageSleepHours: number;
  recentReadinessScore: number;
  recommendedRecoveryLevel: "rest-day" | "light-activity" | "normal" | "push";
  promptAddition: string;
}

export function buildOuraContext(metrics: Omit<OuraMetrics, "auth">): OuraContext | null {
  if (!metrics.sleep.length && !metrics.activity.length) return null;

  const avgEnergy = metrics.activity.length > 0
    ? Math.round(metrics.activity.reduce((s, a) => s + a.activeEnergy, 0) / metrics.activity.length)
    : 0;

  const avgSteps = metrics.activity.length > 0
    ? Math.round(metrics.activity.reduce((s, a) => s + a.steps, 0) / metrics.activity.length)
    : 0;

  const avgSleepSec = metrics.sleep.length > 0
    ? metrics.sleep.reduce((s, d) => s + d.duration, 0) / metrics.sleep.length
    : 0;
  const avgSleepHours = Math.round((avgSleepSec / 3600) * 10) / 10;

  const recentReadiness = metrics.readiness.length > 0
    ? metrics.readiness[metrics.readiness.length - 1].score
    : 0;

  const last3Readiness = metrics.readiness.slice(-3);
  const avgReadiness = last3Readiness.length > 0
    ? Math.round(last3Readiness.reduce((s, r) => s + r.score, 0) / last3Readiness.length)
    : 0;

  const activityLevel: "low" | "moderate" | "high" =
    avgEnergy < 350 ? "low" : avgEnergy >= 500 ? "high" : "moderate";

  let recoveryLevel: "rest-day" | "light-activity" | "normal" | "push";
  if (avgReadiness < 50 || avgSleepHours < 5) {
    recoveryLevel = "rest-day";
  } else if (avgReadiness < 65 || avgSleepHours < 6) {
    recoveryLevel = "light-activity";
  } else if (avgReadiness >= 80 && avgSleepHours >= 7) {
    recoveryLevel = "push";
  } else {
    recoveryLevel = "normal";
  }

  const activityRec = getActivityRecommendation(activityLevel, recoveryLevel);

  const promptAddition = `[Oura Health Context]
User's 7-day activity level: ${activityLevel.toUpperCase()} (${avgEnergy} kcal/day, ${avgSteps.toLocaleString()} steps/day)
Recent sleep: ${avgSleepHours} hours/night${metrics.sleep.length > 0 ? ` (${metrics.sleep[metrics.sleep.length - 1].efficiency}% efficiency)` : ""}
Readiness score: ${recentReadiness}/100
Recommended recovery: ${recoveryLevel.toUpperCase()}

${activityRec}

Use this health context when scheduling:
- If recovery is "rest-day": avoid intense tasks, suggest breaks, recommend lighter schedule
- If recovery is "light-activity": moderate workload, include movement breaks
- If recovery is "normal": standard scheduling
- If recovery is "push": user is well-rested, can handle demanding schedule`;

  return {
    activityLevelLast7Days: activityLevel,
    averageActiveEnergy: avgEnergy,
    averageSteps: avgSteps,
    averageSleepHours: avgSleepHours,
    recentReadinessScore: recentReadiness,
    recommendedRecoveryLevel: recoveryLevel,
    promptAddition,
  };
}

function getActivityRecommendation(
  activity: "low" | "moderate" | "high",
  recovery: "rest-day" | "light-activity" | "normal" | "push"
): string {
  if (recovery === "rest-day") {
    return "Health recommendation: User needs rest. Suggest moving non-critical tasks and scheduling recovery time.";
  }
  if (activity === "low") {
    return "Health recommendation: Low activity detected. Suggest scheduling workout blocks or movement breaks between tasks.";
  }
  if (activity === "high" && recovery !== "push") {
    return "Health recommendation: High activity with moderate recovery. Balance with adequate rest time between demanding tasks.";
  }
  if (recovery === "push") {
    return "Health recommendation: User is well-recovered and active. Good day for demanding tasks and intense focus blocks.";
  }
  return "Health recommendation: Moderate activity and recovery. Maintain balanced scheduling with regular breaks.";
}
