import type { SystemEvent } from './itemTypes'

type SystemEventLineProps = {
  event: SystemEvent
}

export function SystemEventLine({ event }: SystemEventLineProps): JSX.Element {
  return <p className="chat-system">{event.text}</p>
}
