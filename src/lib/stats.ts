import type { Attempt } from '../types'
import { allQuestions } from './attempt'
import { gradeQuestion } from './grade'

export type TagStat = {
  tag: string
  questionCount: number
  earned: number
  possible: number
  percent: number
}

// percent of points earned per tag, across every finished attempt.
// short answers that were never self-scored are left out.
export function tagStats(attempts: Attempt[]): TagStat[] {
  const byTag = new Map<string, TagStat>()

  for (const attempt of attempts) {
    if (attempt.endedAt === null) {
      continue
    }
    for (const q of allQuestions(attempt.sections)) {
      if (!q.tags || q.tags.length === 0) {
        continue
      }
      const result = gradeQuestion(q, attempt.answers[q.id], attempt.selfScores[q.id])
      if (result.status === 'ungraded') {
        continue
      }
      for (const tag of q.tags) {
        let stat = byTag.get(tag)
        if (!stat) {
          stat = { tag, questionCount: 0, earned: 0, possible: 0, percent: 0 }
          byTag.set(tag, stat)
        }
        stat.questionCount += 1
        stat.earned += result.earned
        stat.possible += result.possible
      }
    }
  }

  const stats = Array.from(byTag.values())
  for (const stat of stats) {
    if (stat.possible > 0) {
      stat.percent = (stat.earned / stat.possible) * 100
    }
  }
  // weakest topics first
  stats.sort((a, b) => a.percent - b.percent)
  return stats
}
