# AI topology

Working architecture for AI-TTRPG agent roles, model providers, memory/retrieval, and the orchestrator tool surface.

Sketches (not final):

- [Topology sketch](./assets/ai-topology-sketch.png)
- [Starting orchestrator tools](./assets/orchestrator-tools-sketch.png)

Status: **design draft**. Open to agentic suggestions and product revision before implementation tickets.

---

## Goals

1. **Deterministic verbs, flexible narrative.** Static game actions go through a locked tool surface. The DM gets a wide catalog; NPCs only get **sheet action** call points. Storytelling stays with language models.
2. **Remember what matters.** World history, quests, and per-NPC memory must survive long campaigns without stuffing entire logs into every prompt.
3. **Player-controlled compute.** Settings expose three agent tiers; each can run on local models, cloud APIs, or Player2.
4. **Local-first data.** Campaign state and retrieval indexes live on disk in a local database suited to agentic RAG over large text volumes.
5. **Monorepo with hard barriers.** Three core packages—orchestrator (backend), DM and NPC (thin agent shells). See [Monorepo packages](./monorepo-packages.md).

---

## Three agent tiers

Settings expose **three independently configured roles**. Each role has its own model + provider. The same physical model may back more than one role, but the *roles* stay distinct so prompts, tools, and retrieval scopes do not collapse.

```text
┌─────────────────┐
│  Orchestrator   │  tools only — typed action bus (MCP-shaped)
└────────┬────────┘
         │
    ┌────┴────────────────────┐
    │ wide catalog            │ sheet-bound actions only
    ▼                         ▼
┌────────┐              ┌──────────┐
│   DM   │              │  NPC × N │
└────────┘              └──────────┘
```

| Tier | Job | Talks? | Tools? |
|------|-----|--------|--------|
| **Orchestrator** | Execute and validate static game actions; return structured results / diffs | No — action only | Owns the full tool catalog + runs sheet action pipelines |
| **DM** | Narrate, decide scene flow, manage presence, mutate world via tools | Yes | **Wide** orchestrator catalog (create/kick NPCs, clock, regions, inventory, dice, etc.) |
| **NPC** | Speak/act in character for one entity | Yes | **Only** actions listed on that NPC’s character sheet (call points) |

Enemies are **NPCs**. Creating a monster is `create_npc` with combat actions on the sheet (e.g. wolf A → `claw`).

### Who can call what

- **DM** → broad orchestrator tools. Side effects must go through tools, not prose (“you rolled a 17”).
- **NPC** → cannot call the DM catalog. At turn time the runtime exposes only that instance’s **sheet actions** as tool call points. Choosing `Talk` or `Attack` is a tool call; the orchestrator runs the action’s defined pipeline and returns structured results.
- **Orchestrator** → never narrates; it validates, executes, stamps `game_clock`, writes DB.

### Sheet actions (NPC call points)

Actions are **line items on the character sheet**, authored at create/update time (and editable later via orchestrator). Each line is a named call point with a machine-readable effect pipeline—not free-form “do something cool.”

Example sheet fragment after generation:

| Action | Pipeline (illustrative) |
|--------|-------------------------|
| `Talk` | Post a message to the active chat as this NPC |
| `Attack` | `roll_dice` d20 (+ mods) vs target defense → on hit, `roll_dice` damage die (e.g. d6) → subtract HP from target via authoritative state write |

Another NPC might get `Claw`, `Howl`, or no `Talk` at all. The model only sees tools that appear on **its** sheet for this turn.

**Design rules for sheet actions:**

- Pipelines compose orchestrator primitives (`roll_dice`, chat post, HP/inventory mutations)—NPCs do not invent new side-effect kinds at runtime.
- Targets and params are typed (e.g. `Attack` requires `target_id`).
- Failed validation (out of range, invalid target, missing action) returns a typed error; the NPC/DM recovers without mutating state.
- DM tools can still add/remove/rewrite actions on a sheet when the fiction requires it (level-up, cursed weapon, etc.).

### Interaction pattern

1. Player input lands with the **DM**.
2. DM retrieves relevant world/quest/NPC context (RAG).
3. When world/state must change, DM issues **wide** orchestrator tool calls.
4. Orchestrator validates, mutates local DB, returns structured results (including diffs where noted).
5. DM may invite present **NPCs** to act; each NPC gets memory pack + **only its sheet actions** as tools.
6. NPC tool calls run through the orchestrator action pipelines; results feed back into narration/chat.
7. All messages/events stamp the **game clock** (see tools).
---

## Model & provider settings

