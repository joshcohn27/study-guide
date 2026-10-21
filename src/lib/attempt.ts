import type { Answer, Attempt, AttemptMode, Exam, Question, Section } from '../types'
import { gradeQuestion, summarizeScore } from './grade'
import { newId } from './storage'

export type StartSettings = {
  mode: AttemptMode
  shuffleQuestions: boolean
  shuffleOptions: boolean
  // only retry the questions missed in this attempt
  retryFrom: Attempt | null
}

export function shuffle<T>(items: T[]): T[] {
  const copy = items.slice()
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = copy[i]
    copy[i] = copy[j]
    copy[j] = temp
  }
  return copy
}

// shuffles a list, trying a few times so it doesn't come back already in order
function shuffleAway<T>(items: T[]): T[] {
  let result = shuffle(items)
  for (let tries = 0; tries < 5; tries++) {
    const unchanged = result.every((item, index) => item === items[index])
    if (!unchanged) {
      return result
    }
    result = shuffle(items)
  }
  return result
}

function shuffleQuestionOptions(q: Question): Question {
  if (q.type === 'multiple_choice') {
    return { ...q, options: shuffle(q.options) }
  }
  if (q.type === 'multi_select') {
    return { ...q, options: shuffle(q.options) }
  }
  if (q.type === 'matching') {
    return { ...q, options: shuffle(q.options) }
  }
  if (q.type === 'multi_match') {
    return { ...q, options: shuffle(q.options) }
  }
  return q
}

export function allQuestions(sections: Section[]): Question[] {
  const result: Question[] = []
  for (const section of sections) {
    for (const q of section.questions) {
      result.push(q)
    }
  }
  return result
}

// question number shown to the user, counted across all sections
export function questionNumbers(sections: Section[]): Record<string, number> {
  const numbers: Record<string, number> = {}
  let count = 0
  for (const q of allQuestions(sections)) {
    count += 1
    numbers[q.id] = count
  }
  return numbers
}

// ids of questions that weren't fully right in a finished attempt
export function missedQuestionIds(attempt: Attempt): string[] {
  const missed: string[] = []
  for (const q of allQuestions(attempt.sections)) {
    const result = gradeQuestion(q, attempt.answers[q.id], attempt.selfScores[q.id])
    if (result.status !== 'correct') {
      missed.push(q.id)
    }
  }
  return missed
}

export function buildAttempt(exam: Exam, settings: StartSettings): Attempt {
  let onlyIds: string[] | null = null
  if (settings.retryFrom) {
    onlyIds = missedQuestionIds(settings.retryFrom)
  }

  const sections: Section[] = []
  for (const section of exam.sections) {
    let questions = section.questions
    if (onlyIds) {
      const ids = onlyIds
      questions = questions.filter((q) => ids.includes(q.id))
    }
    if (questions.length === 0) {
      continue
    }
    if (settings.shuffleQuestions) {
      questions = shuffle(questions)
    }
    if (settings.shuffleOptions) {
      questions = questions.map(shuffleQuestionOptions)
    }
    sections.push({ title: section.title, questions })
  }

  // ordering questions always start shuffled
  const orderingStart: Record<string, string[]> = {}
  for (const q of allQuestions(sections)) {
    if (q.type === 'ordering') {
      orderingStart[q.id] = shuffleAway(q.items)
    }
  }

  let timeLimitMinutes: number | null = null
  if (settings.mode === 'exam' && exam.timeLimitMinutes !== undefined) {
    timeLimitMinutes = exam.timeLimitMinutes
  }

  let retryOfAttemptId: string | null = null
  if (settings.retryFrom) {
    retryOfAttemptId = settings.retryFrom.id
  }

  return {
    id: newId(),
    examId: exam.id,
    examTitle: exam.title,
    mode: settings.mode,
    shuffleQuestions: settings.shuffleQuestions,
    shuffleOptions: settings.shuffleOptions,
    retryOfAttemptId,
    timeLimitMinutes,
    sections,
    orderingStart,
    answers: {},
    selfScores: {},
    checked: [],
    startedAt: new Date().toISOString(),
    endedAt: null,
    elapsedMs: 0,
    runningSince: Date.now(),
    score: null,
  }
}

export function timeUsedMs(attempt: Attempt, now: number): number {
  if (attempt.runningSince === null) {
    return attempt.elapsedMs
  }
  // now can lag a tick behind a resume, so never count negative time
  const running = Math.max(0, now - attempt.runningSince)
  return attempt.elapsedMs + running
}

// null when there's no time limit
export function timeLeftMs(attempt: Attempt, now: number): number | null {
  if (attempt.timeLimitMinutes === null) {
    return null
  }
  const left = attempt.timeLimitMinutes * 60000 - timeUsedMs(attempt, now)
  return Math.max(0, left)
}

export function pauseClock(attempt: Attempt, now: number): Attempt {
  if (attempt.runningSince === null) {
    return attempt
  }
  return { ...attempt, elapsedMs: timeUsedMs(attempt, now), runningSince: null }
}

export function resumeClock(attempt: Attempt, now: number): Attempt {
  if (attempt.runningSince !== null) {
    return attempt
  }
  return { ...attempt, runningSince: now }
}

export function setAnswer(attempt: Attempt, questionId: string, answer: Answer): Attempt {
  return { ...attempt, answers: { ...attempt.answers, [questionId]: answer } }
}

export function setSelfScore(attempt: Attempt, questionId: string, points: number): Attempt {
  const selfScores = { ...attempt.selfScores, [questionId]: points }
  const next = { ...attempt, selfScores }
  if (next.endedAt !== null) {
    next.score = summarizeScore(next.sections, next.answers, selfScores)
  }
  return next
}

// an untouched ordering question counts as the order it was shown in
function withOrderingDefault(attempt: Attempt, q: Question): Attempt {
  if (q.type !== 'ordering') {
    return attempt
  }
  if (attempt.answers[q.id]) {
    return attempt
  }
  const start = attempt.orderingStart[q.id] ?? q.items
  return setAnswer(attempt, q.id, { type: 'ordering', value: start })
}

export function checkQuestion(attempt: Attempt, q: Question): Attempt {
  const next = withOrderingDefault(attempt, q)
  if (next.checked.includes(q.id)) {
    return next
  }
  return { ...next, checked: next.checked.concat(q.id) }
}

export function finishAttempt(attempt: Attempt, now: number): Attempt {
  let next = pauseClock(attempt, now)
  for (const q of allQuestions(next.sections)) {
    next = withOrderingDefault(next, q)
  }
  next = { ...next, endedAt: new Date(now).toISOString() }
  next.score = summarizeScore(next.sections, next.answers, next.selfScores)
  return next
}
