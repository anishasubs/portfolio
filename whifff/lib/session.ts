import { isSupabaseConfigured, getSupabaseClient, getSupabaseServerClient } from "./supabase";

export interface SessionRecord {
  id: string;
  pastPerfumeNames: string[];
  scentFamilies: string[];
  priceRange: string | null;
  occasion: string | null;
  strength: string | null;
  recommendedPerfumeNames: string[];
  completed: boolean;
  currentStep: number;
  startedAt: Date;
  completedAt: Date | null;
  userAgent: string;
  referrer: string;
}

// ---------------------------------------------------------------------------
// SessionProvider interface
// ---------------------------------------------------------------------------

interface SessionProvider {
  create(userAgent: string, referrer: string): Promise<SessionRecord>;
  get(id: string): Promise<SessionRecord | undefined>;
  update(id: string, updates: Partial<SessionRecord>): Promise<SessionRecord | null>;
  getStats(): Promise<{
    total: number;
    completed: number;
    completionRate: number;
    dropOff: Record<number, number>;
    topFamilies: [string, number][];
    topRecommended: [string, number][];
  }>;
}

// ---------------------------------------------------------------------------
// InMemorySessionProvider (fallback when Supabase is not configured)
// ---------------------------------------------------------------------------

class InMemorySessionProvider implements SessionProvider {
  private sessions = new Map<string, SessionRecord>();

  async create(userAgent: string, referrer: string): Promise<SessionRecord> {
    const id = crypto.randomUUID();
    const session: SessionRecord = {
      id,
      pastPerfumeNames: [],
      scentFamilies: [],
      priceRange: null,
      occasion: null,
      strength: null,
      recommendedPerfumeNames: [],
      completed: false,
      currentStep: 0,
      startedAt: new Date(),
      completedAt: null,
      userAgent,
      referrer,
    };
    this.sessions.set(id, session);
    return session;
  }

  async get(id: string): Promise<SessionRecord | undefined> {
    return this.sessions.get(id);
  }

  async update(id: string, updates: Partial<SessionRecord>): Promise<SessionRecord | null> {
    const session = this.sessions.get(id);
    if (!session) return null;
    Object.assign(session, updates);
    if (updates.completed) {
      session.completedAt = new Date();
    }
    return session;
  }

  async getStats() {
    const all = Array.from(this.sessions.values());
    const total = all.length;
    const completed = all.filter((s) => s.completed).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const stepCounts: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    all.forEach((s) => {
      if (!s.completed) {
        stepCounts[s.currentStep] = (stepCounts[s.currentStep] || 0) + 1;
      }
    });

    const familyCounts: Record<string, number> = {};
    all.forEach((s) => {
      s.scentFamilies.forEach((f) => {
        familyCounts[f] = (familyCounts[f] || 0) + 1;
      });
    });
    const topFamilies = Object.entries(familyCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6) as [string, number][];

    const recCounts: Record<string, number> = {};
    all.forEach((s) => {
      s.recommendedPerfumeNames.forEach((name) => {
        recCounts[name] = (recCounts[name] || 0) + 1;
      });
    });
    const topRecommended = Object.entries(recCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10) as [string, number][];

    return { total, completed, completionRate, dropOff: stepCounts, topFamilies, topRecommended };
  }
}

// ---------------------------------------------------------------------------
// SupabaseSessionProvider
// ---------------------------------------------------------------------------

function mapRowToSession(row: Record<string, unknown>): SessionRecord {
  return {
    id: row.id as string,
    pastPerfumeNames: (row.past_perfume_names as string[]) ?? [],
    scentFamilies: (row.scent_families as string[]) ?? [],
    priceRange: (row.price_range as string) ?? null,
    occasion: (row.occasion as string) ?? null,
    strength: (row.strength as string) ?? null,
    recommendedPerfumeNames: (row.recommended_perfume_names as string[]) ?? [],
    completed: (row.completed as boolean) ?? false,
    currentStep: (row.current_step as number) ?? 0,
    startedAt: new Date(row.started_at as string),
    completedAt: row.completed_at ? new Date(row.completed_at as string) : null,
    userAgent: (row.user_agent as string) ?? "",
    referrer: (row.referrer as string) ?? "",
  };
}

