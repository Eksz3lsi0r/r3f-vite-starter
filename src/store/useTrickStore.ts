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
  | 'FLIP'
  | 'SLING'
  | 'GHOST'
  | 'REWIND_FLIP'
  | 'REWIND_SLING'

/** Named combos: the sequence key maps to a human-readable trick name */
const COMBOS: Record<string, string> = {
  'THROW,CUP': 'Cup Catch!',
  'THROW,SPIKE': 'Spike!',
  'THROW,LEFT,CUP': 'Around Left Cup!',
  'THROW,RIGHT,CUP': 'Around Right Cup!',
  'THROW,TILT_LEFT,CUP': 'Lighthouse!',
  'THROW,TILT_RIGHT,CUP': 'Reverse Lighthouse!',
  'THROW,FLIP,CUP': 'Flip Cup!',
  'THROW,FLIP,SPIKE': 'Flip Spike!',
  'THROW,SLING,CUP': 'Sling Cup!',
  'THROW,SLING,SPIKE': 'Sling Spike!',
  'THROW,GHOST,CUP': 'Ghost Cup!',
  'THROW,GHOST,SPIKE': 'Ghost Spike!',
  'THROW,REWIND_FLIP,CUP': 'Rewind Flip Cup!',
  'THROW,REWIND_FLIP,SPIKE': 'Rewind Flip Spike!',
  'THROW,REWIND_SLING,CUP': 'Rewind Sling Cup!',
  'THROW,REWIND_SLING,SPIKE': 'Rewind Sling Spike!',
  'FLIP,CUP': 'Quick Flip!',
  'SLING,CUP': 'Quick Sling!',
  'GHOST,SPIKE': 'Ghost Spike!',
}

/** Point values for each combo (higher for harder tricks) */
export const COMBO_POINTS: Record<string, number> = {
  'Cup Catch!': 100,
  'Spike!': 150,
  'Around Left Cup!': 200,
  'Around Right Cup!': 200,
  'Lighthouse!': 300,
  'Reverse Lighthouse!': 300,
  'Flip Cup!': 250,
  'Flip Spike!': 350,
  'Sling Cup!': 250,
  'Sling Spike!': 350,
  'Ghost Cup!': 400,
  'Ghost Spike!': 500,
  'Rewind Flip Cup!': 450,
  'Rewind Flip Spike!': 550,
  'Rewind Sling Cup!': 450,
  'Rewind Sling Spike!': 550,
  'Quick Flip!': 150,
  'Quick Sling!': 150,
}

function detectCombo(sequence: InputKey[]): string | null {
  // Check longest possible combo first (last 3 inputs)
  for (let len = Math.min(sequence.length, 3); len >= 2; len--) {
    const key = sequence.slice(-len).join(',')
    if (COMBOS[key]) return COMBOS[key]
  }
  return null
}

export type PlayerId = 1 | 2

export interface PlayerTrickState {
  currentState: TrickState
  sequence: InputKey[]
  lastCombo: string | null
}

interface TrickStore {
  /** Per-player trick state */
  players: Record<PlayerId, PlayerTrickState>

  setCurrentState: (player: PlayerId, state: TrickState) => void
  addToSequence: (player: PlayerId, input: InputKey) => void
  resetSequence: (player: PlayerId) => void
}

const defaultPlayerState = (): PlayerTrickState => ({
  currentState: 'IDLE',
  sequence: [],
  lastCombo: null,
})

export const useTrickStore = create<TrickStore>((set) => ({
  players: { 1: defaultPlayerState(), 2: defaultPlayerState() },

  setCurrentState: (player, state) =>
    set((prev) => ({
      players: {
        ...prev.players,
        [player]: { ...prev.players[player], currentState: state },
      },
    })),

  addToSequence: (player, input) =>
    set((prev) => {
      const p = prev.players[player]
      const sequence = [...p.sequence.slice(-2), input]
      const lastCombo = detectCombo(sequence)
      return {
        players: {
          ...prev.players,
          [player]: { ...p, sequence, lastCombo },
        },
      }
    }),

  resetSequence: (player) =>
    set((prev) => ({
      players: {
        ...prev.players,
        [player]: { ...prev.players[player], sequence: [], lastCombo: null },
      },
    })),
}))
