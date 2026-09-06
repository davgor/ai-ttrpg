# Orchestrator catalog & NPC sheet actions

Creative design draft for **everything the orchestrator can do**, and **how actions live on an NPC character sheet**.

Companion to [AI topology](./ai-topology.md). Status: **aspirational catalog** — ship in layers; do not block v1 on implementing every verb.

---

## Principles

1. **One executor.** Every mutation runs in the orchestrator. DM calls wide tools; NPCs call sheet-bound action ids that compile into the same primitives.
2. **Primitives compose.** Sheet actions are recipes over primitives (`roll_dice`, `apply_damage`, `chat_post`, …), not a second rules engine.
3. **Authoritative state.** HP, inventory, clock, quest flags, and “who is in chat” never exist only in prose.
4. **Diffs where fiction is generative.** World/region prose drafts return diffs for DM approve/retry. Mechanical rolls do not.
5. **Game clock everywhere.** Every tool result and persisted event includes `game_clock` (+ real `created_at` for debugging).

---

## Catalog at a glance

| Domain | Audience | Count (approx.) |
|--------|----------|-----------------|
| Dice & resolution | DM + pipelines | ~8 |
| Entities & sheets | DM | ~12 |
| Presence & chat | DM (+ `Talk` action) | ~8 |
| Vitals & conditions | DM + pipelines | ~10 |
| Inventory & economy | DM + pipelines | ~10 |
| Space, travel, scene | DM | ~12 |
| Time | DM + pipelines | ~5 |
| Quests & faction | DM | ~10 |
| Lore, secrets, revelation | DM | ~8 |
| Memory & RAG maintenance | DM / system | ~8 |
| Random tables & procedures | DM + pipelines | ~5 |
| Meta / session | DM / system | ~6 |
| Sheet action admin | DM | ~4 |

