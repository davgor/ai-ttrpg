export function normalizeComposerDraft(draft: string): string {
  return draft.trim()
}

export function canSubmitComposer(draft: string): boolean {
  return normalizeComposerDraft(draft).length > 0
}
