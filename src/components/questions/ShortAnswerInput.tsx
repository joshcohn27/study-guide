import type { ShortAnswerQuestion } from '../../types'
import { MultilineText } from '../MultilineText'
import type { InputProps } from './types'

export function ShortAnswerInput({ question, value, onChange, reveal }: InputProps<ShortAnswerQuestion, string>) {
  return (
    <div>
      <label>
        Your answer
        <br />
        <textarea
          rows={6}
          cols={70}
          value={value ?? ''}
          disabled={reveal}
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
      {reveal && (
        <section>
          <h4>Model answer</h4>
          <MultilineText text={question.modelAnswer} />
        </section>
      )}
    </div>
  )
}
