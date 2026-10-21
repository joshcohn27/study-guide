import type { FillBlankQuestion } from '../../types'
import type { InputProps } from './types'

export function FillBlankInput({ question, value, onChange, reveal }: InputProps<FillBlankQuestion, string>) {
  return (
    <div>
      <label>
        Your answer{' '}
        <input type="text" value={value ?? ''} disabled={reveal} onChange={(event) => onChange(event.target.value)} />
      </label>
      {reveal && (
        <p>
          Accepted answers: {question.acceptedAnswers.join(' / ')}
          {question.caseSensitive && ' (case sensitive)'}
        </p>
      )}
    </div>
  )
}
