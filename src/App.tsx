import { Link, NavLink, Route, Routes } from 'react-router-dom'
import { AttemptPage } from './pages/AttemptPage'
import { BuilderPage } from './pages/BuilderPage'
import { ExamPage } from './pages/ExamPage'
import { HomePage } from './pages/HomePage'
import { ImportPage } from './pages/ImportPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { SettingsPage } from './pages/SettingsPage'
import { StatsPage } from './pages/StatsPage'

export default function App() {
  return (
    <>
      <header>
        <p>
          <Link to="/">Study Hall</Link>
        </p>
        <nav aria-label="Main">
          <ul>
            <li>
              <NavLink to="/" end>
                Exams
              </NavLink>
            </li>
            <li>
              <NavLink to="/import">Import</NavLink>
            </li>
            <li>
              <NavLink to="/exams/new/edit">New exam</NavLink>
            </li>
            <li>
              <NavLink to="/stats">Stats</NavLink>
            </li>
            <li>
              <NavLink to="/settings">Settings</NavLink>
            </li>
          </ul>
        </nav>
      </header>
      <main>
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
    </>
  )
}
