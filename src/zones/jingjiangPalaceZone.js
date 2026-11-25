import * as THREE from 'three';
import {
  createStoneInscriptionMaterial,
  getMaterialsLibrary
} from '../scene/materialsLibrary.js';
import {
  createChineseSignboard,
  createDetailedLantern,
  createDistantKarstRing,
  createOsmanthusTree,
  createStoneLion,
  createWalkingTourist
} from './zoneUtils.js';

/**
 * 区域副本 4：靖江王府 · 独秀峰王城 (1:1 明代藩王宫殿与摩崖石刻)
 * - 承运门红墙城阙、石狮、中轴花岗岩御道广场、东西朱红厢房、青铜香鼎
 * - 双层汉白玉须弥座承运殿、彩绘斗拱、琉璃金瓦大殿
 * - 背后拔地而起的独秀峰、「桂林山水甲天下」竖排摩崖石刻与山顶独秀亭
 */
export function buildJingjiangPalaceZone() {
  const group = new THREE.Group();
  group.name = 'Zone_JingjiangPalace';
  const glowMats = [];
  const walkers = [];

  const mats = getMaterialsLibrary();

  // 1. Imperial Courtyard Ground & Symmetrical Granite Axis (王城中轴广场)
  const grassMat = new THREE.MeshStandardMaterial({
    color: 0x3b663f,
    map: mats.terrainDetail.map,
    roughness: 0.92
  });
  const baseGround = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), grassMat);
  baseGround.rotation.x = -Math.PI / 2;
  baseGround.position.y = -0.1;
  baseGround.receiveShadow = true;
  group.add(baseGround);

  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0xc8c3b6,
    map: mats.granite.map,
    roughness: 0.76
  });
  const marbleMat = new THREE.MeshStandardMaterial({ color: 0xebe7dc, roughness: 0.6 });
  const redWallMat = new THREE.MeshStandardMaterial({
    color: 0x8f241c,
    map: mats.palaceWall.map,
    roughness: 0.72
  });
  const goldRoofMat = new THREE.MeshStandardMaterial({
    map: mats.roofGold.map,
    bumpMap: mats.roofGold.bumpMap,
    bumpScale: 0.25,
    roughness: 0.34,
    metalness: 0.36
  });
  const friezeMat = new THREE.MeshStandardMaterial({ map: mats.dougongFrieze, roughness: 0.5 });

  // Main paved courtyard (Z = -20 to +48)
  const courtyard = new THREE.Mesh(new THREE.BoxGeometry(58, 0.26, 76), stoneMat);
  courtyard.position.set(0, 0, 14);
  courtyard.receiveShadow = true;
  group.add(courtyard);

  // Imperial central marble walkway (御道)
  const imperialWay = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.32, 62), marbleMat);
  imperialWay.position.set(0, 0.03, 18);
  imperialWay.receiveShadow = true;
  group.add(imperialWay);

  // Surrounding crimson palace perimeter walls
  for (const sx of [-28.5, 28.5]) {
    const sideWall = new THREE.Mesh(new THREE.BoxGeometry(1.4, 5.2, 76), redWallMat);
    sideWall.position.set(sx, 2.6, 14);
    sideWall.castShadow = true;
    group.add(sideWall);
  }

  // 2. Monumental Chengyun Gate (承運門) at South Entrance (Z = 44)
  const gate = new THREE.Group();
  gate.position.set(0, 0.12, 44);

  const gateLeft = new THREE.Mesh(new THREE.BoxGeometry(24, 5.6, 4.4), redWallMat);
  gateLeft.position.set(-15.5, 2.8, 0);
  gateLeft.castShadow = true;
  gate.add(gateLeft);

  const gateRight = new THREE.Mesh(new THREE.BoxGeometry(24, 5.6, 4.4), redWallMat);
  gateRight.position.set(15.5, 2.8, 0);
  gateRight.castShadow = true;
  gate.add(gateRight);

  const gateTop = new THREE.Mesh(new THREE.BoxGeometry(7.2, 2.1, 4.4), redWallMat);
  gateTop.position.set(0, 4.55, 0);
  gate.add(gateTop);

  const gateTower = new THREE.Mesh(new THREE.BoxGeometry(15.5, 4.2, 5.2), redWallMat);
  gateTower.position.set(0, 7.7, 0);
  gateTower.castShadow = true;
  gate.add(gateTower);

  const gateFrieze = new THREE.Mesh(new THREE.BoxGeometry(16.0, 0.72, 5.6), friezeMat);
  gateFrieze.position.set(0, 9.65, 0);
  gate.add(gateFrieze);

  const gateRoofGeo = new THREE.ConeGeometry(13.2, 3.8, 4);
  gateRoofGeo.rotateY(Math.PI / 4);
  const gateRoof = new THREE.Mesh(gateRoofGeo, goldRoofMat);
  gateRoof.scale.set(1.05, 1.0, 0.52);
  gateRoof.position.set(0, 11.75, 0);
  gateRoof.castShadow = true;
  gate.add(gateRoof);

  const gatePlaque = createChineseSignboard(
    '承運門',
    4.4,
    1.45,
    { bgHex: '#152536', borderHex: '#f5c756', textHex: '#ffe078', glowHex: '#ffc145' },
    glowMats
  );
  gatePlaque.position.set(0, 8.65, 2.75);
  gate.add(gatePlaque);

  for (const lx of [-5.2, 5.2]) {
    const lion = createStoneLion(1.25);
    lion.position.set(lx, 0, 4.5);
    gate.add(lion);

    const lan = createDetailedLantern(glowMats, 1.0);
    lan.position.set(lx, 5.2, 2.65);
    gate.add(lan);
  }
  group.add(gate);

  // 3. East & West Crimson Cloisters (东西厢房) + Bronze Incense Cauldron (铜鼎)
  for (const sx of [-20.5, 20.5]) {
    const wing = new THREE.Group();
    wing.position.set(sx, 0.12, 22);
    const wBody = new THREE.Mesh(new THREE.BoxGeometry(6.8, 4.6, 26), redWallMat);
    wBody.position.y = 2.3;
    wBody.castShadow = true;
    wing.add(wBody);

    const wRoofGeo = new THREE.ConeGeometry(15.5, 2.6, 4);
    wRoofGeo.rotateY(Math.PI / 4);
    const wRoof = new THREE.Mesh(wRoofGeo, goldRoofMat);
    wRoof.scale.set(0.42, 1.0, 1.25);
    wRoof.position.y = 5.85;
    wRoof.castShadow = true;
    wing.add(wRoof);
    group.add(wing);
  }

  // Ceremonial Bronze Cauldron (青铜香鼎) in center courtyard
  const bronzeMat = new THREE.MeshStandardMaterial({ color: 0x4b5c4e, metalness: 0.65, roughness: 0.42 });
  const cauldron = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 0.9, 1.6, 12), bronzeMat);
  cauldron.position.set(0, 1.2, 22);
  cauldron.castShadow = true;
  group.add(cauldron);

  // Ancient Osmanthus Trees flanking the royal courtyard
  for (const [tx, tz] of [
    [-11.5, 32],
    [11.5, 32],
    [-11.5, 14],
    [11.5, 14]
  ]) {
    const t = createOsmanthusTree(1.25, tx + tz);
    t.position.set(tx, 0.12, tz);
    group.add(t);
  }

  // 4. Grand Chengyun Hall (承運殿) on Double-Tier White Marble Terrace (Z = 2)
  const hallGroup = new THREE.Group();
  hallGroup.position.set(0, 0.12, 2);

  const tier1 = new THREE.Mesh(new THREE.BoxGeometry(30, 1.35, 18), marbleMat);
  tier1.position.y = 0.675;
  tier1.receiveShadow = true;
  tier1.castShadow = true;
  hallGroup.add(tier1);

  const tier2 = new THREE.Mesh(new THREE.BoxGeometry(26, 1.2, 14.5), marbleMat);
  tier2.position.y = 1.95;
  tier2.receiveShadow = true;
  hallGroup.add(tier2);

  // Central carved dragon stairway ascending to Chengyun Hall
  for (let s = 0; s < 8; s++) {
    const st = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.32 * (s + 1), 0.72), marbleMat);
    st.position.set(0, (0.32 * (s + 1)) / 2, 11.4 - s * 0.56);
    hallGroup.add(st);
  }

  const hallBody = new THREE.Mesh(new THREE.BoxGeometry(21, 6.4, 11), redWallMat);
  hallBody.position.y = 5.75;
  hallBody.castShadow = true;
  hallGroup.add(hallBody);

  const hallFrieze = new THREE.Mesh(new THREE.BoxGeometry(21.6, 0.9, 11.5), friezeMat);
  hallFrieze.position.y = 8.95;
  hallGroup.add(hallFrieze);

  // Double-eave imperial golden roof
  const lowerRoofGeo = new THREE.ConeGeometry(18.2, 3.2, 4);
  lowerRoofGeo.rotateY(Math.PI / 4);
  const lowerRoof = new THREE.Mesh(lowerRoofGeo, goldRoofMat);
  lowerRoof.scale.set(1.08, 1.0, 0.65);
  lowerRoof.position.y = 10.7;
  lowerRoof.castShadow = true;
  hallGroup.add(lowerRoof);

  const upperRoofGeo = new THREE.ConeGeometry(13.5, 3.6, 4);
  upperRoofGeo.rotateY(Math.PI / 4);
  const upperRoof = new THREE.Mesh(upperRoofGeo, goldRoofMat);
  upperRoof.scale.set(1.04, 1.0, 0.62);
  upperRoof.position.y = 13.4;
  upperRoof.castShadow = true;
  hallGroup.add(upperRoof);

  const hallPlaque = createChineseSignboard(
    '承運殿',
    4.6,
    1.5,
    { bgHex: '#152536', borderHex: '#f5c756', textHex: '#ffe078', glowHex: '#ffc145' },
    glowMats
  );
  hallPlaque.position.set(0, 8.2, 5.75);
  hallGroup.add(hallPlaque);

  for (const lx of [-8.5, -3.5, 3.5, 8.5]) {
    const lan = createDetailedLantern(glowMats, 0.95);
    lan.position.set(lx, 7.2, 5.8);
    hallGroup.add(lan);
  }
  group.add(hallGroup);

  // 5. Towering Solitary Beauty Peak (独秀峰) behind Chengyun Hall (Z = -28)
  const rockMat = new THREE.MeshStandardMaterial({
    color: 0x7b8378,
    map: mats.karstRock.map,
    bumpMap: mats.karstRock.bumpMap,
    bumpScale: 1.5,
    roughness: 0.9
  });
  const peak = new THREE.Mesh(new THREE.CylinderGeometry(6.5, 16.5, 42, 18, 10), rockMat);
  peak.position.set(0, 21, -28);
  peak.castShadow = true;
  peak.receiveShadow = true;
  group.add(peak);

  // Famous Cliff Inscription: 桂林山水甲天下!
  const cliffMat = createStoneInscriptionMaterial('桂林山水甲天下', {
    vertical: true,
    stoneHex: '#bab4a6',
    inkHex: '#a31e17'
  });
  const sideRock = new THREE.MeshStandardMaterial({ color: 0x8c8980, roughness: 0.9 });
  const tablet = new THREE.Mesh(new THREE.BoxGeometry(3.8, 10.4, 0.8), [
    sideRock,
    sideRock,
    sideRock,
    sideRock,
    cliffMat,
    sideRock
  ]);
  tablet.position.set(0, 17.5, -13.6);
  group.add(tablet);

  // Summit Duxiu Pavilion (独秀亭) anchored cleanly on peak summit
  const pav = new THREE.Group();
  pav.position.set(0, 41.6, -28);
  const pBase = new THREE.Mesh(new THREE.CylinderGeometry(3.1, 3.5, 0.9, 6), marbleMat);
  pBase.position.y = 0.45;
  pav.add(pBase);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 2.8, 6), redWallMat);
    col.position.set(Math.cos(a) * 2.1, 2.2, Math.sin(a) * 2.1);
    pav.add(col);
  }
  const pRoof = new THREE.Mesh(new THREE.ConeGeometry(3.9, 1.8, 6), goldRoofMat);
  pRoof.position.y = 4.35;
  pav.add(pRoof);
  group.add(pav);

  // Strolling tourists in the palace courtyard
  for (let i = 0; i < 10; i++) {
    const w = createWalkingTourist(i + 12);
    const dir = i % 2 === 0 ? 1 : -1;
    w.position.set(-7 + (i % 5) * 3.5, 0.14, 15 + (i % 3) * 8);
    w.rotation.y = dir > 0 ? 0 : Math.PI;
    group.add(w);
    walkers.push({ obj: w, dir, speed: 1.15 + (i % 3) * 0.28, minZ: 13, maxZ: 39, phase: i * 1.3 });
  }

  group.add(createDistantKarstRing(115, 16));

  return {
    id: 'jingjiang-palace',
    name: '靖江王府 · 独秀峰王城',
    subtitle: '1:1 明代藩王城高精副本 · 承运门、承运殿与独秀峰摩崖石刻',
    group,
    defaultCamera: { pos: [0, 16, 68], target: [0, 9.5, 8] },
    roamSpawn: { pos: [0, 1.85, 36], yaw: 0, bounds: { minX: -16, maxX: 16, minZ: 12, maxZ: 40 } },
    viewpoints: [
      { id: 'gate', name: '承运门广场', pos: [0, 11.5, 65], target: [0, 7.5, 40] },
      { id: 'hall', name: '承运殿御道', pos: [12, 9.5, 29], target: [0, 7.5, 2] },
      { id: 'cliff', name: '独秀峰石刻', pos: [-16, 17, 6], target: [0, 18.5, -18] },
      { id: 'overview', name: '王城全景', pos: [38, 42, 68], target: [0, 10, 8] }
    ],
    update(dt, elapsed, nightFactor) {
      for (const item of glowMats) {
        item.mat.emissiveIntensity = THREE.MathUtils.lerp(item.base, item.night, nightFactor);
      }
      for (const w of walkers) {
        w.obj.position.z += w.dir * w.speed * dt;
        if (w.obj.position.z > w.maxZ) {
          w.dir = -1;
          w.obj.rotation.y = Math.PI;
        } else if (w.obj.position.z < w.minZ) {
          w.dir = 1;
          w.obj.rotation.y = 0;
        }
        const swing = Math.sin(elapsed * 5.2 + w.phase) * 0.34;
        w.obj.userData.legL.rotation.x = swing;
        w.obj.userData.legR.rotation.x = -swing;
      }
    }
  };
}
