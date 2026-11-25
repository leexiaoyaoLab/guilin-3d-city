import * as THREE from 'three';
import { getMaterialsLibrary } from '../scene/materialsLibrary.js';
import {
  createChineseSignboard,
  createDetailedLantern,
  createDistantKarstRing,
  createOsmanthusTree,
  createStoneLantern,
  createStoneLion,
  createWalkingTourist,
  createZoneWaterMesh
} from './zoneUtils.js';

/**
 * 区域副本 1：东西巷 · 逍遥楼历史街区 (1:1 高精人文古街)
 * - 青石板古街、东西巷大牌坊、12栋马头墙岭南骑楼商铺
 * - 桂林米粉热气摊位、茶座、28盏迎风轻摆红灯笼、巡游游客
 * - 东端正阳门古城墙与三层金顶逍遥楼、远眺漓江与喀斯特群峰
 */
export function buildEastWestAlleyZone() {
  const group = new THREE.Group();
  group.name = 'Zone_EastWestAlley';
  const glowMats = [];
  const swayingLanterns = [];
  const steamPuffs = [];
  const walkers = [];

  const mats = getMaterialsLibrary();

  // 1. Base ground + Bluestone flagstone ancient alley (青石板古街)
  const earthMat = new THREE.MeshStandardMaterial({
    color: 0x3f5d42,
    map: mats.terrainDetail.map,
    roughness: 0.94
  });
  const baseGround = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), earthMat);
  baseGround.rotation.x = -Math.PI / 2;
  baseGround.position.y = -0.12;
  baseGround.receiveShadow = true;
  group.add(baseGround);

  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0x8e9296,
    map: mats.granite.map,
    bumpMap: mats.granite.bumpMap,
    bumpScale: 0.18,
    roughness: 0.82
  });

  // Main alley bluestone pavement (West X = -42 to East X = 32, Width = 14m)
  const alleyRoad = new THREE.Mesh(new THREE.BoxGeometry(82, 0.24, 14.4), stoneMat);
  alleyRoad.position.set(-4, 0, 0);
  alleyRoad.receiveShadow = true;
  group.add(alleyRoad);

  // Subtle decorative central flagstone runner & side drainage kerbs
  const kerbMat = new THREE.MeshStandardMaterial({ color: 0xb6b2a6, roughness: 0.78 });
  const centerStrip = new THREE.Mesh(new THREE.BoxGeometry(78, 0.26, 2.2), kerbMat);
  centerStrip.position.set(-4, 0.01, 0);
  centerStrip.receiveShadow = true;
  group.add(centerStrip);

  for (const sz of [-6.8, 6.8]) {
    const kerb = new THREE.Mesh(new THREE.BoxGeometry(80, 0.34, 0.55), kerbMat);
    kerb.position.set(-4, 0.05, sz);
    kerb.receiveShadow = true;
    group.add(kerb);
  }

  // 2. Grand 東西巷 Ceremonial Archway (牌坊) at West Entrance (X = -35)
  const archway = new THREE.Group();
  archway.position.set(-35, 0.12, 0);

  const redPillarMat = new THREE.MeshStandardMaterial({ color: 0x9b241d, roughness: 0.55 });
  const darkRoofMat = new THREE.MeshStandardMaterial({
    map: mats.roofDark.map,
    bumpMap: mats.roofDark.bumpMap,
    bumpScale: 0.2,
    roughness: 0.52,
    metalness: 0.16
  });
  const friezeMat = new THREE.MeshStandardMaterial({ map: mats.dougongFrieze, roughness: 0.5 });

  for (const pz of [-5.2, -2.5, 2.5, 5.2]) {
    const drum = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.9, 0.85), kerbMat);
    drum.position.set(0, 0.45, pz);
    drum.castShadow = true;
    archway.add(drum);

    const h = Math.abs(pz) < 3 ? 6.6 : 5.2;
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, h, 10), redPillarMat);
    pillar.position.set(0, 0.9 + h / 2, pz);
    pillar.castShadow = true;
    archway.add(pillar);
  }

  // Painted lintels & upturned roofs
  const mainBeam = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.05, 5.6), friezeMat);
  mainBeam.position.set(0, 7.3, 0);
  archway.add(mainBeam);

  const mainRoofGeo = new THREE.ConeGeometry(4.6, 1.85, 4);
  mainRoofGeo.rotateY(Math.PI / 4);
  const mainRoof = new THREE.Mesh(mainRoofGeo, darkRoofMat);
  mainRoof.scale.set(0.45, 1.0, 1.15);
  mainRoof.position.set(0, 8.75, 0);
  mainRoof.castShadow = true;
  archway.add(mainRoof);

  for (const sz of [-3.85, 3.85]) {
    const sideBeam = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.78, 3.1), friezeMat);
    sideBeam.position.set(0, 5.9, sz);
    archway.add(sideBeam);

    const sideRoofGeo = new THREE.ConeGeometry(2.6, 1.35, 4);
    sideRoofGeo.rotateY(Math.PI / 4);
    const sideRoof = new THREE.Mesh(sideRoofGeo, darkRoofMat);
    sideRoof.scale.set(0.45, 1.0, 1.08);
    sideRoof.position.set(0, 7.05, sz);
    sideRoof.castShadow = true;
    archway.add(sideRoof);
  }

  const alleyPlaque = createChineseSignboard(
    '東西巷',
    3.6,
    1.15,
    { bgHex: '#152536', borderHex: '#f5c756', textHex: '#ffe078', glowHex: '#ffb938' },
    glowMats
  );
  alleyPlaque.rotation.y = -Math.PI / 2;
  alleyPlaque.position.set(-0.52, 7.25, 0);
  archway.add(alleyPlaque);

  const alleyPlaqueEast = alleyPlaque.clone();
  alleyPlaqueEast.rotation.y = Math.PI / 2;
  alleyPlaqueEast.position.set(0.52, 7.25, 0);
  archway.add(alleyPlaqueEast);

  // Pair of guardian stone lions flanking the archway
  const lionN = createStoneLion(1.0);
  lionN.position.set(-37.2, 0.12, -4.4);
  lionN.rotation.y = -Math.PI / 2;
  group.add(lionN);

  const lionS = createStoneLion(1.0);
  lionS.position.set(-37.2, 0.12, 4.4);
  lionS.rotation.y = -Math.PI / 2;
  group.add(lionS);

  group.add(archway);

  // 3. 12 Detailed Two-Story Lingnan Grey-Brick Shophouses (岭南青砖马头墙骑楼)
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0xe6e1d5,
    map: mats.lingnanWall.map,
    bumpMap: mats.lingnanWall.bumpMap,
    bumpScale: 0.25,
    roughness: 0.85
  });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x4d2c1b, roughness: 0.72 });
  const warmWinMat = new THREE.MeshStandardMaterial({
    color: 0xffe4aa,
    emissive: 0xffa73b,
    emissiveIntensity: 0.28,
    roughness: 0.35
  });
  glowMats.push({ mat: warmWinMat, base: 0.22, night: 1.9 });

  const shopNamesNorth = [
    '老东江桂林米粉',
    '漓江禅茶馆',
    '桂花糕非遗坊',
    '状元及第书局',
    '山水文创集',
    '靖江古玩阁'
  ];
  const shopNamesSouth = [
    '阳朔啤酒鱼',
    '恭城油茶坊',
    '桂林三花酒庄',
    '岭南绣艺馆',
    '漓江画院',
    '逍遥茗茶楼'
  ];

  function createLingnanShophouse(name, facingSouth, idx) {
    const house = new THREE.Group();
    const w = 9.2;
    const h = 7.4 + (idx % 2) * 0.9;
    const d = 8.4;

    // Ground floor recessed storefront + colonnade veranda
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
    body.position.set(0, h / 2, 0);
    body.castShadow = true;
    body.receiveShadow = true;
    house.add(body);

    const frontZ = facingSouth ? d / 2 : -d / 2;
    const dir = facingSouth ? 1 : -1;

    // Wooden shopfront arcade pillars & glowing lattice doors
    for (const px of [-3.8, -1.3, 1.3, 3.8]) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 3.4, 8), woodMat);
      col.position.set(px, 1.7, frontZ + dir * 0.95);
      col.castShadow = true;
      house.add(col);
    }

    // First-floor overhang eave (骑楼挑檐)
    const eave = new THREE.Mesh(new THREE.BoxGeometry(w + 0.4, 0.25, 1.5), darkRoofMat);
    eave.position.set(0, 3.55, frontZ + dir * 0.65);
    eave.rotation.x = dir * 0.22;
    eave.castShadow = true;
    house.add(eave);

    // Glowing shop windows (1F & 2F)
    for (const wx of [-2.5, 0, 2.5]) {
      const win1 = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 2.2), warmWinMat);
      win1.position.set(wx, 1.55, frontZ + dir * 0.04);
      if (!facingSouth) win1.rotation.y = Math.PI;
      house.add(win1);

      const win2 = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.7), warmWinMat);
      win2.position.set(wx, 5.1, frontZ + dir * 0.04);
      if (!facingSouth) win2.rotation.y = Math.PI;
      house.add(win2);
    }

    // Second-floor carved wooden balcony railing (美人靠木栏)
    const rail = new THREE.Mesh(new THREE.BoxGeometry(w - 0.5, 0.72, 0.14), woodMat);
    rail.position.set(0, 4.1, frontZ + dir * 0.45);
    house.add(rail);

    // Classic Lingnan pitched tile roof + stepped horse-head gable walls (马头墙)
    const roofGeo = new THREE.ConeGeometry(w * 0.78, 2.6, 4);
    roofGeo.rotateY(Math.PI / 4);
    const roof = new THREE.Mesh(roofGeo, darkRoofMat);
    roof.scale.set(1.05, 1.0, 0.95);
    roof.position.set(0, h + 1.25, 0);
    roof.castShadow = true;
    house.add(roof);

    for (const gx of [-w / 2 - 0.12, w / 2 + 0.12]) {
      const gable = new THREE.Mesh(new THREE.BoxGeometry(0.28, h + 1.4, d + 0.35), wallMat);
      gable.position.set(gx, (h + 1.4) / 2, 0);
      house.add(gable);
      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.2, d + 0.5), darkRoofMat);
      cap.position.set(gx, h + 1.45, 0);
      house.add(cap);
    }

    // Hanging Illuminated Chinese Shop Signboard
    const sign = createChineseSignboard(
      name,
      3.4,
      0.88,
      {
        bgHex: idx % 2 === 0 ? '#3a1410' : '#142b29',
        borderHex: '#e6b84c',
        textHex: '#ffe182',
        glowHex: '#ffaa38'
      },
      glowMats
    );
    sign.position.set(0, 3.85, frontZ + dir * 1.15);
    if (!facingSouth) sign.rotation.y = Math.PI;
    house.add(sign);

    // Pair of glowing red lanterns under the eave
    for (const lx of [-3.4, 3.4]) {
      const lan = createDetailedLantern(glowMats, 0.82);
      lan.position.set(lx, 3.25, frontZ + dir * 1.15);
      house.add(lan);
      swayingLanterns.push({ obj: lan, phase: idx * 1.3 + lx });
    }

    return house;
  }

  for (let i = 0; i < 6; i++) {
    const x = -25 + i * 10.2;
    const northHouse = createLingnanShophouse(shopNamesNorth[i], true, i);
    northHouse.position.set(x, 0.12, -11.4);
    group.add(northHouse);

    const southHouse = createLingnanShophouse(shopNamesSouth[i], false, i + 6);
    southHouse.position.set(x, 0.12, 11.4);
    group.add(southHouse);
  }

  // 4. Overhead Festive Red Lantern Strings crisscrossing East-West Alley
  const wireMat = new THREE.MeshBasicMaterial({ color: 0x261f1a });
  for (let i = 0; i < 6; i++) {
    const x = -27 + i * 10.5;
    const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 14.5, 5), wireMat);
    wire.rotation.x = Math.PI / 2;
    wire.position.set(x, 5.75, 0);
    group.add(wire);

    for (const lz of [-4.2, -1.4, 1.4, 4.2]) {
      const sag = Math.cos((lz / 6) * Math.PI * 0.5) * 0.42;
      const lan = createDetailedLantern(glowMats, 0.78);
      lan.position.set(x, 5.75 - sag, lz);
      group.add(lan);
      swayingLanterns.push({ obj: lan, phase: x * 0.3 + lz * 0.8 });
    }
  }

  // 5. Steaming Guilin Rice Noodle Stalls & Outdoor Tea Tables (桂林米粉摊与茶座)
  const canopyMat = new THREE.MeshStandardMaterial({ color: 0xb8362a, roughness: 0.78 });
  const steamMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.36
  });

  const stallPositions = [
    [-19.5, -5.2],
    [1.0, 5.2]
  ];
  for (let s = 0; s < stallPositions.length; s++) {
    const [sx, sz] = stallPositions[s];
    const stall = new THREE.Group();
    stall.position.set(sx, 0.12, sz);

    const counter = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.05, 1.15), woodMat);
    counter.position.y = 0.525;
    counter.castShadow = true;
    stall.add(counter);

    // Soup pot + bowls
    const pot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.28, 0.36, 12),
      new THREE.MeshStandardMaterial({ color: 0xc5c9cc, metalness: 0.72, roughness: 0.28 })
    );
    pot.position.set(-0.65, 1.22, 0);
    stall.add(pot);

    // Animated rising steam puffs from hot Guilin rice noodle broth!
    for (let k = 0; k < 5; k++) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(0.18 + k * 0.04, 8, 6), steamMat);
      puff.position.set(-0.65, 1.45 + k * 0.32, 0);
      stall.add(puff);
      steamPuffs.push({ mesh: puff, baseY: 1.45, phase: s * 3.1 + k * 1.25 });
    }

    // Stall canopy posts + awning
    for (const px of [-1.3, 1.3]) {
      for (const pz of [-0.5, 0.5]) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.5, 6), woodMat);
        post.position.set(px, 1.25, pz);
        stall.add(post);
      }
    }
    const awning = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.12, 1.7), canopyMat);
    awning.position.y = 2.52;
    awning.castShadow = true;
    stall.add(awning);

    // Nearby wooden tea table + 2 stools
    const table = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.76, 1.15), woodMat);
    table.position.set(2.55, 0.38, 0);
    table.castShadow = true;
    stall.add(table);
    for (const tx of [1.7, 3.4]) {
      const stool = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.46, 0.42), woodMat);
      stool.position.set(tx, 0.23, 0);
      stall.add(stool);
    }

    group.add(stall);
  }

  // Osmanthus trees & stone lanterns along alley plazas
  const treeCoords = [
    [-31, -5.6],
    [-31, 5.6],
    [29, -5.8],
    [29, 5.8]
  ];
  treeCoords.forEach(([tx, tz], idx) => {
    const t = createOsmanthusTree(0.92, idx + 2);
    t.position.set(tx, 0.12, tz);
    group.add(t);

    const sl = createStoneLantern(glowMats, 0.85);
    sl.position.set(tx + (tx < 0 ? 2.2 : -2.2), 0.12, tz);
    group.add(sl);
  });

  // 6. East-End Ancient City Wall & 3-Story Golden-Roofed 逍遙樓 (X = 42)
  const xiaoyao = new THREE.Group();
  xiaoyao.position.set(42, 0, 0);

  const brickWallMat = new THREE.MeshStandardMaterial({
    color: 0x7e807d,
    map: mats.darkStone.map,
    roughness: 0.9
  });
  const goldRoofMat = new THREE.MeshStandardMaterial({
    map: mats.roofGold.map,
    bumpMap: mats.roofGold.bumpMap,
    bumpScale: 0.25,
    roughness: 0.36,
    metalness: 0.35
  });

  // City wall fortress platform
  const wallBase = new THREE.Mesh(new THREE.BoxGeometry(14, 5.2, 34), brickWallMat);
  wallBase.position.set(0, 2.6, 0);
  wallBase.castShadow = true;
  wallBase.receiveShadow = true;
  xiaoyao.add(wallBase);

  // Grand stone staircase ascending from East-West Alley up to Xiaoyao Pavilion
  for (let step = 0; step < 12; step++) {
    const st = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.42 * (step + 1), 6.2), kerbMat);
    st.position.set(-11.4 + step * 0.42, (0.42 * (step + 1)) / 2, 0);
    st.receiveShadow = true;
    xiaoyao.add(st);
  }

  // Three-story Xiaoyao Pavilion tower
  const tiers = [
    { y: 5.2, w: 10.6, h: 4.2, rw: 9.8, rh: 2.3 },
    { y: 9.4, w: 8.6, h: 3.6, rw: 8.2, rh: 2.1 },
    { y: 13.0, w: 6.6, h: 3.1, rw: 6.8, rh: 2.5 }
  ];
  for (const t of tiers) {
    const hall = new THREE.Mesh(new THREE.BoxGeometry(t.w, t.h, t.w * 1.25), redPillarMat);
    hall.position.set(0, t.y + t.h / 2, 0);
    hall.castShadow = true;
    xiaoyao.add(hall);

    const roofGeo = new THREE.ConeGeometry(t.rw, t.rh, 4);
    roofGeo.rotateY(Math.PI / 4);
    const roof = new THREE.Mesh(roofGeo, goldRoofMat);
    roof.scale.set(1.0, 1.0, 1.2);
    roof.position.set(0, t.y + t.h + t.rh * 0.42, 0);
    roof.castShadow = true;
    xiaoyao.add(roof);
  }

  const xyPlaque = createChineseSignboard(
    '逍遙樓',
    4.2,
    1.35,
    { bgHex: '#152536', borderHex: '#f5c756', textHex: '#ffe078', glowHex: '#ffc145' },
    glowMats
  );
  xyPlaque.rotation.y = -Math.PI / 2;
  xyPlaque.position.set(-5.45, 8.6, 0);
  xiaoyao.add(xyPlaque);

  group.add(xiaoyao);

  // Shimmering Li River waterscape east of Xiaoyao Pavilion + distant karst horizon
  const liRiver = createZoneWaterMesh(90, 220, 0x1e6b62);
  liRiver.position.set(86, -0.05, 0);
  group.add(liRiver);

  group.add(createDistantKarstRing(105, 16));

  // 7. 14 Animated Strolling Visitors along East-West Alley
  for (let i = 0; i < 14; i++) {
    const w = createWalkingTourist(i + 3);
    const dir = i % 2 === 0 ? 1 : -1;
    const laneZ = -4.2 + (i % 5) * 2.1;
    const startX = -30 + ((i * 11) % 58);
    w.position.set(startX, 0.12, laneZ);
    w.rotation.y = dir > 0 ? Math.PI / 2 : -Math.PI / 2;
    group.add(w);
    walkers.push({
      obj: w,
      dir,
      speed: 1.25 + (i % 4) * 0.32,
      minX: -32,
      maxX: 28,
      phase: i * 1.4
    });
  }

  return {
    id: 'east-west-alley',
    name: '东西巷 · 逍遥楼街区',
    subtitle: '1:1 高精人文古街副本 · 明清岭南骑楼与非遗美食街',
    group,
    defaultCamera: { pos: [-47, 11.5, 13.5], target: [-4, 4.5, 0] },
    roamSpawn: { pos: [-31, 1.75, 0.5], yaw: -Math.PI / 2, bounds: { minX: -40, maxX: 31, minZ: -6.0, maxZ: 6.0 } },
    viewpoints: [
      { id: 'archway', name: '东西巷牌坊', pos: [-48, 8.5, 9.5], target: [-30, 5.2, 0] },
      { id: 'stalls', name: '古街米粉摊', pos: [-26, 4.8, 3.2], target: [-15, 2.5, -4.5] },
      { id: 'xiaoyao', name: '逍遥楼城墙', pos: [14, 14.5, 15.0], target: [42, 9.5, 0] },
      { id: 'overview', name: '古街全景', pos: [-22, 36, 44], target: [4, 4, 0] }
    ],
    update(dt, elapsed, nightFactor) {
      for (const item of glowMats) {
        item.mat.emissiveIntensity = THREE.MathUtils.lerp(item.base, item.night, nightFactor);
      }
      for (const l of swayingLanterns) {
        l.obj.rotation.z = Math.sin(elapsed * 2.1 + l.phase) * 0.085;
        l.obj.rotation.x = Math.cos(elapsed * 1.7 + l.phase) * 0.045;
      }
      for (const sp of steamPuffs) {
        const t = (elapsed * 0.55 + sp.phase) % 1.0;
        sp.mesh.position.y = sp.baseY + t * 0.92;
        sp.mesh.scale.setScalar(0.55 + t * 0.95);
      }
      for (const w of walkers) {
        w.obj.position.x += w.dir * w.speed * dt;
        if (w.obj.position.x > w.maxX) {
          w.dir = -1;
          w.obj.rotation.y = -Math.PI / 2;
        } else if (w.obj.position.x < w.minX) {
          w.dir = 1;
          w.obj.rotation.y = Math.PI / 2;
        }
        const swing = Math.sin(elapsed * 5.8 + w.phase) * 0.36;
        w.obj.userData.legL.rotation.x = swing;
        w.obj.userData.legR.rotation.x = -swing;
      }
    }
  };
}
