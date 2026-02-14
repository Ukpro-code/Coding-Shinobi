# Phase 2: Core AI Pipeline — Implementation Plan

> **Timeline**: Weeks 3-4 (includes Phase 1 Week 2 prerequisites that were deferred)
> **Agents involved**: db-backend, ai-pipeline, ui-frontend
> **Orchestrator**: requirements-analyst

---

## Overview

Phase 2 builds the intelligence layer of Synapse — the AI pipeline that extracts, summarizes, embeds, and connects knowledge cards. Before we can build the advanced features (multi-source ingestion, auto-linking, batch processing), we first need to complete the prerequisite work from Phase 1 Week 2 that was skipped during initial scaffolding.

### What Gets Built

| Capability | Description |
|-----------|-------------|
| Content Extraction | Pull content from URLs, YouTube, PDFs, Twitter, Reddit |
| AI Summarization | Claude-powered summaries with key points extraction |
| Embedding Pipeline | OpenAI embeddings stored in pgvector for similarity search |
| Card CRUD | Full create/read/update/delete for knowledge cards |
| Library UI | Browse, search, filter, and view cards |
| Auto-Linking | Automatically discover connections between cards |
| Batch Processing | Queue-based bulk ingestion of multiple sources |

---

## Step 0 — Missing Phase 1 Week 2 Prerequisites

> These should have been built in Week 2 but were deferred. They are required before any Phase 2 work.

### 0.1 Shared Types & Validators (`packages/shared/`)

**Agent**: db-backend

| File | Purpose |
|------|---------|
| `packages/shared/src/types/card.ts` | Card, CardInsert, CardUpdate, CardWithTags, ContentType types |
| `packages/shared/src/types/collection.ts` | Collection, CollectionInsert, CollectionWithCount types |
| `packages/shared/src/types/api.ts` | ApiResponse<T>, PaginatedResponse<T>, IngestRequest, IngestResponse |
| `packages/shared/src/validators/card.ts` | Zod schemas: cardInsertSchema, cardUpdateSchema, ingestRequestSchema |
| `packages/shared/src/validators/collection.ts` | Zod schemas: collectionInsertSchema, collectionUpdateSchema |
| `packages/shared/src/index.ts` | Barrel export for all types and validators |
| `packages/shared/package.json` | Package config with typescript as devDependency |
| `packages/shared/tsconfig.json` | Extends tsconfig.base.json |

### 0.2 AI Wrappers (`apps/web/src/lib/ai/`)

**Agent**: ai-pipeline

| File | Purpose |
|------|---------|
| `apps/web/src/lib/ai/claude.ts` | Claude API wrapper — `summarizeContent()`, `extractKeyPoints()`, `generateQuestions()` |
| `apps/web/src/lib/ai/openai.ts` | OpenAI wrapper — `generateEmbedding()`, `generateEmbeddings()` (batch) |
| `apps/web/src/lib/ai/prompts.ts` | All prompt templates — summarization, key points, question generation, auto-categorization |
| `apps/web/src/lib/ai/chunker.ts` | Text chunking — `chunkText()` splits large content into overlapping chunks for embedding |

**Key design decisions**:
- Claude for reasoning tasks (summarization, key points, questions)
- OpenAI `text-embedding-3-small` for embeddings (1536 dimensions, matches our pgvector column)
- Chunker uses 1000-token chunks with 200-token overlap for context continuity
- All AI functions return typed results, never raw API responses

### 0.3 Content Extractors (`apps/web/src/services/extractors/`)

**Agent**: ai-pipeline

| File | Purpose |
|------|---------|
| `apps/web/src/services/extractors/webpage.ts` | Fetch URL → extract main content (strip nav, ads, etc.), return title + clean text |
| `apps/web/src/services/extractors/youtube.ts` | YouTube URL → extract transcript via YouTube API/captions, return title + transcript |

### 0.4 Embedding Pipeline (`apps/web/src/services/ai/`)

**Agent**: ai-pipeline

| File | Purpose |
|------|---------|
| `apps/web/src/services/ai/embedding-pipeline.ts` | Orchestrator: content → chunk → embed → store in card_embeddings table |

**Pipeline flow**:
```
Input (raw text) → chunker.ts (split into chunks)
    → openai.ts (generate embedding per chunk)
    → Supabase INSERT into card_embeddings
    → Return embedding IDs
```

### 0.5 Service Layer (`apps/web/src/services/`)

**Agent**: db-backend

| File | Purpose |
|------|---------|
| `apps/web/src/services/card-service.ts` | Card CRUD: createCard, getCard, getCards (paginated + filtered), updateCard, deleteCard, searchCards |
| `apps/web/src/services/collection-service.ts` | Collection CRUD: createCollection, getCollections, updateCollection, deleteCollection |

### 0.6 API Routes (`apps/web/src/app/api/`)

**Agent**: db-backend

