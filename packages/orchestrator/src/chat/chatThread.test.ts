import { describe, expect, it } from 'vitest'
import { appendPlayerMessage, createPlayerMessage, nextMessageId } from './chatThread'

describe('createPlayerMessage', () => {
  it('builds a right-aligned player dialogue item', () => {
    const message = createPlayerMessage('demo-player-1', 'I wave goodbye')
    expect(message).toEqual({
      id: 'demo-player-1',
      kind: 'dialogue',
      role: 'player',
      speaker: 'Player',
      alignment: 'end',
      text: 'I wave goodbye'
    })
  })

  it('trims surrounding whitespace from the body', () => {
    expect(createPlayerMessage('id', '  hello  ').text).toBe('hello')
  })
})

describe('appendPlayerMessage', () => {
  it('appends a player message when text is non-empty', () => {
    const next = appendPlayerMessage([], 'Onward', () => 'p1')
    expect(next).toHaveLength(1)
    expect(next[0]).toMatchObject({ id: 'p1', role: 'player', text: 'Onward' })
  })

  it('does not append blank or whitespace-only text', () => {
    expect(appendPlayerMessage([], '   ', () => 'p1')).toEqual([])
  })
})

describe('nextMessageId', () => {
  it('produces unique ids across calls', () => {
    const a = nextMessageId()
    const b = nextMessageId()
    expect(a).not.toBe(b)
  })
})
