-- Whifff Quiz Sessions — Supabase Migration
-- Run this in the Supabase SQL editor to create the quiz_sessions table.

CREATE TABLE IF NOT EXISTS quiz_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  past_perfume_names TEXT[] DEFAULT '{}',
  scent_families TEXT[] DEFAULT '{}',
  price_range TEXT,
  occasion TEXT,
  strength TEXT,
  recommended_perfume_names TEXT[] DEFAULT '{}',
  completed BOOLEAN DEFAULT FALSE,
  current_step INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  user_agent TEXT DEFAULT '',
  referrer TEXT DEFAULT '',
  device_type TEXT DEFAULT 'unknown',
  step_timestamps JSONB DEFAULT '{}'
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_started_at ON quiz_sessions (started_at DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_completed ON quiz_sessions (completed);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_device_type ON quiz_sessions (device_type);

-- Row-Level Security
ALTER TABLE quiz_sessions ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (quiz takers can start sessions)
CREATE POLICY "anon_insert" ON quiz_sessions
  FOR INSERT TO anon
  WITH CHECK (TRUE);

-- Allow anonymous updates on own session (matched by id passed from client)
CREATE POLICY "anon_update" ON quiz_sessions
  FOR UPDATE TO anon
  USING (TRUE)
  WITH CHECK (TRUE);

-- Allow anonymous reads (needed for session lookups)
CREATE POLICY "anon_select" ON quiz_sessions
  FOR SELECT TO anon
  USING (TRUE);

-- Service role has full access (used by stats endpoint)
CREATE POLICY "service_role_all" ON quiz_sessions
  FOR ALL TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

-- Stats RPC function
CREATE OR REPLACE FUNCTION get_session_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  WITH base AS (
    SELECT
      count(*) AS total,
      count(*) FILTER (WHERE completed) AS completed_count
    FROM quiz_sessions
  ),
  drop_off AS (
    SELECT current_step, count(*) AS cnt
    FROM quiz_sessions
    WHERE NOT completed
    GROUP BY current_step
  ),
  families AS (
    SELECT f, count(*) AS cnt
    FROM quiz_sessions, unnest(scent_families) AS f
    GROUP BY f
    ORDER BY cnt DESC
    LIMIT 6
  ),
  recommended AS (
    SELECT r, count(*) AS cnt
    FROM quiz_sessions, unnest(recommended_perfume_names) AS r
    GROUP BY r
    ORDER BY cnt DESC
    LIMIT 10
  ),
  occasions AS (
    SELECT occasion, count(*) AS cnt
    FROM quiz_sessions
    WHERE occasion IS NOT NULL
    GROUP BY occasion
    ORDER BY cnt DESC
  ),
  devices AS (
    SELECT device_type, count(*) AS cnt
    FROM quiz_sessions
    GROUP BY device_type
  )
  SELECT json_build_object(
    'total', (SELECT total FROM base),
    'completed', (SELECT completed_count FROM base),
    'completionRate', CASE
      WHEN (SELECT total FROM base) > 0
      THEN round(((SELECT completed_count FROM base)::numeric / (SELECT total FROM base)) * 100)
      ELSE 0
    END,
    'dropOff', COALESCE(
      (SELECT json_object_agg(current_step, cnt) FROM drop_off),
      '{}'::json
    ),
    'topFamilies', COALESCE(
      (SELECT json_agg(json_build_array(f, cnt)) FROM families),
      '[]'::json
    ),
    'topRecommended', COALESCE(
      (SELECT json_agg(json_build_array(r, cnt)) FROM recommended),
      '[]'::json
    ),
    'topOccasions', COALESCE(
      (SELECT json_agg(json_build_array(occasion, cnt)) FROM occasions),
      '[]'::json
    ),
    'deviceBreakdown', COALESCE(
      (SELECT json_object_agg(device_type, cnt) FROM devices),
      '{}'::json
    )
  ) INTO result;

  RETURN result;
END;
$$;
