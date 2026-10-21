import type { MatchingQuestion } from '../../types'
import { Mark } from './Mark'
import { OptionList } from './OptionList'
import type { InputProps } from './types'

function rowClass(reveal: boolean, right: boolean): string {
  if (!reveal) {
    return ''
  }
  if (right) {
    return 'row-correct'
  }
  return 'row-wrong'
}

export function MatchingInput({ question, value, onChange, reveal }: InputProps<MatchingQuestion, string[]>) {
  const picked = value ?? question.rows.map(() => '')

  function pick(rowIndex: number, key: string) {
    const next = question.rows.map((_, index) => picked[index] ?? '')
    next[rowIndex] = key
    onChange(next)
  }

  return (
    <fieldset>
      <legend className="hint">Match each item to an option</legend>
      <OptionList options={question.options} />
      <table className="answer-table">
        <thead>
          <tr>
            <th scope="col">Item</th>
            <th scope="col">Your match</th>
            {reveal && <th scope="col">Result</th>}
          </tr>
        </thead>
        <tbody>
          {question.rows.map((row, rowIndex) => {
            const right = picked[rowIndex] === row.answer
            return (
              <tr key={rowIndex} className={rowClass(reveal, right)}>
                <th scope="row">{row.label}</th>
                <td>
                  <select
                    aria-label={`Match for ${row.label}`}
                    value={picked[rowIndex] ?? ''}
                    disabled={reveal}
                    onChange={(event) => pick(rowIndex, event.target.value)}
                  >
                    <option value="">Choose...</option>
                    {question.options.map((option) => (
                      <option key={option.key} value={option.key}>
                        {option.key}. {option.text}
                      </option>
                    ))}
                  </select>
                </td>
                {reveal && (
                  <td>
                    {right && <Mark kind="correct">Right</Mark>}
                    {!right && <Mark kind="wrong">Answer: {row.answer}</Mark>}
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </fieldset>
  )
}
