import { describe, expect, it } from 'vitest'
import { canSubmitComposer, normalizeComposerDraft } from './composerState'

describe('normalizeComposerDraft', () => {
  it('trims the draft', () => {
    expect(normalizeComposerDraft('  go north  ')).toBe('go north')
  })
})

describe('canSubmitComposer', () => {
  it('is false for empty drafts', () => {
    expect(canSubmitComposer('')).toBe(false)
    expect(canSubmitComposer('   ')).toBe(false)
  })

  it('is true for non-empty drafts', () => {
    expect(canSubmitComposer('look around')).toBe(true)
  })
})
