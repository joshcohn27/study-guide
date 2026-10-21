import type { MatchingQuestion } from '../../types'
import { OptionList } from './OptionList'
import type { InputProps } from './types'

export function MatchingInput({ question, value, onChange, reveal }: InputProps<MatchingQuestion, string[]>) {
  const picked = value ?? question.rows.map(() => '')

  function pick(rowIndex: number, key: string) {
    const next = question.rows.map((_, index) => picked[index] ?? '')
    next[rowIndex] = key
    onChange(next)
  }

  return (
    <fieldset>
      <legend>Match each item</legend>
      <OptionList options={question.options} />
      <table>
        <thead>
          <tr>
            <th scope="col">Item</th>
            <th scope="col">Your match</th>
            {reveal && <th scope="col">Correct match</th>}
          </tr>
        </thead>
        <tbody>
          {question.rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
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
              {reveal && <td>{row.answer}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </fieldset>
  )
}
