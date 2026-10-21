import type { QuestionTable } from '../types'

export function QuestionTableView({ table }: { table: QuestionTable }) {
  return (
    <table>
      <thead>
        <tr>
          {table.headers.map((header, index) => (
            <th scope="col" key={index}>
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {table.rows.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {row.map((cell, cellIndex) => (
              <td key={cellIndex}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
