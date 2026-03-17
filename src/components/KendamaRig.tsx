import { createRef, useEffect, useRef } from 'react'
import {
  BallCollider,
  CuboidCollider,
  RigidBody,
  useSphericalJoint,
  type RapierRigidBody,
} from '@react-three/rapier'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useTrickStore, type PlayerId, COMBO_POINTS } from '../store/useTrickStore'
import { useDuelStore } from '../store/useDuelStore'

// ─── Rope / rig constants ────────────────────────────────────────────────────
const STRING_SEGMENTS = 6
const SEGMENT_LENGTH = 0.1 // metres between consecutive segment centres
const SEGMENT_RADIUS = 0.005

const KEN_HALF_HEIGHT = 0.15 // visual half-height of the handle cylinder
const KEN_START_Y = 2.2 // initial Y for the Ken

const TAMA_RADIUS = 0.12 // ball radius
// Tama hangs below the last string segment
const TAMA_START_Y =
  KEN_START_Y -
  KEN_HALF_HEIGHT -
  (STRING_SEGMENTS + 1) * SEGMENT_LENGTH -
  TAMA_RADIUS

// ─── Trick physics tuning ────────────────────────────────────────────────────
const TRICK_PHYSICS = {
  THROW:        { impulseY: 4.5 },
  MOVE:         { impulseScale: 0.18 },
  SPIN:         { torqueScale: 0.08 },
  FLIP:         { torqueX: 0.15, impulseY: 1.5 },       // forward torque + lift
  SLING:        { impulseX: 1.2, impulseY: 2.0, torqueZ: 0.1 }, // lateral swing + lift
  GHOST:        { impulseY: 0.8 },                       // subtle upward lift
  REWIND_FLIP:  { torqueX: -0.15, impulseY: 1.5 },      // reverse flip
  REWIND_SLING: { impulseX: -1.2, impulseY: 2.0, torqueZ: -0.1 }, // reverse sling
} as const

// Player colours
const PLAYER_COLORS: Record<PlayerId, { tama: string; ken: string; cup: string }> = {
  1: { tama: '#E53935', ken: '#8B4513', cup: '#A0522D' },
  2: { tama: '#1E88E5', ken: '#4A148C', cup: '#6A1B9A' },
}

// ─── Spherical joint helper component ───────────────────────────────────────
// We put each joint in its own component so the hook is called at the top level
// of a valid React component (not inside a loop).
interface StringJointProps {
  bodyA: React.RefObject<RapierRigidBody | null>
  bodyB: React.RefObject<RapierRigidBody | null>
  anchorA: [number, number, number]
  anchorB: [number, number, number]
}

function StringJoint({ bodyA, bodyB, anchorA, anchorB }: StringJointProps) {
  useSphericalJoint(bodyA, bodyB, [anchorA, anchorB])
  return null
}

// ─── Rope visual ─────────────────────────────────────────────────────────────
// Draws a thin line (TubeGeometry rebuilt each frame) through all rope nodes.
interface RopeVisualProps {
  kenRef: React.RefObject<RapierRigidBody | null>
  segmentRefs: React.MutableRefObject<React.RefObject<RapierRigidBody | null>[]>
  tamaRef: React.RefObject<RapierRigidBody | null>
}

function RopeVisual({ kenRef, segmentRefs, tamaRef }: RopeVisualProps) {
  const lineRef = useRef<THREE.Mesh>(null)
  const tubeRef = useRef<THREE.TubeGeometry | null>(null)

  useFrame(() => {
    if (!lineRef.current) return

    const pts: THREE.Vector3[] = []

    // Ken attachment point (bottom of handle, in world space)
    if (kenRef.current) {
      const p = kenRef.current.translation()
      const q = new THREE.Quaternion(
        kenRef.current.rotation().x,
        kenRef.current.rotation().y,
        kenRef.current.rotation().z,
        kenRef.current.rotation().w,
      )
      const local = new THREE.Vector3(0, -KEN_HALF_HEIGHT, 0).applyQuaternion(q)
      pts.push(new THREE.Vector3(p.x + local.x, p.y + local.y, p.z + local.z))
    }

    for (const ref of segmentRefs.current) {
      if (ref.current) {
        const p = ref.current.translation()
        pts.push(new THREE.Vector3(p.x, p.y, p.z))
      }
    }

    if (tamaRef.current) {
      const p = tamaRef.current.translation()
      const q = new THREE.Quaternion(
        tamaRef.current.rotation().x,
        tamaRef.current.rotation().y,
        tamaRef.current.rotation().z,
        tamaRef.current.rotation().w,
      )
      const local = new THREE.Vector3(0, TAMA_RADIUS, 0).applyQuaternion(q)
      pts.push(new THREE.Vector3(p.x + local.x, p.y + local.y, p.z + local.z))
    }

    if (pts.length < 2) return

    // Build a CatmullRom curve through the points and update TubeGeometry
    const curve = new THREE.CatmullRomCurve3(pts)
    const newTube = new THREE.TubeGeometry(curve, pts.length * 2, 0.004, 4, false)

    if (tubeRef.current) tubeRef.current.dispose()
    tubeRef.current = newTube
    lineRef.current.geometry = newTube
  })

  return (
    <mesh ref={lineRef}>
      <tubeGeometry />
      <meshStandardMaterial color="#888888" roughness={0.8} />
    </mesh>
  )
}

