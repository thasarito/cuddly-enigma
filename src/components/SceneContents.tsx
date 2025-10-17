import { useEffect, useMemo, useState } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

export interface ControlState {
  showGround: boolean;
  showSecond: boolean;
  showCourtyardGlass: boolean;
  showRoofPlates: boolean;
  showPlans: boolean;
  opacityPlans: number;
}

const P = {
  courtyard: 8.0,
  gallery: 2.0,
  wings: { west: 7.0, east: 8.0, north: 6.0, south: 4.0 },
  story: [3.2, 3.0],
  slab: 0.3,
  wall: 0.2,
};

const MATERIALS = {
  slab: { color: '#dedfe3', metalness: 0, roughness: 0.95 },
  wall: { color: '#eeeeee', metalness: 0, roughness: 0.75 },
  wall2: { color: '#e8edf2', metalness: 0, roughness: 0.75 },
  glass: {
    color: '#ffffff',
    opacity: 0.3,
    metalness: 0,
    roughness: 0.2,
    transmission: 0.9,
  },
  roof: { color: '#c6b199', metalness: 0, roughness: 0.9 },
};

type RectBounds = [number, number, number, number];
type WallBounds = [number, number, number, number];
type WallMaterial =
  | THREE.MeshStandardMaterialParameters
  | THREE.MeshPhysicalMaterialParameters;

interface RectSlabProps {
  bounds: RectBounds;
  y: number;
  height?: number;
  material?: THREE.MeshStandardMaterialParameters;
  visible?: boolean;
}

interface WallSegmentProps {
  start: [number, number];
  end: [number, number];
  y0: number;
  height: number;
  thickness?: number;
  material?: WallMaterial;
  visible?: boolean;
}

interface WallLoopProps {
  bounds: WallBounds;
  y0: number;
  height: number;
  thickness?: number;
  material?: WallMaterial;
  visible?: boolean;
}

interface StairsProps {
  origin: [number, number];
  y0: number;
  width: number;
  depth: number;
  rise: number;
  run: number;
  steps: number;
  visible?: boolean;
}

interface PlanOverlayProps {
  url: string;
  y: number;
  width: number;
  height: number;
  visible: boolean;
  opacity: number;
}

const cw = P.courtyard;
const g = P.gallery;
const west = P.wings.west;
const east = P.wings.east;
const north = P.wings.north;
const south = P.wings.south;

const xW1 = -(cw / 2 + g + west);
const xW0 = -(cw / 2 + g);
const xE0 = cw / 2 + g;
const xE1 = cw / 2 + g + east;

const zS1 = -(cw / 2 + g + south);
const zS0 = -(cw / 2 + g);
const zN0 = cw / 2 + g;
const zN1 = cw / 2 + g + north;

function RectSlab({ bounds, y, height = P.slab, material = MATERIALS.slab, visible = true }: RectSlabProps) {
  const [xmin, zmin, xmax, zmax] = bounds;
  const width = xmax - xmin;
  const depth = zmax - zmin;
  const center = useMemo<THREE.Vector3Tuple>(
    () => [(xmin + xmax) / 2, y + height / 2, (zmin + zmax) / 2],
    [xmin, xmax, y, height, zmin, zmax],
  );

  return (
    <mesh position={center} castShadow receiveShadow visible={visible}>
      <boxGeometry args={[width, height, depth]} />
      <meshStandardMaterial {...material} />
    </mesh>
  );
}

function WallSegment({
  start,
  end,
  y0,
  height,
  thickness = P.wall,
  material = MATERIALS.wall,
  visible = true,
}: WallSegmentProps) {
  const length = useMemo<number>(() => Math.hypot(end[0] - start[0], end[1] - start[1]) || 0.001, [start, end]);
  const angle = useMemo<number>(() => Math.atan2(end[1] - start[1], end[0] - start[0]), [start, end]);
  const position = useMemo<THREE.Vector3Tuple>(
    () => [(start[0] + end[0]) / 2, y0 + height / 2, (start[1] + end[1]) / 2],
    [start, end, y0, height],
  );
  const isGlass = material === MATERIALS.glass;

  return (
    <mesh position={position} rotation={[0, angle, 0]} castShadow receiveShadow visible={visible}>
      <boxGeometry args={[length, height, thickness]} />
      {isGlass ? (
        <meshPhysicalMaterial {...MATERIALS.glass} transparent />
      ) : (
        <meshStandardMaterial {...(material as THREE.MeshStandardMaterialParameters)} />
      )}
    </mesh>
  );
}

function WallLoop({
  bounds,
  y0,
  height,
  thickness = P.wall,
  material = MATERIALS.wall,
  visible = true,
}: WallLoopProps) {
  const [xmin, zmin, xmax, zmax] = bounds;
  if (!visible) {
    return null;
  }
  return (
    <group>
      <WallSegment start={[xmin, zmin]} end={[xmax, zmin]} y0={y0} height={height} thickness={thickness} material={material} />
      <WallSegment start={[xmax, zmin]} end={[xmax, zmax]} y0={y0} height={height} thickness={thickness} material={material} />
      <WallSegment start={[xmax, zmax]} end={[xmin, zmax]} y0={y0} height={height} thickness={thickness} material={material} />
      <WallSegment start={[xmin, zmax]} end={[xmin, zmin]} y0={y0} height={height} thickness={thickness} material={material} />
    </group>
  );
}

