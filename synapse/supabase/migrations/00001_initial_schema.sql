-- Synapse Initial Schema Migration
-- 15 tables + enums + indexes + RLS + triggers + functions

-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE content_type AS ENUM (
  'webpage', 'youtube', 'pdf', 'podcast', 'twitter', 'reddit', 'linkedin', 'note', 'manual'
);

CREATE TYPE card_status AS ENUM ('processing', 'ready', 'error', 'archived');

CREATE TYPE quiz_type AS ENUM ('multiple_choice', 'true_false', 'fill_blank', 'free_response');

CREATE TYPE review_rating AS ENUM ('again', 'hard', 'good', 'easy');

CREATE TYPE api_key_status AS ENUM ('active', 'revoked');

-- ============================================================
-- TABLE 1: profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  preferred_language TEXT DEFAULT 'en',
  daily_review_goal INTEGER DEFAULT 20,
  timezone TEXT DEFAULT 'UTC',
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 2: collections
-- ============================================================
CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6366f1',
  icon TEXT DEFAULT 'folder',
  parent_id UUID REFERENCES collections(id) ON DELETE SET NULL,
  is_public BOOLEAN DEFAULT FALSE,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 3: tags
-- ============================================================
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#8b5cf6',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- ============================================================
-- TABLE 4: cards (core entity)
-- ============================================================
CREATE TABLE IF NOT EXISTS cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  collection_id UUID REFERENCES collections(id) ON DELETE SET NULL,

  -- Source information
  source_type content_type DEFAULT 'manual',
  source_url TEXT,
  source_title TEXT,
  source_author TEXT,
  source_published_at TIMESTAMPTZ,
  source_thumbnail_url TEXT,

  -- Content
  title TEXT NOT NULL,
  raw_content TEXT,
  summary TEXT,
  key_points JSONB DEFAULT '[]',
  editor_content JSONB,

  -- AI metadata
  ai_categories JSONB DEFAULT '[]',
  ai_entities JSONB DEFAULT '[]',
  sentiment TEXT,
  reading_time_minutes INTEGER,
  language TEXT DEFAULT 'en',

  -- Status
  status card_status DEFAULT 'processing',
  error_message TEXT,
  is_favorite BOOLEAN DEFAULT FALSE,
  is_pinned BOOLEAN DEFAULT FALSE,
  word_count INTEGER,
  file_path TEXT,
  file_size_bytes BIGINT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 5: card_tags (junction)
-- ============================================================
CREATE TABLE IF NOT EXISTS card_tags (
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (card_id, tag_id)
);

-- ============================================================
-- TABLE 6: card_embeddings (vector store)
-- ============================================================
CREATE TABLE IF NOT EXISTS card_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  chunk_index INTEGER DEFAULT 0,
  chunk_text TEXT NOT NULL,
  embedding vector(1536),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(card_id, chunk_index)
);

-- ============================================================
-- TABLE 7: card_links (knowledge graph edges)
-- ============================================================
CREATE TABLE IF NOT EXISTS card_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  source_card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  target_card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  relationship_type TEXT DEFAULT 'related',
  strength FLOAT DEFAULT 0.5,
  is_auto_generated BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source_card_id, target_card_id)
);

-- ============================================================
-- TABLE 8: review_items (spaced repetition)
-- ============================================================
CREATE TABLE IF NOT EXISTS review_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  ease_factor FLOAT DEFAULT 2.5,
  interval_days INTEGER DEFAULT 1,
  repetition_count INTEGER DEFAULT 0,
  next_review_at TIMESTAMPTZ DEFAULT NOW(),
  last_reviewed_at TIMESTAMPTZ,
  total_reviews INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  streak INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 9: review_history
