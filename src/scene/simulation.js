import * as THREE from 'three';
import { getBridgeSurfaceY, getLiRiverCenterX, getLiRiverHalfWidth } from '../data/landmarksData.js';

/**
 * Living Guilin City Simulation Agents:
 * 1. 漓江竹筏 (Bamboo Rafts) & 两江四湖画舫游船 (Painted Cruise Boats)
 * 2. City Road Traffic (Cars & Sightseeing Buses with headlights/taillights)
 * 3. White Egrets (白鹭) circling Elephant Trunk Hill & Li River
 * 4. Rain particles (烟雨桂林) & drifting golden Osmanthus petals
 */
export function createSimulation(scene) {
  const group = new THREE.Group();
  group.name = 'GuilinSimulation';

  const nightGlowMats = [];

  // Shared materials
  const lanternMat = new THREE.MeshStandardMaterial({
    color: 0xffd27a,
    emissive: 0xff922b,
    emissiveIntensity: 0.25
  });
  const headlightMat = new THREE.MeshStandardMaterial({
    color: 0xfffce0,
    emissive: 0xfff5c0,
    emissiveIntensity: 0.2
  });
  const taillightMat = new THREE.MeshStandardMaterial({
    color: 0xff4040,
    emissive: 0xff2222,
    emissiveIntensity: 0.2
  });
  nightGlowMats.push(lanternMat, headlightMat, taillightMat);

  // =========================================================
  // 1. WATERWAY ROUTES & BOATS (游船 & 竹筏)
  // =========================================================
  // Route A: Main Li River North-to-South Scenic Cruise
  const liNorthPts = [];
  const liSouthPts = [];
  for (let z = -195; z <= 195; z += 22) {
    const cx = getLiRiverCenterX(z);
    const hw = getLiRiverHalfWidth(z);
    liNorthPts.push(new THREE.Vector3(cx + hw * 0.26, 0.05, z));
    liSouthPts.push(new THREE.Vector3(cx - hw * 0.24, 0.05, -z));
  }
  const liRouteDown = new THREE.CatmullRomCurve3(liNorthPts);
  const liRouteUp = new THREE.CatmullRomCurve3(liSouthPts);

  // Route B: Shan Lake (杉湖) loop around Sun & Moon Twin Pagodas (-25, 45)
  const shanLoopPts = [];
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    shanLoopPts.push(new THREE.Vector3(-25 + Math.cos(a) * 9.5, 0.05, 45 + Math.sin(a) * 5.8));
  }
  const shanRoute = new THREE.CatmullRomCurve3(shanLoopPts, true);

  // Route C: Rong Lake (榕湖) loop around the Central Island (-64, 18)
  const rongLoopPts = [];
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    rongLoopPts.push(new THREE.Vector3(-64 + Math.cos(a) * 14.5, 0.05, 18 + Math.sin(a) * 6.0));
  }
  const rongRoute = new THREE.CatmullRomCurve3(rongLoopPts, true);

  function buildCruiseBoatMesh() {
    // Traditional Guilin Two-Rivers-Four-Lakes Painted Sightseeing Boat (画舫游船)
    const b = new THREE.Group();
    const hullMat = new THREE.MeshStandardMaterial({ color: 0x6b3e26, roughness: 0.75 });
    const cabinMat = new THREE.MeshStandardMaterial({ color: 0xf0e8d8, roughness: 0.65 });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x3b4846, roughness: 0.6 });

    const hull = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.55, 5.2), hullMat);
    hull.position.y = 0.22;
    hull.castShadow = true;
    b.add(hull);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.85, 3.2), cabinMat);
    cabin.position.y = 0.85;
    b.add(cabin);

    // Warm cabin interior glow window
    const win = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.42, 2.7), lanternMat);
    win.position.y = 0.88;
    b.add(win);

    // Curved upturned traditional roof
    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.2, 3.7), roofMat);
    roof.position.y = 1.38;
    b.add(roof);

    // Bow & stern red-gold lanterns
    const l1 = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 6), lanternMat);
    l1.position.set(0, 1.35, 2.25);
    b.add(l1);
    const l2 = l1.clone();
    l2.position.set(0, 1.35, -2.25);
    b.add(l2);

    // Subtle white water wake behind boat
    const wake = new THREE.Mesh(
      new THREE.PlaneGeometry(1.4, 3.6),
      new THREE.MeshBasicMaterial({ color: 0xdff7f5, transparent: true, opacity: 0.35, depthWrite: false })
    );
    wake.rotation.x = -Math.PI / 2;
    wake.position.set(0, 0.04, -3.6);
    b.add(wake);

    return b;
  }

  function buildBambooRaftMesh() {
    // Classic Guilin Li River Bamboo Raft (漓江竹筏) with green bamboo poles & canopy
    const r = new THREE.Group();
    const bambooMat = new THREE.MeshStandardMaterial({ color: 0x7a964e, roughness: 0.8 });
    const canopyMat = new THREE.MeshStandardMaterial({ color: 0xd9c79e, roughness: 0.85 });

    for (let i = -2; i <= 2; i++) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 3.8, 5), bambooMat);
      pole.rotation.x = Math.PI / 2;
      pole.position.set(i * 0.24, 0.12, 0);
      r.add(pole);
    }

    const canopy = new THREE.Mesh(
      new THREE.CylinderGeometry(0.62, 0.62, 1.65, 8, 1, true, 0, Math.PI),
      canopyMat
    );
    canopy.rotation.z = Math.PI / 2;
    canopy.rotation.y = Math.PI / 2;
    canopy.position.set(0, 0.55, -0.1);
    r.add(canopy);

    // Small glowing fisherman lantern at bow (漓江渔火!)
    const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.15, 6, 6), lanternMat);
    lantern.position.set(0, 0.72, 1.65);
    r.add(lantern);

    return r;
  }

  const vessels = [];

  function spawnVessel(kind, routeKey = null, initialT = null) {
    const routes = [
      { key: 'liDown', curve: liRouteDown, speed: 0.014, closed: false },
      { key: 'liUp', curve: liRouteUp, speed: 0.013, closed: false },
      { key: 'shan', curve: shanRoute, speed: 0.036, closed: true },
      { key: 'rong', curve: rongRoute, speed: 0.028, closed: true }
    ];
    let chosen;
    if (routeKey) {
      chosen = routes.find((r) => r.key === routeKey) || routes[0];
    } else if (kind === 'raft') {
      chosen = Math.random() > 0.5 ? routes[0] : routes[1];
    } else {
      chosen = routes[Math.floor(Math.random() * routes.length)];
    }

    const mesh = kind === 'raft' ? buildBambooRaftMesh() : buildCruiseBoatMesh();
    group.add(mesh);

    const v = {
      kind,
      mesh,
      curve: chosen.curve,
      t: initialT !== null ? initialT : Math.random(),
      speed: chosen.speed * (0.85 + Math.random() * 0.35),
      phase: Math.random() * Math.PI * 2,
      priority: vessels.length
    };
    vessels.push(v);
    return v;
  }

  // Initial fleet: 14 boats & rafts across Li River, Shan Lake, and Rong Lake
  for (let i = 0; i < 4; i++) spawnVessel('cruise', 'liDown', i / 4);
  for (let i = 0; i < 4; i++) spawnVessel('raft', 'liUp', (i + 0.3) / 4);
  for (let i = 0; i < 3; i++) spawnVessel('raft', 'liDown', (i + 0.15) / 3);
  for (let i = 0; i < 3; i++) spawnVessel('cruise', 'shan', i / 3);
  for (let i = 0; i < 2; i++) spawnVessel('cruise', 'rong', i / 2);

  // =========================================================
  // 2. ROAD VEHICLES & CITY BUSES (城市车流)
  // =========================================================
  const roadPaths = [
    // Real diagonal Jiefang West Rd -> Shizijie -> Jiefang East Rd -> Jiefang Bridge (Eastbound & Westbound!)
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(-73, 0.72, -29.2),
      new THREE.Vector3(-25.4, 0.72, -15.2),
      new THREE.Vector3(20.0, 0.72, -2.0),
      new THREE.Vector3(41.3, 0.72, 5.1),
      new THREE.Vector3(82, 0.72, -1.5)
    ]),
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(82, 0.72, -4.5),
      new THREE.Vector3(41.6, 0.72, 1.4),
      new THREE.Vector3(20.3, 0.72, -5.8),
      new THREE.Vector3(-25.4, 0.72, -18.8),
      new THREE.Vector3(-73, 0.72, -32.8)
    ]),
    // Real Zhongshan Central Rd (NNE -> SSW through Shizijie, Yangqiao Bridge, WenChang Bridge!)
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(-12, 0.72, -88),
      new THREE.Vector3(-25, 0.72, -17),
      new THREE.Vector3(-38.5, 0.72, 25.5),
      new THREE.Vector3(-46.0, 0.72, 79.5),
      new THREE.Vector3(-54, 0.72, 112)
    ]),
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(-57, 0.72, 112),
      new THREE.Vector3(-48.5, 0.72, 79.5),
      new THREE.Vector3(-41.5, 0.72, 25.5),
      new THREE.Vector3(-28, 0.72, -17),
      new THREE.Vector3(-15, 0.72, -88)
    ])
  ];

  const carColors = [0xe8ecef, 0x3b6ea5, 0xc94f4f, 0x4b5563, 0xd9a74a, 0x2f855a];
  const vehicles = [];

  function buildVehicleMesh(isBus, colorHex) {
    const g = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.4, metalness: 0.3 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x283642, roughness: 0.2, metalness: 0.5 });

    const w = isBus ? 1.25 : 0.95;
    const h = isBus ? 1.35 : 0.65;
    const l = isBus ? 3.5 : 1.95;

    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, l), mat);
    body.position.y = h / 2 + 0.15;
    body.castShadow = true;
    g.add(body);

    if (!isBus) {
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(w * 0.85, 0.45, l * 0.55), glassMat);
      cabin.position.set(0, h + 0.3, -0.1);
      g.add(cabin);
    }

    // Headlights & Taillights
    for (const sx of [-w * 0.32, w * 0.32]) {
      const hl = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.16, 0.08), headlightMat);
      hl.position.set(sx, 0.45, l / 2 + 0.02);
      g.add(hl);

      const tl = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.16, 0.08), taillightMat);
      tl.position.set(sx, 0.45, -l / 2 - 0.02);
      g.add(tl);
    }

    return g;
  }

  for (let i = 0; i < 36; i++) {
    const path = roadPaths[i % roadPaths.length];
    const isBus = i % 6 === 0;
    const col = isBus ? 0x3ba88f : carColors[i % carColors.length];
    const mesh = buildVehicleMesh(isBus, col);
    group.add(mesh);

    vehicles.push({
      mesh,
      curve: path,
      t: (i / 36 + Math.random() * 0.15) % 1,
      speed: (isBus ? 0.036 : 0.055 + Math.random() * 0.028),
      index: i
    });
  }

  // =========================================================
  // 3. WHITE EGRETS (白鹭) CIRCLING KARST PEAKS & LI RIVER
  // =========================================================
  const birds = [];
  const birdMat = new THREE.MeshStandardMaterial({ color: 0xfbfdf8, roughness: 0.6, side: THREE.DoubleSide });
  const wingGeo = new THREE.PlaneGeometry(0.95, 0.35);

  const birdAnchors = [
    [34, 24, 72, 22],   // Around Elephant Trunk Hill
    [-16, 26, 26, 26],  // Over Sun & Moon Pagodas
    [35, 32, -45, 30]   // Over Li River & Fubo Hill
  ];

  for (let i = 0; i < 18; i++) {
    const anchor = birdAnchors[i % birdAnchors.length];
    const bird = new THREE.Group();
    const leftWing = new THREE.Mesh(wingGeo, birdMat);
    leftWing.position.x = -0.45;
    const rightWing = new THREE.Mesh(wingGeo, birdMat);
    rightWing.position.x = 0.45;
    bird.add(leftWing, rightWing);
    group.add(bird);

    birds.push({
      group: bird,
      leftWing,
      rightWing,
      cx: anchor[0],
      cy: anchor[1] + (Math.random() - 0.5) * 9,
      cz: anchor[2],
      radius: anchor[3] + (Math.random() - 0.5) * 10,
      angle: Math.random() * Math.PI * 2,
      speed: 0.32 + Math.random() * 0.2,
      flapSpeed: 7.5 + Math.random() * 3.0,
      phase: Math.random() * Math.PI * 2
    });
  }

  // =========================================================
  // 4. MISTY RAIN PARTICLES (烟雨桂林) & OSMANTHUS PETALS (桂花飘香)
  // =========================================================
  const rainCount = 2400;
  const rainGeo = new THREE.BufferGeometry();
  const rainPos = new Float32Array(rainCount * 3);
  for (let i = 0; i < rainCount; i++) {
    rainPos[i * 3] = (Math.random() - 0.5) * 280;
    rainPos[i * 3 + 1] = Math.random() * 110;
    rainPos[i * 3 + 2] = (Math.random() - 0.5) * 280;
  }
  rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
  const rainMat = new THREE.PointsMaterial({
    color: 0xd4e8ef,
    size: 0.55,
    transparent: true,
    opacity: 0.52,
    depthWrite: false
  });
  const rainPoints = new THREE.Points(rainGeo, rainMat);
  rainPoints.visible = false;
  group.add(rainPoints);

  // Subtle floating golden Osmanthus petals near Two Lakes
  const petalCount = 180;
  const petalGeo = new THREE.BufferGeometry();
  const petalPos = new Float32Array(petalCount * 3);
  for (let i = 0; i < petalCount; i++) {
    petalPos[i * 3] = -45 + (Math.random() - 0.5) * 150;
    petalPos[i * 3 + 1] = 2 + Math.random() * 24;
    petalPos[i * 3 + 2] = 15 + (Math.random() - 0.5) * 120;
  }
  petalGeo.setAttribute('position', new THREE.BufferAttribute(petalPos, 3));
  const petalMat = new THREE.PointsMaterial({
    color: 0xf7d872,
    size: 0.42,
    transparent: true,
    opacity: 0.7,
    depthWrite: false
  });
  const petalPoints = new THREE.Points(petalGeo, petalMat);
  group.add(petalPoints);

  scene.add(group);

  const tmpPos = new THREE.Vector3();
  const tmpNext = new THREE.Vector3();

  function update(dt, elapsed, params) {
    const { boatDensity, trafficDensity, flowSpeed, weather } = params;

    // 1. Update Boats & Rafts
    const activeVesselCount = Math.max(2, Math.round(vessels.length * boatDensity));
    let visibleBoats = 0;
    vessels.forEach((v, idx) => {
      const visible = idx < activeVesselCount;
      v.mesh.visible = visible;
      if (!visible) return;
      visibleBoats++;

      v.t = (v.t + v.speed * flowSpeed * dt) % 1.0;
      const nextT = (v.t + 0.005) % 1.0;
      v.curve.getPointAt(v.t, tmpPos);
      v.curve.getPointAt(nextT, tmpNext);

      v.mesh.position.copy(tmpPos);
      v.mesh.position.y += Math.sin(elapsed * 2.2 + v.phase) * 0.06;
      v.mesh.lookAt(tmpNext.x, v.mesh.position.y, tmpNext.z);
    });

    // 2. Update Road Traffic
    const activeVehicleCount = Math.round(vehicles.length * trafficDensity);
    vehicles.forEach((car, idx) => {
      const visible = idx < activeVehicleCount;
      car.mesh.visible = visible;
      if (!visible) return;

      car.t = (car.t + car.speed * dt) % 1.0;
      const nextT = Math.min(0.999, car.t + 0.004);
      car.curve.getPointAt(car.t, tmpPos);
      car.curve.getPointAt(nextT, tmpNext);

      // Snap car elevation smoothly to sloped bridge ramps & flat roads
      const byCur = getBridgeSurfaceY(tmpPos.x, tmpPos.z, 1.0);
      const byNext = getBridgeSurfaceY(tmpNext.x, tmpNext.z, 1.0);
      tmpPos.y = (byCur !== null ? byCur : 0.62) + 0.08;
      tmpNext.y = (byNext !== null ? byNext : 0.62) + 0.08;

      car.mesh.position.copy(tmpPos);
      car.mesh.lookAt(tmpNext);
    });

    // 3. Update Egrets
    for (const b of birds) {
      b.angle += b.speed * dt;
      const nx = b.cx + Math.cos(b.angle) * b.radius;
      const nz = b.cz + Math.sin(b.angle) * b.radius;
      const ny = b.cy + Math.sin(elapsed * 0.8 + b.phase) * 1.8;

      const fx = b.cx + Math.cos(b.angle + 0.05) * b.radius;
      const fz = b.cz + Math.sin(b.angle + 0.05) * b.radius;

      b.group.position.set(nx, ny, nz);
      b.group.lookAt(fx, ny, fz);

      const flap = Math.sin(elapsed * b.flapSpeed + b.phase) * 0.55;
      b.leftWing.rotation.z = flap;
      b.rightWing.rotation.z = -flap;
    }

    // 4. Rain & Osmanthus Petals
    rainPoints.visible = weather === 'rain';
    if (rainPoints.visible) {
      const arr = rainGeo.attributes.position.array;
      for (let i = 0; i < rainCount; i++) {
        arr[i * 3 + 1] -= 52 * dt;
        arr[i * 3] -= 4 * dt;
        if (arr[i * 3 + 1] < 0) {
          arr[i * 3 + 1] = 105;
          arr[i * 3] = (Math.random() - 0.5) * 280;
        }
      }
      rainGeo.attributes.position.needsUpdate = true;
    }

    const pArr = petalGeo.attributes.position.array;
    for (let i = 0; i < petalCount; i++) {
      pArr[i * 3] += Math.sin(elapsed * 0.6 + i) * 0.6 * dt;
      pArr[i * 3 + 1] -= 0.75 * dt;
      pArr[i * 3 + 2] += Math.cos(elapsed * 0.5 + i) * 0.5 * dt;
      if (pArr[i * 3 + 1] < 0.8) {
        pArr[i * 3 + 1] = 22 + Math.random() * 6;
      }
    }
    petalGeo.attributes.position.needsUpdate = true;

    return { visibleBoats, activeVehicleCount };
  }

  return {
    group,
    nightGlowMats,
    spawnVessel,
    update,
    getTotalVessels: () => vessels.length
  };
}
