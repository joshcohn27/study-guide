import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { Attempt } from '../../types'
import { buildAttempt, missedQuestionIds, questionNumbers, setSelfScore } from '../../lib/attempt'
import { formatPercent, formatPoints, scoreSections, summarizeScore } from '../../lib/grade'
import { getExam, saveAttempt } from '../../lib/storage'
import { formatDate, formatDuration } from '../../lib/time'
import { QuestionCard } from '../QuestionCard'

type Props = {
  attempt: Attempt
  onChange: (attempt: Attempt) => void
}

function modeLabel(attempt: Attempt): string {
  if (attempt.mode === 'exam') {
    return 'Exam'
  }
  return 'Practice'
}

export function AttemptReview({ attempt, onChange }: Props) {
  const navigate = useNavigate()
  const [retryError, setRetryError] = useState('')

  const summary = summarizeScore(attempt.sections, attempt.answers, attempt.selfScores)
  const sections = scoreSections(attempt.sections, attempt.answers, attempt.selfScores)
  const numbers = questionNumbers(attempt.sections)
  const missed = missedQuestionIds(attempt)
  const hasExtra = summary.extraPossible > 0

  let waitingText = `${summary.ungradedCount} open-ended questions are waiting for your self-score below.`
  if (summary.ungradedCount === 1) {
    waitingText = '1 open-ended question is waiting for your self-score below.'
  }
  waitingText = `${waitingText} Unscored questions count as 0.`

  async function retryMissed() {
    const exam = await getExam(attempt.examId)
    if (!exam) {
      setRetryError('This exam was deleted, so it can not be retried.')
      return
    }
    const next = buildAttempt(exam, {
      mode: attempt.mode,
      shuffleQuestions: attempt.shuffleQuestions,
      shuffleOptions: attempt.shuffleOptions,
      retryFrom: attempt,
    })
    if (next.sections.length === 0) {
      setRetryError('None of the missed questions are in the exam anymore.')
      return
    }
    try {
      await saveAttempt(next)
      navigate(`/attempts/${next.id}`)
    } catch (err) {
      if (err instanceof Error) {
        setRetryError(err.message)
      }
    }
  }

  return (
    <>
      <section aria-labelledby="score-heading">
        <h2 id="score-heading">Score</h2>
        <dl>
          <dt>Score</dt>
          <dd>
            {formatPoints(summary.earned)} of {formatPoints(summary.possible)} ({formatPercent(summary.percent)})
          </dd>
          {hasExtra && (
            <>
              <dt>Extra credit</dt>
              <dd>
                {formatPoints(summary.extraEarned)} of {formatPoints(summary.extraPossible)}
              </dd>
              <dt>With extra credit</dt>
              <dd>
                {formatPoints(summary.earned + summary.extraEarned)} of {formatPoints(summary.possible)}
              </dd>
            </>
          )}
          <dt>Time used</dt>
          <dd>{formatDuration(attempt.elapsedMs)}</dd>
          <dt>Mode</dt>
          <dd>{modeLabel(attempt)}</dd>
          <dt>Started</dt>
          <dd>{formatDate(attempt.startedAt)}</dd>
          {attempt.endedAt && (
            <>
              <dt>Finished</dt>
              <dd>{formatDate(attempt.endedAt)}</dd>
            </>
          )}
        </dl>
        {summary.ungradedCount > 0 && <p>{waitingText}</p>}

        <table>
          <caption>By section</caption>
          <thead>
            <tr>
              <th scope="col">Section</th>
              <th scope="col">Score</th>
              {hasExtra && <th scope="col">Extra credit</th>}
            </tr>
          </thead>
          <tbody>
            {sections.map((section, index) => (
              <tr key={index}>
                <th scope="row">{section.title}</th>
                <td>
                  {formatPoints(section.earned)} of {formatPoints(section.possible)}
                </td>
                {hasExtra && (
                  <td>
                    {formatPoints(section.extraEarned)} of {formatPoints(section.extraPossible)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        <p>
          {missed.length > 0 && (
            <button type="button" onClick={retryMissed}>
              Retry the {missed.length} I missed
            </button>
          )}{' '}
          <Link to={`/exams/${attempt.examId}`}>Back to exam</Link>
        </p>
        {retryError && <p role="alert">{retryError}</p>}
      </section>

      <h2>Questions</h2>
      {attempt.sections.map((section, sectionIndex) => (
        <section key={sectionIndex}>
          <h2>{section.title}</h2>
          {section.questions.map((q) => (
            <QuestionCard
              key={q.id}
              question={q}
              number={numbers[q.id]}
              answer={attempt.answers[q.id]}
              onAnswer={() => {}}
              reveal={true}
              selfScore={attempt.selfScores[q.id]}
              onSelfScore={(points) => onChange(setSelfScore(attempt, q.id, points))}
              startOrder={attempt.orderingStart[q.id]}
            />
          ))}
        </section>
      ))}
    </>
  )
}
