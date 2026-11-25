import * as THREE from 'three';
import { REAL_ROADS } from '../data/guilinRealMapData.js';
import {
  getBridgeSurfaceY,
  isOnRoad,
  isWaterOrShore
} from '../data/landmarksData.js';
import {
  createArchitecturalFacadeTextures,
  getMaterialsLibrary
} from './materialsLibrary.js';

function seededRand(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * Generates vibrant generic Chinese street shopfront signboard textures (临街招牌灯箱)
 */
function createShopSignTexture(text, bgHex, fgHex) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 64;
  const ctx = c.getContext('2d');
  ctx.fillStyle = bgHex;
  ctx.fillRect(0, 0, 256, 64);
  ctx.strokeStyle = 'rgba(255,255,255,0.45)';
  ctx.lineWidth = 3;
  ctx.strokeRect(4, 4, 248, 56);
  ctx.font = 'bold 30px "Microsoft YaHei", "PingFang SC", sans-serif';
  ctx.fillStyle = fgHex;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 128, 33);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function isNearLandmark(x, z) {
  const zones = [
    [-24, 84, 22],   // Elephant Trunk Hill
    [3, -56, 26],    // Jingjiang Palace & Solitary Beauty Peak
    [45, -64, 17],   // Fubo Hill
    [36, -118, 22],  // Diecai Hill
    [-25, 45, 18],   // Shan Lake
    [-64, 18, 24],   // Rong Lake
    [-68, 6, 12],    // Ancient South Gate
    [1, -20, 16],    // East-West Alley
    [18.6, -18.5, 10], // Xiaoyao Pavilion
    [-6, 1, 11]      // Zhengyang St
  ];
  for (const [ex, ez, er] of zones) {
    if ((x - ex) ** 2 + (z - ez) ** 2 < er * er) return true;
  }
  return false;
}

/**
 * Populates Guilin's real 214-road vector network with authentic Chinese streetscape elements:
 * 1. Raised granite sidewalks (人行道) flanking primary & secondary avenues
 * 2. Boulevard tree-pits & Osmanthus street trees (行道树)
 * 3. Street-aligned generic shophouses with illuminated Chinese shop signs (临街商铺)
 * 4. Traffic lights (红绿灯) at major intersections
 * 5. Illuminated city bus shelters (公交站台)
 * 6. Waterfront benches & railings along Binjiang Rd (滨江路休闲设施)
 */
