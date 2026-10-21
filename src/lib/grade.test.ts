import { describe, expect, it } from 'vitest'
import type {
  FillBlankQuestion,
  MatchingQuestion,
  MultiMatchQuestion,
  MultipleChoiceQuestion,
  MultiSelectQuestion,
  NumericQuestion,
  OrderingQuestion,
  Section,
  ShortAnswerQuestion,
  TrueFalseQuestion,
} from '../types'
import {
  formatPercent,
  formatPoints,
  gradeFillBlank,
  gradeMatching,
  gradeMultiMatch,
  gradeMultipleChoice,
  gradeMultiSelect,
  gradeNumeric,
  gradeOrdering,
  gradeQuestion,
  gradeShortAnswer,
  gradeTrueFalse,
  isAnswered,
  scoreSections,
  summarizeScore,
} from './grade'

const options = [
  { key: 'a', text: 'Alpha' },
  { key: 'b', text: 'Beta' },
  { key: 'c', text: 'Gamma' },
  { key: 'd', text: 'Delta' },
]

const trueFalse: TrueFalseQuestion = { id: 'tf', type: 'true_false', points: 1, prompt: 'p', answer: false }
const multipleChoice: MultipleChoiceQuestion = {
  id: 'mc',
  type: 'multiple_choice',
  points: 2,
  prompt: 'p',
  options,
  answer: 'c',
}
const multiSelect: MultiSelectQuestion = {
  id: 'ms',
  type: 'multi_select',
  points: 4,
  prompt: 'p',
  options,
  answers: ['a', 'b'],
}
const matching: MatchingQuestion = {
  id: 'ma',
  type: 'matching',
  points: 3,
  prompt: 'p',
  options,
  rows: [
    { label: 'one', answer: 'a' },
    { label: 'two', answer: 'b' },
    { label: 'three', answer: 'c' },
  ],
}
const multiMatch: MultiMatchQuestion = {
  id: 'mm',
  type: 'multi_match',
  points: 2,
  prompt: 'p',
  options,
  rows: [
    { label: 'one', answers: ['a', 'c'] },
    { label: 'two', answers: [] },
  ],
}
const fillBlank: FillBlankQuestion = {
  id: 'fb',
  type: 'fill_blank',
  points: 1,
  prompt: 'p',
  acceptedAnswers: ['Queue', 'FIFO queue'],
}
const numeric: NumericQuestion = { id: 'nu', type: 'numeric', points: 1, prompt: 'p', answer: 3.14, tolerance: 0.01 }
const ordering: OrderingQuestion = { id: 'or', type: 'ordering', points: 2, prompt: 'p', items: ['x', 'y', 'z'] }
const shortAnswer: ShortAnswerQuestion = { id: 'sa', type: 'short_answer', points: 3, prompt: 'p', modelAnswer: 'm' }

describe('gradeTrueFalse', () => {
  it('gives full points only for the right answer', () => {
    expect(gradeTrueFalse(trueFalse, false)).toBe(1)
    expect(gradeTrueFalse(trueFalse, true)).toBe(0)
    expect(gradeTrueFalse(trueFalse, undefined)).toBe(0)
  })
})

describe('gradeMultipleChoice', () => {
  it('gives full points only for the right key', () => {
    expect(gradeMultipleChoice(multipleChoice, 'c')).toBe(2)
    expect(gradeMultipleChoice(multipleChoice, 'a')).toBe(0)
    expect(gradeMultipleChoice(multipleChoice, undefined)).toBe(0)
  })
})

describe('gradeMultiSelect', () => {
  it('gives full points for the exact set', () => {
    expect(gradeMultiSelect(multiSelect, ['a', 'b'])).toBe(4)
    expect(gradeMultiSelect(multiSelect, ['b', 'a'])).toBe(4)
  })

  it('gives partial credit per correct pick', () => {
    expect(gradeMultiSelect(multiSelect, ['a'])).toBe(2)
  })

  it('takes points away for wrong picks', () => {
    expect(gradeMultiSelect(multiSelect, ['a', 'b', 'c'])).toBe(2)
  })

  it('never goes below 0', () => {
    expect(gradeMultiSelect(multiSelect, ['a', 'c', 'd'])).toBe(0)
    expect(gradeMultiSelect(multiSelect, ['c', 'd'])).toBe(0)
    expect(gradeMultiSelect(multiSelect, [])).toBe(0)
    expect(gradeMultiSelect(multiSelect, undefined)).toBe(0)
  })
})

