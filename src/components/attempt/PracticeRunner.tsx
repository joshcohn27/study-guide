import { useState } from 'react'
import type { Attempt, Section } from '../../types'
import { allQuestions, checkQuestion, finishAttempt, setAnswer, setSelfScore, timeUsedMs } from '../../lib/attempt'
import { gradeQuestion, isAnswered } from '../../lib/grade'
import { formatDuration } from '../../lib/time'
import { useNow } from '../../lib/useLoad'
import { ConfirmButton } from '../ConfirmButton'
import { QuestionCard } from '../QuestionCard'
import { QuestionNav } from './QuestionNav'
import type { NavItem } from './QuestionNav'

type Props = {
  attempt: Attempt
  onChange: (attempt: Attempt) => void
}

function sectionTitleFor(sections: Section[], questionId: string): string {
  for (const section of sections) {
    if (section.questions.some((q) => q.id === questionId)) {
      return section.title
    }
  }
  return ''
}

function firstUncheckedIndex(attempt: Attempt): number {
  const questions = allQuestions(attempt.sections)
  const index = questions.findIndex((q) => !attempt.checked.includes(q.id))
  if (index === -1) {
    return 0
  }
  return index
}

// practice mode: one question at a time, check reveals that one right away
export function PracticeRunner({ attempt, onChange }: Props) {
  const [index, setIndex] = useState(() => firstUncheckedIndex(attempt))
  const now = useNow(1000, true)

  const questions = allQuestions(attempt.sections)
  const q = questions[index]
  const revealed = attempt.checked.includes(q.id)
  const isFirst = index === 0
  const isLast = index === questions.length - 1

  const navItems: NavItem[] = questions.map((item, itemIndex) => {
    let state: NavItem['state'] = 'empty'
    if (isAnswered(item, attempt.answers[item.id])) {
      state = 'answered'
    }
    if (attempt.checked.includes(item.id)) {
      state = gradeQuestion(item, attempt.answers[item.id], attempt.selfScores[item.id]).status
    }
    return { id: item.id, number: itemIndex + 1, state }
  })

  let finishQuestion = 'Finish practice and see your score?'
  const uncheckedCount = questions.length - attempt.checked.length
  if (uncheckedCount > 0) {
    finishQuestion = `${uncheckedCount} not checked yet. Finish anyway?`
  }

  return (
    <div className="attempt-layout">
      <aside className="attempt-side" aria-label="Practice status">
        <p className="clock">
          <span className="clock-label">Time used</span>
          <span className="clock-value">{formatDuration(timeUsedMs(attempt, now))}</span>
        </p>
        <p className="hint">
          {attempt.checked.length} of {questions.length} checked
        </p>
        <progress max={questions.length} value={attempt.checked.length} aria-label="Progress" />
        <QuestionNav items={navItems} onPick={setIndex} currentIndex={index} />
        <ConfirmButton
          label="Finish practice"
          question={finishQuestion}
          confirmLabel="Yes, finish"
          onConfirm={() => onChange(finishAttempt(attempt, Date.now()))}
        />
      </aside>

      <div className="attempt-main">
        <p className="eyebrow">
          {sectionTitleFor(attempt.sections, q.id)} · Question {index + 1} of {questions.length}
        </p>

        <QuestionCard
          key={q.id}
          question={q}
          number={index + 1}
          answer={attempt.answers[q.id]}
          onAnswer={(answer) => onChange(setAnswer(attempt, q.id, answer))}
          reveal={revealed}
          selfScore={attempt.selfScores[q.id]}
          onSelfScore={(points) => onChange(setSelfScore(attempt, q.id, points))}
          startOrder={attempt.orderingStart[q.id]}
        />

        <div className="button-row practice-buttons">
          <button type="button" disabled={isFirst} onClick={() => setIndex(index - 1)}>
            Previous
          </button>
          {!revealed && (
            <button type="button" className="primary" onClick={() => onChange(checkQuestion(attempt, q))}>
              Check
            </button>
          )}
          <button type="button" disabled={isLast} onClick={() => setIndex(index + 1)}>
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
