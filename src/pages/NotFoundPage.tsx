import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <>
      <header className="page-head">
        <h1>Page not found</h1>
      </header>
      <p>
        <Link to="/">Back to your exams</Link>
      </p>
    </>
  )
}