function Stairs({ origin, y0, width, depth, rise, run, steps, visible = true }: StairsProps) {
  const [x, z] = origin;
  const meshes = useMemo(() => {
    return Array.from({ length: steps }, (_, i) => {
      const position: THREE.Vector3Tuple = [
        x,
        y0 + rise / 2 + i * rise,
        z - depth / 2 + run / 2 + i * run,
      ];
      return { key: i, position };
    });
  }, [steps, x, y0, z, depth, rise, run]);

  if (!visible) {
    return null;
  }

  return (
    <group>
      {meshes.map(({ key, position }) => (
        <mesh key={key} position={position} castShadow receiveShadow>
          <boxGeometry args={[width, rise, run]} />
          <meshStandardMaterial {...MATERIALS.slab} />
        </mesh>
      ))}
    </group>
  );
}

function PlanOverlay({ url, y, width, height, visible, opacity }: PlanOverlayProps) {
  const { gl } = useThree();
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    let mounted = true;
    let loadedTexture: THREE.Texture | null = null;
    if (!url) {
      setTexture(null);
      return undefined;
    }
    const loader = new THREE.TextureLoader();
    loader.load(
      url,
      (tex) => {
        if (!mounted) return;
        loadedTexture = tex;
        tex.anisotropy = gl.capabilities.getMaxAnisotropy();
        tex.needsUpdate = true;
        setTexture(tex);
      },
      undefined,
      () => {
        if (mounted) {
          setTexture(null);
        }
      },
    );
    return () => {
      mounted = false;
      if (loadedTexture) {
        loadedTexture.dispose();
      }
    };
  }, [url, gl]);

  if (!texture || !visible) {
    return null;
  }

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y + P.slab + 0.01, 0]}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={texture} transparent opacity={opacity} depthWrite={false} />
    </mesh>
  );
}

interface SceneContentsProps {
  controls: ControlState;
}

export default function SceneContents({ controls }: SceneContentsProps) {
  const { showGround, showSecond, showCourtyardGlass, showRoofPlates, showPlans, opacityPlans } = controls;
  const { scene, gl } = useThree();

  useEffect(() => {
    gl.shadowMap.enabled = true;
    gl.shadowMap.type = THREE.PCFSoftShadowMap;
  }, [gl]);

  useEffect(() => {
    scene.fog = null;
  }, [scene]);

  const y0 = 0;
  const y1 = P.story[0] + P.slab;
  const guardHeight = 1.1;
  const railThickness = 0.06;
  const gridHelper = useMemo<THREE.GridHelper>(
    () => new THREE.GridHelper(120, 120, 0x666666, 0xdddddd),
    [],
  );
  const axesHelper = useMemo<THREE.AxesHelper>(() => new THREE.AxesHelper(3), []);

  return (
    <>
      <hemisphereLight args={[0xffffff, 0xbcc3d3, 0.65]} />
      <directionalLight
        position={[40, 60, 25]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={1}
        shadow-camera-far={150}
        shadow-camera-top={80}
        shadow-camera-bottom={-80}
        shadow-camera-left={-80}
        shadow-camera-right={80}
      />

      <primitive object={gridHelper} position={[0, 0, 0]} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#e7ecf2" roughness={1} />
      </mesh>

      <primitive object={axesHelper} position={[-2, 0.01, -2]} />

      {/* Ground floor slabs */}
      <RectSlab bounds={[xW1, zS1, xW0, zN1]} y={y0} visible={showGround} />
      <RectSlab bounds={[xE0, zS1, xE1, zN1]} y={y0} visible={showGround} />
      <RectSlab bounds={[xW0, zN0, xE0, zN1]} y={y0} visible={showGround} />
      <RectSlab bounds={[xW0, zS1, xE0, zS0]} y={y0} visible={showGround} />

      {/* Ground floor exterior walls */}
      <WallLoop bounds={[xW1, zS1, xE1, zN1]} y0={y0} height={P.story[0]} visible={showGround} />

      {/* Ground floor courtyard walls */}
      <WallLoop
        bounds={[-cw / 2 - g, -cw / 2 - g, cw / 2 + g, cw / 2 + g]}
        y0={y0}
        height={P.story[0]}
        visible={showGround}
      />

      {/* Second floor slabs */}
      <RectSlab bounds={[xW0, zN0, xE1, zN1]} y={y1} visible={showSecond} />
      <RectSlab bounds={[xW1, zS0, xW0, zN1]} y={y1} visible={showSecond} />
      <RectSlab
        bounds={[xE0, zN0, Math.min(xE0 + 3.0, xE1), Math.min(zN0 + 3.5, zN1)]}
        y={y1}
        material={MATERIALS.roof}
        visible={showSecond}
      />

      {/* Roof plate */}
      <RectSlab
        bounds={[xW0, zS1, xE1, zS0]}
        y={y1}
        material={MATERIALS.roof}
        visible={showSecond && showRoofPlates}
      />

      {/* Second floor walls */}
      <WallLoop bounds={[xW1, zS0, xE1, zN1]} y0={y1} height={P.story[1]} material={MATERIALS.wall2} visible={showSecond} />

      {/* Courtyard guard */}
      <WallLoop
        bounds={[-cw / 2, -cw / 2, cw / 2, cw / 2]}
        y0={y1 + P.story[1] - guardHeight}
        height={guardHeight}
        thickness={railThickness}
        material={MATERIALS.glass}
        visible={showSecond && showCourtyardGlass}
      />

      {/* Stairs */}
      <Stairs origin={[xW0 + 1.2, -0.2]} y0={y0} width={1.2} depth={3} rise={0.17} run={0.28} steps={17} visible={showGround || showSecond} />

      {/* Blueprint overlays */}
      <PlanOverlay
        url="/plan_1f.png"
        y={y0}
        width={xE1 - xW1}
        height={zN1 - zS1}
        visible={showPlans && showGround}
        opacity={opacityPlans}
      />
      <PlanOverlay
        url="/plan_2f.png"
        y={y1}
        width={xE1 - xW1}
        height={zN1 - zS0}
        visible={showPlans && showSecond}
        opacity={opacityPlans}
      />
    </>
  );
}