-- ============================================================
CREATE TABLE IF NOT EXISTS review_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  review_item_id UUID NOT NULL REFERENCES review_items(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  rating review_rating NOT NULL,
  response_time_ms INTEGER,
  reviewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 10: quiz_questions
-- ============================================================
CREATE TABLE IF NOT EXISTS quiz_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question_type quiz_type NOT NULL,
  question_text TEXT NOT NULL,
  options JSONB,
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  difficulty INTEGER DEFAULT 1 CHECK (difficulty >= 1 AND difficulty <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 11: chat_conversations
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'New Chat',
  collection_scope UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 12: chat_messages
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  citations JSONB DEFAULT '[]',
  token_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 13: api_keys
-- ============================================================
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT,
  status api_key_status DEFAULT 'active',
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  permissions JSONB DEFAULT '["read"]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 14: processing_queue
-- ============================================================
CREATE TABLE IF NOT EXISTS processing_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  card_id UUID REFERENCES cards(id) ON DELETE SET NULL,
  source_type content_type NOT NULL,
  source_url TEXT,
  file_path TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  attempts INTEGER DEFAULT 0,
  error_message TEXT,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- ============================================================
-- TABLE 15: user_stats (gamification)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  total_cards INTEGER DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  current_streak_days INTEGER DEFAULT 0,
  longest_streak_days INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  achievements JSONB DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Cards
CREATE INDEX IF NOT EXISTS idx_cards_user_id ON cards(user_id);
CREATE INDEX IF NOT EXISTS idx_cards_collection_id ON cards(collection_id);
CREATE INDEX IF NOT EXISTS idx_cards_status ON cards(status);
CREATE INDEX IF NOT EXISTS idx_cards_source_type ON cards(source_type);
CREATE INDEX IF NOT EXISTS idx_cards_created_at ON cards(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cards_title_trgm ON cards USING gin(title gin_trgm_ops);

-- Embeddings
CREATE INDEX IF NOT EXISTS idx_card_embeddings_card_id ON card_embeddings(card_id);

-- Links
CREATE INDEX IF NOT EXISTS idx_card_links_source ON card_links(source_card_id);
CREATE INDEX IF NOT EXISTS idx_card_links_target ON card_links(target_card_id);

-- Reviews
CREATE INDEX IF NOT EXISTS idx_review_items_user_next ON review_items(user_id, next_review_at);
CREATE INDEX IF NOT EXISTS idx_review_items_card ON review_items(card_id);
CREATE INDEX IF NOT EXISTS idx_review_history_user ON review_history(user_id, reviewed_at DESC);

-- Chat
CREATE INDEX IF NOT EXISTS idx_chat_conversations_user ON chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages(conversation_id, created_at);

-- Processing queue
CREATE INDEX IF NOT EXISTS idx_processing_queue_status ON processing_queue(status, priority DESC, created_at);
CREATE INDEX IF NOT EXISTS idx_processing_queue_user ON processing_queue(user_id);

-- Collections
CREATE INDEX IF NOT EXISTS idx_collections_user ON collections(user_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE processing_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update their own profile
CREATE POLICY profiles_select ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY profiles_update ON profiles FOR UPDATE USING (auth.uid() = id);

-- Collections: users can CRUD their own collections
CREATE POLICY collections_select ON collections FOR SELECT USING (auth.uid() = user_id OR is_public = TRUE);
CREATE POLICY collections_insert ON collections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY collections_update ON collections FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY collections_delete ON collections FOR DELETE USING (auth.uid() = user_id);

-- Tags: users can CRUD their own tags
CREATE POLICY tags_all ON tags FOR ALL USING (auth.uid() = user_id);

-- Cards: users can CRUD their own cards
CREATE POLICY cards_all ON cards FOR ALL USING (auth.uid() = user_id);

-- Card tags: users can manage tags on their own cards
CREATE POLICY card_tags_all ON card_tags FOR ALL
  USING (EXISTS (SELECT 1 FROM cards WHERE cards.id = card_tags.card_id AND cards.user_id = auth.uid()));

-- Card embeddings: users can access embeddings for their own cards
CREATE POLICY card_embeddings_all ON card_embeddings FOR ALL
  USING (EXISTS (SELECT 1 FROM cards WHERE cards.id = card_embeddings.card_id AND cards.user_id = auth.uid()));

-- Card links: users can CRUD their own links
CREATE POLICY card_links_all ON card_links FOR ALL USING (auth.uid() = user_id);

-- Review items: users can CRUD their own review items
CREATE POLICY review_items_all ON review_items FOR ALL USING (auth.uid() = user_id);

-- Review history: users can CRUD their own review history
CREATE POLICY review_history_all ON review_history FOR ALL USING (auth.uid() = user_id);

-- Quiz questions: users can CRUD their own quiz questions
CREATE POLICY quiz_questions_all ON quiz_questions FOR ALL USING (auth.uid() = user_id);

-- Chat conversations: users can CRUD their own conversations
CREATE POLICY chat_conversations_all ON chat_conversations FOR ALL USING (auth.uid() = user_id);

-- Chat messages: users can access messages in their own conversations
CREATE POLICY chat_messages_all ON chat_messages FOR ALL
  USING (EXISTS (SELECT 1 FROM chat_conversations WHERE chat_conversations.id = chat_messages.conversation_id AND chat_conversations.user_id = auth.uid()));

-- API keys: users can CRUD their own API keys
CREATE POLICY api_keys_all ON api_keys FOR ALL USING (auth.uid() = user_id);

-- Processing queue: users can CRUD their own queue items
CREATE POLICY processing_queue_all ON processing_queue FOR ALL USING (auth.uid() = user_id);

-- User stats: users can read/update their own stats
CREATE POLICY user_stats_all ON user_stats FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  INSERT INTO user_stats (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE OR REPLACE TRIGGER collections_updated_at BEFORE UPDATE ON collections FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE OR REPLACE TRIGGER cards_updated_at BEFORE UPDATE ON cards FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE OR REPLACE TRIGGER review_items_updated_at BEFORE UPDATE ON review_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE OR REPLACE TRIGGER chat_conversations_updated_at BEFORE UPDATE ON chat_conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE OR REPLACE TRIGGER user_stats_updated_at BEFORE UPDATE ON user_stats FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Semantic search function for RAG
CREATE OR REPLACE FUNCTION match_card_embeddings(
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.78,
  match_count INT DEFAULT 10,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS TABLE (
  id UUID,
  card_id UUID,
  chunk_text TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ce.id,
    ce.card_id,
    ce.chunk_text,
    1 - (ce.embedding <=> query_embedding) AS similarity
  FROM card_embeddings ce
  JOIN cards c ON c.id = ce.card_id
  WHERE c.user_id = p_user_id
    AND 1 - (ce.embedding <=> query_embedding) > match_threshold
  ORDER BY ce.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
