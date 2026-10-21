// id of a question card, used by the question nav links
export function questionAnchor(questionId: string): string {
  return `question-${questionId}`
}

// class for a graded choice row, plain before reveal
export function choiceClass(reveal: boolean, isCorrect: boolean, isWrong: boolean): string {
  if (!reveal) {
    return 'choice'
  }
  if (isCorrect) {
    return 'choice choice-correct'
  }
  if (isWrong) {
    return 'choice choice-wrong'
  }
  return 'choice'
}
