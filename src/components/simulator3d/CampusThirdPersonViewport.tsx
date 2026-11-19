import React, { useEffect, useImperativeHandle, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { CheckCircle2, Compass, BookOpen, Library, Trees, UtensilsCrossed } from 'lucide-react';
import { gameAudio } from '../../game/audio';
import { LOCATIONS } from '../../game/data';
import type { GameState, LocationId } from '../../game/types';
import { createCampusTextures } from '../campus3dTextures';
import type { IntroScenePhase } from '../CinematicRevealIntro';
import { buildCampusSimulatorWorld, ZONE_TRIGGERS } from './campusWorldBuilder';
import { createEjenNurinCharacter } from './playerCharacter';
import type { SimulatorTelemetry, WorldBoxCollider } from './types';

export interface CampusSimulatorHandle {
  teleportToZone: (locId: LocationId) => void;
  faceZone: (locId: LocationId) => void;
  resetToPlaza: () => void;
}

interface CampusThirdPersonViewportProps {
  state: GameState;
  activeLocationId: LocationId;
  activeClueId: string | null;
  paused: boolean;
  sprintLocked: boolean;
  reducedMotion: boolean;
  introPhase?: IntroScenePhase | null;
  minimapArrowRef: React.RefObject<HTMLDivElement | null>;
  minimapPlayerDotRef: React.RefObject<HTMLDivElement | null>;
  onTelemetry: (telemetry: SimulatorTelemetry) => void;
  onEnterLocation: (locId: LocationId) => void;
  onInteractClue: (locId: LocationId, clueId: string) => void;
  onTogglePause: () => void;
  onToggleSprint: () => void;
}

const _camDesiredPos = new THREE.Vector3();
const _camTargetPos = new THREE.Vector3();
const _projVec = new THREE.Vector3();
const _moveDir = new THREE.Vector3();

function detectSoftwareWebGL(): boolean {
  try {
    const testCanvas = document.createElement('canvas');
    const gl = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl');
    if (!gl) return true;
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const rendererStr = debugInfo
      ? String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '')
      : '';
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|WARP|Software/i.test(rendererStr);
  } catch {
    return true;
  }
}

function pointHitsCollider(
  x: number,
  y: number,
  z: number,
  radius: number,
  c: WorldBoxCollider
): boolean {
  if (c.maxY !== undefined && y > c.maxY) return false;
  return (
    x + radius > c.minX &&
    x - radius < c.maxX &&
    z + radius > c.minZ &&
    z - radius < c.maxZ
  );
}

function resolveHorizontalCollisions(
  nextX: number,
  nextZ: number,
  prevX: number,
  prevZ: number,
  playerY: number,
  colliders: WorldBoxCollider[]
): [number, number] {
  const r = 0.42;
  let rx = THREE.MathUtils.clamp(nextX, -30.5, 30.5);
  let rz = THREE.MathUtils.clamp(nextZ, -30.0, 32.5);

  // Resolve X independently so character slides cleanly along walls
  for (let i = 0; i < colliders.length; i++) {
    if (pointHitsCollider(rx, playerY + 0.3, prevZ, r, colliders[i])) {
      rx = prevX;
      break;
    }
  }
  // Resolve Z independently
  for (let i = 0; i < colliders.length; i++) {
    if (pointHitsCollider(rx, playerY + 0.3, rz, r, colliders[i])) {
      rz = prevZ;
      break;
    }
  }
  return [rx, rz];
}

function computeWallSafeCameraPos(
  targetX: number,
  targetY: number,
  targetZ: number,
  desiredX: number,
  desiredY: number,
  desiredZ: number,
  colliders: WorldBoxCollider[],
  out: THREE.Vector3
) {
  const steps = 10;
  let safeFraction = 1.0;

  for (let s = 2; s <= steps; s++) {
    const t = s / steps;
    const sx = THREE.MathUtils.lerp(targetX, desiredX, t);
    const sy = THREE.MathUtils.lerp(targetY, desiredY, t);
    const sz = THREE.MathUtils.lerp(targetZ, desiredZ, t);

    let blocked = false;
    for (let i = 0; i < colliders.length; i++) {
      const c = colliders[i];
      if (!c.blockCamera) continue;
      if (pointHitsCollider(sx, sy, sz, 0.38, c)) {
        blocked = true;
        break;
      }
    }
    if (blocked) {
      safeFraction = Math.max(0.28, (s - 1) / steps);
      break;
    }
  }

  out.set(
    THREE.MathUtils.lerp(targetX, desiredX, safeFraction),
    Math.max(0.68, THREE.MathUtils.lerp(targetY, desiredY, safeFraction)),
    THREE.MathUtils.lerp(targetZ, desiredZ, safeFraction)
  );
}

