import { create } from 'zustand'

export type PlayerId = 1 | 2

export type AdvancedTrick = 'flip' | 'sling' | 'ghost' | 'rewind_flip' | 'rewind_sling'

export type DuelPhase = 'READY' | 'PLAYER_1_TURN' | 'PLAYER_2_TURN' | 'ROUND_END' | 'MATCH_END'

export interface TimeWindow {
  active: boolean
  startTime: number
  duration: number // in milliseconds
  trickType: AdvancedTrick | null
}

export interface PlayerState {
  score: number
  roundsWon: number
  currentTrick: AdvancedTrick | null
  timeWindow: TimeWindow
  lastTrickSuccess: boolean | null
  comboMultiplier: number
}

interface DuelStore {
  // Game state
  phase: DuelPhase
  currentRound: number
  maxRounds: number

  // Player states
  player1: PlayerState
  player2: PlayerState

  // Actions
  startDuel: () => void
  nextRound: () => void
  switchTurn: () => void
  setPhase: (phase: DuelPhase) => void

  // Player actions
  startTrick: (playerId: PlayerId, trick: AdvancedTrick) => void
  completeTrick: (playerId: PlayerId, success: boolean, points: number) => void
  activateTimeWindow: (playerId: PlayerId, trick: AdvancedTrick, duration: number) => void
  checkTimeWindow: (playerId: PlayerId) => boolean

  // Scoring
  addPoints: (playerId: PlayerId, points: number) => void
  resetPlayer: (playerId: PlayerId) => void
  determineRoundWinner: () => PlayerId | null
}

const initialPlayerState: PlayerState = {
  score: 0,
  roundsWon: 0,
  currentTrick: null,
  timeWindow: {
    active: false,
    startTime: 0,
    duration: 0,
    trickType: null,
  },
  lastTrickSuccess: null,
  comboMultiplier: 1,
}

export const useDuelStore = create<DuelStore>((set, get) => ({
  phase: 'READY',
  currentRound: 1,
  maxRounds: 3, // Best of 3

  player1: { ...initialPlayerState },
  player2: { ...initialPlayerState },

  startDuel: () => set({
    phase: 'PLAYER_1_TURN',
    currentRound: 1,
    player1: { ...initialPlayerState },
    player2: { ...initialPlayerState },
  }),

  nextRound: () => {
    const state = get()
    const winner = state.determineRoundWinner()

    if (winner) {
      const playerKey = `player${winner}` as 'player1' | 'player2'
      set(prev => ({
        [playerKey]: {
          ...prev[playerKey],
          roundsWon: prev[playerKey].roundsWon + 1,
        },
      }))
    }

    const newRound = state.currentRound + 1
    if (newRound > state.maxRounds) {
      set({ phase: 'MATCH_END' })
    } else {
      set({
        currentRound: newRound,
        phase: 'PLAYER_1_TURN',
        player1: { ...initialPlayerState, roundsWon: state.player1.roundsWon },
        player2: { ...initialPlayerState, roundsWon: state.player2.roundsWon },
      })
    }
  },

  switchTurn: () => {
    const state = get()
    if (state.phase === 'PLAYER_1_TURN') {
      set({ phase: 'PLAYER_2_TURN' })
    } else if (state.phase === 'PLAYER_2_TURN') {
      set({ phase: 'ROUND_END' })
    }
  },

  setPhase: (phase) => set({ phase }),

  startTrick: (playerId, trick) => {
    const playerKey = `player${playerId}` as 'player1' | 'player2'
    set(prev => ({
      [playerKey]: {
        ...prev[playerKey],
        currentTrick: trick,
        lastTrickSuccess: null,
      },
    }))
  },

  completeTrick: (playerId, success, points) => {
    const playerKey = `player${playerId}` as 'player1' | 'player2'
    set(prev => {
      const player = prev[playerKey]
      const multiplier = success ? player.comboMultiplier : 1
      const finalPoints = success ? points * multiplier : 0
      const newMultiplier = success ? Math.min(player.comboMultiplier + 0.5, 3) : 1

      return {
        [playerKey]: {
          ...player,
          score: player.score + finalPoints,
          currentTrick: null,
          lastTrickSuccess: success,
          comboMultiplier: newMultiplier,
          timeWindow: {
            ...player.timeWindow,
            active: false,
          },
        },
      }
    })
  },

  activateTimeWindow: (playerId, trick, duration) => {
    const playerKey = `player${playerId}` as 'player1' | 'player2'
    set(prev => ({
      [playerKey]: {
        ...prev[playerKey],
        timeWindow: {
          active: true,
          startTime: Date.now(),
          duration,
          trickType: trick,
        },
      },
    }))
  },

  checkTimeWindow: (playerId) => {
    const state = get()
    const player = state[`player${playerId}` as 'player1' | 'player2']
    if (!player.timeWindow.active) return false

    const elapsed = Date.now() - player.timeWindow.startTime
    const isValid = elapsed <= player.timeWindow.duration

    if (!isValid) {
      // Time window expired, deactivate it
      const playerKey = `player${playerId}` as 'player1' | 'player2'
      set(prev => ({
        [playerKey]: {
          ...prev[playerKey],
          timeWindow: {
            ...prev[playerKey].timeWindow,
            active: false,
          },
        },
      }))
    }

    return isValid
  },

  addPoints: (playerId, points) => {
    const playerKey = `player${playerId}` as 'player1' | 'player2'
    set(prev => ({
      [playerKey]: {
        ...prev[playerKey],
        score: prev[playerKey].score + points,
      },
    }))
  },

  resetPlayer: (playerId) => {
    const playerKey = `player${playerId}` as 'player1' | 'player2'
    set(prev => ({
      [playerKey]: {
        ...initialPlayerState,
        roundsWon: prev[playerKey].roundsWon,
      },
    }))
  },

  determineRoundWinner: () => {
    const state = get()
    if (state.player1.score > state.player2.score) return 1
    if (state.player2.score > state.player1.score) return 2
    return null // Tie
  },
}))
