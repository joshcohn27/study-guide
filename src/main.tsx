import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'
import { applyTheme, storedTheme } from './lib/theme'

// apply a picked theme before the first paint, otherwise css follows the system
const theme = storedTheme()
if (theme) {
  applyTheme(theme)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
