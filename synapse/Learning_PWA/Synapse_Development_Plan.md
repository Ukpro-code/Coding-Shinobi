# Synapse — AI Knowledge Management App (Recall.ai Competitor)

## Context

Recall.ai (getrecall.ai) has strong core value (AI summarization + knowledge graph + spaced repetition) but suffers from: broken editor UX, no API (389 votes), no TTS (346 votes), no Safari extension (234 votes), single PDF upload only (185 votes), limited content sources (139 votes), incomplete large doc summarization, no desktop app, weak offline support, and poor export options. We're building **Synapse** — a full alternative that solves every one of these pain points from day one.

**Developer:** Solo dev, 2-3 months
**Stack:** Next.js 15 (App Router) + Supabase + Claude API + OpenAI + Turborepo monorepo
**Target:** Web app first (PWA), then Chrome Extension

---

## Phase 1: Foundation (Weeks 1-2)

### Week 1: Project Scaffolding + Auth + UI Shell

**Day 1-2: Monorepo setup**
- Create `D:\Ukesh\Coding Shinobi\synapse\` with Turborepo + npm workspaces
- Structure: `apps/web` (Next.js 15), `apps/extension` (Chrome), `packages/shared`, `packages/db`
- Configure: TypeScript 5.7, Tailwind CSS v4, ESLint, Prettier
- Create `CLAUDE.md` at project root (see Coding Companion section)
- Initialize Supabase: `npx supabase init`

**Day 3-4: Database + Auth**
- Run full migration SQL (15 tables: profiles, collections, tags, cards, card_tags, card_embeddings, card_links, review_items, review_history, quiz_questions, chat_conversations, chat_messages, api_keys, processing_queue, user_stats)
- Enable pgvector + pg_trgm extensions
- Set up RLS policies on all tables (user owns their data)
- Supabase Auth with email + Google OAuth using `@supabase/ssr`
- Auth middleware for protected routes

**Day 5: UI Shell**
- Install shadcn/ui + lucide-react + next-themes + sonner
- Dashboard layout: collapsible sidebar, top bar, main content area
- Dark/light theme toggle
- Pages: `/login`, `/signup`, `/dashboard`, `/dashboard/library`, `/dashboard/graph`, `/dashboard/review`, `/dashboard/chat`, `/dashboard/settings`

### Week 2: Content Ingestion + Library View

**Day 1-2: Ingestion pipeline**
- `POST /api/ingest` route accepting: URL, file upload (PDF), manual text
- Webpage extraction: `@extractus/article-extractor`
- YouTube transcripts: `youtube-transcript` package
- Store raw content in `cards` table with `status='processing'`

**Day 3-4: AI Summarization**
- Claude API wrapper (`src/lib/ai/claude.ts`) for summarization + categorization + key point extraction
- OpenAI embeddings (`text-embedding-3-small`, 1536 dimensions) with intelligent chunking (~500 tokens, 50 token overlap)
- Pipeline: extract → summarize → categorize → embed → store

**Day 5: Library view**
- Card grid/list view with search (Supabase `.textSearch()`)
- Basic tag filtering, source type icons
- Card preview: title, summary snippet, tags, source type

**Deliverable:** Users can sign up, save URLs/notes, get AI summaries, browse library.

---

## Phase 2: Core AI Pipeline (Weeks 3-4)

### Week 3: Multi-Source Ingestion + Card Detail

- PDF upload + parsing (`pdf-parse`) with Supabase Storage
- Twitter/X thread extraction (URL parsing approach, not paid API)
- Reddit posts via JSON API (`{url}.json`)
- LinkedIn: manual paste for now
- Card detail page (`/dashboard/library/[id]`): full summary, key points, raw content, tags, collection, favorite/pin, regenerate summary

### Week 4: Advanced AI + Batch Processing

- Auto-categorization: enhanced Claude prompts for topics, entities, sentiment
- Auto-linking: cosine similarity on embeddings → create `card_links` for top 5 similar cards
- **Batch PDF upload**: drag-and-drop multi-file, `processing_queue` table, queue processor with retry logic (max 3 attempts), per-file progress UI
- Embedding pipeline: paragraph-boundary chunking, overlap windows, batched OpenAI calls (20 texts/request)

**Deliverable:** Full multi-source pipeline with batch upload, auto-categorization, auto-linking.

---

## Phase 3: Knowledge Graph + Block Editor (Weeks 5-6)

### Week 5: Knowledge Graph

- Graph data API: nodes (cards) + edges (card_links), filtered by collection/tag/date
- **Sigma.js** via `@react-sigma/core` + `graphology` (WebGL, handles thousands of nodes)
- Force-directed layout with `graphology-layout-forceatlas2`
- Cluster detection with `graphology-communities-louvain`
- Features: node colors by type, click to open card, hover highlight, search, zoom, cluster groups
- Page at `/dashboard/graph`

### Week 6: Block Editor

- **BlockNote** (`@blocknote/react` + `@blocknote/shadcn`) — Notion-like out of the box
- Custom blocks: AI Summary (read-only), Key Points, Source Citation, Linked Card Mention (`@` to reference cards)
- Store as JSON in `cards.editor_content`, auto-save with 500ms debounce
- Backlinks panel: show which cards reference current card
- **This directly fixes Recall's #1 editor complaint** — no floating toolbar bugs, proper mobile UX

**Deliverable:** Interactive knowledge graph + Notion-like editor with card linking.

---

## Phase 4: Learning System (Weeks 7-8)

### Week 7: Spaced Repetition (SM-2)

- SM-2 algorithm in `src/lib/spaced-repetition/sm2.ts`
- Ratings: Again (reset), Hard, Good, Easy → calculate next interval + ease factor
- Review session UI at `/dashboard/review`: flashcard flip, rating buttons, session stats
- Auto-create review items when cards reach 'ready' status
- Review dashboard: streak counter, calendar heatmap (`react-activity-calendar`), accuracy charts

### Week 8: AI Quizzes + Gamification

- Claude-generated quiz questions: multiple choice, true/false, fill-in-blank, free response
- 3-5 questions per card, stored in `quiz_questions` table
- Quiz UI at `/dashboard/review/quiz`: interactive, immediate feedback with explanations
- **Gamification**: points (+10 review, +25 quiz correct, +50 daily streak), levels (`floor(sqrt(points/100))`), achievements (First Card, 100 Cards, 7-Day Streak, Quiz Champion)

**Deliverable:** Complete spaced repetition + quiz system with gamification.

---

## Phase 5: Chrome Extension + RAG Chat (Weeks 9-10)

### Week 9: Chrome Extension

- `apps/extension` with Vite + `@crxjs/vite-plugin` + React
- Manifest V3: popup, side panel, content script, background service worker
- **Popup**: quick save, recent saves, login status
- **Content script**: floating "Save to Synapse" button, text selection → right-click summarize, auto-detect YouTube
- Auth via Supabase tokens in `chrome.storage.local`
- Keyboard shortcut: Ctrl+Shift+S to save current page

### Week 10: RAG Chat

- RAG pipeline in `/api/chat`: embed query → pgvector search (top 10 chunks) → construct prompt with context → stream Claude response
- Streaming via Next.js `ReadableStream` or Vercel AI SDK
- Chat UI at `/dashboard/chat`: conversation list, markdown rendering (`react-markdown`), clickable citation cards, collection scope filter
- Conversation CRUD: create, delete, rename

**Deliverable:** Working Chrome extension + RAG chat across knowledge base.

---

## Phase 6: Polish & Launch (Weeks 11-12)

### Week 11: TTS, Export, API, Filters, i18n

- **TTS**: Web Speech API (free) + optional ElevenLabs premium, audio player with speed control (0.5x-2x)
- **Export**: Markdown (BlockNote serializer), PDF (`@react-pdf/renderer`), JSON, bulk ZIP (`jszip`)
- **Public REST API**: `/api/v1/cards`, `/api/v1/search`, `/api/v1/collections` with API key auth (SHA-256 hash lookup), rate limiting (60 req/min)
- **Advanced filters**: AND/OR/Exclude tag logic + source type + date range + collection + favorites, saveable presets
- **i18n**: `next-intl`, locale files in `public/locales/`, English + Spanish to start

### Week 12: Offline, Testing, Deploy

- **PWA**: `next-pwa` (Workbox), service worker, IndexedDB sync via `idb`, offline indicator
- **Testing**: Vitest (SM-2, parsing, filters, export), Playwright E2E (auth, ingest, review, chat)
- **Deploy**: Vercel (frontend) + Supabase Cloud (DB/auth/storage) + Chrome Web Store ($5 one-time)
- **CI/CD**: GitHub Actions → lint → test → e2e → deploy on merge to main

**Deliverable:** Production-ready app with all 14 features deployed.

---

## Key Libraries

| Category | Packages |
|----------|----------|
| Framework | `next@15`, `react@19`, `typescript@5.7`, `tailwindcss@4` |
| UI | shadcn/ui, `lucide-react`, `next-themes`, `sonner`, `framer-motion`, `cmdk` |
| Database | `@supabase/supabase-js`, `@supabase/ssr` |
| AI | `@anthropic-ai/sdk`, `openai` |
| Ingestion | `@extractus/article-extractor`, `youtube-transcript`, `pdf-parse`, `turndown` |
| Editor | `@blocknote/core`, `@blocknote/react`, `@blocknote/shadcn` |
| Graph | `graphology`, `@react-sigma/core`, `graphology-layout-forceatlas2` |
| State | `zustand`, `@tanstack/react-query` |
| Chat | `react-markdown`, `remark-gfm`, `ai` (Vercel AI SDK) |
| Export | `@react-pdf/renderer`, `jszip` |
| PWA | `next-pwa`, `idb` |
| i18n | `next-intl` |
| Validation | `zod` |
| Testing | `vitest`, `@testing-library/react`, `playwright`, `msw` |
| Extension | `vite`, `@crxjs/vite-plugin` |
| Monorepo | `turbo` |

---

## Coding Companion Setup

### CLAUDE.md (at project root)

```markdown
# Synapse - AI Knowledge Management App

