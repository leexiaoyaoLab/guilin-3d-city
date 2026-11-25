import * as THREE from 'three';
import {
  getBridgeSurfaceY,
  getLiRiverCenterX,
  getPeachRiverCenterZ,
  getWaterDepth
} from '../data/landmarksData.js';
import { REAL_ROADS } from '../data/guilinRealMapData.js';

/**
 * Iconic street-level spawn points aligned strictly to real Guilin map coordinates
 */
export const ROAM_SPAWNS = [
  {
    id: 'binjiang',
    name: '滨江路 · 象鼻山',
    pos: [-38, 0.55, 84],
    yaw: -Math.PI * 0.48,
    pitch: 0.06
  },
  {
    id: 'jiefang-bridge',
    name: '解放桥 · 跨漓江',
    pos: [22, 3.65, -2.5],
    yaw: -Math.PI * 0.5 - 0.31,
    pitch: 0.03
  },
  {
    id: 'shan-lake',
    name: '杉湖 · 日月双塔',
    pos: [-25, 0.55, 56],
    yaw: 0,
    pitch: 0.09
  },
  {
    id: 'east-west-alley',
    name: '东西巷 · 逍遥楼',
    pos: [4, 0.55, -7.5],
    yaw: 0.25,
    pitch: 0.06
  },
  {
    id: 'jingjiang-gate',
    name: '靖江王府 · 承运门',
    pos: [3, 0.55, -28.5],
    yaw: 0,
    pitch: 0.14
  },
  {
    id: 'ronghu-gate',
    name: '榕湖 · 古南门',
    pos: [-68, 0.55, -2.5],
    yaw: Math.PI,
    pitch: 0.04
  }
];

/**
 * Computes walkable/drivable ground elevation including sloped bridges over rivers & lakes
 */
export function getStreetGroundY(x, z) {
  const bridgeY = getBridgeSurfaceY(x, z, 0.2);
  if (bridgeY !== null) {
    return bridgeY;
  }

  // Water check: returns null if deep water (blocks walking into river/lake)
  const waterDepth = getWaterDepth(x, z);
  if (waterDepth > 0.25) {
    return null;
  }

  return 0.55;
}

/**
 * Returns the live Guilin District & Street name for the GTA-style street banner
 */
export function getDistrictInfo(x, z) {
  if (Math.hypot(x - 14, z - 86) < 30) {
    return { title: '象鼻山景区', sub: '滨江路南段 · 漓江与桃花江汇流处' };
  }
  if (Math.abs(z - 0) < 9 && x > 18 && x < 86) {
    return { title: '解放桥', sub: '解放东路跨漓江主桥 · 西北角为逍遥楼' };
  }
  if (Math.hypot(x - 23.5, z - (-15.5)) < 12) {
    return { title: '逍遥楼 · 东西巷东口', sub: '解放桥西北角 · 漓江西畔名楼' };
  }
  if (Math.hypot(x - (-10), z - 46) < 27) {
    return { title: '杉湖景区 · 日月双塔', sub: '阳桥以东 · 正阳步行街南端' };
  }
  if (Math.hypot(x - (-68), z - 24) < 34) {
    return { title: '榕湖 · 古南门', sub: '阳桥以西 · 唐代古城遗址 · 千年古榕' };
  }
  if (Math.hypot(x - 0, z - (-54)) < 28) {
    return { title: '靖江王府 · 独秀峰', sub: '东西巷正北 · 明代藩王城 · 王城路' };
  }
  if (x > -15 && x < 22 && z > -28 && z < -4) {
    return { title: '东西巷历史文化街区', sub: '解放东路北侧 · 王城正阳门外 · 东接逍遥楼' };
  }
  if (x > -16 && x < 6 && z > 4 && z < 24) {
    return { title: '正阳步行街', sub: '解放东路南侧 · 北接东西巷 · 南连杉湖' };
  }
  if (Math.hypot(x - 34, z - (-58)) < 22 || Math.hypot(x - 28, z - (-116)) < 28) {
    return { title: '伏波山 · 叠彩山', sub: '漓江西岸北段 · 滨江奇峰' };
  }
  if (x > 74) {
    return { title: '七星区 · 漓江东岸', sub: '七星公园峰群 · 滨江生态新城' };
  }
  if (Math.abs(x - (-40)) < 10) {
    return { title: '中山中路', sub: '桂林南北中轴 · 经阳桥分榕杉二湖' };
  }
  if (Math.abs(z - 0) < 10) {
    return { title: '解放东路 / 解放西路', sub: '桂林东西主干道 · 北临东西巷 · 南临正阳街' };
  }
  return { title: '桂林秀峰城区', sub: '桂林山水甲天下 · 城在景中' };
}

/**
 * Creates a stylized GTA-style first-person sports cruiser hood & dashboard
 * attached to the camera when in Drive Mode (C key).
 */
