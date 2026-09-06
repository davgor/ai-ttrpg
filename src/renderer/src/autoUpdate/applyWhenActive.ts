export function applyWhenActive<T>(active: boolean, value: T, apply: (value: T) => void): void {
  if (active) {
    apply(value)
  }
}
