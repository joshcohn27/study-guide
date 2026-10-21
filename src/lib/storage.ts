// all persistence lives here. every function is async so this module can be
// swapped for a real backend (like supabase) without touching components.
import seedExam from '../../cs510-midterm-practice.json'
import type { Attempt, Course, Exam, ExamFile } from '../types'
import { parseCourseLabel, courseLabel, sameCourseLabel } from './examFile'
import { checkSections, checkTimeLimit, validateExamFile } from './validate'

const STORAGE_KEY = 'study-hall:v1'

type StoreData = {
  version: 1
  courses: Course[]
  exams: Exam[]
  attempts: Attempt[]
}

export type BackupResult = { ok: true } | { ok: false; errors: string[] }

function emptyData(): StoreData {
  return { version: 1, courses: [], exams: [], attempts: [] }
}

export function newId(): string {
  return crypto.randomUUID()
}

function seedData(): StoreData {
  const data = emptyData()
  const result = validateExamFile(seedExam)
  if (!result.ok) {
    return data
  }
  addExamFile(data, result.exam, null)
  return data
}

function readData(): StoreData {
  let raw: string | null = null
  try {
    raw = localStorage.getItem(STORAGE_KEY)
  } catch {
    return emptyData()
  }
  // first run, start with the sample exam
  if (raw === null) {
    const seeded = seedData()
    writeData(seeded)
    return seeded
  }
  try {
    const parsed = JSON.parse(raw) as StoreData
    if (parsed.version === 1) {
      return parsed
    }
  } catch {
    // fall through to empty data
  }
  return emptyData()
}

function writeData(data: StoreData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (err) {
    let reason = 'storage is unavailable or full'
    if (err instanceof Error) {
      reason = err.message
    }
    throw new Error(`Could not save: ${reason}`)
  }
}

function findOrAddCourse(data: StoreData, label: string): Course {
  const existing = data.courses.find((course) => sameCourseLabel(courseLabel(course), label))
  if (existing) {
    return existing
  }
  const parsed = parseCourseLabel(label)
  const course: Course = { id: newId(), code: parsed.code, name: parsed.name }
  data.courses.push(course)
  return course
}

function addExamFile(data: StoreData, file: ExamFile, examId: string | null): Exam {
  const course = findOrAddCourse(data, file.course)
  const now = new Date().toISOString()
  const existing = data.exams.find((exam) => exam.id === examId)

  let createdAt = now
  if (existing) {
    createdAt = existing.createdAt
  }
  const exam: Exam = {
    id: examId ?? newId(),
    courseId: course.id,
    title: file.title,
    sections: file.sections,
    createdAt,
    updatedAt: now,
  }
  if (file.timeLimitMinutes !== undefined) {
    exam.timeLimitMinutes = file.timeLimitMinutes
  }

  if (existing) {
    data.exams = data.exams.map((item) => {
      if (item.id === exam.id) {
        return exam
      }
      return item
    })
  } else {
    data.exams.push(exam)
  }
  return exam
}

// courses

export async function listCourses(): Promise<Course[]> {
  return readData().courses
}

export async function saveCourse(course: Course): Promise<void> {
  const data = readData()
  const index = data.courses.findIndex((item) => item.id === course.id)
  if (index === -1) {
    data.courses.push(course)
  } else {
    data.courses[index] = course
  }
  writeData(data)
}

export async function deleteCourse(courseId: string): Promise<void> {
  const data = readData()
  data.courses = data.courses.filter((course) => course.id !== courseId)
  writeData(data)
}

// exams

export async function listExams(): Promise<Exam[]> {
  return readData().exams
}

export async function getExam(examId: string): Promise<Exam | null> {
  const exam = readData().exams.find((item) => item.id === examId)
  return exam ?? null
}

// saves a validated exam file, creating its course if needed.
// pass an examId to overwrite that exam, or null to make a new one.
export async function saveExamFile(file: ExamFile, examId: string | null): Promise<Exam> {
  const data = readData()
  const exam = addExamFile(data, file, examId)
  writeData(data)
  return exam
}

export async function deleteExam(examId: string): Promise<void> {
  const data = readData()
  data.exams = data.exams.filter((exam) => exam.id !== examId)
  data.attempts = data.attempts.filter((attempt) => attempt.examId !== examId)
  writeData(data)
}

// attempts

