import type { MultiSelectQuestion } from '../../types'
import { choiceClass } from './helpers'
import { Mark } from './Mark'
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
      <legend className="hint">Check all that apply</legend>
      <ul className="choices">
        {question.options.map((option) => {
          const shouldCheck = question.answers.includes(option.key)
          const isPicked = picked.includes(option.key)
          const wrongPick = isPicked && !shouldCheck
          return (
            <li key={option.key} className={choiceClass(reveal, shouldCheck, wrongPick)}>
              <label>
                <input type="checkbox" checked={isPicked} disabled={reveal} onChange={() => toggle(option.key)} />
                <span className="choice-key">{option.key}.</span> {option.text}
              </label>
              {reveal && shouldCheck && isPicked && <Mark kind="correct">Correct</Mark>}
              {reveal && shouldCheck && !isPicked && <Mark kind="correct">Should be checked</Mark>}
              {reveal && wrongPick && <Mark kind="wrong">Should not be checked</Mark>}
            </li>
          )
        })}
      </ul>
    </fieldset>
  )
}