function createCruiserCockpit() {
  const cockpit = new THREE.Group();
  cockpit.visible = false;

  const hoodMat = new THREE.MeshPhysicalMaterial({
    color: 0x0f3b42,
    metalness: 0.65,
    roughness: 0.18,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: 0x4ec4a7,
    emissive: 0x2aa88c,
    emissiveIntensity: 0.75,
    roughness: 0.3
  });
  const dashMat = new THREE.MeshStandardMaterial({
    color: 0x10161a,
    roughness: 0.85
  });

  // Sleek sports car hood visible in lower viewport
  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.14, 1.55), hoodMat);
  hood.position.set(0, -0.58, -1.65);
  hood.rotation.x = 0.08;
  cockpit.add(hood);

  // Sculpted hood side fenders
  for (const sx of [-0.74, 0.74]) {
    const fender = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.16, 1.45), hoodMat);
    fender.position.set(sx, -0.52, -1.62);
    fender.rotation.x = 0.06;
    cockpit.add(fender);

    // Subtle glowing jade DRL accent strip
    const drl = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.03, 0.08), trimMat);
    drl.position.set(sx, -0.49, -2.35);
    cockpit.add(drl);
  }

  // Dashboard rim
  const dash = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.22, 0.45), dashMat);
  dash.position.set(0, -0.52, -0.78);
  cockpit.add(dash);

  // Steering wheel (rotates with A/D steering!)
  const wheelGroup = new THREE.Group();
  wheelGroup.position.set(-0.34, -0.44, -0.62);
  wheelGroup.rotation.x = -0.35;

  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.022, 8, 20), dashMat);
  const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.03, 0.025), trimMat);
  wheelGroup.add(rim, spoke);
  cockpit.add(wheelGroup);

  // Real dynamic headlights (SpotLight) illuminating Guilin streets at night!
  const headlight = new THREE.SpotLight(0xfff4d6, 0, 58, Math.PI * 0.28, 0.45, 1.4);
  headlight.position.set(0, -0.35, -1.8);
  const target = new THREE.Object3D();
  target.position.set(0, -1.1, -18);
  cockpit.add(target);
  headlight.target = target;
  cockpit.add(headlight);

  return { cockpit, wheelGroup, headlight };
}

/**
 * GTA-style Rotating Radar Minimap Renderer
 */
function createMinimapRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2;
  const scale = 0.72; // pixels per world unit

  const landmarks = [
    { x: -24, z: 84, color: '#ebb75a', label: '象' },
    { x: -21, z: 32, color: '#ffca57', label: '塔' },
    { x: 3, z: -56, color: '#e05a4f', label: '王' },
    { x: 30.8, z: 0.1, color: '#63d7c0', label: '桥' },
    { x: 21.5, z: -13.5, color: '#ff9f43', label: '楼' },
    { x: -68, z: 6, color: '#8ad8ff', label: '门' }
  ];

  function draw(px, pz, yaw) {
    ctx.clearRect(0, 0, w, h);

    ctx.save();
    // Circular radar clip
    ctx.beginPath();
    ctx.arc(cx, cy, cx - 2, 0, Math.PI * 2);
    ctx.clip();

    // Dark jade tactical background
    ctx.fillStyle = '#0d1e24';
    ctx.fillRect(0, 0, w, h);

    // Rotate world around player heading (forward = up on radar)
    ctx.translate(cx, cy);
    ctx.rotate(yaw);

    const toX = (wx) => (wx - px) * scale;
    const toY = (wz) => (wz - pz) * scale;

    // 1. Draw Li River
    ctx.strokeStyle = '#1f6e73';
    ctx.lineWidth = 30 * scale;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let z = -200; z <= 200; z += 16) {
      const rx = getLiRiverCenterX(z);
      if (z === -200) ctx.moveTo(toX(rx), toY(z));
      else ctx.lineTo(toX(rx), toY(z));
    }
    ctx.stroke();

    // 2. Draw Peach Blossom River
    ctx.lineWidth = 14 * scale;
    ctx.beginPath();
    for (let x = -200; x <= 40; x += 16) {
      const rz = getPeachRiverCenterZ(x);
      if (x === -200) ctx.moveTo(toX(x), toY(rz));
      else ctx.lineTo(toX(x), toY(rz));
    }
    ctx.stroke();

    // 3. Draw Real Shan Lake & Rong Lake (strictly south of 杉湖北路 and between 榕湖北/南路!)
    ctx.fillStyle = '#258285';
    ctx.beginPath();
    ctx.ellipse(toX(-25), toY(45), 12.5 * scale, 8.5 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(toX(-64), toY(18), 19 * scale, 8.2 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // 4. Draw ALL 264 Real Curved Vector Roads (including trunk 中山中路/阳桥!)
    for (const rd of REAL_ROADS) {
      const isTrunk = rd.type === 'trunk';
      const isMajor = isTrunk || rd.type === 'primary' || rd.type === 'secondary';
      ctx.strokeStyle = isTrunk
        ? 'rgba(255, 224, 130, 0.88)'
        : isMajor
          ? 'rgba(232, 245, 240, 0.72)'
          : 'rgba(175, 205, 198, 0.35)';
      ctx.lineWidth = isTrunk ? 3.2 : isMajor ? 2.4 : 1.2;
      ctx.beginPath();
      for (let i = 0; i < rd.pts.length; i++) {
        const rx = toX(rd.pts[i][0]);
        const ry = toY(rd.pts[i][1]);
        if (i === 0) ctx.moveTo(rx, ry);
        else ctx.lineTo(rx, ry);
      }
      ctx.stroke();
    }

    // 5. Landmark Blips
    for (const lm of landmarks) {
      const lx = toX(lm.x);
      const ly = toY(lm.z);
      ctx.fillStyle = lm.color;
      ctx.beginPath();
      ctx.arc(lx, ly, 4.2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // Subtle radar range ring
    ctx.strokeStyle = 'rgba(78, 196, 167, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, cx - 2, 0, Math.PI * 2);
    ctx.stroke();

    // Player FOV cone
    ctx.fillStyle = 'rgba(78, 196, 167, 0.16)';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, 34, -Math.PI * 0.72, -Math.PI * 0.28);
    ctx.closePath();
    ctx.fill();

    // Player Arrow at center
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 7);
    ctx.lineTo(cx + 5, cy + 5);
    ctx.lineTo(cx, cy + 2);
    ctx.lineTo(cx - 5, cy + 5);
    ctx.closePath();
    ctx.fill();

    // North compass tick on ring edge
    const northAngle = yaw - Math.PI / 2;
    const nx = cx + Math.cos(northAngle) * (cx - 11);
    const ny = cy + Math.sin(northAngle) * (cy - 11);
    ctx.fillStyle = '#ebb75a';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('N', nx, ny);
  }

  return { draw };
}

