import type { MessagePart } from './types'

const ACTION_SEGMENT = /\*([^*]+)\*/g

export function formatMessageParts(text: string): MessagePart[] {
  const parts: MessagePart[] = []
  let cursor = 0
  let matched = false

  for (const match of text.matchAll(ACTION_SEGMENT)) {
    matched = true
    const index = match.index ?? 0
    if (index > cursor) {
      parts.push({ type: 'text', value: text.slice(cursor, index) })
    }
    parts.push({ type: 'action', value: match[1] ?? '' })
    cursor = index + match[0].length
  }

  if (!matched) {
    return [{ type: 'text', value: text }]
  }

  if (cursor < text.length) {
    parts.push({ type: 'text', value: text.slice(cursor) })
  }

  return parts
}
