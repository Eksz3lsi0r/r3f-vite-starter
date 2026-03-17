import React, { useCallback, useEffect, useRef } from 'react'
import { useDuelStore } from '../store/useDuelStore'

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
    width: 54,
    height: 54,
    borderRadius: 12,
    background: 'rgba(255,255,255,0.18)',
    border: '2px solid rgba(255,255,255,0.4)',
    color: '#fff',
    fontSize: 18,
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

// ─── Trick action button (coloured) ──────────────────────────────────────────
function TrickBtn({ label, code, bg, border }: BtnProps & { bg: string; border: string }) {
  return (
    <Btn
      label={label}
      code={code}
      style={{
        width: 70,
        height: 48,
        fontSize: 11,
        background: bg,
        border: `2px solid ${border}`,
        borderRadius: 10,
        lineHeight: 1.1,
        textAlign: 'center',
        whiteSpace: 'pre-line',
      }}
    />
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

  const switchPlayer = useDuelStore((s) => s.switchPlayer)
  const activePlayer = useDuelStore((s) => s.activePlayer)

  if (!hasTouchRef.current) return null

  const gap = 5

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 12,
        left: 0,
        right: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        padding: '0 12px',
        pointerEvents: 'none',
        zIndex: 200,
      }}
    >
      {/* ── Top row: Trick buttons ───────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap,
          pointerEvents: 'auto',
          flexWrap: 'wrap',
        }}
      >
        <TrickBtn
          label="FLIP"
          code="KeyF"
          bg="rgba(156,39,176,0.7)"
          border="rgba(206,147,216,0.7)"
        />
        <TrickBtn
          label="SLING"
          code="KeyG"
          bg="rgba(0,150,136,0.7)"
          border="rgba(128,203,196,0.7)"
        />
        <TrickBtn
          label="GHOST"
          code="KeyH"
          bg="rgba(63,81,181,0.7)"
          border="rgba(159,168,218,0.7)"
        />
        <TrickBtn
          label={'RW\nFLIP'}
          code="KeyR"
          bg="rgba(233,30,99,0.7)"
          border="rgba(248,187,208,0.7)"
        />
        <TrickBtn
          label={'RW\nSLING'}
          code="KeyT"
          bg="rgba(255,152,0,0.7)"
          border="rgba(255,204,128,0.7)"
        />
      </div>

      {/* ── Bottom row: D-pad + Throw + Spin + Switch ────────────────────── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          width: '100%',
          pointerEvents: 'none',
        }}
      >
        {/* ── Left side: D-pad ───────────────────────────────────────────── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 54px)',
            gridTemplateRows: 'repeat(3, 54px)',
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

        {/* ── Right side: Throw + Spin + Switch ─────────────────────────── */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap,
            pointerEvents: 'auto',
          }}
        >
          {/* Player switch button */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 110,
              height: 36,
              borderRadius: 8,
              background:
                activePlayer === 1
                  ? 'rgba(229,57,53,0.6)'
                  : 'rgba(30,136,229,0.6)',
              border: '2px solid rgba(255,255,255,0.4)',
              color: '#fff',
              fontSize: 12,
              fontWeight: 'bold',
              fontFamily: 'monospace',
              cursor: 'pointer',
              userSelect: 'none',
              touchAction: 'none',
            }}
            onTouchStart={(e) => {
              e.preventDefault()
              switchPlayer()
            }}
            onMouseDown={(e) => {
              e.preventDefault()
              switchPlayer()
            }}
          >
            ⇄ P{activePlayer}
          </div>

          {/* Spin buttons side by side */}
          <div style={{ display: 'flex', gap }}>
            <Btn label="↺" code="KeyQ" style={{ width: 50, height: 50, fontSize: 18 }} />
            <Btn label="↻" code="KeyE" style={{ width: 50, height: 50, fontSize: 18 }} />
          </div>
          {/* Throw — large prominent button */}
          <Btn
            label="THROW"
            code="Space"
            style={{
              width: 110,
              height: 58,
              fontSize: 15,
              background: 'rgba(229,57,53,0.75)',
              border: '2px solid rgba(255,120,120,0.6)',
              borderRadius: 16,
            }}
          />
        </div>
      </div>
    </div>
  )
}
