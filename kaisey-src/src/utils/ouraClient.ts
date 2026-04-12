import { env } from "@/config/env";

export interface OuraAuth {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface OuraSleepData {
  date: string;
  duration: number;
  efficiency: number;
  restfulness: number;
  latency: number;
  deep: number;
  rem: number;
  awakeTime: number;
}

export interface OuraActivityData {
  date: string;
  activeEnergy: number;
  steps: number;
  avgHeartRate: number;
  peakHeartRate: number;
  equivalentWalkingDistance: number;
  nonWearTime: number;
  inactivityAlerts: number;
}

export interface OuraReadinessData {
  date: string;
  score: number;
  sleepLatency: number;
  sleepDuration: number;
  sleepEfficiency: number;
  previousNight: number;
  activityBalance: number;
  bodyRecoveryIndex: number;
  heartRateVariability: number;
}

export interface OuraMetrics {
  lastFetch: number;
  sleep: OuraSleepData[];
  activity: OuraActivityData[];
  readiness: OuraReadinessData[];
  auth: OuraAuth;
}

/** Build the Oura OAuth authorization URL and redirect */
export function initOuraOAuth(): void {
  const clientId = env.health.ouraClientId;
  if (!clientId) {
    throw new Error("Oura Client ID not configured");
  }

  const redirectUri = env.health.ouraRedirectUri;
  const scopes = "personal sleep daily_activity daily_readiness";

  const authUrl = `https://cloud.ouraring.com/oauth/authorize?${new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: scopes,
    state: "kaisey_oura_auth",
  })}`;

  sessionStorage.setItem("kaisey_oura_auth_in_progress", "true");
  window.location.href = authUrl;
}

/** Exchange authorization code for tokens via backend proxy */
export async function exchangeOuraCode(code: string): Promise<OuraAuth> {
  const proxyUrl = env.openai.proxyUrl.replace("/api/chat", "/api/oura");

  const response = await fetch(proxyUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "exchange", code, redirectUri: env.health.ouraRedirectUri }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Oura token exchange failed: ${response.status}`);
  }

  return response.json();
}

/** Refresh an expired Oura token via backend proxy */
export async function refreshOuraToken(refreshToken: string): Promise<OuraAuth> {
  const proxyUrl = env.openai.proxyUrl.replace("/api/chat", "/api/oura");

  const response = await fetch(proxyUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "refresh", refreshToken }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Oura token refresh failed: ${response.status}`);
  }

  return response.json();
}

/** Check if the Oura token is expired (with 5-min buffer) */
export function isTokenExpired(auth: OuraAuth): boolean {
  return Date.now() >= auth.expiresAt - 5 * 60 * 1000;
}

/** Fetch 7 days of Oura health data */
export async function fetchOuraData(accessToken: string, days = 7): Promise<Omit<OuraMetrics, "auth">> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const start = startDate.toISOString().split("T")[0];
  const end = endDate.toISOString().split("T")[0];

  const headers = { Authorization: `Bearer ${accessToken}` };

  const [sleepRes, activityRes, readinessRes] = await Promise.all([
    fetch(`https://api.ouraring.com/v2/usercollection/daily_sleep?start_date=${start}&end_date=${end}`, { headers }),
    fetch(`https://api.ouraring.com/v2/usercollection/daily_activity?start_date=${start}&end_date=${end}`, { headers }),
    fetch(`https://api.ouraring.com/v2/usercollection/daily_readiness?start_date=${start}&end_date=${end}`, { headers }),
  ]);

  if (!sleepRes.ok || !activityRes.ok || !readinessRes.ok) {
    const failedEndpoint = !sleepRes.ok ? "sleep" : !activityRes.ok ? "activity" : "readiness";
    throw new Error(`Oura API error fetching ${failedEndpoint}`);
  }

  const [sleepData, activityData, readinessData] = await Promise.all([
    sleepRes.json(),
    activityRes.json(),
    readinessRes.json(),
  ]);

  return {
    lastFetch: Date.now(),
    sleep: (sleepData.data || []).map((s: any) => ({
      date: s.day,
      duration: s.contributors?.total_sleep ?? 0,
      efficiency: s.contributors?.efficiency ?? 0,
      restfulness: s.contributors?.restfulness ?? 0,
      latency: s.contributors?.latency ?? 0,
      deep: s.contributors?.deep_sleep ?? 0,
      rem: s.contributors?.rem_sleep ?? 0,
      awakeTime: s.contributors?.timing ?? 0,
    })),
    activity: (activityData.data || []).map((a: any) => ({
      date: a.day,
      activeEnergy: a.active_calories ?? 0,
      steps: a.steps ?? 0,
      avgHeartRate: a.average_met_minutes ?? 0,
      peakHeartRate: a.high_activity_met_minutes ?? 0,
      equivalentWalkingDistance: a.equivalent_walking_distance ?? 0,
      nonWearTime: a.non_wear_minutes ?? 0,
      inactivityAlerts: a.inactivity_alerts ?? 0,
    })),
    readiness: (readinessData.data || []).map((r: any) => ({
      date: r.day,
      score: r.score ?? 0,
      sleepLatency: r.contributors?.sleep_balance ?? 0,
      sleepDuration: r.contributors?.previous_night ?? 0,
      sleepEfficiency: r.contributors?.sleep_balance ?? 0,
      previousNight: r.contributors?.previous_night ?? 0,
      activityBalance: r.contributors?.activity_balance ?? 0,
      bodyRecoveryIndex: r.contributors?.body_temperature ?? 0,
      heartRateVariability: r.contributors?.hrv_balance ?? 0,
    })),
  };
}
