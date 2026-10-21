import { useState } from 'react'
import { currentTheme, saveTheme } from '../lib/theme'
import type { Theme } from '../lib/theme'
import { MoonIcon, SunIcon } from './Icons'

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

  let label = 'Dark'
  let icon = <MoonIcon />
  if (theme === 'dark') {
    label = 'Light'
    icon = <SunIcon />
  }

  return (
    <button type="button" className="rail-theme" onClick={toggle} aria-label={`Switch to ${label.toLowerCase()} mode`}>
      {icon}
      <span>{label}</span>
    </button>
  )
}
