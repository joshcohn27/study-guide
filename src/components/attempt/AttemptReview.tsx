import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { Attempt } from '../../types'
import { allQuestions, buildAttempt, missedQuestionIds, questionNumbers, setSelfScore } from '../../lib/attempt'
import { formatPercent, formatPoints, gradeQuestion, scoreSections, summarizeScore } from '../../lib/grade'
import { getExam, saveAttempt } from '../../lib/storage'
import { formatDate, formatDuration } from '../../lib/time'
import { QuestionCard } from '../QuestionCard'
import { QuestionNav } from './QuestionNav'
import type { NavItem } from './QuestionNav'

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

  const navItems: NavItem[] = allQuestions(attempt.sections).map((q) => {
    const result = gradeQuestion(q, attempt.answers[q.id], attempt.selfScores[q.id])
    return { id: q.id, number: numbers[q.id], state: result.status }
  })
  const rightCount = navItems.filter((item) => item.state === 'correct').length

  let waitingText = `${summary.ungradedCount} open-ended questions need your self-score. They count as 0 until scored.`
  if (summary.ungradedCount === 1) {
    waitingText = '1 open-ended question needs your self-score. It counts as 0 until scored.'
  }

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
    <div className="attempt-layout">
      <aside className="attempt-side" aria-label="Results">
        <p className="hint">
          {rightCount} of {navItems.length} fully correct
        </p>
        <QuestionNav items={navItems} />
        <ul className="legend" aria-label="Legend">
          <li className="legend-correct">Correct</li>
          <li className="legend-partial">Partial</li>
          <li className="legend-wrong">Incorrect</li>
          <li className="legend-ungraded">Self-score</li>
        </ul>
      </aside>

      <div className="attempt-main">
        <section className="panel score-panel" aria-labelledby="score-heading">
          <h2 id="score-heading" className="visually-hidden">
            Score
          </h2>
          <p className="score-line">
            <span className="score-number">{formatPoints(summary.earned)}</span>
            <span className="score-out-of"> / {formatPoints(summary.possible)} pts</span>
            <span className="score-percent">{formatPercent(summary.percent)}</span>
          </p>
          <ul className="facts">
            {hasExtra && (
              <li>
                <span>Extra credit</span>
                {formatPoints(summary.extraEarned)} / {formatPoints(summary.extraPossible)}
              </li>
            )}
            {hasExtra && (
              <li>
                <span>With extra credit</span>
                {formatPoints(summary.earned + summary.extraEarned)} / {formatPoints(summary.possible)}
              </li>
            )}
            <li>
              <span>Time used</span>
              {formatDuration(attempt.elapsedMs)}
            </li>
            <li>
              <span>Mode</span>
              {modeLabel(attempt)}
            </li>
            {attempt.endedAt && (
              <li>
                <span>Finished</span>
                {formatDate(attempt.endedAt)}
              </li>
            )}
          </ul>
          {summary.ungradedCount > 0 && <p className="notice">{waitingText}</p>}

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
                    {formatPoints(section.earned)} / {formatPoints(section.possible)}
                  </td>
                  {hasExtra && (
                    <td>
                      {formatPoints(section.extraEarned)} / {formatPoints(section.extraPossible)}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          <div className="button-row">
            {missed.length > 0 && (
              <button type="button" className="primary" onClick={retryMissed}>
                Retry the {missed.length} I missed
              </button>
            )}
            <Link to={`/exams/${attempt.examId}`}>Back to exam</Link>
          </div>
          {retryError && <p role="alert">{retryError}</p>}
        </section>

        {attempt.sections.map((section, sectionIndex) => (
          <section key={sectionIndex} className="exam-section">
            <h2 className="section-title">{section.title}</h2>
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
      </div>
    </div>
  )
}