export function createGuilinStreetscape(scene, physics = null) {
  const group = new THREE.Group();
  group.name = 'GuilinStreetscape';

  const mats = getMaterialsLibrary();
  const nightGlowMats = [];
  const rand = seededRand(202608);

  // Shared PBR Materials
  const sidewalkMat = new THREE.MeshStandardMaterial({
    color: 0xd0cbc0,
    map: mats.granite.map,
    bumpMap: mats.granite.bumpMap,
    bumpScale: 0.1,
    roughness: 0.82
  });
  const curbMat = new THREE.MeshStandardMaterial({ color: 0x9ea2a6, roughness: 0.8 });
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x30353b, metalness: 0.55, roughness: 0.42 });
  const canopyGlassMat = new THREE.MeshStandardMaterial({
    color: 0x8cd2e6,
    metalness: 0.25,
    roughness: 0.15,
    transparent: true,
    opacity: 0.72
  });
  const adBoardMat = new THREE.MeshStandardMaterial({
    color: 0xfff0cc,
    emissive: 0xffd27a,
    emissiveIntensity: 0.25,
    roughness: 0.35
  });
  const redLightMat = new THREE.MeshStandardMaterial({
    color: 0xff3b30,
    emissive: 0xff2218,
    emissiveIntensity: 1.6
  });
  const greenLightMat = new THREE.MeshStandardMaterial({
    color: 0x34c759,
    emissive: 0x20d650,
    emissiveIntensity: 1.6
  });
  nightGlowMats.push(adBoardMat);

  // Generic Chinese shopfront signboard materials (6 authentic Guilin street signs!)
  const signConfigs = [
    ['桂林米粉', '#9e231c', '#ffe48a'],
    ['漓江茶楼', '#1b473e', '#f7d67e'],
    ['桂花糕特产', '#8c4b14', '#fff2cc'],
    ['山水宾馆', '#1c3a5e', '#d9f2ff'],
    ['24H 便利店', '#235e4a', '#ffffff'],
    ['阳朔啤酒鱼', '#7a1f2b', '#ffd573']
  ];
  const signMats = signConfigs.map(([txt, bg, fg]) => {
    const tex = createShopSignTexture(txt, bg, fg);
    const m = new THREE.MeshStandardMaterial({
      map: tex,
      emissive: new THREE.Color(0xffffff),
      emissiveMap: tex,
      emissiveIntensity: 0.18,
      roughness: 0.35
    });
    nightGlowMats.push(m);
    return m;
  });

  // Architectural building materials for street-facing generic shophouses
  const shopWallMats = [0, 1, 2, 3].map((i) => {
    const t = createArchitecturalFacadeTextures(i);
    const m = new THREE.MeshStandardMaterial({
      map: t.map,
      bumpMap: t.bumpMap,
      bumpScale: 0.15,
      roughnessMap: t.roughnessMap,
      roughness: 0.84,
      metalness: 0.2,
      emissive: new THREE.Color(0xffffff),
      emissiveMap: t.emissiveMap,
      emissiveIntensity: 0.06
    });
    nightGlowMats.push(m);
    return m;
  });
  const groundShopMat = new THREE.MeshStandardMaterial({ color: 0x3e444a, roughness: 0.7 });
  const roofMat = new THREE.MeshStandardMaterial({
    map: mats.roofDark.map,
    bumpMap: mats.roofDark.bumpMap,
    bumpScale: 0.18,
    roughness: 0.56
  });

  // Collect instanced prop placements along real primary & secondary streets
  const treePitCoords = [];
  const benchCoords = [];
  const busStopCoords = [];
  const shophouseSpots = [];

  let treeDistAccum = 0;
  let busDistAccum = 0;
  let shopDistAccum = 0;

  for (const rd of REAL_ROADS) {
    const isMajor = rd.type === 'primary' || rd.type === 'secondary';
    if (!isMajor) continue;
    const isBinjiang = rd.name && rd.name.includes('滨江');

    for (let i = 0; i < rd.pts.length - 1; i++) {
      const [x1, z1] = rd.pts[i];
      const [x2, z2] = rd.pts[i + 1];
      const mx = (x1 + x2) / 2;
      const mz = (z1 + z2) / 2;

      if (getBridgeSurfaceY(mx, mz, 2.0) !== null) continue;
      if (rd.bridge) continue;

      const dx = x2 - x1;
      const dz = z2 - z1;
      const len = Math.hypot(dx, dz);
      if (len < 1.2) continue;

      const angle = Math.atan2(dx, dz);
      const nx = -dz / len;
      const nz = dx / len;
      const sideW = 1.65;
      const offset = rd.width * 0.5 + sideW * 0.5;

      // 1. Raised granite sidewalks on both sides of primary & secondary roads
      for (const side of [-1, 1]) {
        const sx = mx + nx * offset * side;
        const sz = mz + nz * offset * side;
        if (isWaterOrShore(sx, sz, 0.3)) continue;
        const sw = new THREE.Mesh(new THREE.BoxGeometry(sideW, 0.24, len + 0.4), sidewalkMat);
        sw.position.set(sx, 0.54, sz);
        sw.rotation.y = angle;
        sw.receiveShadow = true;
        group.add(sw);
      }

      // 2. Boulevard trees in stone tree-pits every ~13 units
      treeDistAccum += len;
      if (treeDistAccum >= 13 && treePitCoords.length < 280) {
        treeDistAccum = 0;
        for (const side of [-1, 1]) {
          const tx = mx + nx * (rd.width * 0.5 + 1.15) * side;
          const tz = mz + nz * (rd.width * 0.5 + 1.15) * side;
          if (!isWaterOrShore(tx, tz, 1.2) && !isOnRoad(tx, tz, 0.2)) {
            treePitCoords.push([tx, tz, 0.72 + rand() * 0.32]);
          }
        }
        // Add waterfront benches along Binjiang Road!
        if (isBinjiang && benchCoords.length < 40) {
          const bx = mx + nx * (rd.width * 0.5 + 1.5);
          const bz = mz + nz * (rd.width * 0.5 + 1.5);
          if (!isWaterOrShore(bx, bz, 0.8)) {
            benchCoords.push([bx, bz, angle]);
          }
        }
      }

      // 3. Illuminated City Bus Shelters every ~58 units on major avenues
      busDistAccum += len;
      if (busDistAccum >= 58 && busStopCoords.length < 18) {
        busDistAccum = 0;
        const bx = mx + nx * (rd.width * 0.5 + 1.5);
        const bz = mz + nz * (rd.width * 0.5 + 1.5);
        if (!isWaterOrShore(bx, bz, 1.5) && !isOnRoad(bx, bz, 0.4) && !isNearLandmark(bx, bz)) {
          busStopCoords.push([bx, bz, angle]);
        }
      }

      // 4. Street-aligned generic Guilin shophouses right behind sidewalks!
      shopDistAccum += len;
      if (shopDistAccum >= 11 && shophouseSpots.length < 75) {
        shopDistAccum = 0;
        for (const side of [-1, 1]) {
          const distBack = rd.width * 0.5 + 5.6;
          const sx = mx + nx * distBack * side;
          const sz = mz + nz * distBack * side;
          if (Math.abs(sx) > 125 || Math.abs(sz) > 110) continue;
          if (isWaterOrShore(sx, sz, 4.5)) continue;
          if (isOnRoad(sx, sz, 3.6)) continue;
          if (getBridgeSurfaceY(sx, sz, 7.5) !== null) continue;
          if (isNearLandmark(sx, sz)) continue;
          // Avoid overlapping previously placed shophouses
          if (shophouseSpots.some((p) => Math.hypot(p[0] - sx, p[1] - sz) < 8.5)) continue;
          shophouseSpots.push([sx, sz, angle, side]);
        }
      }
    }
  }

  // Instantiate Boulevard Trees + Stone Tree-Pits
  const pitInst = new THREE.InstancedMesh(new THREE.BoxGeometry(1.15, 0.28, 1.15), curbMat, treePitCoords.length);
  const trunkInst = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.14, 0.2, 1.85, 6),
    new THREE.MeshStandardMaterial({ color: 0x5c4632, roughness: 0.9 }),
    treePitCoords.length
  );
  const leafInst = new THREE.InstancedMesh(
    new THREE.DodecahedronGeometry(1.25, 1),
    new THREE.MeshStandardMaterial({ color: 0x3e7740, roughness: 0.85 }),
    treePitCoords.length
  );
  leafInst.castShadow = true;

  const dummy = new THREE.Object3D();
  treePitCoords.forEach(([x, z, sc], i) => {
    dummy.position.set(x, 0.62, z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    pitInst.setMatrixAt(i, dummy.matrix);

    dummy.position.set(x, 0.62 + 0.9 * sc, z);
    dummy.scale.set(sc, sc, sc);
    dummy.updateMatrix();
    trunkInst.setMatrixAt(i, dummy.matrix);

    dummy.position.set(x, 0.62 + 2.35 * sc, z);
    dummy.scale.set(sc * 1.12, sc * 0.92, sc * 1.12);
    dummy.updateMatrix();
    leafInst.setMatrixAt(i, dummy.matrix);
  });
  group.add(pitInst, trunkInst, leafInst);

  // Build Generic Street-Aligned Shophouses (临街底商 + 发光中文招牌!)
  shophouseSpots.forEach(([sx, sz, roadAngle, side], idx) => {
    const bGroup = new THREE.Group();
    bGroup.position.set(sx, 0.48, sz);
    // Face the street directly
    bGroup.rotation.y = roadAngle + (side === 1 ? -Math.PI / 2 : Math.PI / 2);

    const w = 6.8 + (idx % 3) * 1.1; // along street
    const d = 5.2;
    const h = 6.8 + (idx % 4) * 3.2;

    // Ground-floor commercial storefront plinth
    const gf = new THREE.Mesh(new THREE.BoxGeometry(w, 2.5, d), groundShopMat);
    gf.position.y = 1.25;
    gf.castShadow = true;
    gf.receiveShadow = true;
    bGroup.add(gf);

    // Upper residential/commercial stories with PBR architectural windows
    const upper = new THREE.Mesh(new THREE.BoxGeometry(w - 0.15, h - 2.5, d - 0.15), shopWallMats[idx % shopWallMats.length]);
    upper.position.y = 2.5 + (h - 2.5) / 2;
    upper.castShadow = true;
    upper.receiveShadow = true;
    bGroup.add(upper);

    // Sloped Guilin neo-traditional grey roof cap
    const rGeo = new THREE.ConeGeometry(Math.max(w, d) * 0.72, 1.8, 4);
    rGeo.rotateY(Math.PI / 4);
    const roof = new THREE.Mesh(rGeo, roofMat);
    roof.scale.set(w / Math.max(w, d), 1, d / Math.max(w, d));
    roof.position.y = h + 0.9;
    bGroup.add(roof);

    // Illuminated Chinese street shopfront signboard facing the sidewalk (+Z in local frame)
    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(w * 0.72, 0.85, 0.18), signMats[idx % signMats.length]);
    signBoard.position.set(0, 2.38, d / 2 + 0.12);
    bGroup.add(signBoard);

    group.add(bGroup);
    if (physics) {
      physics.addBoxCollider(sx, 0.48 + h / 2, sz, w, h, d, bGroup.rotation.y, true);
    }
  });

  // Build Generic City Bus Shelters (公交站台)
  for (const [bx, bz, angle] of busStopCoords) {
    const shelter = new THREE.Group();
    shelter.position.set(bx, 0.62, bz);
    shelter.rotation.y = angle;

    for (const pz of [-1.4, 1.4]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.3, 6), poleMat);
      post.position.set(0, 1.15, pz);
      shelter.add(post);
    }
    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.1, 3.3), canopyGlassMat);
    roof.position.set(0.15, 2.32, 0);
    shelter.add(roof);

    const ad = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.35, 2.2), adBoardMat);
    ad.position.set(-0.22, 1.2, 0);
    shelter.add(ad);

    group.add(shelter);
  }

  // Build Waterfront Park Benches along Binjiang Rd
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x8a5a36, roughness: 0.75 });
  for (const [bx, bz, angle] of benchCoords) {
    const bench = new THREE.Group();
    bench.position.set(bx, 0.62, bz);
    bench.rotation.y = angle;
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 1.6), woodMat);
    seat.position.y = 0.45;
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.45, 1.6), woodMat);
    back.position.set(-0.22, 0.7, 0);
    bench.add(seat, back);
    group.add(bench);
  }

  // Build Traffic Light Poles (红绿灯) at Major Guilin Intersections!
  const intersections = [
    [-25.4, -17.0, 0.28],  // 十字街 (Jiefang Rd x Zhongshan Rd)
    [16.8, -5.6, 0.28],    // 解放桥西口 (Jiefang East Rd x Binjiang Rd)
    [-39.6, 21.7, 0.24],   // 阳桥北口 (Zhongshan Rd x Ronghu North Rd)
    [-46.7, 77.1, 0.22],   // 文昌桥北口 (Binjiang Rd x Wenming Rd)
    [-73.0, -30.5, 0.32]   // 解放西路西口
  ];
  for (const [ix, iz, rot] of intersections) {
    for (const corner of [[-4.5, -4.5], [4.5, 4.5]]) {
      const lx = ix + corner[0];
      const lz = iz + corner[1];
      if (isWaterOrShore(lx, lz, 0.5)) continue;
      const sig = new THREE.Group();
      sig.position.set(lx, 0.62, lz);
      sig.rotation.y = rot + (corner[0] > 0 ? Math.PI : 0);

      const vPole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 4.6, 6), poleMat);
      vPole.position.y = 2.3;
      sig.add(vPole);

      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.2, 6), poleMat);
      arm.rotation.z = Math.PI / 2;
      arm.position.set(1.5, 4.4, 0);
      sig.add(arm);

      const box = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.42, 0.32), poleMat);
      box.position.set(2.3, 4.25, 0);
      sig.add(box);

      const rBulb = new THREE.Mesh(new THREE.SphereGeometry(0.11, 6, 6), redLightMat);
      rBulb.position.set(2.02, 4.25, 0.16);
      const gBulb = new THREE.Mesh(new THREE.SphereGeometry(0.11, 6, 6), greenLightMat);
      gBulb.position.set(2.58, 4.25, 0.16);
      sig.add(rBulb, gBulb);

      group.add(sig);
    }
  }

  scene.add(group);
  return { group, nightGlowMats };
}
