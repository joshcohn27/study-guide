import { useState } from 'react'
import { currentTheme, saveTheme } from '../lib/theme'
import type { Theme } from '../lib/theme'

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(currentTheme)

  function toggle() {
    let next: Theme = 'dark'
    if (theme === 'dark') {
      next = 'light'
    }
    saveTheme(next)
    setTheme(next)
  }

  let label = 'Dark mode'
  if (theme === 'dark') {
    label = 'Light mode'
  }

  return (
    <button type="button" onClick={toggle}>
      {label}
    </button>
  )
}
