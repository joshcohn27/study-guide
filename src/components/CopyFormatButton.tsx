import { useState } from 'react'
import { CLAUDE_FORMAT } from '../lib/claudeFormat'

export function CopyFormatButton() {
  const [status, setStatus] = useState('')

  async function copy() {
    try {
      await navigator.clipboard.writeText(CLAUDE_FORMAT)
      setStatus('Copied. Paste it into a chat and ask for a new exam.')
    } catch {
      setStatus('Could not copy automatically. Open the format below and copy it by hand.')
    }
  }

  return (
    <div>
      <button type="button" onClick={copy}>
        Copy format for Claude
      </button>
      {status && <p role="status">{status}</p>}
      <details>
        <summary>Show the exam JSON format</summary>
        <pre>{CLAUDE_FORMAT}</pre>
      </details>
    </div>
  )
}
