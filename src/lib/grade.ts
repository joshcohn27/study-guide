import type {
  Answer,
  AnswerFor,
  FillBlankQuestion,
  MatchingQuestion,
  MultiMatchQuestion,
  MultipleChoiceQuestion,
  MultiSelectQuestion,
  NumericQuestion,
  OrderingQuestion,
  Question,
  QuestionType,
  ScoreSummary,
  Section,
  SelfScore,
  ShortAnswerQuestion,
  TrueFalseQuestion,
} from '../types'

export type QuestionStatus = 'correct' | 'partial' | 'wrong' | 'ungraded'

export type QuestionResult = {
  earned: number
  possible: number
  status: QuestionStatus
}

export type SectionScore = {
  title: string
  earned: number
  possible: number
  extraEarned: number
  extraPossible: number
}

// small slack so float math like 0.1 + 0.2 still counts as exact
const EPSILON = 1e-9

export function gradeTrueFalse(q: TrueFalseQuestion, value: boolean | undefined): number {
  if (value === q.answer) {
    return q.points
  }
  return 0
}

export function gradeMultipleChoice(q: MultipleChoiceQuestion, value: string | undefined): number {
  if (value === q.answer) {
    return q.points
  }
  return 0
}

// each correct pick adds a share, each wrong pick takes one away, never below 0
export function gradeMultiSelect(q: MultiSelectQuestion, value: string[] | undefined): number {
  if (!value) {
    return 0
  }
  const share = q.points / q.answers.length
  let earned = 0
  for (const key of value) {
    if (q.answers.includes(key)) {
      earned += share
    } else {
      earned -= share
    }
  }
  return Math.max(0, earned)
}

export function gradeMatching(q: MatchingQuestion, value: string[] | undefined): number {
  if (!value) {
    return 0
  }
  let correctRows = 0
  q.rows.forEach((row, index) => {
    if (value[index] === row.answer) {
      correctRows += 1
    }
  })
  return (q.points * correctRows) / q.rows.length
}

function sameKeys(a: string[], b: string[]): boolean {
  if (a.length !== b.length) {
    return false
  }
  return a.every((key) => b.includes(key))
}

// a row only counts when its picked set matches exactly
export function gradeMultiMatch(q: MultiMatchQuestion, value: string[][] | undefined): number {
  if (!value) {
    return 0
  }
  let correctRows = 0
  q.rows.forEach((row, index) => {
    const picked = value[index] ?? []
    if (sameKeys(picked, row.answers)) {
      correctRows += 1
    }
  })
  return (q.points * correctRows) / q.rows.length
}

export function gradeFillBlank(q: FillBlankQuestion, value: string | undefined): number {
  if (value === undefined) {
    return 0
  }
  let given = value.trim()
  if (!q.caseSensitive) {
    given = given.toLowerCase()
  }
  for (const accepted of q.acceptedAnswers) {
    let target = accepted.trim()
    if (!q.caseSensitive) {
      target = target.toLowerCase()
    }
    if (given === target) {
      return q.points
    }
  }
  return 0
}

export function parseNumber(text: string): number | null {
  const cleaned = text.trim().replaceAll(',', '')
  if (cleaned === '') {
    return null
  }
  const parsed = Number(cleaned)
  if (!Number.isFinite(parsed)) {
    return null
  }
  return parsed
}

export function gradeNumeric(q: NumericQuestion, value: string | undefined): number {
  if (value === undefined) {
    return 0
  }
  const given = parseNumber(value)
  if (given === null) {
    return 0
  }
  const tolerance = q.tolerance ?? 0
  if (Math.abs(given - q.answer) <= tolerance + EPSILON) {
    return q.points
  }
  return 0
}

export function gradeOrdering(q: OrderingQuestion, value: string[] | undefined): number {
  if (!value) {
    return 0
  }
  if (value.length !== q.items.length) {
    return 0
  }
  const allInPlace = q.items.every((item, index) => value[index] === item)
  if (allInPlace) {
    return q.points
  }
  return 0
}

// null means it hasn't been self-scored yet
export function gradeShortAnswer(q: ShortAnswerQuestion, selfScore: SelfScore | undefined): number | null {
  if (selfScore === 'full') {
    return q.points
  }
  if (selfScore === 'half') {
    return q.points / 2
  }
  if (selfScore === 'none') {
    return 0
  }
  return null
}

