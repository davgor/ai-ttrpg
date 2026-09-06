import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { collectErrorViolations, runPackageBarrierCruise } from './check.mjs'
import { REQUIRED_RULE_NAMES } from './rules.mjs'

const SCRIPT_DIR = fileURLToPath(new URL('.', import.meta.url))
const FIXTURE_PARENT = join(SCRIPT_DIR, '.fixture-runs')

/** @type {string[]} */
const rootsToClean = []

afterEach(() => {
  while (rootsToClean.length > 0) {
    const root = rootsToClean.pop()
    if (root) rmSync(root, { recursive: true, force: true })
  }
})

describe('package barrier rules', () => {
  it('exports the required rule names from the architecture doc', () => {
    expect(REQUIRED_RULE_NAMES).toEqual(
      expect.arrayContaining([
        'dm-not-to-npc',
        'npc-not-to-dm',
        'orchestrator-not-to-dm',
        'orchestrator-not-to-npc',
        'no-deep-orchestrator-src',
        'no-orchestrator-internal',
        'agents-not-to-node-builtins',
        'agents-not-to-sqlite',
        'agents-not-to-electron',
        'orchestrator-not-to-react',
        'renderer-not-to-domain-packages',
        'no-circular'
      ])
    )
  })
})

describe('runPackageBarrierCruise clean graph', () => {
  it('passes on a clean three-package graph', async () => {
    const root = makeFixtureRoot('clean')
    writeCleanPackages(root)
    const { violations } = await runPackageBarrierCruise([join(root, 'packages')])
    expect(violations).toEqual([])
  })
})

describe('runPackageBarrierCruise violations', () => {
  it('fails when dm imports npc', async () => {
    const root = makeFixtureRoot('dm-npc')
    writeCleanPackages(root)
    writeFileSync(
      join(root, 'packages/dm/src/index.ts'),
      `import { createNpcAgent } from '../../npc/src/index.ts'\nexport const leak = createNpcAgent\n`
    )
    const { violations } = await runPackageBarrierCruise([join(root, 'packages')])
    expect(violations.map((v) => v.name)).toContain('dm-not-to-npc')
  })

  it('fails when dm deep-imports orchestrator src', async () => {
    const root = makeFixtureRoot('deep')
    writeCleanPackages(root)
    writeFileSync(
      join(root, 'packages/dm/src/index.ts'),
      `import { secret } from '../../orchestrator/src/internal/secret.ts'\nexport const leak = secret\n`
    )
    const { violations } = await runPackageBarrierCruise([join(root, 'packages')])
    const names = violations.map((v) => v.name)
    expect(names.some((n) => n === 'no-deep-orchestrator-src' || n === 'no-orchestrator-internal')).toBe(
      true
    )
  })

  it('fails when dm imports node:fs', async () => {
    const root = makeFixtureRoot('fs')
    writeCleanPackages(root)
    writeFileSync(
      join(root, 'packages/dm/src/index.ts'),
      `import { readFileSync } from 'node:fs'\nexport const leak = readFileSync\n`
    )
    const { violations } = await runPackageBarrierCruise([join(root, 'packages')])
    expect(violations.map((v) => v.name)).toContain('agents-not-to-node-builtins')
  })
})

describe('collectErrorViolations', () => {
  it('ignores warn-level rules', () => {
    const violations = collectErrorViolations({
      output: {
        summary: {
          violations: [
            {
              from: 'packages/dm/src/index.ts',
              to: 'packages/npc/src/index.ts',
              rule: { name: 'dm-not-to-npc', severity: 'error' }
            },
            {
              from: 'packages/dm/src/a.ts',
              to: 'packages/npc/src/b.ts',
              rule: { name: 'noise', severity: 'warn' }
            }
          ]
        },
        modules: []
      }
    })
    expect(violations).toEqual([
      {
        name: 'dm-not-to-npc',
        from: 'packages/dm/src/index.ts',
        to: 'packages/npc/src/index.ts'
      }
    ])
  })
})

/** @param {string} label */
function makeFixtureRoot(label) {
  mkdirSync(FIXTURE_PARENT, { recursive: true })
  const root = mkdtempSync(join(FIXTURE_PARENT, `${label}-`))
  rootsToClean.push(root)
  return root
}

/** @param {string} root */
function writeCleanPackages(root) {
  for (const name of ['orchestrator', 'dm', 'npc']) {
    mkdirSync(join(root, 'packages', name, 'src', 'internal'), { recursive: true })
  }
  writeFileSync(
    join(root, 'packages/orchestrator/src/internal/secret.ts'),
    `export const secret = 'internal'\n`
  )
  writeFileSync(
    join(root, 'packages/orchestrator/src/index.ts'),
    `export type OrchestratorHandle = { kind: 'orchestrator' }\nexport function createOrchestrator(): OrchestratorHandle {\n  return { kind: 'orchestrator' }\n}\n`
  )
  writeFileSync(
    join(root, 'packages/dm/src/index.ts'),
    `export type DmAgent = { kind: 'dm' }\nexport function createDmAgent(): DmAgent {\n  return { kind: 'dm' }\n}\n`
  )
  writeFileSync(
    join(root, 'packages/npc/src/index.ts'),
    `export type NpcAgent = { kind: 'npc' }\nexport function createNpcAgent(): NpcAgent {\n  return { kind: 'npc' }\n}\n`
  )
}
