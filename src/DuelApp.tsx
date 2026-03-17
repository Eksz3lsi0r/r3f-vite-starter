import { Canvas } from "@react-three/fiber"
import { DuelExperience } from "./components/DuelExperience"
import { DuelHUD } from "./components/DuelHUD"
import { DuelMobileControls } from "./components/DuelMobileControls"

function DuelApp() {
  return (
    <>
      {/* DOM HUD rendered outside the Canvas */}
      <DuelHUD />

      {/* Touch controls overlay for mobile devices */}
      <DuelMobileControls />

      <Canvas
        shadows
        camera={{ position: [0, 3, 8], fov: 60 }}
        style={{ width: "100vw", height: "100vh" }}
      >
        <color attach="background" args={["#0f0f1e"]} />
        <DuelExperience />
      </Canvas>
    </>
  )
}

export default DuelApp
