import { contextBridge, ipcRenderer } from 'electron'
import type { AutoUpdateState } from '../shared/autoUpdate/types'
import type { ChatItem } from '../shared/chat/types'

const autoUpdate = {
  getState: (): Promise<AutoUpdateState> => ipcRenderer.invoke('autoUpdate:getState'),
  checkForUpdates: (): Promise<void> => ipcRenderer.invoke('autoUpdate:checkForUpdates'),
  quitAndInstall: (): Promise<void> => ipcRenderer.invoke('autoUpdate:quitAndInstall'),
  onEvent: (listener: (state: AutoUpdateState) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, state: AutoUpdateState): void => {
      listener(state)
    }
    ipcRenderer.on('autoUpdate:event', handler)
    return () => ipcRenderer.removeListener('autoUpdate:event', handler)
  }
}

const appInfo = {
  getVersion: (): Promise<string> => ipcRenderer.invoke('app:getVersion')
}

const chat = {
  getThread: (): Promise<ChatItem[]> => ipcRenderer.invoke('chat:getThread'),
  send: (text: string): Promise<ChatItem[]> => ipcRenderer.invoke('chat:send', text),
  resetScene: (): Promise<ChatItem[]> => ipcRenderer.invoke('chat:resetScene'),
  onThread: (listener: (items: ChatItem[]) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, items: ChatItem[]): void => {
      listener(items)
    }
    ipcRenderer.on('chat:thread', handler)
    return () => ipcRenderer.removeListener('chat:thread', handler)
  }
}

contextBridge.exposeInMainWorld('autoUpdate', autoUpdate)
contextBridge.exposeInMainWorld('appInfo', appInfo)
contextBridge.exposeInMainWorld('chat', chat)

export type AutoUpdateApi = typeof autoUpdate
export type AppInfoApi = typeof appInfo
export type ChatApi = typeof chat
