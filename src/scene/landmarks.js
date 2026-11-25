import * as THREE from 'three';
import {
  createChinesePlaqueMaterial,
  getMaterialsLibrary
} from './materialsLibrary.js';

/**
 * Helper: creates a framed 3D Chinese Calligraphy Plaque (匾额/门牌) with dark wooden backing
 */
function createPlaqueBoard(text, width, height, options = {}, nightMaterials = null) {
  const g = new THREE.Group();
  const faceMat = createChinesePlaqueMaterial(text, options);
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x382014, roughness: 0.7 });

  if (nightMaterials) {
    nightMaterials.push({ mat: faceMat, baseEmissive: 0.18, nightEmissive: 1.55 });
  }

  const board = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, 0.22),
    [woodMat, woodMat, woodMat, woodMat, faceMat, faceMat]
  );
  board.castShadow = true;
  g.add(board);
  return g;
}

/**
 * Helper: builds an ornate Traditional Chinese Paifang Archway (古街牌坊) with gilded plaque
 */
function createPaifangArchway(title, nightMaterials) {
  const g = new THREE.Group();
  const mats = getMaterialsLibrary();

  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0xd8d1c2,
    map: mats.granite.map,
    bumpMap: mats.granite.bumpMap,
    bumpScale: 0.18,
    roughness: 0.72
  });
  const pillarMat = new THREE.MeshStandardMaterial({ color: 0x8f2620, roughness: 0.58 });
  const roofMat = new THREE.MeshStandardMaterial({
    map: mats.roofDark.map,
    bumpMap: mats.roofDark.bumpMap,
    bumpScale: 0.22,
    roughness: 0.48,
    metalness: 0.16
  });
  const beamMat = new THREE.MeshStandardMaterial({
    map: mats.dougongFrieze,
    roughness: 0.52
  });
  const lanternMat = new THREE.MeshStandardMaterial({
    color: 0xffd07a,
    emissive: 0xff6e1a,
    emissiveIntensity: 0.15
  });
  nightMaterials.push({ mat: lanternMat, baseEmissive: 0.15, nightEmissive: 2.3 });

  // 4 Crimson pillars with stone drum bases
  const pillarXs = [-4.2, -2.1, 2.1, 4.2];
  for (const px of pillarXs) {
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.9, 0.75), stoneMat);
    base.position.set(px, 0.45, 0);
    g.add(base);

    const h = Math.abs(px) < 3 ? 5.6 : 4.4;
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.25, h, 10), pillarMat);
    p.position.set(px, h / 2 + 0.4, 0);
    p.castShadow = true;
    g.add(p);
  }

  // Painted dougong crossbeams
  const mainBeam = new THREE.Mesh(new THREE.BoxGeometry(8.8, 0.72, 0.56), beamMat);
  mainBeam.position.set(0, 4.2, 0);
  g.add(mainBeam);

  const topBeam = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.65, 0.56), beamMat);
  topBeam.position.set(0, 5.45, 0);
  g.add(topBeam);

  // Tiered tiled roofs
  const centerRoof = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.42, 1.85), roofMat);
  centerRoof.position.set(0, 6.05, 0);
  centerRoof.castShadow = true;
  g.add(centerRoof);

  for (const sx of [-3.25, 3.25]) {
    const sideRoof = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.35, 1.5), roofMat);
    sideRoof.position.set(sx, 4.78, 0);
    sideRoof.castShadow = true;
    g.add(sideRoof);
  }

  // Iconic gilded calligraphy plaque right in the center!
  const plaque = createPlaqueBoard(
    title,
    3.4,
    1.15,
    { bgHex: '#181110', borderHex: '#ebb84b', textHex: '#ffde73', glowHex: '#ffc247' },
    nightMaterials
  );
  plaque.position.set(0, 5.05, 0.36);
  g.add(plaque);

  // Hanging red palace lanterns
  for (const lx of [-2.1, 2.1]) {
    const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 8), lanternMat);
    lantern.scale.set(1, 1.25, 1);
    lantern.position.set(lx, 3.55, 0.42);
    g.add(lantern);
  }

  return g;
}

/**
 * Builds an ornate multi-tiered octagonal Chinese Pagoda (Sun Pagoda / Moon Pagoda)
 */
