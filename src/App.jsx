import { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import SceneContents from './components/SceneContents.jsx';
import './App.css';

const initialState = {
  showGround: true,
  showSecond: true,
  showCourtyardGlass: true,
  showRoofPlates: true,
  showPlans: false,
  opacityPlans: 0.85,
};

export default function App() {
  const [controls, setControls] = useState(initialState);

  const updateControl = (key, value) => {
    setControls((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="app">
      <Canvas
        className="scene"
        shadows
        dpr={[1, 2]}
        camera={{ position: [35, 28, -35], fov: 50, near: 0.1, far: 2000 }}
      >
        <color attach="background" args={[0xf5f7fb]} />
        <SceneContents controls={controls} />
        <OrbitControls makeDefault target={[0, 2, 0]} enableDamping dampingFactor={0.08} />
      </Canvas>

      <div className="help">
        <strong>Controls</strong> — drag to orbit, <code>Shift</code>+drag to pan, wheel to zoom.
        <br />
        Axes: X→East, Z→North, Y↑Up. 1 unit = 1&nbsp;m. Bottom of plan = -Z (South).
      </div>

      <aside className="panel">
        <h2>House</h2>
        <label className="toggle">
          <input
            type="checkbox"
            checked={controls.showGround}
            onChange={(event) => updateControl('showGround', event.target.checked)}
          />
          <span>Ground floor</span>
        </label>
        <label className="toggle">
          <input
            type="checkbox"
            checked={controls.showSecond}
            onChange={(event) => updateControl('showSecond', event.target.checked)}
          />
          <span>Second floor</span>
        </label>
        <label className="toggle">
          <input
            type="checkbox"
            checked={controls.showCourtyardGlass}
            onChange={(event) => updateControl('showCourtyardGlass', event.target.checked)}
          />
          <span>Courtyard glass 2F</span>
        </label>
        <label className="toggle">
          <input
            type="checkbox"
            checked={controls.showRoofPlates}
            onChange={(event) => updateControl('showRoofPlates', event.target.checked)}
          />
          <span>Roof plates (massing)</span>
        </label>

        <details className="overlay">
          <summary>Blueprint overlays</summary>
          <label className="toggle">
            <input
              type="checkbox"
              checked={controls.showPlans}
              onChange={(event) => updateControl('showPlans', event.target.checked)}
            />
            <span>Show plans</span>
          </label>
          <label className="slider">
            <span>Plan opacity</span>
            <input
              type="range"
              min="0.2"
              max="1"
              step="0.01"
              value={controls.opacityPlans}
              onChange={(event) => updateControl('opacityPlans', Number(event.target.value))}
            />
            <output>{controls.opacityPlans.toFixed(2)}</output>
          </label>
          <p className="note">
            Place <code>plan_1f.png</code> and <code>plan_2f.png</code> in <code>public/</code> to align your drawings.
          </p>
        </details>
      </aside>
    </div>
  );
}
