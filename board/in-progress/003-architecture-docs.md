# EPIC: Architecture docs (AI topology + follow-ons)

Seed product architecture documentation before agent/runtime implementation. Captures the three-tier AI topology (Orchestrator / DM / NPC), model-provider settings, local RAG/memory, and the orchestrator tool surface.

Follow-on product docs: UI architecture is owned by another agent/effort. Further topology revisions stay on this epic until implementation tickets split out.

## Acceptance criteria

- [x] `docs/architecture/ai-topology.md` exists and covers tiers, providers, memory/RAG, orchestrator tools, and open decisions
- [x] Sketch assets linked from the topology doc
- [x] README links to architecture docs
- [x] Topology doc records DM-wide vs NPC sheet-bound tools, and MCP-shaped in-process bus (not wire MCP for v1)
- [x] `docs/architecture/orchestrator-catalog.md` covers full tool domains + NPC sheet action storage
- [x] `docs/architecture/monorepo-packages.md` defines three core packages + enforced barriers
- [x] CI enforces package barriers via `npm run boundaries` (`boundaries` job in pr-checks)
- [ ] Epic closed when topology draft is accepted and no further architecture docs are expected under this epic
