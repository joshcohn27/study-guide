import type {
  FillBlankQuestion,
  MatchingQuestion,
  MultiMatchQuestion,
  MultipleChoiceQuestion,
  MultiSelectQuestion,
  NumericQuestion,
  OrderingQuestion,
  Question,
  ShortAnswerQuestion,
  TrueFalseQuestion,
} from '../../types'
import { withOptions } from '../../lib/builder'
import { LinesField, NumberField } from './fields'
import { OptionsEditor } from './OptionsEditor'

type EditorProps<Q> = {
  question: Q
  onChange: (question: Question) => void
}

function TrueFalseFields({ question, onChange }: EditorProps<TrueFalseQuestion>) {
  const name = `correct-${question.id}`
  return (
    <fieldset>
      <legend>Correct answer</legend>
      <label>
        <input type="radio" name={name} checked={question.answer} onChange={() => onChange({ ...question, answer: true })} />{' '}
        True
      </label>{' '}
      <label>
        <input
          type="radio"
          name={name}
          checked={!question.answer}
          onChange={() => onChange({ ...question, answer: false })}
        />{' '}
        False
      </label>
    </fieldset>
  )
}

function MultipleChoiceFields({ question, onChange }: EditorProps<MultipleChoiceQuestion>) {
  const name = `correct-${question.id}`
  return (
    <OptionsEditor
      options={question.options}
      onChange={(options) => onChange(withOptions(question, options))}
      renderMark={(option) => (
        <label>
          <input
            type="radio"
            name={name}
            checked={question.answer === option.key}
            onChange={() => onChange({ ...question, answer: option.key })}
          />{' '}
          Correct
        </label>
      )}
    />
  )
}

function MultiSelectFields({ question, onChange }: EditorProps<MultiSelectQuestion>) {
  function toggle(key: string) {
    if (question.answers.includes(key)) {
      onChange({ ...question, answers: question.answers.filter((item) => item !== key) })
    } else {
      onChange({ ...question, answers: question.answers.concat(key) })
    }
  }

  return (
    <OptionsEditor
      options={question.options}
      onChange={(options) => onChange(withOptions(question, options))}
      renderMark={(option) => (
        <label>
          <input type="checkbox" checked={question.answers.includes(option.key)} onChange={() => toggle(option.key)} />{' '}
          Correct
        </label>
      )}
    />
  )
}

