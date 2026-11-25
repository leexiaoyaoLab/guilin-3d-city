import * as THREE from 'three';
import {
  createStoneInscriptionMaterial,
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
 * Generates an authentic Guilin Karst limestone peak geometry:
 * Steep rounded-conical / bell-shaped silhouette with vertical cliff ribs,
 * exposed pale-grey limestone faces, and lush emerald canopy on gentler slopes & summit.
 */
function createKarstPeakMesh(radiusX, radiusZ, height, seed, options = {}) {
  const rand = seededRandom(seed);
  const radialSegs = options.radialSegs || 22;
  const heightSegs = options.heightSegs || 16;

  // Build from a dome-topped cylinder/cone deformed smoothly
  const geo = new THREE.CylinderGeometry(0.28, 1.0, 1.0, radialSegs, heightSegs, false);
  geo.translate(0, 0.5, 0); // Base at y = 0, top at y = 1

  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);

  const phase1 = rand() * Math.PI * 2;
  const phase2 = rand() * Math.PI * 2;
  const phase3 = rand() * Math.PI * 2;
  const freq1 = 2 + Math.floor(rand() * 3);
  const freq2 = 4 + Math.floor(rand() * 4);
  const tiltX = (rand() - 0.5) * 0.14;
  const tiltZ = (rand() - 0.5) * 0.14;
  const domePow = options.domePow || (0.48 + rand() * 0.22);

  const deepJade = new THREE.Color(0x274d32);
  const lushGreen = new THREE.Color(0x3b6e3f);
  const sunlitCanopy = new THREE.Color(0x528547);
  const limestoneGrey = new THREE.Color(0x8e918b);
  const limestoneWarm = new THREE.Color(0xa69f90);
  const tmpColor = new THREE.Color();

  for (let i = 0; i < pos.count; i++) {
    let vx = pos.getX(i);
    let vy = pos.getY(i);
    let vz = pos.getZ(i);

    const angle = Math.atan2(vz, vx);
    const origR = Math.sqrt(vx * vx + vz * vz);

    // Classic Guilin karst profile: steep lower walls, softly rounded bell summit
    let profileR = Math.pow(Math.max(0, 1.0 - Math.pow(vy, 1.85)), domePow);
    if (vy >= 0.999) {
      profileR = 0.0;
    }

    // Organic limestone ridges and flutes
    const flute =
      1.0 +
      Math.sin(angle * freq1 + phase1 + vy * 1.4) * 0.18 +
      Math.cos(angle * freq2 + phase2 - vy * 2.2) * 0.09 +
      Math.sin(vy * 8.5 + phase3) * 0.04;

    const finalR = (origR > 0.001 ? profileR : 0.0) * flute;
    const x = Math.cos(angle) * finalR * radiusX + vy * height * tiltX;
    const z = Math.sin(angle) * finalR * radiusZ + vy * height * tiltZ;
    const y = vy * height + (vy > 0.92 ? Math.sin(angle * 3 + phase1) * 0.5 : 0);

    pos.setXYZ(i, x, y, z);

    // Paint sheer rocky limestone cliff bands + lush green vegetation
    const cliffNoise = Math.sin(angle * freq2 + phase2) * 0.5 + 0.5;
    const isCliffFace = vy > 0.22 && vy < 0.82 && cliffNoise > (options.cliffThreshold || 0.62);

    if (isCliffFace) {
      tmpColor.copy(limestoneGrey).lerp(limestoneWarm, Math.sin(vy * 12 + angle) * 0.5 + 0.5);
    } else {
      const canopyMix = Math.min(1, Math.max(0, vy * 0.85 + Math.sin(angle * 3 + phase1) * 0.18));
      tmpColor.copy(deepJade).lerp(lushGreen, canopyMix);
      if (vy > 0.72) {
        tmpColor.lerp(sunlitCanopy, (vy - 0.72) * 2.0);
      }
    }

    // Slight atmospheric tint for distant mountains
    if (options.distantTint) {
      tmpColor.lerp(new THREE.Color(0x46686b), options.distantTint);
    }

    colors[i * 3] = tmpColor.r;
    colors[i * 3 + 1] = tmpColor.g;
    colors[i * 3 + 2] = tmpColor.b;
  }

  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();

  const mats = getMaterialsLibrary();
  const mat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    map: mats.karstRock.map,
    bumpMap: mats.karstRock.bumpMap,
    bumpScale: 1.35,
    roughness: 0.9,
    metalness: 0.03,
    flatShading: false
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = !options.noShadow;
  mesh.receiveShadow = true;
  return mesh;
}

