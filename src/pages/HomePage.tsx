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
      <h1>Your exams</h1>
      <p>
        <Link to="/import">Import an exam</Link> · <Link to="/exams/new/edit">New exam</Link>
      </p>

      {exams.length === 0 && <p>No exams yet. Import one from JSON or build one by hand.</p>}

      {courses.map((course) => (
        <CourseSection
          key={course.id}
          course={course}
          exams={exams.filter((exam) => exam.courseId === course.id)}
          onChanged={reload}
        />
      ))}

      {orphans.length > 0 && (
        <section>
          <h2>No course</h2>
          <ExamList exams={orphans} />
        </section>
      )}
    </>
  )
}

type CourseSectionProps = {
  course: Course
  exams: Exam[]
  onChanged: () => void
}

function CourseSection({ course, exams, onChanged }: CourseSectionProps) {
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

  return (
    <section>
      <h2>{courseLabel(course)}</h2>

      {editing && (
        <form onSubmit={save}>
          <label>
            Code{' '}
            <input type="text" value={code} placeholder="CS 510" onChange={(event) => setCode(event.target.value)} />
          </label>{' '}
          <label>
            Name <input type="text" value={name} onChange={(event) => setName(event.target.value)} />
          </label>{' '}
          <button type="submit">Save course</button>{' '}
          <button type="button" onClick={cancel}>
            Cancel
          </button>
          {error && <p role="alert">{error}</p>}
        </form>
      )}

      {!editing && (
        <p>
          <button type="button" onClick={() => setEditing(true)}>
            Edit course
          </button>{' '}
          {exams.length === 0 && (
            <ConfirmButton
              label="Delete course"
              question="Delete this empty course?"
              confirmLabel="Yes, delete"
              onConfirm={remove}
            />
          )}
        </p>
      )}

      {exams.length === 0 && <p>No exams in this course.</p>}
      {exams.length > 0 && <ExamList exams={exams} />}
    </section>
  )
}

function ExamList({ exams }: { exams: Exam[] }) {
  return (
    <ul>
      {exams.map((exam) => {
        const points = totalPoints(exam.sections)
        return (
          <li key={exam.id}>
            <Link to={`/exams/${exam.id}`}>{exam.title}</Link> · {countQuestions(exam.sections)} questions ·{' '}
            {formatPoints(points.regular)} points · <Link to={`/exams/${exam.id}/edit`}>Edit</Link>
          </li>
        )
      })}
    </ul>
  )
}
