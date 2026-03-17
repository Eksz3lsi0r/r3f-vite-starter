import React, { useCallback, useEffect, useRef } from 'react'

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
}

function Btn({ label, code, style }: BtnProps) {
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

  // Safety: release key if touch is cancelled (e.g. system interrupts)
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

  const baseStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 60,
    borderRadius: 12,
    background: 'rgba(255,255,255,0.18)',
    border: '2px solid rgba(255,255,255,0.4)',
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    cursor: 'pointer',
    userSelect: 'none',
    touchAction: 'none',
    WebkitTapHighlightColor: 'transparent',
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

// ─── Full mobile controls overlay ─────────────────────────────────────────────
export function MobileControls() {
  // Detect touch support; hide overlay on pure-pointer devices so it doesn't
  // clutter the desktop experience for keyboard users.
  const hasTouchRef = useRef(
    typeof window !== 'undefined' && 'ontouchstart' in window,
  )

  // Re-check after first user interaction in case the browser reports touch
  // capability lazily (some desktop Chrome setups).
  useEffect(() => {
    const onTouch = () => {
      hasTouchRef.current = true
    }
    window.addEventListener('touchstart', onTouch, { once: true })
    return () => window.removeEventListener('touchstart', onTouch)
  }, [])

  if (!hasTouchRef.current) return null

  const gap = 6

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        padding: '0 24px',
        pointerEvents: 'none',
        zIndex: 200,
      }}
    >
      {/* ── Left side: D-pad ─────────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 60px)',
          gridTemplateRows: 'repeat(3, 60px)',
          gap,
          pointerEvents: 'auto',
        }}
      >
        {/* Row 1 */}
        <div />
        <Btn label="↑" code="ArrowUp" />
        <div />
        {/* Row 2 */}
        <Btn label="←" code="ArrowLeft" />
        <div />
        <Btn label="→" code="ArrowRight" />
        {/* Row 3 */}
        <div />
        <Btn label="↓" code="ArrowDown" />
        <div />
      </div>

      {/* ── Right side: Throw + Spin ────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap,
          pointerEvents: 'auto',
        }}
      >
        {/* Spin buttons side by side */}
        <div style={{ display: 'flex', gap }}>
          <Btn label="↺" code="KeyQ" style={{ width: 56, height: 56, fontSize: 20 }} />
          <Btn label="↻" code="KeyE" style={{ width: 56, height: 56, fontSize: 20 }} />
        </div>
        {/* Throw — large prominent button */}
        <Btn
          label="THROW"
          code="Space"
          style={{
            width: 118,
            height: 64,
            fontSize: 16,
            background: 'rgba(229,57,53,0.75)',
            border: '2px solid rgba(255,120,120,0.6)',
            borderRadius: 16,
          }}
        />
      </div>
    </div>
  )
}
