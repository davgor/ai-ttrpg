/** IPC wire shapes for chat — keep aligned with @ai-ttrpg/orchestrator chat types. */

export type ChatRole = 'dm' | 'npc' | 'player'

export type MessageAlignment = 'start' | 'end'

export type DialogueMessage = {
  id: string
  kind: 'dialogue'
  role: ChatRole
  speaker: string
  alignment: MessageAlignment
  text: string
}

export type SystemEvent = {
  id: string
  kind: 'system'
  text: string
}

export type ChatItem = DialogueMessage | SystemEvent
