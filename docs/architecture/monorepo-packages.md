# Monorepo packages & barriers

Monorepo layout for the three AI tiers. Goal: **orchestrator is backend**; **DM and NPC are thin agent shells** (prompt + model loop + tool calls)—closer to a UI layer than to game logic.

Companion docs: [AI topology](./ai-topology.md), [Orchestrator catalog](./orchestrator-catalog.md).

Status: **design draft**.

---

## Mental model

| Layer | Analogy | Allowed to contain | Forbidden |
|-------|---------|--------------------|-----------|
| **Orchestrator** | Backend / game server | Tools, validation, SQLite, pipelines, RAG indexes, clock, authoritative state | Prompts, chat UX, “what should the wolf say” |
| **DM** | UI + controller for the campaign brain | System/user prompt assembly, provider calls, choosing which orchestrator tools to invoke, turning tool results into narration | HP math, inventory rules, SQL, inventing dice results, sheet pipeline execution |
| **NPC** | UI + controller for one character | Persona prompt, memory pack assembly, calling **sheet action** tools only, speaking from tool results | Wide DM catalog, direct DB, mutating another entity except via returned action tools |

If a change “decides what is true in the world,” it belongs in **orchestrator**. If it “decides what to say or which tool to ask for,” it belongs in **DM/NPC**.

---

## Repository shape

```text
ai-ttrpg/
  apps/
    desktop/                 # Electron shell (main / preload / renderer)
  packages/
    orchestrator/            # @ai-ttrpg/orchestrator  — backend
    dm/                      # @ai-ttrpg/dm            — thin DM agent
    npc/                     # @ai-ttrpg/npc           — thin NPC agent
  docs/architecture/
  ...
```

**Three core packages** are `orchestrator`, `dm`, and `npc`. The Electron app is a **host**, not a fourth logic home: it wires providers, settings, IPC, and UI; it does not reimplement tools or agent policy.

Optional later (not core): `packages/shared-types` only if cross-cutting DTO duplication becomes painful. Prefer exporting contracts from `orchestrator`’s public API so the backend remains the source of truth.

---

## Package responsibilities

### `@ai-ttrpg/orchestrator` (backend)

Owns:

- Tool registry (DM-wide catalog + `runAction` for sheet pipelines)
- Campaign DB (SQLite + FTS + vectors), migrations, transactions
- Entity sheets, inventory, vitals, clock, quests, regions
- Memory write/query primitives used by tools
- Idempotency, diffs, audit log of tool calls
- Pure domain tests (no Electron, no LLM)

Public surface (illustrative):

```text
@ai-ttrpg/orchestrator
  createOrchestrator(config) → OrchestratorHandle
  // handle.tools.invoke(toolName, args, ctx)
  // handle.actions.run(entityId, actionId, args, ctx)
  // handle.memory.query(...)
  // types: ToolResult, Sheet, ActionDefinition, GameClock, ...
```

Implementation modules (`src/internal/**`) are **not** part of the publish/export graph.

Runs in Electron **main** (or utility process). Never in the renderer.

### `@ai-ttrpg/dm` (thin agent)

Owns:

- DM system prompt + turn framing
- Retrieval *requests* (calls orchestrator memory query APIs)—does not rank with bespoke SQL
- Model provider adapter usage for the DM tier setting
- Tool-calling loop against the **wide** orchestrator catalog
- Mapping structured `ToolResult`s into narrative messages (still posts chat via orchestrator `chat_post` when state must record it)

Must stay light:

- No `better-sqlite3`, no filesystem campaign paths, no pipeline interpreter
- Depends only on orchestrator **public** client/types + a small “LLM port” interface
- Prefer functions that are easy to test with a fake `OrchestratorHandle` and fake completer

### `@ai-ttrpg/npc` (thin agent)

Owns:

- Per-entity prompt (sheet summary + retrieved facts + current window)
- Model provider for the NPC tier
- Tool-calling loop limited to materialised sheet actions from orchestrator
- No access to DM-wide tools in code paths (even if the handle could expose them—see barriers)

Must stay light: same bans as DM. One NPC turn = assemble context → model → `actions.run` / refuse → return utterances/results upward.

---

## Dependency direction (hard)

```text
apps/desktop
    │
    ├──► @ai-ttrpg/dm  ──────┐
    ├──► @ai-ttrpg/npc ──────┼──► @ai-ttrpg/orchestrator  (public API only)
    └──► @ai-ttrpg/orchestrator
```

| From → To | Allowed? |
|-----------|----------|
| `dm` → `orchestrator` | Yes — public API only |
| `npc` → `orchestrator` | Yes — public API only |
| `dm` → `npc` | **No** |
| `npc` → `dm` | **No** |
| `orchestrator` → `dm` or `npc` | **No** |
| `desktop` → all three | Yes — composition root |
| Anyone → `orchestrator/src/internal` | **No** |

