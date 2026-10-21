import { useState } from 'react'

type Props = {
  label: string
  question: string
  confirmLabel: string
  onConfirm: () => void
  primary?: boolean
  // for deletes, the confirm button turns red
  danger?: boolean
}

// asks in the page instead of using window.confirm
export function ConfirmButton({ label, question, confirmLabel, onConfirm, primary, danger }: Props) {
  const [asking, setAsking] = useState(false)

  let buttonClass = ''
  if (primary) {
    buttonClass = 'primary'
  }
  let confirmClass = buttonClass
  if (danger) {
    confirmClass = 'danger'
  }

  if (!asking) {
    return (
      <button type="button" className={buttonClass} onClick={() => setAsking(true)}>
        {label}
      </button>
    )
  }

  function confirm() {
    setAsking(false)
    onConfirm()
  }

  return (
    <span role="group" aria-label={label} className="confirm">
      <span className="confirm-question">{question}</span>
      <button type="button" className={confirmClass} onClick={confirm}>
        {confirmLabel}
      </button>
      <button type="button" onClick={() => setAsking(false)}>
        Cancel
      </button>
    </span>
  )
}
