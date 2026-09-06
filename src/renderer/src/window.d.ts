import type { AppInfoApi, AutoUpdateApi, ChatApi } from '../../preload'

declare global {
  interface Window {
    autoUpdate: AutoUpdateApi
    appInfo: AppInfoApi
    chat: ChatApi
  }
}

export {}
