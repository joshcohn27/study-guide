import { useState } from 'react'
import type { ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ExamFile, QuestionType } from '../types'
import { CopyFormatButton } from '../components/CopyFormatButton'
import { ErrorList } from '../components/ErrorList'
import { allQuestions } from '../lib/attempt'
import { TYPE_LABELS } from '../lib/builder'
import { courseLabel, sameCourseLabel, totalPoints } from '../lib/examFile'
import { readFileText } from '../lib/files'
import { formatPoints } from '../lib/grade'
import { listCourses, saveExamFile } from '../lib/storage'
import { parseExamJson, QUESTION_TYPES } from '../lib/validate'

type Preview = {
  exam: ExamFile
  existingCourse: string | null
}

export function ImportPage() {
  const navigate = useNavigate()
  const [text, setText] = useState('')
  const [errors, setErrors] = useState<string[]>([])
  const [preview, setPreview] = useState<Preview | null>(null)
  const [saveError, setSaveError] = useState('')

  function changeText(nextText: string) {
    setText(nextText)
    setErrors([])
    setPreview(null)
  }

  async function pickFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }
    const fileText = await readFileText(file)
    changeText(fileText)
  }

  async function check() {
    const result = parseExamJson(text)
    if (!result.ok) {
      setErrors(result.errors)
      setPreview(null)
      return
    }
    const courses = await listCourses()
    const match = courses.find((course) => sameCourseLabel(courseLabel(course), result.exam.course))
    let existingCourse: string | null = null
    if (match) {
      existingCourse = courseLabel(match)
    }
    setErrors([])
    setPreview({ exam: result.exam, existingCourse })
  }

  async function save() {
    if (!preview) {
      return
    }
    try {
      const exam = await saveExamFile(preview.exam, null)
      navigate(`/exams/${exam.id}`)
    } catch (err) {
      if (err instanceof Error) {
        setSaveError(err.message)
      }
    }
  }

  return (
    <>
      <header className="page-head">
        <h1>Import an exam</h1>
        <p className="page-sub">Paste exam JSON or pick a .json file, then check it. Nothing is saved until you confirm.</p>
      </header>

      <form
        className="panel"
        onSubmit={(event) => {
          event.preventDefault()
          check()
        }}
      >
        <p>
          <label className="stack-label">
            JSON file
            <input type="file" accept=".json,application/json" onChange={pickFile} />
          </label>
        </p>
        <p>
          <label className="stack-label">
            Or paste exam JSON
            <textarea rows={14} className="code" value={text} onChange={(event) => changeText(event.target.value)} />
          </label>
        </p>
        <button type="submit" className="primary" disabled={text.trim() === ''}>
          Check
        </button>
      </form>

      <section className="panel" aria-label="Exam JSON format">
        <CopyFormatButton />
      </section>

      <ErrorList title="Fix these before importing" errors={errors} />

      {preview && <ImportPreview preview={preview} onSave={save} />}
      {saveError && <p role="alert">{saveError}</p>}
    </>
  )
}

function ImportPreview({ preview, onSave }: { preview: Preview; onSave: () => void }) {
  const { exam, existingCourse } = preview
  const questions = allQuestions(exam.sections)
  const points = totalPoints(exam.sections)

  const counts = QUESTION_TYPES.map((type: QuestionType) => {
    const count = questions.filter((q) => q.type === type).length
    return { type, count }
  }).filter((row) => row.count > 0)

  let courseText = `A new course "${exam.course}" will be created.`
  if (existingCourse) {
    courseText = `Goes into your existing course ${existingCourse}.`
  }

  let timeText = 'No time limit'
  if (exam.timeLimitMinutes !== undefined) {
    timeText = `${exam.timeLimitMinutes} minutes`
  }

  return (
    <section className="panel" aria-labelledby="preview-heading">
      <h2 id="preview-heading" className="panel-title">
        Preview
      </h2>
      <dl>
        <dt>Title</dt>
        <dd>{exam.title}</dd>
        <dt>Course</dt>
        <dd>{courseText}</dd>
        <dt>Time limit</dt>
        <dd>{timeText}</dd>
        <dt>Sections</dt>
        <dd>{exam.sections.length}</dd>
        <dt>Questions</dt>
        <dd>{questions.length}</dd>
        <dt>Total points</dt>
        <dd>
          {formatPoints(points.regular)}
          {points.extra > 0 && ` + ${formatPoints(points.extra)} extra credit`}
        </dd>
      </dl>
      <table>
        <caption>Questions by type</caption>
        <thead>
          <tr>
            <th scope="col">Type</th>
            <th scope="col">Count</th>
          </tr>
        </thead>
        <tbody>
          {counts.map((row) => (
            <tr key={row.type}>
              <th scope="row">{TYPE_LABELS[row.type]}</th>
              <td>{row.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <button type="button" onClick={onSave}>
        Save exam
      </button>
    </section>
  )
}
