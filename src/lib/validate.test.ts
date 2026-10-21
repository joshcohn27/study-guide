import { describe, expect, it } from 'vitest'
import seed from '../../cs510-midterm-practice.json'
import { parseExamJson, validateExamFile } from './validate'

function examWith(questions: unknown[]) {
  return {
    schemaVersion: 1,
    course: 'CS 510',
    title: 'Test exam',
    sections: [{ title: 'Part 1', questions }],
  }
}

function errorsFor(question: unknown): string[] {
  const result = validateExamFile(examWith([question]))
  if (result.ok) {
    return []
  }
  return result.errors
}

const options = [
  { key: 'a', text: 'Alpha' },
  { key: 'b', text: 'Beta' },
  { key: 'c', text: 'Gamma' },
]

const validQuestions = [
  { id: 'tf', type: 'true_false', points: 1, prompt: 'Sky is blue?', answer: true },
  { id: 'mc', type: 'multiple_choice', points: 1, prompt: 'Pick one', options, answer: 'b' },
  { id: 'ms', type: 'multi_select', points: 2, prompt: 'Pick some', options, answers: ['a', 'c'] },
  {
    id: 'ma',
    type: 'matching',
    points: 2,
    prompt: 'Match',
    options,
    rows: [
      { label: 'one', answer: 'a' },
      { label: 'two', answer: 'b' },
    ],
  },
  {
    id: 'mm',
    type: 'multi_match',
    points: 2,
    prompt: 'Multi match',
    options,
    rows: [
      { label: 'one', answers: ['a', 'b'] },
      { label: 'two', answers: [] },
    ],
  },
  { id: 'fb', type: 'fill_blank', points: 1, prompt: 'Fill', acceptedAnswers: ['queue'], caseSensitive: false },
  { id: 'nu', type: 'numeric', points: 1, prompt: 'Number', answer: 3.14, tolerance: 0.01, unit: 'm' },
  { id: 'or', type: 'ordering', points: 1, prompt: 'Order', items: ['first', 'second', 'third'] },
  {
    id: 'sa',
    type: 'short_answer',
    points: 3,
    prompt: 'Explain',
    modelAnswer: 'Because.',
    rubric: 'Full credit for because.',
    explanation: 'It is so.',
    tags: ['search'],
    extraCredit: true,
    table: { headers: ['x', 'y'], rows: [['1', '2']] },
  },
]

