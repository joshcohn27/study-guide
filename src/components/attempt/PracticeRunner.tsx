import { useState } from 'react'
import type { Attempt, Section } from '../../types'
import { allQuestions, checkQuestion, finishAttempt, setAnswer, setSelfScore, timeUsedMs } from '../../lib/attempt'
import { formatDuration } from '../../lib/time'
import { useNow } from '../../lib/useLoad'
import { ConfirmButton } from '../ConfirmButton'
import { QuestionCard } from '../QuestionCard'

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

  let finishQuestion = 'Finish practice and see your score?'
  const uncheckedCount = questions.length - attempt.checked.length
  if (uncheckedCount > 0) {
    finishQuestion = `${uncheckedCount} not checked yet. Finish anyway?`
  }

  return (
    <>
      <section aria-label="Practice status">
        <p>
          Question {index + 1} of {questions.length} · {sectionTitleFor(attempt.sections, q.id)}
        </p>
        <p>
          {attempt.checked.length} of {questions.length} checked · Time used: {formatDuration(timeUsedMs(attempt, now))}
        </p>
      </section>

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

      <p>
        {!revealed && (
          <button type="button" onClick={() => onChange(checkQuestion(attempt, q))}>
            Check
          </button>
        )}{' '}
        <button type="button" disabled={isFirst} onClick={() => setIndex(index - 1)}>
          Previous
        </button>{' '}
        <button type="button" disabled={isLast} onClick={() => setIndex(index + 1)}>
          Next
        </button>
      </p>

      <p>
        <ConfirmButton
          label="Finish practice"
          question={finishQuestion}
          confirmLabel="Yes, finish"
          onConfirm={() => onChange(finishAttempt(attempt, Date.now()))}
        />
      </p>
    </>
  )
}