function buildOctagonalPagoda(options) {
  const {
    tiers = 9,
    baseRadius = 3.2,
    tierHeight = 2.05,
    bodyColor = 0xdba948,
    roofColor = 0xe8b954,
    glowColor = 0xffb838,
    metalness = 0.65,
    roughness = 0.28,
    isGold = true,
    nightMaterials
  } = options;

  const group = new THREE.Group();
  const mats = getMaterialsLibrary();
  const wallTex = isGold ? mats.pagodaGold : mats.pagodaSilver;
  const roofTex = isGold ? mats.roofGold : mats.roofSilver;

  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0xe6dfd2,
    map: mats.granite.map,
    bumpMap: mats.granite.bumpMap,
    bumpScale: 0.2,
    roughness: 0.72
  });
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: wallTex.map,
    bumpMap: wallTex.bumpMap,
    bumpScale: 0.16,
    emissive: new THREE.Color(0xffffff),
    emissiveMap: wallTex.emissiveMap,
    emissiveIntensity: 0.12,
    metalness: metalness * 0.55,
    roughness: roughness + 0.08
  });
  const roofMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: roofTex.map,
    bumpMap: roofTex.bumpMap,
    bumpScale: 0.24,
    emissive: glowColor,
    emissiveIntensity: 0.0,
    metalness: metalness * 0.85,
    roughness: Math.max(0.18, roughness - 0.04)
  });
  const glowMat = new THREE.MeshStandardMaterial({
    color: glowColor,
    emissive: glowColor,
    emissiveIntensity: 0.25,
    roughness: 0.22,
    metalness: 0.4
  });
  nightMaterials.push(
    { mat: glowMat, baseEmissive: 0.2, nightEmissive: 2.3 },
    { mat: roofMat, baseEmissive: 0.0, nightEmissive: 0.52 },
    { mat: bodyMat, baseEmissive: 0.12, nightEmissive: 1.75 }
  );

  // Stone foundation terrace rising cleanly out of Shan Lake
  const terrace1 = new THREE.Mesh(new THREE.CylinderGeometry(baseRadius * 1.48, baseRadius * 1.62, 1.8, 8), stoneMat);
  terrace1.position.y = 0.4;
  terrace1.castShadow = true;
  terrace1.receiveShadow = true;
  group.add(terrace1);

  const terrace2 = new THREE.Mesh(new THREE.CylinderGeometry(baseRadius * 1.24, baseRadius * 1.32, 0.9, 8), stoneMat);
  terrace2.position.y = 1.65;
  terrace2.receiveShadow = true;
  group.add(terrace2);

  let currentY = 2.1;

  for (let i = 0; i < tiers; i++) {
    const t = i / tiers;
    const scale = 1.0 - t * 0.44;
    const r = baseRadius * scale;
    const h = tierHeight * (1.0 - t * 0.14);

    // Core octagonal story
    const core = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.88, r * 0.92, h * 0.72, 8), bodyMat);
    core.position.y = currentY + h * 0.36;
    core.castShadow = true;
    core.receiveShadow = true;
    group.add(core);

    // Illuminated window band / golden cornice glow
    const windowRing = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.93, r * 0.93, h * 0.22, 8), glowMat);
    windowRing.position.y = currentY + h * 0.42;
    group.add(windowRing);

    // Sweeping upturned octagonal eaves
    const eave = new THREE.Mesh(new THREE.ConeGeometry(r * 1.46, h * 0.44, 8), roofMat);
    eave.position.y = currentY + h * 0.85;
    eave.castShadow = true;
    group.add(eave);

    // Luminous under-eave rim (gives Guilin Twin Pagodas their signature night outline!)
    const rim = new THREE.Mesh(new THREE.TorusGeometry(r * 1.18, 0.09, 6, 8), glowMat);
    rim.rotation.x = Math.PI / 2;
    rim.rotation.z = Math.PI / 8;
    rim.position.y = currentY + h * 0.68;
    group.add(rim);

    currentY += h * 0.92;
  }

  // Ornate pinnacle spire (塔刹)
  const cap = new THREE.Mesh(new THREE.ConeGeometry(baseRadius * 0.45, 2.2, 8), roofMat);
  cap.position.y = currentY + 0.9;
  group.add(cap);

  const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.22, 3.2, 8), glowMat);
  spire.position.y = currentY + 3.0;
  group.add(spire);

  const orb = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 10), glowMat);
  orb.position.y = currentY + 4.55;
  group.add(orb);

  return group;
}

/**
 * 1. 日月双塔 (Sun & Moon Twin Pagodas) in Shan Lake
 */
