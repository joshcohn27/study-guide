import type { OrderingQuestion } from '../../types'
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
      <p>Put these in the correct order.</p>
      <ol>
        {order.map((item, index) => (
          <li key={item}>
            {item}{' '}
            {!reveal && (
              <>
                <button type="button" disabled={index === 0} onClick={() => move(index, -1)}>
                  Move up
                </button>{' '}
                <button type="button" disabled={index === order.length - 1} onClick={() => move(index, 1)}>
                  Move down
                </button>
              </>
            )}
          </li>
        ))}
      </ol>
      {reveal && (
        <>
          <p>Correct order:</p>
          <ol>
            {question.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </>
      )}
    </div>
  )
}
