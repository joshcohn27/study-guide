import type { TrueFalseQuestion } from '../../types'
import type { InputProps } from './types'

function label(value: boolean): string {
  if (value) {
    return 'True'
  }
  return 'False'
}

export function TrueFalseInput({ question, value, onChange, reveal }: InputProps<TrueFalseQuestion, boolean>) {
  const name = `answer-${question.id}`
  return (
    <fieldset>
      <legend>Your answer</legend>
      {[true, false].map((choice) => (
        <label key={label(choice)}>
          <input
            type="radio"
            name={name}
            checked={value === choice}
            disabled={reveal}
            onChange={() => onChange(choice)}
          />{' '}
          {label(choice)}{' '}
        </label>
      ))}
      {reveal && <p>Correct answer: {label(question.answer)}</p>}
    </fieldset>
  )
}
