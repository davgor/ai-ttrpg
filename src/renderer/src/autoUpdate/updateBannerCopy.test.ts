import { describe, expect, it } from 'vitest'
import type { AutoUpdateState } from '../../../shared/autoUpdate/types'
import {
  formatUpdateBannerText,
  shouldHideUpdateBanner,
  shouldShowRestartButton
} from './updateBannerCopy'

describe('shouldHideUpdateBanner', () => {
  it('hides idle, checking, and error phases', () => {
    expect(shouldHideUpdateBanner('idle')).toBe(true)
    expect(shouldHideUpdateBanner('checking')).toBe(true)
    expect(shouldHideUpdateBanner('error')).toBe(true)
    expect(shouldHideUpdateBanner('available')).toBe(false)
    expect(shouldHideUpdateBanner('downloading')).toBe(false)
    expect(shouldHideUpdateBanner('downloaded')).toBe(false)
  })
})

describe('shouldShowRestartButton', () => {
  it('only shows restart when downloaded', () => {
    expect(shouldShowRestartButton('downloaded')).toBe(true)
    expect(shouldShowRestartButton('available')).toBe(false)
    expect(shouldShowRestartButton('downloading')).toBe(false)
  })
})

describe('formatUpdateBannerText', () => {
  it('prefers an explicit message when present', () => {
    const update: AutoUpdateState = {
      phase: 'available',
      currentVersion: '1.0.0',
      message: 'Custom message'
    }
    expect(formatUpdateBannerText(update)).toBe('Custom message')
  })

  it('formats downloading progress without a message', () => {
    const update: AutoUpdateState = {
      phase: 'downloading',
      currentVersion: '1.0.0',
      downloadPercent: 42
    }
    expect(formatUpdateBannerText(update)).toBe('Downloading update… 42%')
  })

  it('formats available version without a message', () => {
    const update: AutoUpdateState = {
      phase: 'available',
      currentVersion: '1.0.0',
      availableVersion: '2.0.0'
    }
    expect(formatUpdateBannerText(update)).toBe('Update 2.0.0 available')
  })
})
