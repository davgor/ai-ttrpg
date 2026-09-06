import { describe, expect, it } from 'vitest'
import { MessageBody } from './MessageBody'
import { SystemEventLine } from './SystemEventLine'
import { DialogueRow } from './DialogueRow'
import { alignmentClassForRole } from './types'
import type { DialogueMessage, SystemEvent } from './itemTypes'

describe('alignmentClassForRole', () => {
  it('maps player to end and others to start', () => {
    expect(alignmentClassForRole('player')).toBe('chat-row--end')
    expect(alignmentClassForRole('dm')).toBe('chat-row--start')
    expect(alignmentClassForRole('npc')).toBe('chat-row--start')
  })
})

describe('MessageBody', () => {
  it('renders action segments with the action class', () => {
    const node = MessageBody({ text: 'Hi *waves*' })
    expect(node.props.className).toBe('chat-bubble__body')
    const children = node.props.children as Array<{ props: { className?: string; children: string } }>
    expect(children).toHaveLength(2)
    expect(children[0]?.props.children).toBe('Hi ')
    expect(children[1]?.props.className).toBe('chat-action')
    expect(children[1]?.props.children).toBe('waves')
  })
})

describe('SystemEventLine', () => {
  it('renders muted system copy', () => {
    const event: SystemEvent = { id: 's1', kind: 'system', text: 'NPC 1 has entered the chat....' }
    const node = SystemEventLine({ event })
    expect(node.props.className).toBe('chat-system')
    expect(node.props.children).toBe(event.text)
  })
})

describe('DialogueRow', () => {
  it('applies start alignment for DM messages', () => {
    const message: DialogueMessage = {
      id: 'd1',
      kind: 'dialogue',
      role: 'dm',
      speaker: 'DM',
      alignment: 'start',
      text: 'Scene sets'
    }
    const node = DialogueRow({ message })
    expect(node.props.className).toContain('chat-row--start')
    expect(node.props.className).toContain('chat-row--dm')
  })

  it('applies end alignment for player messages', () => {
    const message: DialogueMessage = {
      id: 'd2',
      kind: 'dialogue',
      role: 'player',
      speaker: 'Player',
      alignment: 'end',
      text: 'Hello'
    }
    const node = DialogueRow({ message })
    expect(node.props.className).toContain('chat-row--end')
    expect(node.props.className).toContain('chat-row--player')
  })
})
