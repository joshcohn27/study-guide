import type { ReactNode } from 'react'
import type { OptionItem } from '../../types'
import { moveItem, nextOptionKey } from '../../lib/builder'

type Props = {
  options: OptionItem[]
  onChange: (options: OptionItem[]) => void
  // extra control next to each option, like a "correct" checkbox
  renderMark?: (option: OptionItem) => ReactNode
}

export function OptionsEditor({ options, onChange, renderMark }: Props) {
  function setText(index: number, text: string) {
    const next = options.slice()
    next[index] = { ...options[index], text }
    onChange(next)
  }

  function remove(index: number) {
    onChange(options.filter((_, itemIndex) => itemIndex !== index))
  }

  function add() {
    onChange(options.concat({ key: nextOptionKey(options), text: '' }))
  }

  return (
    <fieldset>
      <legend>Options</legend>
      <ul>
        {options.map((option, index) => (
          <li key={option.key}>
            <label>
              {option.key}.{' '}
              <input type="text" size={50} value={option.text} onChange={(event) => setText(index, event.target.value)} />
            </label>{' '}
            {renderMark && renderMark(option)}{' '}
            <button type="button" disabled={index === 0} onClick={() => onChange(moveItem(options, index, -1))}>
              Up
            </button>{' '}
            <button
              type="button"
              disabled={index === options.length - 1}
              onClick={() => onChange(moveItem(options, index, 1))}
            >
              Down
            </button>{' '}
            <button type="button" disabled={options.length <= 1} onClick={() => remove(index)}>
              Remove
            </button>
          </li>
        ))}
      </ul>
      <button type="button" onClick={add}>
        Add option
      </button>
    </fieldset>
  )
}