function createTwinPagodas(nightMaterials, pointLights) {
  const group = new THREE.Group();
  group.name = 'SunMoonTwinPagodas';

  // 日塔 (Sun Pagoda - 9 tiers, radiant bronze-gold) at (-11, 25)
  const sunPagoda = buildOctagonalPagoda({
    tiers: 9,
    baseRadius: 3.15,
    tierHeight: 2.25,
    bodyColor: 0xc99335,
    roofColor: 0xe6b54c,
    glowColor: 0xffc64d,
    metalness: 0.72,
    roughness: 0.24,
    isGold: true,
    nightMaterials
  });
  sunPagoda.position.set(-11, -0.2, 25);
  const sunPlaque = createPlaqueBoard(
    '日塔',
    2.1,
    0.95,
    { bgHex: '#331d07', borderHex: '#f7cf68', textHex: '#ffe48a', glowHex: '#ffc84d' },
    nightMaterials
  );
  sunPlaque.position.set(0, 4.15, 3.25);
  sunPagoda.add(sunPlaque);
  group.add(sunPagoda);

  // 月塔 (Moon Pagoda - 7 tiers, luminous glazed silver-blue) at (-26, 27)
  const moonPagoda = buildOctagonalPagoda({
    tiers: 7,
    baseRadius: 2.65,
    tierHeight: 2.1,
    bodyColor: 0x9cb3c9,
    roofColor: 0x7a9bb8,
    glowColor: 0x7cd8ff,
    metalness: 0.45,
    roughness: 0.26,
    isGold: false,
    nightMaterials
  });
  moonPagoda.position.set(-26, -0.2, 27);
  const moonPlaque = createPlaqueBoard(
    '月塔',
    1.85,
    0.85,
    { bgHex: '#102536', borderHex: '#9be0ff', textHex: '#d8f4ff', glowHex: '#6bd4ff' },
    nightMaterials
  );
  moonPlaque.position.set(0, 3.9, 2.75);
  moonPagoda.add(moonPlaque);
  group.add(moonPagoda);

  // Subtle glowing underwater/surface glass link path between Sun & Moon Pagodas
  const linkMat = new THREE.MeshStandardMaterial({
    color: 0xaeeeff,
    emissive: 0x4bc8ff,
    emissiveIntensity: 0.15,
    transparent: true,
    opacity: 0.65
  });
  nightMaterials.push({ mat: linkMat, baseEmissive: 0.1, nightEmissive: 1.4 });
  const linkCurve = new THREE.LineCurve3(new THREE.Vector3(-11, 0.05, 25), new THREE.Vector3(-26, 0.05, 27));
  const linkGeo = new THREE.TubeGeometry(linkCurve, 12, 0.75, 6, false);
  linkGeo.scale(1, 0.25, 1);
  const linkMesh = new THREE.Mesh(linkGeo, linkMat);
  group.add(linkMesh);

  // Point lights for dramatic night reflection on Shan Lake
  const sunLight = new THREE.PointLight(0xffb845, 0, 58, 1.5);
  sunLight.position.set(-11, 13, 25);
  group.add(sunLight);
  pointLights.push({ light: sunLight, nightIntensity: 55 });

  const moonLight = new THREE.PointLight(0x6bd0ff, 0, 52, 1.5);
  moonLight.position.set(-26, 11, 27);
  group.add(moonLight);
  pointLights.push({ light: moonLight, nightIntensity: 45 });

  group.traverse((c) => {
    c.userData.landmarkId = 'twin-pagodas';
  });

  return group;
}

/**
 * 2. 靖江王府 (Jingjiang Princes' Palace) surrounding Solitary Beauty Peak (-32, -48)
 */
