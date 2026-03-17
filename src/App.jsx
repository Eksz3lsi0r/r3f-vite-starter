import { Canvas } from "@react-three/fiber";
import { Experience } from "./components/Experience";
import { TrickHUD } from "./components/KendamaRig";
import { MobileControls } from "./components/MobileControls";
import { DuelHUD } from "./components/DuelHUD";

function App() {
  return (
    <>
      {/* Duel scoreboard + round overlay */}
      <DuelHUD />

      {/* DOM HUD rendered outside the Canvas so it stays on top */}
      <TrickHUD />

      {/* Touch controls overlay for mobile devices */}
      <MobileControls />

      {/* Pulled back to frame both kendamas side by side */}
      <Canvas
        shadows
        camera={{ position: [0, 2, 7], fov: 50 }}
        style={{ width: "100vw", height: "100vh" }}
      >
        <color attach="background" args={["#1a1a2e"]} />
        <Experience />
      </Canvas>
    </>
  );
}

export default App;
