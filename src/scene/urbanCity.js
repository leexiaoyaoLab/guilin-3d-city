import * as THREE from 'three';
import {
  getBridgeSurfaceY,
  isWaterOrShore,
  isOnRoad
} from '../data/landmarksData.js';
import { REAL_ROADS } from '../data/guilinRealMapData.js';
import {
  createArchitecturalFacadeTextures,
  getMaterialsLibrary
} from './materialsLibrary.js';

function seededRandom(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * Generates procedural facade textures (daytime facade + glowing night window emissive map)
 * so modern Guilin buildings look crisp by day and sparkle warmly by night!
 */
function createBuildingTextures(styleIndex) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  const emissiveCanvas = document.createElement('canvas');
  emissiveCanvas.width = 256;
  emissiveCanvas.height = 256;
  const eCtx = emissiveCanvas.getContext('2d');

  const palettes = [
    { wall: '#e4dfd4', trim: '#c7c0b0', win: '#5b7285' }, // Warm ivory Guilin apartment
    { wall: '#d8dde0', trim: '#b7c0c7', win: '#4a6880' }, // Modern riverside hotel
    { wall: '#dfd5c6', trim: '#b8a894', win: '#63717d' }, // Lingnan beige civic
    { wall: '#ccd4d1', trim: '#9faea8', win: '#42606b' }  // Jade-tinted modern commercial
  ];
  const pal = palettes[styleIndex % palettes.length];

  ctx.fillStyle = pal.wall;
  ctx.fillRect(0, 0, 256, 256);

  eCtx.fillStyle = '#000000';
  eCtx.fillRect(0, 0, 256, 256);

  const rand = seededRandom(500 + styleIndex * 97);
  const cols = 6;
  const rows = 8;
  const padX = 7;
  const padY = 6;
  const cellW = 256 / cols;
  const cellH = 256 / rows;

  for (let r = 0; r < rows; r++) {
    // Horizontal floor trim line
    ctx.fillStyle = pal.trim;
    ctx.fillRect(0, r * cellH, 256, 3);

    for (let c = 0; c < cols; c++) {
      const wx = c * cellW + padX;
      const wy = r * cellH + padY + 2;
      const ww = cellW - padX * 2;
      const wh = cellH - padY * 2;

      ctx.fillStyle = pal.win;
      ctx.fillRect(wx, wy, ww, wh);

      // Subtle window reflection highlight
      ctx.fillStyle = 'rgba(255,255,255,0.16)';
      ctx.fillRect(wx, wy, ww, wh * 0.32);

      // Night window illumination (some rooms warm amber, some cool white, some dark)
      const litChance = rand();
      if (litChance > 0.38) {
        const warm = rand() > 0.25;
        eCtx.fillStyle = warm
          ? (rand() > 0.5 ? '#ffca6b' : '#ffe3a8')
          : '#bfe6ff';
        eCtx.fillRect(wx + 1, wy + 1, ww - 2, wh - 2);
      }
    }
  }

  const map = new THREE.CanvasTexture(canvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.colorSpace = THREE.SRGBColorSpace;

  const emissiveMap = new THREE.CanvasTexture(emissiveCanvas);
  emissiveMap.wrapS = THREE.RepeatWrapping;
  emissiveMap.wrapT = THREE.RepeatWrapping;
  emissiveMap.colorSpace = THREE.SRGBColorSpace;

  return { map, emissiveMap };
}

/**
 * Checks if a coordinate overlaps any protected landmark or karst peak footprint
 */
function isProtectedZone(x, z) {
  const exclusionZones = [
    [-24, 84, 24],    // Elephant Trunk Hill (real confluence!)
    [3, -56, 27],     // Solitary Beauty Peak & Jingjiang Palace
    [36, -62, 18],    // Fubo Hill
    [32, -118, 24],   // Diecai Hill
    [-21, 32, 22],    // Shan Lake
    [-72, 19, 30],    // Rong Lake
    [-68, 6, 13],     // Ancient South Gate
    [1, -20, 17],     // East-West Alley (north of real diagonal Jiefang East Rd)
    [21, -13, 12],    // Xiaoyao Pavilion (NW corner of Jiefang Bridge)
    [-6, 2, 12],      // Zhengyang Pedestrian Street (south of Jiefang East Rd)
    [95, -8, 24],     // Seven Star Park Peak 1
    [118, 12, 25],    // Seven Star Park Peak 2
    [102, 34, 22],    // Seven Star Park Peak 3
    [82, 92, 24],     // Chuanshan
    [62, 102, 16]     // Tashan
  ];

  for (const [ex, ez, er] of exclusionZones) {
    const dx = x - ex;
    const dz = z - ez;
    if (dx * dx + dz * dz < er * er) return true;
  }
  return false;
}

/**
 * Build Guilin's EXACT Real-World Vector Road Network from guilinRealMapData.js (214 real curved streets!)
 */
function createRoadNetwork(nightGlowMats) {
  const group = new THREE.Group();
  group.name = 'RoadNetwork';

  const mats = getMaterialsLibrary();
  const asphaltMat = new THREE.MeshStandardMaterial({
    map: mats.asphalt.map,
    bumpMap: mats.asphalt.bumpMap,
    bumpScale: 0.14,
    roughnessMap: mats.asphalt.roughnessMap,
    roughness: 0.86,
    metalness: 0.05
  });
  const secondaryMat = new THREE.MeshStandardMaterial({
    color: 0x4b5058,
    bumpMap: mats.asphalt.bumpMap,
    bumpScale: 0.1,
    roughness: 0.88
  });
  const pedestrianMat = new THREE.MeshStandardMaterial({
    color: 0xcbc2b2,
    map: mats.granite.map,
    bumpMap: mats.granite.bumpMap,
    bumpScale: 0.14,
    roughness: 0.78
  });
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x32363b, metalness: 0.5, roughness: 0.5 });
  const lampBulbMat = new THREE.MeshStandardMaterial({
    color: 0xfff0c2,
    emissive: 0xffb94d,
    emissiveIntensity: 0.1
  });
  nightGlowMats.push(lampBulbMat);

  const lampPositions = [];
  let lampAccum = 0;

  for (const rd of REAL_ROADS) {
    const pts = rd.pts;
    const isMajor = rd.type === 'primary' || rd.type === 'secondary';
    const isPed = rd.type === 'pedestrian';
    const mat = isMajor ? asphaltMat : isPed ? pedestrianMat : secondaryMat;
    const yLayer = isMajor ? 0.55 : isPed ? 0.53 : 0.51;

    for (let i = 0; i < pts.length - 1; i++) {
      const [x1, z1] = pts[i];
      const [x2, z2] = pts[i + 1];
      const mx = (x1 + x2) / 2;
      const mz = (z1 + z2) / 2;

      // Skip segments inside deep water or already covered by our 3D sloped bridge decks
      if (getBridgeSurfaceY(mx, mz, 1.5) !== null) continue;
      if (isWaterOrShore(mx, mz, 0.4)) continue;

      const dx = x2 - x1;
      const dz = z2 - z1;
      const len = Math.hypot(dx, dz);
      if (len < 0.3) continue;

      const angle = Math.atan2(dx, dz);
      // Slight overlap (+0.5) ensures curved segments join seamlessly without gaps at bends
      const seg = new THREE.Mesh(new THREE.BoxGeometry(rd.width, 0.14, len + 0.5), mat);
      seg.position.set(mx, yLayer, mz);
      seg.rotation.y = angle;
      seg.receiveShadow = true;
      group.add(seg);

      // Place streetlights evenly along real primary & secondary roads
      if (isMajor && lampPositions.length < 220) {
        lampAccum += len;
        if (lampAccum >= 18) {
          lampAccum = 0;
          const nx = -dz / len;
          const nz = dx / len;
          const sideDist = rd.width * 0.5 + 0.85;
          const lx = mx + nx * sideDist;
          const lz = mz + nz * sideDist;
          if (!isWaterOrShore(lx, lz, 1.0)) {
            lampPositions.push([lx, lz]);
          }
        }
      }
    }
  }

  const poleInst = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.09, 0.12, 3.2, 5), poleMat, lampPositions.length);
  const bulbInst = new THREE.InstancedMesh(new THREE.SphereGeometry(0.26, 6, 6), lampBulbMat, lampPositions.length);
  const dummy = new THREE.Object3D();

  lampPositions.forEach(([lx, lz], i) => {
    dummy.position.set(lx, 2.1, lz);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    poleInst.setMatrixAt(i, dummy.matrix);

    dummy.position.set(lx, 3.8, lz);
    dummy.updateMatrix();
    bulbInst.setMatrixAt(i, dummy.matrix);
  });

  group.add(poleInst);
  group.add(bulbInst);

  return group;
}

