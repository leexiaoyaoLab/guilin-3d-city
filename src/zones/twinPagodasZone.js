import * as THREE from 'three';
import { getMaterialsLibrary } from '../scene/materialsLibrary.js';
import {
  createChineseSignboard,
  createDetailedLantern,
  createDistantKarstRing,
  createStoneLantern,
  createWeepingWillow,
  createZoneWaterMesh
} from './zoneUtils.js';

/**
 * 区域副本 2：日月双塔 · 杉湖夜色园 (1:1 高精两江四湖水景园)
 * - 9层铜金日塔 & 7层琉璃银月塔、汉白玉岛台护栏、弧形玻璃灯带栈桥
 * - 杉湖碧水、22朵盛开粉荷与浮叶、游动锦鲤、巡游杉湖画舫
 * - 环湖亲水木栈道、知音六角亭、垂柳与石灯笼
 */
export function buildTwinPagodasZone() {
  const group = new THREE.Group();
  group.name = 'Zone_TwinPagodas';
  const glowMats = [];
  const koiList = [];

  const mats = getMaterialsLibrary();

  // 1. Emerald Shanhu Lake (杉湖) + surrounding garden shore
  const lakeWater = createZoneWaterMesh(190, 190, 0x186159);
  lakeWater.position.y = 0.0;
  group.add(lakeWater);

  const grassMat = new THREE.MeshStandardMaterial({
    color: 0x3b693f,
    map: mats.terrainDetail.map,
    roughness: 0.9
  });
  const graniteMat = new THREE.MeshStandardMaterial({
    color: 0xbcb8ac,
    map: mats.granite.map,
    roughness: 0.78
  });

  // Curved southern & western waterfront promenade shore (亲水环湖岸线)
  const shoreRingGeo = new THREE.RingGeometry(36, 95, 48);
  shoreRingGeo.rotateX(-Math.PI / 2);
  const shoreMesh = new THREE.Mesh(shoreRingGeo, grassMat);
  shoreMesh.position.y = 0.45;
  shoreMesh.receiveShadow = true;
  group.add(shoreMesh);

  // Granite lakeside boardwalk ring (环湖花岗岩亲水步栈道)
  const walkRingGeo = new THREE.RingGeometry(33.2, 37.6, 48);
  walkRingGeo.rotateX(-Math.PI / 2);
  const walkMesh = new THREE.Mesh(walkRingGeo, graniteMat);
  walkMesh.position.y = 0.56;
  walkMesh.receiveShadow = true;
  group.add(walkMesh);

  // 2. Helper to build ultra-detailed octagonal Chinese pagoda (日塔 / 月塔)
  function buildDetailedPagoda({ stories, baseRadius, storyHeight, isGold, plaqueText }) {
    const pg = new THREE.Group();

    const marbleMat = new THREE.MeshStandardMaterial({ color: 0xe6e2d8, roughness: 0.65 });
    const bodyMat = isGold
      ? new THREE.MeshStandardMaterial({
          color: 0xe8b948,
          map: mats.pagodaGold.map,
          emissive: 0xc97f10,
          emissiveIntensity: 0.25,
          roughness: 0.28,
          metalness: 0.68
        })
      : new THREE.MeshStandardMaterial({
          color: 0xd9e8f5,
          map: mats.pagodaSilver.map,
          emissive: 0x4da8d6,
          emissiveIntensity: 0.22,
          roughness: 0.26,
          metalness: 0.55
        });
    glowMats.push({ mat: bodyMat, base: isGold ? 0.22 : 0.18, night: isGold ? 1.55 : 1.45 });

    const roofMat = isGold
      ? new THREE.MeshStandardMaterial({
          color: 0xf0c24d,
          map: mats.roofGold.map,
          emissive: 0xb87312,
          emissiveIntensity: 0.18,
          roughness: 0.28,
          metalness: 0.72
        })
      : new THREE.MeshStandardMaterial({
          color: 0xc9dff0,
          map: mats.roofSilver.map,
          emissive: 0x3b8fbd,
          emissiveIntensity: 0.18,
          roughness: 0.3,
          metalness: 0.6
        });
    glowMats.push({ mat: roofMat, base: 0.15, night: 1.25 });

    // Octagonal marble island pedestal & carved balustrade posts
    const island = new THREE.Mesh(new THREE.CylinderGeometry(baseRadius * 1.9, baseRadius * 2.15, 1.35, 8), marbleMat);
    island.position.y = 0.65;
    island.receiveShadow = true;
    island.castShadow = true;
    pg.add(island);

    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 1.05, 6), marbleMat);
      post.position.set(Math.cos(a) * baseRadius * 1.75, 1.82, Math.sin(a) * baseRadius * 1.75);
      pg.add(post);
    }

    // Stacked pagoda stories with upturned eaves
    let curY = 1.35;
    for (let s = 0; s < stories; s++) {
      const taper = 1.0 - s * 0.055;
      const r = baseRadius * taper;
      const h = storyHeight * (1.0 - s * 0.025);

      const core = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.94, r, h, 8), bodyMat);
      core.position.y = curY + h / 2;
      core.castShadow = true;
      pg.add(core);

      const eave = new THREE.Mesh(new THREE.ConeGeometry(r * 1.52, h * 0.52, 8), roofMat);
      eave.position.y = curY + h + h * 0.16;
      eave.castShadow = true;
      pg.add(eave);

      curY += h + h * 0.15;
    }

    // Golden/Silver finial spire (塔刹)
    const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.42, 4.6, 8), roofMat);
    spire.position.y = curY + 2.3;
    pg.add(spire);

    // Illuminated Plaque on first floor
    const plaque = createChineseSignboard(
      plaqueText,
      2.4,
      1.05,
      isGold
        ? { bgHex: '#331c08', borderHex: '#ffd76b', textHex: '#ffe999', glowHex: '#ffba33' }
        : { bgHex: '#0d2233', borderHex: '#a9dcff', textHex: '#e0f4ff', glowHex: '#66c7ff' },
      glowMats
    );
    plaque.position.set(0, 3.2, baseRadius + 0.25);
    pg.add(plaque);

    return pg;
  }

  // Sun Pagoda (日塔 - 9 stories, Bronze Gold)
  const sunPagoda = buildDetailedPagoda({
    stories: 9,
    baseRadius: 4.1,
    storyHeight: 2.75,
    isGold: true,
    plaqueText: '日塔'
  });
  sunPagoda.position.set(10.5, 0, -3.5);
  group.add(sunPagoda);

  // Moon Pagoda (月塔 - 7 stories, Glazed Silver)
  const moonPagoda = buildDetailedPagoda({
    stories: 7,
    baseRadius: 3.4,
    storyHeight: 2.55,
    isGold: false,
    plaqueText: '月塔'
  });
  moonPagoda.position.set(-10.5, 0, 2.5);
  group.add(moonPagoda);

  // 3. Arched Causeway & Glass-Lit Lakeside Footbridge linking shore to Sun Pagoda
  const bridgeRailMat = new THREE.MeshStandardMaterial({
    color: 0xc2f2ff,
    emissive: 0x45d6c5,
    emissiveIntensity: 0.3,
    roughness: 0.2
  });
  glowMats.push({ mat: bridgeRailMat, base: 0.22, night: 1.85 });

  for (let seg = 0; seg < 14; seg++) {
    const t = seg / 13;
    const bx = THREE.MathUtils.lerp(16, 35, t);
    const bz = THREE.MathUtils.lerp(-2, 12, t);
    const archY = 0.72 + Math.sin(t * Math.PI) * 1.45;
    const deck = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.28, 3.2), graniteMat);
    deck.position.set(bx, archY, bz);
    deck.rotation.y = -Math.atan2(14, 19);
    deck.castShadow = true;
    deck.receiveShadow = true;
    group.add(deck);

    for (const side of [-1.45, 1.45]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.14, 0.14), bridgeRailMat);
      rail.position.set(bx, archY + 0.85, bz + side);
      rail.rotation.y = -Math.atan2(14, 19);
      group.add(rail);
    }
  }

  // 4. Lakeside Hexagonal Pavilion (知音亭) + Weeping Willows + Stone Lanterns
  const pavilion = new THREE.Group();
  pavilion.position.set(-28, 0.56, 22);
  const redMat = new THREE.MeshStandardMaterial({ color: 0x9b241d, roughness: 0.55 });
  const roofDarkMat = new THREE.MeshStandardMaterial({
    map: mats.roofDark.map,
    roughness: 0.52,
    metalness: 0.15
  });

  const pavBase = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.6, 0.75, 6), graniteMat);
  pavBase.position.y = 0.375;
  pavilion.add(pavBase);

  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 3.6, 8), redMat);
    col.position.set(Math.cos(a) * 3.2, 2.55, Math.sin(a) * 3.2);
    col.castShadow = true;
    pavilion.add(col);
  }
  const pavRoof1 = new THREE.Mesh(new THREE.ConeGeometry(5.1, 1.85, 6), roofDarkMat);
  pavRoof1.position.y = 5.1;
  pavRoof1.castShadow = true;
  pavilion.add(pavRoof1);

  const pavRoof2 = new THREE.Mesh(new THREE.ConeGeometry(3.2, 1.65, 6), roofDarkMat);
  pavRoof2.position.y = 6.6;
  pavilion.add(pavRoof2);

  const pavLan = createDetailedLantern(glowMats, 1.0);
  pavLan.position.set(0, 4.15, 0);
  pavilion.add(pavLan);
  group.add(pavilion);

  // Ring of Weeping Willows & Stone Lanterns around the lakeside boardwalk
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const wx = Math.cos(a) * 38.5;
    const wz = Math.sin(a) * 38.5;
    const willow = createWeepingWillow(1.0 + (i % 3) * 0.14);
    willow.position.set(wx, 0.52, wz);
    group.add(willow);

    const lx = Math.cos(a + 0.25) * 34.8;
    const lz = Math.sin(a + 0.25) * 34.8;
    const sl = createStoneLantern(glowMats, 0.9);
    sl.position.set(lx, 0.56, lz);
    group.add(sl);
  }

  // 5. Floating Lotus Pads & Pink Lotus Blossoms + Swimming Golden Koi Fish!
  const padMat = new THREE.MeshStandardMaterial({ color: 0x2f7d44, roughness: 0.72 });
  const lotusMat = new THREE.MeshStandardMaterial({
    color: 0xffa6c4,
    emissive: 0xa83862,
    emissiveIntensity: 0.12,
    roughness: 0.55
  });
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * Math.PI * 2 + 0.3;
    const r = 18 + (i % 4) * 3.8;
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.05, 12), padMat);
    pad.position.set(Math.cos(a) * r, 0.06, Math.sin(a) * r);
    group.add(pad);
    if (i % 2 === 0) {
      const bloom = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.45, 7), lotusMat);
      bloom.rotation.x = Math.PI;
      bloom.position.set(Math.cos(a) * r, 0.28, Math.sin(a) * r);
      group.add(bloom);
    }
  }

  const koiMat = new THREE.MeshStandardMaterial({
    color: 0xff6b2b,
    emissive: 0xb8380b,
    emissiveIntensity: 0.25,
    roughness: 0.3
  });
  for (let i = 0; i < 10; i++) {
    const koi = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.85, 6), koiMat);
    koi.rotation.x = Math.PI / 2;
    koi.position.y = 0.08;
    group.add(koi);
    koiList.push({
      mesh: koi,
      radius: 13 + (i % 4) * 3.5,
      speed: 0.22 + (i % 3) * 0.08,
      phase: i * 1.15
    });
  }

  // 6. Painted Guilin Pleasure Boat (杉湖画舫) gliding gently around the Twin Pagodas
  const boat = new THREE.Group();
  const hullMat = new THREE.MeshStandardMaterial({ color: 0x6b3a22, roughness: 0.72 });
  const hull = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.8, 7.4), hullMat);
  hull.position.y = 0.35;
  hull.castShadow = true;
  boat.add(hull);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.55, 4.4), redMat);
  cabin.position.y = 1.45;
  boat.add(cabin);

  const bRoof = new THREE.Mesh(new THREE.ConeGeometry(2.1, 0.9, 4), roofDarkMat);
  bRoof.rotation.y = Math.PI / 4;
  bRoof.scale.set(0.95, 1, 2.0);
  bRoof.position.y = 2.65;
  boat.add(bRoof);

  const bLan1 = createDetailedLantern(glowMats, 0.65);
  bLan1.position.set(0, 2.05, 2.9);
  boat.add(bLan1);
  const bLan2 = createDetailedLantern(glowMats, 0.65);
  bLan2.position.set(0, 2.05, -2.9);
  boat.add(bLan2);
  group.add(boat);

  group.add(createDistantKarstRing(105, 16));

  return {
    id: 'twin-pagodas',
    name: '日月双塔 · 杉湖夜色园',
    subtitle: '1:1 两江四湖核心水景副本 · 日塔月塔、荷塘锦鲤与杉湖画舫',
    group,
    defaultCamera: { pos: [-6, 15.5, 43], target: [0, 10.5, 0] },
    roamSpawn: { pos: [0, 2.25, 35.2], yaw: 0, bounds: { minX: -36, maxX: 36, minZ: 31, maxZ: 38 } },
    viewpoints: [
      { id: 'reflection', name: '双塔倒影', pos: [-4, 9.5, 42], target: [0, 11.5, 0] },
      { id: 'boat', name: '杉湖画舫', pos: [26, 7.5, 28], target: [5, 7, 0] },
      { id: 'pavilion', name: '知音亭畔', pos: [-34, 8.5, 34], target: [-10, 8, 5] },
      { id: 'overview', name: '杉湖全景', pos: [0, 46, 62], target: [0, 6, 0] }
    ],
    update(dt, elapsed, nightFactor) {
      for (const item of glowMats) {
        item.mat.emissiveIntensity = THREE.MathUtils.lerp(item.base, item.night, nightFactor);
      }
      // Glide painted pleasure boat in a smooth oval around the twin pagodas
      const ba = elapsed * 0.14;
      const bx = Math.cos(ba) * 24.5;
      const bz = Math.sin(ba) * 22.5;
      boat.position.set(bx, Math.sin(elapsed * 2.2) * 0.08, bz);
      boat.rotation.y = -ba;

      // Swim koi fish gently near water surface
      for (const k of koiList) {
        const ka = elapsed * k.speed + k.phase;
        const kx = Math.cos(ka) * k.radius;
        const kz = Math.sin(ka) * k.radius;
        k.mesh.position.set(kx, 0.07, kz);
        k.mesh.rotation.z = ka;
      }
    }
  };
}
