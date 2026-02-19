import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/session";

export async function POST(request: NextRequest) {
  const userAgent = request.headers.get("user-agent") || "";
  const referrer = request.headers.get("referer") || "";

  let deviceType = "unknown";
  try {
    const body = await request.json();
    if (body.device_type) deviceType = body.device_type;
  } catch {
    // No body or invalid JSON — use defaults
  }

  const session = await createSession(userAgent, referrer, deviceType);
  return NextResponse.json({ id: session.id });
}
