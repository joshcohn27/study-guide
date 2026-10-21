// plain text with newlines: blank lines split paragraphs, single newlines become line breaks
export function MultilineText({ text }: { text: string }) {
  const paragraphs = text.split(/\n\s*\n/)
  return (
    <>
      {paragraphs.map((paragraph, paragraphIndex) => {
        const lines = paragraph.split('\n')
        return (
          <p key={paragraphIndex}>
            {lines.map((line, lineIndex) => (
              <span key={lineIndex}>
                {lineIndex > 0 && <br />}
                {line}
              </span>
            ))}
          </p>
        )
      })}
    </>
  )
}
