import { describe, expect, it } from 'vitest'
import { createDemoThread } from './demoThread'
import type { ChatItem, DialogueMessage, SystemEvent } from './types'

function isDialogue(item: ChatItem): item is DialogueMessage {
  return item.kind === 'dialogue'
}

function isSystem(item: ChatItem): item is SystemEvent {
  return item.kind === 'system'
}

describe('createDemoThread', () => {
  it('starts with DM exposition then NPC enter events', () => {
    const thread = createDemoThread()
    expect(thread[0]).toMatchObject({
      kind: 'dialogue',
      role: 'dm',
      speaker: 'DM'
    })
    expect(thread[1]).toMatchObject({
      kind: 'system',
      text: 'NPC 1 has entered the chat....'
    })
    expect(thread[2]).toMatchObject({
      kind: 'system',
      text: 'NPC 2 has entered the chat....'
    })
  })

  it('includes left-side NPC dialogue and right-side player dialogue', () => {
    const dialogue = createDemoThread().filter(isDialogue)
    const roles = dialogue.map((m) => m.role)
    expect(roles).toContain('npc')
    expect(roles).toContain('player')
    expect(dialogue.filter((m) => m.role === 'player').every((m) => m.alignment === 'end')).toBe(true)
    expect(dialogue.filter((m) => m.role !== 'player').every((m) => m.alignment === 'start')).toBe(true)
  })

  it('ends with NPC leave system events after the closing DM beat', () => {
    const thread = createDemoThread()
    const lastThree = thread.slice(-3)
    expect(isDialogue(lastThree[0]) && lastThree[0].role === 'dm').toBe(true)
    expect(isSystem(lastThree[1]) && lastThree[1].text.includes('left')).toBe(true)
    expect(isSystem(lastThree[2]) && lastThree[2].text.includes('left')).toBe(true)
  })

  it('assigns stable unique ids to every item', () => {
    const ids = createDemoThread().map((item) => item.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids[0]).toBe('demo-1')
    expect(ids[1]).toBe('demo-2')
    expect(ids.at(-1)).toBe(`demo-${ids.length}`)
  })
})
