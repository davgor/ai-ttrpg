/** Public orchestrator surface. Internal modules live under ./internal and are not exported. */

export type OrchestratorHandle = {
  readonly kind: 'orchestrator'
}

export function createOrchestrator(): OrchestratorHandle {
  return { kind: 'orchestrator' }
}