/**
 * Handcrafted Iconic Landmark: 象鼻山 (Elephant Trunk Hill)
 * Positioned right at the confluence of the Li River and Peach Blossom River.
 * Features: Main elephant body/head, sweeping arched trunk dipping into the Li River
 * forming 水月洞 (Water Moon Cave), and Ming-dynasty 普贤塔 (Puxian Pagoda) on the summit!
 */
function createElephantTrunkHill(nightGlowMats) {
  const group = new THREE.Group();
  group.name = 'ElephantTrunkHill';
  group.position.set(14, -0.4, 86);
  group.rotation.y = 0.22; // Facing east-southeast into the Li River confluence

  const mats = getMaterialsLibrary();
  const rockMat = new THREE.MeshStandardMaterial({
    color: 0x7c8678,
    map: mats.karstRock.map,
    bumpMap: mats.karstRock.bumpMap,
    bumpScale: 1.1,
    roughness: 0.9
  });
  const cliffMat = new THREE.MeshStandardMaterial({
    color: 0x9fa196,
    map: mats.karstRock.map,
    bumpMap: mats.karstRock.bumpMap,
    bumpScale: 1.25,
    roughness: 0.86
  });

  // 1. Main Elephant Body (massive limestone karst ridge)
  const body = createKarstPeakMesh(13.5, 9.8, 22.5, 101, {
    domePow: 0.42,
    cliffThreshold: 0.56
  });
  body.position.set(-4.5, 0, 0);
  group.add(body);

  // Secondary shoulder/head hump
  const head = createKarstPeakMesh(8.2, 7.2, 19.5, 202, {
    domePow: 0.46,
    cliffThreshold: 0.52
  });
  head.position.set(4.2, 0, 0.4);
  group.add(head);

  // 2. The Iconic Curved Elephant Trunk forming 水月洞 (Water Moon Cave)!
  const trunkCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(6.8, 13.8, 0.3),
    new THREE.Vector3(11.6, 12.6, 0.4),
    new THREE.Vector3(14.8, 9.2, 0.4),
    new THREE.Vector3(16.2, 4.8, 0.2),
    new THREE.Vector3(16.5, 0.0, 0.0),
    new THREE.Vector3(16.2, -1.6, 0.0)
  ]);

  const trunkGeo = new THREE.TubeGeometry(trunkCurve, 26, 2.35, 12, false);
  // Sculpt organic tapering and rockiness onto the trunk
  const tPos = trunkGeo.attributes.position;
  for (let i = 0; i < tPos.count; i++) {
    const x = tPos.getX(i);
    const y = tPos.getY(i);
    const z = tPos.getZ(i);
    const noise = Math.sin(x * 0.9 + y * 0.7) * 0.28 + Math.cos(z * 1.4 + y * 0.8) * 0.2;
    tPos.setXYZ(i, x + noise * 0.6, y + noise * 0.35, z * 1.15 + noise * 0.5);
  }
  trunkGeo.computeVertexNormals();
  const trunkMesh = new THREE.Mesh(trunkGeo, cliffMat);
  trunkMesh.castShadow = true;
  trunkMesh.receiveShadow = true;
  group.add(trunkMesh);

  // Lush foliage tufts perched along the top arch of the trunk
  const bushMat = new THREE.MeshStandardMaterial({ color: 0x38693b, roughness: 0.9 });
  const bushCoords = [
    [9.2, 15.1, 0.5, 2.1],
    [12.2, 13.6, 0.2, 1.8],
    [14.2, 10.9, 0.6, 1.4],
    [2.5, 18.8, -0.8, 2.4]
  ];
  for (const [bx, by, bz, br] of bushCoords) {
    const bush = new THREE.Mesh(new THREE.DodecahedronGeometry(br, 1), bushMat);
    bush.position.set(bx, by, bz);
    bush.scale.set(1.2, 0.75, 1.1);
    bush.castShadow = true;
    group.add(bush);
  }

  // Subtle moonlight/landscape uplight inside Water Moon Cave (水月洞)
  const caveLightMat = new THREE.MeshStandardMaterial({
    color: 0xfff5d6,
    emissive: 0xffd275,
    emissiveIntensity: 0.05
  });
  nightGlowMats.push(caveLightMat);
  const caveLantern = new THREE.Mesh(new THREE.SphereGeometry(0.45, 8, 8), caveLightMat);
  caveLantern.position.set(11.5, 9.6, 0.4);
  group.add(caveLantern);

  // 3. 普贤塔 (Puxian Pagoda) perched atop Elephant Trunk Hill
  const pagoda = new THREE.Group();
  pagoda.position.set(-2.6, 21.6, 0.2);

  const brickMat = new THREE.MeshStandardMaterial({ color: 0xa05a3e, roughness: 0.8 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x454a4d, roughness: 0.7 });

  // Octagonal stone base
  const pBase = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.65, 1.4, 8), rockMat);
  pBase.position.y = 0.7;
  pagoda.add(pBase);

  // Sword-hilt style body (characteristic Ming Lamaist pagoda shape)
  const pBody = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 0.95, 2.5, 8), brickMat);
  pBody.position.y = 2.6;
  pBody.castShadow = true;
  pagoda.add(pBody);

  // Canopy umbrella roof & finial spire
  const pRoof = new THREE.Mesh(new THREE.ConeGeometry(1.7, 1.4, 8), roofMat);
  pRoof.position.y = 4.4;
  pagoda.add(pRoof);

  const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.25, 1.2, 6), caveLightMat);
  spire.position.y = 5.4;
  pagoda.add(spire);

  group.add(pagoda);

  // Tag all children for raycasting click inspection
  group.traverse((child) => {
    child.userData.landmarkId = 'elephant-hill';
  });

  return group;
}

