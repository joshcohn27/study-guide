import type { Answer, Question } from '../types'
import { formatPoints, gradeQuestion } from '../lib/grade'
import type { QuestionStatus } from '../lib/grade'
import { MultilineText } from './MultilineText'
import { QuestionTableView } from './QuestionTableView'
import { questionAnchor } from './questions/helpers'
import { QuestionInput } from './questions/QuestionInput'
import { SelfScoreControls } from './questions/SelfScoreControls'

type Props = {
  question: Question
  number: number
  answer: Answer | undefined
  onAnswer: (answer: Answer) => void
  reveal: boolean
  selfScore: number | undefined
  onSelfScore: (points: number) => void
  startOrder: string[] | undefined
}

const STATUS_TEXT: Record<QuestionStatus, string> = {
  correct: '✓ Correct',
  partial: '◐ Partial credit',
  wrong: '✗ Incorrect',
  ungraded: 'Score yourself below',
}

function pointsLabel(points: number): string {
  if (points === 1) {
    return '1 pt'
  }
  return `${formatPoints(points)} pts`
}

export function QuestionCard(props: Props) {
  const { question, number, answer, onAnswer, reveal, selfScore, onSelfScore, startOrder } = props
  const result = gradeQuestion(question, answer, selfScore)
  const anchor = questionAnchor(question.id)
  const tags = question.tags ?? []
  const hasMeta = question.extraCredit === true || tags.length > 0

  let cardClass = 'question'
  let pointsText = pointsLabel(question.points)
  if (reveal) {
    cardClass = `question question-${result.status}`
    if (result.status !== 'ungraded') {
      pointsText = `${formatPoints(result.earned)} / ${pointsLabel(question.points)}`
    }
  }

  return (
    <article className={cardClass} id={anchor} aria-labelledby={`${anchor}-title`}>
      <header className="question-head">
        <h3 id={`${anchor}-title`}>Question {number}</h3>
        {reveal && <span className="question-status">{STATUS_TEXT[result.status]}</span>}
        <span className="question-points">{pointsText}</span>
      </header>

      <div className="question-body">
        {hasMeta && (
          <p className="question-meta">
            {question.extraCredit && <span>Extra credit</span>}
            {tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </p>
        )}
        <div className="prompt">
          <MultilineText text={question.prompt} />
        </div>
        {question.table && <QuestionTableView table={question.table} />}

        <QuestionInput
          question={question}
          answer={answer}
          onAnswer={onAnswer}
          reveal={reveal}
          startOrder={startOrder}
        />
      </div>

      {reveal && (
        <div className="question-feedback">
          {question.type === 'short_answer' && (
            <section className="note note-answer">
              <h4>Model answer</h4>
              <MultilineText text={question.modelAnswer} />
            </section>
          )}
          {question.rubric && (
            <section className="note">
              <h4>Rubric</h4>
              <MultilineText text={question.rubric} />
            </section>
          )}
          {question.type === 'short_answer' && (
            <SelfScoreControls points={question.points} value={selfScore} onChange={onSelfScore} />
          )}
          {question.explanation && (
            <section className="note">
              <h4>Explanation</h4>
              <MultilineText text={question.explanation} />
            </section>
          )}
        </div>
      )}
    </article>
  )
}
