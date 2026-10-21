import type { OptionItem } from '../../types'

export function OptionList({ options }: { options: OptionItem[] }) {
  return (
    <ul>
      {options.map((option) => (
        <li key={option.key}>
          {option.key}. {option.text}
        </li>
      ))}
    </ul>
  )
}