/**
 * Create a small traditional hilltop Chinese pavilion (e.g. 拿云亭 on Diecai Hill)
 */
function createSummitPavilion(nightGlowMats) {
  const g = new THREE.Group();
  const mats = getMaterialsLibrary();
  const pillarMat = new THREE.MeshStandardMaterial({ color: 0x9e2b25, roughness: 0.62 });
  const roofMat = new THREE.MeshStandardMaterial({
    map: mats.roofDark.map,
    bumpMap: mats.roofDark.bumpMap,
    bumpScale: 0.2,
    roughness: 0.52,
    metalness: 0.14
  });
  const lanternMat = new THREE.MeshStandardMaterial({
    color: 0xffd27a,
    emissive: 0xff9d2e,
    emissiveIntensity: 0.1
  });
  nightGlowMats.push(lanternMat);

  const base = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.4, 0.7, 6), new THREE.MeshStandardMaterial({ color: 0xd0cbc0 }));
  base.position.y = 0.35;
  g.add(base);

  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 2.2, 6), pillarMat);
    p.position.set(Math.cos(a) * 1.45, 1.8, Math.sin(a) * 1.45);
    g.add(p);
  }

  const roof1 = new THREE.Mesh(new THREE.ConeGeometry(2.7, 1.2, 6), roofMat);
  roof1.position.y = 3.35;
  g.add(roof1);

  const roof2 = new THREE.Mesh(new THREE.ConeGeometry(1.7, 1.15, 6), roofMat);
  roof2.position.y = 4.35;
  g.add(roof2);

  const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 8), lanternMat);
  lantern.position.y = 2.45;
  g.add(lantern);

  return g;
}

function rockBaseMat(hex) {
  return new THREE.MeshStandardMaterial({ color: hex, roughness: 0.9 });
}

