import { useEffect, useState } from 'react'
import { useDuelStore, type PlayerId } from '../store/useDuelStore'

// ─── Time Window Progress Bar ────────────────────────────────────────────────
interface TimeWindowBarProps {
  playerId: PlayerId
}

function TimeWindowBar({ playerId }: TimeWindowBarProps) {
  const player = useDuelStore((s) => s[`player${playerId}` as 'player1' | 'player2'])
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!player.timeWindow.active) {
      setProgress(0)
      return
    }

    const interval = setInterval(() => {
      const elapsed = Date.now() - player.timeWindow.startTime
      const pct = Math.min((elapsed / player.timeWindow.duration) * 100, 100)
      setProgress(pct)

      if (pct >= 100) {
        clearInterval(interval)
      }
    }, 16) // ~60fps

    return () => clearInterval(interval)
  }, [player.timeWindow.active, player.timeWindow.startTime, player.timeWindow.duration])

  if (!player.timeWindow.active) return null

  const trickName = player.timeWindow.trickType?.toUpperCase() || 'TRICK'
  const barColor = playerId === 1 ? '#E53935' : '#2196F3'

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: 24,
        background: 'rgba(0,0,0,0.5)',
        borderRadius: 4,
        overflow: 'hidden',
        border: `2px solid ${barColor}`,
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          height: '100%',
          width: `${100 - progress}%`,
          background: barColor,
          transition: 'width 16ms linear',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontWeight: 'bold',
          fontSize: 12,
          fontFamily: 'monospace',
          textShadow: '0 1px 2px rgba(0,0,0,0.8)',
        }}
      >
        {trickName} WINDOW
      </div>
    </div>
  )
}

// ─── Player Score Card ───────────────────────────────────────────────────────
interface PlayerScoreProps {
  playerId: PlayerId
  position: 'left' | 'right'
}

function PlayerScore({ playerId, position }: PlayerScoreProps) {
  const player = useDuelStore((s) => s[`player${playerId}` as 'player1' | 'player2'])
  const phase = useDuelStore((s) => s.phase)

  const isActive =
    (playerId === 1 && phase === 'PLAYER_1_TURN') ||
    (playerId === 2 && phase === 'PLAYER_2_TURN')

  const color = playerId === 1 ? '#E53935' : '#2196F3'
  const align = position === 'left' ? 'flex-start' : 'flex-end'

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: align,
        gap: 8,
        minWidth: 200,
      }}
    >
      {/* Player name & status */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          color: '#fff',
          fontFamily: 'monospace',
          fontSize: 20,
          fontWeight: 'bold',
        }}
      >
        {position === 'left' && isActive && <span style={{ color }}>▶</span>}
        <span style={{ color }}>PLAYER {playerId}</span>
        {position === 'right' && isActive && <span style={{ color }}>◀</span>}
      </div>

      {/* Score */}
      <div
        style={{
          fontSize: 48,
          fontWeight: 'bold',
          fontFamily: 'monospace',
          color,
          textShadow: `0 0 12px ${color}`,
          lineHeight: 1,
        }}
      >
        {player.score}
      </div>

      {/* Rounds won */}
      <div
        style={{
          display: 'flex',
          gap: 4,
          alignItems: 'center',
        }}
      >
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            style={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: i < player.roundsWon ? color : 'rgba(255,255,255,0.2)',
              border: `2px solid ${color}`,
            }}
          />
        ))}
      </div>

      {/* Combo multiplier */}
      {player.comboMultiplier > 1 && (
        <div
          style={{
            fontSize: 14,
            fontFamily: 'monospace',
            color: '#FFD700',
            fontWeight: 'bold',
          }}
        >
          ×{player.comboMultiplier.toFixed(1)} COMBO
        </div>
      )}

      {/* Current trick */}
      {player.currentTrick && (
        <div
          style={{
            fontSize: 12,
            fontFamily: 'monospace',
            color: '#4CAF50',
            fontWeight: 'bold',
          }}
        >
          {player.currentTrick.toUpperCase()}...
        </div>
      )}

      {/* Last trick result */}
      {player.lastTrickSuccess !== null && (
        <div
          style={{
            fontSize: 14,
            fontFamily: 'monospace',
            color: player.lastTrickSuccess ? '#4CAF50' : '#F44336',
            fontWeight: 'bold',
            animation: 'fadeOut 2s forwards',
          }}
        >
          {player.lastTrickSuccess ? '✓ SUCCESS' : '✗ FAILED'}
        </div>
      )}

      {/* Time window bar */}
      <TimeWindowBar playerId={playerId} />
    </div>
  )
}