/**
 * Creates an articulated stylized 3D character avatar for Third-Person Walk/Sprint Mode
 */
function createPlayerAvatar() {
  const root = new THREE.Group();
  root.visible = false;

  const jacketMat = new THREE.MeshStandardMaterial({ color: 0x1e4d4b, roughness: 0.6 });
  const shirtMat = new THREE.MeshStandardMaterial({ color: 0xedf2f0, roughness: 0.7 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: 0x262c34, roughness: 0.8 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xf0c7a5, roughness: 0.7 });
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x1c1c20, roughness: 0.85 });
  const packMat = new THREE.MeshStandardMaterial({ color: 0xc98b32, roughness: 0.7 });
  const shoeMat = new THREE.MeshStandardMaterial({ color: 0xe6ecea, roughness: 0.65 });

  // Torso
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.72, 0.3), jacketMat);
  torso.position.y = 1.16;
  torso.castShadow = true;
  root.add(torso);

  // Subtle front shirt stripe
  const shirt = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.68, 0.315), shirtMat);
  shirt.position.y = 1.16;
  root.add(shirt);

  // Traveler backpack
  const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.52, 0.2), packMat);
  backpack.position.set(0, 1.18, 0.22);
  backpack.castShadow = true;
  root.add(backpack);

  // Head + Hair
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 12), skinMat);
  head.position.y = 1.72;
  head.castShadow = true;
  root.add(head);

  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.215, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.58), hairMat);
  hair.position.set(0, 1.75, 0.02);
  root.add(hair);

  // Articulated Arms (pivoting at shoulder)
  function makeLimb(w, h, d, mat, yOffset) {
    const pivot = new THREE.Group();
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.y = yOffset;
    mesh.castShadow = true;
    pivot.add(mesh);
    return pivot;
  }

  const leftArm = makeLimb(0.16, 0.62, 0.16, jacketMat, -0.28);
  leftArm.position.set(-0.37, 1.46, 0);
  root.add(leftArm);

  const rightArm = makeLimb(0.16, 0.62, 0.16, jacketMat, -0.28);
  rightArm.position.set(0.37, 1.46, 0);
  root.add(rightArm);

  // Articulated Legs (pivoting at hip)
  const leftLeg = makeLimb(0.2, 0.76, 0.2, pantsMat, -0.38);
  leftLeg.position.set(-0.15, 0.8, 0);
  const leftShoe = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.12, 0.3), shoeMat);
  leftShoe.position.set(0, -0.74, -0.05);
  leftLeg.add(leftShoe);
  root.add(leftLeg);

  const rightLeg = makeLimb(0.2, 0.76, 0.2, pantsMat, -0.38);
  rightLeg.position.set(0.15, 0.8, 0);
  const rightShoe = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.12, 0.3), shoeMat);
  rightShoe.position.set(0, -0.74, -0.05);
  rightLeg.add(rightShoe);
  root.add(rightLeg);

  return { root, leftArm, rightArm, leftLeg, rightLeg };
}