export function answerValue<T extends QuestionType>(
  answer: Answer | undefined,
  type: T,
): AnswerFor<T>['value'] | undefined {
  if (!answer) {
    return undefined
  }
  if (answer.type !== type) {
    return undefined
  }
  return (answer as AnswerFor<T>).value
}

function earnedFor(q: Question, answer: Answer | undefined, selfScore: SelfScore | undefined): number | null {
  switch (q.type) {
    case 'true_false':
      return gradeTrueFalse(q, answerValue(answer, 'true_false'))
    case 'multiple_choice':
      return gradeMultipleChoice(q, answerValue(answer, 'multiple_choice'))
    case 'multi_select':
      return gradeMultiSelect(q, answerValue(answer, 'multi_select'))
    case 'matching':
      return gradeMatching(q, answerValue(answer, 'matching'))
    case 'multi_match':
      return gradeMultiMatch(q, answerValue(answer, 'multi_match'))
    case 'fill_blank':
      return gradeFillBlank(q, answerValue(answer, 'fill_blank'))
    case 'numeric':
      return gradeNumeric(q, answerValue(answer, 'numeric'))
    case 'ordering':
      return gradeOrdering(q, answerValue(answer, 'ordering'))
    case 'short_answer':
      return gradeShortAnswer(q, selfScore)
  }
}

export function gradeQuestion(q: Question, answer: Answer | undefined, selfScore: SelfScore | undefined): QuestionResult {
  const earned = earnedFor(q, answer, selfScore)
  if (earned === null) {
    return { earned: 0, possible: q.points, status: 'ungraded' }
  }
  let status: QuestionStatus = 'partial'
  if (earned >= q.points - EPSILON) {
    status = 'correct'
  } else if (earned <= EPSILON) {
    status = 'wrong'
  }
  return { earned, possible: q.points, status }
}

export function isAnswered(q: Question, answer: Answer | undefined): boolean {
  if (!answer) {
    return false
  }
  if (answer.type !== q.type) {
    return false
  }
  const value = answer.value
  if (typeof value === 'string') {
    return value.trim() !== ''
  }
  if (answer.type === 'multi_select') {
    return answer.value.length > 0
  }
  if (answer.type === 'matching') {
    return answer.value.some((key) => key !== '')
  }
  return true
}

export function scoreSections(
  sections: Section[],
  answers: Record<string, Answer>,
  selfScores: Record<string, SelfScore>,
): SectionScore[] {
  return sections.map((section) => {
    const score: SectionScore = {
      title: section.title,
      earned: 0,
      possible: 0,
      extraEarned: 0,
      extraPossible: 0,
    }
    for (const q of section.questions) {
      const result = gradeQuestion(q, answers[q.id], selfScores[q.id])
      if (q.extraCredit) {
        score.extraEarned += result.earned
        score.extraPossible += result.possible
      } else {
        score.earned += result.earned
        score.possible += result.possible
      }
    }
    return score
  })
}

export function summarizeScore(
  sections: Section[],
  answers: Record<string, Answer>,
  selfScores: Record<string, SelfScore>,
): ScoreSummary {
  const summary: ScoreSummary = {
    earned: 0,
    possible: 0,
    extraEarned: 0,
    extraPossible: 0,
    percent: 0,
    ungradedCount: 0,
  }
  for (const section of scoreSections(sections, answers, selfScores)) {
    summary.earned += section.earned
    summary.possible += section.possible
    summary.extraEarned += section.extraEarned
    summary.extraPossible += section.extraPossible
  }
  for (const section of sections) {
    for (const q of section.questions) {
      const result = gradeQuestion(q, answers[q.id], selfScores[q.id])
      if (result.status === 'ungraded') {
        summary.ungradedCount += 1
      }
    }
  }
  // percent is regular points only, extra credit is shown on its own
  if (summary.possible > 0) {
    summary.percent = (summary.earned / summary.possible) * 100
  }
  return summary
}

// rounds to at most 2 decimals for display
export function formatPoints(points: number): string {
  const rounded = Math.round(points * 100) / 100
  return String(rounded)
}

export function formatPercent(percent: number): string {
  const rounded = Math.round(percent * 10) / 10
  return `${rounded}%`
}
