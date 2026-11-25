import { GUILIN_BD09_POINTS, BMAP_ROAM_SPAWNS } from './coordTransform.js';

const DEFAULT_BMAP_AK = 'qwBsStlloOtrAtzSPR6pMD1y4SCmh4Tt';

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      resolve();
      return;
    }
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(s);
  });
}

function loadBMapGLSDK(ak) {
  if (window.BMapGL) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const cbName = '__onBMapGLReady__';
    window[cbName] = () => {
      delete window[cbName];
      resolve();
    };
    const s = document.createElement('script');
    s.src = `https://api.map.baidu.com/api?v=1.0&type=webgl&ak=${encodeURIComponent(ak)}&callback=${cbName}`;
    s.async = true;
    s.onerror = () => reject(new Error('Failed to load Baidu Maps GL API'));
    document.head.appendChild(s);
  });
}

/**
 * Helper: crisp calligraphy plaque texture for MapVGL's internal THREE instance
 */
function createPlaqueMat(THREE, text, bgHex, borderHex, textHex) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = bgHex;
  ctx.fillRect(0, 0, 512, 256);
  ctx.strokeStyle = borderHex;
  ctx.lineWidth = 10;
  ctx.strokeRect(10, 10, 492, 236);
  ctx.lineWidth = 3;
  ctx.strokeRect(24, 24, 464, 208);

  const chars = Array.from(text);
  const fs = Math.min(126, Math.floor(420 / Math.max(2, chars.length)));
  ctx.font = `bold ${fs}px "KaiTi", "STKaiti", "Noto Serif SC", serif`;
  ctx.fillStyle = textHex;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 130);

  const tex = new THREE.CanvasTexture(c);
  return new THREE.MeshStandardMaterial({
    map: tex,
    emissive: new THREE.Color(textHex),
    emissiveIntensity: 0.35,
    roughness: 0.35
  });
}

/**
 * Helper: builds a Z-up (GIS coordinates!) Three.js landmark group for MapVGL ThreeLayer
 * Note: In MapVGL ThreeLayer, X = East (meters), Y = North (meters), Z = Up (meters)!
 */
function buildPagodaZUp(THREE, tiers, baseR, tierH, roofHex, bodyHex, glowHex, plaqueText) {
  const g = new THREE.Group();
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0xd9d2c4, roughness: 0.75 });
  const bodyMat = new THREE.MeshStandardMaterial({
    color: bodyHex,
    emissive: glowHex,
    emissiveIntensity: 0.35,
    metalness: 0.55,
    roughness: 0.3
  });
  const roofMat = new THREE.MeshStandardMaterial({
    color: roofHex,
    emissive: glowHex,
    emissiveIntensity: 0.28,
    metalness: 0.65,
    roughness: 0.25
  });

  // Base terrace (CylinderGeometry in Three is Y-up, so rotateX(PI/2) makes it Z-up!)
  const baseGeo = new THREE.CylinderGeometry(baseR * 1.45, baseR * 1.6, 4.5, 8);
  baseGeo.rotateX(Math.PI / 2);
  const base = new THREE.Mesh(baseGeo, stoneMat);
  base.position.z = 2.25;
  g.add(base);

  let z = 4.5;
  for (let i = 0; i < tiers; i++) {
    const t = i / tiers;
    const r = baseR * (1 - t * 0.42);
    const h = tierH * (1 - t * 0.12);

    const coreGeo = new THREE.CylinderGeometry(r * 0.88, r * 0.92, h * 0.74, 8);
    coreGeo.rotateX(Math.PI / 2);
    const core = new THREE.Mesh(coreGeo, bodyMat);
    core.position.z = z + h * 0.37;
    g.add(core);

    const eaveGeo = new THREE.ConeGeometry(r * 1.48, h * 0.46, 8);
    eaveGeo.rotateX(Math.PI / 2);
    const eave = new THREE.Mesh(eaveGeo, roofMat);
    eave.position.z = z + h * 0.86;
    g.add(eave);

    z += h * 0.92;
  }

  // Spire
  const spireGeo = new THREE.CylinderGeometry(0.25, 0.85, 8.5, 8);
  spireGeo.rotateX(Math.PI / 2);
  const spire = new THREE.Mesh(spireGeo, roofMat);
  spire.position.z = z + 4.0;
  g.add(spire);

  // Plaque facing south (-Y)
  if (plaqueText) {
    const pMat = createPlaqueMat(THREE, plaqueText, '#1c130d', '#f5c756', '#ffe48a');
    const wood = new THREE.MeshStandardMaterial({ color: 0x382014 });
    const board = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.6, 3.0), [wood, wood, pMat, pMat, wood, wood]);
    board.position.set(0, -baseR * 1.15, 9.5);
    g.add(board);
  }

  return g;
}

