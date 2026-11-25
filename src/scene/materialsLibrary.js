import * as THREE from 'three';

function seededRand(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function makeCanvas(size = 512) {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  return c;
}

function toTexture(canvas, { repeatX = 1, repeatY = 1, isColor = true, anisotropy = 8 } = {}) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = anisotropy;
  if (isColor) {
    tex.colorSpace = THREE.SRGBColorSpace;
  }
  tex.needsUpdate = true;
  return tex;
}

/**
 * Generates a realistic procedural sky + jade mountain + river reflection PMREM environment map
 * so metallic roofs, glass facades, glazed tiles, and car clearcoat reflect natural Guilin light!
 */
export function createGuilinEnvironment(renderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();

  const envScene = new THREE.Scene();
  const skyGeo = new THREE.SphereGeometry(60, 32, 16);
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    vertexShader: `
      varying vec3 vPos;
      void main() {
        vPos = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vPos;
      void main() {
        float y = vPos.y;
        vec3 zenith = vec3(0.28, 0.56, 0.85);
        vec3 horizon = vec3(0.86, 0.93, 0.94);
        vec3 ground = vec3(0.18, 0.34, 0.28);
        vec3 col = y >= 0.0
          ? mix(horizon, zenith, pow(y, 0.55))
          : mix(horizon * 0.72, ground, clamp(-y * 2.5, 0.0, 1.0));
        // Warm sun specular highlight lobe in env map
        vec3 sunDir = normalize(vec3(0.5, 0.65, 0.4));
        float sun = pow(max(dot(vPos, sunDir), 0.0), 32.0);
        col += vec3(1.4, 1.25, 0.95) * sun;
        gl_FragColor = vec4(col, 1.0);
      }
    `
  });
  envScene.add(new THREE.Mesh(skyGeo, skyMat));

  const envRT = pmrem.fromScene(envScene, 0.04);
  pmrem.dispose();
  skyGeo.dispose();
  skyMat.dispose();
  return envRT.texture;
}

/**
 * 1. Karst Limestone & Moss Micro-Detail Map (multiplies over vertex colors + crisp rock bump)
 */
function createKarstRockTextures() {
  const size = 512;
  const diff = makeCanvas(size);
  const dCtx = diff.getContext('2d');
  const bump = makeCanvas(size);
  const bCtx = bump.getContext('2d');
  const rand = seededRand(1011);

  dCtx.fillStyle = '#dcded8';
  dCtx.fillRect(0, 0, size, size);
  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, size, size);

  // Stratified karst limestone horizontal & vertical fissures
  for (let i = 0; i < 420; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const w = 16 + rand() * 85;
    const h = 4 + rand() * 22;
    const shade = Math.floor(175 + rand() * 68);
    dCtx.fillStyle = `rgba(${shade}, ${shade + 2}, ${shade - 4}, 0.22)`;
    dCtx.fillRect(x, y, w, h);

    const bVal = Math.floor(85 + rand() * 95);
    bCtx.fillStyle = `rgba(${bVal}, ${bVal}, ${bVal}, 0.35)`;
    bCtx.fillRect(x, y, w, h);
  }

  // Fine vertical erosion streaks typical of Guilin limestone towers
  for (let i = 0; i < 260; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const w = 2 + rand() * 5;
    const h = 40 + rand() * 140;
    const dark = rand() > 0.45;
    dCtx.fillStyle = dark ? 'rgba(62, 74, 66, 0.16)' : 'rgba(245, 245, 238, 0.14)';
    dCtx.fillRect(x, y, w, h);
    bCtx.fillStyle = dark ? 'rgba(35, 35, 35, 0.28)' : 'rgba(220, 220, 220, 0.22)';
    bCtx.fillRect(x, y, w, h);
  }

  // Fine mineral grain
  for (let i = 0; i < 3200; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const s = 1 + rand() * 2.5;
    const v = rand() > 0.5 ? 245 : 95;
    dCtx.fillStyle = `rgba(${v},${v},${v},0.09)`;
    dCtx.fillRect(x, y, s, s);
    bCtx.fillStyle = `rgba(${v},${v},${v},0.16)`;
    bCtx.fillRect(x, y, s, s);
  }

  return {
    map: toTexture(diff, { repeatX: 3, repeatY: 3, isColor: true }),
    bumpMap: toTexture(bump, { repeatX: 3, repeatY: 3, isColor: false })
  };
}

