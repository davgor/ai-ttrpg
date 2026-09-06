import { describe, expect, it } from 'vitest'
import { applyWhenActive } from './applyWhenActive'

describe('applyWhenActive', () => {
  it('applies only while the effect is active', () => {
    let seen = ''
    applyWhenActive(false, 'skip', (value) => {
      seen = value
    })
    expect(seen).toBe('')
    applyWhenActive(true, 'ok', (value) => {
      seen = value
    })
    expect(seen).toBe('ok')
  })
})
