-- FlickPick Initial Schema
-- Run this in Supabase Dashboard → SQL Editor

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE sessions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code          text NOT NULL,
  host_device_id text NOT NULL,
  streaming_services text[] NOT NULL DEFAULT '{}',
  filters       jsonb NOT NULL DEFAULT '{}',
  match_threshold float NOT NULL DEFAULT 0.5,
  status        text NOT NULL DEFAULT 'lobby',
  created_at    timestamptz NOT NULL DEFAULT now(),
  expires_at    timestamptz NOT NULL DEFAULT now() + interval '24 hours'
);

CREATE TABLE participants (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  device_id       text NOT NULL,
  nickname        text,
  avatar_seed     int NOT NULL DEFAULT floor(random() * 1000000)::int,
  is_host         boolean NOT NULL DEFAULT false,
  swipe_progress  int NOT NULL DEFAULT 0,
  joined_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE catalog_items (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  tmdb_id       int NOT NULL,
  title         text NOT NULL,
  poster_url    text,
  synopsis      text,
  genres        text[] NOT NULL DEFAULT '{}',
  runtime       int,
  release_year  int,
  tmdb_rating   float,
  available_on  text[] NOT NULL DEFAULT '{}',
  display_order int NOT NULL DEFAULT 0
);

CREATE TABLE swipes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id  uuid NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  catalog_item_id uuid NOT NULL REFERENCES catalog_items(id) ON DELETE CASCADE,
  session_id      uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  direction       text NOT NULL CHECK (direction IN ('left', 'right')),
  time_on_card_ms int,
  swiped_at       timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE UNIQUE INDEX idx_sessions_code ON sessions(code);
CREATE INDEX idx_sessions_status_expires ON sessions(status, expires_at);

CREATE INDEX idx_participants_session ON participants(session_id);
CREATE UNIQUE INDEX idx_participants_session_device ON participants(session_id, device_id);

CREATE INDEX idx_catalog_items_session ON catalog_items(session_id);
CREATE INDEX idx_catalog_items_session_order ON catalog_items(session_id, display_order);

CREATE UNIQUE INDEX idx_swipes_participant_item ON swipes(participant_id, catalog_item_id);
CREATE INDEX idx_swipes_session_item_dir ON swipes(session_id, catalog_item_id, direction);

-- ============================================================
-- VIEW: session_matches
-- ============================================================

CREATE OR REPLACE VIEW session_matches AS
SELECT
  s.session_id,
  s.catalog_item_id,
  ci.title,
  ci.poster_url,
  ci.tmdb_rating,
  ci.available_on,
  ci.genres,
  ci.runtime,
  ci.release_year,
  ci.synopsis,
  COUNT(*) FILTER (WHERE s.direction = 'right') AS right_swipe_count,
  (SELECT COUNT(*) FROM participants p WHERE p.session_id = s.session_id) AS total_participants,
  ROUND(
    COUNT(*) FILTER (WHERE s.direction = 'right')::numeric /
    NULLIF((SELECT COUNT(*) FROM participants p WHERE p.session_id = s.session_id), 0),
    2
  ) AS match_percentage,
  CASE
    WHEN ROUND(
      COUNT(*) FILTER (WHERE s.direction = 'right')::numeric /
      NULLIF((SELECT COUNT(*) FROM participants p WHERE p.session_id = s.session_id), 0),
      2
    ) = 1.0 THEN 'perfect'
    WHEN ROUND(
      COUNT(*) FILTER (WHERE s.direction = 'right')::numeric /
      NULLIF((SELECT COUNT(*) FROM participants p WHERE p.session_id = s.session_id), 0),
      2
    ) >= 0.75 THEN 'strong'
    WHEN ROUND(
      COUNT(*) FILTER (WHERE s.direction = 'right')::numeric /
      NULLIF((SELECT COUNT(*) FROM participants p WHERE p.session_id = s.session_id), 0),
      2
    ) >= 0.50 THEN 'soft'
    ELSE 'none'
  END AS tier,
  AVG(s.time_on_card_ms) FILTER (WHERE s.direction = 'right') AS avg_enthusiasm
FROM swipes s
JOIN catalog_items ci ON ci.id = s.catalog_item_id
GROUP BY s.session_id, s.catalog_item_id, ci.title, ci.poster_url, ci.tmdb_rating,
         ci.available_on, ci.genres, ci.runtime, ci.release_year, ci.synopsis;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE swipes ENABLE ROW LEVEL SECURITY;

-- sessions: read and create
CREATE POLICY "read_sessions" ON sessions FOR SELECT USING (true);
CREATE POLICY "insert_sessions" ON sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "update_sessions" ON sessions FOR UPDATE USING (true);

-- participants: read, join, update progress
CREATE POLICY "read_participants" ON participants FOR SELECT USING (true);
CREATE POLICY "insert_participants" ON participants FOR INSERT WITH CHECK (true);
CREATE POLICY "update_participants" ON participants FOR UPDATE USING (true);

-- catalog_items: read and insert
CREATE POLICY "read_catalog" ON catalog_items FOR SELECT USING (true);
CREATE POLICY "insert_catalog" ON catalog_items FOR INSERT WITH CHECK (true);

-- swipes: read and insert
CREATE POLICY "read_swipes" ON swipes FOR SELECT USING (true);
CREATE POLICY "insert_swipes" ON swipes FOR INSERT WITH CHECK (true);

-- ============================================================
-- REALTIME
-- ============================================================

-- Enable Realtime publication for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE participants;
ALTER PUBLICATION supabase_realtime ADD TABLE swipes;
ALTER PUBLICATION supabase_realtime ADD TABLE sessions;
