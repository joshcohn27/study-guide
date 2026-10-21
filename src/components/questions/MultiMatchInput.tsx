import type { MultiMatchQuestion } from '../../types'
import { OptionList } from './OptionList'
import type { InputProps } from './types'

function keyList(keys: string[]): string {
  if (keys.length === 0) {
    return 'none'
  }
  return keys.join(', ')
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
      <legend>Check every letter that applies to each row (a row can have none)</legend>
      <OptionList options={question.options} />
      <table>
        <thead>
          <tr>
            <th scope="col">Item</th>
            {question.options.map((option) => (
              <th scope="col" key={option.key}>
                {option.key}
              </th>
            ))}
            {reveal && <th scope="col">Correct</th>}
          </tr>
        </thead>
        <tbody>
          {question.rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              <th scope="row">{row.label}</th>
              {question.options.map((option) => (
                <td key={option.key}>
                  <input
                    type="checkbox"
                    aria-label={`${row.label}: ${option.key}`}
                    checked={picked[rowIndex].includes(option.key)}
                    disabled={reveal}
                    onChange={() => toggle(rowIndex, option.key)}
                  />
                </td>
              ))}
              {reveal && <td>{keyList(row.answers)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </fieldset>
  )
}
