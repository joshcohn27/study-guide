import { useState } from 'react'
import type { QuestionTable } from '../../types'
import { parseNumber } from '../../lib/grade'

// these fields keep their own text while you type, so half-typed values
// like "1." or a trailing comma don't get wiped out by a re-render

function numberText(value: number | undefined): string {
  if (value === undefined) {
    return ''
  }
  return String(value)
}

type NumberFieldProps = {
  label: string
  value: number | undefined
  onChange: (value: number | undefined) => void
}

export function NumberField({ label, value, onChange }: NumberFieldProps) {
  const [text, setText] = useState(() => numberText(value))

  function change(nextText: string) {
    setText(nextText)
    const parsed = parseNumber(nextText)
    if (parsed === null) {
      onChange(undefined)
    } else {
      onChange(parsed)
    }
  }

  return (
    <label>
      {label} <input type="text" inputMode="decimal" size={8} value={text} onChange={(event) => change(event.target.value)} />
    </label>
  )
}

function splitList(text: string, separator: string): string[] {
  return text
    .split(separator)
    .map((item) => item.trim())
    .filter((item) => item !== '')
}

type ListFieldProps = {
  label: string
  hint: string
  value: string[]
  onChange: (value: string[]) => void
}

// one item per line
export function LinesField({ label, hint, value, onChange }: ListFieldProps) {
  const [text, setText] = useState(() => value.join('\n'))

  function change(nextText: string) {
    setText(nextText)
    onChange(splitList(nextText, '\n'))
  }

  return (
    <label>
      {label} ({hint})
      <br />
      <textarea rows={4} cols={60} value={text} onChange={(event) => change(event.target.value)} />
    </label>
  )
}

// items separated by commas
export function CommaListField({ label, hint, value, onChange }: ListFieldProps) {
  const [text, setText] = useState(() => value.join(', '))

  function change(nextText: string) {
    setText(nextText)
    onChange(splitList(nextText, ','))
  }

  return (
    <label>
      {label} ({hint}) <input type="text" size={40} value={text} onChange={(event) => change(event.target.value)} />
    </label>
  )
}

function tableText(table: QuestionTable | undefined): string {
  if (!table) {
    return ''
  }
  const lines = [table.headers.join(' | ')]
  for (const row of table.rows) {
    lines.push(row.join(' | '))
  }
  return lines.join('\n')
}

function parseTable(text: string): QuestionTable | undefined {
  const lines = text.split('\n').filter((line) => line.trim() !== '')
  if (lines.length === 0) {
    return undefined
  }
  const cells = lines.map((line) => line.split('|').map((cell) => cell.trim()))
  return { headers: cells[0], rows: cells.slice(1) }
}

type TableFieldProps = {
  value: QuestionTable | undefined
  onChange: (value: QuestionTable | undefined) => void
}

export function TableField({ value, onChange }: TableFieldProps) {
  const [text, setText] = useState(() => tableText(value))

  function change(nextText: string) {
    setText(nextText)
    onChange(parseTable(nextText))
  }

  return (
    <label>
      Table (optional: first line is the headers, one row per line, cells split by |)
      <br />
      <textarea rows={4} cols={60} value={text} onChange={(event) => change(event.target.value)} />
    </label>
  )
}
