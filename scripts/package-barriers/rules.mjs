/**
 * Dependency-cruiser forbidden rules for AI-TTRPG monorepo barriers.
 * See docs/architecture/monorepo-packages.md
 */

/** @type {import('dependency-cruiser').IConfiguration['forbidden']} */
export const forbidden = [
  {
    name: 'dm-not-to-npc',
    comment: 'DM and NPC packages must not import each other.',
    severity: 'error',
    from: { path: '(^|/)packages/dm/' },
    to: { path: '(^|/)packages/npc/' }
  },
  {
    name: 'npc-not-to-dm',
    comment: 'DM and NPC packages must not import each other.',
    severity: 'error',
    from: { path: '(^|/)packages/npc/' },
    to: { path: '(^|/)packages/dm/' }
  },
  {
    name: 'orchestrator-not-to-dm',
    comment: 'Orchestrator is backend and must not depend on agent packages.',
    severity: 'error',
    from: { path: '(^|/)packages/orchestrator/' },
    to: { path: '(^|/)packages/dm/' }
  },
  {
    name: 'orchestrator-not-to-npc',
    comment: 'Orchestrator is backend and must not depend on agent packages.',
    severity: 'error',
    from: { path: '(^|/)packages/orchestrator/' },
    to: { path: '(^|/)packages/npc/' }
  },
  {
    name: 'no-deep-orchestrator-src',
    comment:
      'Agents may only use the orchestrator package entry (@ai-ttrpg/orchestrator -> src/index.ts), not other src files.',
    severity: 'error',
    from: { path: '(^|/)packages/(dm|npc)/' },
    to: {
      path: '(^|/)packages/orchestrator/src/',
      pathNot: '(^|/)packages/orchestrator/src/index\\.ts$'
    }
  },
  {
    name: 'no-orchestrator-internal',
    comment: 'Outside orchestrator, nothing may import orchestrator internal modules.',
    severity: 'error',
    from: {
      path: '(^|/)(packages|src|apps)/',
      pathNot: '(^|/)packages/orchestrator/'
    },
    to: { path: '(^|/)packages/orchestrator/src/internal/' }
  },
  {
    name: 'agents-not-to-node-builtins',
    comment: 'DM/NPC stay thin - no Node fs/path (campaign I/O belongs in orchestrator/host).',
    severity: 'error',
    from: { path: '(^|/)packages/(dm|npc)/' },
    to: {
      path: '^(node:)?(fs|fs/promises|path|os|child_process)$',
      dependencyTypes: ['core']
    }
  },
  {
    name: 'agents-not-to-sqlite',
    comment: 'DM/NPC must not touch SQLite drivers.',
    severity: 'error',
    from: { path: '(^|/)packages/(dm|npc)/' },
    to: { path: '^(better-sqlite3|sqlite3|libsql)$' }
  },
  {
    name: 'agents-not-to-electron',
    comment: 'DM/NPC must not import Electron - host wires that.',
    severity: 'error',
    from: { path: '(^|/)packages/(dm|npc)/' },
    to: { path: '^electron$' }
  },
  {
    name: 'orchestrator-not-to-react',
    comment: 'Orchestrator is backend - no React.',
    severity: 'error',
    from: { path: '(^|/)packages/orchestrator/' },
    to: { path: '^(react|react-dom)(/|$)' }
  },
  {
    name: 'renderer-not-to-domain-packages',
    comment: 'Renderer talks IPC only - no orchestrator/dm/npc imports.',
    severity: 'error',
    from: { path: '(^|/)src/renderer/' },
    to: { path: '(^|/)packages/(orchestrator|dm|npc)/' }
  },
  {
    name: 'no-circular',
    comment: 'No circular dependencies across the graph.',
    severity: 'error',
    from: {},
    to: { circular: true }
  }
]

/** Rule names expected by tests / docs. */
export const REQUIRED_RULE_NAMES = forbidden.map((rule) => rule.name)

/** @type {import('dependency-cruiser').ICruiseOptions} */
export const cruiseOptions = {
  validate: true,
  ruleSet: { forbidden },
  exclude: {
    path: ['node_modules', 'dist', 'out', 'release', 'coverage', '\\.dependency-cruiser']
  },
  doNotFollow: {
    path: 'node_modules'
  },
  tsPreCompilationDeps: true,
  combinedDependencies: true,
  enhancedResolveOptions: {
    exportsFields: ['exports'],
    conditionNames: ['import', 'require', 'node', 'default', 'types']
  }
}
