import { Canvas } from "@react-three/fiber";
import { Experience } from "./components/Experience";
import { TrickHUD } from "./components/KendamaRig";
import { MobileControls } from "./components/MobileControls";

function App() {
  return (
    <>
      {/* DOM HUD rendered outside the Canvas so it stays on top */}
      <TrickHUD />

      {/* Touch controls overlay for mobile devices */}
      <MobileControls />

      <Canvas
        shadows
        camera={{ position: [0, 2, 5], fov: 50 }}
        style={{ width: "100vw", height: "100vh" }}
      >
        <color attach="background" args={["#1a1a2e"]} />
        <Experience />
      </Canvas>
    </>
  );
}

export default App;
