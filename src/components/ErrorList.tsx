export function ErrorList({ title, errors }: { title: string; errors: string[] }) {
  if (errors.length === 0) {
    return null
  }
  return (
    <section role="alert" aria-label={title}>
      <h2>{title}</h2>
      <p>
        {errors.length} problem{errors.length === 1 ? '' : 's'} found. Nothing was saved.
      </p>
      <ul>
        {errors.map((error, index) => (
          <li key={index}>{error}</li>
        ))}
      </ul>
    </section>
  )
}
