-- Whifff: Supabase schema
-- Run this in Supabase SQL Editor (or via psql)

-- ============================================================
-- Extensions
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ============================================================
-- Tables
-- ============================================================

CREATE TABLE IF NOT EXISTS perfumes (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  brand         TEXT NOT NULL,
  notes_all     TEXT[] DEFAULT '{}',
  accords       TEXT[] DEFAULT '{}',
  rating        REAL DEFAULT 0,
  review_count  INTEGER DEFAULT 0,
  top_review    TEXT DEFAULT '',
  price_usd     REAL,
  price_range   TEXT CHECK (price_range IN ('$', '$$', '$$$')),
  sillage       TEXT CHECK (sillage IN ('soft', 'moderate', 'strong')),
  longevity     TEXT,
  image_url     TEXT DEFAULT '',
  note_vector   vector(384),
  popularity_score REAL DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE (name, brand)
);

CREATE TABLE IF NOT EXISTS quiz_sessions (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  past_perfume_names        TEXT[] DEFAULT '{}',
  scent_families            TEXT[] DEFAULT '{}',
  price_range               TEXT,
  occasion                  TEXT,
  strength                  TEXT,
  recommended_perfume_names TEXT[] DEFAULT '{}',
  completed                 BOOLEAN DEFAULT false,
  current_step              INTEGER DEFAULT 0,
  started_at                TIMESTAMPTZ DEFAULT now(),
  completed_at              TIMESTAMPTZ,
  user_agent                TEXT DEFAULT '',
  referrer                  TEXT DEFAULT ''
);

-- ============================================================
-- Indexes
-- ============================================================

-- Trigram indexes for fuzzy search on name and brand
CREATE INDEX IF NOT EXISTS idx_perfumes_name_trgm
  ON perfumes USING GIN (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_perfumes_brand_trgm
  ON perfumes USING GIN (brand gin_trgm_ops);

-- GIN indexes for array containment queries
CREATE INDEX IF NOT EXISTS idx_perfumes_accords
  ON perfumes USING GIN (accords);

CREATE INDEX IF NOT EXISTS idx_perfumes_notes
  ON perfumes USING GIN (notes_all);

-- HNSW index for vector similarity (Phase D)
CREATE INDEX IF NOT EXISTS idx_perfumes_note_vector
  ON perfumes USING hnsw (note_vector vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- ============================================================
-- RPC: Fuzzy perfume search
-- ============================================================

CREATE OR REPLACE FUNCTION search_perfumes(query TEXT, lim INTEGER DEFAULT 8)
RETURNS SETOF perfumes
LANGUAGE sql STABLE
AS $$
  SELECT *
  FROM perfumes
  WHERE
    -- prefix match first (fast, feels instant)
    name ILIKE query || '%'
    OR brand ILIKE query || '%'
    -- then trigram similarity fallback
    OR similarity(name, query) > 0.25
    OR similarity(brand, query) > 0.25
  ORDER BY
    -- exact prefix matches first
    CASE
      WHEN name ILIKE query || '%' THEN 0
      WHEN brand ILIKE query || '%' THEN 1
      ELSE 2
    END,
    -- then by trigram similarity
    GREATEST(similarity(name, query), similarity(brand, query)) DESC,
    -- tie-break by popularity
    popularity_score DESC
  LIMIT lim;
$$;

-- ============================================================
-- RPC: Session statistics for admin dashboard
-- ============================================================

CREATE OR REPLACE FUNCTION get_session_stats()
RETURNS JSON
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  result JSON;
BEGIN
  WITH
  totals AS (
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE completed)::int AS completed_count
    FROM quiz_sessions
  ),
  drop_off AS (
    SELECT current_step, COUNT(*)::int AS cnt
    FROM quiz_sessions
    WHERE NOT completed
    GROUP BY current_step
  ),
  families AS (
    SELECT f AS family, COUNT(*)::int AS cnt
    FROM quiz_sessions, UNNEST(scent_families) AS f
    GROUP BY f
    ORDER BY cnt DESC
    LIMIT 6
  ),
  recommended AS (
    SELECT r AS perfume, COUNT(*)::int AS cnt
    FROM quiz_sessions, UNNEST(recommended_perfume_names) AS r
    GROUP BY r
    ORDER BY cnt DESC
    LIMIT 10
  )
  SELECT json_build_object(
    'total', (SELECT total FROM totals),
    'completed', (SELECT completed_count FROM totals),
    'completionRate', CASE
      WHEN (SELECT total FROM totals) > 0
      THEN ROUND(((SELECT completed_count FROM totals)::numeric / (SELECT total FROM totals)) * 100)
      ELSE 0
    END,
    'dropOff', COALESCE(
      (SELECT json_object_agg(current_step, cnt) FROM drop_off),
      '{}'::json
    ),
    'topFamilies', COALESCE(
      (SELECT json_agg(json_build_array(family, cnt)) FROM families),
      '[]'::json
    ),
    'topRecommended', COALESCE(
      (SELECT json_agg(json_build_array(perfume, cnt)) FROM recommended),
      '[]'::json
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- ============================================================
-- RPC: Vector similarity search (Phase D)
-- ============================================================

CREATE OR REPLACE FUNCTION match_perfumes_by_vector(
  query_embedding vector(384),
  match_count INTEGER DEFAULT 20,
  threshold REAL DEFAULT 0.5
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  brand TEXT,
  notes_all TEXT[],
  accords TEXT[],
  rating REAL,
  review_count INTEGER,
  top_review TEXT,
  price_usd REAL,
  price_range TEXT,
  sillage TEXT,
  longevity TEXT,
  image_url TEXT,
  popularity_score REAL,
  similarity REAL
)
LANGUAGE sql STABLE
AS $$
  SELECT
    p.id, p.name, p.brand, p.notes_all, p.accords,
    p.rating, p.review_count, p.top_review,
    p.price_usd, p.price_range, p.sillage, p.longevity,
    p.image_url, p.popularity_score,
    1 - (p.note_vector <=> query_embedding) AS similarity
  FROM perfumes p
  WHERE p.note_vector IS NOT NULL
    AND 1 - (p.note_vector <=> query_embedding) > threshold
  ORDER BY p.note_vector <=> query_embedding
  LIMIT match_count;
$$;

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE perfumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_sessions ENABLE ROW LEVEL SECURITY;

-- Perfumes: public read
CREATE POLICY "Public read perfumes"
  ON perfumes FOR SELECT
  TO anon, authenticated
  USING (true);

-- Sessions: anon can create, read, and update their own
CREATE POLICY "Anon insert sessions"
  ON quiz_sessions FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anon select sessions"
  ON quiz_sessions FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anon update sessions"
  ON quiz_sessions FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);
