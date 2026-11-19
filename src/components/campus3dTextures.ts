import * as THREE from 'three';

export interface CampusTextureSet {
  grassMap: THREE.CanvasTexture;
  grassBump: THREE.CanvasTexture;
  paverMap: THREE.CanvasTexture;
  paverBump: THREE.CanvasTexture;
  stuccoMap: THREE.CanvasTexture;
  stuccoBump: THREE.CanvasTexture;
  brickMap: THREE.CanvasTexture;
  brickBump: THREE.CanvasTexture;
  roofTileMap: THREE.CanvasTexture;
  roofTileBump: THREE.CanvasTexture;
  slateRoofMap: THREE.CanvasTexture;
  woodMap: THREE.CanvasTexture;
  terrazzoMap: THREE.CanvasTexture;
  contactShadowMap: THREE.CanvasTexture;
  skyDomeMap: THREE.CanvasTexture;
  dustSpriteMap: THREE.CanvasTexture;
  all: THREE.Texture[];
}

function seededRand(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function makeCanvas(size: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  return [canvas, ctx];
}

function configureTexture(
  canvas: HTMLCanvasElement,
  isColor: boolean,
  repeatX: number,
  repeatY: number,
  maxAniso: number
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.colorSpace = isColor ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.anisotropy = maxAniso;
  tex.needsUpdate = true;
  return tex;
}

export function createCampusTextures(maxAniso: number): CampusTextureSet {
  const all: THREE.Texture[] = [];
  const rand = seededRand(202604);

  // 1. Natural Grass & Turf Albedo + Bump (Sunlit Botanical Morning Green)
  const [grassC, grassCtx] = makeCanvas(256);
  const [grassBC, grassBCtx] = makeCanvas(256);
  grassCtx.fillStyle = '#4e8055';
  grassCtx.fillRect(0, 0, 256, 256);
  grassBCtx.fillStyle = '#808080';
  grassBCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 3400; i++) {
    const x = rand() * 256;
    const y = rand() * 256;
    const w = 1 + rand() * 2.5;
    const h = 3 + rand() * 6;
    const shade = rand();
    grassCtx.fillStyle =
      shade < 0.35
        ? 'rgba(56, 98, 63, 0.55)'
        : shade < 0.72
        ? 'rgba(94, 146, 98, 0.5)'
        : 'rgba(136, 178, 118, 0.4)';
    grassCtx.fillRect(x, y, w, h);

    const bVal = Math.floor(110 + shade * 55);
    grassBCtx.fillStyle = `rgb(${bVal},${bVal},${bVal})`;
    grassBCtx.fillRect(x, y, w, h);
  }
  const grassMap = configureTexture(grassC, true, 16, 16, maxAniso);
  const grassBump = configureTexture(grassBC, false, 16, 16, maxAniso);
  all.push(grassMap, grassBump);

  // 2. Interlocking Stone Paver Courtyard Albedo + Bump (Warm Limestone Cream)
  const [paverC, paverCtx] = makeCanvas(256);
  const [paverBC, paverBCtx] = makeCanvas(256);
  paverCtx.fillStyle = '#bcb39f';
  paverCtx.fillRect(0, 0, 256, 256);
  paverBCtx.fillStyle = '#3c3c3c';
  paverBCtx.fillRect(0, 0, 256, 256);

  const rows = 8;
  const cols = 4;
  const pw = 256 / cols;
  const ph = 256 / rows;
  for (let r = 0; r < rows; r++) {
    const offset = r % 2 === 1 ? pw * 0.5 : 0;
    for (let c = -1; c <= cols; c++) {
      const px = c * pw + offset;
      const py = r * ph;
      const tone = 212 + Math.floor(rand() * 22);
      const warm = Math.floor(rand() * 12);
      paverCtx.fillStyle = `rgb(${Math.min(255, tone + warm)}, ${Math.min(255, tone + 4)}, ${tone - 12})`;
      paverCtx.fillRect(px + 2, py + 2, pw - 4, ph - 4);
      paverBCtx.fillStyle = `rgb(${190 + Math.floor(rand() * 30)},${190 + Math.floor(rand() * 30)},${190 + Math.floor(rand() * 30)})`;
      paverBCtx.fillRect(px + 2, py + 2, pw - 4, ph - 4);
    }
  }
  const paverMap = configureTexture(paverC, true, 6, 6, maxAniso);
  const paverBump = configureTexture(paverBC, false, 6, 6, maxAniso);
  all.push(paverMap, paverBump);

  // 3. Ivory Cream Stucco Plaster Wall + Bump
  const [stuccoC, stuccoCtx] = makeCanvas(256);
  const [stuccoBC, stuccoBCtx] = makeCanvas(256);
  stuccoCtx.fillStyle = '#F5F0E5';
  stuccoCtx.fillRect(0, 0, 256, 256);
  stuccoBCtx.fillStyle = '#808080';
  stuccoBCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2400; i++) {
    const x = rand() * 256;
    const y = rand() * 256;
    const sz = 1 + rand() * 3;
    const v = rand();
    stuccoCtx.fillStyle = v > 0.5 ? 'rgba(255,255,255,0.32)' : 'rgba(182,168,142,0.14)';
    stuccoCtx.fillRect(x, y, sz, sz);
    const bv = Math.floor(118 + v * 28);
    stuccoBCtx.fillStyle = `rgb(${bv},${bv},${bv})`;
    stuccoBCtx.fillRect(x, y, sz, sz);
  }
  const stuccoMap = configureTexture(stuccoC, true, 2, 2, maxAniso);
  const stuccoBump = configureTexture(stuccoBC, false, 2, 2, maxAniso);
  all.push(stuccoMap, stuccoBump);

  // 4. Heritage Brick & Stone Base Albedo + Bump
  const [brickC, brickCtx] = makeCanvas(256);
  const [brickBC, brickBCtx] = makeCanvas(256);
  brickCtx.fillStyle = '#8b8374';
  brickCtx.fillRect(0, 0, 256, 256);
  brickBCtx.fillStyle = '#484848';
  brickBCtx.fillRect(0, 0, 256, 256);
  const bRows = 10;
  const bCols = 5;
  const bw = 256 / bCols;
  const bh = 256 / bRows;
  for (let r = 0; r < bRows; r++) {
    const off = r % 2 === 1 ? bw * 0.5 : 0;
    for (let c = -1; c <= bCols; c++) {
      const x = c * bw + off;
      const y = r * bh;
      const baseR = 122 + Math.floor(rand() * 32);
      const baseG = 72 + Math.floor(rand() * 20);
      const baseB = 56 + Math.floor(rand() * 16);
      brickCtx.fillStyle = `rgb(${baseR},${baseG},${baseB})`;
      brickCtx.fillRect(x + 2, y + 2, bw - 4, bh - 4);
      brickBCtx.fillStyle = '#d4d4d4';
      brickBCtx.fillRect(x + 2, y + 2, bw - 4, bh - 4);
    }
  }
  const brickMap = configureTexture(brickC, true, 3, 2, maxAniso);
  const brickBump = configureTexture(brickBC, false, 3, 2, maxAniso);
  all.push(brickMap, brickBump);

  // 5. Terracotta Clay Roof Shingles + Bump
  const [roofC, roofCtx] = makeCanvas(256);
  const [roofBC, roofBCtx] = makeCanvas(256);
  roofCtx.fillStyle = '#6c3424';
  roofCtx.fillRect(0, 0, 256, 256);
  roofBCtx.fillStyle = '#444444';
  roofBCtx.fillRect(0, 0, 256, 256);
  const tRows = 8;
  const tCols = 8;
  const tw = 256 / tCols;
  const th = 256 / tRows;
  for (let r = 0; r < tRows; r++) {
    const off = r % 2 === 1 ? tw * 0.5 : 0;
    for (let c = -1; c <= tCols; c++) {
      const x = c * tw + off;
      const y = r * th;
      const rr = 154 + Math.floor(rand() * 34);
      const gg = 76 + Math.floor(rand() * 24);
      const bb = 50 + Math.floor(rand() * 18);
      roofCtx.fillStyle = `rgb(${rr},${gg},${bb})`;
      roofCtx.fillRect(x + 1.5, y + 1.5, tw - 3, th - 3);
      const grad = roofBCtx.createLinearGradient(x, y, x, y + th);
      grad.addColorStop(0, '#787878');
      grad.addColorStop(1, '#e6e6e6');
      roofBCtx.fillStyle = grad;
      roofBCtx.fillRect(x + 1.5, y + 1.5, tw - 3, th - 3);
    }
  }
  const roofTileMap = configureTexture(roofC, true, 4, 3, maxAniso);
  const roofTileBump = configureTexture(roofBC, false, 4, 3, maxAniso);
  all.push(roofTileMap, roofTileBump);

  // 6. Forest Slate Roof Shingles
  const [slateC, slateCtx] = makeCanvas(256);
  slateCtx.fillStyle = '#254a3a';
  slateCtx.fillRect(0, 0, 256, 256);
  for (let r = 0; r < tRows; r++) {
    const off = r % 2 === 1 ? tw * 0.5 : 0;
    for (let c = -1; c <= tCols; c++) {
      const x = c * tw + off;
      const y = r * th;
      const rr = 42 + Math.floor(rand() * 14);
      const gg = 84 + Math.floor(rand() * 20);
      const bb = 65 + Math.floor(rand() * 16);
      slateCtx.fillStyle = `rgb(${rr},${gg},${bb})`;
      slateCtx.fillRect(x + 1.5, y + 1.5, tw - 3, th - 3);
    }
  }
  const slateRoofMap = configureTexture(slateC, true, 4, 3, maxAniso);
  all.push(slateRoofMap);

  // 7. Warm Hardwood Grain
  const [woodC, woodCtx] = makeCanvas(256);
  woodCtx.fillStyle = '#8b603b';
  woodCtx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 2) {
    const tone = 112 + Math.floor(Math.sin(y * 0.14) * 14 + rand() * 18);
    woodCtx.fillStyle = `rgb(${tone + 22}, ${Math.floor(tone * 0.75)}, ${Math.floor(tone * 0.45)})`;
    woodCtx.fillRect(0, y, 256, 2);
  }
  const woodMap = configureTexture(woodC, true, 2, 2, maxAniso);
  all.push(woodMap);

  // 8. Kantin Terrazzo / Checkered Stone Floor
  const [terC, terCtx] = makeCanvas(256);
  const tSize = 32;
  for (let y = 0; y < 256; y += tSize) {
    for (let x = 0; x < 256; x += tSize) {
      const even = ((x / tSize) + (y / tSize)) % 2 === 0;
      terCtx.fillStyle = even ? '#F5F0E5' : '#DCE9D9';
      terCtx.fillRect(x, y, tSize, tSize);
      terCtx.strokeStyle = 'rgba(49, 92, 72, 0.14)';
      terCtx.strokeRect(x + 0.5, y + 0.5, tSize - 1, tSize - 1);
    }
  }
  const terrazzoMap = configureTexture(terC, true, 5, 4, maxAniso);
  all.push(terrazzoMap);

  // 9. Soft Radial Contact Shadow Plane Texture
  const [shadC, shadCtx] = makeCanvas(128);
  const shadGrad = shadCtx.createRadialGradient(64, 64, 8, 64, 64, 62);
  shadGrad.addColorStop(0, 'rgba(30, 48, 38, 0.42)');
  shadGrad.addColorStop(0.55, 'rgba(30, 48, 38, 0.16)');
  shadGrad.addColorStop(1, 'rgba(30, 48, 38, 0)');
  shadCtx.fillStyle = shadGrad;
  shadCtx.fillRect(0, 0, 128, 128);
  const contactShadowMap = new THREE.CanvasTexture(shadC);
  contactShadowMap.needsUpdate = true;
  all.push(contactShadowMap);

  // 10. Crisp Sunlit Morning Sky Dome Texture
  const [skyC, skyCtx] = makeCanvas(512);
  const skyGrad = skyCtx.createLinearGradient(0, 0, 0, 512);
  skyGrad.addColorStop(0.0, '#72A8C9');
  skyGrad.addColorStop(0.28, '#B8DAE2');
  skyGrad.addColorStop(0.52, '#DCE9D9');
  skyGrad.addColorStop(0.7, '#F5F0E5');
  skyGrad.addColorStop(0.86, '#ECE8DC');
  skyGrad.addColorStop(1.0, '#D4E2CF');
  skyCtx.fillStyle = skyGrad;
  skyCtx.fillRect(0, 0, 512, 512);
  const skyDomeMap = new THREE.CanvasTexture(skyC);
  skyDomeMap.colorSpace = THREE.SRGBColorSpace;
  skyDomeMap.needsUpdate = true;
  all.push(skyDomeMap);

  // 11. Soft Golden Dust Particle Sprite
  const [dustC, dustCtx] = makeCanvas(64);
  const dustGrad = dustCtx.createRadialGradient(32, 32, 2, 32, 32, 30);
  dustGrad.addColorStop(0, 'rgba(255, 236, 178, 0.95)');
  dustGrad.addColorStop(0.45, 'rgba(231, 185, 79, 0.45)');
  dustGrad.addColorStop(1, 'rgba(231, 185, 79, 0)');
  dustCtx.fillStyle = dustGrad;
  dustCtx.fillRect(0, 0, 64, 64);
  const dustSpriteMap = new THREE.CanvasTexture(dustC);
  dustSpriteMap.colorSpace = THREE.SRGBColorSpace;
  dustSpriteMap.needsUpdate = true;
  all.push(dustSpriteMap);

  return {
    grassMap,
    grassBump,
    paverMap,
    paverBump,
    stuccoMap,
    stuccoBump,
    brickMap,
    brickBump,
    roofTileMap,
    roofTileBump,
    slateRoofMap,
    woodMap,
    terrazzoMap,
    contactShadowMap,
    skyDomeMap,
    dustSpriteMap,
    all,
  };
}
