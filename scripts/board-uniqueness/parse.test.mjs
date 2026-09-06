import { describe, expect, it } from 'vitest'
import { findDuplicateBoardIds, parseBoardTicketFileName } from './parse.mjs'

describe('parseBoardTicketFileName', () => {
  it('parses epic filenames', () => {
    expect(parseBoardTicketFileName('003-architecture-docs.md')).toEqual({
      id: '003',
      kind: 'epic',
      epic: '003',
      file: '003-architecture-docs.md'
    })
  })

  it('parses sub-ticket filenames', () => {
    expect(parseBoardTicketFileName('board/done/003.4-ci-package-barriers.md')).toEqual({
      id: '003.4',
      kind: 'sub',
      epic: '003',
      file: '003.4-ci-package-barriers.md'
    })
  })

  it('ignores non-ticket files', () => {
    expect(parseBoardTicketFileName('.gitkeep')).toBeNull()
    expect(parseBoardTicketFileName('README.md')).toBeNull()
  })
})

describe('findDuplicateBoardIds clean', () => {
  it('passes when each epic and sub-ticket id appears once', () => {
    expect(
      findDuplicateBoardIds([
        'board/done/001-engineering-delivery-standards.md',
        'board/done/002-stack-playbooks-and-red-team.md',
        'board/in-progress/003-architecture-docs.md',
        'board/done/003.1-ai-topology-doc.md',
        'board/done/003.2-orchestrator-catalog.md'
      ])
    ).toEqual({ ok: true })
  })
})

describe('findDuplicateBoardIds epics', () => {
  it('fails when the same epic number appears in two columns', () => {
    const result = findDuplicateBoardIds([
      'board/done/003-old-architecture.md',
      'board/in-progress/003-architecture-docs.md',
      'board/done/003.1-ai-topology-doc.md'
    ])
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.duplicates).toEqual([
      {
        id: '003',
        kind: 'epic',
        files: ['board/done/003-old-architecture.md', 'board/in-progress/003-architecture-docs.md']
      }
    ])
  })

  it('fails when two epic files share an id in the same column', () => {
    const result = findDuplicateBoardIds([
      'board/backlog/004-board-a.md',
      'board/backlog/004-board-b.md'
    ])
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.duplicates[0]?.id).toBe('004')
    expect(result.duplicates[0]?.kind).toBe('epic')
  })
})

describe('findDuplicateBoardIds sub-tickets', () => {
  it('fails when the same sub-ticket id is duplicated', () => {
    const result = findDuplicateBoardIds([
      'board/backlog/003.5-foo.md',
      'board/in-progress/003.5-bar.md',
      'board/in-progress/003-architecture-docs.md'
    ])
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.duplicates).toEqual([
      {
        id: '003.5',
        kind: 'sub',
        files: ['board/backlog/003.5-foo.md', 'board/in-progress/003.5-bar.md']
      }
    ])
  })
})
