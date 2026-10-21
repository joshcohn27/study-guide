import { useState } from 'react'
import type { Question, QuestionType } from '../../types'
import { changeQuestionType, TYPE_LABELS } from '../../lib/builder'
import { formatPoints } from '../../lib/grade'
import { QUESTION_TYPES } from '../../lib/validate'
import { ConfirmButton } from '../ConfirmButton'
import { CommaListField, NumberField, TableField } from './fields'
import { TypeFields } from './TypeFields'

type Props = {
  question: Question
  number: number
  isFirst: boolean
  isLast: boolean
  startOpen: boolean
  onChange: (question: Question) => void
  onMove: (delta: number) => void
  onDuplicate: () => void
  onDelete: () => void
}

function summaryText(question: Question, number: number): string {
  let prompt = question.prompt.trim()
  if (prompt === '') {
    prompt = '(no prompt yet)'
  }
  if (prompt.length > 70) {
    prompt = `${prompt.slice(0, 70)}...`
  }
  return `Question ${number} (${question.id}) · ${TYPE_LABELS[question.type]} · ${formatPoints(question.points)} pts · ${prompt}`
}

export function QuestionEditor(props: Props) {
  const { question, number, isFirst, isLast, onChange, onMove, onDuplicate, onDelete } = props
  // only used on mount, after that the details element keeps its own open state
  const [startOpen] = useState(props.startOpen)

  return (
    <details open={startOpen}>
      <summary>{summaryText(question, number)}</summary>

      <p>
        <label>
          Type{' '}
          <select
            value={question.type}
            onChange={(event) => onChange(changeQuestionType(question, event.target.value as QuestionType))}
          >
            {QUESTION_TYPES.map((type) => (
              <option key={type} value={type}>
                {TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </label>{' '}
        <NumberField
          label="Points"
          value={question.points}
          onChange={(points) => onChange({ ...question, points: points ?? Number.NaN })}
        />{' '}
        <label>
          <input
            type="checkbox"
            checked={question.extraCredit === true}
            onChange={(event) => onChange({ ...question, extraCredit: event.target.checked })}
          />{' '}
          Extra credit
        </label>
      </p>

      <p>
        <label>
          Prompt
          <br />
          <textarea
            rows={4}
            cols={70}
            value={question.prompt}
            onChange={(event) => onChange({ ...question, prompt: event.target.value })}
          />
        </label>
      </p>

      <p>
        <TableField value={question.table} onChange={(table) => onChange({ ...question, table })} />
      </p>

      <TypeFields key={question.type} question={question} onChange={onChange} />

      <p>
        <label>
          Explanation (optional, shown after grading)
          <br />
          <textarea
            rows={3}
            cols={70}
            value={question.explanation ?? ''}
            onChange={(event) => onChange({ ...question, explanation: event.target.value })}
          />
        </label>
      </p>

      <p>
        <label>
          Rubric (optional)
          <br />
          <textarea
            rows={3}
            cols={70}
            value={question.rubric ?? ''}
            onChange={(event) => onChange({ ...question, rubric: event.target.value })}
          />
        </label>
      </p>

      <p>
        <CommaListField
          label="Tags"
          hint="comma separated"
          value={question.tags ?? []}
          onChange={(tags) => onChange({ ...question, tags })}
        />
      </p>

      <p>
        <button type="button" disabled={isFirst} onClick={() => onMove(-1)}>
          Move up
        </button>{' '}
        <button type="button" disabled={isLast} onClick={() => onMove(1)}>
          Move down
        </button>{' '}
        <button type="button" onClick={onDuplicate}>
          Duplicate
        </button>{' '}
        <ConfirmButton
          label="Delete question"
          question="Delete this question?"
          confirmLabel="Yes, delete"
          onConfirm={onDelete}
        />
      </p>
    </details>
  )
}
