import type { Answer, Question } from '../types'
import { formatPoints, gradeQuestion } from '../lib/grade'
import type { QuestionStatus } from '../lib/grade'
import { MultilineText } from './MultilineText'
import { QuestionTableView } from './QuestionTableView'
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
  correct: 'Right',
  partial: 'Partly right',
  wrong: 'Wrong',
  ungraded: 'Needs your self-score',
}

function pointsLabel(points: number): string {
  if (points === 1) {
    return '1 point'
  }
  return `${formatPoints(points)} points`
}

export function QuestionCard(props: Props) {
  const { question, number, answer, onAnswer, reveal, selfScore, onSelfScore, startOrder } = props
  const result = gradeQuestion(question, answer, selfScore)
  const headingId = `question-${question.id}`

  return (
    <article aria-labelledby={headingId}>
      <h3 id={headingId}>Question {number}</h3>
      <p>
        {pointsLabel(question.points)}
        {question.extraCredit && ', extra credit'}
        {question.tags && question.tags.length > 0 && ` · Tags: ${question.tags.join(', ')}`}
      </p>
      <MultilineText text={question.prompt} />
      {question.table && <QuestionTableView table={question.table} />}

      <QuestionInput
        question={question}
        answer={answer}
        onAnswer={onAnswer}
        reveal={reveal}
        startOrder={startOrder}
      />

      {reveal && (
        <section aria-label="Result">
          <p>
            <strong>{STATUS_TEXT[result.status]}</strong>
            {result.status !== 'ungraded' && ` · ${formatPoints(result.earned)} of ${formatPoints(result.possible)}`}
          </p>
          {question.rubric && (
            <>
              <h4>Rubric</h4>
              <MultilineText text={question.rubric} />
            </>
          )}
          {question.type === 'short_answer' && (
            <SelfScoreControls points={question.points} value={selfScore} onChange={onSelfScore} />
          )}
          {question.explanation && (
            <>
              <h4>Explanation</h4>
              <MultilineText text={question.explanation} />
            </>
          )}
        </section>
      )}
    </article>
  )
}
