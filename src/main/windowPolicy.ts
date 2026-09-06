export function prefersDevServerUrl(url: string | undefined): url is string {
  return typeof url === 'string' && url.length > 0
}

export function shouldQuitWhenWindowsClose(platform: NodeJS.Platform): boolean {
  return platform !== 'darwin'
}

export function loadRendererContent(options: {
  rendererUrl: string | undefined
  loadUrl: (url: string) => void
  loadFile: () => void
}): void {
  if (prefersDevServerUrl(options.rendererUrl)) {
    options.loadUrl(options.rendererUrl)
    return
  }
  options.loadFile()
}

export function recreateWindowIfNone(openWindowCount: number, create: () => void): void {
  if (openWindowCount === 0) {
    create()
  }
}

export function quitIfPlatformRequiresIt(platform: NodeJS.Platform, quit: () => void): void {
  if (shouldQuitWhenWindowsClose(platform)) {
    quit()
  }
}
