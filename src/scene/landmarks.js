import * as THREE from 'three';

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
    nightMaterials
  } = options;

  const group = new THREE.Group();

  const stoneMat = new THREE.MeshStandardMaterial({ color: 0xd9d4c7, roughness: 0.72 });
  const bodyMat = new THREE.MeshStandardMaterial({
    color: bodyColor,
    emissive: glowColor,
    emissiveIntensity: 0.0,
    metalness: metalness * 0.6,
    roughness: roughness + 0.12
  });
  const roofMat = new THREE.MeshStandardMaterial({
    color: roofColor,
    emissive: glowColor,
    emissiveIntensity: 0.0,
    metalness,
    roughness
  });
  const glowMat = new THREE.MeshStandardMaterial({
    color: glowColor,
    emissive: glowColor,
    emissiveIntensity: 0.25,
    roughness: 0.25,
    metalness: 0.35
  });
  nightMaterials.push(
    { mat: glowMat, baseEmissive: 0.2, nightEmissive: 2.3 },
    { mat: roofMat, baseEmissive: 0.0, nightEmissive: 0.58 },
    { mat: bodyMat, baseEmissive: 0.0, nightEmissive: 0.38 }
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
    nightMaterials
  });
  sunPagoda.position.set(-11, -0.2, 25);
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
    nightMaterials
  });
  moonPagoda.position.set(-26, -0.2, 27);
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

  const wallMat = new THREE.MeshStandardMaterial({ color: 0x99322c, roughness: 0.82 });
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0xc9c2b4, roughness: 0.78 });
  const roofYellowMat = new THREE.MeshStandardMaterial({ color: 0xd4a238, roughness: 0.48, metalness: 0.18 });
  const roofGreyMat = new THREE.MeshStandardMaterial({ color: 0x454d52, roughness: 0.72 });
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
  const gateBase = new THREE.Mesh(new THREE.BoxGeometry(11.5, 3.8, 4.2), stoneMat);
  gateBase.position.set(0, 1.9, d / 2);
  gateBase.castShadow = true;
  group.add(gateBase);

  const gateHall = new THREE.Mesh(new THREE.BoxGeometry(8.5, 2.8, 3.2), wallMat);
  gateHall.position.set(0, 5.1, d / 2);
  gateHall.castShadow = true;
  group.add(gateHall);

  const gateRoof = new THREE.Mesh(new THREE.ConeGeometry(7.2, 2.5, 4), roofYellowMat);
  gateRoof.rotation.y = Math.PI / 4;
  gateRoof.scale.set(1.2, 1, 0.65);
  gateRoof.position.set(0, 7.6, d / 2);
  gateRoof.castShadow = true;
  group.add(gateRoof);

  // Palace courtyard paving
  const court = new THREE.Mesh(new THREE.PlaneGeometry(w - 2, d - 2), stoneMat);
  court.rotation.x = -Math.PI / 2;
  court.position.y = 0.08;
  court.receiveShadow = true;
  group.add(court);

  // 承运殿 (Main Palace Hall) just south of Solitary Beauty Peak
  const hall = buildTraditionalHall(13, 6.2, 4.0, wallMat, roofYellowMat, lanternMat);
  hall.position.set(0, 0.2, 9.5);
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

  // Sloped hip roof
  const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.max(width, depth) * 0.78, height * 0.78, 4), roofMat);
  roof.rotation.y = Math.PI / 4;
  roof.scale.set(width / Math.max(width, depth) * 1.18, 1, depth / Math.max(width, depth) * 1.18);
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

  const brickMat = new THREE.MeshStandardMaterial({ color: 0x807e78, roughness: 0.88 });
  const timberMat = new THREE.MeshStandardMaterial({ color: 0x7a2b24, roughness: 0.72 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x3b4542, roughness: 0.65 });
  const lanternMat = new THREE.MeshStandardMaterial({
    color: 0xffd27a,
    emissive: 0xff8c24,
    emissiveIntensity: 0.1
  });
  nightMaterials.push({ mat: lanternMat, baseEmissive: 0.1, nightEmissive: 2.1 });

  // Stone city gate tower base
  const base = new THREE.Mesh(new THREE.BoxGeometry(11.0, 3.6, 4.8), brickMat);
  base.position.y = 1.8;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  // Dark arched passage visual
  const archHole = new THREE.Mesh(
    new THREE.CylinderGeometry(1.4, 1.4, 5.0, 12),
    new THREE.MeshStandardMaterial({ color: 0x222326, roughness: 0.95 })
  );
  archHole.rotation.x = Math.PI / 2;
  archHole.position.y = 1.15;
  group.add(archHole);

  // Upper wooden pavilion (古南门城楼)
  const pav = buildTraditionalHall(8.2, 3.4, 2.5, timberMat, roofMat, lanternMat);
  pav.position.y = 3.6;
  group.add(pav);

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

  const whiteWallMat = new THREE.MeshStandardMaterial({ color: 0xe6e0d2, roughness: 0.85 });
  const greyWallMat = new THREE.MeshStandardMaterial({ color: 0xcfc9bc, roughness: 0.85 });
  const tileRoofMat = new THREE.MeshStandardMaterial({ color: 0x3b4046, roughness: 0.75 });
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

  return group;
}

export function createLandmarks(scene) {
  const group = new THREE.Group();
  group.name = 'GuilinLandmarks';

  const nightMaterials = [];
  const pointLights = [];

  group.add(createTwinPagodas(nightMaterials, pointLights));
  group.add(createJingjiangPalace(nightMaterials));
  group.add(createAncientSouthGate(nightMaterials));
  group.add(createHistoricQuarter(nightMaterials));

  scene.add(group);
  return { group, nightMaterials, pointLights };
}
