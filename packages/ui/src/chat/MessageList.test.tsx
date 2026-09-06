import { describe, expect, it } from 'vitest'
import { MessageList } from './MessageList'
import type { ChatItem } from './itemTypes'

describe('MessageList', () => {
  it('routes system events and dialogue to different row components', () => {
    const items: ChatItem[] = [
      { id: 's1', kind: 'system', text: 'NPC 1 has entered the chat....' },
      {
        id: 'd1',
        kind: 'dialogue',
        role: 'dm',
        speaker: 'DM',
        alignment: 'start',
        text: 'Hello'
      }
    ]
    const node = MessageList({ items })
    const children = node.props.children as Array<{ type: { name?: string }; props: Record<string, unknown> }>
    expect(children).toHaveLength(2)
    expect(children[0]?.type.name).toBe('SystemEventLine')
    expect(children[0]?.props.event).toEqual(items[0])
    expect(children[1]?.type.name).toBe('DialogueRow')
    expect(children[1]?.props.message).toEqual(items[1])
  })
})
