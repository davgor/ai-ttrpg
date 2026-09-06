import { AppVersionLabel } from './autoUpdate/AppVersionLabel'
import { CheckForUpdatesButton } from './autoUpdate/CheckForUpdatesButton'
import { UpdateBanner, useAppUpdate } from './autoUpdate/UpdateBanner'

export function App(): JSX.Element {
  const update = useAppUpdate()

  return (
    <main className="app-shell">
      <header className="app-header">
        <h1>AI-TTRPG</h1>
        <AppVersionLabel version={update.currentVersion} />
      </header>
      <p className="app-lede">AI-driven single-player text-adventure TTRPG (V3).</p>
      <section className="app-settings" aria-label="Updates">
        <h2>Updates</h2>
        <CheckForUpdatesButton />
      </section>
      <UpdateBanner />
    </main>
  )
}
