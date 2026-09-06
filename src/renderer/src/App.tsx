import { useEffect, useState } from 'react'
import { ChatWindow } from '@ai-ttrpg/ui'
import type { ChatItem } from '@ai-ttrpg/ui'
import { AppVersionLabel } from './autoUpdate/AppVersionLabel'
import { CheckForUpdatesButton } from './autoUpdate/CheckForUpdatesButton'
import { UpdateBanner, useAppUpdate } from './autoUpdate/UpdateBanner'
import { applyWhenActive } from './autoUpdate/applyWhenActive'

export function App(): JSX.Element {
  const update = useAppUpdate()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [items, setItems] = useState<ChatItem[]>([])

  useEffect(() => {
    let active = true
    void window.chat.getThread().then((thread) => {
      applyWhenActive(active, thread, setItems)
    })
    const unsubscribe = window.chat.onThread((thread) => {
      setItems(thread)
    })
    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  return (
    <div className="app-root">
      <ChatWindow
        items={items}
        onSend={(text) => {
          void window.chat.send(text).then(setItems)
        }}
        onReplayScene={() => {
          void window.chat.resetScene().then(setItems)
        }}
        onOpenSettings={() => setSettingsOpen(true)}
      />
      {settingsOpen ? (
        <div className="settings-overlay" role="dialog" aria-modal="true" aria-label="Settings">
          <div className="settings-sheet">
            <header className="settings-sheet__header">
              <h2>Settings</h2>
              <button type="button" className="chat-ghost-btn" onClick={() => setSettingsOpen(false)}>
                Close
              </button>
            </header>
            <p className="settings-sheet__lede">Keep the adventure current. No world-building required.</p>
            <div className="settings-sheet__row">
              <AppVersionLabel version={update.currentVersion} />
              <CheckForUpdatesButton />
            </div>
          </div>
        </div>
      ) : null}
      <UpdateBanner />
    </div>
  )
}
