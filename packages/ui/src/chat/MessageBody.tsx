import { formatMessageParts } from './formatMessageParts'

type MessageBodyProps = {
  text: string
}

export function MessageBody({ text }: MessageBodyProps): JSX.Element {
  const parts = formatMessageParts(text)
  return (
    <p className="chat-bubble__body">
      {parts.map((part, index) =>
        part.type === 'action' ? (
          <em key={`a-${index}`} className="chat-action">
            {part.value}
          </em>
        ) : (
          <span key={`t-${index}`}>{part.value}</span>
        )
      )}
    </p>
  )
}
