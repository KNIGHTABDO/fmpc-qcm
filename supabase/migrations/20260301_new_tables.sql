-- Migration: 20260301_new_tables.sql
-- Tables added after 20260225_features.sql
-- Covers: bookmarks, ai_usage, ai_models_config, ai_tokens (copilot),
--         study_rooms, room_participants, flashcard_sessions, chat_messages

-- ─── bookmarks ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookmarks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, question_id)
);
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bookmarks_own" ON bookmarks USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ─── ai_models_config ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_models_config (
  id                  TEXT PRIMARY KEY,
  name                TEXT NOT NULL,
  publisher           TEXT,
  premium_multiplier  SMALLINT NOT NULL DEFAULT 0 CHECK (premium_multiplier IN (0,1,3)),
  is_default          BOOLEAN NOT NULL DEFAULT false,
  supports_tools      BOOLEAN NOT NULL DEFAULT false,
  supports_vision     BOOLEAN NOT NULL DEFAULT false,
  enabled             BOOLEAN NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ DEFAULT now()
);
-- Only one row can be the default
CREATE UNIQUE INDEX IF NOT EXISTS ai_models_config_one_default ON ai_models_config (is_default) WHERE is_default = true;

-- ─── ai_tokens (GitHub Copilot OAuth) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_tokens (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label        TEXT,
  github_oauth_token TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'dead')),
  use_count    INTEGER NOT NULL DEFAULT 0,
  last_used    TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT now()
);
-- RLS: only service role reads these
ALTER TABLE ai_tokens ENABLE ROW LEVEL SECURITY;
-- (No user-level policy — access via service role key only)

-- ─── ai_usage ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_usage (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_date   DATE NOT NULL,
  multiplier   SMALLINT NOT NULL,
  count        INTEGER NOT NULL DEFAULT 1,
  updated_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, usage_date, multiplier)
);
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_usage_own" ON ai_usage USING (auth.uid() = user_id);

-- ─── ai_rate_limits ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_rate_limits (
  multiplier   SMALLINT PRIMARY KEY,
  daily_limit  INTEGER NOT NULL,
  updated_at   TIMESTAMPTZ DEFAULT now()
);
INSERT INTO ai_rate_limits (multiplier, daily_limit) VALUES (1, 10), (3, 5) ON CONFLICT DO NOTHING;

-- ─── study_rooms ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS study_rooms (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code           TEXT NOT NULL UNIQUE,
  name           TEXT NOT NULL,
  module_id      INTEGER REFERENCES modules(id) ON DELETE SET NULL,
  host_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  questions      JSONB NOT NULL DEFAULT '[]',
  status         TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting','active','finished')),
  current_q_idx  INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE study_rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rooms_read" ON study_rooms FOR SELECT USING (true);
CREATE POLICY "rooms_host_write" ON study_rooms FOR ALL USING (auth.uid() = host_id);

-- ─── room_participants ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS room_participants (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id       UUID NOT NULL REFERENCES study_rooms(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  TEXT NOT NULL,
  score         INTEGER NOT NULL DEFAULT 0,
  answers       JSONB NOT NULL DEFAULT '{}',
  joined_at     TIMESTAMPTZ DEFAULT now(),
  UNIQUE (room_id, user_id)
);
ALTER TABLE room_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "participants_read" ON room_participants FOR SELECT USING (true);
CREATE POLICY "participants_own" ON room_participants FOR ALL USING (auth.uid() = user_id);

-- ─── flashcard_sessions ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS flashcard_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id     INTEGER REFERENCES modules(id) ON DELETE SET NULL,
  question_id   UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  status        TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','learning','known')),
  next_review   TIMESTAMPTZ,
  interval_days INTEGER NOT NULL DEFAULT 1,
  ease_factor   FLOAT NOT NULL DEFAULT 2.5,
  reviews       INTEGER NOT NULL DEFAULT 0,
  updated_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, question_id)
);
ALTER TABLE flashcard_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "flashcard_own" ON flashcard_sessions USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ─── chat_messages ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK (role IN ('user','assistant')),
  content     TEXT NOT NULL,
  model_id    TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chat_own" ON chat_messages USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ─── quiz_sessions ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quiz_sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_id  INTEGER REFERENCES activities(id) ON DELETE CASCADE,
  current_idx  INTEGER NOT NULL DEFAULT 0,
  score        INTEGER NOT NULL DEFAULT 0,
  history      JSONB NOT NULL DEFAULT '{}',
  elapsed      INTEGER NOT NULL DEFAULT 0,
  updated_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, activity_id)
);
ALTER TABLE quiz_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quiz_session_own" ON quiz_sessions USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
