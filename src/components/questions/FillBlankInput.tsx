import type { FillBlankQuestion } from '../../types'
import { gradeFillBlank } from '../../lib/grade'
import { Mark } from './Mark'
import type { InputProps } from './types'

export function FillBlankInput({ question, value, onChange, reveal }: InputProps<FillBlankQuestion, string>) {
  const right = gradeFillBlank(question, value) > 0

  let accepted = question.acceptedAnswers.join(' / ')
  if (question.caseSensitive) {
    accepted = `${accepted} (case sensitive)`
  }

  return (
    <div className="field">
      <label>
        <span className="hint">Your answer</span>
        <input type="text" value={value ?? ''} disabled={reveal} onChange={(event) => onChange(event.target.value)} />
      </label>
      {reveal && right && <Mark kind="correct">Right</Mark>}
      {reveal && !right && <Mark kind="wrong">Accepted answers: {accepted}</Mark>}
    </div>
  )
}
