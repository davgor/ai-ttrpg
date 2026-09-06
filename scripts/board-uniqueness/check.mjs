/**
 * Fail when /board has duplicate epic (NNN) or sub-ticket (NNN.M) ids.
 */
import { readdirSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { findDuplicateBoardIds } from './parse.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..')
const BOARD_COLUMNS = ['backlog', 'in-progress', 'done']

/**
 * @param {string} boardRoot
 * @returns {string[]}
 */
export function listBoardTicketPaths(boardRoot = join(ROOT, 'board')) {
  /** @type {string[]} */
  const paths = []
  for (const column of BOARD_COLUMNS) {
    const dir = join(boardRoot, column)
    let entries = []
    try {
      entries = readdirSync(dir, { withFileTypes: true })
    } catch {
      continue
    }
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.md')) continue
      paths.push(relative(ROOT, join(dir, entry.name)).replace(/\\/g, '/'))
    }
  }
  return paths.sort()
}

/**
 * @param {string[]} [relativePaths]
 */
export function checkBoardUniqueness(relativePaths = listBoardTicketPaths()) {
  return findDuplicateBoardIds(relativePaths)
}

function main() {
  const result = checkBoardUniqueness()
  if (result.ok) {
    console.log('board-uniqueness: ok')
    return
  }
  console.error('board-uniqueness: duplicate board ids detected:\n')
  for (const dup of result.duplicates) {
    console.error(`  [${dup.kind}] ${dup.id}`)
    for (const file of dup.files) {
      console.error(`    - ${file}`)
    }
  }
  console.error(
    '\nEach epic NNN and sub-ticket NNN.M must appear exactly once across backlog / in-progress / done.'
  )
  process.exitCode = 1
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main()
}