DM and NPC never import each other. The host sequences “DM turn then NPC turns.” That keeps agent packages replaceable and stops cross-contamination of prompts/tools.

---

## Enforced barriers (anti-spaghetti)

Barriers are **automated**, not honor-system.

### 1. Package exports

Each package sets `package.json` `"exports"` to a narrow entry (e.g. `"."` → `dist/index.js`). No `exports: { "./*": ... }` wildcard that re-exposes internals.

### 2. Dependency cruiser (CI-enforced)

`npm run boundaries` runs `scripts/package-barriers/check.mjs` (dependency-cruiser) over `packages/` and `src/renderer/`. CI job **`boundaries`** in `.github/workflows/pr-checks.yml` fails the PR on any error-severity violation.

Rules include:

- `dm` and `npc` may not import each other
- `orchestrator` may not import `dm` / `npc` or React
- Agents may not deep-import orchestrator `src/` (only the package entry → `src/index.ts`) or `src/internal/`
- Agents may not import `fs` / `path` / SQLite drivers / `electron`
- Renderer may not import domain packages
- No circular dependencies

Unit tests: `scripts/package-barriers/check.test.mjs` (clean graph + intentional violations).

### 3. TypeScript project references

Each package is its own `tsconfig` with `composite: true`. Path aliases point at package names (`@ai-ttrpg/orchestrator`), never at another package’s `src/`.

### 4. Capability-restricted handles

Do not hand DM and NPC the same fat god-object without narrowing:

```text
OrchestratorHandle          // full (main/host, tests)
  ├─ asDmFacade()           // wide tools + memory query + chat admin
  └─ asNpcFacade(entityId) // only action_list + actions.run + read sheet/memory for self
```

`@ai-ttrpg/npc`’s public constructors accept **`NpcFacade` only** (type-level). Even a mistaken import cannot call `create_npc` without casting through `unknown` (lint-banned).

### 5. No shared “utils dump”

Cross-cutting helpers either:

- live next to the only caller, or
- graduate into orchestrator if they encode domain truth, or
- stay in the desktop app if they are IPC/UI glue

Avoid `packages/utils` until something has **two real callers** and no domain home.

### 6. Test placement

| Package | Tests prove |
|---------|-------------|
| `orchestrator` | Tools, pipelines, DB invariants, clock, inventory—**majority of logic tests** |
| `dm` / `npc` | Prompt assembly + “calls tool X with args Y given model stub Z”—thin |
| `desktop` | IPC wiring, settings persistence, UI |

If a DM/NPC test needs complex world setup, that logic is probably in the wrong package—move it to orchestrator and test there.

---

## Electron host mapping

| Process | Loads |
|---------|--------|
| **Main / utility** | `@ai-ttrpg/orchestrator`, agent runners from `dm`/`npc`, provider keys, campaign paths |
| **Preload** | Typed IPC bridge only—no domain packages |
| **Renderer** | React UI; talks IPC; **does not** import orchestrator or run agents |

Agents may live in main to keep API keys and DB off the renderer. The thinness rule still applies: DM/NPC packages remain prompt+loop, orchestrator remains backend.

---

## What “light” means in practice

**DM package sketch (responsibilities only):**

1. `buildDmMessages(turnInput, memorySnippets) → messages[]`
2. `runDmTurn({ complete, facade, turnInput })` → may call `facade.tools.invoke` in a loop → returns narration plan / posted message ids
3. Provider-agnostic `complete(messages, tools)` injected by the host

**NPC package sketch:**

1. `buildNpcMessages(entityView, window, facts) → messages[]`
2. `runNpcTurn({ complete, facade, entityId })` → only `facade.actions.*`
3. Same injected `complete`

**Orchestrator** implements `facade.tools.invoke('apply_damage', …)` and sheet pipelines—hundreds of lines of domain code live here on purpose.

---

## Scaffolding checklist (when implementing)

- [x] npm workspaces root; `packages/*` (apps later)
- [x] Three packages with locked `exports`
- [x] dependency-cruiser rules + `npm run boundaries` + CI job
- [ ] `NpcFacade` / `DmFacade` types; NPC entrypoints refuse full handle
- [ ] Per-package vitest suites as logic lands
- [ ] Move any game rule found in `dm`/`npc` during review into `orchestrator` as a **Blocking** red-team item

---

## Out of scope here

- Exact folder names inside each package
- Provider plugin package splits (Anthropic / Player2 / local can start as host adapters)
- UI monorepo package (renderer stays under `apps/desktop` unless UI docs say otherwise)
