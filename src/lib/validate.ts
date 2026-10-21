import type { ExamFile, QuestionType } from '../types'

export type ValidationResult =
  | { ok: true; exam: ExamFile }
  | { ok: false; errors: string[] }

export const QUESTION_TYPES: QuestionType[] = [
  'true_false',
  'multiple_choice',
  'multi_select',
  'matching',
  'multi_match',
  'fill_blank',
  'numeric',
  'ordering',
  'short_answer',
]

const TOP_KEYS = ['schemaVersion', 'course', 'title', 'timeLimitMinutes', 'sections']
const SECTION_KEYS = ['title', 'questions']
const COMMON_KEYS = ['id', 'type', 'points', 'prompt', 'explanation', 'rubric', 'tags', 'extraCredit', 'table']

const TYPE_KEYS: Record<QuestionType, string[]> = {
  true_false: ['answer'],
  multiple_choice: ['options', 'answer'],
  multi_select: ['options', 'answers'],
  matching: ['options', 'rows'],
  multi_match: ['options', 'rows'],
  fill_blank: ['acceptedAnswers', 'caseSensitive'],
  numeric: ['answer', 'tolerance', 'unit'],
  ordering: ['items'],
  short_answer: ['modelAnswer'],
}

type Obj = Record<string, unknown>

function isObject(value: unknown): value is Obj {
  if (value === null) {
    return false
  }
  if (Array.isArray(value)) {
    return false
  }
  return typeof value === 'object'
}

function isNonEmptyString(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false
  }
  return value.trim().length > 0
}

function isFiniteNumber(value: unknown): value is number {
  if (typeof value !== 'number') {
    return false
  }
  return Number.isFinite(value)
}

function join(path: string, key: string): string {
  if (path === '') {
    return key
  }
  return `${path}.${key}`
}

function checkUnknownKeys(obj: Obj, allowed: string[], path: string, errors: string[]) {
  for (const key of Object.keys(obj)) {
    if (!allowed.includes(key)) {
      errors.push(`${join(path, key)} is not a known field`)
    }
  }
}

function requireText(obj: Obj, key: string, path: string, errors: string[]) {
  if (!isNonEmptyString(obj[key])) {
    errors.push(`${join(path, key)} must be a non-empty string`)
  }
}

function optionalText(obj: Obj, key: string, path: string, errors: string[]) {
  if (obj[key] === undefined) {
    return
  }
  if (typeof obj[key] !== 'string') {
    errors.push(`${join(path, key)} must be a string`)
  }
}

function optionalBoolean(obj: Obj, key: string, path: string, errors: string[]) {
  if (obj[key] === undefined) {
    return
  }
  if (typeof obj[key] !== 'boolean') {
    errors.push(`${join(path, key)} must be true or false`)
  }
}

// checks a list of non-empty strings, returns the valid ones
function checkStringList(value: unknown, path: string, errors: string[], minLength: number): string[] {
  if (!Array.isArray(value)) {
    errors.push(`${path} must be an array of strings`)
    return []
  }
  if (value.length < minLength) {
    errors.push(`${path} must have at least ${minLength} item${minLength === 1 ? '' : 's'}`)
  }
  const result: string[] = []
  value.forEach((item, index) => {
    if (isNonEmptyString(item)) {
      result.push(item)
    } else {
      errors.push(`${path}[${index}] must be a non-empty string`)
    }
  })
  return result
}

function checkNoDuplicates(values: string[], path: string, errors: string[]) {
  const seen = new Set<string>()
  for (const value of values) {
    if (seen.has(value)) {
      errors.push(`${path} has "${value}" more than once`)
    }
    seen.add(value)
  }
}

function checkTable(value: unknown, path: string, errors: string[]) {
  if (!isObject(value)) {
    errors.push(`${path} must be an object with headers and rows`)
    return
  }
  checkUnknownKeys(value, ['headers', 'rows'], path, errors)
  const headersPath = join(path, 'headers')
  const headers = value.headers
  let headerCount = 0
  if (Array.isArray(headers) && headers.length > 0) {
    headerCount = headers.length
    headers.forEach((header, index) => {
      if (typeof header !== 'string') {
        errors.push(`${headersPath}[${index}] must be a string`)
      }
    })
  } else {
    errors.push(`${headersPath} must be a non-empty array of strings`)
  }
  const rowsPath = join(path, 'rows')
  const rows = value.rows
  if (!Array.isArray(rows)) {
    errors.push(`${rowsPath} must be an array of rows`)
    return
  }
  rows.forEach((row, rowIndex) => {
    const rowPath = `${rowsPath}[${rowIndex}]`
    if (!Array.isArray(row)) {
      errors.push(`${rowPath} must be an array of strings`)
      return
    }
    if (headerCount > 0 && row.length !== headerCount) {
      errors.push(`${rowPath} must have ${headerCount} cells to match the headers`)
    }
    row.forEach((cell, cellIndex) => {
      if (typeof cell !== 'string') {
        errors.push(`${rowPath}[${cellIndex}] must be a string`)
      }
    })
  })
}

