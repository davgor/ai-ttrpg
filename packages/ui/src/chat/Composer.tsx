import { useState } from 'react'
import type { FormEvent } from 'react'
import { canSubmitComposer } from './composerState'

type ComposerProps = {
  onSend: (text: string) => void
  disabled?: boolean
}

export function Composer({ onSend, disabled = false }: ComposerProps): JSX.Element {
  const [draft, setDraft] = useState('')
  const canSend = canSubmitComposer(draft) && !disabled

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    if (!canSend) {
      return
    }
    onSend(draft)
    setDraft('')
  }

  return (
    <form className="chat-composer" onSubmit={handleSubmit} aria-label="Send a message">
      <label className="visually-hidden" htmlFor="chat-composer-input">
        Message
      </label>
      <input
        id="chat-composer-input"
        className="chat-composer__input"
        type="text"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder="Say or do something…"
        autoComplete="off"
        disabled={disabled}
      />
      <button className="chat-composer__send" type="submit" disabled={!canSend}>
        Send
      </button>
    </form>
  )
}
