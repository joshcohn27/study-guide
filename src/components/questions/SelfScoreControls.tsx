import { useState } from 'react'
import { formatPoints, parseNumber } from '../../lib/grade'

type Props = {
  points: number
  value: number | undefined
  onChange: (points: number) => void
}

function startText(value: number | undefined): string {
  if (value === undefined) {
    return ''
  }
  return String(value)
}

// open-ended answers can't be auto-graded, so you score yourself against the model answer
export function SelfScoreControls({ points, value, onChange }: Props) {
  const [text, setText] = useState(() => startText(value))
  const [error, setError] = useState('')

  function pick(score: number) {
    setText(String(score))
    setError('')
    onChange(score)
  }

  function type(nextText: string) {
    setText(nextText)
    const parsed = parseNumber(nextText)
    if (parsed === null) {
      setError('')
      return
    }
    if (parsed < 0 || parsed > points) {
      setError(`Enter a number from 0 to ${formatPoints(points)}.`)
      return
    }
    setError('')
    onChange(parsed)
  }

  function pressedFor(score: number): boolean {
    return value === score
  }

  let status = 'Compare your answer to the model answer, then give yourself credit.'
  if (value !== undefined) {
    status = `You gave yourself ${formatPoints(value)} of ${formatPoints(points)}.`
  }

  return (
    <fieldset className="self-score">
      <legend>Score yourself</legend>
      <p className="hint">{status}</p>
      <div className="button-row">
        <button type="button" aria-pressed={pressedFor(points)} onClick={() => pick(points)}>
          Full
        </button>
        <button type="button" aria-pressed={pressedFor(points / 2)} onClick={() => pick(points / 2)}>
          Half
        </button>
        <button type="button" aria-pressed={pressedFor(0)} onClick={() => pick(0)}>
          None
        </button>
        <label className="inline-field">
          or points (0 to {formatPoints(points)})
          <input type="text" inputMode="decimal" size={5} value={text} onChange={(event) => type(event.target.value)} />
        </label>
      </div>
      {error && <p role="alert">{error}</p>}
    </fieldset>
  )
}
