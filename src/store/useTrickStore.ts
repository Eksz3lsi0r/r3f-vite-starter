import { create } from 'zustand'

/** All possible states the kendama rig can be in */
export type TrickState = 'IDLE' | 'AIRBORNE' | 'CUPPED' | 'SPIKED'

/** Every discrete input that can be appended to the sequence */
export type InputKey =
  | 'THROW'
  | 'LEFT'
  | 'RIGHT'
  | 'FORWARD'
  | 'BACK'
  | 'TILT_LEFT'
  | 'TILT_RIGHT'
  | 'CUP'
  | 'SPIKE'

/** Named combos: the sequence key maps to a human-readable trick name */
const COMBOS: Record<string, string> = {
  'THROW,CUP': 'Cup Catch!',
  'THROW,SPIKE': 'Spike!',
  'THROW,LEFT,CUP': 'Around Left Cup!',
  'THROW,RIGHT,CUP': 'Around Right Cup!',
  'THROW,TILT_LEFT,CUP': 'Lighthouse!',
  'THROW,TILT_RIGHT,CUP': 'Reverse Lighthouse!',
}

function detectCombo(sequence: InputKey[]): string | null {
  // Check longest possible combo first (last 3 inputs)
  for (let len = Math.min(sequence.length, 3); len >= 2; len--) {
    const key = sequence.slice(-len).join(',')
    if (COMBOS[key]) return COMBOS[key]
  }
  return null
}

interface TrickStore {
  /** Current physics/trick state of the kendama */
  currentState: TrickState
  /** Sliding window of the last 3 discrete inputs */
  sequence: InputKey[]
  /** Most recently detected combo name, or null */
  lastCombo: string | null

  setCurrentState: (state: TrickState) => void
  addToSequence: (input: InputKey) => void
  resetSequence: () => void
}

export const useTrickStore = create<TrickStore>((set) => ({
  currentState: 'IDLE',
  sequence: [],
  lastCombo: null,

  setCurrentState: (state) => set({ currentState: state }),

  addToSequence: (input) =>
    set((prev) => {
      // Retain the last 2 entries then append the new one → window of 3
      const sequence = [...prev.sequence.slice(-2), input]
      const lastCombo = detectCombo(sequence)
      return { sequence, lastCombo }
    }),

  resetSequence: () => set({ sequence: [], lastCombo: null }),
}))
