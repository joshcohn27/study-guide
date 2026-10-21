import { useCallback, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { Attempt } from '../types'
import { AttemptReview } from '../components/attempt/AttemptReview'
import { ExamRunner } from '../components/attempt/ExamRunner'
import { PracticeRunner } from '../components/attempt/PracticeRunner'
import { getAttempt, saveAttempt } from '../lib/storage'
import { useLoad } from '../lib/useLoad'

export function AttemptPage() {
  const { attemptId = '' } = useParams()
  const { state } = useLoad(getAttempt, attemptId)

  if (state.status === 'loading') {
    return <p>Loading...</p>
  }
  if (state.status === 'error') {
    return <p role="alert">{state.message}</p>
  }
  if (!state.data) {
    return (
      <>
        <h1>Attempt not found</h1>
        <p>
          <Link to="/">Back to your exams</Link>
        </p>
      </>
    )
  }
  return <AttemptView key={state.data.id} initial={state.data} />
}

function AttemptView({ initial }: { initial: Attempt }) {
  const [attempt, setAttempt] = useState(initial)
  const [saveError, setSaveError] = useState('')

  // every change autosaves
  const update = useCallback((next: Attempt) => {
    setAttempt(next)
    saveAttempt(next)
      .then(() => setSaveError(''))
      .catch((err: unknown) => {
        let message = 'Could not save your answers.'
        if (err instanceof Error) {
          message = err.message
        }
        setSaveError(message)
      })
  }, [])

  const finished = attempt.endedAt !== null
  let heading = `${attempt.examTitle}: exam`
  if (attempt.mode === 'practice') {
    heading = `${attempt.examTitle}: practice`
  }
  if (finished) {
    heading = `${attempt.examTitle}: results`
  }

  return (
    <>
      <h1>{heading}</h1>
      {attempt.retryOfAttemptId && <p>Retrying only the questions missed last time.</p>}
      {saveError && <p role="alert">{saveError}</p>}
      {finished && <AttemptReview attempt={attempt} onChange={update} />}
      {!finished && attempt.mode === 'exam' && <ExamRunner attempt={attempt} onChange={update} />}
      {!finished && attempt.mode === 'practice' && <PracticeRunner attempt={attempt} onChange={update} />}
    </>
  )
}
