# Synapse Agent Architecture — Quick Reference

## Overview
10 agents in a 2-tier hierarchy. Tier 1 orchestrates, Tier 2 executes.

---

## Tier 1: Orchestrator Agents

| File | Agent | Role | When to Use |
|------|-------|------|-------------|
| `o1-system-architect.md` | System Architect | Design authority, cross-agent coordination | Before/during/after every phase, architectural decisions |
| `o2-requirements-analyst.md` | Requirements Analyst | Feature specs, acceptance criteria | Before each phase, unclear scope, before QA |
| `o3-deep-research.md` | Deep Research | Technical investigation, library evaluation | Tech decisions, stuck on bugs, need evidence |
| `o4-learning-guide.md` | Learning Guide | Progressive teaching, concept explanations | New tech, "why/how?" questions, debugging methodology |

## Tier 2: Domain Agents

| File | Agent | Embedded Skills | Primary Phases |
|------|-------|----------------|---------------|
| `a1-db-backend.md` | DB Backend | +security, +backend-architect | 1-4 |
| `a2-ui-frontend.md` | UI Frontend | +performance, +frontend-architect | 1-12 |
| `a3-ai-pipeline.md` | AI Pipeline | (self-contained) | 2-6 |
| `a4-chrome-ext.md` | Chrome Extension | (self-contained) | 5 |
| `a5-qa-testing.md` | QA Testing | +refactoring, +security-scan, +perf-bench | End of each phase |
| `a6-devops-infra.md` | DevOps & Infra | +technical-writer, +tech-researcher | 1, 12, on-demand |

---

## Agent Deployment Guide

Use a **mix of three approaches** depending on task complexity:

### 1. Direct Role Switching (simple/focused tasks)
Tell me which agent to use:
```
"Use db-backend agent to write the RLS policies"
"Switch to ui-frontend and build the sidebar"
```
I read the agent prompt, adopt its identity/rules/file boundaries, and work as that agent.

### 2. Parallel Subagents (independent tasks that can run simultaneously)
I spawn multiple agents via the Task tool:
```
Task(a1-db-backend) → migrations + RLS     ┐
Task(a2-ui-frontend) → auth pages + layout  ├── run in parallel
Task(a6-devops-infra) → turbo.json + config ┘
```
Best when 2-3 agents can work on non-overlapping files at the same time.

### 3. Full Orchestration (complex features spanning multiple agents)
Follow the Tier 1 → Tier 2 protocol:
1. Load `o1-system-architect` → define contracts/interfaces
2. Optionally load `o2-requirements-analyst` → write acceptance criteria
3. Spawn domain agents (Tier 2) → implement in parallel
4. Load `a5-qa-testing` → verify everything works

### When to Use Which
| Scenario | Approach |
|----------|----------|
| Single file change, quick fix | Direct role switching |
| Phase kickoff with multiple agents | Parallel subagents |
| New feature touching 3+ systems | Full orchestration |
| Learning a new concept | Direct: `o4-learning-guide` |
| Stuck on a bug or tech decision | Direct: `o3-deep-research` |

---

## Parallelization
- Max parallel domain agents: **3**
- Orchestrator agents run before/after domain agents, or on-demand
- QA testing runs after domain agents complete each phase
- Learning guide and deep research are available on-demand throughout

## Key Principles
1. Each domain agent owns specific files and never touches another agent's files
2. Tier 1 orchestrates, Tier 2 executes
3. Contracts before code — interfaces and specs defined before implementation
4. Cross-cutting skills (security, performance, docs) are embedded in relevant agents
5. All inter-agent communication flows through Tier 1