## Project Overview
A Recall.ai competitor: AI-powered knowledge management with summarization,
knowledge graphs, spaced repetition, and RAG chat.

## Tech Stack
- **Framework**: Next.js 15 (App Router) with TypeScript
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Database**: Supabase (Postgres + pgvector + Auth + Storage + Edge Functions)
- **AI**: Anthropic Claude API (summarization) + OpenAI (embeddings)
- **Editor**: BlockNote
- **Graph**: Sigma.js via @react-sigma/core + graphology
- **State**: Zustand + TanStack React Query
- **Testing**: Vitest (unit) + Playwright (e2e)
- **Monorepo**: Turborepo with npm workspaces

## Architecture Rules
1. Use Next.js App Router conventions (server components by default)
2. Mark client components explicitly with 'use client'
3. API keys and secrets NEVER go in client code — use server actions or API routes
4. All AI API calls go through Next.js API routes (not client-side)
5. Use Zod for all API input validation
6. Use @supabase/ssr for server-side Supabase clients
7. Prefer server components; use client components only for interactivity
8. Use TanStack React Query for client-side data fetching/caching
9. Use Zustand only for UI state (filters, modals, selections)

## File Conventions
- Components: PascalCase (CardDetail.tsx)
- Utilities: camelCase (parseContent.ts)
- Types: PascalCase interfaces, camelCase for type aliases
- Test files: adjacent to source (foo.test.ts next to foo.ts)
- API routes: lowercase with hyphens (summarize/route.ts)