In app settings, each of **Orchestrator**, **DM**, and **NPC** can choose:

| Field | Meaning |
|-------|---------|
| **Provider / source** | Where inference runs |
| **Model** | Concrete model id available for that source |
| **Credentials** | API keys / Player2 linkage when required (never committed; OS keychain or app secret store) |

### Provider sources

| Source | When available | Notes |
|--------|----------------|-------|
| **Local** | Always (default path) | Bundled/installed local runtimes; ship with **lightweight defaults** so a cold install can play without an API key. Heavier local models are opt-in installs. |
| **Anthropic** | When an Anthropic API key is configured | Anthropic models appear in the per-tier model list. |
| **Player2** | When Player2 is selected / linked | Player2-backed models appear in the list. |

UI rule of thumb: the model picker is **filtered by configured sources**. Hook up Anthropic → Anthropic options appear. Choose Player2 → Player2 options. Otherwise stay on local defaults.

**Suggestion — role defaults (revisable):**

| Tier | Default bias |
|------|----------------|
| Orchestrator | Smallest reliable local (or cheap cloud) model; tool-calling accuracy over prose quality |
| DM | Strongest available narrative/reasoning model the user configured |
| NPC | Mid/small model; many concurrent speakers, shorter context |

NPC may later support “one model for all NPCs” vs “override per NPC”; v1 can be a single NPC-tier setting applied to every NPC instance.

---

## Memory & RAG

Long campaigns fail if every turn reloads the full transcript. Each scope retrieves **on demand**.

### Scopes

| Scope | Owned by | Contents |
|-------|----------|----------|
| World history | DM | Long-arc chronicle of the campaign world |
| Key events | DM | High-impact milestones (priority retrieval) |
| World events | DM | Broader event log (recency + relevance) |
| Quests | DM | Active/completed quest state and beats |
| NPC history | NPC | Personal backstory (mostly stable) |
| NPC facts | NPC | Facts gained through play (growing) |
| Current window | NPC | Only events while this NPC is **present** in the chat; leave chat → window clears for that session (durable facts/history still persist) |
| NPC character sheet | NPC | Stats, level, inventory pointer, **action line items** (call points) |

**NPC recall policy:** prefer **high-impact** memories first, then fall back to **recency**. Impact ranking can start rule-based (tagged key events, quest beats, combat outcomes, relationship changes) and later learn weights.

### Retrieval contract (per turn)

Each agent call receives:

1. **Pinned** — role system prompt + character sheet (NPC) or campaign rules (DM).
2. **Working window** — recent messages for entities currently present.
3. **Retrieved chunks** — top-k from the relevant scope(s), filtered by game-clock and tags.
4. **Tool results** — fresh orchestrator outputs for this turn.

Never dump entire NPC history into every prompt; retrieve.

---

## Local database recommendation

**Recommendation: SQLite as the system of record, with FTS5 + vector extension for retrieval.**

| Concern | Choice | Why |
|---------|--------|-----|
| Primary store | **SQLite** (`better-sqlite3` or `libsql` in Electron main) | Single-file campaigns, transactional, excellent for structured sheets/inventory/clock; already a natural Electron fit |
| Keyword / phrase search | **FTS5** | Cheap lexical search over large prose; good for exact names, places, item ids |
| Semantic RAG | **sqlite-vec** (or LanceDB if vectors outgrow SQLite) | Keeps embeddings next to rows; one backup story; agentic tools can SQL + vector in one process |
| Embeddings | Local embedding model by default; optional cloud embedder later | Offline campaigns stay coherent; same chunk table either way |
| Chunking | Paragraph/scene chunks with `game_clock`, `scope`, `entity_id`, `priority`, `source_event_id` | Enables “what did this NPC see after year 3?” style filters |

**Why not only a vector DB?** Agentic play needs joins: inventory ↔ sheet ↔ events ↔ quests. Pure vector stores are weak at that. **Why not Postgres?** Overkill for a single-player desktop app; ops burden without multi-user need.

**Text volume:** treat narrative as append-only **events** + derived **chunks**. Summarize cold history into “key events” periodically (orchestrator or offline job) so RAG stays bounded. Cap retrieved token budgets per tier in settings later.

**Campaign layout (illustrative):**

```text
~/Library/Application Support/ai-ttrpg/campaigns/<id>/
  campaign.sqlite      # state + FTS + vectors
  blobs/               # optional large markdown exports
```

---

## Orchestrator = typed action bus (MCP-shaped, not MCP-on-the-wire)

