import { alignmentClassForRole } from './types'
import { MessageBody } from './MessageBody'
import type { DialogueMessage } from './itemTypes'

type DialogueRowProps = {
  message: DialogueMessage
}

export function DialogueRow({ message }: DialogueRowProps): JSX.Element {
  const alignment = alignmentClassForRole(message.role)
  return (
    <article className={`chat-row ${alignment} chat-row--${message.role}`} aria-label={`${message.speaker} message`}>
      <span className="chat-speaker">{message.speaker}</span>
      <div className="chat-bubble">
        <MessageBody text={message.text} />
      </div>
    </article>
  )
}