/**
 * Creates a sleek GTA-style 3D Sports Cruiser Car for Third-Person Drive Mode
 */
function createExteriorCruiserCar() {
  const car = new THREE.Group();
  car.visible = false;

  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: 0x11454d,
    metalness: 0.68,
    roughness: 0.18,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08
  });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x122633,
    metalness: 0.2,
    roughness: 0.06,
    clearcoat: 1.0,
    transparent: true,
    opacity: 0.84
  });
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x181a1e, roughness: 0.8 });
  const rimMat = new THREE.MeshStandardMaterial({ color: 0xcfd8dc, metalness: 0.8, roughness: 0.25 });
  const headMat = new THREE.MeshStandardMaterial({
    color: 0xfff8dc,
    emissive: 0xfff0b8,
    emissiveIntensity: 1.6
  });
  const tailMat = new THREE.MeshStandardMaterial({
    color: 0xff3b3b,
    emissive: 0xff1e1e,
    emissiveIntensity: 1.8
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: 0x4ec4a7,
    emissive: 0x2ec4a2,
    emissiveIntensity: 0.9
  });

  // Lower sculpted chassis (faces -Z forward!)
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.92, 0.62, 4.35), bodyMat);
  chassis.position.y = 0.58;
  chassis.castShadow = true;
  chassis.receiveShadow = true;
  car.add(chassis);

  // Sleek aerodynamic cabin
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.58, 0.56, 2.05), glassMat);
  cabin.position.set(0, 1.12, 0.15);
  cabin.castShadow = true;
  car.add(cabin);

  // Roof panel
  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.08, 1.4), bodyMat);
  roof.position.set(0, 1.42, 0.22);
  car.add(roof);

  // Rear spoiler
  const spoiler = new THREE.Mesh(new THREE.BoxGeometry(1.86, 0.07, 0.28), bodyMat);
  spoiler.position.set(0, 1.06, 2.04);
  car.add(spoiler);

  // Side jade neon accent strips
  for (const sx of [-0.97, 0.97]) {
    const strip = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.06, 2.6), trimMat);
    strip.position.set(sx, 0.36, 0);
    car.add(strip);
  }

  // Headlights (front at -Z) & Tail light bar (rear at +Z)
  for (const sx of [-0.66, 0.66]) {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.14, 0.08), headMat);
    hl.position.set(sx, 0.64, -2.18);
    car.add(hl);
  }
  const tailBar = new THREE.Mesh(new THREE.BoxGeometry(1.76, 0.14, 0.08), tailMat);
  tailBar.position.set(0, 0.72, 2.18);
  car.add(tailBar);

  // Rear lower jade accent diffuser strip for crisp night silhouette
  const rearDiffuser = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.06, 0.08), trimMat);
  rearDiffuser.position.set(0, 0.36, 2.19);
  car.add(rearDiffuser);

  // 4 Wheels
  const wheels = [];
  const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.28, 14);
  wheelGeo.rotateZ(Math.PI / 2);
  const rimGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.3, 8);
  rimGeo.rotateZ(Math.PI / 2);

  const wheelCoords = [
    [-0.95, 0.35, -1.35],
    [0.95, 0.35, -1.35],
    [-0.95, 0.35, 1.35],
    [0.95, 0.35, 1.35]
  ];
  for (const [wx, wy, wz] of wheelCoords) {
    const wg = new THREE.Group();
    wg.position.set(wx, wy, wz);
    wg.add(new THREE.Mesh(wheelGeo, wheelMat), new THREE.Mesh(rimGeo, rimMat));
    car.add(wg);
    wheels.push(wg);
  }

  // Exterior headlights SpotLight pointing forward (-Z)
  const carHeadlight = new THREE.SpotLight(0xfff4d6, 0, 62, Math.PI * 0.3, 0.45, 1.4);
  carHeadlight.position.set(0, 0.85, -2.1);
  const carTarget = new THREE.Object3D();
  carTarget.position.set(0, 0.1, -20);
  car.add(carTarget);
  carHeadlight.target = carTarget;
  car.add(carHeadlight);

  return { car, wheels, carHeadlight };
}

/**
 * Main GTA-style First-Person & Third-Person Immersive Street Roaming Controller
 */
