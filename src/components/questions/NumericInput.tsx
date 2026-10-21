import type { NumericQuestion } from '../../types'
import { gradeNumeric } from '../../lib/grade'
import { Mark } from './Mark'
import type { InputProps } from './types'

export function NumericInput({ question, value, onChange, reveal }: InputProps<NumericQuestion, string>) {
  const right = gradeNumeric(question, value) > 0

  let correct = String(question.answer)
  if (question.unit) {
    correct = `${correct} ${question.unit}`
  }
  if (question.tolerance) {
    correct = `${correct}, give or take ${question.tolerance}`
  }

  return (
    <div className="field">
      <label>
        <span className="hint">Your answer</span>
        <span className="with-unit">
          <input
            type="text"
            inputMode="decimal"
            value={value ?? ''}
            disabled={reveal}
            onChange={(event) => onChange(event.target.value)}
          />
          {question.unit && <span>{question.unit}</span>}
        </span>
      </label>
      {reveal && right && <Mark kind="correct">Right</Mark>}
      {reveal && !right && <Mark kind="wrong">Correct answer: {correct}</Mark>}
    </div>
  )
}
