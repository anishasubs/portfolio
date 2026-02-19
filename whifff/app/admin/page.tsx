"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface Stats {
  total: number;
  completed: number;
  completionRate: number;
  dropOff: Record<number, number>;
  topFamilies: [string, number][];
  topRecommended: [string, number][];
  topOccasions: [string, number][];
  deviceBreakdown: Record<string, number>;
}

const STEP_LABELS = ["Past Perfumes", "Scent Families", "Price", "Occasion", "Strength", "Mixing"];
const STORAGE_KEY = "whifff_admin_key";

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");
  const [key, setKey] = useState("");
  const [loaded, setLoaded] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load API key from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setKey(saved);
  }, []);

  const fetchStats = useCallback(async () => {
    setError("");
    const res = await fetch("/api/sessions/stats", {
      headers: key ? { "x-admin-key": key } : {},
    });
    if (!res.ok) {
      setError(res.status === 401 ? "Invalid API key" : "Failed to fetch stats");
      return;
    }
    const data = await res.json();
    setStats(data);
    if (!loaded) {
      setLoaded(true);
      // Persist key on first successful load
      if (key) localStorage.setItem(STORAGE_KEY, key);
    }
  }, [key, loaded]);

  // Initial fetch (waits for key to load from localStorage)
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      // Small delay to let state settle
      const t = setTimeout(() => fetchStats(), 50);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-refresh every 60 seconds once loaded
  useEffect(() => {
    if (!loaded) return;
    intervalRef.current = setInterval(fetchStats, 60_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [loaded, fetchStats]);

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setKey("");
    setLoaded(false);
    setStats(null);
  };

  // Compute device percentages
  const deviceTotal = stats ? Object.values(stats.deviceBreakdown).reduce((a, b) => a + b, 0) : 0;
  const devicePct = (type: string) => {
    if (!stats || deviceTotal === 0) return 0;
    return Math.round(((stats.deviceBreakdown[type] || 0) / deviceTotal) * 100);
  };

  return (
    <div className="min-h-screen bg-[#F5F9FD] p-8 font-sans">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-[#1B3A5C]">whifff admin</h1>
          {loaded && (
            <button onClick={handleLogout} className="text-xs text-[#6B8CAE] hover:text-[#C75A7A]">
              Logout
            </button>
          )}
        </div>

        {!loaded && (
          <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
            <label className="block text-sm font-medium text-[#1B3A5C] mb-2">Admin API Key</label>
            <div className="flex gap-2">
              <input
                type="password"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchStats()}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                placeholder="Enter key..."
              />
              <button onClick={fetchStats} className="bg-[#4A8EC2] text-white px-4 py-2 rounded-lg text-sm font-semibold">
                Load
              </button>
            </div>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </div>
        )}

        {stats && (
          <>
            {/* Overview */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-xl p-5 shadow-sm text-center">
                <div className="text-3xl font-bold text-[#4A8EC2]">{stats.total}</div>
                <div className="text-xs text-[#6B8CAE] mt-1 font-medium">Total Sessions</div>
              </div>
              <div className="bg-white rounded-xl p-5 shadow-sm text-center">
                <div className="text-3xl font-bold text-[#7BC8A4]">{stats.completed}</div>
                <div className="text-xs text-[#6B8CAE] mt-1 font-medium">Completed</div>
              </div>
              <div className="bg-white rounded-xl p-5 shadow-sm text-center">
                <div className="text-3xl font-bold text-[#C75A7A]">{stats.completionRate}%</div>
                <div className="text-xs text-[#6B8CAE] mt-1 font-medium">Completion Rate</div>
              </div>
            </div>

            {/* Device Breakdown */}
            {deviceTotal > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
                <h2 className="text-sm font-bold text-[#1B3A5C] mb-4">Device Breakdown</h2>
                <div className="flex gap-6">
                  {Object.entries(stats.deviceBreakdown).map(([type, count]) => (
                    <div key={type} className="flex-1 text-center">
                      <div className="text-2xl font-bold text-[#4A8EC2]">{devicePct(type)}%</div>
                      <div className="text-xs text-[#6B8CAE] mt-1 capitalize">{type}</div>
                      <div className="text-xs text-[#6B8CAE]">({count})</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Drop-off by step */}
            <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
              <h2 className="text-sm font-bold text-[#1B3A5C] mb-4">Drop-off by Step</h2>
              <div className="space-y-2">
                {STEP_LABELS.map((label, i) => {
                  const count = stats.dropOff[i] || 0;
                  const maxCount = Math.max(...Object.values(stats.dropOff), 1);
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div className="text-xs text-[#6B8CAE] w-28 shrink-0">{label}</div>
                      <div className="flex-1 bg-[#F0F5FA] rounded-full h-5 overflow-hidden">
                        <div
                          className="bg-[#4A8EC2] h-full rounded-full transition-all duration-500"
                          style={{ width: `${(count / maxCount) * 100}%` }}
                        />
                      </div>
                      <div className="text-xs font-bold text-[#1B3A5C] w-8 text-right">{count}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top scent families */}
            {stats.topFamilies.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
                <h2 className="text-sm font-bold text-[#1B3A5C] mb-4">Top Scent Families</h2>
                <div className="space-y-2">
                  {stats.topFamilies.map(([family, count]) => (
                    <div key={family} className="flex justify-between items-center">
                      <span className="text-sm text-[#1B3A5C] capitalize">{family}</span>
                      <span className="text-sm font-bold text-[#4A8EC2]">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top occasions */}
            {stats.topOccasions.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
                <h2 className="text-sm font-bold text-[#1B3A5C] mb-4">Top Occasions</h2>
                <div className="space-y-2">
                  {stats.topOccasions.map(([occ, count]) => (
                    <div key={occ} className="flex justify-between items-center">
                      <span className="text-sm text-[#1B3A5C] capitalize">{occ}</span>
                      <span className="text-sm font-bold text-[#4A8EC2]">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top recommended */}
            {stats.topRecommended.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
                <h2 className="text-sm font-bold text-[#1B3A5C] mb-4">Top Recommended Perfumes</h2>
                <div className="space-y-2">
                  {stats.topRecommended.map(([name, count]) => (
                    <div key={name} className="flex justify-between items-center">
                      <span className="text-sm text-[#1B3A5C]">{name}</span>
                      <span className="text-sm font-bold text-[#4A8EC2]">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <button onClick={fetchStats} className="text-sm text-[#4A8EC2] font-semibold hover:underline">
                Refresh
              </button>
              <span className="text-xs text-[#6B8CAE]">Auto-refreshes every 60s</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
