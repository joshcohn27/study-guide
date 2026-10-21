import { describe, expect, it } from 'vitest'
import type { ExamFile, MatchingQuestion, MultipleChoiceQuestion, Section } from '../types'
import {
  changeQuestionType,
  cleanExamFile,
  duplicateQuestion,
  moveItem,
  newQuestion,
  nextOptionKey,
  nextQuestionId,
  questionOffsets,
  withOptions,
} from './builder'
import { validateExamFile } from './validate'

const mc: MultipleChoiceQuestion = {
  id: 'q1',
  type: 'multiple_choice',
  points: 2,
  prompt: 'Pick',
  tags: ['search'],
  options: [
    { key: 'a', text: 'A' },
    { key: 'b', text: 'B' },
  ],
  answer: 'b',
}

const sections: Section[] = [
  { title: 'One', questions: [mc, { id: 'q3', type: 'true_false', points: 1, prompt: 'p', answer: true }] },
  { title: 'Two', questions: [] },
]

describe('ids and keys', () => {
  it('picks a free question id', () => {
    expect(nextQuestionId(sections)).toBe('q4')
    expect(nextQuestionId([])).toBe('q1')
  })

  it('picks a free option key', () => {
    expect(nextOptionKey(mc.options)).toBe('c')
    expect(nextOptionKey([{ key: 'b', text: '' }])).toBe('a')
  })
})

describe('changeQuestionType', () => {
  it('keeps shared fields and options', () => {
    const changed = changeQuestionType(mc, 'multi_select')
    expect(changed).toEqual({
      id: 'q1',
      type: 'multi_select',
      points: 2,
      prompt: 'Pick',
      tags: ['search'],
      explanation: undefined,
      rubric: undefined,
      extraCredit: undefined,
      table: undefined,
      options: mc.options,
      answers: [],
    })
  })

  it('starts new questions with starter options', () => {
    expect(newQuestion('matching', 'q9')).toMatchObject({ id: 'q9', rows: [{ label: '', answer: '' }] })
  })

  it('gives fresh defaults for non-option types', () => {
    const changed = changeQuestionType(mc, 'numeric')
    expect(changed.type).toBe('numeric')
    expect(changed.prompt).toBe('Pick')
  })
})

describe('withOptions', () => {
  it('drops answers that point at removed options', () => {
    const next = withOptions(mc, [{ key: 'a', text: 'A' }])
    expect(next).toMatchObject({ answer: '' })

    const matching: MatchingQuestion = {
      id: 'm',
      type: 'matching',
      points: 1,
      prompt: 'p',
      options: mc.options,
      rows: [
        { label: 'x', answer: 'a' },
        { label: 'y', answer: 'b' },
      ],
    }
    expect(withOptions(matching, [{ key: 'a', text: 'A' }])).toMatchObject({
      rows: [
        { label: 'x', answer: 'a' },
        { label: 'y', answer: '' },
      ],
    })
  })
})

describe('list helpers', () => {
  it('duplicates with a new id', () => {
    const copy = duplicateQuestion(mc, sections)
    expect(copy.id).toBe('q4')
    expect(copy.prompt).toBe('Pick')
  })

  it('moves items and ignores moves off the end', () => {
    expect(moveItem([1, 2, 3], 0, 1)).toEqual([2, 1, 3])
    expect(moveItem([1, 2, 3], 0, -1)).toEqual([1, 2, 3])
  })

  it('counts questions before each section', () => {
    expect(questionOffsets(sections)).toEqual([0, 2])
  })
})

describe('cleanExamFile', () => {
  it('drops empty optional fields so the result validates', () => {
    const file: ExamFile = {
      schemaVersion: 1,
      course: ' CS 510 ',
      title: 'Quiz',
      sections: [
        {
          title: 'One',
          questions: [
            {
              id: 'q1',
              type: 'short_answer',
              points: 1,
              prompt: 'Why?',
              modelAnswer: 'Because',
              explanation: ' ',
              tags: [],
              extraCredit: false,
            },
            { id: 'q2', type: 'numeric', points: 1, prompt: 'How many?', answer: 0, unit: '', tolerance: undefined },
          ],
        },
      ],
    }
    const cleaned = cleanExamFile(file)
    expect(cleaned.course).toBe('CS 510')
    expect(cleaned.sections[0].questions[0]).toEqual({
      id: 'q1',
      type: 'short_answer',
      points: 1,
      prompt: 'Why?',
      modelAnswer: 'Because',
    })
    expect(cleaned.sections[0].questions[1]).toEqual({ id: 'q2', type: 'numeric', points: 1, prompt: 'How many?', answer: 0 })
    expect(validateExamFile(cleaned).ok).toBe(true)
  })
})
