import type { MultiSelectQuestion } from '../../types'
import type { InputProps } from './types'

export function MultiSelectInput({ question, value, onChange, reveal }: InputProps<MultiSelectQuestion, string[]>) {
  const picked = value ?? []

  function toggle(key: string) {
    if (picked.includes(key)) {
      onChange(picked.filter((item) => item !== key))
    } else {
      onChange(picked.concat(key))
    }
  }

  return (
    <fieldset>
      <legend>Check all that apply</legend>
      <ul>
        {question.options.map((option) => (
          <li key={option.key}>
            <label>
              <input
                type="checkbox"
                checked={picked.includes(option.key)}
                disabled={reveal}
                onChange={() => toggle(option.key)}
              />{' '}
              {option.key}. {option.text}
            </label>
            {reveal && question.answers.includes(option.key) && <strong> (should be checked)</strong>}
          </li>
        ))}
      </ul>
    </fieldset>
  )
}
