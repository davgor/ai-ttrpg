import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'node:path'
import { resolveBrowserWindowIconPath } from './appIcon'
import { initAutoUpdate, registerAutoUpdateHandlers } from './autoUpdate'
import { setupGlobalErrorLogging } from './logger'

setupGlobalErrorLogging()

function createMainWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    icon: resolveBrowserWindowIconPath({
      isPackaged: app.isPackaged,
      appPath: app.getAppPath(),
      resourcesPath: process.resourcesPath
    }),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
  return mainWindow
}

function registerAppVersionHandler(): void {
  ipcMain.handle('app:getVersion', () => app.getVersion())
}

app.whenReady().then(() => {
  registerAppVersionHandler()
  registerAutoUpdateHandlers()
  initAutoUpdate()
  createMainWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