| Route | Method | Purpose |
|-------|--------|---------|
| `api/cards/route.ts` | GET, POST | List cards (with pagination, filters) / Create a card |
| `api/cards/[id]/route.ts` | GET, PATCH, DELETE | Get / Update / Delete a single card |
| `api/cards/ingest/route.ts` | POST | Full ingest pipeline: URL → extract → summarize → embed → store |
| `api/collections/route.ts` | GET, POST | List / Create collections |
| `api/collections/[id]/route.ts` | GET, PATCH, DELETE | Get / Update / Delete a collection |

**Ingest pipeline flow** (`POST /api/cards/ingest`):
```
1. Validate request body (Zod schema)
2. Detect source type from URL (webpage, youtube, pdf, twitter, reddit)
3. Extract content using appropriate extractor
4. Summarize with Claude (summary + key points)
5. Generate embeddings with OpenAI
6. Store card + embeddings in Supabase
7. Return created card with summary
```

### 0.7 Library UI (`apps/web/src/`)

**Agent**: ui-frontend

| File | Purpose |
|------|---------|
| `app/(dashboard)/library/page.tsx` | **Replace stub** — Full library page with grid/list view, search bar, collection filter, tag filter |
| `components/features/library/card-grid.tsx` | Grid layout of card preview items |
| `components/features/library/card-grid-item.tsx` | Single card in grid view — title, summary preview, tags, source icon, date |
| `components/features/library/card-list-item.tsx` | Single card in list view — compact row format |
| `components/features/library/library-toolbar.tsx` | Search input + view toggle (grid/list) + sort dropdown + filter buttons |
| `app/(dashboard)/capture/page.tsx` | **Replace stub** — URL input form + status feedback for ingestion |
| `components/features/capture/ingest-form.tsx` | URL input, content type selector, collection picker, submit button |
| `stores/library-store.ts` | Zustand store: viewMode, searchQuery, selectedCollection, selectedTags, sortBy |
| `hooks/use-cards.ts` | TanStack Query hook: useCards(filters), useCard(id), useIngestCard() |
| `hooks/use-collections.ts` | TanStack Query hook: useCollections(), useCreateCollection() |

**Files modified**:
- `app/(dashboard)/library/page.tsx` — Replace placeholder stub with full library UI
- `app/(dashboard)/capture/page.tsx` — Replace placeholder stub with ingest form

---

## Step 1 — Week 3: Multi-Source Ingestion + Card Detail

> Expand beyond webpage/YouTube to support PDF, Twitter, and Reddit. Build the card detail view.

### 1.1 New Content Extractors

**Agent**: ai-pipeline

| File | Purpose |
|------|---------|
| `apps/web/src/services/extractors/pdf.ts` | Parse uploaded PDF → extract text content page by page |
| `apps/web/src/services/extractors/twitter.ts` | Twitter/X URL → extract thread (tweet + replies from same author) |
| `apps/web/src/services/extractors/reddit.ts` | Reddit URL → extract post title, body, and top comments |
| `apps/web/src/services/extractors/index.ts` | `detectSourceType(url)` + `extractContent(url, type)` — auto-routes to correct extractor |

### 1.2 File Upload Support

**Agent**: db-backend

| File | Purpose |
|------|---------|
| `apps/web/src/app/api/upload/route.ts` | POST — Accept PDF upload, store in Supabase Storage, return storage URL |
| `supabase/migrations/00002_storage_buckets.sql` | Create `card-files` storage bucket with RLS policies |

### 1.3 Card Detail UI

**Agent**: ui-frontend

| File | Purpose |
|------|---------|
| `apps/web/src/app/(dashboard)/library/[id]/page.tsx` | Full card detail page — summary, key points, source content, metadata |
| `apps/web/src/components/features/card/card-detail.tsx` | Card detail layout — header, AI summary section, key points list, source preview |
| `apps/web/src/components/features/card/card-tags.tsx` | Tag display + add/remove tags inline |
| `apps/web/src/components/features/card/card-actions.tsx` | Edit, delete, move to collection, share actions |
| `apps/web/src/components/features/card/related-cards.tsx` | "Related Cards" section using embedding similarity (`match_card_embeddings`) |
| `apps/web/src/hooks/use-card-detail.ts` | TanStack Query hook: useCardDetail(id), useRelatedCards(id), useUpdateCard() |

### 1.4 Tag & Collection Management APIs

**Agent**: db-backend

| Route | Method | Purpose |
|-------|--------|---------|
| `api/tags/route.ts` | GET, POST | List user's tags / Create a tag |
| `api/tags/[id]/route.ts` | PATCH, DELETE | Update / Delete a tag |
| `api/cards/[id]/tags/route.ts` | POST, DELETE | Add / Remove a tag from a card |

**Files modified**:
- `apps/web/src/services/card-service.ts` — Add getRelatedCards() using match_card_embeddings
- `apps/web/src/app/(dashboard)/capture/page.tsx` — Add PDF upload option alongside URL input
- `packages/shared/src/types/card.ts` — Add new source types (pdf, twitter, reddit)

---

