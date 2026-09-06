import type { ChatItem } from './itemTypes'
import { DialogueRow } from './DialogueRow'
import { SystemEventLine } from './SystemEventLine'

type MessageListProps = {
  items: readonly ChatItem[]
}

export function MessageList({ items }: MessageListProps): JSX.Element {
  return (
    <div className="chat-thread" role="log" aria-live="polite" aria-relevant="additions">
      {items.map((item) =>
        item.kind === 'system' ? (
          <SystemEventLine key={item.id} event={item} />
        ) : (
          <DialogueRow key={item.id} message={item} />
        )
      )}
    </div>
  )
}
