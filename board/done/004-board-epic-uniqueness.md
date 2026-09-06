# EPIC: Board epic ID uniqueness (CI)

Prevent parallel agents from minting colliding board ids (two `003` epics, two `004`s, etc.). A CI check scans `/board` and fails when the same epic number appears more than once across backlog / in-progress / done. Sub-ticket ids (`NNN.M`) get the same uniqueness rule.

## Acceptance criteria

- [x] `npm run board:unique` fails when two epic files share the same `NNN` across board columns
- [x] `npm run board:unique` fails when two sub-ticket files share the same `NNN.M`
- [x] Unit tests cover clean board + duplicate epic + duplicate sub-ticket fixtures
- [x] `pr-checks.yml` runs the check
- [x] `npm run lint`, `npm test`, `npm run typecheck`, `npm run deadcode`, `npm run build` pass