function createJingjiangPalace(nightMaterials) {
  const group = new THREE.Group();
  group.name = 'JingjiangPalace';
  group.position.set(-32, 0.4, -46);

  const mats = getMaterialsLibrary();
  const wallMat = new THREE.MeshStandardMaterial({
    map: mats.palaceWall.map,
    bumpMap: mats.palaceWall.bumpMap,
    bumpScale: 0.16,
    roughness: 0.78
  });
  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0xd8d1c2,
    map: mats.granite.map,
    bumpMap: mats.granite.bumpMap,
    bumpScale: 0.18,
    roughness: 0.75
  });
  const roofYellowMat = new THREE.MeshStandardMaterial({
    map: mats.roofGold.map,
    bumpMap: mats.roofGold.bumpMap,
    bumpScale: 0.22,
    roughness: 0.36,
    metalness: 0.32
  });
  const roofGreyMat = new THREE.MeshStandardMaterial({
    map: mats.roofDark.map,
    bumpMap: mats.roofDark.bumpMap,
    bumpScale: 0.2,
    roughness: 0.56,
    metalness: 0.12
  });
  const lanternMat = new THREE.MeshStandardMaterial({
    color: 0xffd080,
    emissive: 0xff7a22,
    emissiveIntensity: 0.1
  });
  nightMaterials.push({ mat: lanternMat, baseEmissive: 0.08, nightEmissive: 2.2 });

  // Outer crimson palace enclosure wall (38 x 38)
  const w = 38;
  const d = 36;
  const wallH = 3.2;

  // North, West, East walls
  const northWall = new THREE.Mesh(new THREE.BoxGeometry(w, wallH, 1.2), wallMat);
  northWall.position.set(0, wallH / 2, -d / 2);
  northWall.castShadow = true;
  northWall.receiveShadow = true;
  group.add(northWall);

  const westWall = new THREE.Mesh(new THREE.BoxGeometry(1.2, wallH, d), wallMat);
  westWall.position.set(-w / 2, wallH / 2, 0);
  westWall.castShadow = true;
  group.add(westWall);

  const eastWall = new THREE.Mesh(new THREE.BoxGeometry(1.2, wallH, d), wallMat);
  eastWall.position.set(w / 2, wallH / 2, 0);
  eastWall.castShadow = true;
  group.add(eastWall);

  // South wall split for 承运门 (Chengyun Gate)
  for (const sx of [-12.5, 12.5]) {
    const seg = new THREE.Mesh(new THREE.BoxGeometry(13, wallH, 1.2), wallMat);
    seg.position.set(sx, wallH / 2, d / 2);
    seg.castShadow = true;
    group.add(seg);
  }

  // 承运门 (Chengyun Grand Gatehouse) at south entrance (z = +18)
  const gateBase = new THREE.Mesh(new THREE.BoxGeometry(12.2, 3.8, 4.4), stoneMat);
  gateBase.position.set(0, 1.9, d / 2);
  gateBase.castShadow = true;
  group.add(gateBase);

  // Recessed imperial arched gateway passage
  const archVoid = new THREE.Mesh(
    new THREE.CylinderGeometry(1.55, 1.55, 4.65, 16),
    new THREE.MeshStandardMaterial({ color: 0x1d1614, roughness: 0.95 })
  );
  archVoid.rotation.x = Math.PI / 2;
  archVoid.position.set(0, 1.35, d / 2);
  group.add(archVoid);

  // Ornate stone arch trim ring
  const archTrim = new THREE.Mesh(
    new THREE.TorusGeometry(1.62, 0.16, 8, 18, Math.PI),
    stoneMat
  );
  archTrim.position.set(0, 1.35, d / 2 + 2.22);
  group.add(archTrim);

  // Upper palace gatehouse hall + painted dougong frieze + crimson pillars
  const gateHall = new THREE.Mesh(new THREE.BoxGeometry(9.2, 2.9, 3.4), wallMat);
  gateHall.position.set(0, 5.25, d / 2);
  gateHall.castShadow = true;
  group.add(gateHall);

  const friezeMat = new THREE.MeshStandardMaterial({ map: mats.dougongFrieze, roughness: 0.5 });
  const gateFrieze = new THREE.Mesh(new THREE.BoxGeometry(9.5, 0.58, 3.65), friezeMat);
  gateFrieze.position.set(0, 6.48, d / 2);
  group.add(gateFrieze);

  const pillarMat = new THREE.MeshStandardMaterial({ color: 0x991e1a, roughness: 0.55 });
  for (const px of [-4.2, -2.1, 2.1, 4.2]) {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 2.75, 8), pillarMat);
    col.position.set(px, 5.15, d / 2 + 1.85);
    group.add(col);
  }

  const gateRoofGeo = new THREE.ConeGeometry(7.6, 2.7, 4);
  gateRoofGeo.rotateY(Math.PI / 4);
  const gateRoof = new THREE.Mesh(gateRoofGeo, roofYellowMat);
  gateRoof.scale.set(1.02, 1, 0.48);
  gateRoof.position.set(0, 8.05, d / 2);
  gateRoof.castShadow = true;
  group.add(gateRoof);

  // Iconic Imperial Plaques on Jingjiang Princes' City:
  // 1) Grand upper plaque: 靖江王府 (gold calligraphy on royal blue-black lacquer)
  const palacePlaque = createPlaqueBoard(
    '靖江王府',
    4.6,
    1.45,
    { bgHex: '#132436', borderHex: '#f5c756', textHex: '#ffe078', glowHex: '#ffc645' },
    nightMaterials
  );
  palacePlaque.position.set(0, 6.05, d / 2 + 2.02);
  group.add(palacePlaque);

  // 2) Archway stone-framed plaque right above the gate tunnel: 承運門
  const chengyunPlaque = createPlaqueBoard(
    '承運門',
    3.0,
    1.0,
    { bgHex: '#4a1512', borderHex: '#e6b84c', textHex: '#ffd86b', glowHex: '#ffbe42' },
    nightMaterials
  );
  chengyunPlaque.position.set(0, 3.45, d / 2 + 2.32);
  group.add(chengyunPlaque);

  // Pair of sculpted granite guardian lions (石狮) flanking Chengyun Gate
  for (const sx of [-4.4, 4.4]) {
    const lionPed = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.9, 1.3), stoneMat);
    lionPed.position.set(sx, 0.45, d / 2 + 3.4);
    lionPed.castShadow = true;
    group.add(lionPed);

    const lionBody = new THREE.Mesh(new THREE.DodecahedronGeometry(0.55, 1), stoneMat);
    lionBody.position.set(sx, 1.25, d / 2 + 3.4);
    lionBody.scale.set(0.85, 1.15, 1.1);
    group.add(lionBody);
  }

  // Yellow glazed coping tiles along the top of the crimson palace walls
  const northCap = new THREE.Mesh(new THREE.BoxGeometry(w + 0.4, 0.36, 1.5), roofYellowMat);
  northCap.position.set(0, wallH + 0.18, -d / 2);
  group.add(northCap);
  for (const sx of [-w / 2, w / 2]) {
    const sideCap = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.36, d + 0.4), roofYellowMat);
    sideCap.position.set(sx, wallH + 0.18, 0);
    group.add(sideCap);
  }

  // Palace courtyard paving
  const court = new THREE.Mesh(new THREE.PlaneGeometry(w - 2, d - 2), stoneMat);
  court.rotation.x = -Math.PI / 2;
  court.position.y = 0.08;
  court.receiveShadow = true;
  group.add(court);

  // 承运殿 (Main Palace Hall) just south of Solitary Beauty Peak with plaque 承運殿
  const hall = buildTraditionalHall(13, 6.2, 4.2, wallMat, roofYellowMat, lanternMat);
  hall.position.set(0, 0.2, 9.5);
  const hallPlaque = createPlaqueBoard(
    '承運殿',
    3.6,
    1.15,
    { bgHex: '#1a1210', borderHex: '#f5c756', textHex: '#ffe078', glowHex: '#ffc645' },
    nightMaterials
  );
  hallPlaque.position.set(0, 3.65, 3.28);
  hall.add(hallPlaque);
  group.add(hall);

  // Side East & West Wing Pavilions
  for (const side of [-12.5, 12.5]) {
    const wing = buildTraditionalHall(4.2, 11.0, 2.8, wallMat, roofGreyMat, lanternMat);
    wing.position.set(side, 0.1, 4.0);
    group.add(wing);
  }

  // Warm lanterns flanking Chengyun Gate
  for (const lx of [-4.2, -1.6, 1.6, 4.2]) {
    const l = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 8), lanternMat);
    l.position.set(lx, 4.1, d / 2 + 2.2);
    group.add(l);
  }

  group.traverse((c) => {
    c.userData.landmarkId = 'jingjiang-palace';
  });

  return group;
}

