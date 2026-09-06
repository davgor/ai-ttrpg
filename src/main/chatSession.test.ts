import { describe, expect, it, vi, beforeEach } from 'vitest'
import {
  getChatThread,
  handleChatSendIpc,
  registerChatHandlers,
  resetChatScene,
  sendChatMessage
} from './chatSession'

vi.mock('electron', () => ({
  BrowserWindow: {
    getAllWindows: () => []
  },
  ipcMain: {
    handle: vi.fn()
  }
}))

vi.mock('@ai-ttrpg/orchestrator', async () => {
  const actual = await vi.importActual<typeof import('@ai-ttrpg/orchestrator')>('@ai-ttrpg/orchestrator')
  return actual
})

describe('chatSession', () => {
  beforeEach(() => {
    resetChatScene()
  })

  it('starts from the demo thread', () => {
    const thread = getChatThread()
    expect(thread[0]).toMatchObject({ role: 'dm', kind: 'dialogue' })
    expect(thread.some((item) => item.kind === 'system')).toBe(true)
  })

  it('appends player messages through sendChatMessage', () => {
    const before = getChatThread().length
    const next = sendChatMessage('I nod once')
    expect(next).toHaveLength(before + 1)
    expect(next.at(-1)).toMatchObject({ role: 'player', text: 'I nod once' })
  })

  it('ignores blank sends', () => {
    const before = getChatThread().length
    expect(sendChatMessage('   ')).toHaveLength(before)
  })

  it('registers ipc handlers', async () => {
    const { ipcMain } = await import('electron')
    registerChatHandlers()
    expect(ipcMain.handle).toHaveBeenCalledWith('chat:getThread', expect.any(Function))
    expect(ipcMain.handle).toHaveBeenCalledWith('chat:send', expect.any(Function))
    expect(ipcMain.handle).toHaveBeenCalledWith('chat:resetScene', expect.any(Function))
  })

  it('ignores non-string IPC send payloads', () => {
    const before = getChatThread().length
    expect(handleChatSendIpc(42)).toHaveLength(before)
    expect(handleChatSendIpc(null)).toHaveLength(before)
    expect(handleChatSendIpc({ text: 'nope' })).toHaveLength(before)
  })
})
