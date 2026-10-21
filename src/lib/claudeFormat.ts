// plain-text description of the exam json format, meant to be pasted into a chat
export const CLAUDE_FORMAT = `Please write a practice exam as a single JSON object in this exact format. Output only the JSON.

Top level:
{
  "schemaVersion": 1,
  "course": string,              // course code and name, for example "CS 510 Artificial Intelligence"
  "title": string,
  "timeLimitMinutes": number,    // optional, greater than 0
  "sections": Section[]          // at least one
}

Section:
{ "title": string, "questions": Question[] }   // at least one question

Every question has:
- "id": string, unique across the whole exam (for example "q1", "q2")
- "type": one of the types below
- "points": number greater than 0
- "prompt": plain text, newlines (\\n) allowed
Optional on every question:
- "explanation": string, shown after the question is graded
- "rubric": string, grading notes
- "tags": string[], topics used for per-topic stats
- "extraCredit": boolean
- "table": { "headers": string[], "rows": string[][] }  // every row has one cell per header

Question types and their extra fields:
- "true_false": "answer": boolean
- "multiple_choice": "options": [{ "key": string, "text": string }], "answer": one option key
- "multi_select": "options": [{ "key", "text" }], "answers": option keys (at least one). Partial credit per option picked right or wrong, never below 0.
- "matching": "options": [{ "key", "text" }], "rows": [{ "label": string, "answer": option key }]. Partial credit per row.
- "multi_match": "options": [{ "key", "text" }], "rows": [{ "label": string, "answers": option keys }]. A row is right only if the set matches exactly. Use an empty array when no option applies.
- "fill_blank": "acceptedAnswers": string[] (at least one), "caseSensitive": boolean (optional, default false). Answers are trimmed before comparing.
- "numeric": "answer": number, "tolerance": number (optional, 0 or more), "unit": string (optional)
- "ordering": "items": string[] listed in the correct order, at least 2, no duplicates. They get shuffled when shown.
- "short_answer": "modelAnswer": string. Self-graded after the answer is revealed, so make the model answer and rubric clear.

Rules:
- Option keys must be unique within a question, and every answer key must be one of that question's option keys.
- Do not add any fields that are not listed here.

Example:
{
  "schemaVersion": 1,
  "course": "CS 510 Artificial Intelligence",
  "title": "Search Quiz",
  "timeLimitMinutes": 20,
  "sections": [
    {
      "title": "Part 1",
      "questions": [
        { "id": "q1", "type": "true_false", "points": 1, "prompt": "BFS is complete when the branching factor is finite.", "answer": true, "tags": ["search"] },
        { "id": "q2", "type": "multiple_choice", "points": 2, "prompt": "Which search uses a stack?", "options": [{ "key": "a", "text": "BFS" }, { "key": "b", "text": "DFS" }], "answer": "b", "tags": ["search"] },
        { "id": "q3", "type": "short_answer", "points": 3, "prompt": "Explain why A* with an admissible heuristic is optimal.", "modelAnswer": "It never overestimates, so it never skips past a cheaper path to the goal.", "rubric": "Must mention admissibility." }
      ]
    }
  ]
}
`
