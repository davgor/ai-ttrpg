import type { ChatItem, ChatRole, MessageAlignment } from './types'

type SeedDialogue = {
  kind: 'dialogue'
  role: ChatRole
  speaker: string
  text: string
}

type SeedSystem = {
  kind: 'system'
  text: string
}

type SeedItem = SeedDialogue | SeedSystem

const DEMO_SEED: readonly SeedItem[] = [
  {
    kind: 'dialogue',
    role: 'dm',
    speaker: 'DM',
    text: '*The trail thins into dusk. Somewhere ahead, two voices argue softly over a map.*'
  },
  { kind: 'system', text: 'NPC 1 has entered the chat....' },
  { kind: 'system', text: 'NPC 2 has entered the chat....' },
  {
    kind: 'dialogue',
    role: 'npc',
    speaker: 'NPC 1',
    text: "Oh we didn't see you there traveler *looks around the player to see if there are more*"
  },
  {
    kind: 'dialogue',
    role: 'npc',
    speaker: 'NPC 2',
    text: 'Yea, what are you doing out here by yourself *Gives the player a puzzled look*'
  },
  {
    kind: 'dialogue',
    role: 'player',
    speaker: 'Player',
    text: "Oh I'm just out on a walk, why do you ask *Gives the 2 adventurers a puzzled look*"
  },
  {
    kind: 'dialogue',
    role: 'npc',
    speaker: 'NPC 1',
    text: "Oh well its not safe to be out alone, you can come with us if you'd like *Gives a friendly smile*"
  },
  {
    kind: 'dialogue',
    role: 'player',
    speaker: 'Player',
    text: "I'll take my chances, though I appreciate it. *I wave goodbye*"
  },
  {
    kind: 'dialogue',
    role: 'dm',
    speaker: 'DM',
    text: '*You wander off away from the pair, deeper into the woods*'
  },
  { kind: 'system', text: 'NPC 1 has left the chat....' },
  { kind: 'system', text: 'NPC 2 has left the chat....' }
]

function alignmentForRole(role: ChatRole): MessageAlignment {
  return role === 'player' ? 'end' : 'start'
}

function toChatItem(seed: SeedItem, index: number): ChatItem {
  const id = `demo-${index + 1}`
  if (seed.kind === 'system') {
    return { id, kind: 'system', text: seed.text }
  }
  return {
    id,
    kind: 'dialogue',
    role: seed.role,
    speaker: seed.speaker,
    alignment: alignmentForRole(seed.role),
    text: seed.text
  }
}

export function createDemoThread(): ChatItem[] {
  return DEMO_SEED.map(toChatItem)
}