## Database
- Supabase with pgvector extension for embeddings
- All tables have RLS enabled — never use service role key from client
- Use `supabase gen types typescript` to regenerate types after schema changes
- Migrations in supabase/migrations/

## Key Patterns
- Content ingestion: URL/file -> extract text -> Claude summarize -> OpenAI embed -> store
- RAG chat: query -> embed -> pgvector search -> context + prompt -> Claude stream
- Spaced repetition: SM-2 algorithm in src/lib/spaced-repetition/sm2.ts
- Knowledge graph: card_links table with auto-generated links from embedding similarity

## Commands
- `npm run dev` — Start all apps in dev mode
- `npm run build` — Build all apps
- `npm run test` — Run unit tests
- `npm run test:e2e` — Run Playwright tests
- `npm run db:generate` — Regenerate Supabase types
- `npx supabase db push` — Push migrations to cloud
- `npx supabase start` — Start local Supabase

## Common Tasks
- To add a new shadcn component: `npx shadcn@latest add [component]`
- To add a new API route: create `src/app/api/[name]/route.ts`
- To add a new page: create `src/app/(dashboard)/[name]/page.tsx`
- To update DB schema: add migration in supabase/migrations/, then run db:generate

## Error Handling
- Use try/catch with typed errors
- Return { data, error } pattern from server actions
- Show toast notifications for user-facing errors (via sonner)
- Log errors to console in dev, structured logging in prod