/**
 * 2. Organic Terrain Grass & Moss Detail Texture (multiplies over terrain vertex colors)
 */
function createTerrainDetailTextures() {
  const size = 512;
  const diff = makeCanvas(size);
  const dCtx = diff.getContext('2d');
  const bump = makeCanvas(size);
  const bCtx = bump.getContext('2d');
  const rand = seededRand(2022);

  dCtx.fillStyle = '#e8ece4';
  dCtx.fillRect(0, 0, size, size);
  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, size, size);

  // Soft organic turf patches
  for (let i = 0; i < 340; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 10 + rand() * 34;
    const bright = rand() > 0.5;
    dCtx.fillStyle = bright ? 'rgba(255, 255, 240, 0.1)' : 'rgba(95, 115, 88, 0.11)';
    dCtx.beginPath();
    dCtx.arc(x, y, r, 0, Math.PI * 2);
    dCtx.fill();

    const bv = bright ? 165 : 95;
    bCtx.fillStyle = `rgba(${bv},${bv},${bv},0.18)`;
    bCtx.beginPath();
    bCtx.arc(x, y, r * 0.7, 0, Math.PI * 2);
    bCtx.fill();
  }

  // Fine grass blade / soil speckle
  for (let i = 0; i < 4500; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const v = rand() > 0.5 ? 250 : 100;
    dCtx.fillStyle = `rgba(${v},${v},${v},0.11)`;
    dCtx.fillRect(x, y, 2, 4);
    bCtx.fillStyle = `rgba(${v},${v},${v},0.2)`;
    bCtx.fillRect(x, y, 2, 3);
  }

  return {
    map: toTexture(diff, { repeatX: 46, repeatY: 46, isColor: true }),
    bumpMap: toTexture(bump, { repeatX: 46, repeatY: 46, isColor: false })
  };
}

/**
 * 3. Realistic Asphalt Road Texture with Aggregate Grain, Tire Tracks & Lane Markings
 */
function createAsphaltTextures() {
  const size = 512;
  const diff = makeCanvas(size);
  const dCtx = diff.getContext('2d');
  const bump = makeCanvas(size);
  const bCtx = bump.getContext('2d');
  const rough = makeCanvas(size);
  const rCtx = rough.getContext('2d');
  const rand = seededRand(3033);

  dCtx.fillStyle = '#383d44';
  dCtx.fillRect(0, 0, size, size);
  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, size, size);
  rCtx.fillStyle = '#d4d4d4';
  rCtx.fillRect(0, 0, size, size);

  // Subtle darker tire-wear tracks along lanes
  for (const laneX of [135, 377]) {
    const grad = dCtx.createLinearGradient(laneX - 55, 0, laneX + 55, 0);
    grad.addColorStop(0, 'rgba(20,23,28,0)');
    grad.addColorStop(0.5, 'rgba(20,23,28,0.28)');
    grad.addColorStop(1, 'rgba(20,23,28,0)');
    dCtx.fillStyle = grad;
    dCtx.fillRect(laneX - 55, 0, 110, size);

    // Slightly smoother/glossier roughness in tire tracks
    rCtx.fillStyle = 'rgba(120,120,120,0.35)';
    rCtx.fillRect(laneX - 28, 0, 56, size);
  }

  // Asphalt mineral aggregate noise
  for (let i = 0; i < 9500; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const s = 1 + rand() * 2;
    const v = Math.floor(42 + rand() * 58);
    dCtx.fillStyle = `rgb(${v},${v + 2},${v + 5})`;
    dCtx.fillRect(x, y, s, s);
    const bv = Math.floor(70 + rand() * 120);
    bCtx.fillStyle = `rgb(${bv},${bv},${bv})`;
    bCtx.fillRect(x, y, s, s);
  }

  // Crisp Chinese double-yellow center divider & white shoulder lines
  dCtx.fillStyle = '#e5b84b';
  dCtx.fillRect(size / 2 - 9, 0, 5, size);
  dCtx.fillRect(size / 2 + 4, 0, 5, size);

  dCtx.fillStyle = 'rgba(235, 240, 242, 0.85)';
  dCtx.fillRect(18, 0, 8, size);
  dCtx.fillRect(size - 26, 0, 8, size);

  return {
    map: toTexture(diff, { repeatX: 1, repeatY: 1, isColor: true }),
    bumpMap: toTexture(bump, { repeatX: 1, repeatY: 1, isColor: false }),
    roughnessMap: toTexture(rough, { repeatX: 1, repeatY: 1, isColor: false })
  };
}