The orchestrator **does not chat**. It is a **typed tool registry** in Electron main (or a utility process): JSON-Schema-style tool definitions, validation, side effects, structured returns. That locks static actions so models cannot hallucinate dice, HP, or inventory.

### Decision: mirror MCP shapes, do not ship a real MCP server in v1

| Option | Verdict |
|--------|---------|
| **In-process tool API with MCP-compatible schemas** | **Choose for v1** — same mental model as MCP (tools only, typed I/O), native Electron fit, no stdio/HTTP server lifecycle, easy to unit test |
| Real MCP server (stdio/SSE) in-app | Defer — add later as an **adapter** over the same registry if we want Cursor/external clients to drive campaigns |

Rationale: DM and NPC callers already live inside the app. A wire MCP process adds failure modes without helping the first player loop. Keeping definitions MCP-shaped means a future `OrchestratorMcpAdapter` is a thin export, not a rewrite.

### Design rules

- **No talk, only action** — responses are JSON/tool results, not narration.
- **Validate then mutate** — reject illegal state transitions with typed errors callers can recover from.
- **Diffs for reviewable writes** — region create/update returns a diff; DM approves or retries.
- **Idempotency keys** where retries are likely (create NPC, inventory moves).
- **Game clock on every write** — messages, events, and tool results carry `game_clock`.
- **Dual surfaces, one executor** — DM sees the wide catalog; each NPC sees a **filtered view** derived from its sheet actions; both hit the same orchestrator runtime.

### DM tool catalog

Full creative catalog (domains, v1 slice, sheet schema, pipeline DSL):

→ **[Orchestrator catalog & NPC sheet actions](./orchestrator-catalog.md)**

Topology summary: DM gets the **wide** catalog; each NPC gets only materialised `sheet.actions[]` call points. Sheet actions are JSON line items with `params_schema` + declarative `pipeline` ops over orchestrator primitives (e.g. `Talk` → `chat_post`; `Attack` → d20 → damage die → `apply_damage`).

### NPC tool surface (derived)

Not a separate server. At invoke time:

1. Load the NPC’s character sheet `actions[]`.
2. Materialize each enabled action as a tool call point (`id`, `description`, `params_schema`).
3. Bind each call to `orchestrator.runAction` for that pipeline.
4. Reject any tool name not on the sheet.

Primitives like raw `roll_dice` or `inventory_remove` are **not** exposed to NPCs unless packaged inside a sheet action.

### Region create/update flow

```text
DM prompt (+ optional region id)
        │
        ▼
Orchestrator draft → diff
        │
        ├─ DM approve → commit
        └─ DM reject → retry (≤ 3), retain best candidate
```

---

## Electron process placement (sketch)

Package boundaries: [Monorepo packages & barriers](./monorepo-packages.md).

| Concern | Process | Package |
|---------|---------|---------|
| SQLite, tools, pipelines, memory indexes | **Main** / utility | `@ai-ttrpg/orchestrator` |
| DM / NPC prompt + model loops | **Main** / utility | `@ai-ttrpg/dm`, `@ai-ttrpg/npc` |
| Thin IPC for settings + chat stream | **Preload** | app host only |
| Settings UI, chat UI, banners | **Renderer** | `apps/desktop` (no domain imports) |

Models never run inside an unsandboxed renderer with Node. Local inference and API keys stay on the main/utility side. Game truth stays in orchestrator—not in agent packages or the UI.

---

## Open decisions

Track these before locking implementation epics:

1. **Action pipeline ergonomics** — visual editor later vs JSON-only v1; max ops per action (catalog suggests 32).
2. **Embedding model default** — which local embedder ships; dimension + chunk size budgets.
3. **Memory compaction** — scheduled summarization into key events vs on-demand when retrieval quality drops.
4. **Multi-NPC concurrency** — sequential speaker turns vs parallel generation with merge.
5. **Provider tool-calling matrix** — local / Anthropic / Player2 support for DM-wide tools and NPC sheet tools; fallback if a model cannot call tools.
6. **Optional later MCP adapter** — export the same registry over stdio/SSE for external drivers (not required for v1 play).

UI architecture docs are owned by a separate effort; not tracked here.

Catalog detail (tool list + sheet storage) lives in [orchestrator-catalog.md](./orchestrator-catalog.md); the JSON pipeline DSL there is the working proposal for sheet actions.

---

## Out of scope for this doc

- Concrete TypeScript file trees inside packages (see monorepo doc for package-level layout)
- Prompt templates for DM/NPC
- UI wireframes / settings chrome (other doc owner)
- Full combat rules beyond “sheet actions compose orchestrator primitives”

Those belong in follow-on architecture or implementation tickets.
