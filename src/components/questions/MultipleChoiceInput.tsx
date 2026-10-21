import type { MultipleChoiceQuestion } from '../../types'
import type { InputProps } from './types'

export function MultipleChoiceInput({ question, value, onChange, reveal }: InputProps<MultipleChoiceQuestion, string>) {
  const name = `answer-${question.id}`
  return (
    <fieldset>
      <legend>Pick one</legend>
      <ul>
        {question.options.map((option) => (
          <li key={option.key}>
            <label>
              <input
                type="radio"
                name={name}
                checked={value === option.key}
                disabled={reveal}
                onChange={() => onChange(option.key)}
              />{' '}
              {option.key}. {option.text}
            </label>
            {reveal && option.key === question.answer && <strong> (correct answer)</strong>}
          </li>
        ))}
      </ul>
    </fieldset>
  )
}
