import type { OptionItem } from '../../types'

export function OptionList({ options }: { options: OptionItem[] }) {
  return (
    <ul className="option-list">
      {options.map((option) => (
        <li key={option.key}>
          <span className="choice-key">{option.key}.</span> {option.text}
        </li>
      ))}
    </ul>
  )
}

