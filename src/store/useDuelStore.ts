import { create } from 'zustand'
import { type PlayerId, COMBO_POINTS } from './useTrickStore'

/** Time-window trick types that players can attempt */
export type TimeWindowTrick =
  | 'FLIP'
  | 'SLING'
  | 'GHOST'
  | 'REWIND_FLIP'
  | 'REWIND_SLING'

export interface TimeWindow {
  type: TimeWindowTrick
  /** Timestamp (ms) when the window opened */
  startedAt: number
  /** Duration in ms */
  duration: number
}

interface DuelStore {
  /** Which player is currently active (controls their kendama) */
  activePlayer: PlayerId
  /** Current round number (1-based) */
  round: number
  /** Total rounds in the duel */
  maxRounds: number
  /** Per-player scores */
  scores: Record<PlayerId, number>
  /** Active time window (null when none) */
  timeWindow: TimeWindow | null
  /** Whether the duel has ended */
  duelOver: boolean

  switchPlayer: () => void
  nextRound: () => void
  startTimeWindow: (type: TimeWindowTrick, durationMs?: number) => void
  clearTimeWindow: () => void
  addScore: (player: PlayerId, comboName: string) => void
  resetDuel: () => void
}

/** Default time window durations (ms) per trick type */
const TIME_WINDOW_DURATIONS: Record<TimeWindowTrick, number> = {
  FLIP: 2000,
  SLING: 2500,
  GHOST: 1800,
  REWIND_FLIP: 2200,
  REWIND_SLING: 2800,
}

/** Bonus multiplier applied when a trick lands during an active time window */
const TIME_WINDOW_BONUS_MULTIPLIER = 0.5

export const useDuelStore = create<DuelStore>((set) => ({
  activePlayer: 1,
  round: 1,
  maxRounds: 5,
  scores: { 1: 0, 2: 0 },
  timeWindow: null,
  duelOver: false,

  switchPlayer: () =>
    set((prev) => ({
      activePlayer: prev.activePlayer === 1 ? 2 : 1,
    })),

  nextRound: () =>
    set((prev) => {
      const nextRound = prev.round + 1
      if (nextRound > prev.maxRounds) {
        return { duelOver: true }
      }
      return { round: nextRound, activePlayer: 1, timeWindow: null }
    }),

  startTimeWindow: (type, durationMs) =>
    set(() => ({
      timeWindow: {
        type,
        startedAt: Date.now(),
        duration: durationMs ?? TIME_WINDOW_DURATIONS[type],
      },
    })),

  clearTimeWindow: () => set({ timeWindow: null }),

  addScore: (player, comboName) =>
    set((prev) => {
      const points = COMBO_POINTS[comboName] ?? 100
      const windowBonus = prev.timeWindow ? Math.round(points * TIME_WINDOW_BONUS_MULTIPLIER) : 0
      return {
        scores: {
          ...prev.scores,
          [player]: prev.scores[player] + points + windowBonus,
        },
      }
    }),

  resetDuel: () =>
    set({
      activePlayer: 1,
      round: 1,
      scores: { 1: 0, 2: 0 },
      timeWindow: null,
      duelOver: false,
    }),
}))