## Performance
- Use React.lazy for heavy components (graph, editor)
- Implement pagination (cursor-based) for card lists
- Debounce search input (300ms)
- Auto-save editor content (debounce 500ms)
- Use next/image for all images
- Use Suspense boundaries with loading skeletons
```

### MCP Servers to Configure

1. **Supabase MCP**: `npx -y @supabase/mcp-server-supabase@latest` — gives Claude direct DB schema access
2. **GitHub MCP** (optional): `npx -y @modelcontextprotocol/server-github` — issue/PR management

### Workflow Tips

- Work in focused 2-hour blocks, one feature at a time
- Share relevant file context before asking Claude to generate code
- Use `/commit` for meaningful commit messages
- Keep CLAUDE.md updated as architecture evolves
- Break features into small testable units

---

## Database Schema (15 tables)

### Complete SQL Migration

```sql
-- ============================================
-- EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";          -- pgvector for embeddings
CREATE EXTENSION IF NOT EXISTS "pg_trgm";         -- Trigram for fuzzy text search

-- ============================================
-- ENUMS
-- ============================================
CREATE TYPE content_type AS ENUM (
  'webpage', 'youtube', 'pdf', 'podcast', 'twitter',
  'reddit', 'linkedin', 'note', 'manual'
);

CREATE TYPE card_status AS ENUM ('processing', 'ready', 'error', 'archived');

CREATE TYPE quiz_type AS ENUM (
  'multiple_choice', 'true_false', 'fill_blank', 'free_response'
);

CREATE TYPE review_rating AS ENUM ('again', 'hard', 'good', 'easy');

CREATE TYPE export_format AS ENUM ('markdown', 'pdf', 'json');

CREATE TYPE api_key_status AS ENUM ('active', 'revoked');

-- ============================================
-- TABLES
-- ============================================

