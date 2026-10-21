export type InputProps<Q, V> = {
  question: Q
  value: V | undefined
  onChange: (value: V) => void
  // when true the input is locked and the correct answer is shown
  reveal: boolean
}
