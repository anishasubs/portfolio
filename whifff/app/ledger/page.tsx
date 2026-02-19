"use client";

import { useState, useEffect, useCallback } from "react";

interface PublicSession {
  completedAt: string;
  pastPerfumeNames: string[];
  scentFamilies: string[];
  occasion: string | null;
  strength: string | null;
  priceRange: string | null;
  recommendedPerfumeNames: string[];
  deviceType: string;
}

const FAMILY_COLORS: Record<string, string> = {
  floral: "#E8B4CB",
  woody: "#C4A882",
  fresh: "#A8D8B9",
  oriental: "#D4A574",
  citrus: "#F5D76E",
  aquatic: "#8EC8E8",
  gourmand: "#E8A87C",
  spicy: "#D4837C",
  green: "#9DC183",
  powdery: "#D4C4D4",
  fruity: "#F5A0A0",
  musk: "#C8B8A8",
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const seconds = Math.floor((now - then) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

const PAGE_SIZE = 20;

export default function LedgerPage() {
  const [sessions, setSessions] = useState<PublicSession[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchSessions = useCallback(async (offset: number, append: boolean) => {
    if (append) setLoadingMore(true); else setLoading(true);
    try {
      const res = await fetch(`/api/sessions/list?limit=${PAGE_SIZE}&offset=${offset}`);
      if (!res.ok) return;
      const data = await res.json();
      setSessions((prev) => append ? [...prev, ...data.sessions] : data.sessions);
      setTotal(data.total);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions(0, false);
  }, [fetchSessions]);

  const hasMore = sessions.length < total;

  return (
    <div className="min-h-screen bg-[#F5F9FD] p-6 sm:p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <a
            href="https://anishasubs.github.io/portfolio/whifff-case-study/index.html"
            className="inline-block text-xs font-semibold text-[#4A8EC2] hover:text-[#1B3A5C] transition-colors mb-3"
          >
            &larr; back to whifff
          </a>
          <h1 className="text-2xl font-bold text-[#1B3A5C]">Quiz Results Ledger</h1>
          <p className="text-sm text-[#6B8CAE] mt-1">
            See what others chose and got recommended &mdash; {total} completed {total === 1 ? "quiz" : "quizzes"}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border-2 border-[#4A8EC2] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="bg-white rounded-xl p-10 shadow-sm text-center">
            <p className="text-[#6B8CAE]">No completed quizzes yet. Be the first!</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {sessions.map((s, i) => (
                <div key={i} className="bg-white rounded-xl p-5 shadow-sm">
                  {/* Header: past perfumes + timestamp */}
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      {s.pastPerfumeNames.length > 0 ? (
                        <p className="text-sm text-[#1B3A5C]">
                          <span className="font-medium">Wore:</span>{" "}
                          {s.pastPerfumeNames.join(", ")}
                        </p>
                      ) : (
                        <p className="text-sm text-[#6B8CAE] italic">No past perfumes entered</p>
                      )}
                    </div>
                    <span className="text-xs text-[#6B8CAE] whitespace-nowrap shrink-0">
                      {timeAgo(s.completedAt)}
                    </span>
                  </div>

                  {/* Recommendations */}
                  {s.recommendedPerfumeNames.length > 0 && (
                    <div className="mb-3">
                      <p className="text-[10px] font-bold text-[#6B8CAE] tracking-wide uppercase mb-1.5">Recommended</p>
                      <div className="flex flex-wrap gap-2">
                        {s.recommendedPerfumeNames.map((name, j) => (
                          <span
                            key={j}
                            className="text-xs bg-[#F0F5FA] text-[#1B3A5C] px-2.5 py-1 rounded-lg font-medium"
                          >
                            {name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bottom: scent families, occasion, strength, budget */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {s.scentFamilies.map((f) => (
                      <span
                        key={f}
                        className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                        style={{
                          backgroundColor: (FAMILY_COLORS[f.toLowerCase()] || "#ddd") + "30",
                          color: FAMILY_COLORS[f.toLowerCase()] ? "#1B3A5C" : "#6B8CAE",
                          border: `1px solid ${FAMILY_COLORS[f.toLowerCase()] || "#ccc"}`,
                        }}
                      >
                        {f}
                      </span>
                    ))}
                    {(s.occasion || s.strength || s.priceRange) && s.scentFamilies.length > 0 && (
                      <span className="text-[#ccc] mx-0.5">&middot;</span>
                    )}
                    {[s.occasion, s.strength, s.priceRange].filter(Boolean).map((val, j) => (
                      <span key={j} className="text-[10px] text-[#6B8CAE] font-medium">{val}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {hasMore && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={() => fetchSessions(sessions.length, true)}
                  disabled={loadingMore}
                  className="text-sm font-semibold text-[#4A8EC2] hover:text-[#1B3A5C] disabled:opacity-50 transition-colors"
                >
                  {loadingMore ? "Loading..." : "Load more"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
