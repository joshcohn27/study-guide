import { useState } from 'react'
import type { Question, QuestionType, Section } from '../../types'
import { moveItem, TYPE_LABELS } from '../../lib/builder'
import { QUESTION_TYPES } from '../../lib/validate'
import { ConfirmButton } from '../ConfirmButton'
import { QuestionEditor } from './QuestionEditor'

type Props = {
  section: Section
  index: number
  sectionCount: number
  // number of questions in the sections before this one
  numberOffset: number
  newIds: string[]
  onChange: (section: Section) => void
  onMove: (delta: number) => void
  onDelete: () => void
  onAddQuestion: (type: QuestionType) => void
  onDuplicateQuestion: (question: Question) => void
}

export function SectionEditor(props: Props) {
  const { section, index, sectionCount, numberOffset, newIds, onChange, onMove, onDelete } = props
  const [addType, setAddType] = useState<QuestionType>('multiple_choice')

  function setQuestions(questions: Question[]) {
    onChange({ ...section, questions })
  }

  function updateQuestion(questionIndex: number, question: Question) {
    const questions = section.questions.slice()
    questions[questionIndex] = question
    setQuestions(questions)
  }

  function removeQuestion(questionIndex: number) {
    setQuestions(section.questions.filter((_, itemIndex) => itemIndex !== questionIndex))
  }

  const headingId = `section-heading-${index}`

  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId}>Section {index + 1}</h2>
      <p>
        <label>
          Section title{' '}
          <input
            type="text"
            size={40}
            value={section.title}
            onChange={(event) => onChange({ ...section, title: event.target.value })}
          />
        </label>
      </p>
      <p>
        <button type="button" disabled={index === 0} onClick={() => onMove(-1)}>
          Move section up
        </button>{' '}
        <button type="button" disabled={index === sectionCount - 1} onClick={() => onMove(1)}>
          Move section down
        </button>{' '}
        <ConfirmButton
          label="Delete section"
          question={`Delete this section and its ${section.questions.length} questions?`}
          confirmLabel="Yes, delete"
          onConfirm={onDelete}
        />
      </p>

      {section.questions.length === 0 && <p>No questions in this section yet.</p>}

      {section.questions.map((question, questionIndex) => (
        <QuestionEditor
          key={question.id}
          question={question}
          number={numberOffset + questionIndex + 1}
          isFirst={questionIndex === 0}
          isLast={questionIndex === section.questions.length - 1}
          startOpen={newIds.includes(question.id)}
          onChange={(next) => updateQuestion(questionIndex, next)}
          onMove={(delta) => setQuestions(moveItem(section.questions, questionIndex, delta))}
          onDuplicate={() => props.onDuplicateQuestion(question)}
          onDelete={() => removeQuestion(questionIndex)}
        />
      ))}

      <p>
        <label>
          New question type{' '}
          <select value={addType} onChange={(event) => setAddType(event.target.value as QuestionType)}>
            {QUESTION_TYPES.map((type) => (
              <option key={type} value={type}>
                {TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </label>{' '}
        <button type="button" onClick={() => props.onAddQuestion(addType)}>
          Add question
        </button>
      </p>
    </section>
  )
}
