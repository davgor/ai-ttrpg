import { describe, expect, it, vi } from 'vitest'
import { requestCheckForUpdates } from './checkForUpdates'

describe('requestCheckForUpdates', () => {
  it('invokes the preload checkForUpdates API', async () => {
    let callCount = 0
    const checkForUpdates = vi.fn().mockImplementation(async () => {
      callCount += 1
    })
    await requestCheckForUpdates(checkForUpdates)
    expect(callCount).toBe(1)
  })
})
