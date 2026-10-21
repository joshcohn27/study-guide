import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { Question } from '../types'
import { QuestionCard } from './QuestionCard'

const options = [
  { key: 'a', text: 'Alpha' },
  { key: 'b', text: 'Beta' },
]

const extras = { explanation: 'SECRET_EXPLANATION', rubric: 'SECRET_RUBRIC' }

// each question paired with text that should only show up once revealed
const cases: { question: Question; hidden: string }[] = [
  { question: { ...extras, id: 'tf', type: 'true_false', points: 1, prompt: 'p', answer: true }, hidden: 'Correct answer' },
  {
    question: { ...extras, id: 'mc', type: 'multiple_choice', points: 1, prompt: 'p', options, answer: 'a' },
    hidden: 'Correct answer',
  },
  {
    question: { ...extras, id: 'ms', type: 'multi_select', points: 1, prompt: 'p', options, answers: ['a'] },
    hidden: 'Should be checked',
  },
  {
    question: { ...extras, id: 'ma', type: 'matching', points: 1, prompt: 'p', options, rows: [{ label: 'x', answer: 'a' }] },
    hidden: 'Answer: a<',
  },
  {
    question: {
      ...extras,
      id: 'mm',
      type: 'multi_match',
      points: 1,
      prompt: 'p',
      options,
      rows: [{ label: 'x', answers: ['b'] }],
    },
    hidden: 'Answer: b',
  },
  {
    question: { ...extras, id: 'fb', type: 'fill_blank', points: 1, prompt: 'p', acceptedAnswers: ['SECRET_BLANK'] },
    hidden: 'SECRET_BLANK',
  },
  {
    question: { ...extras, id: 'nu', type: 'numeric', points: 1, prompt: 'p', answer: 98765 },
    hidden: '98765',
  },
  {
    question: { ...extras, id: 'or', type: 'ordering', points: 1, prompt: 'p', items: ['one', 'two'] },
    hidden: 'Right spot',
  },
  {
    question: { ...extras, id: 'sa', type: 'short_answer', points: 1, prompt: 'p', modelAnswer: 'SECRET_MODEL' },
    hidden: 'SECRET_MODEL',
  },
]

function render(question: Question, reveal: boolean): string {
  return renderToStaticMarkup(
    <QuestionCard
      question={question}
      number={1}
      answer={undefined}
      onAnswer={() => {}}
      reveal={reveal}
      selfScore={undefined}
      onSelfScore={() => {}}
      startOrder={undefined}
    />,
  )
}

describe('QuestionCard', () => {
  for (const { question, hidden } of cases) {
    it(`keeps the ${question.type} answer hidden until revealed`, () => {
      const before = render(question, false)
      expect(before).not.toContain(hidden)
      expect(before).not.toContain('SECRET_EXPLANATION')
      expect(before).not.toContain('SECRET_RUBRIC')
      expect(before).not.toContain('class="mark')
      expect(before).not.toContain('choice-correct')
      expect(before).not.toContain('question-status')

      const after = render(question, true)
      expect(after).toContain(hidden)
      expect(after).toContain('SECRET_EXPLANATION')
      expect(after).toContain('SECRET_RUBRIC')
    })
  }

  it('only shows self-score controls on revealed short answers', () => {
    const shortAnswer = cases[cases.length - 1].question
    expect(render(shortAnswer, false)).not.toContain('Score yourself')
    expect(render(shortAnswer, true)).toContain('Score yourself')
    expect(render(cases[0].question, true)).not.toContain('Score yourself')
  })
})