NPC-facing surface is **not** this list — it is whatever `actions[]` is on that sheet (see [Sheet storage](#npc-character-sheet-storage)).

---

## 1. Dice & resolution

| Tool | What it does |
|------|----------------|
| `roll_dice` | Parse expression (`2d6+3`, `1d20`, advantage/disadvantage flags); return faces, total, breakdown |
| `roll_check` | Ability/skill check: formula + DC → success/fail/degrees |
| `roll_opposed` | Two formulas (or entity refs); return winner + margins |
| `roll_attack` | Convenience: to-hit vs defense stat on target; optional crit threshold |
| `roll_damage` | Damage expression + type tags; does **not** apply HP (pair with `apply_damage`) |
| `roll_table` | Weighted / listed table id → row result (loot, weather, rumor) |
| `roll_death_save` | Track death-save successes/failures on an entity |
| `seed_rng` / `get_rng_state` | Deterministic campaign RNG for replay/tests (DM/system) |

---

## 2. Entities & sheets

| Tool | What it does |
|------|----------------|
| `create_npc` | Create entity + sheet (name, kind, backstory seed, stats, inventory, **actions[]**) |
| `create_player_character` | Same shape as NPC sheet but flagged `kind: player` (party member the human drives) |
| `get_entity` | Fetch sheet + vitals + presence flags |
| `list_entities` | Filter by kind, location, tags, alive, in_chat |
| `update_sheet` | Patch stats, proficiencies, description fields (diff optional for large prose) |
| `set_entity_tags` | Add/remove tags (`hostile`, `merchant`, `undead`, …) |
| `set_disposition` | Attitude toward player/party/faction (−2…+2 or enum) |
| `set_entity_location` | Place entity in a region/site without travel montage |
| `clone_entity` | Duplicate sheet as new id (wolf A/B/C packs) |
| `archive_entity` | Soft-delete; leave history intact |
| `rename_entity` | Display name change + lore note |
| `link_entities` | Relationship edge (spouse, rival, master, mount) |

`create_npc` **must** accept an initial `actions[]` (or a template id that expands to actions). Enemies are NPCs with combat actions.

---

## 3. Presence & chat

| Tool | What it does |
|------|----------------|
| `chat_add_participant` | Add entity to active chat (starts NPC **current window**) |
| `chat_remove_participant` | Kick from chat (clears current window; durable memory stays) |
| `chat_list_participants` | Who is present now |
| `chat_post` | Authoritative message as `speaker_id` (player, DM-as-narrator, or NPC) |
| `chat_whisper` | Message visible only to subset (player + listed entities) |
| `chat_system` | OOC/system line (rules notice, clock skip summary) |
| `chat_set_focus` | Hint UI/DM which speaker is “up” |
| `chat_pin_message` | Pin for session (orders, riddles, maps) |

Sheet action `Talk` is almost always a thin wrapper around `chat_post` with `speaker_id` bound to self.

---

## 4. Vitals & conditions

| Tool | What it does |
|------|----------------|
| `apply_damage` | Subtract HP; respect temp HP, resistances/vulnerabilities tags; emit downed/dead events |
| `heal` | Restore HP up to max |
| `set_hp` | Fiat set current/max (DM rescue) |
| `set_vital` | Generic vitals: stamina, sanity, mana, hunger, etc. |
| `apply_condition` | Add condition with optional duration in **game clock** (`poisoned` until `clock+2d`) |
| `remove_condition` | Clear condition(s) |
| `list_conditions` | Active conditions for entity |
| `knock_out` / `revive` | Unconscious / stable helpers |
| `kill_entity` | Mark dead; trigger loot/memory hooks |
| `set_defense` | AC / evade / save bonuses used by `roll_attack` |

---

## 5. Inventory & economy

| Tool | What it does |
|------|----------------|
| `inventory_add` | Add item stack to entity (or container) |
| `inventory_remove` | Remove qty; fail if missing |
| `inventory_transfer` | A → B atomically |
| `inventory_move_to_container` | Chest, saddlebag, vault |
| `inventory_equip` / `inventory_unequip` | Slots; may grant/revoke sheet actions (magic sword → `Sword Strike`) |
| `inventory_use` | Consumable: run item’s `on_use` pipeline then decrement |
| `inventory_inspect` | Structured item record (not flavor prose) |
| `currency_add` / `currency_remove` | Coin purses by denomination or single “gold” unit |
| `set_encumbrance_policy` | Optional weight rules on/off |

---

## 6. Space, travel, scene

| Tool | What it does |
|------|----------------|
| `region_create_draft` | Generative draft → **diff** (DM approve / retry ≤ 3 / keep best) |
| `region_update_draft` | Same for existing region |
| `region_commit` | Apply approved diff |
| `region_get` / `region_list` | Read structured region + linked sites |
| `site_create` / `site_update` | Inns, dungeons rooms, streets inside a region |
| `set_scene` | Active scene bundle: region, site, ambient tags, present entities |
| `set_weather` / `set_lighting` / `set_time_of_day` | Scene atmosphere (also clock-aligned) |
| `travel` | Move party/entities along route; advance clock by travel duration; optional encounter flag |
| `set_barrier` | Lock/unlock door, bridge, ward; requires key tag or check |
| `reveal_map_node` | Mark location known to player |
| `hide_map_node` | Fog again (curse, amnesia) |

---

## 7. Time

| Tool | What it does |
|------|----------------|
| `clock_get` | Current game timestamp (+ calendar label) |
| `clock_advance` | Add delta (rounds / hours / days / years) |
| `clock_set` | Fiat jump (with mandatory reason event) |
| `clock_diff` | Duration between two stamps or “now vs last_seen(entity)” |
| `clock_schedule` | Schedule a world event at future clock (alarm → `world_event` when reached) |

Attach `game_clock` to messages, tool results, conditions, and memory chunks.

---

## 8. Quests & faction

| Tool | What it does |
|------|----------------|
| `quest_create` | Title, summary, giver, objectives[] |
| `quest_update` | Patch text / stages |
| `quest_set_objective` | Complete / fail / reveal objective |
| `quest_complete` / `quest_fail` | Terminal states + rewards hooks |
| `quest_list` | Filter active/done by entity or region |
| `faction_create` / `faction_set_standing` | Reputation ladders |
| `faction_add_member` | Tie entity to faction |
| `bounty_set` | Wanted level / price on entity |

---

## 9. Lore, secrets, revelation

| Tool | What it does |
|------|----------------|
| `lore_write` | Structured lore entry (scoped: world / region / entity) |
| `lore_revise` | Diff-approve for large generative lore (same 3-retry pattern) |
| `secret_create` | Hidden fact + discovery conditions |
| `secret_reveal_to` | Mark known by player and/or entities; write NPC facts |
| `rumor_add` | Unreliable lore with confidence weight |
| `knowledge_check` | Did entity/player know X at clock T? |
| `set_visibility` | What the player UI may show vs DM-only |

---

## 10. Memory & RAG maintenance

Usually DM or system jobs; keeps retrieval sane.

| Tool | What it does |
|------|----------------|
| `memory_add_world_event` | Append world event chunk |
| `memory_add_key_event` | High-priority milestone |
| `memory_add_npc_fact` | Durable fact on an NPC |
| `memory_add_npc_history` | Backstory segment |
| `memory_pin` / `memory_unpin` | Force priority for retrieval |
| `memory_compact` | Summarize cold range → key events; mark source range compacted |
| `memory_reindex` | Rebuild embeddings/FTS for a scope |
| `memory_query` | Debug/admin retrieval preview (not for NPC freeform) |

NPC **current window** is maintained by presence tools, not by freeform memory writes.

---

## 11. Random tables & procedures

| Tool | What it does |
|------|----------------|
| `table_register` | Define/replace a named table |
| `table_roll` | Alias of `roll_table` with stricter typing |
| `procedure_start` | Multi-step scripted bit (chase, chase clock, skill challenge) |
| `procedure_advance` | Push stage; may call nested tools |
| `procedure_resolve` | Complete with outcome tags |

---

## 12. Meta / session

| Tool | What it does |
|------|----------------|
| `campaign_get_meta` | Title, ruleset profile, seed |
| `ruleset_set_profile` | Soft rules knobs (crit range, death rules) — not full SRD dump |
| `session_checkpoint` | Named save snapshot |
| `session_restore` | Restore checkpoint (destructive; confirm in UI) |
| `audit_list` | Recent tool calls (debug / anti-hallucination) |
| `noop` | Health/ping |

---

## 13. Sheet action admin (DM)

| Tool | What it does |
|------|----------------|
| `action_grant` | Append action line item to sheet |
| `action_revoke` | Remove by `action_id` |
| `action_update` | Replace pipeline / schema / description |
| `action_list` | Actions on entity (what the NPC model would see) |

Equipping items may call these under the hood.

---

## Suggested v1 slice

Ship first loop without boiling the ocean:

1. Dice: `roll_dice`, `roll_check`, `roll_attack`, `roll_damage`
2. Entities: `create_npc`, `get_entity`, `update_sheet`, `clone_entity`
3. Presence/chat: `chat_add_participant`, `chat_remove_participant`, `chat_post`
4. Vitals: `apply_damage`, `heal`, `apply_condition`, `remove_condition`
5. Inventory: `inventory_add`, `inventory_remove`, `inventory_transfer`
6. Time: `clock_get`, `clock_advance`, `clock_diff`
7. Space: `region_create_draft` / `region_commit` (diff flow), `set_scene`
8. Memory: `memory_add_key_event`, `memory_add_npc_fact`
9. Action admin: `action_grant`, `action_revoke`, `action_update`
10. Default sheet actions on create: `Talk`, `Attack` (template)

Everything else can land as follow-on epics without changing the sheet storage model.

---

## NPC character sheet storage

Sheet is a versioned JSON document on the entity row (SQLite), plus normalized tables for inventory/vitals if joins help. Actions live **on the sheet document** so cloning and templates stay simple.

### Top-level sheet shape

```json
{
  "schema_version": 1,
  "entity_id": "npc_wolf_a",
  "kind": "npc",
  "display_name": "Wolf A",
  "summary": "Lean grey wolf, pack hunter.",
  "backstory_ref": "mem:npc_history:npc_wolf_a",
  "tags": ["beast", "hostile"],
  "level": 1,
  "stats": {
    "str": 12,
    "dex": 15,
    "con": 12,
    "int": 3,
    "wis": 12,
    "cha": 6,
    "ac": 13,
    "hp_max": 11,
    "hp_current": 11,
    "speed": "40ft",
    "proficiency_bonus": 2
  },
  "vitals_extra": {},
  "inventory_id": "inv_npc_wolf_a",
  "disposition": { "party": -1 },
  "location_id": "site_darkwood_edge",
  "actions": [],
  "action_templates_applied": ["beast_basic"],
  "updated_at_clock": "3.124.08:00",
  "updated_at": "2026-09-06T07:00:00Z"
}
```

### Action line item (the call point)

Each entry in `actions[]` is what the NPC runtime materializes as a tool.

```json
{
  "id": "attack",
  "name": "Attack",
  "description": "Bite or claw a target in reach.",
  "kind": "attack",
  "icon": "claw",
  "enabled": true,
  "visibility": "owner",
  "availability": {
    "requires_presence": true,
    "requires_alive": true,
    "once_per_turn": true,
    "uses": null,
    "conditions_blocked_by": ["paralyzed", "unconscious"],
    "range": "melee",
    "resource_cost": []
  },
  "params_schema": {
    "type": "object",
    "required": ["target_id"],
    "properties": {
      "target_id": { "type": "string", "description": "Entity to attack" }
    }
  },
  "pipeline": []
}
```

| Field | Role |
|-------|------|
| `id` | Stable tool name exposed to the NPC model (`attack`) |
| `name` / `description` | Human + model facing labels |
| `kind` | Hint for UI/templates: `talk` \| `attack` \| `spell` \| `skill` \| `item` \| `custom` |
| `availability` | Hard gates checked before pipeline runs |
| `params_schema` | JSON Schema for the tool call arguments |
| `pipeline` | Ordered ops; the recipe the orchestrator runs |

### Pipeline DSL (declarative JSON ops)

Chosen approach: **JSON op list** (not free script). Easy to validate, diff, and version. Ops may only call allowlisted orchestrator primitives / pure helpers.

```json
{
  "id": "attack",
  "name": "Attack",
  "kind": "attack",
  "params_schema": {
    "type": "object",
    "required": ["target_id"],
    "properties": {
      "target_id": { "type": "string" }
    }
  },
  "pipeline": [
    {
      "op": "roll_dice",
      "expr": "1d20+@stats.str_mod+@stats.proficiency_bonus",
      "as": "to_hit"
    },
    {
      "op": "read",
      "path": "entity($target_id).stats.ac",
      "as": "target_ac"
    },
    {
      "op": "compare",
      "left": "$to_hit.total",
      "operator": "gte",
      "right": "$target_ac",
      "as": "hit"
    },
    {
      "op": "branch",
      "when": "$hit",
      "then": [
        { "op": "roll_dice", "expr": "1d6+@stats.str_mod", "as": "damage" },
        {
          "op": "apply_damage",
          "target_id": "$target_id",
          "amount": "$damage.total",
          "type": "slashing",
          "as": "damage_result"
        }
      ],
      "else": [
        { "op": "result", "status": "miss" }
      ]
    }
  ]
}
```

```json
{
  "id": "talk",
  "name": "Talk",
  "kind": "talk",
  "params_schema": {
    "type": "object",
    "required": ["text"],
    "properties": {
      "text": { "type": "string", "maxLength": 2000 }
    }
  },
  "pipeline": [
    {
      "op": "chat_post",
      "speaker_id": "@self",
      "text": "$text",
      "as": "message"
    }
  ]
}
```

### Expression bindings

| Token | Meaning |
|-------|---------|
| `@self` | Acting entity id |
| `@stats.*` | Acting entity sheet stats (incl. derived mods) |
| `$args` / `$name` | Tool call parameter |
| `$binding` | Prior step output |
| `entity(id).path` | Read other entity (subject to visibility rules) |

### Availability & equipping

- `action_grant` / item `grants_actions: ["sword_strike"]` append line items.
- Unequip runs `action_revoke` for item-owned ids (`source: { type: "item", item_id }`).
- Innate actions use `source: { type: "innate" }` and survive unequip.

```json
{
  "id": "sword_strike",
  "name": "Sword Strike",
  "source": { "type": "item", "item_id": "itm_iron_longsword" },
  "kind": "attack",
  "pipeline": []
}
```

### How the NPC sees tools at runtime

```text
sheet.actions
   │ filter enabled && availability
   ▼
materialize tools: [{ name: action.id, description, inputSchema: params_schema }]
   │
   ▼
NPC model may call only those names
   │
   ▼
orchestrator.runAction(entity_id, action_id, args)
   │ gates → pipeline ops → single DB transaction
   ▼
structured ToolResult { status, bindings, events[], game_clock }
```

DM still calls `roll_dice` / `apply_damage` directly when fiat or adjudication needs it. The sheet pipeline is the NPC’s **permission boundary**, not the only way those primitives run.

### Templates

`create_npc` can take `template: "wolf"`:

```json
{
  "template": "wolf",
  "display_name": "Wolf A",
  "overrides": { "stats.hp_max": 11 }
}
```

Template expands to stats + default `actions[]` (`Talk` optional for beasts — wolves might only get `Claw` + `Howl`). Orchestrator stores the **expanded** sheet so later template edits do not silently rewrite living entities unless DM runs an explicit migrate.

---

## Worked example: generated townsguard

On `create_npc`:

1. DM tool creates entity with template `townsguard`.
2. Sheet persists with actions `talk`, `attack`, `shove`, `raise_alarm`.
3. `chat_add_participant` brings them into the scene.
4. NPC turn: model only receives those four tools.
5. It calls `attack` with `{ "target_id": "pc_hero" }`.
6. Pipeline rolls d20 vs AC; on hit rolls d6+2; `apply_damage` writes HP; result returns to DM for narration.

No prose claim of damage without a tool result.

---

## Open follow-ups

1. Exact derived-stat formulas per ruleset profile.
2. Whether `branch` / loops need a max-op budget (yes — suggest 32 ops/action).
3. Migration when `schema_version` bumps on stored sheets.
4. UI for visual pipeline editing (other doc owner) vs JSON-only for v1.
