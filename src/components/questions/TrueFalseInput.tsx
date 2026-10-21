import type { TrueFalseQuestion } from '../../types'
import { choiceClass } from './helpers'
import { Mark } from './Mark'
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
      <legend className="visually-hidden">Your answer</legend>
      <ul className="choices">
        {[true, false].map((choice) => {
          const isAnswer = choice === question.answer
          const picked = value === choice
          return (
            <li key={label(choice)} className={choiceClass(reveal, isAnswer, picked && !isAnswer)}>
              <label>
                <input type="radio" name={name} checked={picked} disabled={reveal} onChange={() => onChange(choice)} />
                {label(choice)}
              </label>
              {reveal && isAnswer && <Mark kind="correct">Correct answer</Mark>}
              {reveal && picked && !isAnswer && <Mark kind="wrong">Your answer</Mark>}
            </li>
          )
        })}
      </ul>
    </fieldset>
  )
}
