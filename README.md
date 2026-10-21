# Study Hall

A personal study tool. Load exams with mixed question types, take them in exam or practice mode, and get graded. Correct answers stay hidden until you check a question or submit the exam.

Live at [study.joshbcohn.com](https://study.joshbcohn.com).

## Run it

Needs Node 20 or newer.

```sh
npm install
npm run dev      # local dev server
npm test         # unit tests (vitest)
npm run build    # type check and production build into dist/
npm run lint     # oxlint
```

On first run (empty storage) the app loads `cs510-midterm-practice.json` as the first exam.

## Deploy (Vercel)

1. Push the repo to GitHub and import it in Vercel. It detects Vite: build command `npm run build`, output directory `dist`.
2. `vercel.json` rewrites every path to `index.html`, so deep links like `/exams/abc` work on refresh.
3. To use `study.joshbcohn.com`, add the domain under Project Settings > Domains, then add the CNAME record Vercel shows you (`study` pointing to `cname.vercel-dns.com`) at your DNS provider.

## Data

Everything is stored in your browser's localStorage under the key `study-hall:v1`. Use Settings to export a full backup JSON file and import it on another device. All storage goes through `src/lib/storage.ts`, whose functions are async so a backend like Supabase can replace it later without changing components.

## Exam JSON format

This is the format for importing and exporting exams. The "Copy format for Claude" button (on the Import and builder pages) copies a plain-text version of this to paste into a chat.

```jsonc
{
  "schemaVersion": 1,
  "course": "CS 510 Artificial Intelligence",
  "title": "Practice Midterm",
  "timeLimitMinutes": 90,          // optional
  "sections": [
    { "title": "Part 1", "questions": [ /* questions */ ] }
  ]
}
```

Every question has `id` (unique in the exam), `type`, `points` (greater than 0), and `prompt` (plain text, newlines allowed). Optional on every question: `explanation`, `rubric`, `tags` (string array), `extraCredit` (boolean), and `table` (`{ "headers": string[], "rows": string[][] }`).

| type | extra fields | grading |
| --- | --- | --- |
| `true_false` | `answer`: boolean | all or nothing |
| `multiple_choice` | `options`: `{ key, text }[]`, `answer`: key | all or nothing |
| `multi_select` | `options`, `answers`: key[] | each correct pick adds a share, each wrong pick takes one away, never below 0 |
| `matching` | `options`, `rows`: `{ label, answer: key }[]` | partial credit per row |
| `multi_match` | `options`, `rows`: `{ label, answers: key[] }[]` | partial credit per row; a row counts only if its set matches exactly, `[]` means none apply |
| `fill_blank` | `acceptedAnswers`: string[], `caseSensitive`?: boolean | trimmed, case-insensitive unless `caseSensitive` |
| `numeric` | `answer`: number, `tolerance`?: number, `unit`?: string | right if within the tolerance |
| `ordering` | `items`: string[] in the correct order | shuffled when shown, all or nothing |
| `short_answer` | `modelAnswer`: string | self-scored after reveal: Full, Half, None, or any points from 0 to the max |

Imports are validated strictly: unknown fields, duplicate ids or option keys, and answers that don't match an option key are all errors. Every error is listed with its path (for example `sections[2].questions[4].answer must be one of the option keys`), and nothing is saved until the file is clean.

## Project layout

- `src/types.ts`: exam format and stored data types
- `src/lib/validate.ts`: exam JSON validation
- `src/lib/grade.ts`: one grading function per question type
- `src/lib/storage.ts`: localStorage, seeding, backup import and export
- `src/lib/attempt.ts`: building attempts, shuffles, retrying misses, the clock
- `src/components/questions/`: one input per question type, each with a reveal state
- `src/components/builder/`: the manual exam builder forms
- `src/pages/`: one component per route
