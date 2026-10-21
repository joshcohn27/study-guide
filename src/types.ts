// exam file format (what gets imported and exported as json)

export type OptionItem = {
  key: string
  text: string
}

export type QuestionTable = {
  headers: string[]
  rows: string[][]
}

type QuestionBase = {
  id: string
  points: number
  prompt: string
  explanation?: string
  rubric?: string
  tags?: string[]
  extraCredit?: boolean
  table?: QuestionTable
}

export type TrueFalseQuestion = QuestionBase & {
  type: 'true_false'
  answer: boolean
}

export type MultipleChoiceQuestion = QuestionBase & {
  type: 'multiple_choice'
  options: OptionItem[]
  answer: string
}

export type MultiSelectQuestion = QuestionBase & {
  type: 'multi_select'
  options: OptionItem[]
  answers: string[]
}

export type MatchingRow = {
  label: string
  answer: string
}

export type MatchingQuestion = QuestionBase & {
  type: 'matching'
  options: OptionItem[]
  rows: MatchingRow[]
}

export type MultiMatchRow = {
  label: string
  answers: string[]
}

export type MultiMatchQuestion = QuestionBase & {
  type: 'multi_match'
  options: OptionItem[]
  rows: MultiMatchRow[]
}

export type FillBlankQuestion = QuestionBase & {
  type: 'fill_blank'
  acceptedAnswers: string[]
  caseSensitive?: boolean
}

export type NumericQuestion = QuestionBase & {
  type: 'numeric'
  answer: number
  tolerance?: number
  unit?: string
}

export type OrderingQuestion = QuestionBase & {
  type: 'ordering'
  // listed in the correct order
  items: string[]
}

export type ShortAnswerQuestion = QuestionBase & {
  type: 'short_answer'
  modelAnswer: string
}

export type Question =
  | TrueFalseQuestion
  | MultipleChoiceQuestion
  | MultiSelectQuestion
  | MatchingQuestion
  | MultiMatchQuestion
  | FillBlankQuestion
  | NumericQuestion
  | OrderingQuestion
  | ShortAnswerQuestion

export type QuestionType = Question['type']

export type Section = {
  title: string
  questions: Question[]
}

export type ExamFile = {
  schemaVersion: 1
  course: string
  title: string
  timeLimitMinutes?: number
  sections: Section[]
}

// stored app data

export type Course = {
  id: string
  name: string
  code: string
}

export type Exam = {
  id: string
  courseId: string
  title: string
  timeLimitMinutes?: number
  sections: Section[]
  createdAt: string
  updatedAt: string
}

export type Answer =
  | { type: 'true_false'; value: boolean }
  | { type: 'multiple_choice'; value: string }
  | { type: 'multi_select'; value: string[] }
  // one picked key per row, '' means not picked yet
  | { type: 'matching'; value: string[] }
  // one list of keys per row
  | { type: 'multi_match'; value: string[][] }
  | { type: 'fill_blank'; value: string }
  // kept as typed text, parsed when grading
  | { type: 'numeric'; value: string }
  | { type: 'ordering'; value: string[] }
  | { type: 'short_answer'; value: string }

export type AnswerFor<T extends QuestionType> = Extract<Answer, { type: T }>

export type SelfScore = 'full' | 'half' | 'none'

export type AttemptMode = 'exam' | 'practice'

export type ScoreSummary = {
  earned: number
  possible: number
  extraEarned: number
  extraPossible: number
  percent: number
  ungradedCount: number
}

export type Attempt = {
  id: string
  examId: string
  examTitle: string
  mode: AttemptMode
  shuffleQuestions: boolean
  shuffleOptions: boolean
  // set when this attempt only retries the misses from another attempt
  retryOfAttemptId: string | null
  timeLimitMinutes: number | null
  // a frozen copy of the questions, in the order they were shown
  sections: Section[]
  // the shuffled order each ordering question started in
  orderingStart: Record<string, string[]>
  answers: Record<string, Answer>
  selfScores: Record<string, SelfScore>
  // questions revealed one at a time in practice mode
  checked: string[]
  startedAt: string
  endedAt: string | null
  // time used so far, not counting the stretch since runningSince
  elapsedMs: number
  // epoch ms when the clock last started, null while paused or finished
  runningSince: number | null
  score: ScoreSummary | null
}
