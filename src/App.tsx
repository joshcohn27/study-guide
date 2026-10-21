import type { ReactNode } from 'react'
import { Link, NavLink, Route, Routes } from 'react-router-dom'
import { ExamsIcon, ImportIcon, Logo, PlusIcon, SettingsIcon, StatsIcon } from './components/Icons'
import { ThemeToggle } from './components/ThemeToggle'
import { AttemptPage } from './pages/AttemptPage'
import { BuilderPage } from './pages/BuilderPage'
import { ExamPage } from './pages/ExamPage'
import { HomePage } from './pages/HomePage'
import { ImportPage } from './pages/ImportPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { SettingsPage } from './pages/SettingsPage'
import { StatsPage } from './pages/StatsPage'

function RailLink({ to, icon, label, end }: { to: string; icon: ReactNode; label: string; end?: boolean }) {
  return (
    <li>
      <NavLink to={to} end={end}>
        {icon}
        <span>{label}</span>
      </NavLink>
    </li>
  )
}

export default function App() {
  return (
    <div className="app">
      <nav className="rail" aria-label="Main">
        <Link to="/" className="rail-logo" aria-label="Study Hall home">
          <Logo />
        </Link>
        <ul>
          <RailLink to="/" end icon={<ExamsIcon />} label="Exams" />
          <RailLink to="/import" icon={<ImportIcon />} label="Import" />
          <RailLink to="/exams/new/edit" icon={<PlusIcon />} label="New exam" />
          <RailLink to="/stats" icon={<StatsIcon />} label="Stats" />
          <RailLink to="/settings" icon={<SettingsIcon />} label="Settings" />
        </ul>
        <ThemeToggle />
      </nav>
      <main className="content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/import" element={<ImportPage />} />
          <Route path="/exams/:examId/edit" element={<BuilderPage />} />
          <Route path="/exams/:examId" element={<ExamPage />} />
          <Route path="/attempts/:attemptId" element={<AttemptPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </div>
  )
}
