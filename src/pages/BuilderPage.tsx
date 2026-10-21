import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import type { ExamFile, Question, QuestionType, Section } from '../types'
import { CopyFormatButton } from '../components/CopyFormatButton'
import { ErrorList } from '../components/ErrorList'
import { NumberField } from '../components/builder/fields'
import { SectionEditor } from '../components/builder/SectionEditor'
import {
  cleanExamFile,
  duplicateQuestion,
  emptyExamFile,
  moveItem,
  newQuestion,
  nextQuestionId,
  questionOffsets,
} from '../lib/builder'
import { courseLabel, examFileName, examToFile } from '../lib/examFile'
import { downloadText } from '../lib/files'
import { getExam, listCourses, saveExamFile } from '../lib/storage'
import { useLoad } from '../lib/useLoad'
import { validateExamFile } from '../lib/validate'

async function loadBuilder(examId: string) {
  const courses = await listCourses()
  if (examId === 'new') {
    return { courses, initial: emptyExamFile(), found: true }
  }
  const exam = await getExam(examId)
  if (!exam) {
    return { courses, initial: emptyExamFile(), found: false }
  }
  const course = courses.find((item) => item.id === exam.courseId)
  return { courses, initial: examToFile(exam, course), found: true }
}

export function BuilderPage() {
  const { examId = 'new' } = useParams()
  const { state } = useLoad(loadBuilder, examId)

  if (state.status === 'loading') {
    return <p>Loading...</p>
  }
  if (state.status === 'error') {
    return <p role="alert">{state.message}</p>
  }
  if (!state.data.found) {
    return (
      <>
        <h1>Exam not found</h1>
        <p>
          <Link to="/">Back to your exams</Link>
        </p>
      </>
    )
  }

  let savedExamId: string | null = examId
  if (examId === 'new') {
    savedExamId = null
  }
  const courseLabels = state.data.courses.map((course) => courseLabel(course))

  return <ExamBuilder key={examId} initial={state.data.initial} examId={savedExamId} courseLabels={courseLabels} />
}

type BuilderProps = {
  initial: ExamFile
  examId: string | null
  courseLabels: string[]
}

function ExamBuilder({ initial, examId, courseLabels }: BuilderProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [file, setFile] = useState(initial)
  const [errors, setErrors] = useState<string[]>([])
  const [newIds, setNewIds] = useState<string[]>([])

  let startMessage = ''
  if (location.state === 'saved') {
    startMessage = 'Saved.'
  }
  const [message, setMessage] = useState(startMessage)

  function update(next: ExamFile) {
    setFile(next)
    setMessage('')
  }

  function setSections(sections: Section[]) {
    update({ ...file, sections })
  }

  function updateSection(index: number, section: Section) {
    const sections = file.sections.slice()
    sections[index] = section
    setSections(sections)
  }

  function addSection() {
    const title = `Section ${file.sections.length + 1}`
    setSections(file.sections.concat({ title, questions: [] }))
  }

  function addQuestion(sectionIndex: number, type: QuestionType) {
    const question = newQuestion(type, nextQuestionId(file.sections))
    addToSection(sectionIndex, question, file.sections[sectionIndex].questions.length)
  }

  function duplicate(sectionIndex: number, question: Question) {
    const copy = duplicateQuestion(question, file.sections)
    const position = file.sections[sectionIndex].questions.indexOf(question) + 1
    addToSection(sectionIndex, copy, position)
  }

  function addToSection(sectionIndex: number, question: Question, position: number) {
    const section = file.sections[sectionIndex]
    const questions = section.questions.slice()
    questions.splice(position, 0, question)
    updateSection(sectionIndex, { ...section, questions })
    setNewIds(newIds.concat(question.id))
  }

  // returns the cleaned exam, or null after showing the errors
  function checkedFile(): ExamFile | null {
    const result = validateExamFile(cleanExamFile(file))
    if (!result.ok) {
      setErrors(result.errors)
      setMessage('')
      return null
    }
    setErrors([])
    return result.exam
  }

  async function save() {
    const exam = checkedFile()
    if (!exam) {
      return
    }
    try {
      const saved = await saveExamFile(exam, examId)
      if (examId === null) {
        navigate(`/exams/${saved.id}/edit`, { replace: true, state: 'saved' })
        return
      }
      setMessage('Saved.')
    } catch (err) {
      if (err instanceof Error) {
        setMessage(err.message)
      }
    }
  }

  function exportJson() {
    const exam = checkedFile()
    if (!exam) {
      return
    }
    downloadText(examFileName(exam.title), JSON.stringify(exam, null, 2))
  }

  let heading = 'Edit exam'
  if (examId === null) {
    heading = 'New exam'
  }

  const offsets = questionOffsets(file.sections)

  return (
    <>
      <h1>{heading}</h1>
      {examId && (
        <p>
          <Link to={`/exams/${examId}`}>Go to exam page</Link>
        </p>
      )}

      <section aria-label="Exam details">
        <p>
          <label>
            Title{' '}
            <input type="text" size={40} value={file.title} onChange={(event) => update({ ...file, title: event.target.value })} />
          </label>
        </p>
        <p>
          <label>
            Course{' '}
            <input
              type="text"
              size={40}
              list="course-options"
              placeholder="CS 510 Artificial Intelligence"
              value={file.course}
              onChange={(event) => update({ ...file, course: event.target.value })}
            />
          </label>
          <datalist id="course-options">
            {courseLabels.map((label) => (
              <option key={label} value={label} />
            ))}
          </datalist>
        </p>
        <p>
          <NumberField
            label="Time limit in minutes (leave empty for none)"
            value={file.timeLimitMinutes}
            onChange={(timeLimitMinutes) => update({ ...file, timeLimitMinutes })}
          />
        </p>
      </section>

      {file.sections.map((section, index) => (
        <SectionEditor
          key={index}
          section={section}
          index={index}
          sectionCount={file.sections.length}
          numberOffset={offsets[index]}
          newIds={newIds}
          onChange={(next) => updateSection(index, next)}
          onMove={(delta) => setSections(moveItem(file.sections, index, delta))}
          onDelete={() => setSections(file.sections.filter((_, itemIndex) => itemIndex !== index))}
          onAddQuestion={(type) => addQuestion(index, type)}
          onDuplicateQuestion={(question) => duplicate(index, question)}
        />
      ))}

      <p>
        <button type="button" onClick={addSection}>
          Add section
        </button>
      </p>

      <ErrorList title="Fix these before saving" errors={errors} />
      {errors.length > 0 && <p>Paths count from 0, so sections[0].questions[0] is the first question of the first section.</p>}

      <p>
        <button type="button" onClick={save}>
          Save exam
        </button>{' '}
        <button type="button" onClick={exportJson}>
          Export exam as JSON
        </button>
      </p>
      {message && <p role="status">{message}</p>}

      <CopyFormatButton />
    </>
  )
}
