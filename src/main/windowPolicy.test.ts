import { describe, expect, it } from 'vitest'
import {
  loadRendererContent,
  prefersDevServerUrl,
  quitIfPlatformRequiresIt,
  recreateWindowIfNone,
  shouldQuitWhenWindowsClose
} from './windowPolicy'

describe('prefersDevServerUrl', () => {
  it('accepts non-empty renderer URLs', () => {
    expect(prefersDevServerUrl('http://localhost:5173')).toBe(true)
    expect(prefersDevServerUrl('')).toBe(false)
    expect(prefersDevServerUrl(undefined)).toBe(false)
  })
})

describe('shouldQuitWhenWindowsClose', () => {
  it('keeps the app alive on macOS only', () => {
    expect(shouldQuitWhenWindowsClose('darwin')).toBe(false)
    expect(shouldQuitWhenWindowsClose('win32')).toBe(true)
    expect(shouldQuitWhenWindowsClose('linux')).toBe(true)
  })
})

describe('loadRendererContent', () => {
  it('loads the dev server URL when present', () => {
    let loadedUrl = ''
    let loadedFile = false
    loadRendererContent({
      rendererUrl: 'http://localhost:5173',
      loadUrl: (url) => {
        loadedUrl = url
      },
      loadFile: () => {
        loadedFile = true
      }
    })
    expect(loadedUrl).toBe('http://localhost:5173')
    expect(loadedFile).toBe(false)
  })

  it('loads the packaged file when no dev URL is set', () => {
    let loadedFile = false
    let loadedUrl = ''
    loadRendererContent({
      rendererUrl: undefined,
      loadUrl: (url) => {
        loadedUrl = url
      },
      loadFile: () => {
        loadedFile = true
      }
    })
    expect(loadedFile).toBe(true)
    expect(loadedUrl).toBe('')
  })
})

describe('recreateWindowIfNone', () => {
  it('creates a window only when none are open', () => {
    let created = 0
    recreateWindowIfNone(1, () => {
      created += 1
    })
    expect(created).toBe(0)
    recreateWindowIfNone(0, () => {
      created += 1
    })
    expect(created).toBe(1)
  })
})

describe('quitIfPlatformRequiresIt', () => {
  it('quits on non-mac platforms only', () => {
    let quits = 0
    quitIfPlatformRequiresIt('darwin', () => {
      quits += 1
    })
    expect(quits).toBe(0)
    quitIfPlatformRequiresIt('win32', () => {
      quits += 1
    })
    expect(quits).toBe(1)
  })
})