// ─── HUD overlay (DOM) ───────────────────────────────────────────────────────
function TrickHUD() {
  const players = useTrickStore((s) => s.players)
  const activePlayer = useDuelStore((s) => s.activePlayer)

  const p = players[activePlayer]

  return (
    <div
      style={{
        position: 'fixed',
        top: 16,
        left: 16,
        color: '#fff',
        fontFamily: 'monospace',
        fontSize: 14,
        background: 'rgba(0,0,0,0.45)',
        padding: '8px 12px',
        borderRadius: 6,
        pointerEvents: 'none',
        lineHeight: 1.6,
        zIndex: 100,
      }}
    >
      <div>
        <b>P{activePlayer} State:</b> {p.currentState}
      </div>
      <div>
        <b>Sequence:</b> [{p.sequence.join(' → ')}]
      </div>
      {p.lastCombo && (
        <div style={{ color: '#ffe135', fontWeight: 'bold', fontSize: 16 }}>
          🎉 {p.lastCombo}
        </div>
      )}
      <div style={{ marginTop: 6, fontSize: 11, opacity: 0.7 }}>
        Space: throw &nbsp;|&nbsp; Arrows: move &nbsp;|&nbsp; Q/E: spin
        <br />
        F: flip &nbsp;|&nbsp; G: sling &nbsp;|&nbsp; H: ghost
        <br />
        R: rewind flip &nbsp;|&nbsp; T: rewind sling &nbsp;|&nbsp; Tab: switch
        <br />
        <span style={{ opacity: 0.6 }}>📱 Touch: use on-screen buttons</span>
      </div>
    </div>
  )
}

// ─── Main KendamaRig component ───────────────────────────────────────────────
interface KendamaRigProps {
  playerId: PlayerId
  positionX?: number
}

