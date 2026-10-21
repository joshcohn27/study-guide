import type { ExamFile, OptionItem, Question, QuestionBase, QuestionType, Section } from '../types'

export const TYPE_LABELS: Record<QuestionType, string> = {
  true_false: 'True or false',
  multiple_choice: 'Multiple choice',
  multi_select: 'Multi-select',
  matching: 'Matching',
  multi_match: 'Multi-match',
  fill_blank: 'Fill in the blank',
  numeric: 'Numeric',
  ordering: 'Ordering',
  short_answer: 'Short answer',
}

export function emptyExamFile(): ExamFile {
  return {
    schemaVersion: 1,
    course: '',
    title: '',
    sections: [{ title: 'Section 1', questions: [] }],
  }
}

function usedIds(sections: Section[]): string[] {
  const ids: string[] = []
  for (const section of sections) {
    for (const q of section.questions) {
      ids.push(q.id)
    }
  }
  return ids
}

// next free id like "q7"
export function nextQuestionId(sections: Section[]): string {
  const ids = usedIds(sections)
  let n = ids.length + 1
  while (ids.includes(`q${n}`)) {
    n += 1
  }
  return `q${n}`
}

// next free key: a to z, then a2, b2, and so on
export function nextOptionKey(options: OptionItem[]): string {
  const keys = options.map((option) => option.key)
  const letters = 'abcdefghijklmnopqrstuvwxyz'
  let round = 1
  while (round < 100) {
    for (const letter of letters) {
      let key = letter
      if (round > 1) {
        key = `${letter}${round}`
      }
      if (!keys.includes(key)) {
        return key
      }
    }
    round += 1
  }
  return `option${keys.length + 1}`
}

function starterOptions(): OptionItem[] {
  return [
    { key: 'a', text: '' },
    { key: 'b', text: '' },
  ]
}

function baseOf(q: Question): QuestionBase {
  return {
    id: q.id,
    points: q.points,
    prompt: q.prompt,
    explanation: q.explanation,
    rubric: q.rubric,
    tags: q.tags,
    extraCredit: q.extraCredit,
    table: q.table,
  }
}

function optionsOf(q: Question): OptionItem[] | null {
  if (q.type === 'multiple_choice') {
    return q.options
  }
  if (q.type === 'multi_select') {
    return q.options
  }
  if (q.type === 'matching') {
    return q.options
  }
  if (q.type === 'multi_match') {
    return q.options
  }
  return null
}

function buildQuestion(type: QuestionType, base: QuestionBase, options: OptionItem[]): Question {
  switch (type) {
    case 'true_false':
      return { ...base, type, answer: true }
    case 'multiple_choice':
      return { ...base, type, options, answer: '' }
    case 'multi_select':
      return { ...base, type, options, answers: [] }
    case 'matching':
      return { ...base, type, options, rows: [{ label: '', answer: '' }] }
    case 'multi_match':
      return { ...base, type, options, rows: [{ label: '', answers: [] }] }
    case 'fill_blank':
      return { ...base, type, acceptedAnswers: [] }
    case 'numeric':
      return { ...base, type, answer: 0 }
    case 'ordering':
      return { ...base, type, items: [] }
    case 'short_answer':
      return { ...base, type, modelAnswer: '' }
  }
}

export function newQuestion(type: QuestionType, id: string): Question {
  const base: QuestionBase = { id, points: 1, prompt: '' }
  return buildQuestion(type, base, starterOptions())
}

// switches type but keeps the prompt, points, and other shared fields, plus options when both use them
export function changeQuestionType(q: Question, type: QuestionType): Question {
  if (q.type === type) {
    return q
  }
  const options = optionsOf(q) ?? starterOptions()
  return buildQuestion(type, baseOf(q), options)
}

// sets new options and drops any answers that point at removed keys
export function withOptions(q: Question, options: OptionItem[]): Question {
  const keys = options.map((option) => option.key)
  if (q.type === 'multiple_choice') {
    let answer = q.answer
    if (!keys.includes(answer)) {
      answer = ''
    }
    return { ...q, options, answer }
  }
  if (q.type === 'multi_select') {
    return { ...q, options, answers: q.answers.filter((key) => keys.includes(key)) }
  }
  if (q.type === 'matching') {
    const rows = q.rows.map((row) => {
      if (keys.includes(row.answer)) {
        return row
      }
      return { ...row, answer: '' }
    })
    return { ...q, options, rows }
  }
  if (q.type === 'multi_match') {
    const rows = q.rows.map((row) => ({ ...row, answers: row.answers.filter((key) => keys.includes(key)) }))
    return { ...q, options, rows }
  }
  return q
}

export function duplicateQuestion(q: Question, sections: Section[]): Question {
  const copy = JSON.parse(JSON.stringify(q)) as Question
  copy.id = nextQuestionId(sections)
  return copy
}

// how many questions come before each section, for numbering
export function questionOffsets(sections: Section[]): number[] {
  const offsets: number[] = []
  let count = 0
  for (const section of sections) {
    offsets.push(count)
    count += section.questions.length
  }
  return offsets
}

export function moveItem<T>(list: T[], index: number, delta: number): T[] {
  const target = index + delta
  if (target < 0 || target >= list.length) {
    return list
  }
  const next = list.slice()
  next[index] = list[target]
  next[target] = list[index]
  return next
}

function isBlank(value: string | undefined): boolean {
  if (value === undefined) {
    return false
  }
  return value.trim() === ''
}

// drops empty optional fields so the saved json matches what you'd write by hand
function cleanQuestion(q: Question): Question {
  const copy = { ...q }
  if (isBlank(copy.explanation)) {
    delete copy.explanation
  }
  if (isBlank(copy.rubric)) {
    delete copy.rubric
  }
  if (copy.tags !== undefined && copy.tags.length === 0) {
    delete copy.tags
  }
  if (copy.extraCredit === false) {
    delete copy.extraCredit
  }
  if (copy.type === 'fill_blank' && copy.caseSensitive === false) {
    delete copy.caseSensitive
  }
  if (copy.type === 'numeric' && isBlank(copy.unit)) {
    delete copy.unit
  }
  return copy
}

export function cleanExamFile(file: ExamFile): ExamFile {
  const cleaned: ExamFile = {
    schemaVersion: 1,
    course: file.course.trim(),
    title: file.title.trim(),
    sections: file.sections.map((section) => ({
      title: section.title,
      questions: section.questions.map(cleanQuestion),
    })),
  }
  if (file.timeLimitMinutes !== undefined) {
    cleaned.timeLimitMinutes = file.timeLimitMinutes
  }
  // json round trip removes any fields left as undefined
  return JSON.parse(JSON.stringify(cleaned)) as ExamFile
}