class SupabaseSessionProvider implements SessionProvider {
  async create(userAgent: string, referrer: string): Promise<SessionRecord> {
    const sb = getSupabaseServerClient();
    const { data, error } = await sb
      .from("quiz_sessions")
      .insert({ user_agent: userAgent, referrer })
      .select()
      .single();

    if (error || !data) {
      console.error("Failed to create session:", error?.message);
      // Fallback: return a local session so the quiz still works
      return {
        id: crypto.randomUUID(),
        pastPerfumeNames: [],
        scentFamilies: [],
        priceRange: null,
        occasion: null,
        strength: null,
        recommendedPerfumeNames: [],
        completed: false,
        currentStep: 0,
        startedAt: new Date(),
        completedAt: null,
        userAgent,
        referrer,
      };
    }
    return mapRowToSession(data);
  }

  async get(id: string): Promise<SessionRecord | undefined> {
    const sb = getSupabaseClient();
    const { data, error } = await sb
      .from("quiz_sessions")
      .select()
      .eq("id", id)
      .single();
    if (error || !data) return undefined;
    return mapRowToSession(data);
  }

  async update(id: string, updates: Partial<SessionRecord>): Promise<SessionRecord | null> {
    const sb = getSupabaseServerClient();

    // Map camelCase fields to snake_case DB columns
    const dbUpdates: Record<string, unknown> = {};
    if (updates.pastPerfumeNames !== undefined) dbUpdates.past_perfume_names = updates.pastPerfumeNames;
    if (updates.scentFamilies !== undefined) dbUpdates.scent_families = updates.scentFamilies;
    if (updates.priceRange !== undefined) dbUpdates.price_range = updates.priceRange;
    if (updates.occasion !== undefined) dbUpdates.occasion = updates.occasion;
    if (updates.strength !== undefined) dbUpdates.strength = updates.strength;
    if (updates.recommendedPerfumeNames !== undefined) dbUpdates.recommended_perfume_names = updates.recommendedPerfumeNames;
    if (updates.completed !== undefined) {
      dbUpdates.completed = updates.completed;
      if (updates.completed) dbUpdates.completed_at = new Date().toISOString();
    }
    if (updates.currentStep !== undefined) dbUpdates.current_step = updates.currentStep;

    const { data, error } = await sb
      .from("quiz_sessions")
      .update(dbUpdates)
      .eq("id", id)
      .select()
      .single();

    if (error || !data) {
      console.error("Failed to update session:", error?.message);
      return null;
    }
    return mapRowToSession(data);
  }

  async getStats() {
    const sb = getSupabaseClient();
    const { data, error } = await sb.rpc("get_session_stats");
    if (error || !data) {
      console.error("Failed to get stats:", error?.message);
      return {
        total: 0,
        completed: 0,
        completionRate: 0,
        dropOff: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        topFamilies: [],
        topRecommended: [],
      };
    }
    // The RPC returns JSON — parse dropOff keys to numbers
    const raw = typeof data === "string" ? JSON.parse(data) : data;
    const dropOff: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    if (raw.dropOff) {
      for (const [k, v] of Object.entries(raw.dropOff)) {
        dropOff[Number(k)] = v as number;
      }
    }
    return {
      total: raw.total ?? 0,
      completed: raw.completed ?? 0,
      completionRate: raw.completionRate ?? 0,
      dropOff,
      topFamilies: (raw.topFamilies ?? []) as [string, number][],
      topRecommended: (raw.topRecommended ?? []) as [string, number][],
    };
  }
}

// ---------------------------------------------------------------------------
// Provider singleton + exported async functions
// ---------------------------------------------------------------------------

let sessionProvider: SessionProvider | null = null;

function getSessionProvider(): SessionProvider {
  if (!sessionProvider) {
    sessionProvider = isSupabaseConfigured()
      ? new SupabaseSessionProvider()
      : new InMemorySessionProvider();
  }
  return sessionProvider;
}

export async function createSession(userAgent: string, referrer: string): Promise<SessionRecord> {
  return getSessionProvider().create(userAgent, referrer);
}

export async function getSession(id: string): Promise<SessionRecord | undefined> {
  return getSessionProvider().get(id);
}

export async function updateSession(id: string, updates: Partial<SessionRecord>): Promise<SessionRecord | null> {
  return getSessionProvider().update(id, updates);
}

export async function getStats() {
  return getSessionProvider().getStats();
}
