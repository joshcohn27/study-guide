import type { MultipleChoiceQuestion } from '../../types'
import { choiceClass } from './helpers'
import { Mark } from './Mark'
import type { InputProps } from './types'

export function MultipleChoiceInput({ question, value, onChange, reveal }: InputProps<MultipleChoiceQuestion, string>) {
  const name = `answer-${question.id}`
  return (
    <fieldset>
      <legend className="visually-hidden">Pick one</legend>
      <ul className="choices">
        {question.options.map((option) => {
          const isAnswer = option.key === question.answer
          const picked = value === option.key
          return (
            <li key={option.key} className={choiceClass(reveal, isAnswer, picked && !isAnswer)}>
              <label>
                <input
                  type="radio"
                  name={name}
                  checked={picked}
                  disabled={reveal}
                  onChange={() => onChange(option.key)}
                />
                <span className="choice-key">{option.key}.</span> {option.text}
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