describe('gradeMatching', () => {
  it('gives credit per correct row', () => {
    expect(gradeMatching(matching, ['a', 'b', 'c'])).toBe(3)
    expect(gradeMatching(matching, ['a', 'c', 'b'])).toBe(1)
    expect(gradeMatching(matching, ['a', 'b', ''])).toBe(2)
    expect(gradeMatching(matching, ['d', 'd', 'd'])).toBe(0)
    expect(gradeMatching(matching, undefined)).toBe(0)
  })
})

describe('gradeMultiMatch', () => {
  it('counts a row only when the set matches exactly', () => {
    expect(gradeMultiMatch(multiMatch, [['c', 'a'], []])).toBe(2)
    expect(gradeMultiMatch(multiMatch, [['a'], []])).toBe(1)
    expect(gradeMultiMatch(multiMatch, [['a', 'c', 'd'], []])).toBe(1)
    expect(gradeMultiMatch(multiMatch, [['a', 'c'], ['b']])).toBe(1)
    expect(gradeMultiMatch(multiMatch, [['b'], ['a']])).toBe(0)
  })

  it('treats a missing row as none picked', () => {
    expect(gradeMultiMatch(multiMatch, [['a', 'c']])).toBe(2)
    expect(gradeMultiMatch(multiMatch, undefined)).toBe(0)
  })
})

describe('gradeFillBlank', () => {
  it('trims and ignores case by default', () => {
    expect(gradeFillBlank(fillBlank, '  queue ')).toBe(1)
    expect(gradeFillBlank(fillBlank, 'fifo QUEUE')).toBe(1)
    expect(gradeFillBlank(fillBlank, 'stack')).toBe(0)
    expect(gradeFillBlank(fillBlank, undefined)).toBe(0)
  })

  it('respects caseSensitive', () => {
    const strict: FillBlankQuestion = { ...fillBlank, caseSensitive: true }
    expect(gradeFillBlank(strict, 'Queue')).toBe(1)
    expect(gradeFillBlank(strict, ' Queue ')).toBe(1)
    expect(gradeFillBlank(strict, 'queue')).toBe(0)
  })
})

describe('gradeNumeric', () => {
  it('accepts answers inside the tolerance', () => {
    expect(gradeNumeric(numeric, '3.14')).toBe(1)
    expect(gradeNumeric(numeric, '3.15')).toBe(1)
    expect(gradeNumeric(numeric, ' 3.13 ')).toBe(1)
    expect(gradeNumeric(numeric, '3.16')).toBe(0)
  })

  it('needs an exact match with no tolerance', () => {
    const exact: NumericQuestion = { ...numeric, answer: 0.3, tolerance: undefined }
    expect(gradeNumeric(exact, '0.3')).toBe(1)
    expect(gradeNumeric(exact, '0.31')).toBe(0)
  })

  it('handles commas and bad input', () => {
    const big: NumericQuestion = { ...numeric, answer: 2000, tolerance: 0 }
    expect(gradeNumeric(big, '2,000')).toBe(1)
    expect(gradeNumeric(numeric, 'pi')).toBe(0)
    expect(gradeNumeric(numeric, '')).toBe(0)
    expect(gradeNumeric(numeric, undefined)).toBe(0)
  })
})

describe('gradeOrdering', () => {
  it('needs every item in place', () => {
    expect(gradeOrdering(ordering, ['x', 'y', 'z'])).toBe(2)
    expect(gradeOrdering(ordering, ['x', 'z', 'y'])).toBe(0)
    expect(gradeOrdering(ordering, ['x', 'y'])).toBe(0)
    expect(gradeOrdering(ordering, undefined)).toBe(0)
  })
})

