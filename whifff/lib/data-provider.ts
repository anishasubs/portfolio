import type { Perfume, ScoredPerfume, ScentFamily, Occasion, Strength, Vibe } from "./types";
import { DB } from "./mock-data";
import { scoreAndRank } from "./recommend";
import { isSupabaseConfigured } from "./supabase";

export interface DataProvider {
  searchPerfumes(query: string, limit?: number): Promise<Perfume[]>;
  getPerfumeById(id: string): Promise<Perfume | null>;
  getRecommendations(params: {
    pastIds: string[];
    scents: ScentFamily[];
    vibe: Vibe | null;
    occasion: Occasion | null;
    strength: Strength | null;
  }): Promise<ScoredPerfume[]>;
}

class MockDataProvider implements DataProvider {
  async searchPerfumes(query: string, limit = 8): Promise<Perfume[]> {
    if (query.length < 2) return [];
    const q = query.toLowerCase();
    return DB.filter((p) => `${p.brand} ${p.name}`.toLowerCase().includes(q)).slice(0, limit);
  }

  async getPerfumeById(id: string): Promise<Perfume | null> {
    return DB.find((p) => p.id === id) ?? null;
  }

  async getRecommendations(params: {
    pastIds: string[];
    scents: ScentFamily[];
    vibe: Vibe | null;
    occasion: Occasion | null;
    strength: Strength | null;
  }): Promise<ScoredPerfume[]> {
    const past = params.pastIds.map((id) => DB.find((p) => p.id === id)).filter(Boolean) as Perfume[];
    return scoreAndRank({
      db: DB,
      past,
      scents: params.scents,
      vibe: params.vibe,
      occasion: params.occasion,
      strength: params.strength,
    });
  }
}

let provider: DataProvider | null = null;

export function getDataProvider(): DataProvider {
  if (!provider) {
    if (isSupabaseConfigured()) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { SupabaseDataProvider } = require("./supabase-data-provider");
      provider = new SupabaseDataProvider() as DataProvider;
    } else {
      provider = new MockDataProvider();
    }
  }
  return provider!;
}
