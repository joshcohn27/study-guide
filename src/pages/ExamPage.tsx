import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import type { Attempt, AttemptMode, Course, Exam } from '../types'
import { ConfirmButton } from '../components/ConfirmButton'
import { buildAttempt, missedQuestionIds } from '../lib/attempt'
import { countQuestions, courseLabel, examFileName, examToFile, totalPoints } from '../lib/examFile'
import { downloadText } from '../lib/files'
import { formatPercent, formatPoints } from '../lib/grade'
import { deleteAttempt, deleteExam, getExam, listAttempts, listCourses, saveAttempt } from '../lib/storage'
import { formatDate, formatDuration } from '../lib/time'
import { useLoad } from '../lib/useLoad'

async function loadExamPage(examId: string) {
  const exam = await getExam(examId)
  const courses = await listCourses()
  const attempts = await listAttempts(examId)
  // newest first
  attempts.sort((a, b) => b.startedAt.localeCompare(a.startedAt))
  return { exam, courses, attempts }
}

export function ExamPage() {
  const { examId = '' } = useParams()
  const navigate = useNavigate()
  const { state, reload } = useLoad(loadExamPage, examId)

  if (state.status === 'loading') {
    return <p>Loading...</p>
  }
  if (state.status === 'error') {
    return <p role="alert">{state.message}</p>
  }

  const { exam, courses, attempts } = state.data
  if (!exam) {
    return (
      <>
        <h1>Exam not found</h1>
        <p>
          <Link to="/">Back to your exams</Link>
        </p>
      </>
    )
  }

  const course = courses.find((item) => item.id === exam.courseId)

  async function removeExam() {
    await deleteExam(examId)
    navigate('/')
  }

  return (
    <>
      <h1>{exam.title}</h1>
      <ExamSummary exam={exam} course={course} />
      <p>
        <Link to={`/exams/${exam.id}/edit`}>Edit exam</Link>{' '}
        <button type="button" onClick={() => exportExam(exam, course)}>
          Export exam as JSON
        </button>{' '}
        <ConfirmButton
          label="Delete exam"
          question="Delete this exam and all of its attempts?"
          confirmLabel="Yes, delete"
          onConfirm={removeExam}
        />
      </p>
      <StartForm key={exam.id} exam={exam} attempts={attempts} />
      <AttemptHistory attempts={attempts} onChanged={reload} />
    </>
  )
}

function exportExam(exam: Exam, course: Course | undefined) {
  const file = examToFile(exam, course)
  downloadText(examFileName(exam.title), JSON.stringify(file, null, 2))
}

function ExamSummary({ exam, course }: { exam: Exam; course: Course | undefined }) {
  const points = totalPoints(exam.sections)
  let timeText = 'No time limit'
  if (exam.timeLimitMinutes !== undefined) {
    timeText = `Time limit: ${exam.timeLimitMinutes} minutes`
  }
  return (
    <section aria-label="About this exam">
      {course && <p>{courseLabel(course)}</p>}
      <p>
        {countQuestions(exam.sections)} questions · {formatPoints(points.regular)} points
        {points.extra > 0 && ` + ${formatPoints(points.extra)} extra credit`} · {timeText}
      </p>
      <ul>
        {exam.sections.map((section, index) => (
          <li key={index}>
            {section.title}: {section.questions.length} questions
          </li>
        ))}
      </ul>
    </section>
  )
}

