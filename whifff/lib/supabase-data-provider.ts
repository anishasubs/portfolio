import type { Perfume, ScoredPerfume, ScentFamily, PriceOption, Occasion, Strength, Vibe } from "./types";
import type { DataProvider } from "./data-provider";
import { getSupabaseClient } from "./supabase";
import { scoreAndRank } from "./recommend";

/** Maps a snake_case DB row to the camelCase Perfume interface */
function mapDbRowToPerfume(row: Record<string, unknown>): Perfume {
  // Determine price range — use DB value or derive from price
  let pr: PriceOption = "$";
  if (row.price_range === "$$" || row.price_range === "$$$") {
    pr = row.price_range as PriceOption;
  } else if (row.price_range === "$") {
    pr = "$";
  } else if (typeof row.price_usd === "number") {
    pr = row.price_usd >= 200 ? "$$$" : row.price_usd >= 100 ? "$$" : "$";
  }

  return {
    id: row.id as string,
    name: row.name as string,
    brand: row.brand as string,
    price: (row.price_usd as number) ?? 0,
    pr,
    notes: (row.notes_all as string[]) ?? [],
    accords: (row.accords as string[]) ?? [],
    rating: (row.rating as number) ?? 0,
    img: (row.image_url as string) ?? "",
    sillage: ((row.sillage as string) ?? "moderate") as Perfume["sillage"],
  };
}

export class SupabaseDataProvider implements DataProvider {
  async searchPerfumes(query: string, limit = 8): Promise<Perfume[]> {
    if (query.length < 2) return [];
    const sb = getSupabaseClient();
    const { data, error } = await sb.rpc("search_perfumes", {
      query,
      lim: limit,
    });
    if (error) {
      console.error("search_perfumes RPC error:", error.message);
      return [];
    }
    return (data ?? []).map(mapDbRowToPerfume);
  }

  async getPerfumeById(id: string): Promise<Perfume | null> {
    const sb = getSupabaseClient();
    const { data, error } = await sb
      .from("perfumes")
      .select()
      .eq("id", id)
      .single();
    if (error || !data) return null;
    return mapDbRowToPerfume(data);
  }

  async getRecommendations(params: {
    pastIds: string[];
    scents: ScentFamily[];
    vibe: Vibe | null;
    occasion: Occasion | null;
    strength: Strength | null;
  }): Promise<ScoredPerfume[]> {
    const sb = getSupabaseClient();

    // Load past perfumes by ID
    let past: Perfume[] = [];
    if (params.pastIds.length > 0) {
      const { data } = await sb
        .from("perfumes")
        .select()
        .in("id", params.pastIds);
      past = (data ?? []).map(mapDbRowToPerfume);
    }

    // Load top 200 perfumes by popularity as the candidate pool
    const { data: pool } = await sb
      .from("perfumes")
      .select()
      .order("popularity_score", { ascending: false })
      .limit(200);

    const db = (pool ?? []).map(mapDbRowToPerfume);

    // Future: when note_vector embeddings are populated, replace with:
    //   1. Average past-perfume vectors
    //   2. Call match_perfumes_by_vector RPC
    //   3. Re-rank results with scoreAndRank

    return scoreAndRank({
      db,
      past,
      scents: params.scents,
      vibe: params.vibe,
      occasion: params.occasion,
      strength: params.strength,
    });
  }
}
