import { Link } from 'react-router-dom'

export type Crumb = {
  label: string
  // leave out for the current page
  to?: string
}

export function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="breadcrumbs">
      <ol>
        {crumbs.map((crumb, index) => (
          <li key={index}>
            {crumb.to && <Link to={crumb.to}>{crumb.label}</Link>}
            {!crumb.to && <span aria-current="page">{crumb.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  )
}