/**
 * 4. Hand-Laid Carved Granite / Limestone Bridge & Gate Masonry
 */
function createGraniteStoneTextures(tintHex = '#cfc8ba') {
  const size = 512;
  const diff = makeCanvas(size);
  const dCtx = diff.getContext('2d');
  const bump = makeCanvas(size);
  const bCtx = bump.getContext('2d');
  const rand = seededRand(4044);

  dCtx.fillStyle = tintHex;
  dCtx.fillRect(0, 0, size, size);
  bCtx.fillStyle = '#909090';
  bCtx.fillRect(0, 0, size, size);

  const rows = 8;
  const cols = 4;
  const bh = size / rows;
  const bw = size / cols;

  for (let r = 0; r < rows; r++) {
    const offset = (r % 2) * (bw / 2);
    for (let c = -1; c <= cols; c++) {
      const bx = c * bw + offset;
      const by = r * bh;
      const delta = Math.floor((rand() - 0.5) * 26);
      dCtx.fillStyle = `rgba(${198 + delta}, ${192 + delta}, ${178 + delta}, 0.85)`;
      dCtx.fillRect(bx + 2, by + 2, bw - 4, bh - 4);

      const bv = 155 + Math.floor((rand() - 0.5) * 45);
      bCtx.fillStyle = `rgb(${bv},${bv},${bv})`;
      bCtx.fillRect(bx + 3, by + 3, bw - 6, bh - 6);

      // Subtle stone chiseled bevel
      dCtx.strokeStyle = 'rgba(72, 68, 60, 0.45)';
      dCtx.lineWidth = 3;
      dCtx.strokeRect(bx + 1, by + 1, bw - 2, bh - 2);

      bCtx.strokeStyle = '#303030';
      bCtx.lineWidth = 4;
      bCtx.strokeRect(bx + 1, by + 1, bw - 2, bh - 2);
    }
  }

  // Fine granite mineral speckle
  for (let i = 0; i < 4000; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const v = rand() > 0.5 ? 240 : 75;
    dCtx.fillStyle = `rgba(${v},${v},${v},0.08)`;
    dCtx.fillRect(x, y, 2, 2);
  }

  return {
    map: toTexture(diff, { repeatX: 3, repeatY: 2, isColor: true }),
    bumpMap: toTexture(bump, { repeatX: 3, repeatY: 2, isColor: false })
  };
}

/**
 * 5. Traditional Chinese Corrugated Glazed Roof Tiles (琉璃瓦 / 小青瓦)
 */
function createChineseRoofTileTextures(baseHex, highlightHex, grooveHex) {
  const size = 512;
  const diff = makeCanvas(size);
  const dCtx = diff.getContext('2d');
  const bump = makeCanvas(size);
  const bCtx = bump.getContext('2d');

  const cols = 16;
  const colW = size / cols;

  for (let c = 0; c < cols; c++) {
    const x = c * colW;
    // Cylindrical tile rib shading
    const grad = dCtx.createLinearGradient(x, 0, x + colW, 0);
    grad.addColorStop(0, grooveHex);
    grad.addColorStop(0.28, baseHex);
    grad.addColorStop(0.55, highlightHex);
    grad.addColorStop(0.82, baseHex);
    grad.addColorStop(1, grooveHex);
    dCtx.fillStyle = grad;
    dCtx.fillRect(x, 0, colW, size);

    const bGrad = bCtx.createLinearGradient(x, 0, x + colW, 0);
    bGrad.addColorStop(0, '#2a2a2a');
    bGrad.addColorStop(0.5, '#f0f0f0');
    bGrad.addColorStop(1, '#2a2a2a');
    bCtx.fillStyle = bGrad;
    bCtx.fillRect(x, 0, colW, size);
  }

  // Horizontal overlapping tile courses
  const rows = 12;
  const rowH = size / rows;
  for (let r = 0; r < rows; r++) {
    const y = r * rowH;
    dCtx.fillStyle = 'rgba(0, 0, 0, 0.24)';
    dCtx.fillRect(0, y, size, 4);
    bCtx.fillStyle = 'rgba(20, 20, 20, 0.65)';
    bCtx.fillRect(0, y, size, 5);
  }

  return {
    map: toTexture(diff, { repeatX: 3, repeatY: 2, isColor: true }),
    bumpMap: toTexture(bump, { repeatX: 3, repeatY: 2, isColor: false })
  };
}