export async function listAttempts(examId?: string): Promise<Attempt[]> {
  const attempts = readData().attempts
  if (examId === undefined) {
    return attempts
  }
  return attempts.filter((attempt) => attempt.examId === examId)
}

export async function getAttempt(attemptId: string): Promise<Attempt | null> {
  const attempt = readData().attempts.find((item) => item.id === attemptId)
  return attempt ?? null
}

export async function saveAttempt(attempt: Attempt): Promise<void> {
  const data = readData()
  const index = data.attempts.findIndex((item) => item.id === attempt.id)
  if (index === -1) {
    data.attempts.push(attempt)
  } else {
    data.attempts[index] = attempt
  }
  writeData(data)
}

export async function deleteAttempt(attemptId: string): Promise<void> {
  const data = readData()
  data.attempts = data.attempts.filter((attempt) => attempt.id !== attemptId)
  writeData(data)
}

// full backup

export async function exportBackup(): Promise<string> {
  return JSON.stringify(readData(), null, 2)
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function checkStrings(obj: Record<string, unknown>, keys: string[], path: string, errors: string[]) {
  for (const key of keys) {
    if (typeof obj[key] !== 'string') {
      errors.push(`${path}.${key} must be a string`)
    }
  }
}

function checkBackup(value: unknown): string[] {
  if (!isObject(value)) {
    return ['the backup must be a json object']
  }
  const errors: string[] = []
  if (value.version !== 1) {
    errors.push('version must be 1')
  }

  const courseIds: string[] = []
  if (Array.isArray(value.courses)) {
    value.courses.forEach((course, index) => {
      const path = `courses[${index}]`
      if (!isObject(course)) {
        errors.push(`${path} must be an object`)
        return
      }
      checkStrings(course, ['id', 'name', 'code'], path, errors)
      courseIds.push(String(course.id))
    })
  } else {
    errors.push('courses must be an array')
  }

  const examIds: string[] = []
  if (Array.isArray(value.exams)) {
    value.exams.forEach((exam, index) => {
      const path = `exams[${index}]`
      if (!isObject(exam)) {
        errors.push(`${path} must be an object`)
        return
      }
      checkStrings(exam, ['id', 'courseId', 'title', 'createdAt', 'updatedAt'], path, errors)
      if (!courseIds.includes(String(exam.courseId))) {
        errors.push(`${path}.courseId must match one of the courses`)
      }
      checkTimeLimit(exam.timeLimitMinutes, `${path}.timeLimitMinutes`, errors)
      checkSections(exam.sections, `${path}.sections`, errors)
      examIds.push(String(exam.id))
    })
  } else {
    errors.push('exams must be an array')
  }

  if (Array.isArray(value.attempts)) {
    value.attempts.forEach((attempt, index) => {
      const path = `attempts[${index}]`
      if (!isObject(attempt)) {
        errors.push(`${path} must be an object`)
        return
      }
      checkStrings(attempt, ['id', 'examId', 'examTitle', 'startedAt'], path, errors)
      if (!examIds.includes(String(attempt.examId))) {
        errors.push(`${path}.examId must match one of the exams`)
      }
      if (attempt.mode !== 'exam' && attempt.mode !== 'practice') {
        errors.push(`${path}.mode must be "exam" or "practice"`)
      }
      if (typeof attempt.elapsedMs !== 'number') {
        errors.push(`${path}.elapsedMs must be a number`)
      }
      if (!isObject(attempt.answers)) {
        errors.push(`${path}.answers must be an object`)
      }
      if (!isObject(attempt.selfScores)) {
        errors.push(`${path}.selfScores must be an object`)
      }
      if (!isObject(attempt.orderingStart)) {
        errors.push(`${path}.orderingStart must be an object`)
      }
      if (!Array.isArray(attempt.checked)) {
        errors.push(`${path}.checked must be an array`)
      }
      checkSections(attempt.sections, `${path}.sections`, errors)
    })
  } else {
    errors.push('attempts must be an array')
  }
  return errors
}

// replaces everything with the backup, but only if the whole backup is valid
export async function importBackup(text: string): Promise<BackupResult> {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch (err) {
    let message = 'unknown error'
    if (err instanceof Error) {
      message = err.message
    }
    return { ok: false, errors: [`not valid json: ${message}`] }
  }
  const errors = checkBackup(parsed)
  if (errors.length > 0) {
    return { ok: false, errors }
  }
  writeData(parsed as StoreData)
  return { ok: true }
}

export async function clearAllData(): Promise<void> {
  writeData(emptyData())
}