function StartForm({ exam, attempts }: { exam: Exam; attempts: Attempt[] }) {
  const navigate = useNavigate()
  const [mode, setMode] = useState<AttemptMode>('exam')
  const [shuffleQuestions, setShuffleQuestions] = useState(false)
  const [shuffleOptions, setShuffleOptions] = useState(false)
  const [retryFromId, setRetryFromId] = useState('')
  const [error, setError] = useState('')

  const retryable = attempts.filter((attempt) => {
    if (attempt.endedAt === null) {
      return false
    }
    return missedQuestionIds(attempt).length > 0
  })

  let examModeText = 'Exam: all questions on one page, no timer, graded when you submit.'
  if (exam.timeLimitMinutes !== undefined) {
    examModeText = `Exam: all questions on one page, ${exam.timeLimitMinutes} minute timer you can pause, graded when you submit.`
  }

  async function start(event: FormEvent) {
    event.preventDefault()
    const retryFrom = retryable.find((attempt) => attempt.id === retryFromId) ?? null
    const attempt = buildAttempt(exam, { mode, shuffleQuestions, shuffleOptions, retryFrom })
    if (attempt.sections.length === 0) {
      setError('None of the missed questions are in the exam anymore.')
      return
    }
    try {
      await saveAttempt(attempt)
      navigate(`/attempts/${attempt.id}`)
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      }
    }
  }

  return (
    <section aria-labelledby="start-heading">
      <h2 id="start-heading">Start</h2>
      <form onSubmit={start}>
        <fieldset>
          <legend>Mode</legend>
          <label>
            <input type="radio" name="mode" checked={mode === 'exam'} onChange={() => setMode('exam')} /> {examModeText}
          </label>
          <br />
          <label>
            <input type="radio" name="mode" checked={mode === 'practice'} onChange={() => setMode('practice')} />{' '}
            Practice: one question at a time, check each answer as you go, no timer.
          </label>
        </fieldset>

        <fieldset>
          <legend>Options</legend>
          <label>
            <input
              type="checkbox"
              checked={shuffleQuestions}
              onChange={(event) => setShuffleQuestions(event.target.checked)}
            />{' '}
            Shuffle questions within each section
          </label>
          <br />
          <label>
            <input
              type="checkbox"
              checked={shuffleOptions}
              onChange={(event) => setShuffleOptions(event.target.checked)}
            />{' '}
            Shuffle answer options
          </label>
          <br />
          <label>
            Questions{' '}
            <select value={retryFromId} onChange={(event) => setRetryFromId(event.target.value)}>
              <option value="">All questions</option>
              {retryable.map((attempt) => (
                <option key={attempt.id} value={attempt.id}>
                  Only the {missedQuestionIds(attempt).length} I missed on {formatDate(attempt.startedAt)}
                </option>
              ))}
            </select>
          </label>
        </fieldset>

        <button type="submit">Start</button>
        {error && <p role="alert">{error}</p>}
      </form>
    </section>
  )
}

function scoreText(attempt: Attempt): string {
  const score = attempt.score
  if (attempt.endedAt === null || score === null) {
    return 'Not finished'
  }
  let text = `${formatPoints(score.earned)} of ${formatPoints(score.possible)} (${formatPercent(score.percent)})`
  if (score.extraPossible > 0) {
    text = `${text} + ${formatPoints(score.extraEarned)} extra`
  }
  if (score.ungradedCount > 0) {
    text = `${text}, ${score.ungradedCount} to self-score`
  }
  return text
}

function modeText(attempt: Attempt): string {
  let text = 'Exam'
  if (attempt.mode === 'practice') {
    text = 'Practice'
  }
  if (attempt.retryOfAttemptId) {
    text = `${text} (retry of missed)`
  }
  return text
}

function AttemptHistory({ attempts, onChanged }: { attempts: Attempt[]; onChanged: () => void }) {
  async function remove(attemptId: string) {
    await deleteAttempt(attemptId)
    onChanged()
  }

  return (
    <section aria-labelledby="history-heading">
      <h2 id="history-heading">Past attempts</h2>
      {attempts.length === 0 && <p>No attempts yet.</p>}
      {attempts.length > 0 && (
        <table>
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Mode</th>
              <th scope="col">Score</th>
              <th scope="col">Time used</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {attempts.map((attempt) => {
              let openLabel = 'Review'
              let timeText = formatDuration(attempt.elapsedMs)
              if (attempt.endedAt === null) {
                openLabel = 'Resume'
                timeText = 'In progress'
              }
              return (
                <tr key={attempt.id}>
                  <td>{formatDate(attempt.startedAt)}</td>
                  <td>{modeText(attempt)}</td>
                  <td>{scoreText(attempt)}</td>
                  <td>{timeText}</td>
                  <td>
                    <Link to={`/attempts/${attempt.id}`}>{openLabel}</Link>{' '}
                    <ConfirmButton
                      label="Delete"
                      question="Delete this attempt?"
                      confirmLabel="Yes, delete"
                      onConfirm={() => remove(attempt.id)}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </section>
  )
}