/**
 * 6. Ornate Chinese Pagoda Carved Lattice Window Texture (日塔金雕 / 月塔银雕)
 */
function createPagodaWallTextures(frameHex, panelHex, glowHex) {
  const size = 512;
  const diff = makeCanvas(size);
  const dCtx = diff.getContext('2d');
  const emis = makeCanvas(size);
  const eCtx = emis.getContext('2d');
  const bump = makeCanvas(size);
  const bCtx = bump.getContext('2d');

  dCtx.fillStyle = frameHex;
  dCtx.fillRect(0, 0, size, size);
  eCtx.fillStyle = '#000000';
  eCtx.fillRect(0, 0, size, size);
  bCtx.fillStyle = '#d0d0d0';
  bCtx.fillRect(0, 0, size, size);

  const panels = 4;
  const pw = size / panels;
  for (let i = 0; i < panels; i++) {
    const px = i * pw + 18;
    const py = 56;
    const w = pw - 36;
    const h = size - 112;

    // Glowing recessed lattice screen
    dCtx.fillStyle = panelHex;
    dCtx.fillRect(px, py, w, h);
    eCtx.fillStyle = glowHex;
    eCtx.fillRect(px + 4, py + 4, w - 8, h - 8);
    bCtx.fillStyle = '#404040';
    bCtx.fillRect(px, py, w, h);

    // Intricate carved lattice mullions
    dCtx.strokeStyle = frameHex;
    dCtx.lineWidth = 6;
    eCtx.strokeStyle = '#000000';
    eCtx.lineWidth = 6;
    bCtx.strokeStyle = '#ececec';
    bCtx.lineWidth = 6;

    for (let k = 1; k < 4; k++) {
      const ly = py + (h / 4) * k;
      dCtx.beginPath(); dCtx.moveTo(px, ly); dCtx.lineTo(px + w, ly); dCtx.stroke();
      eCtx.beginPath(); eCtx.moveTo(px, ly); eCtx.lineTo(px + w, ly); eCtx.stroke();
      bCtx.beginPath(); bCtx.moveTo(px, ly); bCtx.lineTo(px + w, ly); bCtx.stroke();
    }
    const midX = px + w / 2;
    dCtx.beginPath(); dCtx.moveTo(midX, py); dCtx.lineTo(midX, py + h); dCtx.stroke();
    eCtx.beginPath(); eCtx.moveTo(midX, py); eCtx.lineTo(midX, py + h); eCtx.stroke();
    bCtx.beginPath(); bCtx.moveTo(midX, py); bCtx.lineTo(midX, py + h); bCtx.stroke();
  }

  // Decorative top & bottom cornice bands
  dCtx.fillStyle = 'rgba(0,0,0,0.22)';
  dCtx.fillRect(0, 0, size, 32);
  dCtx.fillRect(0, size - 32, size, 32);

  return {
    map: toTexture(diff, { repeatX: 2, repeatY: 1, isColor: true }),
    emissiveMap: toTexture(emis, { repeatX: 2, repeatY: 1, isColor: true }),
    bumpMap: toTexture(bump, { repeatX: 2, repeatY: 1, isColor: false })
  };
}

/**
 * 7. Palace Crimson Plaster & Lingnan Historic White Plaster with Timber Lattice
 */
