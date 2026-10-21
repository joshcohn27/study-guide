import type { Answer, Question } from '../../types'
import { answerValue } from '../../lib/grade'
import { FillBlankInput } from './FillBlankInput'
import { MatchingInput } from './MatchingInput'
import { MultiMatchInput } from './MultiMatchInput'
import { MultipleChoiceInput } from './MultipleChoiceInput'
import { MultiSelectInput } from './MultiSelectInput'
import { NumericInput } from './NumericInput'
import { OrderingInput } from './OrderingInput'
import { ShortAnswerInput } from './ShortAnswerInput'
import { TrueFalseInput } from './TrueFalseInput'

type Props = {
  question: Question
  answer: Answer | undefined
  onAnswer: (answer: Answer) => void
  reveal: boolean
  startOrder: string[] | undefined
}

// picks the right input for the question type
export function QuestionInput({ question, answer, onAnswer, reveal, startOrder }: Props) {
  switch (question.type) {
    case 'true_false':
      return (
        <TrueFalseInput
          question={question}
          value={answerValue(answer, 'true_false')}
          onChange={(value) => onAnswer({ type: 'true_false', value })}
          reveal={reveal}
        />
      )
    case 'multiple_choice':
      return (
        <MultipleChoiceInput
          question={question}
          value={answerValue(answer, 'multiple_choice')}
          onChange={(value) => onAnswer({ type: 'multiple_choice', value })}
          reveal={reveal}
        />
      )
    case 'multi_select':
      return (
        <MultiSelectInput
          question={question}
          value={answerValue(answer, 'multi_select')}
          onChange={(value) => onAnswer({ type: 'multi_select', value })}
          reveal={reveal}
        />
      )
    case 'matching':
      return (
        <MatchingInput
          question={question}
          value={answerValue(answer, 'matching')}
          onChange={(value) => onAnswer({ type: 'matching', value })}
          reveal={reveal}
        />
      )
    case 'multi_match':
      return (
        <MultiMatchInput
          question={question}
          value={answerValue(answer, 'multi_match')}
          onChange={(value) => onAnswer({ type: 'multi_match', value })}
          reveal={reveal}
        />
      )
    case 'fill_blank':
      return (
        <FillBlankInput
          question={question}
          value={answerValue(answer, 'fill_blank')}
          onChange={(value) => onAnswer({ type: 'fill_blank', value })}
          reveal={reveal}
        />
      )
    case 'numeric':
      return (
        <NumericInput
          question={question}
          value={answerValue(answer, 'numeric')}
          onChange={(value) => onAnswer({ type: 'numeric', value })}
          reveal={reveal}
        />
      )
    case 'ordering':
      return (
        <OrderingInput
          question={question}
          value={answerValue(answer, 'ordering')}
          onChange={(value) => onAnswer({ type: 'ordering', value })}
          reveal={reveal}
          startOrder={startOrder ?? question.items}
        />
      )
    case 'short_answer':
      return (
        <ShortAnswerInput
          question={question}
          value={answerValue(answer, 'short_answer')}
          onChange={(value) => onAnswer({ type: 'short_answer', value })}
          reveal={reveal}
        />
      )
  }
}
