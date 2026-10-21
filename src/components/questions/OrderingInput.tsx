import type { OrderingQuestion } from '../../types'
import { choiceClass } from './helpers'
import { Mark } from './Mark'
import type { InputProps } from './types'

type OrderingProps = InputProps<OrderingQuestion, string[]> & {
  startOrder: string[]
}

export function OrderingInput({ question, value, onChange, reveal, startOrder }: OrderingProps) {
  const order = value ?? startOrder

  function move(index: number, delta: number) {
    const target = index + delta
    if (target < 0 || target >= order.length) {
      return
    }
    const next = order.slice()
    next[index] = order[target]
    next[target] = order[index]
    onChange(next)
  }

  return (
    <div>
      <p className="hint">Put these in the correct order.</p>
      <ol className="choices ordering">
        {order.map((item, index) => {
          const inPlace = question.items[index] === item
          return (
            <li key={item} className={choiceClass(reveal, inPlace, !inPlace)}>
              <span className="ordering-item">
                <span className="choice-key">{index + 1}.</span> {item}
              </span>
              {!reveal && (
                <span className="ordering-buttons">
                  <button
                    type="button"
                    className="small"
                    disabled={index === 0}
                    aria-label={`Move ${item} up`}
                    onClick={() => move(index, -1)}
                  >
                    Up
                  </button>
                  <button
                    type="button"
                    className="small"
                    disabled={index === order.length - 1}
                    aria-label={`Move ${item} down`}
                    onClick={() => move(index, 1)}
                  >
                    Down
                  </button>
                </span>
              )}
              {reveal && inPlace && <Mark kind="correct">Right spot</Mark>}
              {reveal && !inPlace && <Mark kind="wrong">Should be {question.items.indexOf(item) + 1}</Mark>}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
