import { useEffect, useState } from 'react'
import { useDuelStore } from '../store/useDuelStore'

/** Duel overlay showing round info, scores, active player, and time window */
export function DuelHUD() {
  const activePlayer = useDuelStore((s) => s.activePlayer)
  const round = useDuelStore((s) => s.round)
  const maxRounds = useDuelStore((s) => s.maxRounds)
  const scores = useDuelStore((s) => s.scores)
  const timeWindow = useDuelStore((s) => s.timeWindow)
  const duelOver = useDuelStore((s) => s.duelOver)
  const switchPlayer = useDuelStore((s) => s.switchPlayer)
  const nextRound = useDuelStore((s) => s.nextRound)
  const resetDuel = useDuelStore((s) => s.resetDuel)

  // Time window countdown
  const [timeLeft, setTimeLeft] = useState(0)

  useEffect(() => {
    if (!timeWindow) {
      setTimeLeft(0)
      return
    }
    const update = () => {
      const remaining = Math.max(
        0,
        timeWindow.duration - (Date.now() - timeWindow.startedAt),
      )
      setTimeLeft(remaining)
    }
    update()
    const id = setInterval(update, 50)
    return () => clearInterval(id)
  }, [timeWindow])

  // Auto-clear expired time windows
  useEffect(() => {
    if (timeWindow && timeLeft <= 0) {
      useDuelStore.getState().clearTimeWindow()
    }
  }, [timeWindow, timeLeft])

  const p1Active = activePlayer === 1
  const winner = duelOver
    ? scores[1] > scores[2]
      ? 'P1 Wins!'
      : scores[2] > scores[1]
        ? 'P2 Wins!'
        : 'Draw!'
    : null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        pointerEvents: 'none',
        zIndex: 150,
        fontFamily: 'monospace',
      }}
    >
      {/* ── Top scoreboard bar ────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 16,
          padding: '8px 20px',
          background: 'rgba(0,0,0,0.6)',
          borderRadius: '0 0 12px 12px',
          color: '#fff',
          fontSize: 15,
          minWidth: 320,
          pointerEvents: 'auto',
        }}
      >
        {/* P1 score */}
        <div
          style={{
            padding: '4px 12px',
            borderRadius: 6,
            background: p1Active ? 'rgba(229,57,53,0.7)' : 'rgba(255,255,255,0.1)',
            fontWeight: p1Active ? 'bold' : 'normal',
            border: p1Active ? '2px solid #ff8a80' : '2px solid transparent',
          }}
        >
          🔴 P1: {scores[1]}
        </div>

        {/* Round indicator */}
        <div style={{ fontSize: 13, opacity: 0.85 }}>
          Round {round}/{maxRounds}
        </div>

        {/* P2 score */}
        <div
          style={{
            padding: '4px 12px',
            borderRadius: 6,
            background: !p1Active ? 'rgba(30,136,229,0.7)' : 'rgba(255,255,255,0.1)',
            fontWeight: !p1Active ? 'bold' : 'normal',
            border: !p1Active ? '2px solid #82b1ff' : '2px solid transparent',
          }}
        >
          🔵 P2: {scores[2]}
        </div>
      </div>

      {/* ── Time window indicator ──────────────────────────────────────────── */}
      {timeWindow && timeLeft > 0 && (
        <div
          style={{
            marginTop: 6,
            padding: '4px 16px',
            background: 'rgba(255,193,7,0.85)',
            borderRadius: 8,
            color: '#000',
            fontWeight: 'bold',
            fontSize: 13,
            animation: 'pulse 0.5s ease-in-out infinite alternate',
          }}
        >
          ⏱ {timeWindow.type.replace('_', ' ')} window:{' '}
          {(timeLeft / 1000).toFixed(1)}s — Land it for bonus!
        </div>
      )}

      {/* ── Duel controls ──────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          marginTop: 6,
          pointerEvents: 'auto',
        }}
      >
        {!duelOver && (
          <>
            <button onClick={switchPlayer} style={btnStyle}>
              ⇄ Switch Player
            </button>
            <button onClick={nextRound} style={btnStyle}>
              ▶ Next Round
            </button>
          </>
        )}
        {duelOver && (
          <button onClick={resetDuel} style={{ ...btnStyle, background: 'rgba(76,175,80,0.8)' }}>
            🔄 New Duel
          </button>
        )}
      </div>

      {/* ── Winner overlay ─────────────────────────────────────────────────── */}
      {winner && (
        <div
          style={{
            marginTop: 20,
            padding: '16px 32px',
            background: 'rgba(0,0,0,0.8)',
            borderRadius: 12,
            color: '#ffe135',
            fontWeight: 'bold',
            fontSize: 28,
            textAlign: 'center',
            border: '3px solid #ffe135',
          }}
        >
          🏆 {winner}
          <div style={{ fontSize: 14, color: '#fff', marginTop: 4, fontWeight: 'normal' }}>
            Final: P1 {scores[1]} – P2 {scores[2]}
          </div>
        </div>
      )}
    </div>
  )
}

const btnStyle: React.CSSProperties = {
  padding: '4px 12px',
  background: 'rgba(255,255,255,0.15)',
  border: '1px solid rgba(255,255,255,0.3)',
  borderRadius: 6,
  color: '#fff',
  fontFamily: 'monospace',
  fontSize: 12,
  cursor: 'pointer',
}