// checks the options list, returns the valid keys
function checkOptions(q: Obj, path: string, errors: string[]): string[] {
  const optionsPath = join(path, 'options')
  const options = q.options
  if (!Array.isArray(options) || options.length === 0) {
    errors.push(`${optionsPath} must be a non-empty array`)
    return []
  }
  const keys: string[] = []
  options.forEach((option, index) => {
    const optionPath = `${optionsPath}[${index}]`
    if (!isObject(option)) {
      errors.push(`${optionPath} must be an object with key and text`)
      return
    }
    checkUnknownKeys(option, ['key', 'text'], optionPath, errors)
    if (isNonEmptyString(option.key)) {
      keys.push(option.key)
    } else {
      errors.push(`${optionPath}.key must be a non-empty string`)
    }
    requireText(option, 'text', optionPath, errors)
  })
  checkNoDuplicates(keys, `${optionsPath} keys`, errors)
  return keys
}

function checkKey(value: unknown, keys: string[], path: string, errors: string[]) {
  if (typeof value !== 'string') {
    errors.push(`${path} must be one of the option keys`)
    return
  }
  if (!keys.includes(value)) {
    errors.push(`${path} must be one of the option keys`)
  }
}

function checkKeyList(value: unknown, keys: string[], path: string, errors: string[], minLength: number) {
  if (!Array.isArray(value)) {
    errors.push(`${path} must be an array of option keys`)
    return
  }
  if (value.length < minLength) {
    errors.push(`${path} must have at least ${minLength} key${minLength === 1 ? '' : 's'}`)
  }
  value.forEach((item, index) => {
    checkKey(item, keys, `${path}[${index}]`, errors)
  })
  const strings = value.filter((item) => typeof item === 'string')
  checkNoDuplicates(strings, path, errors)
}

type IndexedRow = {
  row: Obj
  index: number
}

// checks the rows list, returns the object rows with their original index
function checkRows(q: Obj, path: string, errors: string[]): IndexedRow[] {
  const rowsPath = join(path, 'rows')
  const rows = q.rows
  if (!Array.isArray(rows) || rows.length === 0) {
    errors.push(`${rowsPath} must be a non-empty array`)
    return []
  }
  const valid: IndexedRow[] = []
  rows.forEach((row, index) => {
    const rowPath = `${rowsPath}[${index}]`
    if (!isObject(row)) {
      errors.push(`${rowPath} must be an object`)
      return
    }
    requireText(row, 'label', rowPath, errors)
    valid.push({ row, index })
  })
  return valid
}

function checkTypeFields(q: Obj, type: QuestionType, path: string, errors: string[]) {
  if (type === 'true_false') {
    if (typeof q.answer !== 'boolean') {
      errors.push(`${join(path, 'answer')} must be true or false`)
    }
    return
  }

  if (type === 'multiple_choice') {
    const keys = checkOptions(q, path, errors)
    checkKey(q.answer, keys, join(path, 'answer'), errors)
    return
  }

  if (type === 'multi_select') {
    const keys = checkOptions(q, path, errors)
    checkKeyList(q.answers, keys, join(path, 'answers'), errors, 1)
    return
  }

  if (type === 'matching') {
    const keys = checkOptions(q, path, errors)
    const rows = checkRows(q, path, errors)
    rows.forEach(({ row, index }) => {
      const rowPath = `${join(path, 'rows')}[${index}]`
      checkUnknownKeys(row, ['label', 'answer'], rowPath, errors)
      checkKey(row.answer, keys, join(rowPath, 'answer'), errors)
    })
    return
  }

  if (type === 'multi_match') {
    const keys = checkOptions(q, path, errors)
    const rows = checkRows(q, path, errors)
    rows.forEach(({ row, index }) => {
      const rowPath = `${join(path, 'rows')}[${index}]`
      checkUnknownKeys(row, ['label', 'answers'], rowPath, errors)
      checkKeyList(row.answers, keys, join(rowPath, 'answers'), errors, 0)
    })
    return
  }

  if (type === 'fill_blank') {
    checkStringList(q.acceptedAnswers, join(path, 'acceptedAnswers'), errors, 1)
    optionalBoolean(q, 'caseSensitive', path, errors)
    return
  }

  if (type === 'numeric') {
    if (!isFiniteNumber(q.answer)) {
      errors.push(`${join(path, 'answer')} must be a number`)
    }
    if (q.tolerance !== undefined) {
      if (!isFiniteNumber(q.tolerance) || q.tolerance < 0) {
        errors.push(`${join(path, 'tolerance')} must be a number that is 0 or more`)
      }
    }
    optionalText(q, 'unit', path, errors)
    return
  }

  if (type === 'ordering') {
    const itemsPath = join(path, 'items')
    const items = checkStringList(q.items, itemsPath, errors, 2)
    checkNoDuplicates(items, itemsPath, errors)
    return
  }

  requireText(q, 'modelAnswer', path, errors)
}

