import type { QuestionStatus } from '../../lib/grade'
import { questionAnchor } from '../questions/helpers'

export type NavState = 'empty' | 'answered' | QuestionStatus

export type NavItem = {
  id: string
  number: number
  state: NavState
}

const STATE_TEXT: Record<NavState, string> = {
  empty: 'not answered',
  answered: 'answered',
  correct: 'correct',
  partial: 'partial credit',
  wrong: 'incorrect',
  ungraded: 'needs self-score',
}

type Props = {
  items: NavItem[]
  // when set, items are buttons that jump in place instead of links to the card
  onPick?: (index: number) => void
  currentIndex?: number
}

export function QuestionNav({ items, onPick, currentIndex }: Props) {
  return (
    <nav aria-label="Questions" className="qnav">
      <ol>
        {items.map((item, index) => {
          const className = `qnav-item qnav-${item.state}`
          const label = `Question ${item.number}, ${STATE_TEXT[item.state]}`
          const isCurrent = index === currentIndex
          return (
            <li key={item.id}>
              {onPick && (
                <button
                  type="button"
                  className={className}
                  aria-label={label}
                  aria-current={isCurrent}
                  onClick={() => onPick(index)}
                >
                  {item.number}
                </button>
              )}
              {!onPick && (
                <a className={className} href={`#${questionAnchor(item.id)}`} aria-label={label}>
                  {item.number}
                </a>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
