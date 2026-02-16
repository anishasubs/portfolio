import { NextRequest, NextResponse } from "next/server";
import { getDataProvider } from "@/lib/data-provider";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q") || "";
  const limit = parseInt(searchParams.get("limit") || "8", 10);

  if (q.length < 2) {
    return NextResponse.json([]);
  }

  const provider = getDataProvider();
  const results = await provider.searchPerfumes(q, limit);
  return NextResponse.json(results);
}