function buildTraditionalHall(width, depth, height, wallMat, roofMat, lanternMat) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), wallMat);
  body.position.y = height / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  g.add(body);

  // Sloped hip roof (rotate geometry BEFORE non-uniform scale so roof stays perfectly symmetric!)
  const roofGeo = new THREE.ConeGeometry(Math.max(width, depth) * 0.78, height * 0.78, 4);
  roofGeo.rotateY(Math.PI / 4);
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.scale.set((width / Math.max(width, depth)) * 1.12, 1, (depth / Math.max(width, depth)) * 1.12);
  roof.position.y = height + height * 0.34;
  roof.castShadow = true;
  g.add(roof);

  // Glowing cornice strip
  if (lanternMat) {
    const glow = new THREE.Mesh(new THREE.BoxGeometry(width * 0.82, 0.35, depth + 0.12), lanternMat);
    glow.position.y = height * 0.72;
    g.add(glow);
  }
  return g;
}

/**
 * 3. 古南门 (Ancient South Gate) & Giant Ancient Banyan on north shore of Rong Lake (-78, 3.8)
 */
function createAncientSouthGate(nightMaterials) {
  const group = new THREE.Group();
  group.name = 'AncientSouthGate';
  group.position.set(-78, 0.3, 4.2);

  const mats = getMaterialsLibrary();
  const brickMat = new THREE.MeshStandardMaterial({
    color: 0x9e9c94,
    map: mats.darkStone.map,
    bumpMap: mats.darkStone.bumpMap,
    bumpScale: 0.22,
    roughness: 0.84
  });
  const timberMat = new THREE.MeshStandardMaterial({
    map: mats.palaceWall.map,
    bumpMap: mats.palaceWall.bumpMap,
    bumpScale: 0.14,
    roughness: 0.7
  });
  const roofMat = new THREE.MeshStandardMaterial({
    map: mats.roofDark.map,
    bumpMap: mats.roofDark.bumpMap,
    bumpScale: 0.2,
    roughness: 0.55,
    metalness: 0.12
  });
  const lanternMat = new THREE.MeshStandardMaterial({
    color: 0xffd27a,
    emissive: 0xff8c24,
    emissiveIntensity: 0.1
  });
  nightMaterials.push({ mat: lanternMat, baseEmissive: 0.1, nightEmissive: 2.1 });

  // Stone city gate tower base with ancient brick battlements (城垛)
  const base = new THREE.Mesh(new THREE.BoxGeometry(12.2, 3.8, 5.2), brickMat);
  base.position.y = 1.9;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  // Battlement crenellations along top rim of the Tang-dynasty stone wall
  for (let bx = -5.4; bx <= 5.4; bx += 1.35) {
    for (const bz of [-2.4, 2.4]) {
      const merlon = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.65, 0.42), brickMat);
      merlon.position.set(bx, 4.1, bz);
      merlon.castShadow = true;
      group.add(merlon);
    }
  }

  // Dark arched passage visual + carved stone arch voussoir ring on both north & south faces
  const archHole = new THREE.Mesh(
    new THREE.CylinderGeometry(1.55, 1.55, 5.4, 16),
    new THREE.MeshStandardMaterial({ color: 0x1b1c1f, roughness: 0.95 })
  );
  archHole.rotation.x = Math.PI / 2;
  archHole.position.y = 1.25;
  group.add(archHole);

  const stoneTrimMat = new THREE.MeshStandardMaterial({
    color: 0xd0c9ba,
    map: mats.granite.map,
    bumpMap: mats.granite.bumpMap,
    bumpScale: 0.16,
    roughness: 0.78
  });
  for (const az of [-2.62, 2.62]) {
    const archTrim = new THREE.Mesh(new THREE.TorusGeometry(1.62, 0.18, 8, 18, Math.PI), stoneTrimMat);
    archTrim.position.set(0, 1.25, az);
    group.add(archTrim);
  }

  // Upper wooden pavilion (古南门城楼) with crimson colonnade pillars & dougong frieze
  const pav = buildTraditionalHall(8.6, 3.6, 2.7, timberMat, roofMat, lanternMat);
  pav.position.y = 3.8;
  group.add(pav);

  const friezeMat = new THREE.MeshStandardMaterial({ map: mats.dougongFrieze, roughness: 0.5 });
  const pavFrieze = new THREE.Mesh(new THREE.BoxGeometry(8.9, 0.48, 3.85), friezeMat);
  pavFrieze.position.y = 6.32;
  group.add(pavFrieze);

  const colMat = new THREE.MeshStandardMaterial({ color: 0x8e241f, roughness: 0.58 });
  for (const cx of [-3.8, -1.9, 1.9, 3.8]) {
    for (const cz of [-1.85, 1.85]) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 2.6, 8), colMat);
      col.position.set(cx, 5.1, cz);
      group.add(col);
    }
  }

  // Iconic Plaques on BOTH South (Rong Lake) & North (Street) faces: 古南門 (Guo Moruo style gold calligraphy!)
  for (const side of [1, -1]) {
    // Upper tower plaque
    const towerPlaque = createPlaqueBoard(
      '古南門',
      3.5,
      1.25,
      { bgHex: '#1b1411', borderHex: '#ebb84b', textHex: '#ffde73', glowHex: '#ffc447' },
      nightMaterials
    );
    towerPlaque.position.set(0, 6.05, side * 2.02);
    if (side === -1) towerPlaque.rotation.y = Math.PI;
    group.add(towerPlaque);

    // Stone arch plaque right above the tunnel
    const archPlaque = createPlaqueBoard(
      '古南門',
      2.6,
      0.92,
      { bgHex: '#4f1914', borderHex: '#e6b84c', textHex: '#ffd86b', glowHex: '#ffbe42' },
      nightMaterials
    );
    archPlaque.position.set(0, 3.35, side * 2.72);
    if (side === -1) archPlaque.rotation.y = Math.PI;
    group.add(archPlaque);

    // Hanging red palace lanterns flanking the archway
    for (const lx of [-2.4, 2.4]) {
      const l = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 8), lanternMat);
      l.scale.set(1, 1.25, 1);
      l.position.set(lx, 3.15, side * 2.78);
      group.add(l);
    }
  }

  // Iconic 800-year-old Giant Banyan Tree (古榕树) beside Ancient South Gate!
  const banyan = new THREE.Group();
  banyan.position.set(8.6, 0, 1.2);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c4734, roughness: 0.92 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x2e6433, roughness: 0.85 });

  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 1.25, 3.8, 8), trunkMat);
  trunk.position.y = 1.9;
  trunk.castShadow = true;
  banyan.add(trunk);

  const canopyOffsets = [
    [0, 5.0, 0, 4.2],
    [-2.4, 4.3, 1.2, 2.8],
    [2.5, 4.5, -0.9, 2.9],
    [0.4, 4.2, 2.2, 2.6],
    [-1.4, 4.4, -2.0, 2.5]
  ];
  for (const [cx, cy, cz, cr] of canopyOffsets) {
    const puff = new THREE.Mesh(new THREE.DodecahedronGeometry(cr, 1), leafMat);
    puff.position.set(cx, cy, cz);
    puff.scale.set(1.15, 0.72, 1.15);
    puff.castShadow = true;
    banyan.add(puff);
  }
  group.add(banyan);

  // Scenic pavilion on Rong Lake Central Island (-76, 28) -> relative (+2, +23.8)
  const islandPav = buildTraditionalHall(4.6, 4.6, 2.4, timberMat, roofMat, lanternMat);
  islandPav.position.set(2.0, 0.2, 23.8);
  group.add(islandPav);

  group.traverse((c) => {
    c.userData.landmarkId = 'ronghu-gate';
  });

  return group;
}

