import type { ChatItem } from '@ai-ttrpg/orchestrator'
import {
  appendPlayerMessage,
  createDemoThread,
  nextMessageId
} from '@ai-ttrpg/orchestrator'
import { BrowserWindow, ipcMain } from 'electron'

let thread: ChatItem[] = createDemoThread()

function broadcast(items: ChatItem[]): void {
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send('chat:thread', items)
  }
}

export function getChatThread(): ChatItem[] {
  return thread
}

export function sendChatMessage(text: string): ChatItem[] {
  thread = appendPlayerMessage(thread, text, nextMessageId)
  broadcast(thread)
  return thread
}

export function resetChatScene(): ChatItem[] {
  thread = createDemoThread()
  broadcast(thread)
  return thread
}

/** IPC `chat:send` payload guard — non-strings leave the thread unchanged. */
export function handleChatSendIpc(text: unknown): ChatItem[] {
  if (typeof text !== 'string') {
    return getChatThread()
  }
  return sendChatMessage(text)
}

export function registerChatHandlers(): void {
  ipcMain.handle('chat:getThread', () => getChatThread())
  ipcMain.handle('chat:send', (_event, text: unknown) => handleChatSendIpc(text))
  ipcMain.handle('chat:resetScene', () => resetChatScene())
}
