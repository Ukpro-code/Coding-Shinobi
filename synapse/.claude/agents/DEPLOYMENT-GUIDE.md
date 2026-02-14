# Agent Deployment Guide

Use a **mix of three approaches** depending on task complexity.

---

## Approach 1: Direct Role Switching
**Best for:** Simple/focused tasks, single-agent work

Tell Claude which agent to use:
```
"Use db-backend agent to write the RLS policies"
"Switch to ui-frontend and build the sidebar"
"Act as the learning-guide and explain how pgvector works"
```

Claude reads the agent prompt file, adopts its identity/rules/file boundaries, and works as that agent.

**When to use:**
- Single file change or quick fix
- Learning a new concept (`o4-learning-guide`)
- Investigating a bug or tech decision (`o3-deep-research`)
- Focused work within one agent's file ownership

---

## Approach 2: Parallel Subagents
**Best for:** Independent tasks that can run simultaneously

Claude spawns multiple agents via the Task tool, each working on non-overlapping files:

```
Example — Phase 1 scaffolding:

Task(a6-devops-infra) → turbo.json, root configs      ┐
Task(a1-db-backend)   → Supabase init, migrations      ├── parallel
Task(a2-ui-frontend)  → Next.js scaffold, auth pages   ┘
```

**When to use:**
- Phase kickoff with 2-3 agents doing independent work
- Tasks that don't share files (respecting file ownership boundaries)
- When speed matters and work can be parallelized

**Max parallel domain agents:** 3

---

## Approach 3: Full Orchestration
**Best for:** Complex features spanning multiple agents/systems

Follows the Tier 1 → Tier 2 protocol:

```
Step 1: Load o1-system-architect
        → Define contracts, interfaces, data flow for the feature
        → Write phase briefing for each domain agent

Step 2: (Optional) Load o2-requirements-analyst
        → Break feature into user stories with acceptance criteria
        → Define edge cases, validation rules, error states

Step 3: Spawn domain agents (Tier 2) in parallel
        → Each agent implements their part within file ownership
        → Agents escalate questions to Tier 1

Step 4: Load a5-qa-testing
        → Run tests, security scan, performance audit
        → Verify acceptance criteria are met
```

**When to use:**
- New feature touching 3+ systems (frontend + backend + AI)
- Architectural decisions needed before implementation
- End-of-phase reviews

---

## Quick Reference Table

| Scenario | Approach | Agent(s) |
|----------|----------|----------|
| Fix a single bug | Direct | The agent that owns the file |
| Write database migrations | Direct | `a1-db-backend` |
| Build a UI component | Direct | `a2-ui-frontend` |
| Set up AI summarization | Direct | `a3-ai-pipeline` |
| Learn a new concept | Direct | `o4-learning-guide` |
| Stuck on a problem | Direct | `o3-deep-research` |
| Phase kickoff (scaffolding) | Parallel | 2-3 domain agents |
| New major feature | Orchestrated | architect → domain agents → QA |
| End-of-phase review | Orchestrated | architect + QA |
| Deploy to production | Direct | `a6-devops-infra` |

---

## Example Workflows

### Example 1: "Set up the database" (Direct)
```
You: "Use db-backend agent to create the database migrations"
Claude: Reads a1-db-backend.md → writes migrations, RLS policies, indexes
```

### Example 2: "Start Phase 1 Week 1" (Parallel)
```
You: "Start Phase 1 — scaffold the project"
Claude:
  → Spawns Task(a6-devops-infra): monorepo, turbo.json, configs
  → Spawns Task(a1-db-backend): supabase init, SQL migrations
  → Spawns Task(a2-ui-frontend): Next.js scaffold, auth pages, layout
  → All run in parallel on non-overlapping files
```

### Example 3: "Build the RAG chat feature" (Full Orchestration)
```
You: "Build the RAG chat feature end-to-end"
Claude:
  1. Loads o1-system-architect → defines API contract for /api/chat,
     chat message schema, streaming interface, RAG pipeline flow
  2. Loads o2-requirements-analyst → writes acceptance criteria,
     edge cases (empty knowledge base, long queries, rate limits)
  3. Spawns in parallel:
     - Task(a1-db-backend): chat_conversations + chat_messages tables, RLS
     - Task(a3-ai-pipeline): RAG pipeline, Claude streaming, embeddings search
     - Task(a2-ui-frontend): chat UI, conversation list, markdown rendering
  4. Loads a5-qa-testing → E2E tests, security review, performance check
```

---

## Agent File Locations

All agent prompts live in:
```
synapse/.claude/agents/
├── o1-system-architect.md
├── o2-requirements-analyst.md
├── o3-deep-research.md
├── o4-learning-guide.md
├── a1-db-backend.md
├── a2-ui-frontend.md
├── a3-ai-pipeline.md
├── a4-chrome-ext.md
├── a5-qa-testing.md
├── a6-devops-infra.md
├── README.md              ← quick reference table
└── DEPLOYMENT-GUIDE.md    ← this file
```
