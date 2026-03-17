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
import { useDuelStore, type PlayerId, type AdvancedTrick } from '../store/useDuelStore'

// ─── Rope / rig constants ────────────────────────────────────────────────────
const STRING_SEGMENTS = 6
const SEGMENT_LENGTH = 0.1
const SEGMENT_RADIUS = 0.005

const KEN_HALF_HEIGHT = 0.15
const KEN_START_Y = 2.2

const TAMA_RADIUS = 0.12
const TAMA_START_Y =
  KEN_START_Y -
  KEN_HALF_HEIGHT -
  (STRING_SEGMENTS + 1) * SEGMENT_LENGTH -
  TAMA_RADIUS

// ─── Spherical joint helper component ───────────────────────────────────────
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
interface RopeVisualProps {
  kenRef: React.RefObject<RapierRigidBody | null>
  segmentRefs: React.MutableRefObject<React.RefObject<RapierRigidBody | null>[]>
  tamaRef: React.RefObject<RapierRigidBody | null>
  color?: string
}

function RopeVisual({ kenRef, segmentRefs, tamaRef, color = "#888888" }: RopeVisualProps) {
  const lineRef = useRef<THREE.Mesh>(null)
  const tubeRef = useRef<THREE.TubeGeometry | null>(null)

  useFrame(() => {
    if (!lineRef.current) return

    const pts: THREE.Vector3[] = []

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

    const curve = new THREE.CatmullRomCurve3(pts)
    const newTube = new THREE.TubeGeometry(curve, pts.length * 2, 0.004, 4, false)

    if (tubeRef.current) tubeRef.current.dispose()
    tubeRef.current = newTube
    lineRef.current.geometry = newTube
  })

  return (
    <mesh ref={lineRef}>
      <tubeGeometry />
      <meshStandardMaterial color={color} roughness={0.8} />
    </mesh>
  )
}

// ─── Player-specific KendamaRig ──────────────────────────────────────────────
interface KendamaRigDuelProps {
  playerId: PlayerId
  position?: [number, number, number]
  inputKeys?: Record<string, string> // Custom key mappings
  tamaColor?: string
  kenColor?: string
  ropeColor?: string
  ghostMode?: boolean // For ghost trick
}

