#!/usr/bin/env node
/**
 * Enforce monorepo package barriers (docs/architecture/monorepo-packages.md).
 * Usage: node scripts/package-barriers/check.mjs [cruiseRoot...]
 */
import { cruise } from 'dependency-cruiser'
import { existsSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { cruiseOptions } from './rules.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..')

/**
 * @param {import('dependency-cruiser').ICruiseResult} result
 * @returns {{ name: string, from: string, to: string }[]}
 */
export function collectErrorViolations(result) {
  const listed = result.output.summary?.violations ?? []
  return listed
    .filter((item) => item.rule?.severity === 'error')
    .map((item) => ({
      name: item.rule.name,
      from: item.from,
      to: item.to
    }))
}

/**
 * @param {string[]} cruiseRoots absolute or repo-relative paths to cruise
 * @param {string} [cwd]
 */
export async function runPackageBarrierCruise(cruiseRoots, cwd = ROOT) {
  const resolved = cruiseRoots.map((p) => (p.startsWith('/') || /^[A-Za-z]:/.test(p) ? p : join(cwd, p)))
  for (const path of resolved) {
    if (!existsSync(path)) {
      throw new Error(`package-barriers: cruise root missing: ${relative(cwd, path) || path}`)
    }
  }
  const result = await cruise(resolved, cruiseOptions)
  const violations = collectErrorViolations(result)
  return { result, violations }
}

export function defaultCruiseRoots() {
  const roots = ['packages']
  if (existsSync(join(ROOT, 'src/renderer'))) {
    roots.push('src/renderer')
  }
  return roots
}

async function main() {
  const args = process.argv.slice(2)
  const roots = args.length > 0 ? args : defaultCruiseRoots()
  const { violations } = await runPackageBarrierCruise(roots)
  if (violations.length === 0) {
    console.log(`package-barriers: ok (${roots.join(', ')})`)
    return
  }
  console.error('package-barriers: forbidden dependency violations:\n')
  for (const v of violations) {
    console.error(`  [${v.name}] ${v.from} -> ${v.to}`)
  }
  console.error(`\n${violations.length} violation(s). See docs/architecture/monorepo-packages.md`)
  process.exitCode = 1
}

const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]
if (isDirectRun) {
  main().catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
}
