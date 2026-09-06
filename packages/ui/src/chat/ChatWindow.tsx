import { useEffect, useRef } from 'react'
import type { ChatItem } from './itemTypes'
import { Composer } from './Composer'
import { MessageList } from './MessageList'

export type ChatWindowProps = {
  items: readonly ChatItem[]
  onSend: (text: string) => void
  onReplayScene?: () => void
  onOpenSettings?: () => void
}

export function ChatWindow({
  items,
  onSend,
  onReplayScene,
  onOpenSettings
}: ChatWindowProps): JSX.Element {
  const scrollerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const node = scrollerRef.current
    if (!node) {
      return
    }
    node.scrollTop = node.scrollHeight
  }, [items])

  return (
    <section className="chat-window" aria-label="Adventure chat">
      <header className="chat-topbar">
        <div className="chat-brand">
          <p className="chat-brand__name">AI-TTRPG</p>
          <p className="chat-brand__tag">Drop in. Play anything.</p>
        </div>
        <div className="chat-topbar__actions">
          {onReplayScene ? (
            <button type="button" className="chat-ghost-btn" onClick={onReplayScene}>
              Replay scene
            </button>
          ) : null}
          {onOpenSettings ? (
            <button type="button" className="chat-ghost-btn" onClick={onOpenSettings}>
              Settings
            </button>
          ) : null}
        </div>
      </header>
      <div className="chat-scroll" ref={scrollerRef}>
        <MessageList items={items} />
      </div>
      <Composer onSend={onSend} />
    </section>
  )
}
