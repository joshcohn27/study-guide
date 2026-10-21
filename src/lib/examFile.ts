import type { Course, Exam, ExamFile, Section } from '../types'

// pulls a code like "CS 510" off the front of a label such as "CS 510 Artificial Intelligence"
const CODE_PATTERN = /^([A-Za-z]{2,6}[ -]?\d{2,4}[A-Za-z]?)(?:\s+(.*))?$/

export function parseCourseLabel(label: string): { code: string; name: string } {
  const trimmed = label.trim()
  const match = CODE_PATTERN.exec(trimmed)
  if (!match) {
    return { code: '', name: trimmed }
  }
  const code = match[1]
  const name = (match[2] ?? '').trim()
  return { code, name }
}

export function courseLabel(course: Pick<Course, 'code' | 'name'>): string {
  const code = course.code.trim()
  const name = course.name.trim()
  if (code && name) {
    return `${code} ${name}`
  }
  if (code) {
    return code
  }
  return name
}

export function sameCourseLabel(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase()
}

// json round trip drops undefined fields so exports stay clean
function cleanSections(sections: Section[]): Section[] {
  return JSON.parse(JSON.stringify(sections)) as Section[]
}

export function examToFile(exam: Exam, course: Course | undefined): ExamFile {
  let label = 'Unknown course'
  if (course) {
    label = courseLabel(course)
  }
  const file: ExamFile = {
    schemaVersion: 1,
    course: label,
    title: exam.title,
    sections: cleanSections(exam.sections),
  }
  if (exam.timeLimitMinutes !== undefined) {
    file.timeLimitMinutes = exam.timeLimitMinutes
  }
  return file
}

export function examFileName(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  if (slug === '') {
    return 'exam.json'
  }
  return `${slug}.json`
}

export function countQuestions(sections: Section[]): number {
  let count = 0
  for (const section of sections) {
    count += section.questions.length
  }
  return count
}