function MatchingFields({ question, onChange }: EditorProps<MatchingQuestion>) {
  function setRow(index: number, label: string, answer: string) {
    const rows = question.rows.slice()
    rows[index] = { label, answer }
    onChange({ ...question, rows })
  }

  function removeRow(index: number) {
    onChange({ ...question, rows: question.rows.filter((_, rowIndex) => rowIndex !== index) })
  }

  function addRow() {
    onChange({ ...question, rows: question.rows.concat({ label: '', answer: '' }) })
  }

  return (
    <>
      <OptionsEditor options={question.options} onChange={(options) => onChange(withOptions(question, options))} />
      <fieldset>
        <legend>Rows to match</legend>
        <table>
          <thead>
            <tr>
              <th scope="col">Item</th>
              <th scope="col">Correct option</th>
              <th scope="col">Remove</th>
            </tr>
          </thead>
          <tbody>
            {question.rows.map((row, index) => (
              <tr key={index}>
                <td>
                  <input
                    type="text"
                    aria-label={`Row ${index + 1} item`}
                    value={row.label}
                    onChange={(event) => setRow(index, event.target.value, row.answer)}
                  />
                </td>
                <td>
                  <select
                    aria-label={`Row ${index + 1} correct option`}
                    value={row.answer}
                    onChange={(event) => setRow(index, row.label, event.target.value)}
                  >
                    <option value="">Choose...</option>
                    {question.options.map((option) => (
                      <option key={option.key} value={option.key}>
                        {option.key}. {option.text}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <button type="button" disabled={question.rows.length <= 1} onClick={() => removeRow(index)}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button type="button" onClick={addRow}>
          Add row
        </button>
      </fieldset>
    </>
  )
}

function MultiMatchFields({ question, onChange }: EditorProps<MultiMatchQuestion>) {
  function setLabel(index: number, label: string) {
    const rows = question.rows.slice()
    rows[index] = { ...rows[index], label }
    onChange({ ...question, rows })
  }

  function toggle(index: number, key: string) {
    const rows = question.rows.slice()
    const answers = rows[index].answers
    let nextAnswers = answers.concat(key)
    if (answers.includes(key)) {
      nextAnswers = answers.filter((item) => item !== key)
    }
    rows[index] = { ...rows[index], answers: nextAnswers }
    onChange({ ...question, rows })
  }

  function removeRow(index: number) {
    onChange({ ...question, rows: question.rows.filter((_, rowIndex) => rowIndex !== index) })
  }

  function addRow() {
    onChange({ ...question, rows: question.rows.concat({ label: '', answers: [] }) })
  }

  return (
    <>
      <OptionsEditor options={question.options} onChange={(options) => onChange(withOptions(question, options))} />
      <fieldset>
        <legend>Rows (check every option that applies, or none)</legend>
        <table>
          <thead>
            <tr>
              <th scope="col">Item</th>
              {question.options.map((option) => (
                <th scope="col" key={option.key}>
                  {option.key}
                </th>
              ))}
              <th scope="col">Remove</th>
            </tr>
          </thead>
          <tbody>
            {question.rows.map((row, index) => (
              <tr key={index}>
                <td>
                  <input
                    type="text"
                    aria-label={`Row ${index + 1} item`}
                    value={row.label}
                    onChange={(event) => setLabel(index, event.target.value)}
                  />
                </td>
                {question.options.map((option) => (
                  <td key={option.key}>
                    <input
                      type="checkbox"
                      aria-label={`Row ${index + 1} applies: ${option.key}`}
                      checked={row.answers.includes(option.key)}
                      onChange={() => toggle(index, option.key)}
                    />
                  </td>
                ))}
                <td>
                  <button type="button" disabled={question.rows.length <= 1} onClick={() => removeRow(index)}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button type="button" onClick={addRow}>
          Add row
        </button>
      </fieldset>
    </>
  )
}

function FillBlankFields({ question, onChange }: EditorProps<FillBlankQuestion>) {
  return (
    <>
      <p>
        <LinesField
          label="Accepted answers"
          hint="one per line"
          value={question.acceptedAnswers}
          onChange={(acceptedAnswers) => onChange({ ...question, acceptedAnswers })}
        />
      </p>
      <p>
        <label>
          <input
            type="checkbox"
            checked={question.caseSensitive === true}
            onChange={(event) => onChange({ ...question, caseSensitive: event.target.checked })}
          />{' '}
          Case sensitive
        </label>
      </p>
    </>
  )
}

function NumericFields({ question, onChange }: EditorProps<NumericQuestion>) {
  return (
    <p>
      <NumberField
        label="Correct answer"
        value={question.answer}
        onChange={(value) => onChange({ ...question, answer: value ?? Number.NaN })}
      />{' '}
      <NumberField
        label="Tolerance (optional)"
        value={question.tolerance}
        onChange={(tolerance) => onChange({ ...question, tolerance })}
      />{' '}
      <label>
        Unit (optional){' '}
        <input
          type="text"
          size={8}
          value={question.unit ?? ''}
          onChange={(event) => onChange({ ...question, unit: event.target.value })}
        />
      </label>
    </p>
  )
}

function OrderingFields({ question, onChange }: EditorProps<OrderingQuestion>) {
  return (
    <p>
      <LinesField
        label="Items"
        hint="one per line, in the correct order. They get shuffled when shown"
        value={question.items}
        onChange={(items) => onChange({ ...question, items })}
      />
    </p>
  )
}

function ShortAnswerFields({ question, onChange }: EditorProps<ShortAnswerQuestion>) {
  return (
    <p>
      <label>
        Model answer (shown after answering so you can score yourself)
        <br />
        <textarea
          rows={5}
          cols={60}
          value={question.modelAnswer}
          onChange={(event) => onChange({ ...question, modelAnswer: event.target.value })}
        />
      </label>
    </p>
  )
}

// the part of the form that changes with the question type
export function TypeFields({ question, onChange }: EditorProps<Question>) {
  switch (question.type) {
    case 'true_false':
      return <TrueFalseFields question={question} onChange={onChange} />
    case 'multiple_choice':
      return <MultipleChoiceFields question={question} onChange={onChange} />
    case 'multi_select':
      return <MultiSelectFields question={question} onChange={onChange} />
    case 'matching':
      return <MatchingFields question={question} onChange={onChange} />
    case 'multi_match':
      return <MultiMatchFields question={question} onChange={onChange} />
    case 'fill_blank':
      return <FillBlankFields question={question} onChange={onChange} />
    case 'numeric':
      return <NumericFields question={question} onChange={onChange} />
    case 'ordering':
      return <OrderingFields question={question} onChange={onChange} />
    case 'short_answer':
      return <ShortAnswerFields question={question} onChange={onChange} />
  }
}
