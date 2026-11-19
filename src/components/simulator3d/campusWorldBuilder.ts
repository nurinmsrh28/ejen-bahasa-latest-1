import * as THREE from 'three';
import type { LocationId } from '../../game/types';
import type { CampusTextureSet } from '../campus3dTextures';
import type {
  ClueBeaconNode,
  NpcWalker,
  SkyBird,
  SwayingBanner,
  WorldBoxCollider,
  ZoneTriggerConfig,
} from './types';

export const ZONE_TRIGGERS: Record<LocationId, ZoneTriggerConfig> = {
  kantin: {
    id: 'kantin',
    name: 'Kantin Ceria',
    shortName: 'Kantin',
    center: [-15.5, 0, 2.5],
    spawnPoint: [-10.2, 0, 3.2],
    spawnYaw: -Math.PI / 2,
    markerPos: [-15.5, 5.5, 2.5],
    radius: 7.4,
  },
  kelas: {
    id: 'kelas',
    name: 'Kelas Harmoni',
    shortName: 'Kelas',
    center: [-16.5, 0, -13.5],
    spawnPoint: [-10.8, 0, -9.2],
    spawnYaw: -Math.PI * 0.72,
    markerPos: [-16.5, 7.6, -13.5],
    radius: 7.5,
  },
  perpustakaan: {
    id: 'perpustakaan',
    name: 'Perpustakaan Ilmu',
    shortName: 'Perpustakaan',
    center: [16.5, 0, -13.5],
    spawnPoint: [10.8, 0, -9.2],
    spawnYaw: Math.PI * 0.72,
    markerPos: [16.5, 7.8, -13.5],
    radius: 7.5,
  },
  taman: {
    id: 'taman',
    name: 'Taman Rekreasi',
    shortName: 'Taman',
    center: [15.5, 0, 4.0],
    spawnPoint: [10.0, 0, 4.5],
    spawnYaw: Math.PI / 2,
    markerPos: [15.5, 5.2, 4.0],
    radius: 7.4,
  },
};

export interface BuiltCampusWorld {
  worldGroup: THREE.Group;
  colliders: WorldBoxCollider[];
  clueNodes: ClueBeaconNode[];
  zoneRings: Record<LocationId, THREE.Mesh>;
  npcWalkers: NpcWalker[];
  banners: SwayingBanner[];
  clouds: THREE.Group[];
  birds: SkyBird[];
  waterMeshes: THREE.Mesh[];
  treeCanopyTops: THREE.InstancedMesh;
  dustPoints: THREE.Points;
  activeWaypointRing: THREE.Mesh;
}

function makeCanvasSignTexture(
  title: string,
  subtitle: string,
  bgHex: string,
  fgHex: string,
  borderHex: string,
  trackTex: (t: THREE.Texture) => THREE.Texture
): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 160;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = bgHex;
  ctx.fillRect(0, 0, 512, 160);
  ctx.strokeStyle = borderHex;
  ctx.lineWidth = 12;
  ctx.strokeRect(8, 8, 496, 144);
  ctx.fillStyle = fgHex;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '800 44px Georgia, serif';
  ctx.fillText(title, 256, subtitle ? 64 : 80);
  if (subtitle) {
    ctx.font = '600 24px sans-serif';
    ctx.fillStyle = borderHex;
    ctx.fillText(subtitle, 256, 118);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return trackTex(tex) as THREE.CanvasTexture;
}

function makeBannerCrestTexture(trackTex: (t: THREE.Texture) => THREE.Texture): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#174C39';
  ctx.fillRect(0, 0, 128, 256);
  ctx.strokeStyle = '#E7C878';
  ctx.lineWidth = 8;
  ctx.strokeRect(8, 8, 112, 240);
  ctx.fillStyle = '#E7C878';
  ctx.beginPath();
  ctx.arc(64, 96, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#103D30';
  ctx.font = 'bold 20px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('DA', 64, 103);
  ctx.fillStyle = '#F5E8CF';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('ACADEMY', 64, 166);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return trackTex(tex) as THREE.CanvasTexture;
}

function makeAwningTexture(trackTex: (t: THREE.Texture) => THREE.Texture): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 128;
  const ctx = c.getContext('2d')!;
  const stripes = 8;
  const w = 256 / stripes;
  for (let i = 0; i < stripes; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#C94432' : '#F5F0E5';
    ctx.fillRect(i * w, 0, w, 128);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.repeat.set(3, 1);
  tex.needsUpdate = true;
  return trackTex(tex) as THREE.CanvasTexture;
}

function makeAsphaltTexture(trackTex: (t: THREE.Texture) => THREE.Texture): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#3d4543';
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 1200; i++) {
    const x = (i * 73) % 256;
    const y = (i * 137) % 256;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.12)';
    ctx.fillRect(x, y, 2, 2);
  }
  ctx.fillStyle = '#E7C878';
  ctx.fillRect(0, 124, 96, 8);
  ctx.fillRect(144, 124, 96, 8);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(14, 1);
  tex.needsUpdate = true;
  return trackTex(tex) as THREE.CanvasTexture;
}