function buildGateLandmarkZUp(THREE, title, wallHex, roofHex, scale = 1.0) {
  const g = new THREE.Group();
  const stoneMat = new THREE.MeshStandardMaterial({ color: wallHex, roughness: 0.82 });
  const timberMat = new THREE.MeshStandardMaterial({ color: 0x8e2620, roughness: 0.65 });
  const roofMat = new THREE.MeshStandardMaterial({ color: roofHex, roughness: 0.42, metalness: 0.28 });

  const base = new THREE.Mesh(new THREE.BoxGeometry(28 * scale, 11 * scale, 10 * scale), stoneMat);
  base.position.z = 5 * scale;
  g.add(base);

  const hall = new THREE.Mesh(new THREE.BoxGeometry(21 * scale, 8 * scale, 7.5 * scale), timberMat);
  hall.position.z = 13.7 * scale;
  g.add(hall);

  const roofGeo = new THREE.ConeGeometry(16 * scale, 6.8 * scale, 4);
  roofGeo.rotateY(Math.PI / 4);
  roofGeo.rotateX(Math.PI / 2);
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.scale.set(1.15, 0.55, 1);
  roof.position.z = 20.5 * scale;
  g.add(roof);

  // Plaque on both north & south faces
  const pMat = createPlaqueMat(THREE, title, '#161b24', '#f5c756', '#ffe27a');
  const wood = new THREE.MeshStandardMaterial({ color: 0x331d12 });
  const plaque = new THREE.Mesh(new THREE.BoxGeometry(11 * scale, 0.8 * scale, 3.8 * scale), [wood, wood, pMat, pMat, wood, wood]);
  plaque.position.set(0, -4.5 * scale, 15.6 * scale);
  g.add(plaque);

  return g;
}

function buildKarstPeakZUp(THREE, rx, ry, height, colorHex = 0x38693e) {
  const geo = new THREE.CylinderGeometry(0.25, 1.0, 1.0, 18, 10, false);
  geo.translate(0, 0.5, 0);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const vx = pos.getX(i);
    const vy = pos.getY(i);
    const vz = pos.getZ(i);
    const a = Math.atan2(vz, vx);
    const r0 = Math.hypot(vx, vz);
    const prof = vy >= 0.999 ? 0 : Math.pow(Math.max(0, 1 - Math.pow(vy, 1.8)), 0.45);
    const flute = 1 + Math.sin(a * 3 + vy * 1.5) * 0.14 + Math.cos(a * 5 - vy * 2.0) * 0.08;
    const r = (r0 > 0.001 ? prof : 0) * flute;
    pos.setXYZ(i, Math.cos(a) * r * rx, vy * height, Math.sin(a) * r * ry);
  }
  geo.rotateX(Math.PI / 2);
  geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.9, metalness: 0.02 });
  return new THREE.Mesh(geo, mat);
}

function buildElephantHillZUp(THREE) {
  const g = new THREE.Group();
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x7a8576, roughness: 0.88 });
  const body = buildKarstPeakZUp(THREE, 38, 28, 52, 0x3b6e3f);
  body.position.set(-10, 0, 0);
  g.add(body);

  // Curved elephant trunk arch dipping east (+X) into the Li River!
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(16, 0, 32),
    new THREE.Vector3(32, 0, 29),
    new THREE.Vector3(42, 0, 18),
    new THREE.Vector3(45, 0, 0)
  ]);
  const trunk = new THREE.Mesh(new THREE.TubeGeometry(curve, 20, 6.2, 10, false), rockMat);
  g.add(trunk);

  // Puxian Pagoda on top
  const pag = buildPagodaZUp(THREE, 2, 3.2, 4.5, 0x4b5256, 0xa86042, 0xffd275, null);
  pag.position.set(-6, 0, 49);
  g.add(pag);
  return g;
}