// ─── Round Display ───────────────────────────────────────────────────────────
function RoundDisplay() {
  const currentRound = useDuelStore((s) => s.currentRound)
  const maxRounds = useDuelStore((s) => s.maxRounds)
  const phase = useDuelStore((s) => s.phase)

  return (
    <div
      style={{
        position: 'absolute',
        top: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(0,0,0,0.7)',
        padding: '12px 24px',
        borderRadius: 8,
        border: '2px solid rgba(255,255,255,0.4)',
        color: '#fff',
        fontFamily: 'monospace',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        zIndex: 100,
      }}
    >
      <div>ROUND {currentRound} / {maxRounds}</div>
      {phase === 'ROUND_END' && (
        <div style={{ fontSize: 14, marginTop: 4, color: '#FFD700' }}>
          ROUND COMPLETE
        </div>
      )}
      {phase === 'MATCH_END' && (
        <div style={{ fontSize: 20, marginTop: 8, color: '#4CAF50' }}>
          🏆 MATCH COMPLETE 🏆
        </div>
      )}
    </div>
  )
}

// ─── Game Controls ───────────────────────────────────────────────────────────
function GameControls() {
  const phase = useDuelStore((s) => s.phase)
  const startDuel = useDuelStore((s) => s.startDuel)
  const nextRound = useDuelStore((s) => s.nextRound)
  const switchTurn = useDuelStore((s) => s.switchTurn)
  const player1 = useDuelStore((s) => s.player1)
  const player2 = useDuelStore((s) => s.player2)

  const getWinner = () => {
    if (player1.roundsWon > player2.roundsWon) return 'PLAYER 1 WINS!'
    if (player2.roundsWon > player1.roundsWon) return 'PLAYER 2 WINS!'
    return 'TIE GAME!'
  }

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 180,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        alignItems: 'center',
        zIndex: 100,
      }}
    >
      {phase === 'READY' && (
        <button
          onClick={startDuel}
          style={{
            padding: '16px 32px',
            fontSize: 20,
            fontWeight: 'bold',
            fontFamily: 'monospace',
            background: '#4CAF50',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          START DUEL
        </button>
      )}

      {(phase === 'PLAYER_1_TURN' || phase === 'PLAYER_2_TURN') && (
        <button
          onClick={switchTurn}
          style={{
            padding: '12px 24px',
            fontSize: 16,
            fontWeight: 'bold',
            fontFamily: 'monospace',
            background: '#FF9800',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          END TURN
        </button>
      )}

      {phase === 'ROUND_END' && (
        <button
          onClick={nextRound}
          style={{
            padding: '16px 32px',
            fontSize: 18,
            fontWeight: 'bold',
            fontFamily: 'monospace',
            background: '#2196F3',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          NEXT ROUND
        </button>
      )}

      {phase === 'MATCH_END' && (
        <>
          <div
            style={{
              fontSize: 32,
              fontWeight: 'bold',
              fontFamily: 'monospace',
              color: '#FFD700',
              textShadow: '0 0 20px rgba(255,215,0,0.8)',
            }}
          >
            {getWinner()}
          </div>
          <button
            onClick={startDuel}
            style={{
              padding: '16px 32px',
              fontSize: 18,
              fontWeight: 'bold',
              fontFamily: 'monospace',
              background: '#4CAF50',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}
          >
            PLAY AGAIN
          </button>
        </>
      )}
    </div>
  )
}

// ─── Main Duel HUD ───────────────────────────────────────────────────────────
export function DuelHUD() {
  return (
    <>
      {/* Add fadeOut animation */}
      <style>{`
        @keyframes fadeOut {
          0% { opacity: 1; }
          70% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>

      {/* Round display */}
      <RoundDisplay />

      {/* Score cards */}
      <div
        style={{
          position: 'fixed',
          top: 100,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'space-between',
          padding: '0 32px',
          pointerEvents: 'none',
          zIndex: 100,
        }}
      >
        <PlayerScore playerId={1} position="left" />
        <PlayerScore playerId={2} position="right" />
      </div>

      {/* Game controls */}
      <GameControls />

      {/* Instructions */}
      <div
        style={{
          position: 'fixed',
          bottom: 12,
          left: '50%',
          transform: 'translateX(-50%)',
          color: '#fff',
          fontFamily: 'monospace',
          fontSize: 11,
          opacity: 0.6,
          textAlign: 'center',
          pointerEvents: 'none',
          zIndex: 50,
        }}
      >
        P1: WASD + Space | P2: Arrows + Enter
        <br />
        FLIP • SLING • GHOST • REWIND
      </div>
    </>
  )
}