-- 1. User profiles (extends Supabase auth.users)
CREATE TABLE profiles (
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

-- 2. Collections (folders/categories)
CREATE TABLE collections (
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

-- 3. Tags
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#8b5cf6',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- 4. Knowledge cards (the core entity)
CREATE TABLE cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  collection_id UUID REFERENCES collections(id) ON DELETE SET NULL,

  -- Source info
  source_type content_type NOT NULL DEFAULT 'manual',
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

  -- File storage (for PDFs)
  file_path TEXT,
  file_size_bytes BIGINT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Card-tag junction
CREATE TABLE card_tags (
  card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (card_id, tag_id)
);

-- 6. Embeddings (pgvector for RAG)
CREATE TABLE card_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL DEFAULT 0,
  chunk_text TEXT NOT NULL,
  embedding vector(1536) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(card_id, chunk_index)
);

-- 7. Knowledge graph edges (card-to-card links)
CREATE TABLE card_links (
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

-- 8. Spaced repetition review items
CREATE TABLE review_items (
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

-- 9. Review history log
CREATE TABLE review_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  review_item_id UUID NOT NULL REFERENCES review_items(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  rating review_rating NOT NULL,
  response_time_ms INTEGER,
  reviewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Quiz questions (AI-generated)
CREATE TABLE quiz_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question_type quiz_type NOT NULL,
  question_text TEXT NOT NULL,
  options JSONB,
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  difficulty INTEGER DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Chat conversations
CREATE TABLE chat_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'New Chat',
  collection_scope UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Chat messages
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  citations JSONB DEFAULT '[]',
  token_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Public API keys
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL,
  status api_key_status DEFAULT 'active',
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  permissions JSONB DEFAULT '["read"]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Processing queue (for batch uploads)
CREATE TABLE processing_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
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

-- 15. User activity / gamification
CREATE TABLE user_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
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

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_cards_user_id ON cards(user_id);
CREATE INDEX idx_cards_user_status ON cards(user_id, status);
CREATE INDEX idx_cards_user_collection ON cards(user_id, collection_id);
CREATE INDEX idx_cards_user_source_type ON cards(user_id, source_type);
CREATE INDEX idx_cards_user_created ON cards(user_id, created_at DESC);
CREATE INDEX idx_cards_user_favorite ON cards(user_id, is_favorite) WHERE is_favorite = TRUE;

CREATE INDEX idx_cards_fts ON cards USING gin(
  to_tsvector('english', coalesce(title, '') || ' ' || coalesce(summary, '') || ' ' || coalesce(raw_content, ''))
);
CREATE INDEX idx_cards_title_trgm ON cards USING gin(title gin_trgm_ops);

CREATE INDEX idx_embeddings_card_id ON card_embeddings(card_id);
CREATE INDEX idx_embeddings_vector ON card_embeddings
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX idx_card_links_source ON card_links(source_card_id);
CREATE INDEX idx_card_links_target ON card_links(target_card_id);
CREATE INDEX idx_card_links_user ON card_links(user_id);

CREATE INDEX idx_review_items_due ON review_items(user_id, next_review_at)
  WHERE next_review_at <= NOW();
CREATE INDEX idx_review_items_card ON review_items(card_id);
CREATE INDEX idx_review_history_user_date ON review_history(user_id, reviewed_at DESC);

CREATE INDEX idx_card_tags_card ON card_tags(card_id);
CREATE INDEX idx_card_tags_tag ON card_tags(tag_id);
CREATE INDEX idx_tags_user ON tags(user_id);

CREATE INDEX idx_queue_status ON processing_queue(status, priority DESC, created_at);
CREATE INDEX idx_queue_user ON processing_queue(user_id);

CREATE INDEX idx_chat_messages_conversation ON chat_messages(conversation_id, created_at);
CREATE INDEX idx_collections_user ON collections(user_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

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

-- User owns row policies (cards example — replicate for all tables)
CREATE POLICY "Users can view own cards" ON cards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own cards" ON cards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cards" ON cards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own cards" ON cards FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own chat messages" ON chat_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM chat_conversations WHERE chat_conversations.id = chat_messages.conversation_id AND chat_conversations.user_id = auth.uid())
);

CREATE POLICY "Users can manage tags on own cards" ON card_tags FOR ALL USING (
  EXISTS (SELECT 1 FROM cards WHERE cards.id = card_tags.card_id AND cards.user_id = auth.uid())
);

CREATE POLICY "Users can view own card embeddings" ON card_embeddings FOR SELECT USING (
  EXISTS (SELECT 1 FROM cards WHERE cards.id = card_embeddings.card_id AND cards.user_id = auth.uid())
);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name');
  INSERT INTO user_stats (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Semantic search function using pgvector
CREATE OR REPLACE FUNCTION match_card_embeddings(
  query_embedding vector(1536),
  match_user_id UUID,
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 10
)
RETURNS TABLE (
  card_id UUID,
  chunk_text TEXT,
  chunk_index INTEGER,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ce.card_id,
    ce.chunk_text,
    ce.chunk_index,
    1 - (ce.embedding <=> query_embedding) AS similarity
  FROM card_embeddings ce
  JOIN cards c ON c.id = ce.card_id
  WHERE c.user_id = match_user_id
    AND 1 - (ce.embedding <=> query_embedding) > match_threshold
  ORDER BY ce.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cards_updated_at
  BEFORE UPDATE ON cards FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_collections_updated_at
  BEFORE UPDATE ON collections FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

## Monorepo File Structure

```
synapse/
├── CLAUDE.md
├── turbo.json
├── package.json
├── .env.local / .env.example
├── .gitignore / .prettierrc / .eslintrc.js / tsconfig.base.json
│
├── apps/
│   ├── web/                           # Next.js 15 App Router
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── (auth)/ login & signup pages
│   │   │   │   ├── (dashboard)/ layout + library, graph, review, chat, settings pages
│   │   │   │   ├── api/ ingest, summarize, chat, export, tts, v1/ (public API)
│   │   │   │   └── globals.css
│   │   │   ├── components/ ui/, editor/, graph/, review/, chat/, layout/
│   │   │   ├── hooks/
│   │   │   ├── lib/
│   │   │   │   ├── supabase/ client.ts, server.ts, middleware.ts
│   │   │   │   ├── ai/ claude.ts, openai.ts, prompts.ts
│   │   │   │   ├── ingestion/ webpage.ts, youtube.ts, pdf.ts, twitter.ts, reddit.ts
│   │   │   │   ├── spaced-repetition/ sm2.ts
│   │   │   │   ├── export/ markdown.ts, pdf.ts, json.ts
│   │   │   │   └── utils.ts
│   │   │   ├── stores/ card-store.ts, filter-store.ts, review-store.ts
│   │   │   └── types/ database.ts, card.ts, api.ts
│   │   └── tests/e2e/ auth.spec.ts, ingest.spec.ts, review.spec.ts, chat.spec.ts
│   │
│   └── extension/                     # Chrome Extension (Manifest V3)
│       ├── manifest.json
│       └── src/ background/, content/, popup/, sidepanel/, shared/
│
├── packages/
│   ├── shared/                        # Shared types + Zod validators
│   └── db/                            # Schema, migrations, generated types
│
├── supabase/
│   ├── config.toml
│   ├── migrations/ 00001-00004 SQL files
│   ├── functions/ process-content, generate-embeddings, generate-quiz, webhook-handler
│   └── seed.sql
│
└── docs/ ARCHITECTURE.md, API.md, DEPLOYMENT.md
```

---

## Environment Variables (.env.example)

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
ELEVENLABS_API_KEY=...
YOUTUBE_API_KEY=...
API_SECRET_KEY=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Estimated Monthly Cost (at 1K users)

| Service | Cost |
|---------|------|
| Vercel | $0-20 |
| Supabase Pro | $25 |
| Claude API | $50-100 |
| OpenAI Embeddings | $5-10 |
| ElevenLabs TTS | $5 |
| Domain | ~$1 |
| **Total** | **~$86-161/month** |

---

## Verification Plan

1. **Auth**: Sign up with email, sign in, Google OAuth, protected route redirect
2. **Ingestion**: Save a URL, YouTube video, and PDF — verify summaries, tags, embeddings generated
3. **Batch upload**: Upload 5 PDFs simultaneously, verify queue processing and progress UI
4. **Graph**: Verify nodes appear after saving 10+ cards, edges auto-created between related content
5. **Editor**: Create/edit a note with blocks, verify `@` mentions link cards, auto-save works
6. **Review**: Complete a review session, verify SM-2 intervals update correctly
7. **Quiz**: Generate quiz from card, answer questions, verify scoring
8. **Extension**: Install in Chrome, save a page, verify it appears in web app library
9. **Chat**: Ask a question about saved content, verify RAG retrieves relevant cards with citations
10. **TTS**: Play a card summary, verify audio and speed controls work
11. **Export**: Export cards as Markdown, PDF, JSON, bulk ZIP
12. **API**: Create API key, call `/api/v1/cards`, verify auth and rate limiting
13. **Filters**: Apply AND tag filter + date range, verify correct results
14. **Offline**: Disconnect network, verify cached cards are accessible, reconnect and verify sync
15. **PWA**: Install on mobile, verify app shell loads offline

---

## Initialization Commands

```bash
mkdir "D:\Ukesh\Coding Shinobi\synapse"
cd "D:\Ukesh\Coding Shinobi\synapse"
npm init -y
npm install turbo --save-dev

mkdir apps
cd apps
npx create-next-app@latest web --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd ..

npx supabase init

cd apps/web
npm install @supabase/supabase-js @supabase/ssr @anthropic-ai/sdk openai zustand @tanstack/react-query zod next-themes sonner
npm install -D vitest @testing-library/react playwright
npx shadcn@latest init
cd ../..
```
