import { describe, expect, it } from 'vitest'
import { formatMessageParts } from './formatMessageParts'

describe('formatMessageParts', () => {
  it('returns a single text part when there are no asterisks', () => {
    expect(formatMessageParts('Hello traveler')).toEqual([{ type: 'text', value: 'Hello traveler' }])
  })

  it('marks *action* segments as action parts', () => {
    expect(formatMessageParts('Hi *waves* there')).toEqual([
      { type: 'text', value: 'Hi ' },
      { type: 'action', value: 'waves' },
      { type: 'text', value: ' there' }
    ])
  })

  it('handles a message that is only an action', () => {
    expect(formatMessageParts('*You wander deeper into the woods*')).toEqual([
      { type: 'action', value: 'You wander deeper into the woods' }
    ])
  })

  it('leaves unmatched asterisks as plain text', () => {
    expect(formatMessageParts('cost is 5* gold')).toEqual([{ type: 'text', value: 'cost is 5* gold' }])
  })
})
