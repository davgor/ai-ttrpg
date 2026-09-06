# EPIC: Chat-first dark UI package

Ship a dark, conversation-first UI in `@ai-ttrpg/ui` so anyone can drop into a scene without world-building forms. Layout matches the hand mock — DM/NPC left, player right, italic system join/leave lines, fixed composer.

Chat **domain** (thread seed, append player message, ids) lives in `@ai-ttrpg/orchestrator`. The Electron host exposes a thin IPC session; the UI package is presentational and calls that session. No agent/runtime logic in React.

## Sub-tickets

| ID | Title | Status |
|----|-------|--------|
| 005.1 | Orchestrator chat model + demo seed + action formatting | in-progress |
| 005.2 | `@ai-ttrpg/ui` dark chat window (bubbles, system, composer) | in-progress |
| 005.3 | Host shell: IPC session + UI package mount; updates stay available | in-progress |

## Acceptance criteria

- [x] New session opens into a dark chat thread (no world-builder / character-sheet gate)
- [x] Demo seed matches mock roles: DM, NPCs, player, system enter/leave
- [x] Player can send a message via host/orchestrator path; it appears right-aligned
- [x] Auto-update banner/check remains reachable without leaving the chat metaphor
- [x] `packages/ui` owns renderer chat chrome; orchestrator owns thread mutations
- [x] No third-party chat-product brand names in tickets, code comments, or PR copy
- [x] lint, boundaries, board:unique, unit tests, fireguard (new tests), typecheck, deadcode, build pass