/**
 * 4. 东西巷 & 正阳步行街 (East-West Alley & Zhengyang Historic Quarter)
 * Authentic Lingnan/Guangxi dark grey sloped tiles, white walls, warm red/amber street lanterns.
 */
function createHistoricQuarter(nightMaterials) {
  const group = new THREE.Group();
  group.name = 'EastWestAlley';

  const mats = getMaterialsLibrary();
  const whiteWallMat = new THREE.MeshStandardMaterial({
    color: 0xf4f0e6,
    map: mats.lingnanWall.map,
    bumpMap: mats.lingnanWall.bumpMap,
    bumpScale: 0.15,
    roughness: 0.8
  });
  const greyWallMat = new THREE.MeshStandardMaterial({
    color: 0xdcd6c8,
    map: mats.lingnanWall.map,
    bumpMap: mats.lingnanWall.bumpMap,
    bumpScale: 0.15,
    roughness: 0.82
  });
  const tileRoofMat = new THREE.MeshStandardMaterial({
    map: mats.roofDark.map,
    bumpMap: mats.roofDark.bumpMap,
    bumpScale: 0.22,
    roughness: 0.54,
    metalness: 0.12
  });
  const lanternMat = new THREE.MeshStandardMaterial({
    color: 0xffc66e,
    emissive: 0xff6e1a,
    emissiveIntensity: 0.12
  });
  nightMaterials.push({ mat: lanternMat, baseEmissive: 0.1, nightEmissive: 2.4 });

  // Cluster A: 东西巷 (East of Jingjiang Palace, x in [-9, +10], z in [-52, -31])
  const alleyPlots = [
    [-6, -48, 6.2, 4.6, 3.2],
    [2.5, -48, 6.6, 4.8, 3.6],
    [-6, -39, 6.4, 4.5, 3.4],
    [2.5, -39, 6.8, 5.2, 3.8],
    [9.5, -43, 4.8, 7.5, 3.1],
    // Cluster B: 正阳步行街 (South of Jiefang Rd, x in [-12, +10], z in [-18, -3])
    [-9, -15, 5.8, 4.8, 3.8],
    [-1, -15, 6.2, 4.8, 4.2],
    [7, -15, 5.6, 5.0, 3.5],
    [-9, -7, 6.0, 4.8, 3.4],
    [-1, -7, 6.5, 4.6, 3.9],
    [7, -7, 5.6, 4.8, 3.2]
  ];

  alleyPlots.forEach(([x, z, w, d, h], idx) => {
    const hall = buildTraditionalHall(
      w,
      d,
      h,
      idx % 2 === 0 ? whiteWallMat : greyWallMat,
      tileRoofMat,
      lanternMat
    );
    hall.position.set(x, 0.4, z);
    group.add(hall);
  });

  // Hanging street lanterns along East-West Alley & Zhengyang Pedestrian Street
  const lanternGeo = new THREE.SphereGeometry(0.28, 7, 7);
  for (let z = -50; z <= -6; z += 4.5) {
    if (Math.abs(z - (-25)) < 6) continue;
    for (const x of [-4.5, 3.2]) {
      const l = new THREE.Mesh(lanternGeo, lanternMat);
      l.position.set(x, 3.3, z);
      group.add(l);
    }
  }

  // Iconic Paifang Archways at East-West Alley (東西巷) & Zhengyang Pedestrian Street (正陽步行街)!
  const eastWestArch = createPaifangArchway('東西巷', nightMaterials);
  eastWestArch.position.set(-1.5, 0.4, -30.5);
  group.add(eastWestArch);

  const zhengyangArch = createPaifangArchway('正陽步行街', nightMaterials);
  zhengyangArch.position.set(-1.5, 0.4, -20.0);
  group.add(zhengyangArch);

  return group;
}