function createHistoricWallTextures(isPalace) {
  const size = 512;
  const diff = makeCanvas(size);
  const dCtx = diff.getContext('2d');
  const bump = makeCanvas(size);
  const bCtx = bump.getContext('2d');
  const rand = seededRand(isPalace ? 7011 : 7022);

  dCtx.fillStyle = isPalace ? '#8e2822' : '#e5dfd2';
  dCtx.fillRect(0, 0, size, size);
  bCtx.fillStyle = '#888888';
  bCtx.fillRect(0, 0, size, size);

  // Subtle weathered plaster stucco variation
  for (let i = 0; i < 650; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 6 + rand() * 24;
    dCtx.fillStyle = rand() > 0.5 ? 'rgba(255,245,230,0.05)' : 'rgba(30,15,10,0.06)';
    dCtx.beginPath();
    dCtx.arc(x, y, r, 0, Math.PI * 2);
    dCtx.fill();
  }

  // Stone dado plinth along bottom
  dCtx.fillStyle = isPalace ? '#bfb6a6' : '#85888a';
  dCtx.fillRect(0, size - 78, size, 78);
  bCtx.fillStyle = '#c8c8c8';
  bCtx.fillRect(0, size - 78, size, 78);

  // Carved timber pillars / window frames
  const timberCol = isPalace ? '#591612' : '#4a3529';
  for (let i = 0; i < 4; i++) {
    const x = i * (size / 4);
    dCtx.fillStyle = timberCol;
    dCtx.fillRect(x, 0, 14, size - 78);
    bCtx.fillStyle = '#e0e0e0';
    bCtx.fillRect(x, 0, 14, size - 78);

    // Traditional wooden window frame
    const wx = x + 32;
    const wy = 135;
    const ww = size / 4 - 50;
    const wh = 165;
    dCtx.fillStyle = isPalace ? '#3a1a14' : '#3d484d';
    dCtx.fillRect(wx, wy, ww, wh);
    dCtx.strokeStyle = isPalace ? '#c9973b' : '#5c4334';
    dCtx.lineWidth = 6;
    dCtx.strokeRect(wx, wy, ww, wh);
  }

  return {
    map: toTexture(diff, { repeatX: 2, repeatY: 1, isColor: true }),
    bumpMap: toTexture(bump, { repeatX: 2, repeatY: 1, isColor: false })
  };
}

/**
 * 8. High-Resolution 512x512 Architectural PBR Facades for Modern Guilin Buildings
 * Features: stone/aluminum panels, glass mullions, sky gradient reflections, recessed bump,
 * smooth-glass vs matte-wall roughness map, and rich multi-tone warm/cool night interior glow!
 */
