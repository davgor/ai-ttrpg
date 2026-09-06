import type { OrchestratorHandle } from '@ai-ttrpg/orchestrator'

export type NpcAgent = {
  readonly kind: 'npc'
}

/**
 * Thin NPC shell. Callers should pass a capability-narrowed facade;
 * the full handle type is a stand-in until facades land.
 */
export function createNpcAgent(_handle: OrchestratorHandle): NpcAgent {
  return { kind: 'npc' }
}
