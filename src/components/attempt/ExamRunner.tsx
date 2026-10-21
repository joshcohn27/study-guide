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
import { QuestionNav } from './QuestionNav'
import type { NavItem } from './QuestionNav'

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
  const navItems: NavItem[] = questions.map((q) => {
    let state: NavItem['state'] = 'empty'
    if (isAnswered(q, attempt.answers[q.id])) {
      state = 'answered'
    }
    return { id: q.id, number: numbers[q.id], state }
  })
  const answeredCount = navItems.filter((item) => item.state === 'answered').length
  const unansweredCount = questions.length - answeredCount

  let clockLabel = 'Time used'
  let clockValue = formatDuration(used)
  if (left !== null) {
    clockLabel = 'Time left'
    clockValue = formatDuration(left)
  }

  let submitQuestion = 'Submit and grade now?'
  if (unansweredCount > 0) {
    submitQuestion = `${unansweredCount} unanswered. Submit anyway?`
  }

  const submitButton = (
    <ConfirmButton
      label="Submit and grade"
      question={submitQuestion}
      confirmLabel="Yes, submit"
      primary
      onConfirm={() => onChange(finishAttempt(attempt, Date.now()))}
    />
  )

  return (
    <div className="attempt-layout">
      <aside className="attempt-side" aria-label="Exam status">
        <p className="clock">
          <span className="clock-label">{clockLabel}</span>
          <span className="clock-value" role="timer">
            {clockValue}
          </span>
        </p>
        <p className="hint">
          {answeredCount} of {questions.length} answered
        </p>
        <progress max={questions.length} value={answeredCount} aria-label="Progress" />
        {running && (
          <button type="button" onClick={() => onChange(pauseClock(attempt, Date.now()))}>
            Pause
          </button>
        )}
        {!running && (
          <button type="button" className="primary" onClick={() => onChange(resumeClock(attempt, Date.now()))}>
            Resume
          </button>
        )}
        {running && (
          <>
            <QuestionNav items={navItems} />
            {submitButton}
          </>
        )}
      </aside>

      <div className="attempt-main">
        {!running && (
          <div className="paused">
            <h2>Paused</h2>
            <p>Questions are hidden while the clock is stopped. Resume when you're ready.</p>
          </div>
        )}

        {running &&
          attempt.sections.map((section, sectionIndex) => (
            <section key={sectionIndex} className="exam-section">
              <h2 className="section-title">{section.title}</h2>
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

        {running && <div className="submit-row">{submitButton}</div>}
      </div>
    </div>
  )
}
