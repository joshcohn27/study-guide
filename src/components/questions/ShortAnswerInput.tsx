import type { ShortAnswerQuestion } from '../../types'
import type { InputProps } from './types'

// the model answer shows in the card's feedback area once revealed
export function ShortAnswerInput({ value, onChange, reveal }: InputProps<ShortAnswerQuestion, string>) {
  return (
    <div className="field">
      <label>
        <span className="hint">Your answer</span>
        <textarea rows={6} value={value ?? ''} disabled={reveal} onChange={(event) => onChange(event.target.value)} />
      </label>
    </div>
  )
}
