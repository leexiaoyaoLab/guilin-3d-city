import * as THREE from 'three';
import {
  createStoneInscriptionMaterial,
  getMaterialsLibrary
} from '../scene/materialsLibrary.js';
import {
  createDetailedLantern,
  createDistantKarstRing,
  createStoneLantern,
  createWeepingWillow,
  createZoneWaterMesh
} from './zoneUtils.js';

/**
 * 区域副本 3：象鼻山 · 水月洞漓江畔 (1:1 桂林城徽实景水岸)
 * - 高精雕塑象鼻山、水月洞溶洞钟乳石、山顶明代普贤塔
 * - 漓江鹅卵石滩、木质竹筏码头、观景石栏平台、象鼻山石碑
 * - 4艘挂渔火灯笼的漓江竹筏缓缓漂流，对岸喀斯特群峰剪影
 */
export function buildElephantHillZone() {
  const group = new THREE.Group();
  group.name = 'Zone_ElephantHill';
  const glowMats = [];
  const rafts = [];

  const mats = getMaterialsLibrary();

  // 1. Emerald Li River (漓江) + Pebble Waterfront Shore (鹅卵石河滩)
  const river = createZoneWaterMesh(240, 220, 0x1b6d63);
  river.position.y = 0;
  group.add(river);

  const shoreMat = new THREE.MeshStandardMaterial({
    color: 0x456e44,
    map: mats.terrainDetail.map,
    roughness: 0.92
  });
  const pebbleMat = new THREE.MeshStandardMaterial({
    color: 0xa8a395,
    map: mats.granite.map,
    roughness: 0.88
  });

  // West bank park lawn & pebble beach
  const westBank = new THREE.Mesh(new THREE.BoxGeometry(95, 1.4, 180), shoreMat);
  westBank.position.set(-56, 0.1, 0);
  westBank.receiveShadow = true;
  group.add(westBank);

  const beach = new THREE.Mesh(new THREE.BoxGeometry(16, 0.48, 90), pebbleMat);
  beach.position.set(-10, 0.18, 12);
  beach.receiveShadow = true;
  group.add(beach);

  // 2. High-Detail Sculpted Elephant Trunk Hill (象鼻山 + 水月洞)
  const rockMat = new THREE.MeshStandardMaterial({
    color: 0x7e877c,
    map: mats.karstRock.map,
    bumpMap: mats.karstRock.bumpMap,
    bumpScale: 1.4,
    roughness: 0.88
  });
  const foliageMat = new THREE.MeshStandardMaterial({ color: 0x336939, roughness: 0.86 });

  const hill = new THREE.Group();
  hill.position.set(4, 0, -14);

  // Main elephant body & head humps
  const body = new THREE.Mesh(new THREE.CylinderGeometry(7.2, 16.5, 25, 20, 8), rockMat);
  body.scale.set(1.18, 1.0, 0.88);
  body.position.set(-6, 12, 0);
  body.castShadow = true;
  body.receiveShadow = true;
  hill.add(body);

  const head = new THREE.Mesh(new THREE.CylinderGeometry(5.5, 11.2, 22, 16, 6), rockMat);
  head.position.set(6.5, 10.5, 0.5);
  head.castShadow = true;
  hill.add(head);

  // Sweeping Elephant Trunk Arch dipping into the Li River -> 水月洞!
  const trunkCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(8.5, 16.8, 0.5),
    new THREE.Vector3(16.0, 15.2, 0.6),
    new THREE.Vector3(21.5, 10.4, 0.4),
    new THREE.Vector3(23.2, 4.5, 0.2),
    new THREE.Vector3(23.5, -1.8, 0.0)
  ]);
  const trunkGeo = new THREE.TubeGeometry(trunkCurve, 32, 3.1, 14, false);
  const trunk = new THREE.Mesh(trunkGeo, rockMat);
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  hill.add(trunk);

  // Hanging limestone stalactites inside Water Moon Cave arch
  for (let i = 0; i < 7; i++) {
    const sx = 12 + i * 1.45;
    const stal = new THREE.Mesh(new THREE.ConeGeometry(0.32, 1.4 + (i % 3) * 0.55, 6), rockMat);
    stal.rotation.x = Math.PI;
    stal.position.set(sx, 12.6 - Math.abs(i - 3) * 0.45, 0.4 + ((i % 2) - 0.5) * 1.4);
    hill.add(stal);
  }

  // Warm moonlight reflection glow inside Water Moon Cave
  const caveGlowMat = new THREE.MeshStandardMaterial({
    color: 0xffe9a8,
    emissive: 0xffc652,
    emissiveIntensity: 0.25
  });
  glowMats.push({ mat: caveGlowMat, base: 0.12, night: 2.1 });
  const caveOrb = new THREE.Mesh(new THREE.SphereGeometry(0.65, 10, 10), caveGlowMat);
  caveOrb.position.set(16.2, 11.4, 0.5);
  hill.add(caveOrb);

  // Lush subtropical canopy clusters blanketing the karst ridge
  const canopyPts = [
    [-8, 24.2, 0, 5.4],
    [-2, 23.8, -2.5, 4.6],
    [5.5, 21.5, 0.5, 4.5],
    [13.5, 18.2, 0.6, 3.2],
    [18.5, 14.2, 0.4, 2.4]
  ];
  for (const [cx, cy, cz, cr] of canopyPts) {
    const bush = new THREE.Mesh(new THREE.DodecahedronGeometry(cr, 1), foliageMat);
    bush.position.set(cx, cy, cz);
    bush.scale.set(1.25, 0.65, 1.1);
    bush.castShadow = true;
    hill.add(bush);
  }

  // Ming-dynasty 普贤塔 (Puxian Pagoda) perched solidly on summit
  const pagoda = new THREE.Group();
  pagoda.position.set(-5.5, 24.4, 0);
  const brickMat = new THREE.MeshStandardMaterial({ color: 0xa65c3e, roughness: 0.78 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x454a4d, roughness: 0.68 });
  const pBase = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 2.25, 1.8, 8), pebbleMat);
  pBase.position.y = 0.9;
  pagoda.add(pBase);
  const pBody = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.25, 3.4, 8), brickMat);
  pBody.position.y = 3.5;
  pBody.castShadow = true;
  pagoda.add(pBody);
  const pRoof = new THREE.Mesh(new THREE.ConeGeometry(2.3, 1.8, 8), roofMat);
  pRoof.position.y = 5.95;
  pagoda.add(pRoof);
  const pSpire = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.35, 1.6, 6), caveGlowMat);
  pSpire.position.y = 7.25;
  pagoda.add(pSpire);
  hill.add(pagoda);

  group.add(hill);

  // 3. Carved Granite Waterfront Stele (象鼻山) on the viewing plaza
  const steleMat = createStoneInscriptionMaterial('象鼻山', {
    vertical: false,
    stoneHex: '#cec8ba',
    inkHex: '#a8221b'
  });
  const steleSide = new THREE.MeshStandardMaterial({ color: 0xaba598, roughness: 0.88 });
  const stele = new THREE.Mesh(new THREE.BoxGeometry(5.6, 2.75, 0.95), [
    steleSide,
    steleSide,
    steleSide,
    steleSide,
    steleMat,
    steleMat
  ]);
  stele.position.set(-14, 2.15, 15);
  stele.rotation.y = 0.42;
  stele.castShadow = true;
  group.add(stele);

  // 4. Wooden Bamboo-Raft Pier (漓江竹筏码头) extending into the Li River
  const timberMat = new THREE.MeshStandardMaterial({ color: 0x6e4a2e, roughness: 0.85 });
  const pierDeck = new THREE.Mesh(new THREE.BoxGeometry(14, 0.32, 4.8), timberMat);
  pierDeck.position.set(-1, 0.85, 24);
  pierDeck.castShadow = true;
  pierDeck.receiveShadow = true;
  group.add(pierDeck);

  for (const px of [-6.5, -2.5, 1.5, 5.5]) {
    for (const pz of [21.9, 26.1]) {
      const pile = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 2.1, 8), timberMat);
      pile.position.set(px, 0.35, pz);
      group.add(pile);
    }
  }

  const pierLan = createStoneLantern(glowMats, 0.95);
  pierLan.position.set(-7.2, 0.98, 21.8);
  group.add(pierLan);

  // Weeping willows along the pebble waterfront
  for (const [wx, wz] of [
    [-19, 8],
    [-21, 22],
    [-18, 34],
    [-22, -6]
  ]) {
    const w = createWeepingWillow(1.1);
    w.position.set(wx, 0.65, wz);
    group.add(w);
  }

  // 5. 4 Animated Li River Bamboo Rafts with Cormorant Fishing Lanterns (漓江渔火竹筏)
  const bambooMat = new THREE.MeshStandardMaterial({ color: 0x8ea352, roughness: 0.72 });
  for (let i = 0; i < 4; i++) {
    const raft = new THREE.Group();
    for (let b = -3; b <= 3; b++) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 6.2, 6), bambooMat);
      pole.rotation.x = Math.PI / 2;
      pole.position.set(b * 0.24, 0.14, 0);
      raft.add(pole);
    }
    const poleUp = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 2.3, 6), timberMat);
    poleUp.position.set(0, 1.25, 2.2);
    raft.add(poleUp);

    const lan = createDetailedLantern(glowMats, 0.72);
    lan.position.set(0, 2.25, 2.2);
    raft.add(lan);

    const rx = 14 + i * 9.5;
    raft.position.set(rx, 0.06, -35 + i * 24);
    group.add(raft);
    rafts.push({ obj: raft, speed: 1.8 + i * 0.35, phase: i * 1.9 });
  }

  group.add(createDistantKarstRing(115, 16));

  return {
    id: 'elephant-hill',
    name: '象鼻山 · 水月洞漓江畔',
    subtitle: '1:1 桂林城徽实景副本 · 水月洞溶洞、普贤塔与漓江渔火竹筏',
    group,
    defaultCamera: { pos: [26, 13.5, 34], target: [8, 9.5, -10] },
    roamSpawn: { pos: [-11, 2.2, 22], yaw: -Math.PI * 0.22, bounds: { minX: -24, maxX: 5, minZ: 4, maxZ: 34 } },
    viewpoints: [
      { id: 'cave', name: '水月洞近景', pos: [24, 8.5, 12], target: [16, 8.5, -13] },
      { id: 'pier', name: '竹筏码头', pos: [-16, 6.5, 31], target: [6, 8.5, -6] },
      { id: 'pagoda', name: '普贤塔仰望', pos: [-26, 14, 8], target: [-2, 22, -14] },
      { id: 'overview', name: '象山全景', pos: [38, 36, 52], target: [4, 8, -4] }
    ],
    update(dt, elapsed, nightFactor) {
      for (const item of glowMats) {
        item.mat.emissiveIntensity = THREE.MathUtils.lerp(item.base, item.night, nightFactor);
      }
      for (const r of rafts) {
        r.obj.position.z += r.speed * dt;
        if (r.obj.position.z > 62) r.obj.position.z = -58;
        r.obj.position.y = 0.06 + Math.sin(elapsed * 2.4 + r.phase) * 0.07;
      }
    }
  };
}