export function createLandmarks(scene, physics = null) {
  const group = new THREE.Group();
  group.name = 'GuilinLandmarks';

  const nightMaterials = [];
  const pointLights = [];

  group.add(createTwinPagodas(nightMaterials, pointLights));
  group.add(createJingjiangPalace(nightMaterials));
  group.add(createAncientSouthGate(nightMaterials));
  group.add(createHistoricQuarter(nightMaterials));

  // Register solid physics colliders for palace walls, gates, and historic buildings
  if (physics) {
    // Jingjiang Palace enclosure walls & halls (-32, -46)
    physics.addBoxCollider(-32, 2.5, -64, 38, 5, 1.4); // North wall
    physics.addBoxCollider(-51, 2.5, -46, 1.4, 5, 36); // West wall
    physics.addBoxCollider(-13, 2.5, -46, 1.4, 5, 36); // East wall
    physics.addBoxCollider(-44.5, 2.5, -28, 13, 5, 1.4); // South-west wall
    physics.addBoxCollider(-19.5, 2.5, -28, 13, 5, 1.4); // South-east wall
    physics.addBoxCollider(-32, 3.0, -28, 11.5, 6, 4.2); // Chengyun Gate
    physics.addBoxCollider(-32, 2.5, -36.5, 13, 5, 6.2); // Main hall
    physics.addBoxCollider(-44.5, 2.0, -42, 4.2, 4, 11); // West wing
    physics.addBoxCollider(-19.5, 2.0, -42, 4.2, 4, 11); // East wing

    // Ancient South Gate (-78, 4.2) & Banyan Tree
    physics.addBoxCollider(-78, 2.5, 4.2, 11, 5, 4.8);
    physics.addCylinderCollider(-69.4, 5.4, 2.0, 6);

    // East-West Alley & Zhengyang Pedestrian Street buildings
    const alleyBoxes = [
      [-6, -48, 6.2, 4.6], [2.5, -48, 6.6, 4.8], [-6, -39, 6.4, 4.5],
      [2.5, -39, 6.8, 5.2], [9.5, -43, 4.8, 7.5],
      [-9, -15, 5.8, 4.8], [-1, -15, 6.2, 4.8], [7, -15, 5.6, 5.0],
      [-9, -7, 6.0, 4.8], [-1, -7, 6.5, 4.6], [7, -7, 5.6, 4.8]
    ];
    for (const [bx, bz, bw, bd] of alleyBoxes) {
      physics.addBoxCollider(bx, 3.0, bz, bw, 6, bd);
    }
  }

  scene.add(group);
  return { group, nightMaterials, pointLights };
}