describe('validateExamFile', () => {
  it('accepts the seed exam', () => {
    const result = validateExamFile(seed)
    expect(result.ok).toBe(true)
  })

  it('accepts one valid question of every type', () => {
    const result = validateExamFile(examWith(validQuestions))
    expect(result).toEqual({ ok: true, exam: examWith(validQuestions) })
  })

  it('rejects things that are not objects', () => {
    expect(validateExamFile(null)).toEqual({ ok: false, errors: ['the exam must be a json object'] })
    expect(validateExamFile([])).toEqual({ ok: false, errors: ['the exam must be a json object'] })
  })

  it('checks the top level fields', () => {
    const result = validateExamFile({ schemaVersion: 2, course: '', title: 5, timeLimitMinutes: 0, sections: [], extra: 1 })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors).toEqual([
        'extra is not a known field',
        'schemaVersion must be 1',
        'course must be a non-empty string',
        'title must be a non-empty string',
        'timeLimitMinutes must be a number greater than 0',
        'sections must be a non-empty array',
      ])
    }
  })

  it('reports paths into sections and questions', () => {
    const exam = {
      schemaVersion: 1,
      course: 'CS 510',
      title: 'Test',
      sections: [
        { title: 'Ok', questions: [validQuestions[0]] },
        { title: '', questions: [] },
        { title: 'Bad', questions: [validQuestions[0], { ...validQuestions[1], id: 'mc', answer: 'z' }] },
      ],
    }
    const result = validateExamFile(exam)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors).toEqual([
        'sections[1].title must be a non-empty string',
        'sections[1].questions must be a non-empty array',
        'sections[2].questions[0].id "tf" is used by another question',
        'sections[2].questions[1].answer must be one of the option keys',
      ])
    }
  })

  it('checks the common question fields', () => {
    const errors = errorsFor({
      id: '',
      type: 'true_false',
      points: 0,
      prompt: ' ',
      answer: true,
      explanation: 4,
      rubric: false,
      tags: ['ok', ''],
      extraCredit: 'yes',
      table: { headers: ['a', 'b'], rows: [['1']] },
      bogus: true,
    })
    expect(errors).toEqual([
      'sections[0].questions[0].id must be a non-empty string',
      'sections[0].questions[0].points must be a number greater than 0',
      'sections[0].questions[0].prompt must be a non-empty string',
      'sections[0].questions[0].explanation must be a string',
      'sections[0].questions[0].rubric must be a string',
      'sections[0].questions[0].extraCredit must be true or false',
      'sections[0].questions[0].tags[1] must be a non-empty string',
      'sections[0].questions[0].table.rows[0] must have 2 cells to match the headers',
      'sections[0].questions[0].bogus is not a known field',
    ])
  })

  it('rejects unknown question types', () => {
    const errors = errorsFor({ id: 'x', type: 'essay', points: 1, prompt: 'Hi' })
    expect(errors).toEqual([
      'sections[0].questions[0].type must be one of: true_false, multiple_choice, multi_select, matching, multi_match, fill_blank, numeric, ordering, short_answer',
    ])
  })

  it('rejects fields that belong to another type', () => {
    const errors = errorsFor({ ...validQuestions[0], options })
    expect(errors).toEqual(['sections[0].questions[0].options is not a known field'])
  })

  it('checks true_false', () => {
    const errors = errorsFor({ ...validQuestions[0], answer: 'true' })
    expect(errors).toEqual(['sections[0].questions[0].answer must be true or false'])
  })

  it('checks multiple_choice', () => {
    const errors = errorsFor({
      ...validQuestions[1],
      options: [
        { key: 'a', text: 'A' },
        { key: 'a', text: '' },
      ],
      answer: 'b',
    })
    expect(errors).toEqual([
      'sections[0].questions[0].options[1].text must be a non-empty string',
      'sections[0].questions[0].options keys has "a" more than once',
      'sections[0].questions[0].answer must be one of the option keys',
    ])
    expect(errorsFor({ ...validQuestions[1], options: [] })).toContain(
      'sections[0].questions[0].options must be a non-empty array',
    )
  })

  it('checks multi_select', () => {
    expect(errorsFor({ ...validQuestions[2], answers: [] })).toEqual([
      'sections[0].questions[0].answers must have at least 1 key',
    ])
    expect(errorsFor({ ...validQuestions[2], answers: ['a', 'a', 'q'] })).toEqual([
      'sections[0].questions[0].answers[2] must be one of the option keys',
      'sections[0].questions[0].answers has "a" more than once',
    ])
  })

  it('checks matching', () => {
    const errors = errorsFor({
      ...validQuestions[3],
      rows: [{ label: '', answer: 'x' }, 'row', { label: 'ok', answers: ['a'] }],
    })
    expect(errors).toEqual([
      'sections[0].questions[0].rows[0].label must be a non-empty string',
      'sections[0].questions[0].rows[1] must be an object',
      'sections[0].questions[0].rows[0].answer must be one of the option keys',
      'sections[0].questions[0].rows[2].answers is not a known field',
      'sections[0].questions[0].rows[2].answer must be one of the option keys',
    ])
  })

  it('checks multi_match', () => {
    const errors = errorsFor({
      ...validQuestions[4],
      rows: [
        { label: 'one', answers: ['z'] },
        { label: 'two', answers: 'a' },
      ],
    })
    expect(errors).toEqual([
      'sections[0].questions[0].rows[0].answers[0] must be one of the option keys',
      'sections[0].questions[0].rows[1].answers must be an array of option keys',
    ])
  })

  it('checks fill_blank', () => {
    expect(errorsFor({ ...validQuestions[5], acceptedAnswers: [], caseSensitive: 1 })).toEqual([
      'sections[0].questions[0].acceptedAnswers must have at least 1 item',
      'sections[0].questions[0].caseSensitive must be true or false',
    ])
  })

  it('checks numeric', () => {
    expect(errorsFor({ ...validQuestions[6], answer: '3', tolerance: -1, unit: 2 })).toEqual([
      'sections[0].questions[0].answer must be a number',
      'sections[0].questions[0].tolerance must be a number that is 0 or more',
      'sections[0].questions[0].unit must be a string',
    ])
  })

  it('checks ordering', () => {
    expect(errorsFor({ ...validQuestions[7], items: ['only'] })).toEqual([
      'sections[0].questions[0].items must have at least 2 items',
    ])
    expect(errorsFor({ ...validQuestions[7], items: ['same', 'same'] })).toEqual([
      'sections[0].questions[0].items has "same" more than once',
    ])
  })

  it('checks short_answer', () => {
    expect(errorsFor({ ...validQuestions[8], modelAnswer: '' })).toEqual([
      'sections[0].questions[0].modelAnswer must be a non-empty string',
    ])
  })
})

describe('parseExamJson', () => {
  it('reports bad json', () => {
    const result = parseExamJson('{ nope')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors[0]).toMatch(/^not valid json: /)
    }
  })

  it('parses and validates good json', () => {
    const result = parseExamJson(JSON.stringify(examWith(validQuestions)))
    expect(result.ok).toBe(true)
  })
})
