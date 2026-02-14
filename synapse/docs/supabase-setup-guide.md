# Supabase Setup Guide for Synapse

> **Recommended Setup**: Supabase Cloud + Supabase CLI (local)
> Cloud for your actual database, CLI for running migrations and generating types.

---

## Prerequisites

- Node.js 18+ installed
- npm installed
- A GitHub or email account (for Supabase sign-up)

---

## Step 1: Create a Supabase Cloud Project

1. Go to [supabase.com](https://supabase.com) and sign up / log in
2. Click **"New Project"**
3. Fill in:
   - **Name**: `synapse`
   - **Database Password**: Generate a strong one and **save it somewhere safe** (you'll need it for direct DB connections)
   - **Region**: Pick the closest to you (e.g., `South Asia (Mumbai)` for India)
4. Wait ~2 minutes for provisioning to complete

---

## Step 2: Get Your API Keys

Once the project is ready:

1. Go to **Settings > API** in your Supabase dashboard
2. You need these 3 values:

| Key | Where to Find | What It's For |
|-----|--------------|---------------|
| **Project URL** | Under "Project URL" | Public URL for your Supabase instance |
| **anon (public) key** | Under "Project API keys" | Client-side queries (respects RLS) |
| **service_role (secret) key** | Under "Project API keys" | Server-side queries (bypasses RLS) |

> **NEVER** expose the `service_role` key to the browser. It bypasses Row Level Security.

---

## Step 3: Set Up Environment Variables

```bash
cd synapse
cp .env.example .env.local
```

Edit `.env.local` with your actual values:

```env
# Supabase (from Step 2)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# AI APIs (get these when needed for Phase 2)
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# ElevenLabs (Phase 6 — skip for now)
ELEVENLABS_API_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

---

## Step 4: Install & Link Supabase CLI

### Install the CLI globally

```bash
npm install -g supabase
```

### Authenticate with your Supabase account

```bash
supabase login
```

This opens your browser to generate an access token. Paste it back into the terminal.

### Link your cloud project

```bash
cd synapse
supabase link --project-ref YOUR_PROJECT_REF
```

**Where to find your project ref**: It's the random string in your Supabase dashboard URL:
```
https://supabase.com/dashboard/project/abcdefghijklmnop
                                        ^^^^^^^^^^^^^^^^
                                        This is your project ref
```

---

## Step 5: Enable Required PostgreSQL Extensions

Go to **Database > Extensions** in the Supabase dashboard and enable these:

| Extension | Purpose | How to Enable |
|-----------|---------|---------------|
| **uuid-ossp** | UUID generation for primary keys | Usually enabled by default |
| **vector** (pgvector) | AI embedding storage & similarity search | Search "vector" and toggle ON |
| **pg_trgm** | Fuzzy text search on card titles | Search "pg_trgm" and toggle ON |

> These must be enabled BEFORE running the migration, otherwise the migration will fail.

---

## Step 6: Run the Database Migration

```bash
cd synapse
supabase db push
```

This applies `supabase/migrations/00001_initial_schema.sql` which creates:

- **15 tables**: profiles, collections, tags, cards, card_tags, card_embeddings, card_links, review_items, review_history, quiz_questions, chat_conversations, chat_messages, api_keys, processing_queue, user_stats
- **5 enums**: content_type, card_status, quiz_type, review_rating, api_key_status
- **17 indexes** including trigram index on card titles
- **RLS policies** on every single table
- **3 functions**: handle_new_user (trigger), update_updated_at (trigger), match_card_embeddings (vector similarity search)
- **2 triggers**: auto-create profile on signup, auto-update timestamps

---

## Step 7: Verify Everything Works

### Check the database

1. Go to **Table Editor** in your Supabase dashboard
2. You should see all 15 tables listed
3. Click on any table > go to **RLS Policies** tab > verify policies exist

### Check authentication

1. Go to **Authentication > Providers**
2. Email/Password should be enabled by default
3. (Optional) Enable Google or GitHub OAuth for social login

### Test the app

```bash
cd synapse
npm run dev
```

1. Open `http://localhost:3000` — should redirect to `/dashboard`
2. Navigate to `http://localhost:3000/signup`
3. Create an account with email/password
4. After signup, check **Authentication > Users** in dashboard — your user should appear
5. Check **Table Editor > profiles** — a profile row should have been auto-created by the trigger

---

## Step 8 (Optional): Enable OAuth Providers

In **Authentication > Providers**, you can enable:

### Google OAuth
1. Toggle Google ON
2. You'll need a Google Cloud OAuth Client ID and Secret
3. Create one at [console.cloud.google.com](https://console.cloud.google.com) > APIs & Services > Credentials
4. Set the redirect URL to: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`

### GitHub OAuth
1. Toggle GitHub ON
2. Create an OAuth App at [github.com/settings/developers](https://github.com/settings/developers)
3. Set the callback URL to: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`

> For local development, email/password works perfectly. Add OAuth when you're ready for production.

---

## Setup Checklist

- [ ] Create Supabase cloud project at [supabase.com](https://supabase.com)
- [ ] Copy Project URL, anon key, and service role key
- [ ] Create `.env.local` from `.env.example` with all keys filled in
- [ ] Install Supabase CLI (`npm install -g supabase`)
- [ ] Run `supabase login` to authenticate
- [ ] Run `supabase link --project-ref YOUR_REF` to link the project
- [ ] Enable extensions: **vector**, **pg_trgm**, **uuid-ossp**
- [ ] Run `supabase db push` to apply migrations
- [ ] Verify all 15 tables exist in Table Editor
- [ ] Verify RLS policies are active on all tables
- [ ] Run `npm run dev` and test signup at localhost:3000/signup
- [ ] Verify user appears in Authentication > Users
- [ ] Verify profile row auto-created in profiles table
- [ ] (Optional) Get Anthropic API key from [console.anthropic.com](https://console.anthropic.com)
- [ ] (Optional) Get OpenAI API key from [platform.openai.com](https://platform.openai.com)
- [ ] (Optional) Enable Google/GitHub OAuth providers

---

## Troubleshooting

### "Missing Supabase URL or API key" error in browser
- Check that `.env.local` has `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` set correctly
- Restart the dev server after changing env vars (`npm run dev`)

### Migration fails with "extension does not exist"
- Enable the required extensions (vector, pg_trgm, uuid-ossp) in the dashboard BEFORE running `supabase db push`

### Signup works but no profile row created
- Check that the `handle_new_user` trigger exists: go to Database > Functions and look for it
- The trigger fires on `auth.users` INSERT and creates a row in `public.profiles`

### 500 error on all pages
- The middleware tries to refresh the Supabase session on every request
- If env vars are missing, it gracefully skips (guard was added in Phase 1)
- Double-check `.env.local` values are correct and the dev server was restarted

### "Invalid API key" error
- Make sure you copied the **anon** key (not the service role key) for `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- The keys look similar but serve different purposes