/**
 * Create Guilin's Simulated Urban Districts + Osmanthus Trees + Interactive Builder Helper
 */
export function createUrbanCity(scene, physics = null) {
  const group = new THREE.Group();
  group.name = 'GuilinUrbanCity';

  const nightGlowMats = [];
  const buildingMaterials = [];

  // 1. Road Network
  group.add(createRoadNetwork(nightGlowMats));

  // 2. Procedural Modern Guilin Buildings (512px PBR architectural glass & stone facades!)
  const mats = getMaterialsLibrary();
  const styleCount = 4;
  for (let s = 0; s < styleCount; s++) {
    const { map, emissiveMap, bumpMap, roughnessMap } = createArchitecturalFacadeTextures(s);
    const mat = new THREE.MeshStandardMaterial({
      map,
      bumpMap,
      bumpScale: 0.16,
      roughnessMap,
      roughness: 0.85,
      metalness: 0.24,
      emissive: new THREE.Color(0xffffff),
      emissiveMap,
      emissiveIntensity: 0.05
    });
    buildingMaterials.push(mat);
  }

  const roofCapMat = new THREE.MeshStandardMaterial({
    color: 0x82878c,
    map: mats.granite.map,
    bumpMap: mats.granite.bumpMap,
    bumpScale: 0.12,
    roughness: 0.82
  });
  const slopedRoofMat = new THREE.MeshStandardMaterial({
    map: mats.roofDark.map,
    bumpMap: mats.roofDark.bumpMap,
    bumpScale: 0.22,
    roughness: 0.54,
    metalness: 0.14
  });
  const rand = seededRandom(8848);

  const buildingsGroup = new THREE.Group();
  buildingsGroup.name = 'ProceduralBuildings';

  // Store metadata for density toggle (low / normal / high)
  const buildingEntries = [];

  const gridMinX = -132;
  const gridMaxX = 128;
  const gridMinZ = -112;
  const gridMaxZ = 102;
  const step = 11.5;

  for (let gx = gridMinX; gx <= gridMaxX; gx += step) {
    for (let gz = gridMinZ; gz <= gridMaxZ; gz += step) {
      const x = gx + (rand() - 0.5) * 4.2;
      const z = gz + (rand() - 0.5) * 4.2;

      if (isWaterOrShore(x, z, 6.2)) continue;
      if (isOnRoad(x, z, 4.8)) continue;
      if (isProtectedZone(x, z)) continue;

      // Distance from urban center (-30, -10) shapes building height & density
      const distCenter = Math.hypot(x + 30, z + 10);
      if (distCenter > 136 && rand() > 0.35) continue;

      // Guilin keeps skyscrapers below karst peaks (~8 to 22 units high)
      const isCommercialCore = distCenter < 68 && x < 18;
      const isRiversideHotel = x > 68 && x < 102 && Math.abs(z) < 62;

      const w = 4.6 + rand() * 4.6;
      const d = 4.6 + rand() * 4.6;
      let h = 4.5 + rand() * 8.5;
      if (isCommercialCore) h += 3.5 + rand() * 7.5;
      if (isRiversideHotel) h += 2.5 + rand() * 6.0;

      const styleIdx = Math.floor(rand() * styleCount);
      const bGroup = new THREE.Group();
      bGroup.position.set(x, 0.45, z);

      // Slight grid alignment with organic variety
      if (rand() > 0.82) bGroup.rotation.y = (rand() - 0.5) * 0.28;

      const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), buildingMaterials[styleIdx]);
      body.position.y = h / 2;
      body.castShadow = true;
      body.receiveShadow = true;
      bGroup.add(body);

      // Rooftop detail: either modern AC penthouse or Guilin neo-traditional sloped cap
      if (rand() > 0.45) {
        const cap = new THREE.Mesh(new THREE.BoxGeometry(w * 0.72, 1.1, d * 0.72), roofCapMat);
        cap.position.y = h + 0.55;
        bGroup.add(cap);
      } else {
        const rGeo = new THREE.ConeGeometry(Math.max(w, d) * 0.75, 2.1, 4);
        rGeo.rotateY(Math.PI / 4);
        const roof = new THREE.Mesh(rGeo, slopedRoofMat);
        roof.scale.set(w / Math.max(w, d), 1, d / Math.max(w, d));
        roof.position.y = h + 1.05;
        bGroup.add(roof);
      }

      buildingsGroup.add(bGroup);
      const physBody = physics
        ? physics.addBoxCollider(x, 0.45 + h / 2, z, w + 0.3, h + 1.0, d + 0.3, bGroup.rotation.y, true)
        : null;
      buildingEntries.push({
        mesh: bGroup,
        physBody,
        priority: rand() // Used when user adjusts urban density slider
      });
    }
  }

  group.add(buildingsGroup);

  // 3. Lush Guilin Urban Greenery: Instanced Osmanthus Trees (桂花树) & Waterfront Willows
  const treePositions = [];
  for (let i = 0; i < 680; i++) {
    const x = (rand() - 0.5) * 320;
    const z = (rand() - 0.5) * 290;
    if (isWaterOrShore(x, z, 2.2)) continue;
    if (isOnRoad(x, z, 1.6)) continue;

    // Avoid inside palace courtyard center
    if (Math.hypot(x + 32, z + 46) < 15) continue;

    // Concentrate lush Osmanthus & Willow trees along lakes, riverbanks, and parks
    const nearWater = isWaterOrShore(x, z, 13.5);
    const inPark = (x > -115 && x < 16 && z > -2 && z < 50) || (x > 74 && x < 140 && z > -60 && z < 55);
    if (!nearWater && !inPark && rand() > 0.32) continue;

    const scale = 0.7 + rand() * 0.95;
    const isOsmanthusBloom = rand() > 0.72; // Golden-green autumn/fragrant osmanthus accent
    treePositions.push({ x, z, scale, isOsmanthusBloom });
  }

  const trunkGeo = new THREE.CylinderGeometry(0.16, 0.24, 1.6, 5);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c4632, roughness: 0.9 });
  const foliageGeo = new THREE.DodecahedronGeometry(1.35, 1);
  const foliageMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85 });

  const trunkInst = new THREE.InstancedMesh(trunkGeo, trunkMat, treePositions.length);
  const foliageInst = new THREE.InstancedMesh(foliageGeo, foliageMat, treePositions.length);
  foliageInst.castShadow = true;
  foliageInst.receiveShadow = true;

  const dummy = new THREE.Object3D();
  const cGreen1 = new THREE.Color(0x376d3b);
  const cGreen2 = new THREE.Color(0x4b8244);
  const cOsmanthus = new THREE.Color(0x7c8e42); // Subtle golden-olive osmanthus blossom foliage
  const tmpC = new THREE.Color();

  treePositions.forEach((t, i) => {
    dummy.position.set(t.x, 0.45 + 0.8 * t.scale, t.z);
    dummy.rotation.set(0, rand() * Math.PI * 2, 0);
    dummy.scale.set(t.scale, t.scale, t.scale);
    dummy.updateMatrix();
    trunkInst.setMatrixAt(i, dummy.matrix);

    dummy.position.set(t.x, 0.45 + 2.2 * t.scale, t.z);
    dummy.scale.set(t.scale * 1.1, t.scale * 0.85, t.scale * 1.1);
    dummy.updateMatrix();
    foliageInst.setMatrixAt(i, dummy.matrix);

    if (t.isOsmanthusBloom) {
      tmpC.copy(cOsmanthus);
    } else {
      tmpC.copy(cGreen1).lerp(cGreen2, rand());
    }
    foliageInst.setColorAt(i, tmpC);
  });

  group.add(trunkInst);
  group.add(foliageInst);

  // 4. User-Placed Custom Buildings / Pavilions / Osmanthus Groves (Interactive City Builder!)
  const userBuiltGroup = new THREE.Group();
  userBuiltGroup.name = 'UserBuiltStructures';
  group.add(userBuiltGroup);

  function placeUserStructure(type, x, z) {
    const item = new THREE.Group();
    item.position.set(x, 0.45, z);

    if (type === 'pavilion') {
      const pillarMat = new THREE.MeshStandardMaterial({ color: 0x9e2b25, roughness: 0.65 });
      const roofMat = new THREE.MeshStandardMaterial({ color: 0x3b4946, roughness: 0.6 });
      const base = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.7, 0.6, 6), new THREE.MeshStandardMaterial({ color: 0xd4cfc4 }));
      base.position.y = 0.3;
      item.add(base);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const p = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.6, 6), pillarMat);
        p.position.set(Math.cos(a) * 1.7, 1.9, Math.sin(a) * 1.7);
        item.add(p);
      }
      const r1 = new THREE.Mesh(new THREE.ConeGeometry(3.1, 1.3, 6), roofMat);
      r1.position.y = 3.7;
      r1.castShadow = true;
      item.add(r1);
      const r2 = new THREE.Mesh(new THREE.ConeGeometry(1.9, 1.2, 6), roofMat);
      r2.position.y = 4.8;
      item.add(r2);
    } else if (type === 'modern') {
      const mat = buildingMaterials[Math.floor(Math.random() * buildingMaterials.length)];
      const h = 11 + Math.random() * 8;
      const body = new THREE.Mesh(new THREE.BoxGeometry(6.8, h, 6.8), mat);
      body.position.y = h / 2;
      body.castShadow = true;
      body.receiveShadow = true;
      item.add(body);
      const cap = new THREE.Mesh(new THREE.BoxGeometry(5.0, 1.2, 5.0), roofCapMat);
      cap.position.y = h + 0.6;
      item.add(cap);
    } else if (type === 'courtyard') {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(7.2, 3.6, 5.4), new THREE.MeshStandardMaterial({ color: 0xe6dfd0, roughness: 0.85 }));
      wall.position.y = 1.8;
      wall.castShadow = true;
      item.add(wall);
      const rGeo = new THREE.ConeGeometry(5.8, 2.2, 4);
      rGeo.rotateY(Math.PI / 4);
      const roof = new THREE.Mesh(rGeo, slopedRoofMat);
      roof.scale.set(1.25, 1, 0.92);
      roof.position.y = 4.7;
      roof.castShadow = true;
      item.add(roof);
    } else if (type === 'grove') {
      // Cluster of fragrant golden-green Osmanthus trees (桂花林)
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        const rad = i === 0 ? 0 : 2.3 + Math.random() * 1.1;
        const t = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.26, 1.8, 5), trunkMat);
        t.position.set(Math.cos(a) * rad, 0.9, Math.sin(a) * rad);
        item.add(t);
        const f = new THREE.Mesh(
          new THREE.DodecahedronGeometry(1.55, 1),
          new THREE.MeshStandardMaterial({ color: i % 2 === 0 ? 0x869a42 : 0x467e43, roughness: 0.85 })
        );
        f.position.set(Math.cos(a) * rad, 2.4, Math.sin(a) * rad);
        f.castShadow = true;
        item.add(f);
      }
    }

    userBuiltGroup.add(item);
    if (physics && type !== 'grove') {
      physics.addBoxCollider(x, 4.0, z, 6.8, 8.0, 6.8, 0, true);
    }
    return item;
  }

  function setUrbanDensity(densityFactor) {
    // densityFactor in [0.25, 1.0]
    let visibleCount = 0;
    for (const entry of buildingEntries) {
      const show = entry.priority <= densityFactor;
      entry.mesh.visible = show;
      if (entry.physBody) {
        entry.physBody.collisionResponse = show;
      }
      if (show) visibleCount++;
    }
    return visibleCount;
  }

  scene.add(group);
  return {
    group,
    buildingMaterials,
    nightGlowMats,
    totalBuildings: buildingEntries.length,
    setUrbanDensity,
    placeUserStructure,
    userBuiltGroup
  };
}
