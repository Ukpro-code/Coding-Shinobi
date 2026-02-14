# Synapse -- AI-Powered Knowledge Management Platform

## Project Overview

Synapse is an AI-powered knowledge management platform that helps users capture, organize, connect, and retrieve knowledge using intelligent agents. It combines modern web technologies with AI capabilities to provide a seamless knowledge workflow.

## Tech Stack

| Layer            | Technology                                      |
| ---------------- | ----------------------------------------------- |
| Framework        | Next.js 15 (App Router, Server Components)      |
| Database         | Supabase (PostgreSQL, Auth, Storage, Realtime)   |
| Styling          | Tailwind CSS v4                                  |
| UI Components    | shadcn/ui                                        |
| State Management | Zustand (client), TanStack React Query (server)  |
| AI               | Claude API (reasoning), OpenAI (embeddings)      |
| Monorepo         | Turborepo                                        |
| Language         | TypeScript (strict mode)                         |
| Package Manager  | npm                                              |

## Monorepo Structure

```
synapse/
├── apps/
│   ├── web/                 # Next.js 15 main application
│   └── extension/           # Browser extension (future)
├── packages/
│   ├── shared/              # Shared types, utils, constants
│   └── db/                  # Supabase client, queries, types
├── supabase/                # Supabase migrations, seeds, config
├── .claude/
│   └── agents/              # Agent definition files
├── turbo.json
├── tsconfig.base.json
├── package.json
└── CLAUDE.md                # This file
```

### Key Directories in `apps/web/`

```
apps/web/
├── src/
│   ├── app/                 # Next.js App Router pages & layouts
│   ├── components/          # React components
│   │   ├── ui/              # shadcn/ui primitives
│   │   ├── features/        # Feature-specific components
│   │   └── layout/          # Shell, sidebar, nav components
│   ├── lib/                 # Utilities, helpers, constants
│   ├── hooks/               # Custom React hooks
│   ├── stores/              # Zustand stores
│   ├── services/            # API service functions
│   └── types/               # TypeScript type definitions
├── public/                  # Static assets
└── tsconfig.json            # Extends tsconfig.base.json
```

## Agent Architecture

Synapse uses a 10-agent, 2-tier architecture. Agent definition files live in `.claude/agents/`.

### Tier 1 -- Core Agents

| Agent              | Responsibility                                  |
| ------------------ | ----------------------------------------------- |
| Orchestrator       | Task routing, agent coordination, conflict resolution |
| Database Architect | Supabase schema, migrations, RLS policies, queries |
| Frontend Architect | Next.js pages, layouts, routing, server components |
| UI Engineer        | shadcn/ui components, Tailwind styling, responsive design |
| API Engineer       | Route handlers, server actions, middleware, validation |

### Tier 2 -- Specialist Agents

| Agent              | Responsibility                                  |
| ------------------ | ----------------------------------------------- |
| AI Integration     | Claude API, OpenAI embeddings, prompt engineering |
| Auth & Security    | Supabase Auth, RLS, RBAC, session management    |
| State Manager      | Zustand stores, TanStack Query, caching strategy |
| Testing Agent      | Unit tests, integration tests, E2E tests        |
| DevOps Agent       | CI/CD, deployment, environment config, monitoring |

### File Ownership Boundaries

Each agent owns specific directories and file patterns. The Orchestrator resolves conflicts when changes span multiple ownership boundaries.

- **Database Architect**: `supabase/`, `packages/db/`
- **Frontend Architect**: `apps/web/src/app/`, `apps/web/src/components/layout/`
- **UI Engineer**: `apps/web/src/components/ui/`, `apps/web/src/components/features/`, Tailwind config
- **API Engineer**: `apps/web/src/app/api/`, `apps/web/src/services/`
- **AI Integration**: `apps/web/src/lib/ai/`, `apps/web/src/services/ai/`
- **Auth & Security**: `apps/web/src/lib/auth/`, `apps/web/src/middleware.ts`, RLS policies
- **State Manager**: `apps/web/src/stores/`, `apps/web/src/hooks/`
- **Testing Agent**: `**/*.test.ts`, `**/*.test.tsx`, `**/*.spec.ts`
- **DevOps Agent**: `.github/`, `turbo.json`, `Dockerfile`, deployment configs

## Key Conventions

### General

- TypeScript strict mode everywhere. No `any` types unless absolutely necessary.
- Use UUID v4 for all primary keys.
- All timestamps stored as `timestamptz` in the database.

### React / Next.js

- **Server Components by default.** Only add `'use client'` when the component needs interactivity (event handlers, hooks, browser APIs).
- Use the App Router exclusively. No Pages Router.
- Colocate loading, error, and not-found files with their page routes.
- Prefer server actions for mutations when possible.

### API Routes

- Return the `{ data, error }` pattern from all API route handlers:
  ```typescript
  // Success
  return NextResponse.json({ data: result, error: null });

  // Error
  return NextResponse.json({ data: null, error: 'Description' }, { status: 400 });
  ```
- Use Zod for validating all API inputs (request body, query params, route params).

### Database

- Row Level Security (RLS) on every table, no exceptions.
- All queries go through the Supabase client in `packages/db/`.
- Use database functions for complex operations.
- Migrations are sequential and never modified after being applied.

### Styling

- Use Tailwind CSS utility classes. Avoid custom CSS unless absolutely necessary.
- Follow shadcn/ui patterns for all UI components.
- Mobile-first responsive design.

### State Management

- **Server state**: TanStack React Query for fetching, caching, and synchronizing.
- **Client state**: Zustand for UI state, user preferences, and ephemeral state.
- Never duplicate server state in client stores.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (all apps)
npm run dev

# Build all packages and apps
npm run build

# Run linting
npm run lint

# Run tests
npm run test

# Run Supabase locally
npx supabase start

# Create a new migration
npx supabase migration new <migration_name>

# Push migrations to remote
npx supabase db push
```

## Environment Setup

1. Clone the repository and navigate to the `synapse/` directory.
2. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
3. Fill in the environment variables in `.env.local` with your actual keys.
4. Install dependencies:
   ```bash
   npm install
   ```
5. Start the local Supabase instance:
   ```bash
   npx supabase start
   ```
6. Run the development server:
   ```bash
   npm run dev
   ```
7. Open `http://localhost:3000` in your browser.

## Important Notes

- Never commit `.env` or `.env.local` files. Use `.env.example` as the template.
- Always run `npm run lint` before committing.
- Keep `packages/shared/` free of framework-specific code -- it should be pure TypeScript.
- When adding a new shadcn/ui component, use `npx shadcn@latest add <component>` from within `apps/web/`.
