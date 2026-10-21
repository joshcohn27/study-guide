import { useState } from 'react'

type Props = {
  label: string
  question: string
  confirmLabel: string
  onConfirm: () => void
}

// asks in the page instead of using window.confirm
export function ConfirmButton({ label, question, confirmLabel, onConfirm }: Props) {
  const [asking, setAsking] = useState(false)

  if (!asking) {
    return (
      <button type="button" onClick={() => setAsking(true)}>
        {label}
      </button>
    )
  }

  function confirm() {
    setAsking(false)
    onConfirm()
  }

  return (
    <span role="group" aria-label={label}>
      {question}{' '}
      <button type="button" onClick={confirm}>
        {confirmLabel}
      </button>{' '}
      <button type="button" onClick={() => setAsking(false)}>
        Cancel
      </button>
    </span>
  )
}