export function buildCampusSimulatorWorld(
  scene: THREE.Scene,
  texSet: CampusTextureSet,
  isSoftwareGl: boolean,
  trackGeo: <T extends THREE.BufferGeometry>(g: T) => T,
  trackMat: <T extends THREE.Material>(m: T) => T,
  trackTex: <T extends THREE.Texture>(t: T) => T
): BuiltCampusWorld {
  const worldGroup = new THREE.Group();
  scene.add(worldGroup);

  const colliders: WorldBoxCollider[] = [];
  const clueNodes: ClueBeaconNode[] = [];
  const npcWalkers: NpcWalker[] = [];
  const banners: SwayingBanner[] = [];
  const clouds: THREE.Group[] = [];
  const birds: SkyBird[] = [];
  const waterMeshes: THREE.Mesh[] = [];
  const zoneRings = {} as Record<LocationId, THREE.Mesh>;

  const addCollider = (
    minX: number,
    maxX: number,
    minZ: number,
    maxZ: number,
    maxY = 8,
    blockCamera = true
  ) => {
    colliders.push({ minX, maxX, minZ, maxZ, maxY, blockCamera });
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

  // Materials
  const turfMat = makeStdMat(0xffffff, 0.9, 0.0, {
    map: texSet.grassMap,
    bumpMap: texSet.grassBump,
    bumpScale: 0.08,
  });
  const paverMat = makeStdMat(0xffffff, 0.82, 0.04, {
    map: texSet.paverMap,
    bumpMap: texSet.paverBump,
    bumpScale: 0.05,
  });
  const stoneTrimMat = makeStdMat(0xdcd3be, 0.76, 0.04);
  const darkStoneMat = makeStdMat(0x526058, 0.8, 0.08);
  const stuccoMat = makeStdMat(0xffffff, 0.78, 0.02, {
    map: texSet.stuccoMap,
    bumpMap: texSet.stuccoBump,
    bumpScale: 0.03,
  });
  const brickMat = makeStdMat(0xffffff, 0.82, 0.04, {
    map: texSet.brickMap,
    bumpMap: texSet.brickBump,
    bumpScale: 0.06,
  });
  const roofTileMat = makeStdMat(0xffffff, 0.7, 0.06, {
    map: texSet.roofTileMap,
    bumpMap: texSet.roofTileBump,
    bumpScale: 0.08,
  });
  const slateRoofMat = makeStdMat(0xffffff, 0.64, 0.12, {
    map: texSet.slateRoofMap,
    bumpMap: texSet.roofTileBump,
    bumpScale: 0.07,
  });
  const woodMat = makeStdMat(0xffffff, 0.74, 0.04, { map: texSet.woodMap });
  const darkWoodMat = makeStdMat(0x614229, 0.76, 0.05);
  const terrazzoMat = makeStdMat(0xffffff, 0.56, 0.06, { map: texSet.terrazzoMap });
  const forestMat = makeStdMat(0x174c39, 0.55, 0.14);
  const wroughtIronMat = makeStdMat(0x23332b, 0.4, 0.74);
  const goldMat = makeStdMat(0xe7c878, 0.25, 0.82);
  const windowGlowMat = makeStdMat(0xf5f0e5, 0.25, 0.08, {
    emissive: 0xffe4a8,
    emissiveIntensity: 0.3,
  });
  const lanternGlassMat = makeStdMat(0xffe7aa, 0.2, 0.05, {
    emissive: 0xffc65c,
    emissiveIntensity: 1.2,
  });
  const archGlassMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: 0x9dc7d8,
      roughness: 0.1,
      metalness: 0.12,
      transmission: isSoftwareGl ? 0 : 0.4,
      transparent: true,
      opacity: isSoftwareGl ? 0.68 : 0.82,
      clearcoat: 0.8,
      ior: 1.5,
    })
  );
  const waterMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: 0x2c8a9e,
      roughness: 0.08,
      metalness: 0.16,
      clearcoat: 1.0,
      transparent: true,
      opacity: 0.88,
    })
  );
  const asphaltMat = makeStdMat(0xffffff, 0.88, 0.05, {
    map: makeAsphaltTexture(trackTex),
  });
  const awningMat = makeStdMat(0xffffff, 0.74, 0.02, {
    map: makeAwningTexture(trackTex),
  });
  const bannerClothMat = makeStdMat(0xffffff, 0.72, 0.05, {
    map: makeBannerCrestTexture(trackTex),
    side: THREE.DoubleSide,
  });
  const contactShadowMat = trackMat(
    new THREE.MeshBasicMaterial({
      map: texSet.contactShadowMap,
      transparent: true,
      depthWrite: false,
      opacity: 0.48,
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
    addBox(win, w + 0.16, h + 0.16, 0.14, darkWoodMat, 0, 0, 0, false, false);
    addBox(win, w + 0.28, 0.1, 0.22, stoneTrimMat, 0, -h * 0.5 - 0.08, 0.04, false, false);
    addBox(win, w - 0.06, h - 0.06, 0.06, windowGlowMat, 0, 0, -0.02, false, false);
    addBox(win, w - 0.04, h - 0.04, 0.1, archGlassMat, 0, 0, 0.02, false, false);
    addBox(win, 0.06, h, 0.16, darkWoodMat, 0, 0, 0, false, false);
    addBox(win, w, 0.06, 0.16, darkWoodMat, 0, 0, 0, false, false);
    parent.add(win);
  };

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
    const frontSlope = addBox(
      parent,
      spanX,
      0.18,
      slopeLen,
      mat,
      0,
      yBase + pitchHeight * 0.5,
      halfZ * 0.5
    );
    frontSlope.rotation.x = angle;
    const backSlope = addBox(
      parent,
      spanX,
      0.18,
      slopeLen,
      mat,
      0,
      yBase + pitchHeight * 0.5,
      -halfZ * 0.5
    );
    backSlope.rotation.x = -angle;
    addBox(parent, spanX + 0.16, 0.18, 0.24, goldMat, 0, yBase + pitchHeight + 0.05, 0);
  };

  const addSignboard = (
    parent: THREE.Object3D,
    w: number,
    h: number,
    x: number,
    y: number,
    z: number,
    title: string,
    subtitle: string,
    rotY = 0,
    bgHex = '#174C39',
    fgHex = '#FFFFFF',
    borderHex = '#E7C878'
  ) => {
    const signTex = makeCanvasSignTexture(title, subtitle, bgHex, fgHex, borderHex, trackTex);
    const frame = new THREE.Group();
    frame.position.set(x, y, z);
    frame.rotation.y = rotY;
    addBox(frame, w + 0.16, h + 0.16, 0.1, darkWoodMat, 0, 0, -0.04, false, false);
    const face = new THREE.Mesh(
      trackGeo(new THREE.PlaneGeometry(w, h)),
      makeStdMat(0xffffff, 0.45, 0.06, { map: signTex })
    );
    face.position.z = 0.025;
    frame.add(face);
    parent.add(frame);
  };

  const attachClueBeacon = (
    parent: THREE.Object3D,
    locationId: LocationId,
    clueId: string,
    localX: number,
    localY: number,
    localZ: number,
    worldOrigin: [number, number, number],
    hitSize: [number, number, number],
    phaseOffset: number
  ) => {
    const hitMesh = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(hitSize[0], hitSize[1], hitSize[2])),
      trackMat(new THREE.MeshBasicMaterial({ visible: false }))
    );
    hitMesh.position.set(localX, localY + hitSize[1] * 0.4, localZ);
    hitMesh.userData = { clueId, locationId };
    parent.add(hitMesh);

    const beaconGroup = new THREE.Group();
    const baseY = localY + hitSize[1] + 0.72;
    beaconGroup.position.set(localX, baseY, localZ);
    parent.add(beaconGroup);

    const diamond = new THREE.Mesh(
      trackGeo(new THREE.OctahedronGeometry(0.26, 0)),
      trackMat(
        new THREE.MeshStandardMaterial({
          color: 0xf4c44e,
          emissive: 0xd99b26,
          emissiveIntensity: 0.7,
          roughness: 0.22,
          metalness: 0.6,
        })
      )
    );
    beaconGroup.add(diamond);

    const beaconRing = new THREE.Mesh(
      trackGeo(new THREE.TorusGeometry(0.42, 0.042, 8, 22)),
      trackMat(
        new THREE.MeshBasicMaterial({
          color: 0xf4c44e,
          transparent: true,
          opacity: 0.85,
        })
      )
    );
    beaconRing.rotation.x = Math.PI / 2;
    beaconRing.position.y = -0.32;
    beaconGroup.add(beaconRing);

    const scanRing = new THREE.Mesh(
      trackGeo(new THREE.RingGeometry(0.55, 0.72, 24)),
      trackMat(
        new THREE.MeshBasicMaterial({
          color: 0xf4c44e,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.45,
        })
      )
    );
    scanRing.rotation.x = -Math.PI / 2;
    scanRing.position.set(localX, localY + 0.06, localZ);
    parent.add(scanRing);

    clueNodes.push({
      clueId,
      locationId,
      worldPos: new THREE.Vector3(
        worldOrigin[0] + localX,
        worldOrigin[1] + localY,
        worldOrigin[2] + localZ
      ),
      hitMesh,
      beaconGroup,
      beaconMesh: diamond,
      beaconRing,
      scanRing,
      baseY,
      phaseOffset,
    });
  };

  // ===========================================================================
  // 1. SKY DOME, CLOUDS, DISTANT BIRDS, GROUNDS, ASPHALT ROAD & PLAZA COURTYARD
  // ===========================================================================
  const skyDome = new THREE.Mesh(
    trackGeo(new THREE.SphereGeometry(165, 32, 20)),
    trackMat(
      new THREE.MeshBasicMaterial({
        map: texSet.skyDomeMap,
        side: THREE.BackSide,
        fog: false,
      })
    )
  );
  scene.add(skyDome);

  // Drifting sculpted clouds
  const cloudMat = makeStdMat(0xffffff, 0.95, 0.0, {
    emissive: 0xdcebf2,
    emissiveIntensity: 0.32,
  });
  const cloudCoords: [number, number, number, number][] = [
    [-42, 34, -48, 1.3],
    [12, 38, -56, 1.5],
    [48, 32, -32, 1.15],
    [-35, 35, 22, 1.2],
    [32, 36, 38, 1.35],
  ];
  cloudCoords.forEach(([cx, cy, cz, cs]) => {
    const cg = new THREE.Group();
    cg.position.set(cx, cy, cz);
    cg.scale.setScalar(cs);
    [
      [0, 0, 0, 3.2],
      [-2.4, -0.3, 0.5, 2.3],
      [2.6, -0.2, -0.4, 2.5],
      [0.6, 0.7, 0.3, 2.2],
    ].forEach(([ox, oy, oz, r]) => {
      const puff = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(r, 10, 8)), cloudMat);
      puff.position.set(ox, oy, oz);
      puff.scale.set(1.4, 0.65, 1.0);
      cg.add(puff);
    });
    worldGroup.add(cg);
    clouds.push(cg);
  });

  // Distant soaring birds
  const birdMat = makeStdMat(0x2d3b34, 0.8, 0.0);
  for (let b = 0; b < 5; b++) {
    const bg = new THREE.Group();
    const body = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(0.08, 0.34, 6)), birdMat);
    body.rotation.x = Math.PI / 2;
    bg.add(body);
    const lWing = new THREE.Group();
    const lwMesh = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.45, 0.03, 0.14)), birdMat);
    lwMesh.position.x = -0.22;
    lWing.add(lwMesh);
    const rWing = new THREE.Group();
    const rwMesh = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.45, 0.03, 0.14)), birdMat);
    rwMesh.position.x = 0.22;
    rWing.add(rwMesh);
    bg.add(lWing, rWing);
    worldGroup.add(bg);
    birds.push({
      group: bg,
      leftWing: lWing,
      rightWing: rWing,
      centerX: (b - 2) * 8,
      centerZ: -12 + (b % 2) * 14,
      altitude: 19 + b * 1.8,
      radius: 14 + b * 2.5,
      speed: 0.26 + b * 0.04,
      phase: b * 1.3,
    });
  }

  // Continuous grassy terrain (180x180)
  const ground = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(180, 180)), turfMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = !isSoftwareGl;
  worldGroup.add(ground);

  // Asphalt avenue outside South entrance gate (Z = 34.5)
  addBox(worldGroup, 140, 0.08, 6.4, asphaltMat, 0, 0.04, 34.8, false, true);
  addBox(worldGroup, 140, 0.1, 1.4, stoneTrimMat, 0, 0.05, 31.1, false, true);

  // Grand Cobblestone Courtyard & Cross Pathways
  addBox(worldGroup, 26, 0.08, 28, paverMat, 0, 0.04, 2, false, true);
  addBox(worldGroup, 5.2, 0.09, 60, paverMat, 0, 0.045, 2, false, true);
  addBox(worldGroup, 42, 0.09, 4.4, paverMat, 0, 0.045, 3.0, false, true);
  addBox(worldGroup, 42, 0.09, 3.8, paverMat, 0, 0.045, -10.5, false, true);

  // Central Circular Courtyard Flower Fountain (X=0, Z=1.5)
  const fountainGroup = new THREE.Group();
  fountainGroup.position.set(0, 0.06, 1.5);
  worldGroup.add(fountainGroup);
  addContactShadow(fountainGroup, 7.6, 7.6, 0, 0.02, 0);
  addCyl(fountainGroup, 3.25, 3.45, 0.48, 24, stoneTrimMat, 0, 0.24, 0);
  const fWater = addCyl(fountainGroup, 2.85, 2.85, 0.42, 24, waterMat, 0, 0.26, 0);
  waterMeshes.push(fWater);
  addCyl(fountainGroup, 0.85, 1.05, 0.95, 16, stoneTrimMat, 0, 0.65, 0);
  addCyl(fountainGroup, 1.25, 0.65, 0.24, 16, stoneTrimMat, 0, 1.15, 0);
  addCyl(fountainGroup, 0.35, 0.45, 0.72, 12, antiqueOrGoldMat(), 0, 1.52, 0);
  function antiqueOrGoldMat() {
    return goldMat;
  }

  // Colorful courtyard flower planters around fountain
  const flowerColors = [0xe85a4f, 0xf4c44e, 0xf28482, 0x9b5de5];
  [
    [-6.6, -4.6],
    [6.6, -4.6],
    [-6.6, 8.2],
    [6.6, 8.2],
  ].forEach(([px, pz], idx) => {
    addBox(worldGroup, 3.6, 0.42, 1.8, brickMat, px, 0.21, pz);
    addBox(worldGroup, 3.2, 0.46, 1.4, makeStdMat(0x523c28, 0.92), px, 0.23, pz, false, true);
    for (let f = -1; f <= 1; f++) {
      const bush = new THREE.Mesh(
        trackGeo(new THREE.DodecahedronGeometry(0.45, 0)),
        makeStdMat(0x3e7e4e, 0.85)
      );
      bush.position.set(px + f * 0.95, 0.62, pz);
      worldGroup.add(bush);
      const bloom = new THREE.Mesh(
        trackGeo(new THREE.SphereGeometry(0.16, 8, 6)),
        makeStdMat(flowerColors[(idx + f + 4) % flowerColors.length], 0.6)
      );
      bloom.position.set(px + f * 0.95, 0.92, pz);
      worldGroup.add(bloom);
    }
    addCollider(px - 1.9, px + 1.9, pz - 1.0, pz + 1.0, 1.2, false);
  });
  addCollider(-3.35, 3.35, 1.5 - 3.35, 1.5 + 3.35, 2.2, false);

  // Active target ground highlight ring (slides to current target zone)
  const activeWaypointRing = new THREE.Mesh(
    trackGeo(new THREE.RingGeometry(1.1, 1.38, 32)),
    trackMat(
      new THREE.MeshBasicMaterial({
        color: 0xf4c44e,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.78,
      })
    )
  );
  activeWaypointRing.rotation.x = -Math.PI / 2;
  activeWaypointRing.position.set(-10.2, 0.12, 3.2);
  worldGroup.add(activeWaypointRing);

  // ===========================================================================
  // 2. GRAND MULTI-STOREY MAIN SCHOOL BUILDING (NORTH CENTER: Z = -23)
  // ===========================================================================
  const mainBldg = new THREE.Group();
  mainBldg.position.set(0, 0, -23);
  worldGroup.add(mainBldg);

  // Plinth & wide stone entrance staircase
  addBox(mainBldg, 29, 0.55, 10.5, stoneTrimMat, 0, 0.275, 0);
  addBox(mainBldg, 7.6, 0.25, 2.4, stoneTrimMat, 0, 0.125, 6.0, false, true);
  addBox(mainBldg, 6.8, 0.45, 1.6, stoneTrimMat, 0, 0.25, 5.4, false, true);

  // Main 2-storey center atrium + flanking brick/stucco academic wings
  addBox(mainBldg, 9.6, 8.2, 9.2, stuccoMat, 0, 4.6, 0);
  addBox(mainBldg, 10.2, 0.35, 9.8, stoneTrimMat, 0, 4.5, 0);
  addBox(mainBldg, 10.4, 0.35, 9.8, stoneTrimMat, 0, 8.8, 0);

  // Left & Right 2-storey wings
  [-9.5, 9.5].forEach((wx) => {
    addBox(mainBldg, 9.4, 2.8, 8.6, brickMat, wx, 1.9, -0.2);
    addBox(mainBldg, 9.4, 4.4, 8.6, stuccoMat, wx, 5.5, -0.2);
    addBox(mainBldg, 9.8, 0.3, 9.0, stoneTrimMat, wx, 7.8, -0.2);
    addPitchedRoof(mainBldg, 10.2, 9.4, 7.95, 2.1, roofTileMat);
    // Upper & lower windows
    [-2.8, 0, 2.8].forEach((ox) => {
      addFramedWindow(mainBldg, 1.6, 1.5, wx + ox, 2.2, 4.12);
      addFramedWindow(mainBldg, 1.6, 1.5, wx + ox, 5.6, 4.12);
    });
  });

  // Grand Portico Columns + Glass Atrium + Clock Dome Pediment
  [-3.2, -1.6, 1.6, 3.2].forEach((cx) => {
    addCyl(mainBldg, 0.24, 0.3, 5.0, 12, stuccoMat, cx, 3.0, 5.1);
  });
  addBox(mainBldg, 7.6, 0.45, 2.2, stoneTrimMat, 0, 5.6, 4.9);
  addBox(mainBldg, 4.2, 3.4, 0.2, archGlassMat, 0, 2.4, 4.62);
  addBox(mainBldg, 4.2, 2.8, 0.2, archGlassMat, 0, 6.2, 4.62);
  addBox(mainBldg, 7.4, 2.2, 0.5, stuccoMat, 0, 9.8, 4.1);
  addPitchedRoof(mainBldg, 10.6, 10.0, 8.95, 2.4, slateRoofMat);

  // Rooftop Heritage Clock Cupola
  addBox(mainBldg, 2.8, 2.4, 2.8, stuccoMat, 0, 11.4, 0);
  const cupolaRoof = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(2.2, 2.1, 8)), slateRoofMat);
  cupolaRoof.position.set(0, 13.6, 0);
  mainBldg.add(cupolaRoof);

  // Main School Crest Signboard
  addSignboard(
    mainBldg,
    6.4,
    1.5,
    0,
    9.75,
    4.45,
    'SEKOLAH SERI BESTARI',
    'DETECTIVE ACADEMY CAMPUS',
    0
  );
  addCollider(-14.6, 14.6, -28.0, -17.6, 12, true);

  // ===========================================================================
  // 3. LOCATION A: KANTIN CERIA (WEST: [-15.5, 0, 2.5]) — WALK-IN CAFETERIA
  // ===========================================================================
  const kantinPos: [number, number, number] = ZONE_TRIGGERS.kantin.center;
  const kantinGrp = new THREE.Group();
  kantinGrp.position.set(...kantinPos);
  worldGroup.add(kantinGrp);

  // Floor terrace + patio stone floor
  addBox(kantinGrp, 10.6, 0.12, 11.2, terrazzoMat, 0, 0.06, 0, false, true);
  // Back wall (-X West) & North Kitchen Wall (-Z)
  addBox(kantinGrp, 0.45, 3.6, 10.8, stuccoMat, -5.0, 1.85, 0);
  addBox(kantinGrp, 0.5, 1.1, 10.8, brickMat, -5.0, 0.6, 0);
  addBox(kantinGrp, 10.4, 3.6, 0.45, stuccoMat, 0, 1.85, -5.2);
  addBox(kantinGrp, 10.4, 1.1, 0.5, brickMat, 0, 0.6, -5.2);

  // Food serving counter & display glass + kitchen prep shelf
  addBox(kantinGrp, 7.2, 1.05, 1.1, brickMat, -0.8, 0.58, -3.5);
  addBox(kantinGrp, 7.4, 0.12, 1.24, stoneTrimMat, -0.8, 1.15, -3.5);
  // Food display glass showcase & colorful food trays
  addBox(kantinGrp, 3.2, 0.65, 0.72, archGlassMat, -1.6, 1.52, -3.45);
  [-2.6, -1.6, -0.6].forEach((fx, fi) => {
    addBox(
      kantinGrp,
      0.72,
      0.12,
      0.48,
      makeStdMat(fi === 0 ? 0xf2b441 : fi === 1 ? 0x62a85f : 0xd96b43, 0.4),
      fx,
      1.26,
      -3.45
    );
  });
  // Menu board on kitchen back wall
  addSignboard(kantinGrp, 4.2, 1.1, -0.8, 2.55, -4.9, 'MENU KANTIN CERIA', 'Nasi Lemak · Mi Sup · Buah Segar', 0);

  // Pillars & Pitched Roof + Iconic Red-and-Cream Awning facing Plaza (+X)
  [
    [3.8, -4.6],
    [3.8, 0],
    [3.8, 4.6],
  ].forEach(([px, pz]) => {
    addCyl(kantinGrp, 0.16, 0.18, 3.6, 10, wroughtIronMat, px, 1.85, pz);
  });
  addPitchedRoof(kantinGrp, 10.8, 11.4, 3.7, 1.5, roofTileMat);

  // Sloped red-and-cream awning facing East (+X toward plaza!)
  const awning = addBox(kantinGrp, 2.4, 0.12, 10.6, awningMat, 4.8, 3.2, 0);
  awning.rotation.z = -0.35;
  addSignboard(kantinGrp, 5.4, 1.1, 4.4, 4.0, 0, 'KANTIN CERIA', 'Kafeteria Sekolah', Math.PI / 2, '#174C39', '#FFF5D1', '#E7C878');

  // Indoor & Outdoor Patio Tables with Umbrellas
  const addDiningTable = (tx: number, tz: number, umbrellaColor?: number) => {
    addCyl(kantinGrp, 0.78, 0.78, 0.08, 14, woodMat, tx, 0.82, tz);
    addCyl(kantinGrp, 0.09, 0.12, 0.8, 8, wroughtIronMat, tx, 0.42, tz);
    [
      [-0.95, 0],
      [0.95, 0],
      [0, -0.95],
      [0, 0.95],
    ].forEach(([sx, sz]) => {
      addCyl(kantinGrp, 0.22, 0.2, 0.48, 8, darkWoodMat, tx + sx, 0.26, tz + sz);
    });
    if (umbrellaColor !== undefined) {
      addCyl(kantinGrp, 0.04, 0.04, 2.35, 8, wroughtIronMat, tx, 1.8, tz);
      const canopy = new THREE.Mesh(
        trackGeo(new THREE.ConeGeometry(1.55, 0.6, 8)),
        makeStdMat(umbrellaColor, 0.65)
      );
      canopy.position.set(tx, 2.95, tz);
      canopy.castShadow = !isSoftwareGl;
      kantinGrp.add(canopy);
    }
    addCollider(kantinPos[0] + tx - 1.1, kantinPos[0] + tx + 1.1, kantinPos[2] + tz - 1.1, kantinPos[2] + tz + 1.1, 1.4, false);
  };
  addDiningTable(-1.8, 0.8);
  addDiningTable(1.2, 1.0);
  addDiningTable(6.0, -2.8, 0xd4523b);
  addDiningTable(6.0, 3.2, 0x2b6cb0);

  // Kantin colliders (back wall, north wall, counter — leaving South & East wide open to walk inside!)
  addCollider(kantinPos[0] - 5.4, kantinPos[0] - 4.6, kantinPos[2] - 5.5, kantinPos[2] + 5.5, 4.5, true);
  addCollider(kantinPos[0] - 5.4, kantinPos[0] + 4.4, kantinPos[2] - 5.6, kantinPos[2] - 4.8, 4.5, true);
  addCollider(kantinPos[0] - 4.5, kantinPos[0] + 2.9, kantinPos[2] - 4.2, kantinPos[2] - 2.9, 1.6, false);

  // Kantin Clues (3 interactive 3D clue spots)
  // 1) kantin_sampah
  const kSampah = new THREE.Group();
  kSampah.position.set(-1.6, 0.12, 3.4);
  kantinGrp.add(kSampah);
  addBox(kSampah, 0.36, 0.09, 0.28, makeStdMat(0xf4eee0, 0.7), -0.25, 0.05, 0.1);
  addBox(kSampah, 0.32, 0.13, 0.24, makeStdMat(0xd46a40, 0.65), 0.22, 0.07, -0.12);
  addCyl(kSampah, 0.11, 0.08, 0.22, 10, makeStdMat(0x529dc2, 0.45), 0.0, 0.11, 0.18);
  attachClueBeacon(kantinGrp, 'kantin', 'kantin_sampah', -1.6, 0.12, 3.4, kantinPos, [1.4, 1.1, 1.4], 0.2);

  // 2) kantin_meja
  const kPlates = new THREE.Group();
  kPlates.position.set(1.2, 0.88, 1.0);
  kantinGrp.add(kPlates);
  addCyl(kPlates, 0.22, 0.16, 0.06, 12, makeStdMat(0xfaf6ec, 0.3), -0.28, 0.03, 0.08);
  addCyl(kPlates, 0.2, 0.15, 0.06, 12, makeStdMat(0xd4723c, 0.35), 0.28, 0.03, -0.08);
  addCyl(kPlates, 0.09, 0.07, 0.24, 10, makeStdMat(0x479ac4, 0.4), 0.02, 0.12, 0.18);
  attachClueBeacon(kantinGrp, 'kantin', 'kantin_meja', 1.2, 0.88, 1.0, kantinPos, [1.5, 1.1, 1.5], 1.1);

  // 3) kantin_tong
  const kBin = new THREE.Group();
  kBin.position.set(3.4, 0.12, 3.2);
  kantinGrp.add(kBin);
  addCyl(kBin, 0.42, 0.34, 0.94, 14, forestMat, 0, 0.47, 0);
  addBox(kBin, 0.46, 0.36, 0.38, makeStdMat(0xc45c3b, 0.75), 0.05, 1.0, 0.02);
  addBox(kBin, 0.28, 0.18, 0.28, makeStdMat(0xefe8d4, 0.8), -0.36, 0.1, 0.42);
  attachClueBeacon(kantinGrp, 'kantin', 'kantin_tong', 3.4, 0.12, 3.2, kantinPos, [1.4, 1.4, 1.4], 2.0);

  // ===========================================================================
  // 4. LOCATION B: KELAS HARMONI (NORTH-WEST: [-16.5, 0, -13.5])
  // ===========================================================================
  const kelasPos: [number, number, number] = ZONE_TRIGGERS.kelas.center;
  const kelasGrp = new THREE.Group();
  kelasGrp.position.set(...kelasPos);
  worldGroup.add(kelasGrp);

  addBox(kelasGrp, 10.6, 0.12, 9.2, terrazzoMat, 0, 0.06, 0, false, true);
  // Back wall (-Z), West wall (-X) with classroom windows, Upper floor slab + 2nd storey exterior
  addBox(kelasGrp, 10.6, 3.8, 0.4, stuccoMat, 0, 1.95, -4.4);
  addBox(kelasGrp, 0.4, 3.8, 9.0, stuccoMat, -5.1, 1.95, 0);
  addFramedWindow(kelasGrp, 2.2, 1.6, -5.1, 2.2, -1.8, Math.PI / 2);
  addFramedWindow(kelasGrp, 2.2, 1.6, -5.1, 2.2, 1.6, Math.PI / 2);
  addFramedWindow(kelasGrp, 2.2, 1.6, -2.2, 2.2, -4.4, 0);
  // 2nd storey academic block above classroom ceiling
  addBox(kelasGrp, 10.8, 0.3, 9.4, stoneTrimMat, 0, 3.85, 0);
  addBox(kelasGrp, 10.4, 3.2, 8.8, stuccoMat, 0, 5.55, 0);
  addFramedWindow(kelasGrp, 1.8, 1.4, -2.6, 5.5, 4.42, 0);
  addFramedWindow(kelasGrp, 1.8, 1.4, 0.2, 5.5, 4.42, 0);
  addFramedWindow(kelasGrp, 1.8, 1.4, 3.0, 5.5, 4.42, 0);
  addPitchedRoof(kelasGrp, 11.2, 9.6, 7.2, 1.8, slateRoofMat);

  addSignboard(kelasGrp, 5.0, 1.1, 0, 4.1, 4.65, 'KELAS HARMONI', 'Blok Akademik Barat', 0);

  // Whiteboard + Teacher's Desk at front (-Z)
  addBox(kelasGrp, 4.2, 1.55, 0.12, darkWoodMat, -1.8, 2.1, -4.14);
  addBox(kelasGrp, 3.95, 1.32, 0.14, makeStdMat(0x2a5b44, 0.55), -1.8, 2.1, -4.1);
  addBox(kelasGrp, 1.8, 0.78, 0.85, darkWoodMat, -2.2, 0.48, -2.5);
  addBox(kelasGrp, 0.38, 0.24, 0.3, makeStdMat(0x4b7cb8, 0.7), -2.5, 0.98, -2.5);

  // Kelas Clue 1: kelas_meja (crooked student desks & tipped chair)
  const kDesks = new THREE.Group();
  kDesks.position.set(-0.6, 0.12, 0.9);
  kelasGrp.add(kDesks);
  const kd1 = addBox(kDesks, 1.25, 0.72, 0.7, woodMat, -0.7, 0.36, -0.2);
  kd1.rotation.y = 0.28;
  const kd2 = addBox(kDesks, 1.25, 0.72, 0.7, woodMat, 0.9, 0.36, 0.25);
  kd2.rotation.y = -0.34;
  const kChair = addBox(kDesks, 0.48, 0.56, 0.48, makeStdMat(0x3a6f8f, 0.6), 0.1, 0.28, 0.85);
  kChair.rotation.z = 0.42;
  attachClueBeacon(kelasGrp, 'kelas', 'kelas_meja', -0.6, 0.12, 0.9, kelasPos, [2.4, 1.3, 1.9], 0.5);

  // Kelas Clue 2: kelas_sudut (crooked rear bulletin board)
  const kBoard = new THREE.Group();
  kBoard.position.set(2.4, 1.95, -4.08);
  kelasGrp.add(kBoard);
  const kbBack = addBox(kBoard, 2.2, 1.35, 0.1, makeStdMat(0xbba989, 0.8), 0, 0, 0);
  kbBack.rotation.z = -0.09;
  addBox(kBoard, 0.6, 0.48, 0.14, makeStdMat(0xe2c87b, 0.7), -0.45, 0.15, 0.02);
  attachClueBeacon(kelasGrp, 'kelas', 'kelas_sudut', 2.4, 1.2, -3.7, kelasPos, [2.1, 1.5, 1.1], 1.4);

  // Kelas Clue 3: kelas_bahan (messy books & teaching shelf)
  const kShelf = new THREE.Group();
  kShelf.position.set(3.2, 0.12, 1.1);
  kelasGrp.add(kShelf);
  addBox(kShelf, 1.55, 1.45, 0.66, darkWoodMat, 0, 0.72, 0);
  addBox(kShelf, 0.44, 0.32, 0.34, makeStdMat(0xc95842, 0.7), -0.32, 1.56, 0.05).rotation.y = 0.3;
  addBox(kShelf, 0.48, 0.26, 0.36, makeStdMat(0x4b7cb8, 0.7), 0.3, 1.5, -0.05).rotation.y = -0.25;
  addBox(kShelf, 0.5, 0.14, 0.38, makeStdMat(0xf0e7d0, 0.75), -0.1, 0.07, 0.6);
  attachClueBeacon(kelasGrp, 'kelas', 'kelas_bahan', 3.2, 0.12, 1.1, kelasPos, [1.8, 1.7, 1.5], 2.3);

  addCollider(kelasPos[0] - 5.5, kelasPos[0] + 5.5, kelasPos[2] - 4.8, kelasPos[2] - 3.9, 8, true);
  addCollider(kelasPos[0] - 5.5, kelasPos[0] - 4.7, kelasPos[2] - 4.8, kelasPos[2] + 4.8, 8, true);
  addCollider(kelasPos[0] - 3.2, kelasPos[0] - 1.2, kelasPos[2] - 3.1, kelasPos[2] - 1.9, 1.4, false);

  // ===========================================================================
  // 5. LOCATION C: PERPUSTAKAAN ILMU (NORTH-EAST: [16.5, 0, -13.5])
  // ===========================================================================
  const perpusPos: [number, number, number] = ZONE_TRIGGERS.perpustakaan.center;
  const perpusGrp = new THREE.Group();
  perpusGrp.position.set(...perpusPos);
  worldGroup.add(perpusGrp);

  addBox(perpusGrp, 10.6, 0.12, 9.2, woodMat, 0, 0.06, 0, false, true);
  addBox(perpusGrp, 10.6, 3.9, 0.4, stuccoMat, 0, 2.0, -4.4);
  addBox(perpusGrp, 0.4, 3.9, 9.0, stuccoMat, 5.1, 2.0, 0);
  addFramedWindow(perpusGrp, 2.2, 1.75, -2.2, 2.2, -4.4, 0);
  addFramedWindow(perpusGrp, 2.2, 1.75, 2.0, 2.2, -4.4, 0);
  addFramedWindow(perpusGrp, 2.2, 1.75, 5.1, 2.2, 0.2, Math.PI / 2);

  // 2nd storey library dome/wing roof
  addBox(perpusGrp, 10.8, 0.3, 9.4, stoneTrimMat, 0, 3.95, 0);
  addBox(perpusGrp, 10.4, 3.2, 8.8, stuccoMat, 0, 5.65, 0);
  addFramedWindow(perpusGrp, 1.8, 1.4, -3.0, 5.6, 4.42, 0);
  addFramedWindow(perpusGrp, 1.8, 1.4, 0, 5.6, 4.42, 0);
  addFramedWindow(perpusGrp, 1.8, 1.4, 3.0, 5.6, 4.42, 0);
  addPitchedRoof(perpusGrp, 11.2, 9.6, 7.3, 1.9, slateRoofMat);
  // Portico columns at library entrance
  [-4.6, 4.6].forEach((cx) => {
    addCyl(perpusGrp, 0.18, 0.22, 3.8, 10, stuccoMat, cx, 1.95, 4.3);
  });

  addSignboard(perpusGrp, 5.4, 1.1, 0, 4.2, 4.65, 'PERPUSTAKAAN ILMU', 'Gedung Ilmu & Bacaan', 0);

  // Library Reception Counter
  addBox(perpusGrp, 2.4, 1.0, 0.85, darkWoodMat, -3.2, 0.56, 2.1);

  // Perpus Clue 1: perpus_buku (tall bookshelves with colorful unorganized books)
  const pBooks = new THREE.Group();
  pBooks.position.set(-2.6, 0.12, -1.8);
  perpusGrp.add(pBooks);
  addBox(pBooks, 2.3, 2.35, 0.7, darkWoodMat, 0, 1.18, 0);
  addBox(pBooks, 0.45, 0.42, 0.35, makeStdMat(0xc4523f, 0.7), -0.5, 1.45, 0.1).rotation.z = 0.35;
  addBox(pBooks, 0.52, 0.25, 0.38, makeStdMat(0x4b7cb8, 0.7), 0.15, 0.14, 0.58);
  addBox(pBooks, 0.44, 0.22, 0.34, goldMat, 0.2, 0.38, 0.54).rotation.y = 0.25;
  attachClueBeacon(perpusGrp, 'perpustakaan', 'perpus_buku', -2.6, 0.12, -1.8, perpusPos, [2.3, 2.4, 1.5], 0.8);

  // Perpus Clue 2: perpus_selesa (reading table, hard chairs & brass lamp)
  const pStudy = new THREE.Group();
  pStudy.position.set(0.3, 0.12, 0.6);
  perpusGrp.add(pStudy);
  addBox(pStudy, 2.1, 0.76, 1.05, woodMat, 0, 0.38, 0);
  addBox(pStudy, 0.44, 0.48, 0.44, darkWoodMat, -0.6, 0.24, 0.85);
  addBox(pStudy, 0.44, 0.48, 0.44, darkWoodMat, 0.6, 0.24, 0.85);
  addCyl(pStudy, 0.08, 0.15, 0.32, 10, goldMat, 0.55, 0.92, 0);
  addCyl(pStudy, 0.18, 0.22, 0.18, 12, lanternGlassMat, 0.55, 1.12, 0);
  attachClueBeacon(perpusGrp, 'perpustakaan', 'perpus_selesa', 0.3, 0.12, 0.6, perpusPos, [2.1, 1.35, 1.8], 1.7);

  // Perpus Clue 3: perpus_sudut (reading rug cluttered with boxes)
  const pCorner = new THREE.Group();
  pCorner.position.set(2.8, 0.12, 1.3);
  perpusGrp.add(pCorner);
  addBox(pCorner, 2.2, 0.06, 1.9, makeStdMat(0x4b745d, 0.9), 0, 0.03, 0, false, true);
  addBox(pCorner, 0.74, 0.58, 0.68, makeStdMat(0xb88b5d, 0.85), -0.35, 0.32, -0.1);
  addBox(pCorner, 0.68, 0.54, 0.64, makeStdMat(0xa3774a, 0.85), 0.38, 0.3, 0.22).rotation.y = 0.25;
  addBox(pCorner, 0.54, 0.46, 0.52, makeStdMat(0xc59a6e, 0.85), -0.22, 0.84, -0.05);
  attachClueBeacon(perpusGrp, 'perpustakaan', 'perpus_sudut', 2.8, 0.12, 1.3, perpusPos, [2.2, 1.4, 1.9], 2.5);

  addCollider(perpusPos[0] - 5.5, perpusPos[0] + 5.5, perpusPos[2] - 4.8, perpusPos[2] - 3.9, 8, true);
  addCollider(perpusPos[0] + 4.7, perpusPos[0] + 5.5, perpusPos[2] - 4.8, perpusPos[2] + 4.8, 8, true);
  addCollider(perpusPos[0] - 4.5, perpusPos[0] - 1.9, perpusPos[2] + 1.5, perpusPos[2] + 2.7, 1.4, false);

  // ===========================================================================
  // 6. LOCATION D: TAMAN REKREASI (EAST: [15.5, 0, 4.0])
  // ===========================================================================
  const tamanPos: [number, number, number] = ZONE_TRIGGERS.taman.center;
  const tamanGrp = new THREE.Group();
  tamanGrp.position.set(...tamanPos);
  worldGroup.add(tamanGrp);

  // Stone garden pathways + reflection pond + timber pergola
  addBox(tamanGrp, 10.2, 0.06, 2.0, paverMat, 0, 0.03, 0, false, true);
  addBox(tamanGrp, 2.0, 0.06, 10.2, paverMat, 0, 0.03, 0, false, true);
  addCyl(tamanGrp, 1.85, 1.95, 0.28, 20, stoneTrimMat, -2.5, 0.14, -2.6);
  const tPond = addCyl(tamanGrp, 1.55, 1.55, 0.3, 20, waterMat, -2.5, 0.15, -2.6);
  waterMeshes.push(tPond);
  addCollider(tamanPos[0] - 4.4, tamanPos[0] - 0.6, tamanPos[2] - 4.5, tamanPos[2] - 0.7, 1.2, false);

  // Timber Pergola
  [
    [-1.4, -4.4],
    [1.4, -4.4],
    [-1.4, -2.2],
    [1.4, -2.2],
  ].forEach(([px, pz]) => {
    addBox(tamanGrp, 0.24, 3.0, 0.24, darkWoodMat, px, 1.5, pz);
  });
  addBox(tamanGrp, 3.6, 0.2, 2.8, woodMat, 0, 3.05, -3.3);
  addSignboard(tamanGrp, 4.6, 1.0, 0, 3.6, -1.8, 'TAMAN REKREASI', 'Laman Hijau & Ilmu Alam', 0);

  // Taman Clue 1: taman_tumbuhan (dry/wilted flowerbed)
  const tWilted = new THREE.Group();
  tWilted.position.set(-2.4, 0.06, 2.4);
  tamanGrp.add(tWilted);
  addBox(tWilted, 2.4, 0.34, 1.35, brickMat, 0, 0.17, 0);
  addBox(tWilted, 2.1, 0.36, 1.06, makeStdMat(0x755c3e, 0.94), 0, 0.19, 0);
  addCyl(tWilted, 0.08, 0.04, 0.56, 7, makeStdMat(0x8e8040, 0.85), -0.5, 0.55, 0.1).rotation.z = 0.5;
  addCyl(tWilted, 0.08, 0.04, 0.48, 7, makeStdMat(0x7a6e38, 0.85), 0.3, 0.52, -0.15).rotation.z = -0.45;
  attachClueBeacon(tamanGrp, 'taman', 'taman_tumbuhan', -2.4, 0.06, 2.4, tamanPos, [2.4, 1.2, 1.6], 0.4);

  // Taman Clue 2: taman_kawasan (bare patch & crooked empty signpost)
  const tBare = new THREE.Group();
  tBare.position.set(2.3, 0.06, -1.4);
  tamanGrp.add(tBare);
  addCyl(tBare, 1.45, 1.45, 0.08, 16, makeStdMat(0x7e684b, 0.95), 0, 0.04, 0);
  const cPost = addBox(tBare, 0.12, 1.25, 0.12, darkWoodMat, 0.45, 0.62, -0.35);
  cPost.rotation.z = 0.18;
  const cBoard = addBox(tBare, 0.78, 0.48, 0.08, woodMat, 0.38, 1.1, -0.35);
  cBoard.rotation.z = 0.18;
  attachClueBeacon(tamanGrp, 'taman', 'taman_kawasan', 2.3, 0.06, -1.4, tamanPos, [2.2, 1.5, 2.0], 1.3);

  // Taman Clue 3: taman_duduk (broken bench)
  const tBench = new THREE.Group();
  tBench.position.set(2.6, 0.06, 2.6);
  tamanGrp.add(tBench);
  addBox(tBench, 1.95, 0.12, 1.0, paverMat, 0, 0.06, 0);
  addBox(tBench, 0.22, 0.38, 0.52, stoneTrimMat, -0.62, 0.25, 0);
  addBox(tBench, 0.22, 0.38, 0.52, stoneTrimMat, 0.62, 0.25, 0);
  const sPlank = addBox(tBench, 0.92, 0.08, 0.45, woodMat, -0.22, 0.44, 0.05);
  sPlank.rotation.z = -0.22;
  attachClueBeacon(tamanGrp, 'taman', 'taman_duduk', 2.6, 0.06, 2.6, tamanPos, [2.0, 1.1, 1.5], 2.2);

  // ===========================================================================
  // 7. ZONE FLOOR RINGS + CAMPUS PROPS (LAMPS, BANNERS, RECYCLING BINS, GATE)
  // ===========================================================================
  (Object.keys(ZONE_TRIGGERS) as LocationId[]).forEach((locId) => {
    const cfg = ZONE_TRIGGERS[locId];
    const rMesh = new THREE.Mesh(
      trackGeo(new THREE.RingGeometry(5.2, 5.55, 36)),
      trackMat(
        new THREE.MeshBasicMaterial({
          color: 0xe7c878,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.32,
        })
      )
    );
    rMesh.rotation.x = -Math.PI / 2;
    rMesh.position.set(cfg.center[0], 0.14, cfg.center[2]);
    worldGroup.add(rMesh);
    zoneRings[locId] = rMesh;
  });

  // Campus Streetlamps & Detective Academy Standing Banners
  [
    [-8.5, 9.5],
    [8.5, 9.5],
    [-8.5, -5.5],
    [8.5, -5.5],
  ].forEach(([lx, lz], idx) => {
    const lamp = new THREE.Group();
    lamp.position.set(lx, 0, lz);
    addCyl(lamp, 0.18, 0.24, 0.45, 8, darkStoneMat, 0, 0.22, 0);
    addCyl(lamp, 0.07, 0.1, 3.2, 8, wroughtIronMat, 0, 1.9, 0);
    const globe = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.22, 10, 8)), lanternGlassMat);
    globe.position.y = 3.65;
    lamp.add(globe);
    // Attached fluttering Detective Academy banner
    const arm = addBox(lamp, 0.72, 0.05, 0.05, goldMat, 0.36, 2.65, 0);
    arm.castShadow = false;
    const cloth = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(0.62, 1.35, 1, 4)), bannerClothMat);
    cloth.position.set(0.36, 1.95, 0);
    lamp.add(cloth);
    banners.push({ cloth, baseRotY: 0, phase: idx * 1.1 });
    worldGroup.add(lamp);
    addCollider(lx - 0.35, lx + 0.35, lz - 0.35, lz + 0.35, 3.5, false);
  });

  // Blue & Green Campus Recycling Bins + Courtyard Benches
  [
    [8.2, 11.8],
    [-8.2, 11.8],
  ].forEach(([bx, bz]) => {
    addBox(worldGroup, 0.48, 0.82, 0.48, makeStdMat(0x2563eb, 0.55), bx, 0.41, bz);
    addBox(worldGroup, 0.48, 0.82, 0.48, forestMat, bx + (bx > 0 ? 0.56 : -0.56), 0.41, bz);
  });

  [
    [-4.2, 11.2, 0],
    [4.2, 11.2, 0],
  ].forEach(([bx, bz]) => {
    addBox(worldGroup, 1.9, 0.12, 0.58, woodMat, bx, 0.48, bz);
    addBox(worldGroup, 1.9, 0.45, 0.1, woodMat, bx, 0.82, bz + 0.24);
    addBox(worldGroup, 0.14, 0.46, 0.5, wroughtIronMat, bx - 0.75, 0.23, bz);
    addBox(worldGroup, 0.14, 0.46, 0.5, wroughtIronMat, bx + 0.75, 0.23, bz);
    addCollider(bx - 1.0, bx + 1.0, bz - 0.4, bz + 0.4, 1.0, false);
  });

  // South School Entrance Gate & Security Guardhouse (Z = 29.5)
  const gateGrp = new THREE.Group();
  gateGrp.position.set(0, 0, 29.5);
  worldGroup.add(gateGrp);
  addBox(gateGrp, 1.0, 3.4, 1.0, brickMat, -3.4, 1.7, 0);
  addBox(gateGrp, 1.0, 3.4, 1.0, brickMat, 3.4, 1.7, 0);
  addBox(gateGrp, 8.2, 0.85, 0.9, forestMat, 0, 3.6, 0);
  addSignboard(gateGrp, 6.8, 0.75, 0, 3.6, 0.48, 'SEKOLAH SERI BESTARI', '', 0);
  // Guardhouse (Pondok Pengawal)
  addBox(gateGrp, 2.8, 2.7, 2.6, stuccoMat, -6.0, 1.35, -0.8);
  addPitchedRoof(gateGrp, 3.3, 3.0, 2.7, 0.9, roofTileMat);
  addFramedWindow(gateGrp, 1.2, 0.9, -6.0, 1.6, 0.52);
  addCollider(-7.6, -4.4, 27.3, 30.2, 3.5, true);
  addCollider(-4.0, -2.8, 28.9, 30.1, 3.5, true);
  addCollider(2.8, 4.0, 28.9, 30.1, 3.5, true);

  // Perimeter Campus Fence (Open at South Gate)
  addBox(worldGroup, 64, 1.3, 0.24, wroughtIronMat, 0, 0.65, -31.5, false, false);
  addBox(worldGroup, 0.24, 1.3, 62, wroughtIronMat, -32, 0.65, -0.5, false, false);
  addBox(worldGroup, 0.24, 1.3, 62, wroughtIronMat, 32, 0.65, -0.5, false, false);

  // ===========================================================================
  // 8. INSTANCED SHADE TREES (COURTYARD + OUTER PERIMETER WOODLAND)
  // ===========================================================================
  const treeCoords: [number, number, number][] = [
    [-23, 12, 1.25],
    [-24, -4, 1.35],
    [-25, -21, 1.4],
    [-10, 20, 1.15],
    [10, 20, 1.15],
    [22, 14, 1.3],
    [25, -3, 1.28],
    [25, -21, 1.42],
    [-8.5, 16, 1.0],
    [8.5, 16, 1.02],
    [12.5, 9.2, 1.05],
    [21.2, 8.8, 1.2],
    [21.2, -1.2, 1.15],
    [-21.2, 14.5, 1.25],
    [-22, 24, 1.35],
    [22, 24, 1.35],
    [-30, -14, 1.5],
    [-30, 8, 1.45],
    [30, -14, 1.5],
    [30, 8, 1.45],
    [-16, -32, 1.45],
    [0, -34, 1.55],
    [16, -32, 1.45],
    [-28, -30, 1.5],
    [28, -30, 1.5],
  ];

  const trunkInst = new THREE.InstancedMesh(
    trackGeo(new THREE.CylinderGeometry(0.18, 0.3, 2.2, 8)),
    makeStdMat(0x5b3e28, 0.92),
    treeCoords.length
  );
  trunkInst.castShadow = !isSoftwareGl;
  const canopyInst = new THREE.InstancedMesh(
    trackGeo(new THREE.DodecahedronGeometry(1.45, 1)),
    makeStdMat(0xffffff, 0.85),
    treeCoords.length
  );
  canopyInst.castShadow = !isSoftwareGl;
  canopyInst.receiveShadow = !isSoftwareGl;
  const treeCanopyTops = new THREE.InstancedMesh(
    trackGeo(new THREE.DodecahedronGeometry(1.05, 1)),
    makeStdMat(0xffffff, 0.82),
    treeCoords.length
  );
  treeCanopyTops.castShadow = !isSoftwareGl;

  const dummy = new THREE.Object3D();
  const cCol = new THREE.Color();
  const leafCols = [0x3b734e, 0x48875b, 0x559667, 0x315c48];
  const topCols = [0x5ea36e, 0x70b47c, 0x4f9160, 0x7ec088];

  treeCoords.forEach(([tx, tz, s], idx) => {
    dummy.position.set(tx, 1.1 * s, tz);
    dummy.scale.set(s, s, s);
    dummy.rotation.set(0, idx * 0.6, 0);
    dummy.updateMatrix();
    trunkInst.setMatrixAt(idx, dummy.matrix);

    dummy.position.set(tx, 2.75 * s, tz);
    dummy.scale.set(s * 1.1, s * 0.95, s * 1.1);
    dummy.updateMatrix();
    canopyInst.setMatrixAt(idx, dummy.matrix);
    cCol.setHex(leafCols[idx % leafCols.length]);
    canopyInst.setColorAt(idx, cCol);

    dummy.position.set(tx + 0.16 * s, 3.7 * s, tz - 0.1 * s);
    dummy.scale.set(s, s * 0.9, s);
    dummy.updateMatrix();
    treeCanopyTops.setMatrixAt(idx, dummy.matrix);
    cCol.setHex(topCols[idx % topCols.length]);
    treeCanopyTops.setColorAt(idx, cCol);

    if (Math.abs(tx) < 28 && Math.abs(tz) < 28) {
      addCollider(tx - 0.48, tx + 0.48, tz - 0.48, tz + 0.48, 3.0, false);
    }
  });
  trunkInst.instanceMatrix.needsUpdate = true;
  canopyInst.instanceMatrix.needsUpdate = true;
  treeCanopyTops.instanceMatrix.needsUpdate = true;
  if (canopyInst.instanceColor) canopyInst.instanceColor.needsUpdate = true;
  if (treeCanopyTops.instanceColor) treeCanopyTops.instanceColor.needsUpdate = true;
  trunkInst.computeBoundingSphere();
  canopyInst.computeBoundingSphere();
  treeCanopyTops.computeBoundingSphere();
  worldGroup.add(trunkInst, canopyInst, treeCanopyTops);

  // ===========================================================================
  // 9. ANIMATED NPC STUDENTS WALKING AROUND CAMPUS
  // ===========================================================================
  const buildNpcStudent = (
    shirtColor: number,
    bottomColor: number,
    hijab: boolean,
    waypoints: [number, number][],
    speed: number,
    phaseOffset: number
  ) => {
    const grp = new THREE.Group();
    grp.position.set(waypoints[0][0], 0, waypoints[0][1]);

    const legMat = makeStdMat(bottomColor, 0.78);
    const shirtM = makeStdMat(shirtColor, 0.72);
    const skinM = makeStdMat(0xf0c6a4, 0.68);
    const hairM = makeStdMat(hijab ? 0xf7f5ee : 0x2a1c15, 0.68);

    const lLeg = new THREE.Group();
    lLeg.position.set(-0.09, 0.72, 0);
    const lLegMesh = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.11, 0.72, 0.12)), legMat);
    lLegMesh.position.y = -0.36;
    lLeg.add(lLegMesh);

    const rLeg = new THREE.Group();
    rLeg.position.set(0.09, 0.72, 0);
    const rLegMesh = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.11, 0.72, 0.12)), legMat);
    rLegMesh.position.y = -0.36;
    rLeg.add(rLegMesh);

    const body = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.32, 0.52, 0.2)), shirtM);
    body.position.y = 0.98;
    body.castShadow = !isSoftwareGl;

    const pack = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.24, 0.34, 0.12)),
      makeStdMat(0x284e75, 0.72)
    );
    pack.position.set(0, 1.0, -0.14);

    const lArm = new THREE.Group();
    lArm.position.set(-0.21, 1.2, 0);
    const lArmM = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.09, 0.44, 0.09)), shirtM);
    lArmM.position.y = -0.22;
    lArm.add(lArmM);

    const rArm = new THREE.Group();
    rArm.position.set(0.21, 1.2, 0);
    const rArmM = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.09, 0.44, 0.09)), shirtM);
    rArmM.position.y = -0.22;
    rArm.add(rArmM);

    const head = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.15, 10, 8)), skinM);
    head.position.y = 1.4;
    const cap = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.165, 10, 8)), hairM);
    cap.position.set(0, 1.42, -0.02);

    grp.add(lLeg, rLeg, body, pack, lArm, rArm, head, cap);
    worldGroup.add(grp);

    npcWalkers.push({
      group: grp,
      leftLeg: lLeg,
      rightLeg: rLeg,
      leftArm: lArm,
      rightArm: rArm,
      waypoints,
      waypointIdx: 1,
      speed,
      phaseOffset,
    });
  };

  buildNpcStudent(0xffffff, 0x1e3a5f, true, [[-8, 6], [-8, -6], [6, -6], [6, 6]], 1.45, 0.2);
  buildNpcStudent(0xffffff, 0x1e3a5f, false, [[8, 9], [-7, 9], [-7, -3], [8, -3]], 1.55, 1.4);
  buildNpcStudent(0xf5f0e5, 0x26382f, false, [[-11, 2], [-11, -11], [-4, -11], [-4, 2]], 1.35, 2.1);
  buildNpcStudent(0xffffff, 0x174c39, true, [[11, 2], [11, -9], [4, -9], [4, 2]], 1.4, 3.0);
  buildNpcStudent(0xffffff, 0x1e3a5f, false, [[-3, 18], [-3, 9], [3, 9], [3, 18]], 1.3, 0.9);
  buildNpcStudent(0xf5f0e5, 0x284e75, true, [[11, 10], [18, 10], [18, 2], [11, 2]], 1.25, 4.1);

  // ===========================================================================
  // 10. SUBTLE GOLDEN DUST MOTES
  // ===========================================================================
  const pCount = isSoftwareGl ? 32 : 70;
  const pPos = new Float32Array(pCount * 3);
  for (let i = 0; i < pCount; i++) {
    pPos[i * 3] = Math.sin(i * 12.9898) * 26;
    pPos[i * 3 + 1] = 1.2 + ((i * 7) % 12) * 0.55;
    pPos[i * 3 + 2] = Math.cos(i * 78.233) * 24;
  }
  const dustGeo = trackGeo(new THREE.BufferGeometry());
  dustGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  const dustPoints = new THREE.Points(
    dustGeo,
    trackMat(
      new THREE.PointsMaterial({
        map: texSet.dustSpriteMap,
        size: 0.45,
        transparent: true,
        opacity: 0.52,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    )
  );
  worldGroup.add(dustPoints);

  return {
    worldGroup,
    colliders,
    clueNodes,
    zoneRings,
    npcWalkers,
    banners,
    clouds,
    birds,
    waterMeshes,
    treeCanopyTops,
    dustPoints,
    activeWaypointRing,
  };
}
