import { useState } from 'react'
import { courseLabel } from '../lib/examFile'
import { formatPercent, formatPoints } from '../lib/grade'
import { tagStats } from '../lib/stats'
import { listAttempts, listCourses, listExams } from '../lib/storage'
import { useLoad } from '../lib/useLoad'

async function loadStats() {
  const courses = await listCourses()
  const exams = await listExams()
  const attempts = await listAttempts()
  return { courses, exams, attempts }
}

export function StatsPage() {
  const { state } = useLoad(loadStats, null)
  const [courseId, setCourseId] = useState('')

  if (state.status === 'loading') {
    return <p>Loading...</p>
  }
  if (state.status === 'error') {
    return <p role="alert">{state.message}</p>
  }

  const { courses, exams, attempts } = state.data

  let picked = attempts
  if (courseId !== '') {
    const examIds = exams.filter((exam) => exam.courseId === courseId).map((exam) => exam.id)
    picked = attempts.filter((attempt) => examIds.includes(attempt.examId))
  }
  const finishedCount = picked.filter((attempt) => attempt.endedAt !== null).length
  const stats = tagStats(picked)

  return (
    <>
      <header className="page-head">
        <h1>Stats by tag</h1>
        <p className="page-sub">
          Percent of points earned on tagged questions across finished attempts, weakest first. Open-ended questions you
          haven't self-scored are left out.
        </p>
      </header>

      <p>
        <label className="inline-field">
          Course
          <select value={courseId} onChange={(event) => setCourseId(event.target.value)}>
            <option value="">All courses</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {courseLabel(course)}
              </option>
            ))}
          </select>
        </label>
      </p>

      <p className="hint">Based on {finishedCount} finished attempts.</p>

      {stats.length === 0 && <p>No tagged questions have been graded yet. Add tags to questions to see stats here.</p>}

      {stats.length > 0 && (
        <table>
          <thead>
            <tr>
              <th scope="col">Tag</th>
              <th scope="col">Percent</th>
              <th scope="col">Points</th>
              <th scope="col">Questions graded</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((stat) => (
              <tr key={stat.tag}>
                <th scope="row">{stat.tag}</th>
                <td>{formatPercent(stat.percent)}</td>
                <td>
                  {formatPoints(stat.earned)} of {formatPoints(stat.possible)}
                </td>
                <td>{stat.questionCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  )
}
