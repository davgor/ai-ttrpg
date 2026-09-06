import type { ChatRole } from './itemTypes'

export type MessagePart =
  | { type: 'text'; value: string }
  | { type: 'action'; value: string }

export function alignmentClassForRole(role: ChatRole): 'chat-row--end' | 'chat-row--start' {
  return role === 'player' ? 'chat-row--end' : 'chat-row--start'
}
