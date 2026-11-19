import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  BookOpen,
  CheckCircle2,
  Compass,
  Library,
  RotateCcw,
  Search,
  Trees,
  UtensilsCrossed,
} from 'lucide-react';
import { LOCATIONS } from '../game/data';
import type { GameState, LocationId } from '../game/types';
import { createCampusTextures } from './campus3dTextures';
import type { IntroScenePhase } from './CinematicRevealIntro';

export type CampusCameraMode = 'overview' | 'focus';

interface Phase1Campus3DProps {
  state: GameState;
  activeLocationId: LocationId;
  cameraMode: CampusCameraMode;
  activeClueId: string | null;
  resetSignal: number;
  mode?: 'dashboard' | 'investigation';
  introPhase?: IntroScenePhase | null;
  reducedMotion?: boolean;
  onSelectLocation: (locId: LocationId, enterFocus?: boolean) => void;
  onSelectClue: (locId: LocationId, clueId: string) => void;
  onReturnOverview: () => void;
}

interface ZoneAnchorConfig {
  id: LocationId;
  code: string;
  titleUpper: string;
  position: [number, number, number];
  markerOffset: [number, number, number];
  cameraOffset: [number, number, number];
  targetOffset: [number, number, number];
  accentHex: number;
}

const ZONE_CONFIGS: Record<LocationId, ZoneAnchorConfig> = {
  kantin: {
    id: 'kantin',
    code: '01',
    titleUpper: '01 — KANTIN CERIA',
    position: [-9.2, 0, -7.2],
    markerOffset: [0, 5.4, 0],
    cameraOffset: [-2.0, 7.2, 5.2],
    targetOffset: [-9.2, 1.2, -7.2],
    accentHex: 0xe7b94f,
  },
  kelas: {
    id: 'kelas',
    code: '02',
    titleUpper: '02 — KELAS HARMONI',
    position: [-9.2, 0, 7.2],
    markerOffset: [0, 5.4, 0],
    cameraOffset: [-1.8, 7.4, 17.6],
    targetOffset: [-9.2, 1.2, 7.2],
    accentHex: 0x4fb887,
  },
  perpustakaan: {
    id: 'perpustakaan',
    code: '03',
    titleUpper: '03 — PERPUSTAKAAN ILMU',
    position: [9.2, 0, -7.2],
    markerOffset: [0, 5.7, 0],
    cameraOffset: [16.2, 7.6, 4.8],
    targetOffset: [9.2, 1.3, -7.2],
    accentHex: 0x5c96d6,
  },
  taman: {
    id: 'taman',
    code: '04',
    titleUpper: '04 — TAMAN REKREASI',
    position: [9.2, 0, 7.2],
    markerOffset: [0, 4.9, 0],
    cameraOffset: [16.4, 7.2, 17.5],
    targetOffset: [9.2, 1.0, 7.2],
    accentHex: 0x67c46b,
  },
};

const OVERVIEW_CAM_POS = new THREE.Vector3(0.6, 21.8, 27.2);
const OVERVIEW_TARGET = new THREE.Vector3(0, 0.9, 0.4);
const INTRO_START_CAM_POS = new THREE.Vector3(24.0, 11.5, 36.0);
const INTRO_REVEAL_CAM_POS = new THREE.Vector3(7.5, 16.5, 23.5);
const INTRO_REVEAL_TARGET = new THREE.Vector3(0, 1.8, 0);

// Pre-allocated scratch math objects (zero allocations inside RAF tick)
const _projVec = new THREE.Vector3();
const _desiredCam = new THREE.Vector3();
const _desiredTarget = new THREE.Vector3();
const _treeDummy = new THREE.Object3D();
const _treeColor = new THREE.Color();

function detectSoftwareWebGL(): boolean {
  try {
    const testCanvas = document.createElement('canvas');
    const gl = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl');
    if (!gl) return true;
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const rendererStr = debugInfo
      ? String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '')
      : '';
    const loseExt = gl.getExtension('WEBGL_lose_context');
    loseExt?.loseContext();
    return /SwiftShader|llvmpipe|WARP|Software/i.test(rendererStr);
  } catch {
    return true;
  }
}

interface ClueVisualRef {
  clueId: string;
  locationId: LocationId;
  hitMesh: THREE.Mesh;
  beaconGroup: THREE.Group;
  beaconMesh: THREE.Mesh;
  beaconRing: THREE.Mesh;
  scanRing: THREE.Mesh;
  baseY: number;
  phaseOffset: number;
}

