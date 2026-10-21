import { useState } from 'react'
import type { ChangeEvent } from 'react'
import { ConfirmButton } from '../components/ConfirmButton'
import { ErrorList } from '../components/ErrorList'
import { downloadText, readFileText } from '../lib/files'
import { clearAllData, exportBackup, importBackup } from '../lib/storage'
import { todayStamp } from '../lib/time'

export function SettingsPage() {
  const [backupText, setBackupText] = useState('')
  const [fileName, setFileName] = useState('')
  const [errors, setErrors] = useState<string[]>([])
  const [message, setMessage] = useState('')

  async function exportAll() {
    const text = await exportBackup()
    downloadText(`study-hall-backup-${todayStamp()}.json`, text)
  }

  async function pickFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }
    setBackupText(await readFileText(file))
    setFileName(file.name)
    setErrors([])
    setMessage('')
  }

  async function restore() {
    try {
      const result = await importBackup(backupText)
      if (!result.ok) {
        setErrors(result.errors)
        setMessage('')
        return
      }
      setErrors([])
      setBackupText('')
      setFileName('')
      setMessage('Backup restored.')
    } catch (err) {
      if (err instanceof Error) {
        setMessage(err.message)
      }
    }
  }

  async function clearAll() {
    try {
      await clearAllData()
      setMessage('All data cleared.')
    } catch (err) {
      if (err instanceof Error) {
        setMessage(err.message)
      }
    }
  }

  return (
    <>
      <h1>Settings</h1>
      {message && <p role="status">{message}</p>}

      <section aria-labelledby="export-heading">
        <h2 id="export-heading">Back up</h2>
        <p>Download every course, exam, and attempt as one JSON file, so you can move to another device.</p>
        <button type="button" onClick={exportAll}>
          Export full backup
        </button>
      </section>

      <section aria-labelledby="restore-heading">
        <h2 id="restore-heading">Restore</h2>
        <p>Restoring replaces everything stored here with the backup. A backup with any errors is not loaded.</p>
        <p>
          <label>
            Backup file <input type="file" accept=".json,application/json" onChange={pickFile} />
          </label>
        </p>
        {backupText !== '' && (
          <ConfirmButton
            label={`Restore ${fileName}`}
            question="This replaces all of your current data. Restore?"
            confirmLabel="Yes, restore"
            onConfirm={restore}
          />
        )}
        <ErrorList title="This backup can't be restored" errors={errors} />
      </section>

      <section aria-labelledby="clear-heading">
        <h2 id="clear-heading">Clear all data</h2>
        <p>Deletes every course, exam, and attempt in this browser. Export a backup first if you want to keep them.</p>
        <ConfirmButton
          label="Clear all data"
          question="Delete everything? This can't be undone."
          confirmLabel="Yes, delete everything"
          onConfirm={clearAll}
        />
      </section>
    </>
  )
}
