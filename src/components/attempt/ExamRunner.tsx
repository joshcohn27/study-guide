import { useEffect } from 'react'
import type { Attempt } from '../../types'
import {
  allQuestions,
  finishAttempt,
  pauseClock,
  questionNumbers,
  resumeClock,
  setAnswer,
  timeLeftMs,
  timeUsedMs,
} from '../../lib/attempt'
import { isAnswered } from '../../lib/grade'
import { formatDuration } from '../../lib/time'
import { useNow } from '../../lib/useLoad'
import { ConfirmButton } from '../ConfirmButton'
import { QuestionCard } from '../QuestionCard'

type Props = {
  attempt: Attempt
  onChange: (attempt: Attempt) => void
}

// exam mode: every question on one page, nothing revealed until submit
export function ExamRunner({ attempt, onChange }: Props) {
  const running = attempt.runningSince !== null
  const now = useNow(1000, running)
  const used = timeUsedMs(attempt, now)
  const left = timeLeftMs(attempt, now)
  const timeIsUp = left === 0

  // submit on its own once the countdown runs out
  useEffect(() => {
    if (timeIsUp) {
      onChange(finishAttempt(attempt, Date.now()))
    }
  }, [timeIsUp, attempt, onChange])

  const questions = allQuestions(attempt.sections)
  const numbers = questionNumbers(attempt.sections)
  const answeredCount = questions.filter((q) => isAnswered(q, attempt.answers[q.id])).length
  const unansweredCount = questions.length - answeredCount

  let clockText = `Time used: ${formatDuration(used)}`
  if (left !== null) {
    clockText = `Time left: ${formatDuration(left)}`
  }

  let submitQuestion = 'Submit and grade now?'
  if (unansweredCount > 0) {
    submitQuestion = `${unansweredCount} unanswered. Submit and grade anyway?`
  }

  return (
    <>
      <section aria-label="Exam status">
        <p role="timer">{clockText}</p>
        <p>
          {answeredCount} of {questions.length} answered
        </p>
        {running && (
          <button type="button" onClick={() => onChange(pauseClock(attempt, Date.now()))}>
            Pause
          </button>
        )}
        {!running && (
          <button type="button" onClick={() => onChange(resumeClock(attempt, Date.now()))}>
            Resume
          </button>
        )}
      </section>

      {!running && <p>Paused. Questions are hidden while the clock is stopped.</p>}

      {running &&
        attempt.sections.map((section, sectionIndex) => (
          <section key={sectionIndex}>
            <h2>{section.title}</h2>
            {section.questions.map((q) => (
              <QuestionCard
                key={q.id}
                question={q}
                number={numbers[q.id]}
                answer={attempt.answers[q.id]}
                onAnswer={(answer) => onChange(setAnswer(attempt, q.id, answer))}
                reveal={false}
                selfScore={undefined}
                onSelfScore={() => {}}
                startOrder={attempt.orderingStart[q.id]}
              />
            ))}
          </section>
        ))}

      {running && (
        <p>
          <ConfirmButton
            label="Submit and grade"
            question={submitQuestion}
            confirmLabel="Yes, submit"
            onConfirm={() => onChange(finishAttempt(attempt, Date.now()))}
          />
        </p>
      )}
    </>
  )
}