export function Phase1Campus3D({
  state,
  activeLocationId,
  cameraMode,
  activeClueId,
  resetSignal,
  mode = 'investigation',
  introPhase = null,
  reducedMotion = false,
  onSelectLocation,
  onSelectClue,
  onReturnOverview,
}: Phase1Campus3DProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const markerRefs = useRef<Record<LocationId, HTMLButtonElement | null>>({
    kantin: null,
    kelas: null,
    perpustakaan: null,
    taman: null,
  });

  const [hoveredClueLabel, setHoveredClueLabel] = useState<string | null>(null);
  const [hoveredZoneId, setHoveredZoneId] = useState<LocationId | null>(null);
  const [webglFailed, setWebglFailed] = useState(false);

  // Latest React state mirrored into refs so the WebGL RAF loop never tears down
  const stateRef = useRef(state);
  stateRef.current = state;

  const activeLocRef = useRef(activeLocationId);
  activeLocRef.current = activeLocationId;

  const cameraModeRef = useRef(cameraMode);
  cameraModeRef.current = cameraMode;

  const activeClueRef = useRef(activeClueId);
  activeClueRef.current = activeClueId;

  const introPhaseRef = useRef<IntroScenePhase | null>(introPhase);
  introPhaseRef.current = introPhase;

  const modeRef = useRef<'dashboard' | 'investigation'>(mode);
  modeRef.current = mode;

  const reducedMotionRef = useRef(reducedMotion);
  reducedMotionRef.current = reducedMotion;

  const callbacksRef = useRef({ onSelectLocation, onSelectClue });
  callbacksRef.current = { onSelectLocation, onSelectClue };

  const cameraGlideRef = useRef<{ active: boolean; mode: CampusCameraMode; locId: LocationId }>({
    active: true,
    mode: cameraMode,
    locId: activeLocationId,
  });

  useEffect(() => {
    cameraGlideRef.current = {
      active: true,
      mode: cameraMode,
      locId: activeLocationId,
    };
  }, [cameraMode, activeLocationId, resetSignal, introPhase]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareWebGL();
    let cleanupRenderer: THREE.WebGLRenderer | null = null;
    let cleanupScene: THREE.Scene | null = null;
    let cleanupControls: OrbitControls | null = null;
    let cleanupEnvTarget: THREE.WebGLRenderTarget | null = null;
    let cleanupTexSet: ReturnType<typeof createCampusTextures> | null = null;
    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];

    const cleanupPartialInit = () => {
      try {
        cleanupControls?.dispose();
        geometries.forEach((g) => g.dispose());
        materials.forEach((m) => m.dispose());
        cleanupTexSet?.all.forEach((t) => t.dispose());
        cleanupEnvTarget?.dispose();
        if (cleanupScene) cleanupScene.environment = null;
        if (cleanupRenderer) {
          if (cleanupRenderer.domElement.parentNode === container) {
            container.removeChild(cleanupRenderer.domElement);
          }
          cleanupRenderer.dispose();
        }
      } catch {
        // ignore cleanup errors on failed WebGL initialization
      }
    };

    try {
      const renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
        alpha: false,
      });
      cleanupRenderer = renderer;

      const width = Math.max(container.clientWidth, 320);
      const height = Math.max(container.clientHeight, 320);
      renderer.setSize(width, height);
      renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.shadowMap.enabled = !isSoftwareGl;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.domElement.style.display = 'block';
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      renderer.domElement.style.outline = 'none';
      container.appendChild(renderer.domElement);

      const maxAniso = Math.min(renderer.capabilities.getMaxAnisotropy() || 1, 8);
      const texSet = createCampusTextures(maxAniso);
      cleanupTexSet = texSet;

      const scene = new THREE.Scene();
      cleanupScene = scene;
      scene.background = new THREE.Color(0xdce9d9);
      const fog = new THREE.FogExp2(0xe3ede0, 0.0062);
      scene.fog = fog;

      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      const roomEnv = new RoomEnvironment();
      const envTarget = pmremGenerator.fromScene(roomEnv, 0.04);
      cleanupEnvTarget = envTarget;
      scene.environment = envTarget.texture;
      roomEnv.dispose();
      pmremGenerator.dispose();

      const camera = new THREE.PerspectiveCamera(42, width / height, 0.5, 200);
      if (introPhaseRef.current) {
        camera.position.copy(INTRO_START_CAM_POS);
      } else {
        camera.position.copy(OVERVIEW_CAM_POS);
      }

      const controls = new OrbitControls(camera, renderer.domElement);
      cleanupControls = controls;
      controls.target.copy(introPhaseRef.current ? INTRO_REVEAL_TARGET : OVERVIEW_TARGET);
      controls.enableDamping = !isSoftwareGl;
      controls.dampingFactor = 0.07;
      controls.maxPolarAngle = Math.PI / 2.18;
      controls.minPolarAngle = 0.24;
      controls.minDistance = 8.0;
      controls.maxDistance = 46;
      controls.panSpeed = 0.7;
      controls.rotateSpeed = 0.72;
      controls.update();

      const handleControlsStart = () => {
        cameraGlideRef.current.active = false;
      };
      controls.addEventListener('start', handleControlsStart);

    // Lighting Rig: Bright Morning Sunlight + Fresh Sky/Garden Hemisphere + Cool Fill
    const hemiLight = new THREE.HemisphereLight(0xf5f8f2, 0x6f8f72, 1.35);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfff4dd, 2.75);
    sunLight.position.set(22, 28, 18);
    if (!isSoftwareGl) {
      sunLight.castShadow = true;
      sunLight.shadow.mapSize.width = 2048;
      sunLight.shadow.mapSize.height = 2048;
      sunLight.shadow.camera.near = 2;
      sunLight.shadow.camera.far = 85;
      sunLight.shadow.camera.left = -26;
      sunLight.shadow.camera.right = 26;
      sunLight.shadow.camera.top = 26;
      sunLight.shadow.camera.bottom = -26;
      sunLight.shadow.radius = 3;
      sunLight.shadow.bias = -0.00045;
      sunLight.shadow.normalBias = 0.02;
    }
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0xc2dce8, 0.78);
    rimLight.position.set(-20, 14, -18);
    scene.add(rimLight);

    // Subtle Central Courtyard Lantern Point Light
    const plazaLanternLight = new THREE.PointLight(0xffe0a3, 1.6, 18, 1.6);
    plazaLanternLight.position.set(0, 4.4, 0);
    scene.add(plazaLanternLight);

    // Disposal tracking helpers (arrays declared above for cleanup on init error)

    const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
      geometries.push(g);
      return g;
    };
    const trackMat = <T extends THREE.Material>(m: T): T => {
      materials.push(m);
      return m;
    };

    const makeStdMat = (
      color: number,
      roughness = 0.72,
      metalness = 0.05,
      extra?: Partial<THREE.MeshStandardMaterialParameters>
    ) =>
      trackMat(
        new THREE.MeshStandardMaterial({
          color,
          roughness,
          metalness,
          ...extra,
        })
      );

    // Realistic Procedural PBR Materials
    const turfMat = makeStdMat(0xffffff, 0.92, 0.0, {
      map: texSet.grassMap,
      bumpMap: texSet.grassBump,
      bumpScale: 0.08,
    });
    const lawnAccentMat = makeStdMat(0xdce9d9, 0.88, 0.0, {
      map: texSet.grassMap,
    });
    const paverMat = makeStdMat(0xffffff, 0.84, 0.04, {
      map: texSet.paverMap,
      bumpMap: texSet.paverBump,
      bumpScale: 0.05,
    });
    const stoneTrimMat = makeStdMat(0xd4cbb6, 0.78, 0.04);
    const darkStoneMat = makeStdMat(0x58665d, 0.82, 0.08);
    const stuccoMat = makeStdMat(0xffffff, 0.78, 0.02, {
      map: texSet.stuccoMap,
      bumpMap: texSet.stuccoBump,
      bumpScale: 0.03,
    });
    const brickMat = makeStdMat(0xffffff, 0.84, 0.04, {
      map: texSet.brickMap,
      bumpMap: texSet.brickBump,
      bumpScale: 0.06,
    });
    const roofTileMat = makeStdMat(0xffffff, 0.72, 0.06, {
      map: texSet.roofTileMap,
      bumpMap: texSet.roofTileBump,
      bumpScale: 0.08,
    });
    const slateRoofMat = makeStdMat(0xffffff, 0.64, 0.12, {
      map: texSet.slateRoofMap,
      bumpMap: texSet.roofTileBump,
      bumpScale: 0.07,
    });
    const woodMat = makeStdMat(0xffffff, 0.76, 0.04, {
      map: texSet.woodMap,
    });
    const darkWoodMat = makeStdMat(0x6b4b32, 0.78, 0.05);
    const terrazzoMat = makeStdMat(0xffffff, 0.56, 0.06, {
      map: texSet.terrazzoMap,
    });
    const forestTrimMat = makeStdMat(0x315c48, 0.52, 0.12);
    const wroughtIronMat = makeStdMat(0x26382f, 0.42, 0.72);
    const antiqueGoldMat = makeStdMat(0xe7c878, 0.28, 0.78);
    const warmWindowGlowMat = makeStdMat(0xf5f0e5, 0.25, 0.08, {
      emissive: 0xffe4a8,
      emissiveIntensity: 0.35,
    });
    const lanternGlassMat = makeStdMat(0xffe7aa, 0.2, 0.05, {
      emissive: 0xffc65c,
      emissiveIntensity: 1.4,
    });
    const archGlassMat = trackMat(
      new THREE.MeshPhysicalMaterial({
        color: 0x9dc7d8,
        roughness: 0.1,
        metalness: 0.12,
        transmission: isSoftwareGl ? 0 : 0.42,
        transparent: true,
        opacity: isSoftwareGl ? 0.68 : 0.82,
        clearcoat: 0.8,
        ior: 1.5,
      })
    );
    const waterMat = trackMat(
      new THREE.MeshPhysicalMaterial({
        color: 0x266c7a,
        roughness: 0.08,
        metalness: 0.14,
        clearcoat: 1.0,
        clearcoatRoughness: 0.06,
        transparent: true,
        opacity: 0.9,
      })
    );
    const contactShadowMat = trackMat(
      new THREE.MeshBasicMaterial({
        map: texSet.contactShadowMap,
        transparent: true,
        depthWrite: false,
        opacity: 0.52,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      })
    );

    const addBox = (
      parent: THREE.Object3D,
      w: number,
      h: number,
      d: number,
      mat: THREE.Material,
      x: number,
      y: number,
      z: number,
      cast = true,
      receive = true
    ) => {
      const mesh = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(w, h, d)), mat);
      mesh.position.set(x, y, z);
      mesh.castShadow = cast && !isSoftwareGl;
      mesh.receiveShadow = receive && !isSoftwareGl;
      parent.add(mesh);
      return mesh;
    };

    const addCyl = (
      parent: THREE.Object3D,
      rTop: number,
      rBot: number,
      h: number,
      segs: number,
      mat: THREE.Material,
      x: number,
      y: number,
      z: number
    ) => {
      const mesh = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(rTop, rBot, h, segs)), mat);
      mesh.position.set(x, y, z);
      mesh.castShadow = !isSoftwareGl;
      mesh.receiveShadow = !isSoftwareGl;
      parent.add(mesh);
      return mesh;
    };

    const addContactShadow = (parent: THREE.Object3D, w: number, d: number, x = 0, y = 0.03, z = 0) => {
      const plane = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(w, d)), contactShadowMat);
      plane.rotation.x = -Math.PI / 2;
      plane.position.set(x, y, z);
      parent.add(plane);
      return plane;
    };

    // =========================================================================
    // 1. ATMOSPHERIC SKY DOME + CONTINUOUS CAMPUS GROUNDS & STONE WALKWAYS
    // =========================================================================
    const skyDome = new THREE.Mesh(
      trackGeo(new THREE.SphereGeometry(125, 32, 20)),
      trackMat(
        new THREE.MeshBasicMaterial({
          map: texSet.skyDomeMap,
          side: THREE.BackSide,
          fog: false,
        })
      )
    );
    scene.add(skyDome);

    const worldGroup = new THREE.Group();
    scene.add(worldGroup);

    // Continuous Grounded Terrain (eliminates toy floating island look)
    const groundPlane = new THREE.Mesh(
      trackGeo(new THREE.PlaneGeometry(140, 140)),
      turfMat
    );
    groundPlane.rotation.x = -Math.PI / 2;
    groundPlane.position.y = 0;
    groundPlane.receiveShadow = !isSoftwareGl;
    worldGroup.add(groundPlane);

    // Subtle landscaped lawn pads inside campus perimeter
    addBox(worldGroup, 13.4, 0.06, 11.4, lawnAccentMat, -9.2, 0.03, -7.2, false, true);
    addBox(worldGroup, 13.4, 0.06, 11.4, lawnAccentMat, -9.2, 0.03, 7.2, false, true);
    addBox(worldGroup, 13.4, 0.06, 11.4, lawnAccentMat, 9.2, 0.03, -7.2, false, true);
    addBox(worldGroup, 13.4, 0.06, 11.4, lawnAccentMat, 9.2, 0.03, 7.2, false, true);

    // Stone-bordered Interlocking Paver Walkways
    addBox(worldGroup, 3.0, 0.08, 32.0, stoneTrimMat, 0, 0.04, 0, false, true);
    addBox(worldGroup, 2.5, 0.1, 31.6, paverMat, 0, 0.05, 0, false, true);
    addBox(worldGroup, 32.0, 0.08, 3.0, stoneTrimMat, 0, 0.04, 0, false, true);
    addBox(worldGroup, 31.6, 0.1, 2.5, paverMat, 0, 0.05, 0, false, true);

    // Connecting walkways to all 4 sectors
    addBox(worldGroup, 9.2, 0.09, 2.1, paverMat, -4.8, 0.05, -7.2, false, true);
    addBox(worldGroup, 9.2, 0.09, 2.1, paverMat, 4.8, 0.05, -7.2, false, true);
    addBox(worldGroup, 9.2, 0.09, 2.1, paverMat, -4.8, 0.05, 7.2, false, true);
    addBox(worldGroup, 9.2, 0.09, 2.1, paverMat, 4.8, 0.05, 7.2, false, true);

    // Central Octagonal Compass Courtyard
    addCyl(worldGroup, 5.2, 5.5, 0.16, 16, stoneTrimMat, 0, 0.08, 0);
    addCyl(worldGroup, 4.7, 4.7, 0.18, 16, paverMat, 0, 0.09, 0);
    addCyl(worldGroup, 3.6, 3.6, 0.2, 16, darkStoneMat, 0, 0.1, 0);
    addCyl(worldGroup, 3.3, 3.3, 0.21, 16, antiqueGoldMat, 0, 0.105, 0);
    addCyl(worldGroup, 3.05, 3.05, 0.22, 16, paverMat, 0, 0.11, 0);

    // =========================================================================
    // 2. CENTRAL HERITAGE CLOCK TOWER, GATEWAY & CAMPUS STREETLAMPS
    // =========================================================================
    const plazaGroup = new THREE.Group();
    plazaGroup.position.set(0, 0.22, 0);
    worldGroup.add(plazaGroup);
    addContactShadow(plazaGroup, 4.2, 4.2, 0, 0.02, 0);

    // Stepped stone plinth & brick arch base
    addBox(plazaGroup, 2.5, 0.45, 2.5, stoneTrimMat, 0, 0.22, 0);
    addBox(plazaGroup, 2.1, 1.35, 2.1, brickMat, 0, 1.12, 0);
    addBox(plazaGroup, 2.25, 0.18, 2.25, stoneTrimMat, 0, 1.85, 0);
    // Stucco belfry shaft + corner pilasters
    addBox(plazaGroup, 1.75, 2.6, 1.75, stuccoMat, 0, 3.22, 0);
    [-0.86, 0.86].forEach((px) => {
      [-0.86, 0.86].forEach((pz) => {
        addBox(plazaGroup, 0.18, 2.65, 0.18, stoneTrimMat, px, 3.22, pz);
      });
    });
    addBox(plazaGroup, 2.05, 0.22, 2.05, forestTrimMat, 0, 4.55, 0);

    // Clock dials with glowing glass faces & brass bezels on 4 sides
    const dialCyl1 = addCyl(plazaGroup, 0.48, 0.48, 1.84, 20, antiqueGoldMat, 0, 3.65, 0);
    dialCyl1.rotation.x = Math.PI / 2;
    const dialFace1 = addCyl(plazaGroup, 0.39, 0.39, 1.88, 20, warmWindowGlowMat, 0, 3.65, 0);
    dialFace1.rotation.x = Math.PI / 2;
    const dialCyl2 = addCyl(plazaGroup, 0.48, 0.48, 1.84, 20, antiqueGoldMat, 0, 3.65, 0);
    dialCyl2.rotation.z = Math.PI / 2;
    const dialFace2 = addCyl(plazaGroup, 0.39, 0.39, 1.88, 20, warmWindowGlowMat, 0, 3.65, 0);
    dialFace2.rotation.z = Math.PI / 2;

    // Spire & rotating golden compass finial
    const spire = new THREE.Mesh(
      trackGeo(new THREE.ConeGeometry(1.52, 2.15, 4)),
      slateRoofMat
    );
    spire.position.set(0, 5.7, 0);
    spire.rotation.y = Math.PI / 4;
    spire.castShadow = !isSoftwareGl;
    plazaGroup.add(spire);

    const compassHalo = new THREE.Mesh(
      trackGeo(new THREE.TorusGeometry(0.72, 0.065, 10, 28)),
      antiqueGoldMat
    );
    compassHalo.position.set(0, 7.15, 0);
    plazaGroup.add(compassHalo);

    // 4 Wrought-Iron Campus Streetlamps around Central Courtyard
    const lampSpots: [number, number][] = [
      [-4.2, -4.2],
      [4.2, -4.2],
      [-4.2, 4.2],
      [4.2, 4.2],
    ];
    lampSpots.forEach(([lx, lz]) => {
      const lamp = new THREE.Group();
      lamp.position.set(lx, 0.1, lz);
      addContactShadow(lamp, 1.1, 1.1, 0, 0.02, 0);
      addCyl(lamp, 0.16, 0.22, 0.45, 8, darkStoneMat, 0, 0.22, 0);
      addCyl(lamp, 0.06, 0.09, 2.35, 8, wroughtIronMat, 0, 1.55, 0);
      addBox(lamp, 0.34, 0.08, 0.34, wroughtIronMat, 0, 2.75, 0);
      const globe = new THREE.Mesh(
        trackGeo(new THREE.SphereGeometry(0.18, 12, 10)),
        lanternGlassMat
      );
      globe.position.set(0, 2.95, 0);
      lamp.add(globe);
      addCyl(lamp, 0.02, 0.22, 0.18, 6, wroughtIronMat, 0, 3.16, 0);
      worldGroup.add(lamp);
    });

    // South Entrance Archway (Sekolah Seri Bestari Gate)
    const gateGroup = new THREE.Group();
    gateGroup.position.set(0, 0.08, 16.0);
    worldGroup.add(gateGroup);
    addBox(gateGroup, 0.72, 2.9, 0.72, brickMat, -2.3, 1.45, 0);
    addBox(gateGroup, 0.72, 2.9, 0.72, brickMat, 2.3, 1.45, 0);
    addBox(gateGroup, 0.84, 0.22, 0.84, stoneTrimMat, -2.3, 2.95, 0);
    addBox(gateGroup, 0.84, 0.22, 0.84, stoneTrimMat, 2.3, 2.95, 0);
    addBox(gateGroup, 5.8, 0.72, 0.78, forestTrimMat, 0, 3.1, 0);
    addBox(gateGroup, 5.4, 0.16, 0.86, antiqueGoldMat, 0, 3.5, 0);

    // Perimeter Stone & Wrought-Iron Campus Fence (North/East/West/South)
    const fencePosts: [number, number][] = [];
    for (let i = -16; i <= 16; i += 4) {
      fencePosts.push([i, -16], [i, 16]);
    }
    for (let j = -12; j <= 12; j += 4) {
      fencePosts.push([-16, j], [16, j]);
    }
    const filteredPosts = fencePosts.filter(([fx, fz]) => !(fz === 16 && Math.abs(fx) < 3));
    const postGeo = trackGeo(new THREE.BoxGeometry(0.38, 1.35, 0.38));
    const postInst = new THREE.InstancedMesh(postGeo, brickMat, filteredPosts.length);
    postInst.castShadow = !isSoftwareGl;
    postInst.receiveShadow = !isSoftwareGl;
    filteredPosts.forEach(([fx, fz], idx) => {
      _treeDummy.position.set(fx, 0.68, fz);
      _treeDummy.scale.set(1, 1, 1);
      _treeDummy.rotation.set(0, 0, 0);
      _treeDummy.updateMatrix();
      postInst.setMatrixAt(idx, _treeDummy.matrix);
    });
    postInst.instanceMatrix.needsUpdate = true;
    postInst.computeBoundingSphere();
    worldGroup.add(postInst);

    // Perimeter fence top & bottom wrought-iron rails
    addBox(worldGroup, 32, 0.08, 0.08, wroughtIronMat, 0, 1.05, -16, false, false);
    addBox(worldGroup, 32, 0.08, 0.08, wroughtIronMat, 0, 0.45, -16, false, false);
    addBox(worldGroup, 0.08, 0.08, 32, wroughtIronMat, -16, 1.05, 0, false, false);
    addBox(worldGroup, 0.08, 0.08, 32, wroughtIronMat, -16, 0.45, 0, false, false);
    addBox(worldGroup, 0.08, 0.08, 32, wroughtIronMat, 16, 1.05, 0, false, false);
    addBox(worldGroup, 0.08, 0.08, 32, wroughtIronMat, 16, 0.45, 0, false, false);

    // =========================================================================
    // 3. REALISTIC MULTI-PART TREES & NATURAL PERIMETER GROVE (INSTANCED)
    // =========================================================================
    const treePositions: [number, number, number, number][] = [
      // Inner courtyard & avenue trees
      [-15.0, 0, -13.6, 1.15],
      [-15.2, 0, -2.0, 0.95],
      [-15.0, 0, 13.4, 1.1],
      [-4.2, 0, -14.2, 1.0],
      [4.2, 0, -14.2, 1.08],
      [15.0, 0, -13.6, 1.18],
      [15.2, 0, -2.0, 0.96],
      [15.0, 0, 13.4, 1.2],
      [-4.8, 0, 14.2, 0.94],
      [4.8, 0, 14.2, 0.98],
      [-2.9, 0, -4.1, 0.85],
      [2.9, 0, -4.1, 0.85],
      [-2.9, 0, 4.1, 0.85],
      [2.9, 0, 4.1, 0.85],
      // Outer campus woodland perimeter (frames the horizon naturally)
      [-22, 0, -20, 1.35],
      [-12, 0, -22, 1.25],
      [0, 0, -23, 1.4],
      [13, 0, -21, 1.3],
      [23, 0, -18, 1.35],
      [-23, 0, -6, 1.3],
      [-22, 0, 7, 1.4],
      [-21, 0, 19, 1.25],
      [22, 0, -5, 1.32],
      [23, 0, 8, 1.38],
      [21, 0, 19, 1.3],
      [-12, 0, 22, 1.28],
      [12, 0, 22, 1.24],
    ];

    const trunkGeo = trackGeo(new THREE.CylinderGeometry(0.14, 0.25, 1.65, 8));
    const trunkMat = makeStdMat(0x5b3e28, 0.92, 0.0);
    const trunkInst = new THREE.InstancedMesh(trunkGeo, trunkMat, treePositions.length);
    trunkInst.castShadow = !isSoftwareGl;

    const canopyGeo = trackGeo(new THREE.DodecahedronGeometry(1.12, 1));
    const canopyMat = makeStdMat(0xffffff, 0.86, 0.0);
    const canopyInst = new THREE.InstancedMesh(canopyGeo, canopyMat, treePositions.length);
    canopyInst.castShadow = !isSoftwareGl;
    canopyInst.receiveShadow = !isSoftwareGl;

    const canopyTopGeo = trackGeo(new THREE.DodecahedronGeometry(0.8, 1));
    const canopyTopMat = makeStdMat(0xffffff, 0.84, 0.0);
    const canopyTopInst = new THREE.InstancedMesh(canopyTopGeo, canopyTopMat, treePositions.length);
    canopyTopInst.castShadow = !isSoftwareGl;

    const leafPalette = [0x3b734e, 0x48875b, 0x559667, 0x315c48];
    const leafTopPalette = [0x589c68, 0x67ad74, 0x4b8d5b, 0x77ba83];

    treePositions.forEach(([tx, ty, tz, s], idx) => {
      _treeDummy.position.set(tx, ty + 0.82 * s, tz);
      _treeDummy.scale.set(s, s, s);
      _treeDummy.rotation.set(0, idx * 0.7, 0);
      _treeDummy.updateMatrix();
      trunkInst.setMatrixAt(idx, _treeDummy.matrix);

      _treeDummy.position.set(tx, ty + 2.1 * s, tz);
      _treeDummy.scale.set(s * 1.05, s * 0.95, s * 1.05);
      _treeDummy.rotation.set(0.08 * (idx % 3), idx * 0.9, 0);
      _treeDummy.updateMatrix();
      canopyInst.setMatrixAt(idx, _treeDummy.matrix);
      _treeColor.setHex(leafPalette[idx % leafPalette.length]);
      canopyInst.setColorAt(idx, _treeColor);

      _treeDummy.position.set(tx + 0.14 * s, ty + 2.88 * s, tz - 0.1 * s);
      _treeDummy.scale.set(s, s * 0.9, s);
      _treeDummy.updateMatrix();
      canopyTopInst.setMatrixAt(idx, _treeDummy.matrix);
      _treeColor.setHex(leafTopPalette[idx % leafTopPalette.length]);
      canopyTopInst.setColorAt(idx, _treeColor);
    });
    trunkInst.instanceMatrix.needsUpdate = true;
    canopyInst.instanceMatrix.needsUpdate = true;
    canopyTopInst.instanceMatrix.needsUpdate = true;
    if (canopyInst.instanceColor) canopyInst.instanceColor.needsUpdate = true;
    if (canopyTopInst.instanceColor) canopyTopInst.instanceColor.needsUpdate = true;
    trunkInst.computeBoundingSphere();
    canopyInst.computeBoundingSphere();
    canopyTopInst.computeBoundingSphere();
    worldGroup.add(trunkInst, canopyInst, canopyTopInst);

    // Subtle Atmospheric Golden Dust Motes (<= 70 particles for optimal performance)
    const particleCount = isSoftwareGl ? 32 : 64;
    const dustPositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      dustPositions[i * 3] = (Math.sin(i * 12.9898) * 0.5) * 32;
      dustPositions[i * 3 + 1] = 1.2 + ((i * 7) % 10) * 0.65;
      dustPositions[i * 3 + 2] = (Math.cos(i * 78.233) * 0.5) * 28;
    }
    const dustGeo = trackGeo(new THREE.BufferGeometry());
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    const dustPoints = new THREE.Points(
      dustGeo,
      trackMat(
        new THREE.PointsMaterial({
          map: texSet.dustSpriteMap,
          size: 0.42,
          transparent: true,
          opacity: 0.58,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        })
      )
    );
    worldGroup.add(dustPoints);

    // =========================================================================
    // 4. INTERACTIVE ZONE HITBOXES & CLUE HELPERS
    // =========================================================================
    const zoneHitMeshes: THREE.Mesh[] = [];
    const clueVisuals: ClueVisualRef[] = [];
    const zoneRingMeshes: Record<LocationId, THREE.Mesh> = {} as Record<LocationId, THREE.Mesh>;

    const createZoneHitBase = (locId: LocationId, pos: [number, number, number], accentHex: number) => {
      const group = new THREE.Group();
      group.position.set(pos[0], pos[1], pos[2]);
      worldGroup.add(group);

      // Architectural stone foundation terrace + bevel curb
      addContactShadow(group, 10.6, 8.8, 0, 0.04, 0);
      addBox(group, 9.0, 0.24, 7.6, stoneTrimMat, 0, 0.12, 0, false, true);
      addBox(group, 8.7, 0.26, 7.3, darkStoneMat, 0, 0.13, 0, false, true);

      // Glowing antique-gold / emerald zone perimeter selection ring
      const ringGeo = trackGeo(new THREE.RingGeometry(4.85, 5.12, 36));
      const ringMat = trackMat(
        new THREE.MeshBasicMaterial({
          color: accentHex,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.3,
        })
      );
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.28;
      group.add(ring);
      zoneRingMeshes[locId] = ring;

      // Invisible clickable zone volume for overview click
      const hitMesh = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(9.2, 4.6, 7.8)),
        trackMat(new THREE.MeshBasicMaterial({ visible: false }))
      );
      hitMesh.position.set(0, 2.3, 0);
      hitMesh.userData = { zoneId: locId };
      group.add(hitMesh);
      zoneHitMeshes.push(hitMesh);

      return group;
    };

    const attachClueBeaconAndHit = (
      parent: THREE.Object3D,
      locationId: LocationId,
      clueId: string,
      x: number,
      y: number,
      z: number,
      hitSize: [number, number, number],
      phaseOffset: number
    ) => {
      const hitMesh = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(hitSize[0], hitSize[1], hitSize[2])),
        trackMat(new THREE.MeshBasicMaterial({ visible: false }))
      );
      hitMesh.position.set(x, y + hitSize[1] * 0.4, z);
      hitMesh.userData = { clueId, locationId };
      parent.add(hitMesh);

      const beaconGroup = new THREE.Group();
      const baseY = y + hitSize[1] + 0.78;
      beaconGroup.position.set(x, baseY, z);
      parent.add(beaconGroup);

      // Magnifying-prism gold detective beacon
      const diamond = new THREE.Mesh(
        trackGeo(new THREE.OctahedronGeometry(0.28, 0)),
        trackMat(
          new THREE.MeshStandardMaterial({
            color: 0xf4c44e,
            emissive: 0xd99b26,
            emissiveIntensity: 0.65,
            roughness: 0.22,
            metalness: 0.58,
          })
        )
      );
      beaconGroup.add(diamond);

      const ring = new THREE.Mesh(
        trackGeo(new THREE.TorusGeometry(0.44, 0.042, 8, 22)),
        trackMat(
          new THREE.MeshBasicMaterial({
            color: 0xf4c44e,
            transparent: true,
            opacity: 0.85,
          })
        )
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = -0.34;
      beaconGroup.add(ring);

      // Ground scan ring beneath clue object
      const scanRing = new THREE.Mesh(
        trackGeo(new THREE.RingGeometry(0.55, 0.68, 24)),
        trackMat(
          new THREE.MeshBasicMaterial({
            color: 0xf4c44e,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.42,
          })
        )
      );
      scanRing.rotation.x = -Math.PI / 2;
      scanRing.position.set(x, y + 0.05, z);
      parent.add(scanRing);

      clueVisuals.push({
        clueId,
        locationId,
        hitMesh,
        beaconGroup,
        beaconMesh: diamond,
        beaconRing: ring,
        scanRing,
        baseY,
        phaseOffset,
      });
    };

    // Helper for framed architectural mullioned window
    const addFramedWindow = (
      parent: THREE.Object3D,
      w: number,
      h: number,
      x: number,
      y: number,
      z: number,
      rotY = 0
    ) => {
      const win = new THREE.Group();
      win.position.set(x, y, z);
      win.rotation.y = rotY;
      // Outer wooden frame + sill
      addBox(win, w + 0.16, h + 0.16, 0.16, darkWoodMat, 0, 0, 0, false, false);
      addBox(win, w + 0.28, 0.1, 0.26, stoneTrimMat, 0, -h * 0.5 - 0.08, 0.04, false, false);
      // Reflective glass pane + warm interior backing
      addBox(win, w - 0.06, h - 0.06, 0.08, warmWindowGlowMat, 0, 0, -0.02, false, false);
      addBox(win, w - 0.04, h - 0.04, 0.12, archGlassMat, 0, 0, 0.02, false, false);
      // Mullion bars
      addBox(win, 0.06, h, 0.18, darkWoodMat, 0, 0, 0, false, false);
      addBox(win, w, 0.06, 0.18, darkWoodMat, 0, 0, 0, false, false);
      parent.add(win);
    };

    // Helper for pitched double-sloped gable roof
    const addPitchedRoof = (
      parent: THREE.Object3D,
      spanX: number,
      spanZ: number,
      yBase: number,
      pitchHeight: number,
      mat: THREE.Material
    ) => {
      const halfZ = spanZ * 0.52;
      const slopeLen = Math.hypot(halfZ, pitchHeight);
      const angle = Math.atan2(pitchHeight, halfZ);

      const frontSlope = addBox(parent, spanX, 0.16, slopeLen, mat, 0, yBase + pitchHeight * 0.5, halfZ * 0.5);
      frontSlope.rotation.x = angle;

      const backSlope = addBox(parent, spanX, 0.16, slopeLen, mat, 0, yBase + pitchHeight * 0.5, -halfZ * 0.5);
      backSlope.rotation.x = -angle;

      // Ridge cap beam & fascia trim
      addBox(parent, spanX + 0.15, 0.18, 0.24, antiqueGoldMat, 0, yBase + pitchHeight + 0.04, 0);
      addBox(parent, spanX + 0.06, 0.12, 0.14, darkWoodMat, 0, yBase, halfZ);
      addBox(parent, spanX + 0.06, 0.12, 0.14, darkWoodMat, 0, yBase, -halfZ);
    };

    // -------------------------------------------------------------------------
    // ZONE 01: 01 — KANTIN CERIA (North-West)
    // -------------------------------------------------------------------------
    const kantinGroup = createZoneHitBase(
      'kantin',
      ZONE_CONFIGS.kantin.position,
      ZONE_CONFIGS.kantin.accentHex
    );
    // Terrazzo tiled canteen floor + heritage brick base + stucco back wall
    addBox(kantinGroup, 7.8, 0.08, 6.2, terrazzoMat, 0, 0.28, 0, false, true);
    addBox(kantinGroup, 7.8, 0.95, 0.36, brickMat, 0, 0.78, -2.92);
    addBox(kantinGroup, 7.8, 2.0, 0.32, stuccoMat, 0, 2.25, -2.92);
    addBox(kantinGroup, 0.36, 2.95, 3.2, brickMat, -3.72, 1.75, -1.5);
    // Kitchen counter + stainless steel serving bays + glowing menu board
    addBox(kantinGroup, 4.9, 0.96, 0.98, brickMat, -0.8, 0.78, -1.95);
    addBox(kantinGroup, 5.05, 0.12, 1.12, stoneTrimMat, -0.8, 1.3, -1.95);
    addBox(kantinGroup, 1.1, 0.12, 0.65, antiqueGoldMat, -2.1, 1.4, -1.95);
    addBox(kantinGroup, 1.1, 0.12, 0.65, antiqueGoldMat, -0.6, 1.4, -1.95);
    addBox(kantinGroup, 2.6, 0.75, 0.1, warmWindowGlowMat, -0.8, 2.45, -2.72);
    // Wrought-iron structural pillars & pitched terracotta roof
    [-3.65, 0, 3.65].forEach((px) => {
      addCyl(kantinGroup, 0.13, 0.15, 2.95, 10, wroughtIronMat, px, 1.75, 2.72);
    });
    addPitchedRoof(kantinGroup, 8.6, 6.6, 3.25, 1.15, roofTileMat);
    // Canteen dining tables + benches
    addBox(kantinGroup, 1.9, 0.09, 0.98, woodMat, -1.85, 0.95, 1.12);
    addBox(kantinGroup, 0.2, 0.64, 0.72, wroughtIronMat, -1.85, 0.6, 1.12);
    addBox(kantinGroup, 1.9, 0.09, 0.98, woodMat, 0.95, 0.95, 0.88);
    addBox(kantinGroup, 0.2, 0.64, 0.72, wroughtIronMat, 0.95, 0.6, 0.88);

    // Clue 1: kantin_sampah (scattered wrappers on floor)
    const trashCluster = new THREE.Group();
    trashCluster.position.set(-2.0, 0.32, 2.05);
    kantinGroup.add(trashCluster);
    addBox(trashCluster, 0.36, 0.09, 0.28, makeStdMat(0xf4eee0, 0.7), -0.25, 0.05, 0.1);
    addBox(trashCluster, 0.32, 0.13, 0.24, makeStdMat(0xd46a40, 0.65), 0.22, 0.07, -0.12);
    addCyl(trashCluster, 0.11, 0.08, 0.22, 10, makeStdMat(0x529dc2, 0.45), 0.0, 0.11, 0.18);
    attachClueBeaconAndHit(
      kantinGroup,
      'kantin',
      'kantin_sampah',
      -2.0,
      0.32,
      2.05,
      [1.45, 1.1, 1.45],
      0.2
    );

    // Clue 2: kantin_meja (leftover plates & spilled drink on central table)
    const messyPlates = new THREE.Group();
    messyPlates.position.set(0.95, 1.0, 0.88);
    kantinGroup.add(messyPlates);
    addCyl(messyPlates, 0.23, 0.18, 0.06, 14, makeStdMat(0xfaf6ec, 0.3), -0.36, 0.03, 0.1);
    addCyl(messyPlates, 0.21, 0.16, 0.06, 14, makeStdMat(0xd4723c, 0.35), 0.34, 0.03, -0.1);
    addCyl(messyPlates, 0.09, 0.07, 0.24, 10, makeStdMat(0x479ac4, 0.4), 0.05, 0.12, 0.16);
    attachClueBeaconAndHit(
      kantinGroup,
      'kantin',
      'kantin_meja',
      0.95,
      0.95,
      0.88,
      [1.75, 1.1, 1.25],
      1.1
    );

    // Clue 3: kantin_tong (overflowing rubbish bin right corner)
    const binGroup = new THREE.Group();
    binGroup.position.set(3.05, 0.32, 1.15);
    kantinGroup.add(binGroup);
    addCyl(binGroup, 0.42, 0.34, 0.94, 14, forestTrimMat, 0, 0.47, 0);
    addBox(binGroup, 0.46, 0.36, 0.38, makeStdMat(0xc45c3b, 0.75), 0.05, 1.0, 0.02);
    addBox(binGroup, 0.28, 0.18, 0.28, makeStdMat(0xefe8d4, 0.8), -0.36, 0.1, 0.42);
    attachClueBeaconAndHit(
      kantinGroup,
      'kantin',
      'kantin_tong',
      3.05,
      0.32,
      1.15,
      [1.45, 1.45, 1.45],
      2.0
    );

    // -------------------------------------------------------------------------
    // ZONE 02: 02 — KELAS HARMONI (South-West)
    // -------------------------------------------------------------------------
    const kelasGroup = createZoneHitBase(
      'kelas',
      ZONE_CONFIGS.kelas.position,
      ZONE_CONFIGS.kelas.accentHex
    );
    addBox(kelasGroup, 7.8, 0.08, 6.2, terrazzoMat, 0, 0.28, 0, false, true);
    // Cutaway classroom walls with brick dado + stucco upper + mullioned windows
    addBox(kelasGroup, 7.8, 0.95, 0.34, brickMat, 0, 0.78, -2.92);
    addBox(kelasGroup, 7.8, 2.05, 0.3, stuccoMat, 0, 2.28, -2.92);
    addBox(kelasGroup, 0.34, 0.95, 6.0, brickMat, -3.72, 0.78, -0.05);
    addBox(kelasGroup, 0.3, 2.05, 6.0, stuccoMat, -3.72, 2.28, -0.05);
    addFramedWindow(kelasGroup, 1.85, 1.15, -3.72, 2.1, -1.1, Math.PI / 2);
    addFramedWindow(kelasGroup, 1.85, 1.15, -3.72, 2.1, 1.35, Math.PI / 2);
    addPitchedRoof(kelasGroup, 8.5, 6.5, 3.3, 1.1, slateRoofMat);
    // Chalkboard on back wall
    addBox(kelasGroup, 3.35, 1.32, 0.1, darkWoodMat, -1.3, 1.95, -2.72);
    addBox(kelasGroup, 3.15, 1.14, 0.12, forestTrimMat, -1.3, 1.95, -2.68);

    // Clue 1: kelas_meja (crooked/messy desks & tipped chair)
    const messyDesks = new THREE.Group();
    messyDesks.position.set(-1.35, 0.32, 0.85);
    kelasGroup.add(messyDesks);
    const desk1 = addBox(messyDesks, 1.18, 0.68, 0.68, woodMat, -0.5, 0.34, -0.15);
    desk1.rotation.y = 0.28;
    const desk2 = addBox(messyDesks, 1.18, 0.68, 0.68, woodMat, 0.85, 0.34, 0.22);
    desk2.rotation.y = -0.35;
    const tippedChair = addBox(
      messyDesks,
      0.48,
      0.56,
      0.48,
      makeStdMat(0x3a6f8f, 0.6),
      0.1,
      0.28,
      0.72
    );
    tippedChair.rotation.z = 0.42;
    attachClueBeaconAndHit(
      kelasGroup,
      'kelas',
      'kelas_meja',
      -1.35,
      0.32,
      0.85,
      [2.25, 1.25, 1.85],
      0.5
    );

    // Clue 2: kelas_sudut (crooked rear learning board)
    const learningBoard = new THREE.Group();
    learningBoard.position.set(2.2, 1.82, -2.65);
    kelasGroup.add(learningBoard);
    const boardBacking = addBox(learningBoard, 1.85, 1.25, 0.1, makeStdMat(0xbba989, 0.82), 0, 0, 0);
    boardBacking.rotation.z = -0.09;
    addBox(learningBoard, 0.52, 0.42, 0.14, makeStdMat(0xe2c87b, 0.7), -0.42, 0.15, 0.02);
    attachClueBeaconAndHit(
      kelasGroup,
      'kelas',
      'kelas_sudut',
      2.2,
      1.2,
      -2.55,
      [1.95, 1.5, 0.95],
      1.4
    );

    // Clue 3: kelas_bahan (messy books & supplies shelf)
    const shelfGroup = new THREE.Group();
    shelfGroup.position.set(2.6, 0.32, 1.1);
    kelasGroup.add(shelfGroup);
    addBox(shelfGroup, 1.45, 1.35, 0.64, darkWoodMat, 0, 0.68, 0);
    addBox(shelfGroup, 0.42, 0.32, 0.32, makeStdMat(0xc95842, 0.7), -0.3, 1.5, 0.05).rotation.y = 0.3;
    addBox(shelfGroup, 0.44, 0.24, 0.36, makeStdMat(0x4b7cb8, 0.7), 0.28, 1.46, -0.06).rotation.y = -0.25;
    addBox(shelfGroup, 0.5, 0.14, 0.38, makeStdMat(0xf0e7d0, 0.75), -0.1, 0.07, 0.58);
    attachClueBeaconAndHit(
      kelasGroup,
      'kelas',
      'kelas_bahan',
      2.6,
      0.32,
      1.1,
      [1.75, 1.65, 1.45],
      2.3
    );

    // -------------------------------------------------------------------------
    // ZONE 03: 03 — PERPUSTAKAAN ILMU (North-East)
    // -------------------------------------------------------------------------
    const perpusGroup = createZoneHitBase(
      'perpustakaan',
      ZONE_CONFIGS.perpustakaan.position,
      ZONE_CONFIGS.perpustakaan.accentHex
    );
    addBox(perpusGroup, 7.8, 0.08, 6.2, woodMat, 0, 0.28, 0, false, true);
    // Heritage library walls + portico + tall mullioned windows
    addBox(perpusGroup, 7.8, 1.0, 0.34, brickMat, 0, 0.8, -2.92);
    addBox(perpusGroup, 7.8, 2.25, 0.3, stuccoMat, 0, 2.42, -2.92);
    addBox(perpusGroup, 0.34, 1.0, 6.0, brickMat, 3.72, 0.8, -0.05);
    addBox(perpusGroup, 0.3, 2.25, 6.0, stuccoMat, 3.72, 2.42, -0.05);
    addFramedWindow(perpusGroup, 2.1, 1.55, -1.75, 2.15, -2.92, 0);
    addFramedWindow(perpusGroup, 2.1, 1.55, 1.65, 2.15, -2.92, 0);
    addFramedWindow(perpusGroup, 1.9, 1.55, 3.72, 2.15, 0.1, Math.PI / 2);
    addPitchedRoof(perpusGroup, 8.6, 6.6, 3.52, 1.25, slateRoofMat);
    // Portico columns at entrance
    addCyl(perpusGroup, 0.14, 0.17, 3.2, 12, stuccoMat, -3.55, 1.88, 2.7);

    // Clue 1: perpus_buku (unsorted towering books & crooked bookcase)
    const bookZone = new THREE.Group();
    bookZone.position.set(-2.3, 0.32, -1.2);
    perpusGroup.add(bookZone);
    addBox(bookZone, 1.95, 2.25, 0.66, darkWoodMat, 0, 1.12, 0);
    addBox(bookZone, 0.45, 0.42, 0.35, makeStdMat(0xc4523f, 0.7), -0.45, 1.38, 0.1).rotation.z = 0.35;
    addBox(bookZone, 0.5, 0.25, 0.38, makeStdMat(0x4b7cb8, 0.7), 0.1, 0.13, 0.55);
    addBox(bookZone, 0.44, 0.22, 0.34, antiqueGoldMat, 0.14, 0.36, 0.52).rotation.y = 0.25;
    attachClueBeaconAndHit(
      perpusGroup,
      'perpustakaan',
      'perpus_buku',
      -2.3,
      0.32,
      -1.2,
      [2.15, 2.35, 1.55],
      0.8
    );

    // Clue 2: perpus_selesa (narrow study table, hard stools, brass lamp)
    const studySet = new THREE.Group();
    studySet.position.set(0.25, 0.32, 0.75);
    perpusGroup.add(studySet);
    addBox(studySet, 1.7, 0.74, 0.88, woodMat, 0, 0.37, 0);
    addBox(studySet, 0.42, 0.48, 0.42, darkWoodMat, -0.5, 0.24, 0.7);
    addBox(studySet, 0.42, 0.48, 0.42, darkWoodMat, 0.5, 0.24, 0.7);
    addCyl(studySet, 0.08, 0.15, 0.32, 10, antiqueGoldMat, 0.45, 0.9, 0);
    addCyl(studySet, 0.18, 0.22, 0.18, 12, lanternGlassMat, 0.45, 1.08, 0);
    attachClueBeaconAndHit(
      perpusGroup,
      'perpustakaan',
      'perpus_selesa',
      0.25,
      0.32,
      0.75,
      [1.85, 1.35, 1.65],
      1.7
    );

    // Clue 3: perpus_sudut (reading rug cluttered with stacked boxes)
    const boxCorner = new THREE.Group();
    boxCorner.position.set(2.35, 0.32, 1.35);
    perpusGroup.add(boxCorner);
    addBox(boxCorner, 2.05, 0.05, 1.8, makeStdMat(0x4b745d, 0.9), 0, 0.025, 0, false, true);
    addBox(boxCorner, 0.72, 0.58, 0.68, makeStdMat(0xb88b5d, 0.85), -0.32, 0.31, -0.1);
    addBox(boxCorner, 0.68, 0.54, 0.64, makeStdMat(0xa3774a, 0.85), 0.38, 0.29, 0.22).rotation.y = 0.25;
    addBox(boxCorner, 0.54, 0.46, 0.52, makeStdMat(0xc59a6e, 0.85), -0.22, 0.83, -0.05);
    attachClueBeaconAndHit(
      perpusGroup,
      'perpustakaan',
      'perpus_sudut',
      2.35,
      0.32,
      1.35,
      [2.05, 1.35, 1.85],
      2.5
    );

    // -------------------------------------------------------------------------
    // ZONE 04: 04 — TAMAN REKREASI (South-East)
    // -------------------------------------------------------------------------
    const tamanGroup = createZoneHitBase(
      'taman',
      ZONE_CONFIGS.taman.position,
      ZONE_CONFIGS.taman.accentHex
    );
    // Stone-rimmed botanical reflection pond + pergola timber pavilion
    addCyl(tamanGroup, 1.52, 1.62, 0.24, 18, stoneTrimMat, -2.45, 0.26, -1.45);
    const pondWater = addCyl(tamanGroup, 1.26, 1.26, 0.26, 18, waterMat, -2.45, 0.27, -1.45);
    // Timber pergola with crossbeams
    addBox(tamanGroup, 0.24, 2.75, 0.24, darkWoodMat, -1.3, 1.52, -2.4);
    addBox(tamanGroup, 0.24, 2.75, 0.24, darkWoodMat, 1.3, 1.52, -2.4);
    addBox(tamanGroup, 3.3, 0.22, 0.3, woodMat, 0, 2.9, -2.4);
    addBox(tamanGroup, 3.3, 0.16, 0.24, woodMat, 0, 2.9, -1.75);
    addBox(tamanGroup, 0.2, 0.12, 1.4, woodMat, -0.8, 2.98, -2.05);
    addBox(tamanGroup, 0.2, 0.12, 1.4, woodMat, 0.8, 2.98, -2.05);

    // Clue 1: taman_tumbuhan (dry/wilted flowerbed)
    const wiltedBed = new THREE.Group();
    wiltedBed.position.set(-2.0, 0.32, 1.35);
    tamanGroup.add(wiltedBed);
    addBox(wiltedBed, 2.25, 0.34, 1.28, brickMat, 0, 0.17, 0);
    addBox(wiltedBed, 1.98, 0.36, 1.02, makeStdMat(0x755c3e, 0.94), 0, 0.19, 0);
    const wilt1 = addCyl(wiltedBed, 0.08, 0.04, 0.56, 7, makeStdMat(0x8e8040, 0.85), -0.5, 0.55, 0.1);
    wilt1.rotation.z = 0.52;
    const wilt2 = addCyl(wiltedBed, 0.08, 0.04, 0.48, 7, makeStdMat(0x7a6e38, 0.85), 0.3, 0.52, -0.15);
    wilt2.rotation.z = -0.45;
    attachClueBeaconAndHit(
      tamanGroup,
      'taman',
      'taman_tumbuhan',
      -2.0,
      0.32,
      1.35,
      [2.25, 1.15, 1.55],
      0.4
    );

    // Clue 2: taman_kawasan (bare muddy patch + crooked empty signpost)
    const barePatch = new THREE.Group();
    barePatch.position.set(0.35, 0.26, -0.35);
    tamanGroup.add(barePatch);
    addCyl(barePatch, 1.38, 1.38, 0.08, 16, makeStdMat(0x7e684b, 0.95), 0, 0.04, 0);
    const crookedPost = addBox(barePatch, 0.12, 1.2, 0.12, darkWoodMat, 0.45, 0.6, -0.35);
    crookedPost.rotation.z = 0.18;
    const signBoard = addBox(barePatch, 0.74, 0.46, 0.08, woodMat, 0.38, 1.05, -0.35);
    signBoard.rotation.z = 0.18;
    attachClueBeaconAndHit(
      tamanGroup,
      'taman',
      'taman_kawasan',
      0.35,
      0.26,
      -0.35,
      [2.15, 1.45, 2.05],
      1.3
    );

    // Clue 3: taman_duduk (broken wooden bench on stone pads)
    const brokenBench = new THREE.Group();
    brokenBench.position.set(2.5, 0.32, 1.25);
    tamanGroup.add(brokenBench);
    addBox(brokenBench, 1.88, 0.12, 0.98, paverMat, 0, 0.06, 0);
    addBox(brokenBench, 0.22, 0.38, 0.52, stoneTrimMat, -0.62, 0.25, 0);
    addBox(brokenBench, 0.22, 0.38, 0.52, stoneTrimMat, 0.62, 0.25, 0);
    const snappedPlank = addBox(brokenBench, 0.88, 0.08, 0.45, woodMat, -0.25, 0.44, 0.05);
    snappedPlank.rotation.z = -0.22;
    attachClueBeaconAndHit(
      tamanGroup,
      'taman',
      'taman_duduk',
      2.5,
      0.32,
      1.25,
      [1.95, 1.05, 1.45],
      2.2
    );

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // =========================================================================
    // 5. RAYCASTING (POINTER CLICK & HOVER)
    // =========================================================================
    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2();
    let downX = 0;
    let downY = 0;

    const getHitTarget = (clientX: number, clientY: number) => {
      if (introPhaseRef.current) return null;
      const rect = renderer.domElement.getBoundingClientRect();
      pointerNdc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointerNdc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointerNdc, camera);

      const clueMeshes = clueVisuals.map((c) => c.hitMesh);
      const clueHits = raycaster.intersectObjects(clueMeshes, false);
      if (clueHits.length > 0) {
        const hitData = clueHits[0].object.userData as { clueId: string; locationId: LocationId };
        if (cameraModeRef.current === 'focus' || hitData.locationId === activeLocRef.current) {
          return { type: 'clue' as const, locationId: hitData.locationId, clueId: hitData.clueId };
        }
      }

      const zoneHits = raycaster.intersectObjects(zoneHitMeshes, false);
      if (zoneHits.length > 0) {
        const zoneId = zoneHits[0].object.userData.zoneId as LocationId;
        return { type: 'zone' as const, locationId: zoneId };
      }

      if (clueHits.length > 0) {
        const hitData = clueHits[0].object.userData as { clueId: string; locationId: LocationId };
        return { type: 'clue' as const, locationId: hitData.locationId, clueId: hitData.clueId };
      }
      return null;
    };

    const onPointerDown = (e: PointerEvent) => {
      downX = e.clientX;
      downY = e.clientY;
    };

    const onPointerMove = (e: PointerEvent) => {
      const hit = getHitTarget(e.clientX, e.clientY);
      if (hit?.type === 'clue') {
        const loc = LOCATIONS.find((l) => l.id === hit.locationId);
        const clue = loc?.clues.find((c) => c.id === hit.clueId);
        renderer.domElement.style.cursor = 'pointer';
        setHoveredClueLabel(clue?.label || 'Periksa Bukti');
        setHoveredZoneId(hit.locationId);
      } else if (hit?.type === 'zone') {
        renderer.domElement.style.cursor = 'pointer';
        setHoveredClueLabel(null);
        setHoveredZoneId(hit.locationId);
      } else {
        renderer.domElement.style.cursor = introPhaseRef.current ? 'default' : 'grab';
        setHoveredClueLabel(null);
        setHoveredZoneId(null);
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      const moved = Math.hypot(e.clientX - downX, e.clientY - downY);
      if (moved > 8) return;
      const hit = getHitTarget(e.clientX, e.clientY);
      if (!hit) return;

      const isDashboard = modeRef.current === 'dashboard';
      if (hit.type === 'clue') {
        callbacksRef.current.onSelectLocation(hit.locationId, !isDashboard);
        if (!isDashboard) {
          callbacksRef.current.onSelectClue(hit.locationId, hit.clueId);
        }
      } else if (hit.type === 'zone') {
        callbacksRef.current.onSelectLocation(hit.locationId, !isDashboard);
      }
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerup', onPointerUp);

    // =========================================================================
    // 6. RESIZE & WEBGL CONTEXT LOST HANDLING
    // =========================================================================
    const resizeObserver = new ResizeObserver(() => {
      if (!container) return;
      const w = Math.max(container.clientWidth, 320);
      const h = Math.max(container.clientHeight, 320);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObserver.observe(container);

    const onContextLost = (e: Event) => {
      e.preventDefault();
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);

    // =========================================================================
    // 7. ANIMATION LOOP + SOFTWARE GL FENCESYNC PACING + CINEMATIC REVEAL
    // =========================================================================
    const clock = new THREE.Clock();
    let rafId = 0;
    let isDisposed = false;

    const afterDraw = (done: () => void) => {
      if (!isSoftwareGl) {
        rafId = requestAnimationFrame(done);
        return;
      }
      const gl = renderer.getContext();
      if (typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext) {
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        if (sync) {
          gl.flush();
          const start = performance.now();
          const poll = () => {
            if (isDisposed) {
              gl.deleteSync(sync);
              return;
            }
            const status = gl.clientWaitSync(sync, 0, 0);
            if (status !== gl.TIMEOUT_EXPIRED || performance.now() - start > 80) {
              gl.deleteSync(sync);
              rafId = requestAnimationFrame(done);
            } else {
              setTimeout(poll, 16);
            }
          };
          poll();
          return;
        }
      }
      rafId = requestAnimationFrame(done);
    };

    const tick = () => {
      if (isDisposed) return;
      const dt = Math.min(clock.getDelta(), 0.05);
      const elapsed = clock.getElapsedTime();
      const isReduced = reducedMotionRef.current;
      const curIntro = introPhaseRef.current;

      // Subtle atmospheric animations (paused when Reduced Motion is active)
      if (!isReduced) {
        compassHalo.rotation.y = elapsed * 0.55;
        pondWater.position.y = 0.27 + Math.sin(elapsed * 1.4) * 0.008;
        dustPoints.rotation.y = elapsed * 0.018;
        canopyTopInst.rotation.z = Math.sin(elapsed * 0.65) * 0.004;
      }

      // Dynamic Lighting for Cinematic Intro School Reveal
      let targetSunIntensity = 2.75;
      let targetHemiIntensity = 1.35;
      let targetFogDensity = 0.0062;

      if (curIntro === 'darkness') {
        targetSunIntensity = 0.55;
        targetHemiIntensity = 0.45;
        targetFogDensity = 0.015;
      } else if (curIntro === 'school_reveal') {
        targetSunIntensity = 2.85;
        targetHemiIntensity = 1.4;
        targetFogDensity = 0.006;
      }

      const lightLerp = isReduced ? 1 : Math.min(1, dt * 1.9);
      sunLight.intensity = THREE.MathUtils.lerp(sunLight.intensity, targetSunIntensity, lightLerp);
      hemiLight.intensity = THREE.MathUtils.lerp(hemiLight.intensity, targetHemiIntensity, lightLerp);
      fog.density = THREE.MathUtils.lerp(fog.density, targetFogDensity, lightLerp);

      // Camera Choreography: Intro Glide vs Interactive Campus Overview/Focus
      if (curIntro) {
        controls.enabled = false;
        if (curIntro === 'darkness') {
          _desiredCam.copy(INTRO_START_CAM_POS);
          _desiredTarget.copy(INTRO_REVEAL_TARGET);
        } else {
          const orbitAngle = isReduced ? 0 : Math.sin(elapsed * 0.18) * 2.2;
          _desiredCam.set(
            INTRO_REVEAL_CAM_POS.x + orbitAngle,
            INTRO_REVEAL_CAM_POS.y,
            INTRO_REVEAL_CAM_POS.z
          );
          _desiredTarget.copy(INTRO_REVEAL_TARGET);
        }
        const introLambda = isReduced ? 20 : 1.4;
        camera.position.x = THREE.MathUtils.damp(camera.position.x, _desiredCam.x, introLambda, dt);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, _desiredCam.y, introLambda, dt);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, _desiredCam.z, introLambda, dt);
        controls.target.x = THREE.MathUtils.damp(controls.target.x, _desiredTarget.x, introLambda, dt);
        controls.target.y = THREE.MathUtils.damp(controls.target.y, _desiredTarget.y, introLambda, dt);
        controls.target.z = THREE.MathUtils.damp(controls.target.z, _desiredTarget.z, introLambda, dt);
      } else {
        controls.enabled = true;
        const glide = cameraGlideRef.current;
        if (glide.active) {
          if (glide.mode === 'overview') {
            _desiredCam.copy(OVERVIEW_CAM_POS);
            _desiredTarget.copy(OVERVIEW_TARGET);
          } else {
            const zCfg = ZONE_CONFIGS[glide.locId];
            _desiredCam.set(zCfg.cameraOffset[0], zCfg.cameraOffset[1], zCfg.cameraOffset[2]);
            _desiredTarget.set(zCfg.targetOffset[0], zCfg.targetOffset[1], zCfg.targetOffset[2]);
          }
          const lambda = isReduced ? 20 : 4.6;
          camera.position.x = THREE.MathUtils.damp(camera.position.x, _desiredCam.x, lambda, dt);
          camera.position.y = THREE.MathUtils.damp(camera.position.y, _desiredCam.y, lambda, dt);
          camera.position.z = THREE.MathUtils.damp(camera.position.z, _desiredCam.z, lambda, dt);
          controls.target.x = THREE.MathUtils.damp(controls.target.x, _desiredTarget.x, lambda, dt);
          controls.target.y = THREE.MathUtils.damp(controls.target.y, _desiredTarget.y, lambda, dt);
          controls.target.z = THREE.MathUtils.damp(controls.target.z, _desiredTarget.z, lambda, dt);

          if (
            camera.position.distanceToSquared(_desiredCam) < 0.01 &&
            controls.target.distanceToSquared(_desiredTarget) < 0.01
          ) {
            glide.active = false;
          }
        }
      }

      controls.update();

      // Update clue beacons & ground scanning rings
      const curState = stateRef.current;
      const curActiveLoc = activeLocRef.current;
      const curActiveClue = activeClueRef.current;

      for (let i = 0; i < clueVisuals.length; i++) {
        const cv = clueVisuals[i];
        const inv = curState.investigations[cv.locationId];
        const discovered = inv.discoveredClueIds.includes(cv.clueId);
        const showSpotlight = inv.hintLevelUsed >= 3 && !discovered;
        const isSelected = curActiveClue === cv.clueId;

        const beaconMat = cv.beaconMesh.material as THREE.MeshStandardMaterial;
        const ringMat = cv.beaconRing.material as THREE.MeshBasicMaterial;
        const scanMat = cv.scanRing.material as THREE.MeshBasicMaterial;

        if (discovered) {
          beaconMat.color.setHex(0x4bc98a);
          beaconMat.emissive.setHex(0x1f6b47);
          beaconMat.emissiveIntensity = isSelected ? 0.85 : 0.35;
          ringMat.color.setHex(0x4bc98a);
          ringMat.opacity = isSelected ? 0.95 : 0.42;
          scanMat.color.setHex(0x4bc98a);
          scanMat.opacity = isSelected ? 0.55 : 0.2;
          cv.scanRing.scale.setScalar(1.0);
          cv.beaconGroup.position.y =
            cv.baseY + (isReduced ? 0 : Math.sin(elapsed * 1.6 + cv.phaseOffset) * 0.06);
          cv.beaconGroup.scale.setScalar(isSelected ? 1.15 : 0.82);
        } else if (showSpotlight) {
          beaconMat.color.setHex(0xe85a43);
          beaconMat.emissive.setHex(0xc23824);
          beaconMat.emissiveIntensity = 0.95;
          ringMat.color.setHex(0xe85a43);
          ringMat.opacity = 0.95;
          scanMat.color.setHex(0xe85a43);
          scanMat.opacity = isReduced ? 0.65 : 0.45 + Math.sin(elapsed * 4.5) * 0.25;
          cv.scanRing.scale.setScalar(isReduced ? 1.2 : 1.1 + Math.sin(elapsed * 3.5) * 0.22);
          const pulse = isReduced ? 1.15 : 1.12 + Math.sin(elapsed * 4.2 + cv.phaseOffset) * 0.16;
          cv.beaconGroup.scale.setScalar(pulse);
          cv.beaconGroup.position.y =
            cv.baseY + (isReduced ? 0 : Math.sin(elapsed * 3.0 + cv.phaseOffset) * 0.16);
        } else {
          beaconMat.color.setHex(0xf4c44e);
          beaconMat.emissive.setHex(0xd4961e);
          beaconMat.emissiveIntensity = 0.62;
          ringMat.color.setHex(0xf4c44e);
          ringMat.opacity = 0.85;
          scanMat.color.setHex(0xf4c44e);
          scanMat.opacity = 0.36;
          cv.scanRing.scale.setScalar(
            isReduced ? 1.0 : 0.95 + Math.sin(elapsed * 2.2 + cv.phaseOffset) * 0.1
          );
          cv.beaconGroup.scale.setScalar(1.0);
          cv.beaconGroup.position.y =
            cv.baseY + (isReduced ? 0 : Math.sin(elapsed * 2.2 + cv.phaseOffset) * 0.11);
        }
        if (!isReduced) {
          cv.beaconMesh.rotation.y = elapsed * 1.45 + cv.phaseOffset;
        }
      }

      // Highlight active location perimeter ring
      (Object.keys(zoneRingMeshes) as LocationId[]).forEach((locId) => {
        const ring = zoneRingMeshes[locId];
        const rMat = ring.material as THREE.MeshBasicMaterial;
        const isCurrent = locId === curActiveLoc;
        const done = curState.investigations[locId].completed;
        if (done) {
          rMat.color.setHex(0x4bc98a);
          rMat.opacity = isCurrent ? 0.78 : 0.38;
        } else if (isCurrent) {
          rMat.color.setHex(0xf4c44e);
          rMat.opacity = 0.78;
        } else {
          rMat.color.setHex(ZONE_CONFIGS[locId].accentHex);
          rMat.opacity = 0.24;
        }
      });

      renderer.render(scene, camera);

      // Project floating 3D location markers directly via DOM refs
      const canvasW = renderer.domElement.clientWidth;
      const canvasH = renderer.domElement.clientHeight;
      (Object.keys(ZONE_CONFIGS) as LocationId[]).forEach((locId) => {
        const el = markerRefs.current[locId];
        if (!el) return;
        if (curIntro) {
          el.style.opacity = '0';
          el.style.pointerEvents = 'none';
          return;
        }
        const cfg = ZONE_CONFIGS[locId];
        _projVec.set(
          cfg.position[0] + cfg.markerOffset[0],
          cfg.position[1] + cfg.markerOffset[1],
          cfg.position[2] + cfg.markerOffset[2]
        );
        _projVec.project(camera);

        if (_projVec.z > 1 || _projVec.z < -1) {
          el.style.opacity = '0';
          el.style.pointerEvents = 'none';
          return;
        }

        const screenX = Math.max(105, Math.min(canvasW - 105, (_projVec.x * 0.5 + 0.5) * canvasW));
        const screenY = Math.max(78, Math.min(canvasH - 125, (-_projVec.y * 0.5 + 0.5) * canvasH));
        el.style.opacity = '1';
        el.style.pointerEvents = 'auto';
        el.style.transform = `translate3d(${screenX.toFixed(1)}px, ${screenY.toFixed(1)}px, 0) translate(-50%, -100%)`;
      });

      afterDraw(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      isDisposed = true;
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      controls.removeEventListener('start', handleControlsStart);
      controls.dispose();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);

      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      texSet.all.forEach((t) => t.dispose());
      envTarget.dispose();
      scene.environment = null;
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
    } catch {
      cleanupPartialInit();
      setWebglFailed(true);
    }
  }, []);

  if (webglFailed) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#DCE9D9] text-[#26382F] p-6 text-center space-y-3">
        <Compass className="w-10 h-10 text-[#315C48]" />
        <p className="font-display text-lg font-bold">Paparan 3D Tidak Tersedia pada Pelayar Ini</p>
        <p className="text-sm text-[#4B6357] max-w-md">
          Anda masih boleh menyiasat kesemua 4 lokasi menggunakan gambar sebenar dan senarai petunjuk
          di bahagian bawah.
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full select-none overflow-hidden">
      {/* 3D WebGL Canvas Mount */}
      <div
        ref={mountRef}
        className="w-full h-full"
        aria-label="Peta Kampus 3D Sekolah Seri Bestari"
      />

      {/* Projected 3D Location Markers */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-10">
        {LOCATIONS.map((loc) => {
          const cfg = ZONE_CONFIGS[loc.id];
          const inv = state.investigations[loc.id];
          const foundCount = inv.discoveredClueIds.length;
          const totalClues = loc.clues.length;
          const completionPct = inv.completed
            ? 100
            : Math.round((foundCount / Math.max(1, totalClues)) * 100);
          const isActive = activeLocationId === loc.id;
          const isDone = inv.completed;
          const isHovered = hoveredZoneId === loc.id;

          if (mode === 'dashboard') {
            const PinIcon =
              loc.id === 'kantin'
                ? UtensilsCrossed
                : loc.id === 'kelas'
                  ? BookOpen
                  : loc.id === 'perpustakaan'
                    ? Library
                    : Trees;

            const ringColor = isDone
              ? '#22C55E'
              : completionPct > 0
                ? '#E7C878'
                : '#94A3B8';
            const miniR = 8;
            const miniC = 2 * Math.PI * miniR;
            const miniDash = miniC * (1 - completionPct / 100);

            return (
              <button
                key={loc.id}
                ref={(el) => {
                  markerRefs.current[loc.id] = el;
                }}
                type="button"
                onClick={() => onSelectLocation(loc.id, true)}
                style={{ opacity: 0 }}
                aria-label={`${loc.name} (${completionPct}% selesai, ${foundCount}/${totalClues} bukti)`}
                className={`group absolute top-0 left-0 flex flex-col items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E7C878] rounded-xl transition-transform duration-150 ${
                  isActive || isHovered ? 'scale-105 z-20' : 'hover:scale-105 z-10'
                }`}
              >
                {/* Glowing Gold Teardrop Pin */}
                <span className="relative flex items-center justify-center mb-1">
                  <span
                    aria-hidden="true"
                    className={`absolute w-11 h-11 rounded-full ${
                      isActive
                        ? 'bg-[#E7C878]/55 shadow-[0_0_24px_rgba(231,200,120,0.95)]'
                        : 'bg-[#E7C878]/35 shadow-[0_0_16px_rgba(231,200,120,0.75)]'
                    }`}
                  />
                  <span className="relative w-10 h-10 rounded-full rounded-br-none -rotate-45 bg-gradient-to-br from-[#FFF1B8] via-[#E7C878] to-[#B68222] border-2 border-[#FFFFFF] shadow-[0_6px_14px_rgba(16,61,48,0.55)] flex items-center justify-center">
                    <PinIcon className="w-4 h-4 rotate-45 text-[#103D30] stroke-[2.4]" />
                  </span>
                </span>

                {/* Forest-Green & Gold Location Pill */}
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border-2 shadow-[0_6px_16px_rgba(10,28,20,0.55)] whitespace-nowrap ${
                    isActive
                      ? 'bg-[#174C39] border-[#E7C878] text-[#FFFFFF] ring-2 ring-[#E7C878]/50'
                      : 'bg-[#103D30]/95 border-[#E7C878]/85 text-[#F5E8CF] group-hover:bg-[#174C39]'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                      isDone
                        ? 'bg-[#22C55E] text-[#FFFFFF]'
                        : 'bg-[#E7C878]/20 text-[#E7C878]'
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-3 h-3 stroke-[2.8]" />
                    ) : (
                      <PinIcon className="w-2.5 h-2.5" />
                    )}
                  </span>
                  <span className="font-display text-[11px] sm:text-xs font-bold tracking-tight">
                    {loc.name}
                  </span>
                </span>

                {/* Mini Progress Ring + Live Completion Percentage */}
                <span className="mt-0.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#103D30]/92 border border-[#E7C878]/65 text-[#FFFFFF] shadow-md whitespace-nowrap">
                  {isDone ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#4ADE80] shrink-0" />
                  ) : (
                    <svg viewBox="0 0 22 22" className="w-4 h-4 -rotate-90 shrink-0" aria-hidden="true">
                      <circle
                        cx="11"
                        cy="11"
                        r={miniR}
                        fill="none"
                        stroke="rgba(255,255,255,0.22)"
                        strokeWidth="2.8"
                      />
                      <circle
                        cx="11"
                        cy="11"
                        r={miniR}
                        fill="none"
                        stroke={ringColor}
                        strokeWidth="2.8"
                        strokeLinecap="round"
                        strokeDasharray={miniC}
                        strokeDashoffset={miniDash}
                      />
                    </svg>
                  )}
                  <span className="font-mono-tabular text-[11px] font-extrabold text-[#FFFFFF]">
                    {completionPct}%
                  </span>
                </span>
              </button>
            );
          }

          return (
            <button
              key={loc.id}
              ref={(el) => {
                markerRefs.current[loc.id] = el;
              }}
              type="button"
              onClick={() => onSelectLocation(loc.id, true)}
              style={{ opacity: 0 }}
              aria-label={`${cfg.titleUpper} (${foundCount}/${totalClues} bukti)`}
              className={`absolute top-0 left-0 min-h-[44px] px-3 py-1.5 rounded-xl border-2 text-left transition-colors duration-150 shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E7C878] ${
                isDone
                  ? 'bg-[#FFFFFF] border-[#315C48] text-[#26382F]'
                  : isActive || isHovered
                  ? 'bg-[#FFFFFF] border-[#E7C878] text-[#26382F] shadow-[0_6px_20px_rgba(49,92,72,0.18)]'
                  : 'bg-[#F5F0E5]/95 border-[#A8C5A0] text-[#26382F] hover:border-[#315C48] hover:bg-[#FFFFFF]'
              }`}
            >
              <span className="flex items-center gap-2 whitespace-nowrap">
                <span
                  className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-mono-tabular font-bold ${
                    isDone
                      ? 'bg-[#315C48] text-[#FFFFFF]'
                      : isActive
                      ? 'bg-[#E7C878] text-[#26382F]'
                      : 'bg-[#DCE9D9] text-[#315C48]'
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <Search className="w-3.5 h-3.5" />
                  )}
                </span>
                <span className="flex flex-col leading-tight">
                  <span className="text-[11px] font-mono-tabular font-bold tracking-wide text-[#26382F]">
                    {cfg.titleUpper}
                  </span>
                  <span className="text-[10px] font-mono-tabular text-[#4B6357]">
                    {isDone ? 'SELESAI · BUKTI LENGKAP' : `${foundCount}/${totalClues} bukti ditemui`}
                  </span>
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Hover Clue Tooltip Badge */}
      {hoveredClueLabel && !introPhase && (
        <div className="pointer-events-none absolute top-16 left-1/2 -translate-x-1/2 z-20 px-3.5 py-1.5 rounded-xl bg-[#FFFFFF] border-2 border-[#E7C878] text-[#26382F] text-xs font-semibold shadow-lg flex items-center gap-2">
          <Search className="w-3.5 h-3.5 text-[#315C48]" />
          <span>Klik untuk periksa: {hoveredClueLabel}</span>
        </div>
      )}

      {/* Quick Return to Overview Camera button inside 3D viewport when focused */}
      {cameraMode === 'focus' && !introPhase && (
        <div className="absolute top-16 right-3 sm:right-4 z-20">
          <button
            type="button"
            onClick={onReturnOverview}
            className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FFFFFF] hover:bg-[#F5F0E5] border-2 border-[#315C48] text-[#26382F] text-xs font-bold shadow-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#315C48]" />
            <span>Peta Kampus 3D</span>
          </button>
        </div>
      )}
    </div>
  );
}