function buildXiaoyaoTowerZUp(THREE) {
  const g = new THREE.Group();
  const baseMat = new THREE.MeshStandardMaterial({ color: 0xd6cfc0, roughness: 0.78 });
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x8e2620, roughness: 0.65 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0xdca83b, roughness: 0.35, metalness: 0.38 });

  const base = new THREE.Mesh(new THREE.BoxGeometry(22, 18, 6), baseMat);
  base.position.z = 3;
  g.add(base);

  const tiers = [
    { z: 6, w: 18, d: 14, h: 7 },
    { z: 13.5, w: 14.5, d: 11, h: 6 },
    { z: 20, w: 11, d: 8.5, h: 5.5 }
  ];
  for (const t of tiers) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(t.w, t.d, t.h), wallMat);
    b.position.z = t.z + t.h / 2;
    g.add(b);
    const rGeo = new THREE.ConeGeometry(Math.max(t.w, t.d) * 0.8, 3.6, 4);
    rGeo.rotateY(Math.PI / 4);
    rGeo.rotateX(Math.PI / 2);
    const r = new THREE.Mesh(rGeo, roofMat);
    r.scale.set(1.12, t.d / t.w * 1.12, 1);
    r.position.z = t.z + t.h + 1.5;
    g.add(r);
  }

  const pMat = createPlaqueMat(THREE, '逍遙樓', '#1a1210', '#f5c756', '#ffe48a');
  const wood = new THREE.MeshStandardMaterial({ color: 0x331d12 });
  const plaque = new THREE.Mesh(new THREE.BoxGeometry(8.5, 0.7, 3.2), [wood, wood, pMat, pMat, wood, wood]);
  plaque.position.set(0, -7.4, 17.5);
  g.add(plaque);
  return g;
}

function buildRoamVehicleZUp(THREE) {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x114f59, metalness: 0.72, roughness: 0.22 });
  const tailMat = new THREE.MeshStandardMaterial({ color: 0xff3b3b, emissive: 0xff2222, emissiveIntensity: 1.8 });
  const headMat = new THREE.MeshStandardMaterial({ color: 0xfff8d8, emissive: 0xfff0b0, emissiveIntensity: 1.6 });

  const chassis = new THREE.Mesh(new THREE.BoxGeometry(4.2, 8.8, 2.2), bodyMat);
  chassis.position.z = 1.4;
  g.add(chassis);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(3.4, 4.4, 1.8), new THREE.MeshStandardMaterial({ color: 0x1a2d3a, roughness: 0.15 }));
  cabin.position.set(0, -0.4, 3.1);
  g.add(cabin);
  const head = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.3, 0.6), headMat);
  head.position.set(0, 4.45, 1.5);
  g.add(head);
  const tail = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.3, 0.6), tailMat);
  tail.position.set(0, -4.45, 1.6);
  g.add(tail);
  return g;
}

/**
 * Main Baidu Maps GL (BMapGL) + MapVGL ThreeLayer 3D Guilin Engine
 */