export const CampusThirdPersonViewport = React.forwardRef<
  CampusSimulatorHandle,
  CampusThirdPersonViewportProps
>(function CampusThirdPersonViewport(
  {
    state,
    activeLocationId,
    activeClueId,
    paused,
    sprintLocked,
    reducedMotion,
    introPhase = null,
    minimapArrowRef,
    minimapPlayerDotRef,
    onTelemetry,
    onEnterLocation,
    onInteractClue,
    onTogglePause,
    onToggleSprint,
  },
  ref
) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const markerRefs = useRef<Record<LocationId, HTMLButtonElement | null>>({
    kantin: null,
    kelas: null,
    perpustakaan: null,
    taman: null,
  });

  const [webglFailed, setWebglFailed] = useState(false);
  const [hoveredClueLabel, setHoveredClueLabel] = useState<string | null>(null);

  // Refs synced cleanly without resetting Three.js WebGL context
  const stateRef = useRef(state);
  stateRef.current = state;
  const activeLocRef = useRef(activeLocationId);
  activeLocRef.current = activeLocationId;
  const activeClueRef = useRef(activeClueId);
  activeClueRef.current = activeClueId;
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const sprintLockedRef = useRef(sprintLocked);
  sprintLockedRef.current = sprintLocked;
  const reducedMotionRef = useRef(reducedMotion);
  reducedMotionRef.current = reducedMotion;
  const introPhaseRef = useRef(introPhase);
  introPhaseRef.current = introPhase;

  const callbacksRef = useRef({
    onTelemetry,
    onEnterLocation,
    onInteractClue,
    onTogglePause,
    onToggleSprint,
  });
  callbacksRef.current = {
    onTelemetry,
    onEnterLocation,
    onInteractClue,
    onTogglePause,
    onToggleSprint,
  };

  // Player & camera runtime state ref (accessed by both RAF loop and imperative teleport)
  const simStateRef = useRef({
    px: 0,
    py: 0,
    pz: 15.8,
    vy: 0,
    isGrounded: true,
    playerYaw: Math.PI, // Facing North (-Z) toward Central Fountain & Main School Building
    camYaw: Math.PI,
    camPitch: 0.28,
    camDist: 5.5,
    nearbyZoneId: null as LocationId | null,
    nearbyClueId: null as string | null,
    nearbyClueLocationId: null as LocationId | null,
    transitionFlash: 0,
  });

  useImperativeHandle(
    ref,
    () => ({
      teleportToZone(locId: LocationId) {
        const z = ZONE_TRIGGERS[locId];
        simStateRef.current.px = z.spawnPoint[0];
        simStateRef.current.py = 0;
        simStateRef.current.pz = z.spawnPoint[2];
        simStateRef.current.vy = 0;
        simStateRef.current.isGrounded = true;
        simStateRef.current.playerYaw = z.spawnYaw;
        simStateRef.current.camYaw = z.spawnYaw;
        simStateRef.current.camPitch = 0.28;
        simStateRef.current.transitionFlash = 1.0;
      },
      faceZone(locId: LocationId) {
        const z = ZONE_TRIGGERS[locId];
        const dx = z.center[0] - simStateRef.current.px;
        const dz = z.center[2] - simStateRef.current.pz;
        const angle = Math.atan2(dx, dz);
        simStateRef.current.playerYaw = angle;
        simStateRef.current.camYaw = angle;
      },
      resetToPlaza() {
        simStateRef.current.px = 0;
        simStateRef.current.py = 0;
        simStateRef.current.pz = 15.8;
        simStateRef.current.vy = 0;
        simStateRef.current.isGrounded = true;
        simStateRef.current.playerYaw = Math.PI;
        simStateRef.current.camYaw = Math.PI;
        simStateRef.current.camPitch = 0.28;
        simStateRef.current.camDist = 5.5;
      },
    }),
    []
  );

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareWebGL();
    let cleanupRenderer: THREE.WebGLRenderer | null = null;
    let cleanupScene: THREE.Scene | null = null;
    let cleanupEnvTarget: THREE.WebGLRenderTarget | null = null;
    let cleanupTexSet: ReturnType<typeof createCampusTextures> | null = null;
    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];
    const extraTextures: THREE.Texture[] = [];

    const cleanupPartialInit = () => {
      try {
        geometries.forEach((g) => g.dispose());
        materials.forEach((m) => m.dispose());
        cleanupTexSet?.all.forEach((t) => t.dispose());
        extraTextures.forEach((t) => t.dispose());
        cleanupEnvTarget?.dispose();
        if (cleanupScene) cleanupScene.environment = null;
        if (cleanupRenderer) {
          if (cleanupRenderer.domElement.parentNode === container) {
            container.removeChild(cleanupRenderer.domElement);
          }
          cleanupRenderer.dispose();
        }
      } catch {
        // ignore cleanup errors
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
      renderer.toneMappingExposure = 1.14;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.shadowMap.enabled = !isSoftwareGl;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.domElement.style.display = 'block';
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      renderer.domElement.style.outline = 'none';
      container.appendChild(renderer.domElement);

      const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
        geometries.push(g);
        return g;
      };
      const trackMat = <T extends THREE.Material>(m: T): T => {
        materials.push(m);
        return m;
      };
      const trackTex = <T extends THREE.Texture>(t: T): T => {
        extraTextures.push(t);
        return t;
      };

      const maxAniso = Math.min(renderer.capabilities.getMaxAnisotropy() || 1, 8);
      const texSet = createCampusTextures(maxAniso);
      cleanupTexSet = texSet;

      const scene = new THREE.Scene();
      cleanupScene = scene;
      scene.background = new THREE.Color(0xcde3ee);
      scene.fog = new THREE.FogExp2(0xddebe2, 0.0046);

      const pmrem = new THREE.PMREMGenerator(renderer);
      const roomEnv = new RoomEnvironment();
      const envTarget = pmrem.fromScene(roomEnv, 0.04);
      cleanupEnvTarget = envTarget;
      scene.environment = envTarget.texture;
      roomEnv.dispose();
      pmrem.dispose();

    const camera = new THREE.PerspectiveCamera(48, width / height, 0.25, 240);

    // Warm Daylight Key + Sky/Grass Hemisphere + Cool Fill
    const hemiLight = new THREE.HemisphereLight(0xf6fbff, 0x5c7d5e, 1.38);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfff3d8, 2.7);
    sunLight.position.set(28, 36, 22);
    if (!isSoftwareGl) {
      sunLight.castShadow = true;
      sunLight.shadow.mapSize.width = 2048;
      sunLight.shadow.mapSize.height = 2048;
      sunLight.shadow.camera.near = 2;
      sunLight.shadow.camera.far = 110;
      sunLight.shadow.camera.left = -36;
      sunLight.shadow.camera.right = 36;
      sunLight.shadow.camera.top = 36;
      sunLight.shadow.camera.bottom = -36;
      sunLight.shadow.radius = 2.6;
      sunLight.shadow.bias = -0.00045;
      sunLight.shadow.normalBias = 0.025;
    }
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0xc2dce8, 0.72);
    rimLight.position.set(-24, 16, -24);
    scene.add(rimLight);

    // Build Rich Open-World Campus & Player Character
    const world = buildCampusSimulatorWorld(
      scene,
      texSet,
      isSoftwareGl,
      trackGeo,
      trackMat,
      trackTex
    );

    const playerRig = createEjenNurinCharacter(
      texSet.contactShadowMap,
      isSoftwareGl,
      trackGeo,
      trackMat
    );
    playerRig.root.position.set(simStateRef.current.px, 0, simStateRef.current.pz);
    playerRig.root.rotation.y = simStateRef.current.playerYaw;
    scene.add(playerRig.root);

    // Initialize camera behind Ejen Nurin looking into the school campus
    camera.position.set(0, 3.2, 21.0);
    camera.lookAt(0, 1.7, 10.0);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // =========================================================================
    // KEYBOARD + MOUSE + POINTER LOCK CONTROLS
    // =========================================================================
    const keys: Record<string, boolean> = {};
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let lastDragX = 0;
    let lastDragY = 0;
    let pointerDownMoved = 0;

    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2();

    const isInputFocused = () => {
      const el = document.activeElement;
      if (!el) return false;
      const tag = el.tagName.toLowerCase();
      return tag === 'input' || tag === 'textarea' || tag === 'select';
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        if (document.pointerLockElement === renderer.domElement) {
          document.exitPointerLock?.();
        }
        callbacksRef.current.onTogglePause();
        return;
      }
      if (isInputFocused() || pausedRef.current || introPhaseRef.current) return;

      keys[e.code] = true;

      if (e.code === 'Space') {
        e.preventDefault();
        if (simStateRef.current.isGrounded) {
          simStateRef.current.vy = 5.9;
          simStateRef.current.isGrounded = false;
          if (stateRef.current.soundEnabled) gameAudio.playJump();
        }
      } else if (e.code === 'KeyE') {
        const s = simStateRef.current;
        if (s.nearbyClueId && s.nearbyClueLocationId) {
          callbacksRef.current.onInteractClue(s.nearbyClueLocationId, s.nearbyClueId);
        } else if (s.nearbyZoneId) {
          if (document.pointerLockElement === renderer.domElement) {
            document.exitPointerLock?.();
          }
          callbacksRef.current.onEnterLocation(s.nearbyZoneId);
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keys[e.code] = false;
    };

    const onWindowBlur = () => {
      Object.keys(keys).forEach((k) => {
        keys[k] = false;
      });
      isDragging = false;
    };

    const onPointerDown = (e: PointerEvent) => {
      if (pausedRef.current || introPhaseRef.current) return;
      isDragging = true;
      pointerDownMoved = 0;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      lastDragX = e.clientX;
      lastDragY = e.clientY;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (pausedRef.current || introPhaseRef.current) return;

      if (document.pointerLockElement === renderer.domElement) {
        simStateRef.current.camYaw -= e.movementX * 0.0032;
        simStateRef.current.camPitch = THREE.MathUtils.clamp(
          simStateRef.current.camPitch + e.movementY * 0.0026,
          0.02,
          0.95
        );
        return;
      }

      if (isDragging) {
        const dx = e.clientX - lastDragX;
        const dy = e.clientY - lastDragY;
        lastDragX = e.clientX;
        lastDragY = e.clientY;
        pointerDownMoved = Math.hypot(e.clientX - dragStartX, e.clientY - dragStartY);
        simStateRef.current.camYaw -= dx * 0.0055;
        simStateRef.current.camPitch = THREE.MathUtils.clamp(
          simStateRef.current.camPitch + dy * 0.0042,
          0.02,
          0.95
        );
        renderer.domElement.style.cursor = 'grabbing';
        return;
      }

      // Lightweight hover raycast on clue objects
      const rect = renderer.domElement.getBoundingClientRect();
      pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointerNdc, camera);
      const clueHits = raycaster.intersectObjects(
        world.clueNodes.map((c) => c.hitMesh),
        false
      );
      if (clueHits.length > 0 && clueHits[0].distance < 24) {
        const data = clueHits[0].object.userData as { clueId: string; locationId: LocationId };
        const loc = LOCATIONS.find((l) => l.id === data.locationId);
        const clue = loc?.clues.find((c) => c.id === data.clueId);
        setHoveredClueLabel(clue?.label || 'Periksa Bukti');
        renderer.domElement.style.cursor = 'pointer';
      } else {
        setHoveredClueLabel(null);
        renderer.domElement.style.cursor = 'grab';
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!isDragging) return;
      isDragging = false;
      renderer.domElement.style.cursor = 'grab';
      if (pointerDownMoved > 8 || pausedRef.current || introPhaseRef.current) return;

      // Click directly on a 3D clue beacon to inspect/discover it
      const rect = renderer.domElement.getBoundingClientRect();
      pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointerNdc, camera);
      const clueHits = raycaster.intersectObjects(
        world.clueNodes.map((c) => c.hitMesh),
        false
      );
      if (clueHits.length > 0 && clueHits[0].distance < 24) {
        const data = clueHits[0].object.userData as { clueId: string; locationId: LocationId };
        callbacksRef.current.onInteractClue(data.locationId, data.clueId);
      }
    };

    const onWheel = (e: WheelEvent) => {
      if (pausedRef.current) return;
      e.preventDefault();
      simStateRef.current.camDist = THREE.MathUtils.clamp(
        simStateRef.current.camDist + e.deltaY * 0.004,
        3.4,
        9.6
      );
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onWindowBlur);
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });

    const resizeObserver = new ResizeObserver(() => {
      const w = Math.max(container.clientWidth, 320);
      const h = Math.max(container.clientHeight, 320);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObserver.observe(container);

    const onContextLost = (e: Event) => e.preventDefault();
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);

    // =========================================================================
    // SIMULATION GAME LOOP (CLOCK + PHYSICS + ANIMATION + SOFTWARE GL PACING)
    // =========================================================================
    const clock = new THREE.Clock();
    let rafId = 0;
    let isDisposed = false;
    let lastTelemetrySent = 0;
    let prevZoneId: LocationId | null = null;
    let prevClueId: string | null = null;

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
      const isPaused = pausedRef.current || Boolean(introPhaseRef.current);
      const s = simStateRef.current;

      // 1. Player Movement & Physics
      let horizSpeed = 0;
      const running =
        Boolean(keys['ShiftLeft'] || keys['ShiftRight']) || sprintLockedRef.current;

      if (!isPaused) {
        let forwardInput = 0;
        let rightInput = 0;
        if (keys['KeyW'] || keys['ArrowUp']) forwardInput += 1;
        if (keys['KeyS'] || keys['ArrowDown']) forwardInput -= 1;
        if (keys['KeyD'] || keys['ArrowRight']) rightInput += 1;
        if (keys['KeyA'] || keys['ArrowLeft']) rightInput -= 1;

        if (forwardInput !== 0 || rightInput !== 0) {
          // Camera forward in XZ plane: since camera sits at +sin(camYaw), +cos(camYaw) behind player,
          // looking direction from camera toward player is (-sin(camYaw), -cos(camYaw)) — wait:
          // Let's keep standard convention: player facing yaw = angle where +Z local faces (sin(yaw), cos(yaw))!
          // If camera sits behind player at (px - sin(camYaw)*d, pz - cos(camYaw)*d), then camera forward is (sin(camYaw), cos(camYaw))!
          const fwdX = Math.sin(s.camYaw);
          const fwdZ = Math.cos(s.camYaw);
          const rgtX = -Math.cos(s.camYaw);
          const rgtZ = Math.sin(s.camYaw);

          _moveDir.set(
            fwdX * forwardInput + rgtX * rightInput,
            0,
            fwdZ * forwardInput + rgtZ * rightInput
          );
          if (_moveDir.lengthSq() > 0.0001) {
            _moveDir.normalize();
            const speed = running ? 8.4 : 4.5;
            horizSpeed = speed;

            const nextX = s.px + _moveDir.x * speed * dt;
            const nextZ = s.pz + _moveDir.z * speed * dt;
            const [resolvedX, resolvedZ] = resolveHorizontalCollisions(
              nextX,
              nextZ,
              s.px,
              s.pz,
              s.py,
              world.colliders
            );
            s.px = resolvedX;
            s.pz = resolvedZ;

            // Smooth shortest-angle character turn toward movement direction
            const targetYaw = Math.atan2(_moveDir.x, _moveDir.z);
            let diff = targetYaw - s.playerYaw;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            s.playerYaw += diff * Math.min(1, dt * 12);
          }
        }

        // Vertical jump & gravity
        if (!s.isGrounded || s.vy !== 0) {
          s.vy -= 16.5 * dt;
          s.py += s.vy * dt;
          if (s.py <= 0) {
            s.py = 0;
            s.vy = 0;
            s.isGrounded = true;
          }
        }
      }

      playerRig.root.position.set(s.px, s.py, s.pz);
      playerRig.root.rotation.y = s.playerYaw;
      const stepped = playerRig.updateAnimation(
        dt,
        elapsed,
        horizSpeed,
        running,
        s.isGrounded,
        s.vy,
        isReduced
      );
      if (stepped && !isPaused && stateRef.current.soundEnabled) {
        gameAudio.playFootstep(running);
      }

      // 2. Third-Person Follow Camera + Wall Collision Clamping
      const lookTargetX = s.px + Math.cos(s.camYaw) * 0.22; // Slight right shoulder offset like reference
      const lookTargetY = s.py + 1.56;
      const lookTargetZ = s.pz - Math.sin(s.camYaw) * 0.22;

      const horizDist = Math.cos(s.camPitch) * s.camDist;
      const desiredCamX = lookTargetX - Math.sin(s.camYaw) * horizDist;
      const desiredCamY = lookTargetY + Math.sin(s.camPitch) * s.camDist + 0.55;
      const desiredCamZ = lookTargetZ - Math.cos(s.camYaw) * horizDist;

      computeWallSafeCameraPos(
        lookTargetX,
        lookTargetY,
        lookTargetZ,
        desiredCamX,
        desiredCamY,
        desiredCamZ,
        world.colliders,
        _camDesiredPos
      );

      if (s.transitionFlash > 0) {
        camera.position.copy(_camDesiredPos);
        s.transitionFlash = 0;
      } else {
        const camLambda = isReduced ? 24 : 11;
        camera.position.x = THREE.MathUtils.damp(camera.position.x, _camDesiredPos.x, camLambda, dt);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, _camDesiredPos.y, camLambda, dt);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, _camDesiredPos.z, camLambda, dt);
      }

      _camTargetPos.set(
        lookTargetX + Math.sin(s.camYaw) * 2.2,
        lookTargetY - 0.08,
        lookTargetZ + Math.cos(s.camYaw) * 2.2
      );
      camera.lookAt(_camTargetPos);

      // 3. Living World Animations (NPCs, Trees, Flags, Clouds, Birds, Water, Waypoint)
      if (!isReduced) {
        world.treeCanopyTops.rotation.z = Math.sin(elapsed * 0.65) * 0.005;
        world.dustPoints.rotation.y = elapsed * 0.015;

        for (let i = 0; i < world.banners.length; i++) {
          const b = world.banners[i];
          b.cloth.rotation.y = b.baseRotY + Math.sin(elapsed * 2.4 + b.phase) * 0.14;
          b.cloth.rotation.z = Math.cos(elapsed * 1.9 + b.phase) * 0.04;
        }

        for (let i = 0; i < world.clouds.length; i++) {
          const c = world.clouds[i];
          c.position.x += dt * 0.45;
          if (c.position.x > 68) c.position.x = -68;
        }

        for (let i = 0; i < world.birds.length; i++) {
          const bird = world.birds[i];
          const a = elapsed * bird.speed + bird.phase;
          const bx = bird.centerX + Math.cos(a) * bird.radius;
          const bz = bird.centerZ + Math.sin(a) * bird.radius;
          bird.group.position.set(bx, bird.altitude + Math.sin(a * 2) * 0.6, bz);
          bird.group.rotation.y = -a;
          const flap = Math.sin(elapsed * 7.5 + bird.phase) * 0.48;
          bird.leftWing.rotation.z = flap;
          bird.rightWing.rotation.z = -flap;
        }

        for (let i = 0; i < world.waterMeshes.length; i++) {
          const wm = world.waterMeshes[i];
          wm.scale.x = 1 + Math.sin(elapsed * 1.8 + i) * 0.008;
          wm.scale.z = 1 + Math.cos(elapsed * 1.8 + i) * 0.008;
        }

        // NPC Students walking smoothly along campus routes
        for (let i = 0; i < world.npcWalkers.length; i++) {
          const npc = world.npcWalkers[i];
          const wp = npc.waypoints[npc.waypointIdx];
          const dx = wp[0] - npc.group.position.x;
          const dz = wp[1] - npc.group.position.z;
          const dist = Math.hypot(dx, dz);
          if (dist < 0.35) {
            npc.waypointIdx = (npc.waypointIdx + 1) % npc.waypoints.length;
          } else {
            npc.group.position.x += (dx / dist) * npc.speed * dt;
            npc.group.position.z += (dz / dist) * npc.speed * dt;
            const targetRot = Math.atan2(dx, dz);
            npc.group.rotation.y = targetRot;
            const stride = Math.sin(elapsed * 5.2 + npc.phaseOffset) * 0.45;
            npc.leftLeg.rotation.x = stride;
            npc.rightLeg.rotation.x = -stride;
            npc.leftArm.rotation.x = -stride * 0.7;
            npc.rightArm.rotation.x = stride * 0.7;
          }
        }
      }

      // 4. Active Waypoint & Clue Beacon Visual State
      const curState = stateRef.current;
      const curLoc = activeLocRef.current;
      const curClue = activeClueRef.current;
      const targetTrigger = ZONE_TRIGGERS[curLoc];
      world.activeWaypointRing.position.set(
        targetTrigger.spawnPoint[0],
        0.12,
        targetTrigger.spawnPoint[2]
      );
      if (!isReduced) {
        const pulse = 1 + Math.sin(elapsed * 3.0) * 0.08;
        world.activeWaypointRing.scale.set(pulse, pulse, 1);
      }

      // Check proximity to Zones and Clue Objects
      let closestZone: LocationId | null = null;
      let closestZoneDist = Infinity;
      for (const locId of Object.keys(ZONE_TRIGGERS) as LocationId[]) {
        const z = ZONE_TRIGGERS[locId];
        const d = Math.hypot(s.px - z.center[0], s.pz - z.center[2]);
        if (d <= z.radius && d < closestZoneDist) {
          closestZoneDist = d;
          closestZone = locId;
        }

        const rMat = world.zoneRings[locId].material as THREE.MeshBasicMaterial;
        const done = curState.investigations[locId].completed;
        if (done) {
          rMat.color.setHex(0x4bc98a);
          rMat.opacity = locId === closestZone ? 0.85 : 0.4;
        } else if (locId === closestZone || locId === curLoc) {
          rMat.color.setHex(0xf4c44e);
          rMat.opacity = 0.78;
        } else {
          rMat.color.setHex(0xe7c878);
          rMat.opacity = 0.25;
        }
      }

      let closestClueId: string | null = null;
      let closestClueLoc: LocationId | null = null;
      let closestClueDist = 3.25;

      for (let i = 0; i < world.clueNodes.length; i++) {
        const cn = world.clueNodes[i];
        const dist = Math.hypot(s.px - cn.worldPos.x, s.pz - cn.worldPos.z);
        const inv = curState.investigations[cn.locationId];
        const discovered = inv.discoveredClueIds.includes(cn.clueId);

        if (dist < closestClueDist) {
          closestClueDist = dist;
          closestClueId = cn.clueId;
          closestClueLoc = cn.locationId;
        }

        const bMat = cn.beaconMesh.material as THREE.MeshStandardMaterial;
        const rMat = cn.beaconRing.material as THREE.MeshBasicMaterial;
        const sMat = cn.scanRing.material as THREE.MeshBasicMaterial;
        const showSpotlight = inv.hintLevelUsed >= 3 && !discovered;
        const isSelected = curClue === cn.clueId;

        if (discovered) {
          bMat.color.setHex(0x4bc98a);
          bMat.emissive.setHex(0x1f6b47);
          bMat.emissiveIntensity = isSelected ? 0.9 : 0.35;
          rMat.color.setHex(0x4bc98a);
          sMat.color.setHex(0x4bc98a);
          sMat.opacity = 0.22;
          cn.beaconGroup.scale.setScalar(0.8);
        } else if (showSpotlight) {
          bMat.color.setHex(0xe85a43);
          bMat.emissive.setHex(0xc23824);
          bMat.emissiveIntensity = 1.0;
          rMat.color.setHex(0xe85a43);
          sMat.color.setHex(0xe85a43);
          sMat.opacity = 0.65;
          cn.beaconGroup.scale.setScalar(isReduced ? 1.15 : 1.1 + Math.sin(elapsed * 4) * 0.14);
        } else {
          bMat.color.setHex(0xf4c44e);
          bMat.emissive.setHex(0xd99b26);
          bMat.emissiveIntensity = dist < 3.4 ? 1.0 : 0.65;
          rMat.color.setHex(0xf4c44e);
          sMat.color.setHex(0xf4c44e);
          sMat.opacity = dist < 3.4 ? 0.72 : 0.38;
          cn.beaconGroup.scale.setScalar(dist < 3.4 ? 1.15 : 1.0);
        }

        if (!isReduced) {
          cn.beaconMesh.rotation.y = elapsed * 1.5 + cn.phaseOffset;
          cn.beaconGroup.position.y = cn.baseY + Math.sin(elapsed * 2.2 + cn.phaseOffset) * 0.11;
        }
      }

      s.nearbyZoneId = closestZone;
      s.nearbyClueId = closestClueId;
      s.nearbyClueLocationId = closestClueLoc;

      // 5. Render Scene
      renderer.render(scene, camera);

      // 6. Project Floating Location Markers + Update Live Mini-Map DOM Refs Directly
      const canvasW = renderer.domElement.clientWidth;
      const canvasH = renderer.domElement.clientHeight;
      (Object.keys(ZONE_TRIGGERS) as LocationId[]).forEach((locId) => {
        const el = markerRefs.current[locId];
        if (!el) return;
        if (introPhaseRef.current) {
          el.style.opacity = '0';
          el.style.pointerEvents = 'none';
          return;
        }
        const cfg = ZONE_TRIGGERS[locId];
        _projVec.set(cfg.markerPos[0], cfg.markerPos[1], cfg.markerPos[2]);
        _projVec.project(camera);

        if (_projVec.z > 1 || _projVec.z < -1) {
          el.style.opacity = '0';
          el.style.pointerEvents = 'none';
          return;
        }
        const sx = (_projVec.x * 0.5 + 0.5) * canvasW;
        const sy = (-_projVec.y * 0.5 + 0.5) * canvasH;
        if (sx < -60 || sx > canvasW + 60 || sy < 40 || sy > canvasH - 40) {
          el.style.opacity = '0';
          el.style.pointerEvents = 'none';
          return;
        }
        el.style.opacity = '1';
        el.style.pointerEvents = 'auto';
        el.style.transform = `translate3d(${sx.toFixed(1)}px, ${sy.toFixed(1)}px, 0) translate(-50%, -100%)`;
      });

      // Live Mini-Map player dot & compass yaw update (campus spans -32..+32)
      if (minimapPlayerDotRef.current) {
        const mapPctX = THREE.MathUtils.clamp(((s.px + 32) / 64) * 100, 6, 94);
        const mapPctY = THREE.MathUtils.clamp(((s.pz + 32) / 64) * 100, 6, 94);
        minimapPlayerDotRef.current.style.left = `${mapPctX.toFixed(1)}%`;
        minimapPlayerDotRef.current.style.top = `${mapPctY.toFixed(1)}%`;
      }
      if (minimapArrowRef.current) {
        // Yaw 0 = +Z (South down, 180deg CSS); Yaw PI = -Z (North up, 0deg CSS)
        const deg = 180 - THREE.MathUtils.radToDeg(s.playerYaw);
        minimapArrowRef.current.style.transform = `rotate(${deg.toFixed(1)}deg)`;
      }

      // Emit React telemetry whenever proximity changes or every ~180ms
      const now = performance.now();
      if (
        closestZone !== prevZoneId ||
        closestClueId !== prevClueId ||
        now - lastTelemetrySent > 180
      ) {
        prevZoneId = closestZone;
        prevClueId = closestClueId;
        lastTelemetrySent = now;
        const areaName = closestZone
          ? ZONE_TRIGGERS[closestZone].name
          : s.pz > 24
            ? 'Pintu Masuk Utama'
            : Math.hypot(s.px, s.pz - 1.5) < 11
              ? 'Dataran Utama Sekolah'
              : 'Kawasan Kampus Seri Bestari';
        callbacksRef.current.onTelemetry({
          playerX: s.px,
          playerZ: s.pz,
          playerYaw: s.playerYaw,
          isMoving: horizSpeed > 0.35,
          isRunning: running && horizSpeed > 0.35,
          isGrounded: s.isGrounded,
          nearbyZoneId: closestZone,
          nearbyClueId: closestClueId,
          nearbyClueLocationId: closestClueLoc,
          currentAreaName: areaName,
        });
      }

      afterDraw(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      isDisposed = true;
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onWindowBlur);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('wheel', onWheel);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);

      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      texSet.all.forEach((t) => t.dispose());
      extraTextures.forEach((t) => t.dispose());
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
  }, [minimapArrowRef, minimapPlayerDotRef]);

  if (webglFailed) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#DCE9D9] text-[#26382F] p-6 text-center space-y-3">
        <Compass className="w-10 h-10 text-[#174C39]" />
        <p className="font-display text-lg font-bold">Paparan 3D Tidak Tersedia pada Pelayar Ini</p>
        <p className="text-sm text-[#4B6357] max-w-md">
          Anda masih boleh membuka Jurnal Detektif untuk menyiasat kesemua 4 lokasi menggunakan gambar
          sebenar.
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full select-none overflow-hidden">
      {/* 3D Open-World WebGL Mount */}
      <div
        ref={mountRef}
        className="w-full h-full"
        aria-label="Simulator 3D Sekolah Seri Bestari"
      />

      {/* Projected Overhead Gold Location Markers */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-10">
        {LOCATIONS.map((loc) => {
          const inv = state.investigations[loc.id];
          const foundCount = inv.discoveredClueIds.length;
          const totalClues = loc.clues.length;
          const completionPct = inv.completed
            ? 100
            : Math.round((foundCount / Math.max(1, totalClues)) * 100);
          const isDone = inv.completed;
          const isActive = activeLocationId === loc.id;

          const PinIcon =
            loc.id === 'kantin'
              ? UtensilsCrossed
              : loc.id === 'kelas'
                ? BookOpen
                : loc.id === 'perpustakaan'
                  ? Library
                  : Trees;

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
              onClick={() => {
                const z = ZONE_TRIGGERS[loc.id];
                simStateRef.current.px = z.spawnPoint[0];
                simStateRef.current.pz = z.spawnPoint[2];
                simStateRef.current.playerYaw = z.spawnYaw;
                simStateRef.current.camYaw = z.spawnYaw;
                simStateRef.current.transitionFlash = 1;
                if (state.soundEnabled) gameAudio.playTransition();
                onEnterLocation(loc.id);
              }}
              style={{ opacity: 0 }}
              aria-label={`${loc.name} (${completionPct}% selesai)`}
              className={`group absolute top-0 left-0 flex flex-col items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E7C878] rounded-xl transition-transform duration-150 ${
                isActive ? 'scale-105 z-20' : 'hover:scale-105 z-10'
              }`}
            >
              {/* Gold Circular Beacon */}
              <span className="relative flex items-center justify-center mb-1">
                <span className="relative w-10 h-10 rounded-full bg-gradient-to-br from-[#FFF2B2] via-[#E7C878] to-[#B68222] border-2 border-[#FFFFFF] shadow-[0_6px_16px_rgba(16,61,48,0.55)] flex items-center justify-center">
                  <PinIcon className="w-4 h-4 text-[#103D30] stroke-[2.4]" />
                </span>
              </span>

              {/* Location Name Pill */}
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border-2 shadow-lg whitespace-nowrap ${
                  isActive
                    ? 'bg-[#174C39] border-[#E7C878] text-[#FFFFFF]'
                    : 'bg-[#103D30]/95 border-[#E7C878]/85 text-[#F5E8CF]'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                    isDone ? 'bg-[#22C55E] text-[#FFFFFF]' : 'bg-[#E7C878]/20 text-[#E7C878]'
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-3 h-3 stroke-[2.8]" />
                  ) : (
                    <PinIcon className="w-2.5 h-2.5" />
                  )}
                </span>
                <span className="font-display text-[11px] font-bold tracking-tight">
                  {loc.name}
                </span>
              </span>

              {/* Circular % Completion Pill */}
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
                      stroke={completionPct > 0 ? '#E7C878' : '#94A3B8'}
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
        })}
      </div>

      {/* Hover Clue Tooltip */}
      {hoveredClueLabel && !paused && !introPhase && (
        <div className="pointer-events-none absolute top-20 left-1/2 -translate-x-1/2 z-20 px-3.5 py-1.5 rounded-xl bg-[#103D30] border-2 border-[#E7C878] text-[#FFFFFF] text-xs font-bold shadow-xl whitespace-nowrap">
          Klik atau tekan [E]: {hoveredClueLabel}
        </div>
      )}
    </div>
  );
});
