import type { ChatItem, DialogueMessage } from './types'

export function createPlayerMessage(id: string, text: string): DialogueMessage {
  return {
    id,
    kind: 'dialogue',
    role: 'player',
    speaker: 'Player',
    alignment: 'end',
    text: text.trim()
  }
}

export function appendPlayerMessage(
  items: readonly ChatItem[],
  text: string,
  idFactory: () => string = nextMessageId
): ChatItem[] {
  const trimmed = text.trim()
  if (trimmed.length === 0) {
    return [...items]
  }
  return [...items, createPlayerMessage(idFactory(), trimmed)]
}

let messageSeq = 0

export function nextMessageId(): string {
  messageSeq += 1
  return `msg-${Date.now().toString(36)}-${messageSeq}`
}
