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

  let status = 'Not scored yet.'
  if (value !== undefined) {
    status = `You gave yourself ${formatPoints(value)} of ${formatPoints(points)}.`
  }

  return (
    <fieldset>
      <legend>Score yourself</legend>
      <p>Compare your answer to the model answer and rubric, then give yourself credit.</p>
      <button type="button" onClick={() => pick(points)}>
        Full
      </button>{' '}
      <button type="button" onClick={() => pick(points / 2)}>
        Half
      </button>{' '}
      <button type="button" onClick={() => pick(0)}>
        None
      </button>{' '}
      <label>
        or points (0 to {formatPoints(points)}){' '}
        <input type="text" inputMode="decimal" size={5} value={text} onChange={(event) => type(event.target.value)} />
      </label>
      {error && <p role="alert">{error}</p>}
      <p>{status}</p>
    </fieldset>
  )
}
