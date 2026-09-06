/** Public orchestrator surface. Internal modules live under ./internal and are not exported. */

export type OrchestratorHandle = {
  readonly kind: 'orchestrator'
}

export function createOrchestrator(): OrchestratorHandle {
  return { kind: 'orchestrator' }
}

export type {
  ChatItem,
  ChatRole,
  DialogueMessage,
  MessageAlignment,
  SystemEvent
} from './chat/types'
export { appendPlayerMessage, createPlayerMessage, nextMessageId } from './chat/chatThread'
export { createDemoThread } from './chat/demoThread'