export function createArchitecturalFacadeTextures(styleIndex) {
  const size = 512;
  const diff = makeCanvas(size);
  const dCtx = diff.getContext('2d');
  const emis = makeCanvas(size);
  const eCtx = emis.getContext('2d');
  const bump = makeCanvas(size);
  const bCtx = bump.getContext('2d');
  const rough = makeCanvas(size);
  const rCtx = rough.getContext('2d');

  const palettes = [
    { wall: '#e4dfd4', panel: '#d6cfc2', mullion: '#505c66', glassTop: '#567891', glassBot: '#334d61' },
    { wall: '#cfd9de', panel: '#bccad1', mullion: '#3a4c59', glassTop: '#4c7b99', glassBot: '#29485e' },
    { wall: '#dfd3c3', panel: '#cbbca7', mullion: '#5e554d', glassTop: '#5f7482', glassBot: '#3b4a54' },
    { wall: '#c7d3ce', panel: '#b2c2bc', mullion: '#374c48', glassTop: '#3e6e6e', glassBot: '#24474a' }
  ];
  const pal = palettes[styleIndex % palettes.length];
  const rand = seededRand(8100 + styleIndex * 137);

  // Base matte stone/concrete facade
  dCtx.fillStyle = pal.wall;
  dCtx.fillRect(0, 0, size, size);
  eCtx.fillStyle = '#000000';
  eCtx.fillRect(0, 0, size, size);
  bCtx.fillStyle = '#d8d8d8';
  bCtx.fillRect(0, 0, size, size);
  rCtx.fillStyle = '#d2d2d2'; // Matte cladding
  rCtx.fillRect(0, 0, size, size);

  const cols = 6;
  const rows = 8;
  const cellW = size / cols;
  const cellH = size / rows;

  for (let r = 0; r < rows; r++) {
    const fy = r * cellH;

    // Horizontal architectural spandrel & cornice shadow
    dCtx.fillStyle = pal.panel;
    dCtx.fillRect(0, fy, size, 12);
    dCtx.fillStyle = 'rgba(0,0,0,0.16)';
    dCtx.fillRect(0, fy + 12, size, 3);
    bCtx.fillStyle = '#f2f2f2';
    bCtx.fillRect(0, fy, size, 12);

    for (let c = 0; c < cols; c++) {
      const wx = c * cellW + 10;
      const wy = fy + 18;
      const ww = cellW - 20;
      const wh = cellH - 24;

      // Recessed window glass with sky reflection gradient
      const gGrad = dCtx.createLinearGradient(wx, wy, wx, wy + wh);
      gGrad.addColorStop(0, pal.glassTop);
      gGrad.addColorStop(0.55, pal.glassBot);
      gGrad.addColorStop(1, '#22313d');
      dCtx.fillStyle = gGrad;
      dCtx.fillRect(wx, wy, ww, wh);

      // Diagonal glass reflection streak
      dCtx.fillStyle = 'rgba(255,255,255,0.14)';
      dCtx.beginPath();
      dCtx.moveTo(wx, wy);
      dCtx.lineTo(wx + ww * 0.65, wy);
      dCtx.lineTo(wx, wy + wh * 0.65);
      dCtx.closePath();
      dCtx.fill();

      // Glossy glass roughness (dark = low roughness = shiny!) & recessed bump
      rCtx.fillStyle = '#242424';
      rCtx.fillRect(wx, wy, ww, wh);
      bCtx.fillStyle = '#383838';
      bCtx.fillRect(wx, wy, ww, wh);

      // Crisp aluminum window frame & center mullion
      dCtx.strokeStyle = pal.mullion;
      dCtx.lineWidth = 3;
      dCtx.strokeRect(wx, wy, ww, wh);
      dCtx.beginPath();
      dCtx.moveTo(wx + ww / 2, wy);
      dCtx.lineTo(wx + ww / 2, wy + wh);
      dCtx.stroke();

      // Realistic warm/cool interior lighting for night view
      const lit = rand();
      if (lit > 0.36) {
        const warm = rand() > 0.24;
        const glowGrad = eCtx.createLinearGradient(wx, wy, wx, wy + wh);
        if (warm) {
          glowGrad.addColorStop(0, rand() > 0.45 ? '#ffd680' : '#ffbe59');
          glowGrad.addColorStop(1, '#b87628');
        } else {
          glowGrad.addColorStop(0, '#cceeff');
          glowGrad.addColorStop(1, '#6ba4c9');
        }
        eCtx.fillStyle = glowGrad;
        eCtx.fillRect(wx + 2, wy + 2, ww - 4, wh - 4);
        // Dark mullion silhouette over lit window
        eCtx.fillStyle = '#181410';
        eCtx.fillRect(wx + ww / 2 - 1.5, wy, 3, wh);
      }
    }
  }

  return {
    map: toTexture(diff, { repeatX: 1, repeatY: 1, isColor: true }),
    emissiveMap: toTexture(emis, { repeatX: 1, repeatY: 1, isColor: true }),
    bumpMap: toTexture(bump, { repeatX: 1, repeatY: 1, isColor: false }),
    roughnessMap: toTexture(rough, { repeatX: 1, repeatY: 1, isColor: false })
  };
}

// Singleton cache for shared PBR texture sets
let _cache = null;
export function getMaterialsLibrary() {
  if (_cache) return _cache;
  _cache = {
    karstRock: createKarstRockTextures(),
    terrainDetail: createTerrainDetailTextures(),
    asphalt: createAsphaltTextures(),
    granite: createGraniteStoneTextures('#d5cec0'),
    darkStone: createGraniteStoneTextures('#8b8982'),
    roofGold: createChineseRoofTileTextures('#d8a436', '#f7cf68', '#8c6115'),
    roofSilver: createChineseRoofTileTextures('#6e95b5', '#b8dcf2', '#39556e'),
    roofDark: createChineseRoofTileTextures('#3c444a', '#59646c', '#1e2326'),
    pagodaGold: createPagodaWallTextures('#96681d', '#d8a642', '#ffcf66'),
    pagodaSilver: createPagodaWallTextures('#4a6982', '#87b8d8', '#7ce0ff'),
    palaceWall: createHistoricWallTextures(true),
    lingnanWall: createHistoricWallTextures(false)
  };
  return _cache;
}
