import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const checkForUpdates = vi.fn()
const quitAndInstall = vi.fn()
const on = vi.fn()

vi.mock('electron', () => ({
  app: {
    isPackaged: true,
    getVersion: () => '1.2.3'
  },
  BrowserWindow: {
    getAllWindows: () => []
  },
  ipcMain: {
    handle: vi.fn()
  }
}))

vi.mock('electron-updater', () => ({
  autoUpdater: {
    checkForUpdates,
    quitAndInstall,
    on,
    logger: undefined,
    autoDownload: false,
    autoInstallOnAppQuit: false
  }
}))

vi.mock('./logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn()
  }
}))

async function loadModule(): Promise<typeof import('./autoUpdate')> {
  return import('./autoUpdate')
}

function resetAutoUpdateTest(): void {
  vi.resetModules()
  vi.clearAllMocks()
  vi.useFakeTimers()
  checkForUpdates.mockResolvedValue(undefined)
  delete process.env['DISABLE_AUTO_UPDATE']
}

function restoreAutoUpdateTest(): void {
  vi.useRealTimers()
  delete process.env['DISABLE_AUTO_UPDATE']
}

describe('canStartUpdateCheck', () => {
  beforeEach(resetAutoUpdateTest)
  afterEach(restoreAutoUpdateTest)

  it('is false while busy or already downloaded', async () => {
    const { canStartUpdateCheck } = await loadModule()
    expect(canStartUpdateCheck('idle')).toBe(true)
    expect(canStartUpdateCheck('error')).toBe(true)
    expect(canStartUpdateCheck('checking')).toBe(false)
    expect(canStartUpdateCheck('available')).toBe(false)
    expect(canStartUpdateCheck('downloading')).toBe(false)
    expect(canStartUpdateCheck('downloaded')).toBe(false)
  })
})

describe('initAutoUpdate scheduling', () => {
  beforeEach(resetAutoUpdateTest)
  afterEach(restoreAutoUpdateTest)

  it('schedules an initial check then recurring polls', async () => {
    let checkCount = 0
    checkForUpdates.mockImplementation(async () => {
      checkCount += 1
    })

    const { initAutoUpdate, INITIAL_CHECK_DELAY_MS, POLL_INTERVAL_MS } = await loadModule()
    const { autoUpdater } = await import('electron-updater')
    initAutoUpdate()

    expect(checkCount).toBe(0)
    expect(autoUpdater.autoDownload).toBe(true)
    expect(autoUpdater.autoInstallOnAppQuit).toBe(true)

    await vi.advanceTimersByTimeAsync(INITIAL_CHECK_DELAY_MS)
    expect(checkCount).toBe(1)

    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS)
    expect(checkCount).toBe(2)

    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS)
    expect(checkCount).toBe(3)
  })
})

describe('checkForUpdatesNow overlapping guards', () => {
  beforeEach(resetAutoUpdateTest)
  afterEach(restoreAutoUpdateTest)

  it('skips overlapping checks while a previous check is in flight', async () => {
    let checkCount = 0
    let resolveCheck: (() => void) | undefined
    checkForUpdates.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          checkCount += 1
          resolveCheck = resolve
        })
    )

    const { initAutoUpdate, checkForUpdatesNow, INITIAL_CHECK_DELAY_MS } = await loadModule()
    initAutoUpdate()
    await vi.advanceTimersByTimeAsync(INITIAL_CHECK_DELAY_MS)
    expect(checkCount).toBe(1)

    const overlapping = checkForUpdatesNow()
    expect(checkCount).toBe(1)

    resolveCheck?.()
    await overlapping
  })
})

describe('checkForUpdatesNow phase guards', () => {
  beforeEach(resetAutoUpdateTest)
  afterEach(restoreAutoUpdateTest)

  it('skips checks after an update is already downloaded', async () => {
    let checkCount = 0
    checkForUpdates.mockImplementation(async () => {
      checkCount += 1
    })

    const handlers = new Map<string, (info?: { version: string }) => void>()
    on.mockImplementation((event: string, handler: (info?: { version: string }) => void) => {
      handlers.set(event, handler)
    })

    const { initAutoUpdate, checkForUpdatesNow, getAutoUpdateState, INITIAL_CHECK_DELAY_MS } =
      await loadModule()
    initAutoUpdate()
    await vi.advanceTimersByTimeAsync(INITIAL_CHECK_DELAY_MS)
    expect(checkCount).toBe(1)

    handlers.get('update-downloaded')?.({ version: '9.0.0' })
    expect(getAutoUpdateState().phase).toBe('downloaded')
    expect(getAutoUpdateState().availableVersion).toBe('9.0.0')

    await checkForUpdatesNow()
    expect(checkCount).toBe(1)
  })
})

describe('checkForUpdatesNow disable guard', () => {
  beforeEach(resetAutoUpdateTest)
  afterEach(restoreAutoUpdateTest)

  it('is a no-op when auto-update is disabled', async () => {
    process.env['DISABLE_AUTO_UPDATE'] = '1'
    let checkCount = 0
    checkForUpdates.mockImplementation(async () => {
      checkCount += 1
    })
    const { checkForUpdatesNow, isAutoUpdateEnabled } = await loadModule()
    expect(isAutoUpdateEnabled()).toBe(false)
    await checkForUpdatesNow()
    expect(checkCount).toBe(0)
  })
})

describe('silent apply helpers', () => {
  beforeEach(resetAutoUpdateTest)
  afterEach(restoreAutoUpdateTest)

  it('quitAndInstallUpdate uses silent install with force-run-after', async () => {
    let silent: boolean | undefined
    let forceRunAfter: boolean | undefined
    quitAndInstall.mockImplementation((a: boolean, b: boolean) => {
      silent = a
      forceRunAfter = b
    })

    const { quitAndInstallUpdate } = await loadModule()
    quitAndInstallUpdate()
    expect(silent).toBe(true)
    expect(forceRunAfter).toBe(true)
  })

  it('formats ready-state copy for silent restart apply', async () => {
    const { formatUpdateReadyMessage } = await loadModule()
    expect(formatUpdateReadyMessage('2.0.0')).toMatch(/restart/i)
    expect(formatUpdateReadyMessage('2.0.0')).toMatch(/silent|no installer/i)
  })
})
