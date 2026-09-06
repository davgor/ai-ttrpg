# AI-TTRPG

Electron desktop app (TypeScript + React) for an AI-driven single-player text-adventure TTRPG. This is **V3** of [AI-DND-Matrix](https://github.com/davgor/AI-DND-Matrix), bootstrapped from [BoosterSeat](https://github.com/davgor/BoosterSeat) process tooling with Electron packaging and icons from Matrix.

## Engineering process

- **TDD-first.** Tests before implementation for main/preload/renderer logic and helpers. See `.cursor/skills/delivery-standards/SKILL.md`.
- **Strict lint.** oxlint with zero warnings. Never relax rules to make code pass — fix the code. After edits: follow [`.ai-instructions.md`](.ai-instructions.md).
- **TypeScript strict.** No `any` escapes.
- **Red team review (mandatory).** Before merge-ready / ticket `done`, run `red-team-review` (alias: `antagonistic-pr-review`), post on the PR, and fix every **Blocking** finding. See [`.ai-instructions.md`](.ai-instructions.md).
- **Ticket board.** Work under `/board` (`backlog/` → `in-progress/` → `done/`). Epics `NNN-*.md`, sub-tickets `NNN.M-*.md`. Epic and sub-ticket ids must be unique across the board (`npm run board:unique`). Skills: `complete-ticket`, `collapse-epic`.
- **No secrets committed.** `.env` stays gitignored.

## Architecture

- [AI topology](docs/architecture/ai-topology.md) — Orchestrator / DM / NPC tiers, providers, local RAG, tool surface
- [Orchestrator catalog](docs/architecture/orchestrator-catalog.md) — full tool list, NPC sheet actions, pipeline DSL
- [Monorepo packages](docs/architecture/monorepo-packages.md) — three core packages, dependency barriers, thin agents

Package barriers are enforced locally and in CI via `npm run boundaries`.

## Stack

- Electron + React + TypeScript
- electron-vite / electron-builder for build and packaging
- Vitest for unit tests
- oxlint for lint
- Fireguard for new-test quality grading
- GitHub Actions for PR checks and release deploy (Win + Mac)

## Commands

```bash
npm install
npm run dev          # Electron + React dev
npm test             # Vitest (app + fireguard)
npm run boundaries   # Monorepo package dependency barriers
npm run board:unique # Fail on duplicate board epic / sub-ticket ids
npm run fireguard    # Grade new unit tests (A–F); F fails CI
npm run lint         # oxlint (strict)
npm run typecheck
npm run build
npm run package:win  # Windows NSIS + portable
npm run package:mac  # macOS .dmg
npm run deadcode     # ts-prune vs .tsprune-ignore
npm run deadcode:refresh
```

## CI

`.github/workflows/pr-checks.yml` (**CI Checks**) on every PR to `main` and every push to `main`:

- `test` — `npm test`
- `fireguard` — grades **new** Vitest unit tests vs `main`; letter **F** fails
- `lint` — `npm run lint`
- `boundaries` — monorepo package dependency barriers (`npm run boundaries`)
- `board-unique` — duplicate epic / sub-ticket ids on `/board` (`npm run board:unique`)
- `build` — `npm run typecheck` && `npm run build`

Also included:

- `deadcode.yml` — ts-prune vs `.tsprune-ignore`
- `security-audit.yml` — `npm audit`, fails on moderate+
- `auto-revert.yml` — reverts `main` when CI Checks fails
- `deploy.yml` — bump minor, package Win + Mac, GitHub Release

Commits with `[skip ci]` skip push-triggered CI / deadcode / deploy gates.

## Releases / auto-update

Successful merges to `main` trigger **Deploy**: bump minor version, package Win + Mac, publish a GitHub Release. In-app updates use `electron-updater`. See [`docs/runbooks/auto-update.md`](docs/runbooks/auto-update.md).
