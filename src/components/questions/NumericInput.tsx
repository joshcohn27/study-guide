import type { NumericQuestion } from '../../types'
import type { InputProps } from './types'

export function NumericInput({ question, value, onChange, reveal }: InputProps<NumericQuestion, string>) {
  let correct = String(question.answer)
  if (question.unit) {
    correct = `${correct} ${question.unit}`
  }
  if (question.tolerance) {
    correct = `${correct} (give or take ${question.tolerance})`
  }

  return (
    <div>
      <label>
        Your answer{' '}
        <input
          type="text"
          inputMode="decimal"
          value={value ?? ''}
          disabled={reveal}
          onChange={(event) => onChange(event.target.value)}
        />
        {question.unit && ` ${question.unit}`}
      </label>
      {reveal && <p>Correct answer: {correct}</p>}
    </div>
  )
}