export function KendamaRigDuel({
  playerId,
  position = [0, 0, 0],
  inputKeys = {},
  tamaColor = "#E53935",
  kenColor = "#8B4513",
  ropeColor = "#888888",
  ghostMode = false,
}: KendamaRigDuelProps) {
  const kenRef = useRef<RapierRigidBody>(null)
  const tamaRef = useRef<RapierRigidBody>(null)
  const bigCupSensorRef = useRef<RapierRigidBody>(null)
  const smallCupSensorRef = useRef<RapierRigidBody>(null)
  const spikeSensorRef = useRef<RapierRigidBody>(null)

  const segmentRefs = useRef(
    Array.from({ length: STRING_SEGMENTS }, () =>
      createRef<RapierRigidBody>(),
    ) as React.RefObject<RapierRigidBody | null>[],
  )

  const keysRef = useRef<Record<string, boolean>>({})
  const prevSpaceRef = useRef(false)
  const prevFlipRef = useRef(false)
  const prevSlingRef = useRef(false)
  const prevGhostRef = useRef(false)
  const prevRewindRef = useRef(false)

  const {
    startTrick,
    completeTrick,
    activateTimeWindow,
    checkTimeWindow,
    phase,
  } = useDuelStore()

  // Default key mappings (can be overridden)
  const keys = {
    throw: 'Space',
    left: 'ArrowLeft',
    right: 'ArrowRight',
    up: 'ArrowUp',
    down: 'ArrowDown',
    spinLeft: 'KeyQ',
    spinRight: 'KeyE',
    flip: 'KeyF',
    sling: 'KeyS',
    ghost: 'KeyG',
    rewind: 'KeyR',
    ...inputKeys,
  }

  // ── Keyboard input ──────────────────────────────────────────────────────
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true
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
  }, [])

  // Check if it's this player's turn
  const isMyTurn = () => {
    if (playerId === 1) return phase === 'PLAYER_1_TURN'
    if (playerId === 2) return phase === 'PLAYER_2_TURN'
    return false
  }

  // ── Per-frame physics input + advanced tricks ───────────────────────────
  useFrame(() => {
    if (!kenRef.current || !isMyTurn()) return
    const currentKeys = keysRef.current

    // Basic throw
    const spaceNow = !!currentKeys[keys.throw]
    if (spaceNow && !prevSpaceRef.current) {
      kenRef.current.applyImpulse({ x: 0, y: 4.5, z: 0 }, true)
    }
    prevSpaceRef.current = spaceNow

    // Directional impulses
    const impulseScale = 0.18
    if (currentKeys[keys.left])
      kenRef.current.applyImpulse({ x: -impulseScale, y: 0, z: 0 }, true)
    if (currentKeys[keys.right])
      kenRef.current.applyImpulse({ x: impulseScale, y: 0, z: 0 }, true)
    if (currentKeys[keys.up])
      kenRef.current.applyImpulse({ x: 0, y: 0, z: -impulseScale }, true)
    if (currentKeys[keys.down])
      kenRef.current.applyImpulse({ x: 0, y: 0, z: impulseScale }, true)

    // Torque for spin
    const torqueScale = 0.08
    if (currentKeys[keys.spinLeft])
      kenRef.current.applyTorqueImpulse({ x: 0, y: torqueScale, z: 0 }, true)
    if (currentKeys[keys.spinRight])
      kenRef.current.applyTorqueImpulse({ x: 0, y: -torqueScale, z: 0 }, true)

    // ── Advanced Tricks ──────────────────────────────────────────────────

    // FLIP - quick rotation with time window
    const flipNow = !!currentKeys[keys.flip]
    if (flipNow && !prevFlipRef.current) {
      startTrick(playerId, 'flip')
      activateTimeWindow(playerId, 'flip', 800) // 800ms window
      kenRef.current.applyTorqueImpulse({ x: 15, y: 0, z: 0 }, true)
    }
    prevFlipRef.current = flipNow

    // SLING - strong throw with time window for catch
    const slingNow = !!currentKeys[keys.sling]
    if (slingNow && !prevSlingRef.current) {
      startTrick(playerId, 'sling')
      activateTimeWindow(playerId, 'sling', 1200) // 1200ms window
      kenRef.current.applyImpulse({ x: 0, y: 6.5, z: 0 }, true)
      if (tamaRef.current) {
        tamaRef.current.applyImpulse({ x: 0, y: -2, z: 0 }, true)
      }
    }
    prevSlingRef.current = slingNow

    // GHOST - activates ghost mode (invisible tama)
    const ghostNow = !!currentKeys[keys.ghost]
    if (ghostNow && !prevGhostRef.current) {
      startTrick(playerId, 'ghost')
      activateTimeWindow(playerId, 'ghost', 2000) // 2s to catch invisible tama
    }
    prevGhostRef.current = ghostNow

    // REWIND - reverse physics for a brief moment
    const rewindNow = !!currentKeys[keys.rewind]
    if (rewindNow && !prevRewindRef.current) {
      if (kenRef.current) {
        const vel = kenRef.current.linvel()
        kenRef.current.setLinvel({ x: -vel.x * 0.5, y: -vel.y * 0.5, z: -vel.z * 0.5 }, true)
      }
      if (tamaRef.current) {
        const vel = tamaRef.current.linvel()
        tamaRef.current.setLinvel({ x: -vel.x * 0.5, y: -vel.y * 0.5, z: -vel.z * 0.5 }, true)
      }
    }
    prevRewindRef.current = rewindNow

    // Update kinematic sensors to follow Ken
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

    moveSensor(bigCupSensorRef, new THREE.Vector3(0, -KEN_HALF_HEIGHT - 0.05, 0))
    moveSensor(smallCupSensorRef, new THREE.Vector3(0, KEN_HALF_HEIGHT - 0.06, 0))
    moveSensor(spikeSensorRef, new THREE.Vector3(0, KEN_HALF_HEIGHT + 0.1, 0))
  })

  const handleCatch = (trickType: 'cup' | 'spike') => {
    const isInTimeWindow = checkTimeWindow(playerId)
    const basePoints = trickType === 'spike' ? 50 : 30
    const timeBonus = isInTimeWindow ? 20 : 0
    const success = true

    completeTrick(playerId, success, basePoints + timeBonus)
  }

  const segmentStartY = (i: number) =>
    KEN_START_Y - KEN_HALF_HEIGHT - (i + 0.5) * SEGMENT_LENGTH

  const [offsetX, offsetY, offsetZ] = position

  return (
    <>
      {/* ── Ken (handle) ───────────────────────────────────────────────────── */}
      <RigidBody
        ref={kenRef}
        position={[offsetX, KEN_START_Y + offsetY, offsetZ]}
        linearDamping={0.4}
        angularDamping={0.6}
        colliders={false}
      >
        <CuboidCollider args={[0.025, KEN_HALF_HEIGHT, 0.025]} />

        <mesh>
          <cylinderGeometry args={[0.025, 0.035, KEN_HALF_HEIGHT * 2, 8]} />
          <meshStandardMaterial color={kenColor} roughness={0.7} />
        </mesh>

        <mesh position={[0, KEN_HALF_HEIGHT + 0.04, 0]}>
          <coneGeometry args={[0.01, 0.08, 8]} />
          <meshStandardMaterial color={kenColor} roughness={0.6} />
        </mesh>

        <mesh position={[0, -KEN_HALF_HEIGHT - 0.02, 0]}>
          <cylinderGeometry args={[0.07, 0.035, 0.04, 16]} />
          <meshStandardMaterial color="#A0522D" roughness={0.6} />
        </mesh>

        <mesh position={[0, KEN_HALF_HEIGHT - 0.04, 0]} rotation={[Math.PI, 0, 0]}>
          <cylinderGeometry args={[0.045, 0.025, 0.03, 16]} />
          <meshStandardMaterial color="#A0522D" roughness={0.6} />
        </mesh>
      </RigidBody>

      {/* ── Sensors ─────────────────────────────────────────────────────────── */}
      <RigidBody
        ref={bigCupSensorRef}
        type="kinematicPosition"
        position={[offsetX, KEN_START_Y - KEN_HALF_HEIGHT - 0.05 + offsetY, offsetZ]}
        sensor
        onIntersectionEnter={({ other }) => {
          if (other.rigidBody === tamaRef.current && isMyTurn()) {
            handleCatch('cup')
          }
        }}
      >
        <CuboidCollider args={[0.068, 0.025, 0.068]} />
      </RigidBody>

      <RigidBody
        ref={smallCupSensorRef}
        type="kinematicPosition"
        position={[offsetX, KEN_START_Y + KEN_HALF_HEIGHT - 0.06 + offsetY, offsetZ]}
        sensor
        onIntersectionEnter={({ other }) => {
          if (other.rigidBody === tamaRef.current && isMyTurn()) {
            handleCatch('cup')
          }
        }}
      >
        <CuboidCollider args={[0.043, 0.02, 0.043]} />
      </RigidBody>

      <RigidBody
        ref={spikeSensorRef}
        type="kinematicPosition"
        position={[offsetX, KEN_START_Y + KEN_HALF_HEIGHT + 0.1 + offsetY, offsetZ]}
        sensor
        onIntersectionEnter={({ other }) => {
          if (other.rigidBody === tamaRef.current && isMyTurn()) {
            handleCatch('spike')
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
          position={[offsetX, segmentStartY(i) + offsetY, offsetZ]}
          linearDamping={0.8}
          angularDamping={1.2}
          colliders={false}
        >
          <BallCollider args={[SEGMENT_RADIUS]} />
          <mesh>
            <sphereGeometry args={[SEGMENT_RADIUS * 1.5, 4, 4]} />
            <meshStandardMaterial color={ropeColor} />
          </mesh>
        </RigidBody>
      ))}

      {/* ── Tama (ball) ─────────────────────────────────────────────────────── */}
      <RigidBody
        ref={tamaRef}
        position={[offsetX, TAMA_START_Y + offsetY, offsetZ]}
        linearDamping={0.15}
        angularDamping={0.4}
        restitution={0.35}
        colliders={false}
      >
        <BallCollider args={[TAMA_RADIUS]} />
        <mesh visible={!ghostMode}>
          <sphereGeometry args={[TAMA_RADIUS, 24, 24]} />
          <meshStandardMaterial
            color={tamaColor}
            roughness={0.5}
            transparent={ghostMode}
            opacity={ghostMode ? 0.1 : 1}
          />
        </mesh>
      </RigidBody>

      {/* ── Rope visual ─────────────────────────────────────────────────────── */}
      <RopeVisual
        kenRef={kenRef}
        segmentRefs={segmentRefs}
        tamaRef={tamaRef}
        color={ropeColor}
      />

      {/* ── Joints ──────────────────────────────────────────────────────────── */}
      <StringJoint
        bodyA={kenRef}
        bodyB={segmentRefs.current[0]}
        anchorA={[0, -KEN_HALF_HEIGHT, 0]}
        anchorB={[0, 0, 0]}
      />

      {Array.from({ length: STRING_SEGMENTS - 1 }, (_, i) => (
        <StringJoint
          key={i}
          bodyA={segmentRefs.current[i]}
          bodyB={segmentRefs.current[i + 1]}
          anchorA={[0, 0, 0]}
          anchorB={[0, 0, 0]}
        />
      ))}

      <StringJoint
        bodyA={segmentRefs.current[STRING_SEGMENTS - 1]}
        bodyB={tamaRef}
        anchorA={[0, 0, 0]}
        anchorB={[0, TAMA_RADIUS, 0]}
      />
    </>
  )
}