describe('gradeShortAnswer', () => {
  it('uses the self score', () => {
    expect(gradeShortAnswer(shortAnswer, 'full')).toBe(3)
    expect(gradeShortAnswer(shortAnswer, 'half')).toBe(1.5)
    expect(gradeShortAnswer(shortAnswer, 'none')).toBe(0)
    expect(gradeShortAnswer(shortAnswer, undefined)).toBeNull()
  })
})

describe('gradeQuestion', () => {
  it('marks right, partial, and wrong', () => {
    expect(gradeQuestion(multiSelect, { type: 'multi_select', value: ['a', 'b'] }, undefined)).toEqual({
      earned: 4,
      possible: 4,
      status: 'correct',
    })
    expect(gradeQuestion(multiSelect, { type: 'multi_select', value: ['a'] }, undefined)).toEqual({
      earned: 2,
      possible: 4,
      status: 'partial',
    })
    expect(gradeQuestion(multiSelect, undefined, undefined)).toEqual({ earned: 0, possible: 4, status: 'wrong' })
  })

  it('marks short answers ungraded until self-scored', () => {
    const answer = { type: 'short_answer' as const, value: 'my answer' }
    expect(gradeQuestion(shortAnswer, answer, undefined).status).toBe('ungraded')
    expect(gradeQuestion(shortAnswer, answer, 'half').status).toBe('partial')
  })

  it('ignores an answer saved for a different type', () => {
    expect(gradeQuestion(trueFalse, { type: 'fill_blank', value: 'false' }, undefined).status).toBe('wrong')
  })
})

describe('isAnswered', () => {
  it('treats blank text and empty picks as unanswered', () => {
    expect(isAnswered(fillBlank, undefined)).toBe(false)
    expect(isAnswered(fillBlank, { type: 'fill_blank', value: '  ' })).toBe(false)
    expect(isAnswered(fillBlank, { type: 'fill_blank', value: 'q' })).toBe(true)
    expect(isAnswered(multiSelect, { type: 'multi_select', value: [] })).toBe(false)
    expect(isAnswered(matching, { type: 'matching', value: ['', '', ''] })).toBe(false)
    expect(isAnswered(matching, { type: 'matching', value: ['a', '', ''] })).toBe(true)
    expect(isAnswered(trueFalse, { type: 'true_false', value: false })).toBe(true)
  })
})

describe('scoring a whole attempt', () => {
  const sections: Section[] = [
    { title: 'One', questions: [trueFalse, multiSelect] },
    { title: 'Two', questions: [shortAnswer, { ...ordering, extraCredit: true }] },
  ]
  const answers = {
    tf: { type: 'true_false' as const, value: false },
    ms: { type: 'multi_select' as const, value: ['a'] },
    sa: { type: 'short_answer' as const, value: 'text' },
    or: { type: 'ordering' as const, value: ['x', 'y', 'z'] },
  }

  it('scores each section with extra credit apart', () => {
    expect(scoreSections(sections, answers, {})).toEqual([
      { title: 'One', earned: 3, possible: 5, extraEarned: 0, extraPossible: 0 },
      { title: 'Two', earned: 0, possible: 3, extraEarned: 2, extraPossible: 2 },
    ])
  })

  it('summarizes the total and counts ungraded short answers', () => {
    expect(summarizeScore(sections, answers, {})).toEqual({
      earned: 3,
      possible: 8,
      extraEarned: 2,
      extraPossible: 2,
      percent: 37.5,
      ungradedCount: 1,
    })
    const scored = summarizeScore(sections, answers, { sa: 'full' })
    expect(scored.earned).toBe(6)
    expect(scored.percent).toBe(75)
    expect(scored.ungradedCount).toBe(0)
  })
})

describe('formatting', () => {
  it('rounds points and percents', () => {
    expect(formatPoints(4 / 3)).toBe('1.33')
    expect(formatPoints(2)).toBe('2')
    expect(formatPercent(66.666)).toBe('66.7%')
  })
})
