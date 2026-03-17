import React, { useCallback, useEffect, useRef } from 'react'
import { type PlayerId } from '../store/useDuelStore'

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fireKey(code: string, down: boolean) {
  window.dispatchEvent(
    new KeyboardEvent(down ? 'keydown' : 'keyup', { code, bubbles: true }),
  )
}

// ─── Single touch-/mouse-aware button ─────────────────────────────────────────
interface BtnProps {
  label: string
  code: string
  style?: React.CSSProperties
  variant?: 'primary' | 'secondary' | 'trick' | 'special'
}

function Btn({ label, code, style, variant = 'primary' }: BtnProps) {
  const pressed = useRef(false)

  const press = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      e.preventDefault()
      if (!pressed.current) {
        pressed.current = true
        fireKey(code, true)
      }
    },
    [code],
  )

  const release = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      e.preventDefault()
      if (pressed.current) {
        pressed.current = false
        fireKey(code, false)
      }
    },
    [code],
  )

  const cancel = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault()
      if (pressed.current) {
        pressed.current = false
        fireKey(code, false)
      }
    },
    [code],
  )

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      background: 'rgba(255,255,255,0.18)',
      border: '2px solid rgba(255,255,255,0.4)',
    },
    secondary: {
      background: 'rgba(229,57,53,0.75)',
      border: '2px solid rgba(255,120,120,0.6)',
    },
    trick: {
      background: 'rgba(76,175,80,0.75)',
      border: '2px solid rgba(129,199,132,0.6)',
    },
    special: {
      background: 'rgba(156,39,176,0.75)',
      border: '2px solid rgba(186,104,200,0.6)',
    },
  }

  const baseStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 56,
    height: 56,
    borderRadius: 12,
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    cursor: 'pointer',
    userSelect: 'none',
    touchAction: 'none',
    WebkitTapHighlightColor: 'transparent',
    ...variantStyles[variant],
    ...style,
  }

  return (
    <div
      style={baseStyle}
      onTouchStart={press}
      onTouchEnd={release}
      onTouchCancel={cancel}
      onMouseDown={press}
      onMouseUp={release}
      onMouseLeave={release}
    >
      {label}
    </div>
  )
}

// ─── Player 1 Controls (Left Side) ───────────────────────────────────────────
function Player1Controls() {
  const gap = 4

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: gap * 2,
        pointerEvents: 'auto',
      }}
    >
      {/* D-pad */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 56px)',
          gridTemplateRows: 'repeat(3, 56px)',
          gap,
        }}
      >
        <div />
        <Btn label="↑" code="KeyW" />
        <div />
        <Btn label="←" code="KeyA" />
        <div />
        <Btn label="→" code="KeyD" />
        <div />
        <Btn label="↓" code="KeyS" />
        <div />
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap }}>
        <div style={{ display: 'flex', gap }}>
          <Btn label="↺" code="KeyQ" style={{ fontSize: 20 }} />
          <Btn label="↻" code="KeyE" style={{ fontSize: 20 }} />
        </div>
        <Btn
          label="THROW"
          code="Space"
          variant="secondary"
          style={{ width: 116, height: 48, fontSize: 14 }}
        />
      </div>

      {/* Advanced tricks */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap }}>
        <Btn label="FLIP" code="KeyF" variant="trick" style={{ fontSize: 12 }} />
        <Btn label="SLNG" code="KeyV" variant="trick" style={{ fontSize: 12 }} />
        <Btn label="GHST" code="KeyG" variant="special" style={{ fontSize: 12 }} />
        <Btn label="RWND" code="KeyR" variant="special" style={{ fontSize: 12 }} />
      </div>

      {/* Player label */}
      <div
        style={{
          textAlign: 'center',
          color: '#E53935',
          fontWeight: 'bold',
          fontSize: 16,
          fontFamily: 'monospace',
          textShadow: '0 0 8px rgba(229,57,53,0.8)',
        }}
      >
        P1
      </div>
    </div>
  )
}

// ─── Player 2 Controls (Right Side) ──────────────────────────────────────────
function Player2Controls() {
  const gap = 4

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: gap * 2,
        pointerEvents: 'auto',
      }}
    >
      {/* D-pad */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 56px)',
          gridTemplateRows: 'repeat(3, 56px)',
          gap,
        }}
      >
        <div />
        <Btn label="↑" code="ArrowUp" />
        <div />
        <Btn label="←" code="ArrowLeft" />
        <div />
        <Btn label="→" code="ArrowRight" />
        <div />
        <Btn label="↓" code="ArrowDown" />
        <div />
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap }}>
        <div style={{ display: 'flex', gap }}>
          <Btn label="↺" code="Comma" style={{ fontSize: 20 }} />
          <Btn label="↻" code="Period" style={{ fontSize: 20 }} />
        </div>
        <Btn
          label="THROW"
          code="Enter"
          variant="secondary"
          style={{ width: 116, height: 48, fontSize: 14 }}
        />
      </div>

      {/* Advanced tricks */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap }}>
        <Btn label="FLIP" code="KeyI" variant="trick" style={{ fontSize: 12 }} />
        <Btn label="SLNG" code="KeyK" variant="trick" style={{ fontSize: 12 }} />
        <Btn label="GHST" code="KeyO" variant="special" style={{ fontSize: 12 }} />
        <Btn label="RWND" code="KeyL" variant="special" style={{ fontSize: 12 }} />
      </div>

      {/* Player label */}
      <div
        style={{
          textAlign: 'center',
          color: '#2196F3',
          fontWeight: 'bold',
          fontSize: 16,
          fontFamily: 'monospace',
          textShadow: '0 0 8px rgba(33,150,243,0.8)',
        }}
      >
        P2
      </div>
    </div>
  )
}

// ─── Full dual mobile controls overlay ───────────────────────────────────────
export function DuelMobileControls() {
  const hasTouchRef = useRef(
    typeof window !== 'undefined' && 'ontouchstart' in window,
  )

  useEffect(() => {
    const onTouch = () => {
      hasTouchRef.current = true
    }
    window.addEventListener('touchstart', onTouch, { once: true })
    return () => window.removeEventListener('touchstart', onTouch)
  }, [])

  if (!hasTouchRef.current) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 12,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        padding: '0 12px',
        pointerEvents: 'none',
        zIndex: 200,
      }}
    >
      <Player1Controls />
      <Player2Controls />
    </div>
  )
}