function checkQuestion(q: unknown, path: string, errors: string[], seenIds: Set<string>) {
  if (!isObject(q)) {
    errors.push(`${path} must be an object`)
    return
  }

  if (isNonEmptyString(q.id)) {
    if (seenIds.has(q.id)) {
      errors.push(`${join(path, 'id')} "${q.id}" is used by another question`)
    }
    seenIds.add(q.id)
  } else {
    errors.push(`${join(path, 'id')} must be a non-empty string`)
  }

  if (!isFiniteNumber(q.points) || q.points <= 0) {
    errors.push(`${join(path, 'points')} must be a number greater than 0`)
  }
  requireText(q, 'prompt', path, errors)
  optionalText(q, 'explanation', path, errors)
  optionalText(q, 'rubric', path, errors)
  optionalBoolean(q, 'extraCredit', path, errors)
  if (q.tags !== undefined) {
    checkStringList(q.tags, join(path, 'tags'), errors, 0)
  }
  if (q.table !== undefined) {
    checkTable(q.table, join(path, 'table'), errors)
  }

  const type = q.type
  if (typeof type !== 'string' || !QUESTION_TYPES.includes(type as QuestionType)) {
    errors.push(`${join(path, 'type')} must be one of: ${QUESTION_TYPES.join(', ')}`)
    return
  }
  const questionType = type as QuestionType
  checkUnknownKeys(q, COMMON_KEYS.concat(TYPE_KEYS[questionType]), path, errors)
  checkTypeFields(q, questionType, path, errors)
}

// checks a sections array in place, used by both exam files and backups
export function checkSections(value: unknown, path: string, errors: string[]) {
  if (!Array.isArray(value) || value.length === 0) {
    errors.push(`${path} must be a non-empty array`)
    return
  }
  const seenIds = new Set<string>()
  value.forEach((section, sectionIndex) => {
    const sectionPath = `${path}[${sectionIndex}]`
    if (!isObject(section)) {
      errors.push(`${sectionPath} must be an object`)
      return
    }
    checkUnknownKeys(section, SECTION_KEYS, sectionPath, errors)
    requireText(section, 'title', sectionPath, errors)
    const questions = section.questions
    const questionsPath = join(sectionPath, 'questions')
    if (!Array.isArray(questions) || questions.length === 0) {
      errors.push(`${questionsPath} must be a non-empty array`)
      return
    }
    questions.forEach((q, questionIndex) => {
      checkQuestion(q, `${questionsPath}[${questionIndex}]`, errors, seenIds)
    })
  })
}

export function checkTimeLimit(value: unknown, path: string, errors: string[]) {
  if (value === undefined) {
    return
  }
  if (!isFiniteNumber(value) || value <= 0) {
    errors.push(`${path} must be a number greater than 0`)
  }
}

export function validateExamFile(data: unknown): ValidationResult {
  if (!isObject(data)) {
    return { ok: false, errors: ['the exam must be a json object'] }
  }
  const errors: string[] = []
  checkUnknownKeys(data, TOP_KEYS, '', errors)
  if (data.schemaVersion !== 1) {
    errors.push('schemaVersion must be 1')
  }
  requireText(data, 'course', '', errors)
  requireText(data, 'title', '', errors)
  checkTimeLimit(data.timeLimitMinutes, 'timeLimitMinutes', errors)
  checkSections(data.sections, 'sections', errors)

  if (errors.length > 0) {
    return { ok: false, errors }
  }
  return { ok: true, exam: data as unknown as ExamFile }
}

export function parseExamJson(text: string): ValidationResult {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch (err) {
    let message = 'unknown error'
    if (err instanceof Error) {
      message = err.message
    }
    return { ok: false, errors: [`not valid json: ${message}`] }
  }
  return validateExamFile(data)
}
