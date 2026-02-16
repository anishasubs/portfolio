import { NextRequest, NextResponse } from "next/server";
import { getSession, updateSession } from "@/lib/session";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const session = await getSession(id);

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const updated = await updateSession(id, body);
  return NextResponse.json(updated);
}
