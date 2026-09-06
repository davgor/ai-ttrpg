/**
 * Parse board ticket filenames into epic / sub-ticket ids.
 * Epics: `NNN-slug.md`  Sub-tickets: `NNN.M-slug.md`
 */

/** @typedef {{ id: string, kind: 'epic' | 'sub', epic: string, file: string }} BoardTicketRef */

const TICKET_RE = /^(\d{3})(?:\.(\d+))?-(.+)\.md$/i

/**
 * @param {string} fileName basename only
 * @returns {BoardTicketRef | null}
 */
export function parseBoardTicketFileName(fileName) {
  const base = fileName.replace(/\\/g, '/').split('/').pop() ?? ''
  const match = TICKET_RE.exec(base)
  if (!match) return null
  const epic = match[1]
  const sub = match[2]
  if (sub !== undefined) {
    return {
      id: `${epic}.${sub}`,
      kind: 'sub',
      epic,
      file: base
    }
  }
  return {
    id: epic,
    kind: 'epic',
    epic,
    file: base
  }
}

/**
 * @param {string[]} relativePaths paths like `board/done/001-foo.md`
 * @returns {{ ok: true } | { ok: false, duplicates: { id: string, kind: string, files: string[] }[] }}
 */
export function findDuplicateBoardIds(relativePaths) {
  /** @type {Map<string, { kind: string, files: string[] }>} */
  const byId = new Map()

  for (const relativePath of relativePaths) {
    const normalized = relativePath.replace(/\\/g, '/')
    const parsed = parseBoardTicketFileName(normalized)
    if (!parsed) continue
    const key = `${parsed.kind}:${parsed.id}`
    const existing = byId.get(key)
    if (existing) {
      existing.files.push(normalized)
    } else {
      byId.set(key, { kind: parsed.kind, files: [normalized] })
    }
  }

  /** @type {{ id: string, kind: string, files: string[] }[]} */
  const duplicates = []
  for (const [key, value] of byId) {
    if (value.files.length > 1) {
      const id = key.slice(key.indexOf(':') + 1)
      duplicates.push({ id, kind: value.kind, files: value.files.sort() })
    }
  }

  duplicates.sort((a, b) => a.id.localeCompare(b.id))
  if (duplicates.length === 0) return { ok: true }
  return { ok: false, duplicates }
}