export function createFirstPersonController(camera, domElement, scene, physics = null, callbacks = {}) {
  let active = false;
  let driveMode = false; // false = Walk/Sprint, true = Street Cruiser Drive
  let viewMode = 'first'; // 'first' | 'third'
  let pointerLocked = false;
  let isDraggingLook = false;
  let lastMouse = { x: 0, y: 0 };

  const playerPos = new THREE.Vector3(12, 0.55, 76);
  const velocity = new THREE.Vector3();
  let verticalVel = 0;
  let isGrounded = true;
  let yaw = -Math.PI * 0.48;
  let pitch = 0.05;
  let avatarYaw = -Math.PI * 0.48;
  let bobTimer = 0;
  let currentSpeedKmh = 0;
  let steerVisual = 0;

  const keys = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    sprint: false,
    jump: false
  };

  // Attach first-person cruiser cockpit to camera
  const { cockpit, wheelGroup, headlight } = createCruiserCockpit();
  camera.add(cockpit);
  scene.add(camera);

  // Add third-person 3D character avatar & exterior sports car to scene
  const avatar = createPlayerAvatar();
  scene.add(avatar.root);

  const exteriorCar = createExteriorCruiserCar();
  scene.add(exteriorCar.car);

  // Minimap
  const minimapCanvas = document.getElementById('roam-minimap');
  const minimap = minimapCanvas ? createMinimapRenderer(minimapCanvas) : null;

  // HUD elements
  const hudDistrictTitle = document.getElementById('roam-district-title');
  const hudDistrictSub = document.getElementById('roam-district-sub');
  const hudSpeed = document.getElementById('roam-speed');
  const hudModeBadge = document.getElementById('roam-mode-badge');
  const hudLockHint = document.getElementById('roam-lock-hint');
  const hudReticle = document.querySelector('.roam-reticle');
  const btnDriveToggle = document.getElementById('btn-roam-drive');
  const btnViewToggle = document.getElementById('btn-roam-view');

  let lastDistrictKey = '';

  function syncVisualMeshes() {
    const isThird = active && viewMode === 'third';
    cockpit.visible = active && driveMode && !isThird;
    avatar.root.visible = isThird && !driveMode;
    exteriorCar.car.visible = isThird && driveMode;
    if (hudReticle) {
      hudReticle.classList.toggle('hidden', isThird);
    }
    if (btnViewToggle) {
      btnViewToggle.textContent = viewMode === 'third' ? '第三人称 (V)' : '第一人称 (V)';
      btnViewToggle.classList.toggle('active', viewMode === 'third');
    }
  }

  function teleportTo(spawn) {
    playerPos.set(spawn.pos[0], spawn.pos[1], spawn.pos[2]);
    const gy = getStreetGroundY(playerPos.x, playerPos.z);
    if (gy !== null) playerPos.y = gy;
    if (physics) {
      physics.teleportPlayer(playerPos.x, playerPos.y, playerPos.z);
    }
    yaw = spawn.yaw;
    avatarYaw = spawn.yaw;
    pitch = spawn.pitch;
    velocity.set(0, 0, 0);
    verticalVel = 0;
    isGrounded = true;
    applyCameraTransform(0);
  }

  function setDriveMode(enabled) {
    driveMode = enabled;
    if (driveMode) {
      avatarYaw = yaw;
    }
    syncVisualMeshes();
    if (hudModeBadge) {
      hudModeBadge.textContent = driveMode ? '敞篷巡游 DRIVE' : '街景步行 WALK';
      hudModeBadge.classList.toggle('drive', driveMode);
    }
    if (btnDriveToggle) {
      btnDriveToggle.textContent = driveMode ? '切换步行 (C)' : '切换驾车 (C)';
      btnDriveToggle.classList.toggle('active', driveMode);
    }
  }

  function setViewMode(mode) {
    viewMode = mode === 'third' ? 'third' : 'first';
    if (viewMode === 'third' && pitch > 0.05) {
      pitch = -0.14; // Slight cinematic downward chase angle
    }
    syncVisualMeshes();
    applyCameraTransform(0);
  }

  function toggleViewMode() {
    setViewMode(viewMode === 'first' ? 'third' : 'first');
  }

  function enter(spawnId = 'jiefang-bridge') {
    if (active) return;
    active = true;
    const spawn = ROAM_SPAWNS.find((s) => s.id === spawnId) || ROAM_SPAWNS[0];
    teleportTo(spawn);
    setDriveMode(false);
    syncVisualMeshes();
    camera.fov = 64;
    camera.updateProjectionMatrix();

    if (callbacks.onEnter) callbacks.onEnter();
    requestLock();
  }

  function exit() {
    if (!active) return;
    active = false;
    cockpit.visible = false;
    avatar.root.visible = false;
    exteriorCar.car.visible = false;
    headlight.intensity = 0;
    exteriorCar.carHeadlight.intensity = 0;
    if (document.pointerLockElement === domElement) {
      document.exitPointerLock();
    }
    camera.fov = 48;
    camera.updateProjectionMatrix();
    Object.keys(keys).forEach((k) => (keys[k] = false));
    if (callbacks.onExit) callbacks.onExit();
  }

  function requestLock() {
    if (!active) return;
    if (domElement.requestPointerLock) {
      try {
        const res = domElement.requestPointerLock();
        if (res && typeof res.catch === 'function') {
          res.catch(() => {});
        }
      } catch {
        // Fallback to drag-look if pointer lock is blocked
      }
    }
  }

  const chaseLookTarget = new THREE.Vector3();

  function applyCameraTransform(bobOffset) {
    // Update 3D third-person avatar / car transforms
    avatar.root.position.copy(playerPos);
    avatar.root.rotation.y = avatarYaw;

    exteriorCar.car.position.copy(playerPos);
    exteriorCar.car.rotation.y = yaw;

    if (viewMode === 'third') {
      // Classic GTA over-the-shoulder / chase camera orbiting behind player/car
      const horizSpeed = Math.hypot(velocity.x, velocity.z);
      const baseDist = driveMode ? 8.2 + Math.min(2.6, horizSpeed * 0.08) : 5.4;
      const focusHeight = driveMode ? 1.55 : 1.72;
      const chasePitch = THREE.MathUtils.clamp(-pitch + 0.22, 0.06, 0.85);

      const horizDist = Math.cos(chasePitch) * baseDist;
      const vertOffset = Math.sin(chasePitch) * baseDist;

      // Camera positioned behind look yaw (+sin(yaw), +cos(yaw) is backward since forward is -sin, -cos)
      const camX = playerPos.x + Math.sin(yaw) * horizDist;
      const camZ = playerPos.z + Math.cos(yaw) * horizDist;
      const groundUnderCam = getStreetGroundY(camX, camZ);
      const minCamY = (groundUnderCam !== null ? groundUnderCam : 0.4) + 0.85;
      const camY = Math.max(minCamY, playerPos.y + focusHeight + vertOffset);

      camera.position.set(camX, camY, camZ);
      chaseLookTarget.set(playerPos.x, playerPos.y + focusHeight, playerPos.z);
      camera.lookAt(chaseLookTarget);
    } else {
      const eyeHeight = driveMode ? 1.58 : 1.92;
      camera.position.set(playerPos.x, playerPos.y + eyeHeight + bobOffset, playerPos.z);
      camera.rotation.order = 'YXZ';
      camera.rotation.y = yaw;
      camera.rotation.x = pitch;
      camera.rotation.z = driveMode ? -steerVisual * 0.025 : 0;
    }
  }

  // Pointer Lock & Mouse Look Events
  document.addEventListener('pointerlockchange', () => {
    pointerLocked = document.pointerLockElement === domElement;
    if (hudLockHint) {
      hudLockHint.classList.toggle('hidden', pointerLocked || !active);
    }
  });

  domElement.addEventListener('mousedown', (e) => {
    if (!active) return;
    if (e.button === 0) {
      isDraggingLook = true;
      lastMouse = { x: e.clientX, y: e.clientY };
      if (!pointerLocked) {
        requestLock();
      }
    }
  });

  window.addEventListener('mouseup', () => {
    isDraggingLook = false;
  });

  window.addEventListener('mousemove', (e) => {
    if (!active) return;
    let dx = 0;
    let dy = 0;
    if (pointerLocked) {
      dx = e.movementX || 0;
      dy = e.movementY || 0;
    } else if (isDraggingLook) {
      dx = e.clientX - lastMouse.x;
      dy = e.clientY - lastMouse.y;
      lastMouse = { x: e.clientX, y: e.clientY };
    } else {
      return;
    }

    const sensitivity = 0.0024;
    yaw -= dx * sensitivity;
    pitch = THREE.MathUtils.clamp(pitch - dy * sensitivity, -Math.PI * 0.36, Math.PI * 0.42);
  });

  // Keyboard controls
  function onKey(e, pressed) {
    if (!active) return;
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        keys.forward = pressed;
        break;
      case 'KeyS':
      case 'ArrowDown':
        keys.backward = pressed;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        keys.left = pressed;
        break;
      case 'KeyD':
      case 'ArrowRight':
        keys.right = pressed;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        keys.sprint = pressed;
        break;
      case 'Space':
        if (pressed && !driveMode) {
          if (physics) {
            if (physics.isGrounded() || Math.abs(physics.playerBody.velocity.y) < 0.15) {
              physics.playerBody.velocity.y = 9.2;
            }
          } else if (isGrounded) {
            verticalVel = 7.8;
            isGrounded = false;
          }
        }
        keys.jump = pressed;
        e.preventDefault();
        break;
      case 'KeyC':
        if (pressed) setDriveMode(!driveMode);
        break;
      case 'KeyV':
        if (pressed) toggleViewMode();
        break;
      case 'Escape':
        // First ESC releases pointer lock automatically; second ESC exits roam mode
        if (pressed && !pointerLocked) {
          exit();
        }
        break;
      default:
        if (pressed && e.key >= '1' && e.key <= '6') {
          const idx = parseInt(e.key, 10) - 1;
          if (ROAM_SPAWNS[idx]) teleportTo(ROAM_SPAWNS[idx]);
        }
        break;
    }
  }

  window.addEventListener('keydown', (e) => onKey(e, true));
  window.addEventListener('keyup', (e) => onKey(e, false));

  // Main per-frame update
  const forwardDir = new THREE.Vector3();
  const rightDir = new THREE.Vector3();
  const moveIntent = new THREE.Vector3();

  function update(dt, nightFactor) {
    if (!active) return;

    // Headlight intensity at dusk/night in drive mode
    const isThird = viewMode === 'third';
    headlight.intensity = driveMode && !isThird ? 4.5 + nightFactor * 38 : 0;
    exteriorCar.carHeadlight.intensity = driveMode && isThird ? 5.5 + nightFactor * 42 : 0;

    // Direction vectors on XZ plane
    forwardDir.set(-Math.sin(yaw), 0, -Math.cos(yaw)).normalize();
    rightDir.set(Math.cos(yaw), 0, -Math.sin(yaw)).normalize();

    moveIntent.set(0, 0, 0);
    if (driveMode) {
      // GTA Cruiser physics: smooth throttle + steering
      const steerInput = (keys.left ? 1 : 0) - (keys.right ? 1 : 0);
      steerVisual = THREE.MathUtils.lerp(steerVisual, steerInput, dt * 8);
      wheelGroup.rotation.z = steerVisual * 0.65;

      const throttle = (keys.forward ? 1 : 0) - (keys.backward ? 0.65 : 0);
      const maxSpeed = keys.sprint ? 36 : 23;
      const forwardSpeed = velocity.dot(forwardDir);

      // Steering turns car when moving
      if (Math.abs(forwardSpeed) > 0.5) {
        const turnRate = 1.65 * Math.min(1, Math.abs(forwardSpeed) / 10) * Math.sign(forwardSpeed);
        yaw += steerInput * turnRate * dt;
        forwardDir.set(-Math.sin(yaw), 0, -Math.cos(yaw)).normalize();
      }

      const targetSpeed = throttle * maxSpeed;
      const accel = throttle !== 0 ? 3.2 : 2.6;
      const newSpeed = THREE.MathUtils.lerp(forwardSpeed, targetSpeed, Math.min(1, dt * accel));
      velocity.copy(forwardDir).multiplyScalar(newSpeed);
    } else {
      // First-person Walk / Sprint physics
      if (keys.forward) moveIntent.add(forwardDir);
      if (keys.backward) moveIntent.sub(forwardDir);
      if (keys.right) moveIntent.add(rightDir);
      if (keys.left) moveIntent.sub(rightDir);

      if (moveIntent.lengthSq() > 0) {
        moveIntent.normalize();
      }

      const maxSpeed = keys.sprint ? 16.5 : 8.2;
      const targetVx = moveIntent.x * maxSpeed;
      const targetVz = moveIntent.z * maxSpeed;
      const damping = moveIntent.lengthSq() > 0 ? 10.0 : 12.0;

      velocity.x = THREE.MathUtils.lerp(velocity.x, targetVx, Math.min(1, dt * damping));
      velocity.z = THREE.MathUtils.lerp(velocity.z, targetVz, Math.min(1, dt * damping));
    }

    if (physics) {
      // Drive real cannon-es rigid-body physics (handles sloped ramps, bridge railings, buildings, mountains & air-walls!)
      physics.playerBody.velocity.x = velocity.x;
      physics.playerBody.velocity.z = velocity.z;
      physics.step(dt);

      const bp = physics.playerBody.position;
      playerPos.set(bp.x, bp.y - physics.playerRadius, bp.z);
      // Read back resolved velocity after collisions so wall impacts damp cleanly
      velocity.x = physics.playerBody.velocity.x;
      velocity.z = physics.playerBody.velocity.z;
      isGrounded = physics.isGrounded();

      // Safety clamp: prevent ever falling below terrain if squeezed at an extreme corner
      if (playerPos.y < 0.45) {
        playerPos.y = 0.55;
        physics.playerBody.position.y = 0.55 + physics.playerRadius;
        physics.playerBody.velocity.y = Math.max(0, physics.playerBody.velocity.y);
        isGrounded = true;
      }
    } else {
      // Fallback non-physics movement
      const nextX = THREE.MathUtils.clamp(playerPos.x + velocity.x * dt, -165, 165);
      const nextZ = THREE.MathUtils.clamp(playerPos.z + velocity.z * dt, -155, 155);
      const groundNext = getStreetGroundY(nextX, nextZ);
      if (groundNext !== null) {
        playerPos.x = nextX;
        playerPos.z = nextZ;
      }
      const currentGround = getStreetGroundY(playerPos.x, playerPos.z) ?? 0.55;
      if (!isGrounded) {
        verticalVel -= 22.0 * dt;
        playerPos.y += verticalVel * dt;
        if (playerPos.y <= currentGround) {
          playerPos.y = currentGround;
          verticalVel = 0;
          isGrounded = true;
        }
      } else {
        playerPos.y = THREE.MathUtils.lerp(playerPos.y, currentGround, Math.min(1, dt * 14));
      }
    }

    // Smoothly pitch exterior car to match sloped bridge ramps!
    if (driveMode) {
      const fY = getBridgeSurfaceY(playerPos.x + forwardDir.x * 1.5, playerPos.z + forwardDir.z * 1.5, 0.5) ?? 0.55;
      const bY = getBridgeSurfaceY(playerPos.x - forwardDir.x * 1.5, playerPos.z - forwardDir.z * 1.5, 0.5) ?? 0.55;
      const slopePitch = Math.atan2(fY - bY, 3.0);
      exteriorCar.car.rotation.x = THREE.MathUtils.lerp(exteriorCar.car.rotation.x, slopePitch, Math.min(1, dt * 12));
    } else {
      exteriorCar.car.rotation.x = 0;
    }

    // Speed & dynamic GTA FOV + Head-bobbing
    const horizSpeed = Math.hypot(velocity.x, velocity.z);
    currentSpeedKmh = Math.round(horizSpeed * 3.1);

    const targetFov = driveMode
      ? 66 + Math.min(14, horizSpeed * 0.42)
      : keys.sprint && horizSpeed > 4
        ? 71
        : 64;
    if (Math.abs(camera.fov - targetFov) > 0.05) {
      camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, Math.min(1, dt * 6));
      camera.updateProjectionMatrix();
    }

    let bobOffset = 0;
    if (!driveMode && isGrounded && horizSpeed > 0.6) {
      bobTimer += dt * (keys.sprint ? 12.5 : 8.5);
      bobOffset = Math.sin(bobTimer) * (keys.sprint ? 0.095 : 0.055);
    } else if (driveMode && horizSpeed > 1) {
      bobTimer += dt * 18;
      bobOffset = Math.sin(bobTimer) * 0.015;
    }

    // Animate third-person avatar limbs & facing direction, or car wheels
    if (!driveMode) {
      if (horizSpeed > 0.4) {
        const targetAvatarYaw = Math.atan2(-velocity.x, -velocity.z);
        let diff = targetAvatarYaw - avatarYaw;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        avatarYaw += diff * Math.min(1, dt * 10);

        const swing = Math.sin(bobTimer) * (keys.sprint ? 0.85 : 0.55);
        avatar.leftLeg.rotation.x = swing;
        avatar.rightLeg.rotation.x = -swing;
        avatar.leftArm.rotation.x = -swing * 0.85;
        avatar.rightArm.rotation.x = swing * 0.85;
      } else {
        avatar.leftLeg.rotation.x = THREE.MathUtils.lerp(avatar.leftLeg.rotation.x, 0, dt * 10);
        avatar.rightLeg.rotation.x = THREE.MathUtils.lerp(avatar.rightLeg.rotation.x, 0, dt * 10);
        avatar.leftArm.rotation.x = THREE.MathUtils.lerp(avatar.leftArm.rotation.x, 0, dt * 10);
        avatar.rightArm.rotation.x = THREE.MathUtils.lerp(avatar.rightArm.rotation.x, 0, dt * 10);
      }
    } else {
      const wheelSpin = velocity.dot(forwardDir) * dt * 2.4;
      for (const w of exteriorCar.wheels) {
        w.rotation.x -= wheelSpin;
      }
    }

    applyCameraTransform(bobOffset);

    // Update GTA Street HUD
    if (hudSpeed) {
      hudSpeed.textContent = `${currentSpeedKmh}`;
    }
    if (hudModeBadge && !driveMode) {
      hudModeBadge.textContent = keys.sprint && horizSpeed > 5 ? '疾驰奔跑 SPRINT' : '街景步行 WALK';
    }

    const district = getDistrictInfo(playerPos.x, playerPos.z);
    if (district.title !== lastDistrictKey) {
      lastDistrictKey = district.title;
      if (hudDistrictTitle) hudDistrictTitle.textContent = district.title;
      if (hudDistrictSub) hudDistrictSub.textContent = district.sub;
    }

    if (minimap) {
      minimap.draw(playerPos.x, playerPos.z, yaw);
    }
  }

  return {
    enter,
    exit,
    teleportTo,
    setDriveMode,
    setViewMode,
    toggleViewMode,
    update,
    isActive: () => active,
    isDriveMode: () => driveMode,
    getViewMode: () => viewMode
  };
}
