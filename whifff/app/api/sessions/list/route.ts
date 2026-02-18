import { NextRequest, NextResponse } from "next/server";
import { listCompletedSessions } from "@/lib/session";

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") || "20", 10) || 20, 1), 50);
  const offset = Math.max(parseInt(url.searchParams.get("offset") || "0", 10) || 0, 0);

  const { sessions, total } = await listCompletedSessions(limit, offset);

  const publicSessions = sessions.map((s) => ({
    completedAt: s.completedAt,
    pastPerfumeNames: s.pastPerfumeNames,
    scentFamilies: s.scentFamilies,
    occasion: s.occasion,
    strength: s.strength,
    priceRange: s.priceRange,
    recommendedPerfumeNames: s.recommendedPerfumeNames.slice(0, 3),
    deviceType: s.deviceType,
  }));

  return NextResponse.json({ sessions: publicSessions, total });
}
