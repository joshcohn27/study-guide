import { describe, expect, it } from 'vitest'
import seed from '../../cs510-midterm-practice.json'
import type { Exam, ExamFile } from '../types'
import {
  allQuestions,
  buildAttempt,
  checkQuestion,
  finishAttempt,
  missedQuestionIds,
  pauseClock,
  questionNumbers,
  resumeClock,
  setAnswer,
  setSelfScore,
  timeLeftMs,
  timeUsedMs,
} from './attempt'

const seedFile = seed as ExamFile

const exam: Exam = {
  id: 'exam1',
  courseId: 'course1',
  title: 'Test',
  timeLimitMinutes: 10,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  sections: [
    {
      title: 'One',
      questions: [
        { id: 'tf', type: 'true_false', points: 1, prompt: 'p', answer: true },
        {
          id: 'mc',
          type: 'multiple_choice',
          points: 1,
          prompt: 'p',
          options: [
            { key: 'a', text: 'A' },
            { key: 'b', text: 'B' },
            { key: 'c', text: 'C' },
          ],
          answer: 'a',
        },
      ],
    },
    {
      title: 'Two',
      questions: [
        { id: 'or', type: 'ordering', points: 2, prompt: 'p', items: ['1', '2', '3', '4'] },
        { id: 'sa', type: 'short_answer', points: 4, prompt: 'p', modelAnswer: 'm' },
      ],
    },
  ],
}

const examSettings = { mode: 'exam' as const, shuffleQuestions: false, shuffleOptions: false, retryFrom: null }

describe('buildAttempt', () => {
  it('copies the exam and starts the clock', () => {
    const attempt = buildAttempt(exam, examSettings)
    expect(attempt.examId).toBe('exam1')
    expect(attempt.sections.map((section) => section.title)).toEqual(['One', 'Two'])
    expect(attempt.timeLimitMinutes).toBe(10)
    expect(attempt.runningSince).not.toBeNull()
    expect(attempt.endedAt).toBeNull()
  })

  it('has no time limit in practice mode', () => {
    const attempt = buildAttempt(exam, { ...examSettings, mode: 'practice' })
    expect(attempt.timeLimitMinutes).toBeNull()
  })

  it('always starts ordering questions shuffled', () => {
    const attempt = buildAttempt(exam, examSettings)
    const start = attempt.orderingStart.or
    expect(start.slice().sort()).toEqual(['1', '2', '3', '4'])
    expect(start).not.toEqual(['1', '2', '3', '4'])
  })

  it('keeps the same questions and keys when shuffling', () => {
    const attempt = buildAttempt(exam, { ...examSettings, shuffleQuestions: true, shuffleOptions: true })
    const ids = allQuestions(attempt.sections).map((q) => q.id)
    expect(ids.slice().sort()).toEqual(['mc', 'or', 'sa', 'tf'])
    const mc = allQuestions(attempt.sections).find((q) => q.id === 'mc')
    if (mc && mc.type === 'multiple_choice') {
      expect(mc.options.map((option) => option.key).sort()).toEqual(['a', 'b', 'c'])
      expect(mc.answer).toBe('a')
    }
  })

  it('only includes missed questions when retrying', () => {
    let first = buildAttempt(exam, examSettings)
    first = setAnswer(first, 'tf', { type: 'true_false', value: true })
    first = setAnswer(first, 'mc', { type: 'multiple_choice', value: 'b' })
    first = finishAttempt(first, Date.now())
    first = setSelfScore(first, 'sa', 4)
    // ordering was left as shown, which is never the right order
    expect(missedQuestionIds(first)).toEqual(['mc', 'or'])

    const retry = buildAttempt(exam, { ...examSettings, retryFrom: first })
    expect(retry.retryOfAttemptId).toBe(first.id)
    expect(allQuestions(retry.sections).map((q) => q.id)).toEqual(['mc', 'or'])
  })

  it('works on the seed exam', () => {
    const seedExam: Exam = { ...exam, sections: seedFile.sections }
    const attempt = buildAttempt(seedExam, examSettings)
    expect(allQuestions(attempt.sections)).toHaveLength(19)
  })
})

describe('clock', () => {
  it('counts time only while running', () => {
    let attempt = buildAttempt(exam, examSettings)
    attempt = { ...attempt, runningSince: 1000, elapsedMs: 0 }
    expect(timeUsedMs(attempt, 4000)).toBe(3000)

    attempt = pauseClock(attempt, 4000)
    expect(attempt.runningSince).toBeNull()
    expect(timeUsedMs(attempt, 99000)).toBe(3000)

    attempt = resumeClock(attempt, 10000)
    expect(timeUsedMs(attempt, 12000)).toBe(5000)
  })

  it('never counts negative time right after a resume', () => {
    const attempt = { ...buildAttempt(exam, examSettings), runningSince: 5000, elapsedMs: 2000 }
    expect(timeUsedMs(attempt, 4000)).toBe(2000)
  })

  it('counts down from the time limit and stops at 0', () => {
    const attempt = { ...buildAttempt(exam, examSettings), runningSince: 0, elapsedMs: 0 }
    expect(timeLeftMs(attempt, 60000)).toBe(540000)
    expect(timeLeftMs(attempt, 9999999)).toBe(0)
    expect(timeLeftMs({ ...attempt, timeLimitMinutes: null }, 60000)).toBeNull()
  })
})

describe('checking and finishing', () => {
  it('fills in an untouched ordering question when checked', () => {
    const attempt = buildAttempt(exam, { ...examSettings, mode: 'practice' })
    const ordering = allQuestions(attempt.sections).find((q) => q.id === 'or')
    if (!ordering) {
      throw new Error('missing ordering question')
    }
    const checked = checkQuestion(attempt, ordering)
    expect(checked.checked).toEqual(['or'])
    expect(checked.answers.or).toEqual({ type: 'ordering', value: attempt.orderingStart.or })
  })

  it('stops the clock and stores the score', () => {
    let attempt = buildAttempt(exam, examSettings)
    attempt = setAnswer(attempt, 'tf', { type: 'true_false', value: true })
    attempt = setAnswer(attempt, 'or', { type: 'ordering', value: ['1', '2', '3', '4'] })
    attempt = finishAttempt(attempt, Date.now())
    expect(attempt.endedAt).not.toBeNull()
    expect(attempt.runningSince).toBeNull()
    expect(attempt.score).toEqual({
      earned: 3,
      possible: 8,
      extraEarned: 0,
      extraPossible: 0,
      percent: 37.5,
      ungradedCount: 1,
    })
  })

  it('updates the stored score when self-scoring after finishing', () => {
    let attempt = finishAttempt(buildAttempt(exam, examSettings), Date.now())
    attempt = setSelfScore(attempt, 'sa', 2.5)
    expect(attempt.score?.earned).toBe(2.5)
    expect(attempt.score?.ungradedCount).toBe(0)
  })
})

describe('questionNumbers', () => {
  it('numbers questions across sections', () => {
    expect(questionNumbers(exam.sections)).toEqual({ tf: 1, mc: 2, or: 3, sa: 4 })
  })
})
