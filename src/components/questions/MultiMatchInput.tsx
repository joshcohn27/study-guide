import type { MultiMatchQuestion } from '../../types'
import { Mark } from './Mark'
import { OptionList } from './OptionList'
import type { InputProps } from './types'

function keyList(keys: string[]): string {
  if (keys.length === 0) {
    return 'none'
  }
  return keys.slice().sort().join(', ')
}

function sameKeys(a: string[], b: string[]): boolean {
  if (a.length !== b.length) {
    return false
  }
  return a.every((key) => b.includes(key))
}

export function MultiMatchInput({ question, value, onChange, reveal }: InputProps<MultiMatchQuestion, string[][]>) {
  const picked = question.rows.map((_, index) => {
    if (!value) {
      return []
    }
    return value[index] ?? []
  })

  function toggle(rowIndex: number, key: string) {
    const row = picked[rowIndex]
    let nextRow = row.concat(key)
    if (row.includes(key)) {
      nextRow = row.filter((item) => item !== key)
    }
    const next = picked.slice()
    next[rowIndex] = nextRow
    onChange(next)
  }

  return (
    <fieldset>
      <legend className="hint">Check every letter that applies to each row. A row can have none.</legend>
      <OptionList options={question.options} />
      <table className="answer-table">
        <thead>
          <tr>
            <th scope="col">Item</th>
            {question.options.map((option) => (
              <th scope="col" key={option.key} className="center">
                {option.key}
              </th>
            ))}
            {reveal && <th scope="col">Result</th>}
          </tr>
        </thead>
        <tbody>
          {question.rows.map((row, rowIndex) => {
            const right = sameKeys(picked[rowIndex], row.answers)
            let rowClass = ''
            if (reveal && right) {
              rowClass = 'row-correct'
            }
            if (reveal && !right) {
              rowClass = 'row-wrong'
            }
            return (
              <tr key={rowIndex} className={rowClass}>
                <th scope="row">{row.label}</th>
                {question.options.map((option) => (
                  <td key={option.key} className="center">
                    <input
                      type="checkbox"
                      aria-label={`${row.label}: ${option.key}`}
                      checked={picked[rowIndex].includes(option.key)}
                      disabled={reveal}
                      onChange={() => toggle(rowIndex, option.key)}
                    />
                  </td>
                ))}
                {reveal && (
                  <td>
                    {right && <Mark kind="correct">Right</Mark>}
                    {!right && <Mark kind="wrong">Answer: {keyList(row.answers)}</Mark>}
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
