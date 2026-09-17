export type UIState = 'idle' | 'listening' | 'thinking' | 'talking' | 'executing'

export interface UIStateContext {
  currentState: UIState
  setState: (state: UIState) => void
  micLevel: number
  setMicLevel: (level: number) => void
  transcript: string[]
  addTranscript: (text: string) => void
  clearTranscript: () => void
}