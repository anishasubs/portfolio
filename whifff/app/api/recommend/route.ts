import { NextRequest, NextResponse } from "next/server";
import { getDataProvider } from "@/lib/data-provider";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { past_perfume_ids = [], scent_families = [], price_range = null, occasion = null, strength = null } = body;

  const provider = getDataProvider();
  const results = await provider.getRecommendations({
    pastIds: past_perfume_ids,
    scents: scent_families,
    price: price_range,
    occasion,
    strength,
  });

  return NextResponse.json(results);
}
