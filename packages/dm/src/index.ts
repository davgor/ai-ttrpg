import type { OrchestratorHandle } from '@ai-ttrpg/orchestrator'

export type DmAgent = {
  readonly kind: 'dm'
}

/** Thin DM shell — host injects a narrowed orchestrator facade later. */
export function createDmAgent(_handle: OrchestratorHandle): DmAgent {
  return { kind: 'dm' }
}