## Step 2 — Week 4: Advanced AI + Batch Processing

> Enhance AI analysis quality and add bulk ingestion capabilities.

### 2.1 Enhanced AI Analysis

**Agent**: ai-pipeline

| File | Purpose |
|------|---------|
| `apps/web/src/lib/ai/prompts-advanced.ts` | Advanced prompts: deeper analysis, concept extraction, difficulty assessment, prerequisite identification |
| `apps/web/src/services/ai/auto-linker.ts` | Find related cards via embedding similarity → generate link descriptions with Claude → store in card_links table |

**Auto-linking flow**:
```
1. After card creation, query card_embeddings for top-K similar cards
2. For each similar pair, use Claude to determine if link is meaningful
3. Store confirmed links in card_links with AI-generated relationship description
4. Links are bidirectional (A→B implies B→A)
```

### 2.2 Batch Processing Infrastructure

**Agent**: db-backend + ai-pipeline

| File | Purpose |
|------|---------|
| `apps/web/src/services/processing-queue.ts` | Queue service: enqueue, dequeue, updateStatus, getQueueStatus — uses processing_queue table |
| `apps/web/src/app/api/cards/batch/route.ts` | POST — Accept array of URLs, enqueue all, return queue IDs |
| `apps/web/src/app/api/queue/process/route.ts` | POST — Process next N items from queue (called by cron or manual trigger) |
| `apps/web/src/app/api/queue/status/route.ts` | GET — Return current queue status (pending, processing, completed, failed counts) |

**Queue design**:
- Uses existing `processing_queue` table (created in initial migration)
- Items are processed sequentially to respect API rate limits
- Failed items are retried up to 3 times with exponential backoff
- Status is trackable per-item and in aggregate

### 2.3 Batch Upload UI

**Agent**: ui-frontend

| File | Purpose |
|------|---------|
| `apps/web/src/components/features/capture/batch-ingest-form.tsx` | Multi-URL textarea input (one URL per line) + collection picker + submit |
| `apps/web/src/components/features/capture/queue-status.tsx` | Real-time processing status display — progress bar, per-item status, error display |
| `apps/web/src/hooks/use-queue.ts` | TanStack Query hook: useBatchIngest(), useQueueStatus() with polling |

**Files modified**:
- `apps/web/src/app/(dashboard)/capture/page.tsx` — Add tabs: "Single URL" | "Batch Upload" | "File Upload"
- `apps/web/src/lib/ai/prompts.ts` — Add auto-linking prompts
- `apps/web/src/services/ai/embedding-pipeline.ts` — Add auto-link trigger after embedding generation

---

## File Summary

| Step | Scope | New Files | Modified Files | Agent(s) |
|------|-------|-----------|----------------|----------|
| 0 | Phase 1 Week 2 prerequisites | ~25 | 2 | db-backend, ai-pipeline, ui-frontend |
| 1 | Week 3: Multi-Source + Card Detail | ~18 | 3 | ai-pipeline, db-backend, ui-frontend |
| 2 | Week 4: Advanced AI + Batch | ~12 | 3 | ai-pipeline, db-backend, ui-frontend |
| **Total** | | **~55** | **~8** | |

---

## Dependencies & Order of Implementation

```
Step 0 (must be sequential within):
  0.1 Shared types/validators  ← foundation for everything
  0.2 AI wrappers              ← depends on nothing, parallel with 0.1
  0.3 Content extractors       ← depends on 0.2 (uses chunker)
  0.4 Embedding pipeline       ← depends on 0.2 + 0.3
  0.5 Service layer            ← depends on 0.1 (uses shared types)
  0.6 API routes               ← depends on 0.4 + 0.5
  0.7 Library UI               ← depends on 0.6 (calls API routes)

Step 1 (after Step 0 complete):
  1.1 New extractors           ← parallel
  1.2 File upload              ← parallel
  1.3 Card detail UI           ← after 1.1 + 1.2
  1.4 Tag/Collection APIs      ← parallel with 1.1

Step 2 (after Step 1 complete):
  2.1 Enhanced AI              ← parallel
  2.2 Batch processing         ← parallel
  2.3 Batch upload UI          ← after 2.2
```

---

## Environment Variables Needed

Before starting Phase 2, ensure these are set in `.env.local`:

```env
# Required for Phase 2
ANTHROPIC_API_KEY=sk-ant-...          # Claude API — for summarization
OPENAI_API_KEY=sk-...                 # OpenAI API — for embeddings

# Already set from Phase 1
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

---

## Pre-Implementation Checklist

- [ ] Supabase project is set up and linked (see `docs/supabase-setup-guide.md`)
- [ ] All 15 tables exist in the database (migration applied)
- [ ] pgvector extension is enabled
- [ ] `.env.local` has Supabase keys filled in
- [ ] Anthropic API key obtained and added to `.env.local`
- [ ] OpenAI API key obtained and added to `.env.local`
- [ ] `npm run dev` works without errors
- [ ] Login/signup flow works end-to-end
