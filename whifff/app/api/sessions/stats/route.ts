import { NextRequest, NextResponse } from "next/server";
import { getStats } from "@/lib/session";

export async function GET(request: NextRequest) {
  const apiKey = request.headers.get("x-admin-key");
  const expectedKey = process.env.ADMIN_API_KEY;

  if (expectedKey && apiKey !== expectedKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stats = await getStats();
  return NextResponse.json(stats);
}
