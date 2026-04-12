import type { OuraMetrics, OuraAuth } from "./ouraClient";

const OURA_METRICS_KEY = "kaisey_oura_metrics";
const OURA_AUTH_KEY = "kaisey_oura_auth";
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

export function saveOuraMetrics(metrics: Omit<OuraMetrics, "auth">): void {
  localStorage.setItem(OURA_METRICS_KEY, JSON.stringify(metrics));
}

export function loadOuraMetrics(): Omit<OuraMetrics, "auth"> | null {
  const stored = localStorage.getItem(OURA_METRICS_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function isCacheValid(metrics: Omit<OuraMetrics, "auth"> | null): boolean {
  if (!metrics?.lastFetch) return false;
  return Date.now() - metrics.lastFetch < CACHE_DURATION;
}

export function saveOuraAuth(auth: OuraAuth): void {
  sessionStorage.setItem(OURA_AUTH_KEY, JSON.stringify(auth));
}

export function loadOuraAuth(): OuraAuth | null {
  const stored = sessionStorage.getItem(OURA_AUTH_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function clearOuraData(): void {
  localStorage.removeItem(OURA_METRICS_KEY);
  sessionStorage.removeItem(OURA_AUTH_KEY);
}

export function getOuraDataState(): { connected: boolean; hasData: boolean; cacheValid: boolean } {
  const auth = loadOuraAuth();
  const metrics = loadOuraMetrics();
  return {
    connected: !!auth,
    hasData: !!metrics && (metrics.sleep.length > 0 || metrics.activity.length > 0),
    cacheValid: isCacheValid(metrics),
  };
}