export function createKarstMountains(scene, physics = null) {
  const group = new THREE.Group();
  group.name = 'KarstMountains';
  const nightGlowMats = [];

  // 1. 象鼻山 (Elephant Trunk Hill) + Carved Waterfront Stone Stele (象鼻山)
  const elephantHill = createElephantTrunkHill(nightGlowMats);
  group.add(elephantHill);

  const elephantSteleMat = createStoneInscriptionMaterial('象鼻山', {
    vertical: false,
    stoneHex: '#c4bfb2',
    inkHex: '#a8221b'
  });
  const elephantStele = new THREE.Mesh(
    new THREE.BoxGeometry(4.2, 2.1, 0.7),
    [rockBaseMat(0x9a968b), rockBaseMat(0x9a968b), rockBaseMat(0x9a968b), rockBaseMat(0x9a968b), elephantSteleMat, elephantSteleMat]
  );
  elephantStele.position.set(4.5, 1.5, 90.5);
  elephantStele.rotation.y = -0.42;
  elephantStele.castShadow = true;
  elephantStele.userData.landmarkId = 'elephant-hill';
  group.add(elephantStele);

  if (physics) {
    physics.addCylinderCollider(10, 86, 12.5, 24);
    physics.addCylinderCollider(18, 86.5, 8.0, 20);
  }

  // 2. 独秀峰 (Solitary Beauty Peak) - Directly north of East-West Alley, inside Jingjiang Palace (0, -58)
  const duxiuPeak = createKarstPeakMesh(11.5, 10.5, 34, 303, {
    domePow: 0.34,
    cliffThreshold: 0.44
  });
  duxiuPeak.position.set(0, 0, -58);
  duxiuPeak.userData.landmarkId = 'jingjiang-palace';
  group.add(duxiuPeak);

  // Famous Cliff Inscription on Solitary Beauty Peak: 桂林山水甲天下!
  const cliffInscriptionMat = createStoneInscriptionMaterial('桂林山水甲天下', {
    vertical: true,
    stoneHex: '#b4afa2',
    inkHex: '#a31e17'
  });
  const cliffTablet = new THREE.Mesh(
    new THREE.BoxGeometry(2.8, 7.6, 0.55),
    [rockBaseMat(0x8c8a82), rockBaseMat(0x8c8a82), rockBaseMat(0x8c8a82), rockBaseMat(0x8c8a82), cliffInscriptionMat, rockBaseMat(0x8c8a82)]
  );
  cliffTablet.position.set(0, 14.5, -46.8);
  cliffTablet.userData.landmarkId = 'jingjiang-palace';
  group.add(cliffTablet);

  if (physics) physics.addCylinderCollider(0, -58, 10.5, 34);

  // Small summit pavilion on Solitary Beauty Peak (独秀亭)
  const duxiuPav = createSummitPavilion(nightGlowMats);
  duxiuPav.position.set(0, 33.4, -58);
  duxiuPav.scale.setScalar(0.75);
  duxiuPav.traverse((c) => (c.userData.landmarkId = 'jingjiang-palace'));
  group.add(duxiuPav);

  // 3. 伏波山 (Fubo Hill) - Real map: SAME latitude as Solitary Beauty Peak, on Li River west bank!
  const fubo = createKarstPeakMesh(12.5, 10.8, 30, 404, {
    domePow: 0.4,
    cliffThreshold: 0.48
  });
  fubo.position.set(34, 0, -58);
  fubo.userData.landmarkId = 'fubo-diecai';
  group.add(fubo);
  if (physics) physics.addCylinderCollider(34, -58, 11.2, 30);

  // 4. 叠彩山 (Diecai Hill) - North of Fubo Hill along Li River west bank
  const diecaiGroup = new THREE.Group();
  const dcMain = createKarstPeakMesh(15.5, 13.0, 39, 505, { domePow: 0.44, cliffThreshold: 0.5 });
  dcMain.position.set(28, 0, -116);
  diecaiGroup.add(dcMain);
  if (physics) physics.addCylinderCollider(28, -116, 13.8, 39);

  const dcSub = createKarstPeakMesh(10.5, 9.5, 27, 506, { domePow: 0.46 });
  dcSub.position.set(13, 0, -110);
  diecaiGroup.add(dcSub);
  if (physics) physics.addCylinderCollider(13, -110, 9.6, 27);

  const nayunPav = createSummitPavilion(nightGlowMats);
  nayunPav.position.set(28, 38.2, -116);
  diecaiGroup.add(nayunPav);

  diecaiGroup.traverse((c) => (c.userData.landmarkId = 'fubo-diecai'));
  group.add(diecaiGroup);

  // 5. 七星公园峰群 (Seven Star Park Peaks on East Bank directly across Jiefang Bridge)
  const sevenStarCoords = [
    [110, -12, 16, 13, 35, 601],
    [132, 8, 19, 15, 42, 602],
    [114, 30, 14, 12, 29, 603],
    [138, 48, 17, 14, 38, 604],
    [100, 52, 11, 10, 24, 605]
  ];
  for (const [x, z, rx, rz, h, seed] of sevenStarCoords) {
    const pk = createKarstPeakMesh(rx, rz, h, seed, { domePow: 0.45 });
    pk.position.set(x, 0, z);
    group.add(pk);
    if (physics) physics.addCylinderCollider(x, z, (rx + rz) * 0.46, h);
  }

  // 6. 穿山 & 塔山 (Chuanshan & Pagoda Hill in Southeast across Li River from Elephant Hill)
  const chuanshan = createKarstPeakMesh(17, 13, 38, 701, { domePow: 0.42, cliffThreshold: 0.5 });
  chuanshan.position.set(106, 0, 96);
  group.add(chuanshan);
  if (physics) physics.addCylinderCollider(106, 96, 14.5, 38);

  const tashan = createKarstPeakMesh(11, 10, 29, 702, { domePow: 0.38 });
  tashan.position.set(85, 0, 106);
  group.add(tashan);
  if (physics) physics.addCylinderCollider(85, 106, 10.0, 29);

  // Summit Shoushan Pagoda on Tashan
  const tashanPagoda = createSummitPavilion(nightGlowMats);
  tashanPagoda.position.set(85, 28.5, 106);
  tashanPagoda.scale.setScalar(0.85);
  group.add(tashanPagoda);

  // 7. 老人山 / 西山峰群 (West Hills)
  const westHills = [
    [-148, -55, 18, 15, 40, 801],
    [-156, -24, 15, 13, 33, 802],
    [-146, 18, 17, 14, 36, 803],
    [-152, 62, 19, 16, 42, 804],
    [-108, -128, 17, 15, 39, 805]
  ];
  for (const [x, z, rx, rz, h, seed] of westHills) {
    const pk = createKarstPeakMesh(rx, rz, h, seed, { domePow: 0.46 });
    pk.position.set(x, 0, z);
    group.add(pk);
    if (physics) physics.addCylinderCollider(x, z, (rx + rz) * 0.46, h);
  }

  // 8. Iconic Outer Ring of Guilin Karst Horizon Peaks (Layered Chinese Ink Landscape Silhouette!)
  const rand = seededRandom(2026);
  const ringConfigs = [
    { count: 28, minR: 168, maxR: 225, minH: 34, maxH: 64, tint: 0.18, noShadow: false },
    { count: 34, minR: 235, maxR: 325, minH: 48, maxH: 92, tint: 0.42, noShadow: true }
  ];

  let seedCounter = 1000;
  for (const ring of ringConfigs) {
    for (let i = 0; i < ring.count; i++) {
      const baseAngle = (i / ring.count) * Math.PI * 2 + (rand() - 0.5) * 0.18;
      const dist = ring.minR + rand() * (ring.maxR - ring.minR);
      const x = Math.cos(baseAngle) * dist;
      const z = Math.sin(baseAngle) * dist;

      // Leave a natural river valley opening along the Li River north & south corridor
      if (Math.abs(x - 45) < 34 && Math.abs(z) > 150) continue;

      const rx = 18 + rand() * 18;
      const rz = 16 + rand() * 16;
      const h = ring.minH + rand() * (ring.maxH - ring.minH);

      const peak = createKarstPeakMesh(rx, rz, h, seedCounter++, {
        radialSegs: 16,
        heightSegs: 11,
        distantTint: ring.tint,
        noShadow: ring.noShadow
      });
      peak.position.set(x, -0.5, z);
      group.add(peak);
    }
  }

  scene.add(group);
  return { group, nightGlowMats };
}