export function KendamaRig({ playerId, positionX = 0 }: KendamaRigProps) {
  const kenRef = useRef<RapierRigidBody>(null)
  const tamaRef = useRef<RapierRigidBody>(null)
  const bigCupSensorRef = useRef<RapierRigidBody>(null)
  const smallCupSensorRef = useRef<RapierRigidBody>(null)
  const spikeSensorRef = useRef<RapierRigidBody>(null)

  // Stable ref array for the rope segments (never reassigned)
  const segmentRefs = useRef(
    Array.from({ length: STRING_SEGMENTS }, () =>
      createRef<RapierRigidBody>(),
    ) as React.RefObject<RapierRigidBody | null>[],
  )

  const keysRef = useRef<Record<string, boolean>>({})
  const prevSpaceRef = useRef(false)
  const prevQRef = useRef(false)
  const prevERef = useRef(false)
  const prevFRef = useRef(false)
  const prevGRef = useRef(false)
  const prevHRef = useRef(false)
  const prevRRef = useRef(false)
  const prevTRef = useRef(false)

  const { setCurrentState, addToSequence } = useTrickStore()
  const activePlayer = useDuelStore((s) => s.activePlayer)
  const startTimeWindow = useDuelStore((s) => s.startTimeWindow)
  const addScore = useDuelStore((s) => s.addScore)
  const colors = PLAYER_COLORS[playerId]

  // ── Keyboard input ──────────────────────────────────────────────────────
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true
      // Tab switches active player (only handle once per rig to avoid double-fire)
      if (e.code === 'Tab' && playerId === 1) {
        e.preventDefault()
        useDuelStore.getState().switchPlayer()
      }
    }
    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [playerId])

  // ── Per-frame physics input + sensor tracking ───────────────────────────
  useFrame(() => {
    if (!kenRef.current) return

    // Only process inputs for the active player
    const isActive = activePlayer === playerId
    if (!isActive) return

    const keys = keysRef.current

    // Space – one-shot throw impulse
    const spaceNow = !!keys['Space']
    if (spaceNow && !prevSpaceRef.current) {
      kenRef.current.applyImpulse({ x: 0, y: TRICK_PHYSICS.THROW.impulseY, z: 0 }, true)
      setCurrentState(playerId, 'AIRBORNE')
      addToSequence(playerId, 'THROW')
    }
    prevSpaceRef.current = spaceNow

    // Directional impulses (continuous while held)
    const { impulseScale } = TRICK_PHYSICS.MOVE
    if (keys['ArrowLeft'])
      kenRef.current.applyImpulse({ x: -impulseScale, y: 0, z: 0 }, true)
    if (keys['ArrowRight'])
      kenRef.current.applyImpulse({ x: impulseScale, y: 0, z: 0 }, true)
    if (keys['ArrowUp'])
      kenRef.current.applyImpulse({ x: 0, y: 0, z: -impulseScale }, true)
    if (keys['ArrowDown'])
      kenRef.current.applyImpulse({ x: 0, y: 0, z: impulseScale }, true)

    // Torque for spin / tilt – one-shot per key press to avoid flooding sequence
    const { torqueScale } = TRICK_PHYSICS.SPIN
    const qNow = !!keys['KeyQ']
    const eNow = !!keys['KeyE']
    if (qNow) kenRef.current.applyTorqueImpulse({ x: 0, y: torqueScale, z: 0 }, true)
    if (eNow) kenRef.current.applyTorqueImpulse({ x: 0, y: -torqueScale, z: 0 }, true)
    if (qNow && !prevQRef.current) addToSequence(playerId, 'TILT_LEFT')
    if (eNow && !prevERef.current) addToSequence(playerId, 'TILT_RIGHT')
    prevQRef.current = qNow
    prevERef.current = eNow

    // ── New trick inputs ────────────────────────────────────────────────
    // Flip (F) – strong forward torque to flip the ken
    const fNow = !!keys['KeyF']
    if (fNow && !prevFRef.current) {
      kenRef.current.applyTorqueImpulse({ x: TRICK_PHYSICS.FLIP.torqueX, y: 0, z: 0 }, true)
      kenRef.current.applyImpulse({ x: 0, y: TRICK_PHYSICS.FLIP.impulseY, z: 0 }, true)
      addToSequence(playerId, 'FLIP')
      startTimeWindow('FLIP')
    }
    prevFRef.current = fNow

    // Sling (G) – lateral swing + upward impulse
    const gNow = !!keys['KeyG']
    if (gNow && !prevGRef.current) {
      kenRef.current.applyImpulse({ x: TRICK_PHYSICS.SLING.impulseX, y: TRICK_PHYSICS.SLING.impulseY, z: 0 }, true)
      kenRef.current.applyTorqueImpulse({ x: 0, y: 0, z: TRICK_PHYSICS.SLING.torqueZ }, true)
      addToSequence(playerId, 'SLING')
      startTimeWindow('SLING')
    }
    prevGRef.current = gNow

    // Ghost (H) – very subtle upward lift
    const hNow = !!keys['KeyH']
    if (hNow && !prevHRef.current) {
      kenRef.current.applyImpulse({ x: 0, y: TRICK_PHYSICS.GHOST.impulseY, z: 0 }, true)
      addToSequence(playerId, 'GHOST')
      startTimeWindow('GHOST')
    }
    prevHRef.current = hNow

    // Rewind Flip (R) – reverse direction flip
    const rNow = !!keys['KeyR']
    if (rNow && !prevRRef.current) {
      kenRef.current.applyTorqueImpulse({ x: TRICK_PHYSICS.REWIND_FLIP.torqueX, y: 0, z: 0 }, true)
      kenRef.current.applyImpulse({ x: 0, y: TRICK_PHYSICS.REWIND_FLIP.impulseY, z: 0 }, true)
      addToSequence(playerId, 'REWIND_FLIP')
      startTimeWindow('REWIND_FLIP')
    }
    prevRRef.current = rNow

    // Rewind Sling (T) – reverse lateral swing
    const tNow = !!keys['KeyT']
    if (tNow && !prevTRef.current) {
      kenRef.current.applyImpulse({ x: TRICK_PHYSICS.REWIND_SLING.impulseX, y: TRICK_PHYSICS.REWIND_SLING.impulseY, z: 0 }, true)
      kenRef.current.applyTorqueImpulse({ x: 0, y: 0, z: TRICK_PHYSICS.REWIND_SLING.torqueZ }, true)
      addToSequence(playerId, 'REWIND_SLING')
      startTimeWindow('REWIND_SLING')
    }
    prevTRef.current = tNow

    // Update kinematic cup / spike sensors to follow the Ken each frame
    const kenPos = kenRef.current.translation()
    const kenRotQ = kenRef.current.rotation()
    const kenQuat = new THREE.Quaternion(kenRotQ.x, kenRotQ.y, kenRotQ.z, kenRotQ.w)

    const moveSensor = (
      sensorRef: React.RefObject<RapierRigidBody | null>,
      localOffset: THREE.Vector3,
    ) => {
      if (!sensorRef.current) return
      const worldOffset = localOffset.clone().applyQuaternion(kenQuat)
      sensorRef.current.setNextKinematicTranslation({
        x: kenPos.x + worldOffset.x,
        y: kenPos.y + worldOffset.y,
        z: kenPos.z + worldOffset.z,
      })
      sensorRef.current.setNextKinematicRotation(kenRotQ)
    }

    // Big cup – located at the bottom of the handle
    moveSensor(bigCupSensorRef, new THREE.Vector3(0, -KEN_HALF_HEIGHT - 0.05, 0))
    // Small cup – located just above centre (opposite end)
    moveSensor(smallCupSensorRef, new THREE.Vector3(0, KEN_HALF_HEIGHT - 0.06, 0))
    // Spike tip
    moveSensor(spikeSensorRef, new THREE.Vector3(0, KEN_HALF_HEIGHT + 0.1, 0))
  })

  // Helper: handle combo scoring on catch
  const handleCatch = (type: 'CUP' | 'SPIKE', state: 'CUPPED' | 'SPIKED') => {
    setCurrentState(playerId, state)
    addToSequence(playerId, type)
    // Check if a combo was just formed
    const store = useTrickStore.getState()
    const p = store.players[playerId]
    if (p.lastCombo) {
      addScore(playerId, p.lastCombo)
    }
  }

  // Initial Y for each rope segment
  const segmentStartY = (i: number) =>
    KEN_START_Y - KEN_HALF_HEIGHT - (i + 0.5) * SEGMENT_LENGTH

  return (
    <group position={[positionX, 0, 0]}>
      {/* ── Ken (handle) ───────────────────────────────────────────────────── */}
      <RigidBody
        ref={kenRef}
        position={[positionX, KEN_START_Y, 0]}
        linearDamping={0.4}
        angularDamping={0.6}
        colliders={false}
      >
        {/* Physical collider for the wooden handle */}
        <CuboidCollider args={[0.025, KEN_HALF_HEIGHT, 0.025]} />

        {/* Main handle cylinder */}
        <mesh>
          <cylinderGeometry args={[0.025, 0.035, KEN_HALF_HEIGHT * 2, 8]} />
          <meshStandardMaterial color={colors.ken} roughness={0.7} />
        </mesh>

        {/* Spike tip (visual only – sensor handled separately) */}
        <mesh position={[0, KEN_HALF_HEIGHT + 0.04, 0]}>
          <coneGeometry args={[0.01, 0.08, 8]} />
          <meshStandardMaterial color={colors.ken} roughness={0.6} />
        </mesh>

        {/* Big cup visual (bottom) */}
        <mesh position={[0, -KEN_HALF_HEIGHT - 0.02, 0]}>
          <cylinderGeometry args={[0.07, 0.035, 0.04, 16]} />
          <meshStandardMaterial color={colors.cup} roughness={0.6} />
        </mesh>

        {/* Small cup visual (upper) */}
        <mesh position={[0, KEN_HALF_HEIGHT - 0.04, 0]} rotation={[Math.PI, 0, 0]}>
          <cylinderGeometry args={[0.045, 0.025, 0.03, 16]} />
          <meshStandardMaterial color={colors.cup} roughness={0.6} />
        </mesh>
      </RigidBody>

      {/* ── Rapier Sensor – Big cup ─────────────────────────────────────────── */}
      <RigidBody
        ref={bigCupSensorRef}
        type="kinematicPosition"
        position={[positionX, KEN_START_Y - KEN_HALF_HEIGHT - 0.05, 0]}
        sensor
        onIntersectionEnter={({ other }) => {
          if (other.rigidBody === tamaRef.current) {
            handleCatch('CUP', 'CUPPED')
          }
        }}
        onIntersectionExit={({ other }) => {
          if (other.rigidBody === tamaRef.current) {
            setCurrentState(playerId, 'AIRBORNE')
          }
        }}
      >
        <CuboidCollider args={[0.068, 0.025, 0.068]} />
      </RigidBody>

      {/* ── Rapier Sensor – Small cup ───────────────────────────────────────── */}
      <RigidBody
        ref={smallCupSensorRef}
        type="kinematicPosition"
        position={[positionX, KEN_START_Y + KEN_HALF_HEIGHT - 0.06, 0]}
        sensor
        onIntersectionEnter={({ other }) => {
          if (other.rigidBody === tamaRef.current) {
            handleCatch('CUP', 'CUPPED')
          }
        }}
        onIntersectionExit={({ other }) => {
          if (other.rigidBody === tamaRef.current) {
            setCurrentState(playerId, 'AIRBORNE')
          }
        }}
      >
        <CuboidCollider args={[0.043, 0.02, 0.043]} />
      </RigidBody>

      {/* ── Rapier Sensor – Spike ───────────────────────────────────────────── */}
      <RigidBody
        ref={spikeSensorRef}
        type="kinematicPosition"
        position={[positionX, KEN_START_Y + KEN_HALF_HEIGHT + 0.1, 0]}
        sensor
        onIntersectionEnter={({ other }) => {
          if (other.rigidBody === tamaRef.current) {
            handleCatch('SPIKE', 'SPIKED')
          }
        }}
      >
        <BallCollider args={[0.016]} />
      </RigidBody>

      {/* ── String segments ─────────────────────────────────────────────────── */}
      {segmentRefs.current.map((ref, i) => (
        <RigidBody
          key={i}
          ref={ref}
          position={[positionX, segmentStartY(i), 0]}
          linearDamping={0.8}
          angularDamping={1.2}
          colliders={false}
        >
          <BallCollider args={[SEGMENT_RADIUS]} />
          {/* tiny visible bead so the rope is faintly visible */}
          <mesh>
            <sphereGeometry args={[SEGMENT_RADIUS * 1.5, 4, 4]} />
            <meshStandardMaterial color="#777777" />
          </mesh>
        </RigidBody>
      ))}

      {/* ── Tama (ball) ─────────────────────────────────────────────────────── */}
      <RigidBody
        ref={tamaRef}
        position={[positionX, TAMA_START_Y, 0]}
        linearDamping={0.15}
        angularDamping={0.4}
        restitution={0.35}
        colliders={false}
      >
        <BallCollider args={[TAMA_RADIUS]} />
        <mesh>
          <sphereGeometry args={[TAMA_RADIUS, 24, 24]} />
          <meshStandardMaterial color={colors.tama} roughness={0.5} />
        </mesh>
      </RigidBody>

      {/* ── Rope visual (tube rebuilt every frame) ──────────────────────────── */}
      <RopeVisual kenRef={kenRef} segmentRefs={segmentRefs} tamaRef={tamaRef} />

      {/* ── SphericalJoint chain ────────────────────────────────────────────── */}
      {/* Ken bottom → Segment 0 */}
      <StringJoint
        bodyA={kenRef}
        bodyB={segmentRefs.current[0]}
        anchorA={[0, -KEN_HALF_HEIGHT, 0]}
        anchorB={[0, 0, 0]}
      />

      {/* Segment i → Segment i+1 */}
      {Array.from({ length: STRING_SEGMENTS - 1 }, (_, i) => (
        <StringJoint
          key={i}
          bodyA={segmentRefs.current[i]}
          bodyB={segmentRefs.current[i + 1]}
          anchorA={[0, 0, 0]}
          anchorB={[0, 0, 0]}
        />
      ))}

      {/* Last segment → Tama */}
      <StringJoint
        bodyA={segmentRefs.current[STRING_SEGMENTS - 1]}
        bodyB={tamaRef}
        anchorA={[0, 0, 0]}
        anchorB={[0, TAMA_RADIUS, 0]}
      />
    </group>
  )
}

// Export the HUD separately so it can be rendered in the DOM (outside Canvas)
export { TrickHUD }
