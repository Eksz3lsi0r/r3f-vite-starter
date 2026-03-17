import { OrbitControls } from "@react-three/drei";
import { Physics } from "@react-three/rapier";
import { KendamaRig } from "./KendamaRig";

export const Experience = () => {
  return (
    <>
      {/* Camera controls – hold Alt + drag to orbit without interfering with
          the arrow-key / space inputs used for the kendama rig */}
      <OrbitControls makeDefault enablePan={false} />

      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[5, 10, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />

      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#cccccc" />
      </mesh>

      {/* Physics world – wraps all rigid bodies and joints */}
      <Physics gravity={[0, -9.81, 0]}>
        <KendamaRig />
      </Physics>
    </>
  );
};
