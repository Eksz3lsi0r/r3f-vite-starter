import { OrbitControls } from "@react-three/drei"
import { Physics } from "@react-three/rapier"
import { KendamaRigDuel } from "./KendamaRigDuel"
import { useDuelStore } from "../store/useDuelStore"

export const DuelExperience = () => {
  const player1 = useDuelStore((s) => s.player1)
  const player2 = useDuelStore((s) => s.player2)

  // Check if ghost mode is active for either player
  const p1GhostMode = player1.timeWindow.active && player1.timeWindow.trickType === 'ghost'
  const p2GhostMode = player2.timeWindow.active && player2.timeWindow.trickType === 'ghost'

  return (
    <>
      <OrbitControls makeDefault enablePan={false} />

      <ambientLight intensity={0.6} />
      <directionalLight
        position={[5, 10, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight
        position={[-5, 10, -5]}
        intensity={0.8}
      />

      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#2a2a3e" />
      </mesh>

      {/* Center divider line */}
      <mesh position={[0, -0.99, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.2, 30]} />
        <meshStandardMaterial color="#ffffff" opacity={0.3} transparent />
      </mesh>

      <Physics gravity={[0, -9.81, 0]}>
        {/* Player 1 Kendama - Left side (Red) */}
        <KendamaRigDuel
          playerId={1}
          position={[-2.5, 0, 0]}
          tamaColor="#E53935"
          kenColor="#8B4513"
          ropeColor="#C62828"
          ghostMode={p1GhostMode}
          inputKeys={{
            throw: 'Space',
            left: 'KeyA',
            right: 'KeyD',
            up: 'KeyW',
            down: 'KeyS',
            spinLeft: 'KeyQ',
            spinRight: 'KeyE',
            flip: 'KeyF',
            sling: 'KeyV',
            ghost: 'KeyG',
            rewind: 'KeyR',
          }}
        />

        {/* Player 2 Kendama - Right side (Blue) */}
        <KendamaRigDuel
          playerId={2}
          position={[2.5, 0, 0]}
          tamaColor="#2196F3"
          kenColor="#6D4C41"
          ropeColor="#1976D2"
          ghostMode={p2GhostMode}
          inputKeys={{
            throw: 'Enter',
            left: 'ArrowLeft',
            right: 'ArrowRight',
            up: 'ArrowUp',
            down: 'ArrowDown',
            spinLeft: 'Comma',
            spinRight: 'Period',
            flip: 'KeyI',
            sling: 'KeyK',
            ghost: 'KeyO',
            rewind: 'KeyL',
          }}
        />
      </Physics>
    </>
  )
}
