import type { ReactNode } from 'react'

// a green or red note next to a choice once it's graded
export function Mark({ kind, children }: { kind: 'correct' | 'wrong'; children: ReactNode }) {
  let symbol = '✓'
  if (kind === 'wrong') {
    symbol = '✗'
  }
  return (
    <span className={`mark mark-${kind}`}>
      <span aria-hidden="true">{symbol}</span> {children}
    </span>
  )
}