export function createBaiduMap3DManager(containerEl) {
  let initialized = false;
  let active = false;
  let map = null;
  let view = null;
  let threeLayer = null;
  let roamActive = false;
  let roamDrive = false;
  let roamLng = 110.2976;
  let roamLat = 25.2798;
  let roamHeading = 108; // degrees clockwise from North
  let roamSpeedKmh = 0;
  let roamVehicleMesh = null;
  let rafId = null;

  const keys = { w: false, s: false, a: false, d: false, shift: false };

  function onKey(e, down) {
    if (!active || !roamActive) return;
    switch (e.code) {
      case 'KeyW': case 'ArrowUp': keys.w = down; break;
      case 'KeyS': case 'ArrowDown': keys.s = down; break;
      case 'KeyA': case 'ArrowLeft': keys.a = down; break;
      case 'KeyD': case 'ArrowRight': keys.d = down; break;
      case 'ShiftLeft': case 'ShiftRight': keys.shift = down; break;
      case 'KeyC': if (down) toggleRoamDrive(); break;
      case 'Escape': if (down) exitRoam(); break;
      default:
        if (down && e.key >= '1' && e.key <= '6') {
          const sp = BMAP_ROAM_SPAWNS[parseInt(e.key, 10) - 1];
          if (sp) teleportRoam(sp);
        }
        break;
    }
  }
  window.addEventListener('keydown', (e) => onKey(e, true));
  window.addEventListener('keyup', (e) => onKey(e, false));

  async function init(customAk) {
    if (initialized) return;
    const ak = customAk || DEFAULT_BMAP_AK;
    await loadBMapGLSDK(ak);
    await loadScript('https://code.bdstatic.com/npm/mapvgl@1.0.0-beta.200/dist/mapvgl.min.js');
    await loadScript('https://code.bdstatic.com/npm/mapvgl@1.0.0-beta.200/dist/mapvgl.threelayers.min.js');

    const BMapGL = window.BMapGL;
    const mapvgl = window.mapvgl;
    const ov = GUILIN_BD09_POINTS.overview;

    map = new BMapGL.Map(containerEl, {
      enableRotate: true,
      enableTilt: true
    });
    map.centerAndZoom(new BMapGL.Point(ov.bd09[0], ov.bd09[1]), ov.zoom);
    map.enableScrollWheelZoom(true);
    map.enableKeyboard(false);
    map.setTilt(ov.tilt);
    map.setHeading(ov.heading);
    if (map.setDisplayOptions) {
      map.setDisplayOptions({
        building: true,
        poiText: true,
        poiIcon: true,
        skyColors: ['rgba(105, 165, 215, 0.05)', 'rgba(186, 220, 232, 0.85)']
      });
    }

    // Mount MapVGL ThreeLayer for our custom high-res 3D Guilin Landmarks!
    if (mapvgl && mapvgl.View && mapvgl.ThreeLayer) {
      view = new mapvgl.View({ map });
      threeLayer = new mapvgl.ThreeLayer();
      view.addLayer(threeLayer);

      const THREE = mapvgl.THREE;
      if (THREE) {
        // Lights inside ThreeLayer scene
        const amb = new THREE.AmbientLight(0xffffff, 0.85);
        const dir = new THREE.DirectionalLight(0xfff5dc, 1.35);
        dir.position.set(200, -180, 320);
        threeLayer.add(amb);
        threeLayer.add(dir);

        // Place iconic 3D Guilin Landmarks at their EXACT BD-09 coordinates on Baidu Maps!
        const tp = GUILIN_BD09_POINTS['twin-pagodas'];
        threeLayer.add(
          buildPagodaZUp(THREE, 9, 8.5, 6.2, 0xe8b94c, 0xc99335, 0xffc64d, '日塔'),
          new BMapGL.Point(tp.sunBd09[0], tp.sunBd09[1])
        );
        threeLayer.add(
          buildPagodaZUp(THREE, 7, 7.2, 5.6, 0x7ba4c4, 0x9ab7cf, 0x7cd8ff, '月塔'),
          new BMapGL.Point(tp.moonBd09[0], tp.moonBd09[1])
        );

        const eh = GUILIN_BD09_POINTS['elephant-hill'];
        threeLayer.add(buildElephantHillZUp(THREE), new BMapGL.Point(eh.bd09[0], eh.bd09[1]));

        const jp = GUILIN_BD09_POINTS['jingjiang-palace'];
        threeLayer.add(buildKarstPeakZUp(THREE, 34, 30, 72, 0x35643c), new BMapGL.Point(jp.bd09[0], jp.bd09[1]));
        threeLayer.add(buildGateLandmarkZUp(THREE, '靖江王府', 0x99322c, 0xdba538, 1.05), new BMapGL.Point(jp.gateBd09[0], jp.gateBd09[1]));

        const gn = GUILIN_BD09_POINTS['ronghu-gate'];
        threeLayer.add(buildGateLandmarkZUp(THREE, '古南門', 0x7f7d76, 0x3d464a, 0.9), new BMapGL.Point(gn.bd09[0], gn.bd09[1]));

        const jb = GUILIN_BD09_POINTS['jiefang-bridge'];
        threeLayer.add(buildXiaoyaoTowerZUp(THREE), new BMapGL.Point(jb.xiaoyaoBd09[0], jb.xiaoyaoBd09[1]));
        threeLayer.add(buildGateLandmarkZUp(THREE, '東西巷', 0xe0dad0, 0x3d464a, 0.72), new BMapGL.Point(jb.eastWestBd09[0], jb.eastWestBd09[1]));
        threeLayer.add(buildGateLandmarkZUp(THREE, '正陽步行街', 0xe0dad0, 0x3d464a, 0.72), new BMapGL.Point(jb.zhengyangBd09[0], jb.zhengyangBd09[1]));

        const fb = GUILIN_BD09_POINTS['fubo-diecai'];
        threeLayer.add(buildKarstPeakZUp(THREE, 36, 32, 68, 0x37693d), new BMapGL.Point(fb.bd09[0], fb.bd09[1]));
        threeLayer.add(buildKarstPeakZUp(THREE, 46, 40, 86, 0x315f38), new BMapGL.Point(fb.diecaiBd09[0], fb.diecaiBd09[1]));

        // Roaming 3D vehicle/marker synced to camera in Street Roaming mode
        roamVehicleMesh = buildRoamVehicleZUp(THREE);
        roamVehicleMesh.visible = false;
        threeLayer.add(roamVehicleMesh, new BMapGL.Point(roamLng, roamLat));

        threeLayer.update();
      }
    }

    initialized = true;
    startLoop();
  }

  let lastTime = performance.now();
  function startLoop() {
    if (rafId) cancelAnimationFrame(rafId);
    const tick = (now) => {
      rafId = requestAnimationFrame(tick);
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      if (active && roamActive && map) {
        const turnSpeed = roamDrive ? 72 : 85;
        if (keys.a) roamHeading = (roamHeading - turnSpeed * dt + 360) % 360;
        if (keys.d) roamHeading = (roamHeading + turnSpeed * dt) % 360;

        const maxMps = roamDrive ? (keys.shift ? 32 : 20) : (keys.shift ? 11 : 5.5);
        const dir = (keys.w ? 1 : 0) - (keys.s ? 0.65 : 0);
        const mps = dir * maxMps;
        roamSpeedKmh = Math.round(Math.abs(mps) * 3.6);

        if (Math.abs(mps) > 0.05 || keys.a || keys.d) {
          const rad = (roamHeading * Math.PI) / 180;
          // 1 deg lat ≈ 111000m, 1 deg lng ≈ 100400m at Guilin (25.28°N)
          roamLng += (Math.sin(rad) * mps * dt) / 100400;
          roamLat += (Math.cos(rad) * mps * dt) / 111000;

          const pt = new window.BMapGL.Point(roamLng, roamLat);
          map.setCenter(pt, { noAnimation: true });
          map.setHeading(roamHeading, { noAnimation: true });

          if (roamVehicleMesh && threeLayer && map.lnglatToMercator) {
            const mc = map.lnglatToMercator(roamLng, roamLat);
            roamVehicleMesh.position.set(mc[0], mc[1], 0);
            roamVehicleMesh.rotation.z = -rad;
            threeLayer.update();
          }
        }

        const speedEl = document.getElementById('roam-speed');
        if (speedEl) speedEl.textContent = `${roamSpeedKmh}`;
      }
    };
    rafId = requestAnimationFrame(tick);
  }

  function flyToLandmark(id) {
    if (!map) return;
    const item = GUILIN_BD09_POINTS[id] || GUILIN_BD09_POINTS.overview;
    const pt = new window.BMapGL.Point(item.bd09[0], item.bd09[1]);
    map.setCenter(pt);
    map.setZoom(item.zoom);
    map.setTilt(item.tilt);
    map.setHeading(item.heading);
    if (threeLayer) {
      setTimeout(() => threeLayer.update(), 120);
    }
  }

  function setTimeAtmosphere(timeOfDay) {
    if (!containerEl) return;
    // Smooth atmospheric lighting mood without extra Baidu REST API calls (0 QPS!)
    if (timeOfDay >= 19.2 || timeOfDay <= 5.5) {
      containerEl.style.filter = 'brightness(0.68) contrast(1.18) saturate(1.15) hue-rotate(195deg) invert(0.88)';
    } else if (timeOfDay >= 16.5 && timeOfDay < 19.2) {
      containerEl.style.filter = 'sepia(0.28) saturate(1.22) brightness(0.95)';
    } else if (timeOfDay > 5.5 && timeOfDay < 7.5) {
      containerEl.style.filter = 'brightness(0.96) contrast(0.94) saturate(0.88)';
    } else {
      containerEl.style.filter = 'none';
    }
  }

  function teleportRoam(sp) {
    roamLng = sp.bd09[0];
    roamLat = sp.bd09[1];
    roamHeading = sp.heading;
    if (map) {
      map.setCenter(new window.BMapGL.Point(roamLng, roamLat), { noAnimation: true });
      map.setZoom(20.2);
      map.setTilt(75);
      map.setHeading(roamHeading, { noAnimation: true });
      if (roamVehicleMesh && map.lnglatToMercator) {
        const mc = map.lnglatToMercator(roamLng, roamLat);
        roamVehicleMesh.position.set(mc[0], mc[1], 0);
        roamVehicleMesh.rotation.z = -(roamHeading * Math.PI) / 180;
        if (threeLayer) threeLayer.update();
      }
    }
    const titleEl = document.getElementById('roam-district-title');
    const subEl = document.getElementById('roam-district-sub');
    if (titleEl) titleEl.textContent = sp.name;
    if (subEl) subEl.textContent = '百度实景 3D 路网漫游 · BD-09 精确对齐';
  }

  function enterRoam(spawnId = 'jiefang-bridge') {
    if (!map) return;
    roamActive = true;
    const sp = BMAP_ROAM_SPAWNS.find((s) => s.id === spawnId) || BMAP_ROAM_SPAWNS[1];
    if (roamVehicleMesh) roamVehicleMesh.visible = true;
    teleportRoam(sp);
  }

  function exitRoam() {
    roamActive = false;
    Object.keys(keys).forEach((k) => (keys[k] = false));
    if (roamVehicleMesh) {
      roamVehicleMesh.visible = false;
      if (threeLayer) threeLayer.update();
    }
    flyToLandmark('overview');
  }

  function toggleRoamDrive() {
    roamDrive = !roamDrive;
    const badge = document.getElementById('roam-mode-badge');
    const btn = document.getElementById('btn-roam-drive');
    if (badge) {
      badge.textContent = roamDrive ? '百度路网驾车 DRIVE' : '百度路网步行 WALK';
      badge.classList.toggle('drive', roamDrive);
    }
    if (btn) {
      btn.textContent = roamDrive ? '切换步行 (C)' : '切换驾车 (C)';
      btn.classList.toggle('active', roamDrive);
    }
  }

  async function show() {
    active = true;
    containerEl.classList.remove('hidden');
    if (!initialized) {
      await init();
    } else if (map) {
      setTimeout(() => {
        if (threeLayer) threeLayer.update();
      }, 100);
    }
  }

  function hide() {
    active = false;
    if (roamActive) exitRoam();
    containerEl.classList.add('hidden');
  }

  return {
    init,
    show,
    hide,
    flyToLandmark,
    setTimeAtmosphere,
    enterRoam,
    exitRoam,
    teleportRoam,
    toggleRoamDrive,
    isActive: () => active,
    isRoamActive: () => roamActive
  };
}
