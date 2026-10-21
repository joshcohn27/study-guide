import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import type { Course, Exam } from '../types'
import { ConfirmButton } from '../components/ConfirmButton'
import { countQuestions, courseLabel, totalPoints } from '../lib/examFile'
import { formatPoints } from '../lib/grade'
import { deleteCourse, listCourses, listExams, saveCourse } from '../lib/storage'
import { useLoad } from '../lib/useLoad'

async function loadHome() {
  const courses = await listCourses()
  const exams = await listExams()
  return { courses, exams }
}

export function HomePage() {
  const { state, reload } = useLoad(loadHome, null)

  if (state.status === 'loading') {
    return <p>Loading...</p>
  }
  if (state.status === 'error') {
    return <p role="alert">{state.message}</p>
  }

  const { courses, exams } = state.data
  const courseIds = courses.map((course) => course.id)
  const orphans = exams.filter((exam) => !courseIds.includes(exam.courseId))

  return (
    <>
      <header className="page-head page-head-row">
        <h1>Dashboard</h1>
        <div className="button-row">
          <Link to="/import" className="button">
            Import exam
          </Link>
          <Link to="/exams/new/edit" className="button primary">
            New exam
          </Link>
        </div>
      </header>

      {exams.length === 0 && courses.length === 0 && (
        <p className="empty">No exams yet. Import one from JSON or build one by hand.</p>
      )}

      <div className="course-grid">
        {courses.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            exams={exams.filter((exam) => exam.courseId === course.id)}
            onChanged={reload}
          />
        ))}
        {orphans.length > 0 && (
          <section className="course-card">
            <div className="course-band">
              <h2>No course</h2>
            </div>
            <div className="course-body">
              <ExamList exams={orphans} />
            </div>
          </section>
        )}
      </div>
    </>
  )
}

type CourseCardProps = {
  course: Course
  exams: Exam[]
  onChanged: () => void
}

function CourseCard({ course, exams, onChanged }: CourseCardProps) {
  const [editing, setEditing] = useState(false)
  const [code, setCode] = useState(course.code)
  const [name, setName] = useState(course.name)
  const [error, setError] = useState('')

  async function save(event: FormEvent) {
    event.preventDefault()
    if (code.trim() === '' && name.trim() === '') {
      setError('Give the course a code or a name.')
      return
    }
    try {
      await saveCourse({ ...course, code: code.trim(), name: name.trim() })
      setEditing(false)
      setError('')
      onChanged()
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      }
    }
  }

  function cancel() {
    setCode(course.code)
    setName(course.name)
    setError('')
    setEditing(false)
  }

  async function remove() {
    await deleteCourse(course.id)
    onChanged()
  }

  let title = course.name
  if (title === '') {
    title = courseLabel(course)
  }

  return (
    <section className="course-card" aria-label={courseLabel(course)}>
      <div className="course-band">
        {course.code && <p className="course-code">{course.code}</p>}
        <h2>{title}</h2>
      </div>

      <div className="course-body">
        {exams.length === 0 && <p className="hint">No exams in this course.</p>}
        {exams.length > 0 && <ExamList exams={exams} />}

        {editing && (
          <form onSubmit={save} className="stack">
            <label>
              Code
              <input type="text" value={code} placeholder="CS 510" onChange={(event) => setCode(event.target.value)} />
            </label>
            <label>
              Name
              <input type="text" value={name} onChange={(event) => setName(event.target.value)} />
            </label>
            <div className="button-row">
              <button type="submit" className="primary">
                Save course
              </button>
              <button type="button" onClick={cancel}>
                Cancel
              </button>
            </div>
            {error && <p role="alert">{error}</p>}
          </form>
        )}

        {!editing && (
          <div className="button-row course-actions">
            <button type="button" className="small" onClick={() => setEditing(true)}>
              Edit course
            </button>
            {exams.length === 0 && (
              <ConfirmButton
                label="Delete course"
                question="Delete this empty course?"
                confirmLabel="Yes, delete"
                danger
                onConfirm={remove}
              />
            )}
          </div>
        )}
      </div>
    </section>
  )
}

function ExamList({ exams }: { exams: Exam[] }) {
  return (
    <ul className="exam-list">
      {exams.map((exam) => {
        const points = totalPoints(exam.sections)
        return (
          <li key={exam.id}>
            <Link to={`/exams/${exam.id}`} className="exam-link">
              {exam.title}
            </Link>
            <span className="hint">
              {countQuestions(exam.sections)} questions · {formatPoints(points.regular)} pts
            </span>
          </li>
        )
      })}
    </ul>
  )
}
