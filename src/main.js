import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { LANDMARKS, isWaterOrShore, isOnRoad } from './data/landmarksData.js';
import { createTerrainAndWater } from './scene/terrainAndWater.js';
import { createKarstMountains } from './scene/karstMountains.js';
import { createLandmarks } from './scene/landmarks.js';
import { createUrbanCity } from './scene/urbanCity.js';
import { createAtmosphere } from './scene/atmosphere.js';
import { createSimulation } from './scene/simulation.js';
import { createPhysicsWorld } from './scene/physicsWorld.js';
import { createFirstPersonController, ROAM_SPAWNS } from './scene/firstPersonMode.js';
import { createGuilinEnvironment } from './scene/materialsLibrary.js';
import { createBaiduMap3DManager } from './bmap/baiduMap3D.js';
import { BMAP_ROAM_SPAWNS } from './bmap/coordTransform.js';
import { createLandmarkEditor } from './scene/landmarkEditor.js';
import { createGuilinStreetscape } from './scene/streetscape.js';
import { createZoneManager, findZoneForLandmark } from './zones/zoneManager.js';

// =========================================================
// 1. RENDERER, SCENE, CAMERA & CONTROLS
// =========================================================
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.5, 1100);
camera.position.set(-95, 92, 138);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
container.appendChild(renderer.domElement);

// Bake procedural Guilin sky environment map for realistic PBR reflections
scene.environment = createGuilinEnvironment(renderer);
scene.environmentIntensity = 0.72;

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.maxPolarAngle = Math.PI * 0.482; // Prevent camera going underwater
controls.minDistance = 14;
controls.maxDistance = 320;
controls.target.set(-5, 8, 12);
controls.update();

// =========================================================
// 2. BUILD GUILIN 3D CITY MODULES & CANNON-ES PHYSICS WORLD
// =========================================================
const physicsWorld = createPhysicsWorld();
const atmosphere = createAtmosphere(scene);
const terrainSystem = createTerrainAndWater(scene);
const karstSystem = createKarstMountains(scene, physicsWorld);
const landmarkSystem = createLandmarks(scene, physicsWorld);
const urbanSystem = createUrbanCity(scene, physicsWorld);
const streetscapeSystem = createGuilinStreetscape(scene, physicsWorld);
const simSystem = createSimulation(scene);

// Saved Orbit camera state when entering First-Person Roaming Mode
let savedOrbitPos = new THREE.Vector3(-95, 92, 138);
let savedOrbitTarget = new THREE.Vector3(-5, 8, 12);

const roamHudEl = document.getElementById('roam-hud');
const firstPerson = createFirstPersonController(camera, renderer.domElement, scene, physicsWorld, {
  onEnter: () => {
    savedOrbitPos.copy(camera.position);
    savedOrbitTarget.copy(controls.target);
    camFlight = null;
    controls.enabled = false;
    buildCursor.visible = false;
    closeLandmarkCard();
    hudElements.forEach((el) => el.classList.add('hidden'));
    restoreHudBtn.classList.add('hidden');
    roamHudEl.classList.remove('hidden');
    renderer.domElement.style.cursor = 'crosshair';
  },
  onExit: () => {
    roamHudEl.classList.add('hidden');
    hudElements.forEach((el) => el.classList.remove('hidden'));
    camera.position.copy(savedOrbitPos);
    controls.target.copy(savedOrbitTarget);
    controls.enabled = true;
    controls.update();
    renderer.domElement.style.cursor = state.buildMode === 'inspect' ? 'grab' : 'crosshair';
  }
});

const bmapContainer = document.getElementById('bmap-container');
const baiduMap3D = createBaiduMap3DManager(bmapContainer);

// Interactive 3D Landmark Position / Rotation / Scale Editor
const landmarkEditor = createLandmarkEditor(scene, camera, renderer, controls, [
  ...karstSystem.editableItems,
  ...landmarkSystem.editableItems
]);

// =========================================================
// 2B. REGIONAL ZONE INSTANCES (1:1 高精区域副本系统)
// =========================================================
const zoneDrawerEl = document.getElementById('zone-drawer');
const zoneCardsEl = document.getElementById('zone-cards');
const zoneActiveBarEl = document.getElementById('zone-active-bar');
const zoneBarTitleEl = document.getElementById('zone-bar-title');
const zoneBarSubEl = document.getElementById('zone-bar-sub');
const zoneVpRowEl = document.getElementById('zone-vp-row');
const btnToggleZones = document.getElementById('btn-toggle-zones');
const btnCloseZones = document.getElementById('btn-close-zones');
const btnDrawerReturnWorld = document.getElementById('btn-drawer-return-world');
const btnExitZone = document.getElementById('btn-exit-zone');
const btnZoneWalk = document.getElementById('btn-zone-walk');
const btnCardEnterZone = document.getElementById('btn-card-enter-zone');

const worldSceneGroups = [
  terrainSystem.group,
  karstSystem.group,
  landmarkSystem.group,
  urbanSystem.group,
  streetscapeSystem.group,
  simSystem.group
];

const zoneManager = createZoneManager({
  scene,
  camera,
  controls,
  worldGroups: worldSceneGroups,
  onZoneChange: (activeZone, isWalk) => {
    const inZone = activeZone !== null;
    document.getElementById('landmark-dock').classList.toggle('hidden', inZone);
    zoneActiveBarEl.classList.toggle('hidden', !inZone);
    btnDrawerReturnWorld.classList.toggle('hidden', !inZone);
    btnToggleZones.classList.toggle('active', inZone || !zoneDrawerEl.classList.contains('hidden'));

    if (inZone) {
      closeLandmarkCard();
      setEditorOpen(false);
      zoneBarTitleEl.textContent = activeZone.name;
      zoneBarSubEl.textContent = isWalk
        ? '第一视角漫游中：WASD 移动 · 按住鼠标左键环顾 · Shift 加速 · ESC 退出'
        : activeZone.subtitle;
      btnZoneWalk.classList.toggle('active', isWalk);
      btnZoneWalk.textContent = isWalk ? '🎥 退出漫游 (ESC)' : '🚶 副本第一视角 (WASD)';

      zoneVpRowEl.innerHTML = '';
      for (const vp of activeZone.viewpoints) {
        const vpBtn = document.createElement('button');
        vpBtn.className = 'roam-tp-btn';
        vpBtn.textContent = vp.name;
        vpBtn.addEventListener('click', () => {
          zoneManager.flyToViewpoint(vp);
          zoneVpRowEl.querySelectorAll('.roam-tp-btn').forEach((b) => b.classList.remove('active'));
          vpBtn.classList.add('active');
        });
        zoneVpRowEl.appendChild(vpBtn);
      }
    }

    // Highlight active card in zone drawer
    zoneCardsEl.querySelectorAll('.zone-card').forEach((c) => {
      c.classList.toggle('active', inZone && c.dataset.zoneId === activeZone.id);
    });
  }
});

// Populate Regional Zone Cards in Drawer
zoneManager.catalog.forEach((z) => {
  const card = document.createElement('button');
  card.className = 'zone-card';
  card.dataset.zoneId = z.id;
  card.innerHTML = `
    <div class="zone-card-head">
      <span class="zone-card-title">${z.name}</span>
      <span class="zone-card-badge">${z.badge}</span>
    </div>
    <div class="zone-card-desc">${z.desc}</div>
  `;
  card.addEventListener('click', () => {
    if (state.engineMode !== 'sandbox') switchEngineMode('sandbox');
    if (firstPerson.isActive()) firstPerson.exit();
    zoneManager.enterZone(z.id);
    zoneDrawerEl.classList.add('hidden');
  });
  zoneCardsEl.appendChild(card);
});

function setZoneDrawerOpen(open) {
  zoneDrawerEl.classList.toggle('hidden', !open);
  btnToggleZones.classList.toggle('active', open || zoneManager.isActive());
  if (open) setEditorOpen(false);
}

btnToggleZones.addEventListener('click', () => {
  setZoneDrawerOpen(zoneDrawerEl.classList.contains('hidden'));
});
btnCloseZones.addEventListener('click', () => setZoneDrawerOpen(false));
btnDrawerReturnWorld.addEventListener('click', () => {
  zoneManager.exitZone();
  setZoneDrawerOpen(false);
});
btnExitZone.addEventListener('click', () => zoneManager.exitZone());
btnZoneWalk.addEventListener('click', () => zoneManager.setZoneWalk(!zoneManager.isWalkActive()));

// =========================================================
// 3. INTERACTIVE STATE
// =========================================================
const state = {
  engineMode: 'sandbox', // Default: full custom Three.js 3D Guilin built on real map coordinates & proper architectural scale!
  timeOfDay: 10.5, // Start in bright scenic Guilin morning light
  autoTime: false,
  weather: 'clear', // clear | misty | rain
  boatDensity: 1.0,
  trafficDensity: 0.8,
  mistLevel: 0.35,
  urbanDensity: 0.85,
  buildMode: 'inspect', // inspect | pavilion | courtyard | modern | grove
  activeLandmarkId: 'overview',
  userBuiltCount: 0
};

urbanSystem.setUrbanDensity(state.urbanDensity);

// Smooth camera flight state
let camFlight = null;

function flyToLandmark(landmark, showCard = true) {
  state.activeLandmarkId = landmark.id;
  if (state.engineMode === 'bmap') {
    baiduMap3D.flyToLandmark(landmark.id);
  } else {
    camFlight = {
      startPos: camera.position.clone(),
      endPos: new THREE.Vector3(...landmark.cameraPos),
      startTarget: controls.target.clone(),
      endTarget: new THREE.Vector3(...landmark.cameraTarget),
      progress: 0,
      duration: 1.45
    };
  }

  // Highlight dock button
  document.querySelectorAll('.dock-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.id === landmark.id);
  });

  if (showCard && landmark.id !== 'overview') {
    openLandmarkCard(landmark);
  } else if (landmark.id === 'overview') {
    closeLandmarkCard();
  }
}

// Cancel flight if user grabs camera manually
controls.addEventListener('start', () => {
  camFlight = null;
});

// =========================================================
// 4. INTERACTIVE PLACEMENT CURSOR & RAYCASTING
// =========================================================
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

const buildRingGeo = new THREE.RingGeometry(2.6, 3.4, 24);
buildRingGeo.rotateX(-Math.PI / 2);
const buildRingMat = new THREE.MeshBasicMaterial({
  color: 0x4ec4a7,
  transparent: true,
  opacity: 0.8,
  side: THREE.DoubleSide
});
const buildCursor = new THREE.Mesh(buildRingGeo, buildRingMat);
buildCursor.visible = false;
buildCursor.position.y = 0.72;
scene.add(buildCursor);

let pointerDownPos = { x: 0, y: 0 };

renderer.domElement.addEventListener('pointerdown', (e) => {
  pointerDownPos = { x: e.clientX, y: e.clientY };
});

renderer.domElement.addEventListener('pointermove', (e) => {
  if (firstPerson.isActive() || state.buildMode === 'inspect') {
    buildCursor.visible = false;
    return;
  }
  pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);

  const hits = raycaster.intersectObject(terrainSystem.terrainMesh, false);
  if (hits.length > 0) {
    const p = hits[0].point;
    const valid = !isWaterOrShore(p.x, p.z, 3.8) && !isOnRoad(p.x, p.z, 3.2);
    buildCursor.position.set(p.x, Math.max(0.68, p.y + 0.15), p.z);
    buildRingMat.color.setHex(valid ? 0x4ec4a7 : 0xef5350);
    buildCursor.visible = true;
  } else {
    buildCursor.visible = false;
  }
});

renderer.domElement.addEventListener('pointerup', (e) => {
  if (firstPerson.isActive() || landmarkEditor.isActive()) return;
  const dragDist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
  if (dragDist > 6) return; // Ignore camera orbit drags

  pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);

  if (state.buildMode !== 'inspect') {
    const hits = raycaster.intersectObject(terrainSystem.terrainMesh, false);
    if (hits.length > 0) {
      const p = hits[0].point;
      const valid = !isWaterOrShore(p.x, p.z, 3.8) && !isOnRoad(p.x, p.z, 3.2);
      if (valid) {
        urbanSystem.placeUserStructure(state.buildMode, p.x, p.z);
        state.userBuiltCount++;
        updateTelemetry(simSystem.getTotalVessels());
      }
    }
    return;
  }

  // Inspect Landmark mode
  const inspectTargets = [
    landmarkSystem.group,
    karstSystem.group,
    terrainSystem.group
  ];
  const hits = raycaster.intersectObjects(inspectTargets, true);
  for (const hit of hits) {
    let obj = hit.object;
    while (obj) {
      if (obj.userData && obj.userData.landmarkId) {
        const lm = LANDMARKS.find((l) => l.id === obj.userData.landmarkId);
        if (lm) {
          openLandmarkCard(lm);
          return;
        }
      }
      obj = obj.parent;
    }
  }
});

// =========================================================
// 5. HUD & CONTROLS BINDING
// =========================================================
const dockEl = document.getElementById('landmark-dock');
LANDMARKS.forEach((lm, idx) => {
  const btn = document.createElement('button');
  btn.className = 'dock-btn' + (idx === 0 ? ' active' : '');
  btn.dataset.id = lm.id;
  btn.textContent = lm.name;
  btn.addEventListener('click', () => flyToLandmark(lm, true));
  dockEl.appendChild(btn);
});

const cardEl = document.getElementById('landmark-card');
const cardCat = document.getElementById('card-category');
const cardTitle = document.getElementById('card-title');
const cardEn = document.getElementById('card-en');
const cardElev = document.getElementById('card-elev');
const cardDesc = document.getElementById('card-desc');

let currentCardZoneId = null;
function openLandmarkCard(lm) {
  cardCat.textContent = lm.category;
  cardTitle.textContent = lm.name;
  cardEn.textContent = lm.enName;
  cardElev.textContent = lm.elevation;
  cardDesc.textContent = lm.description;

  const matchedZone = findZoneForLandmark(lm.id);
  currentCardZoneId = matchedZone ? matchedZone.id : null;
  if (matchedZone) {
    btnCardEnterZone.textContent = `✨ 进入「${matchedZone.name}」1:1 区域副本`;
    btnCardEnterZone.classList.remove('hidden');
  } else {
    btnCardEnterZone.classList.add('hidden');
  }

  cardEl.classList.remove('hidden');
}

btnCardEnterZone.addEventListener('click', () => {
  if (!currentCardZoneId) return;
  if (state.engineMode !== 'sandbox') switchEngineMode('sandbox');
  zoneManager.enterZone(currentCardZoneId);
});

function closeLandmarkCard() {
  cardEl.classList.add('hidden');
}

document.getElementById('btn-close-card').addEventListener('click', closeLandmarkCard);

// Time of Day slider & presets
const sliderTime = document.getElementById('slider-time');
const chkAutoTime = document.getElementById('chk-auto-time');
const timePresetBtns = document.querySelectorAll('[data-time]');

function syncTimeButtons() {
  timePresetBtns.forEach((b) => {
    const val = parseFloat(b.dataset.time);
    b.classList.toggle('active', Math.abs(state.timeOfDay - val) < 1.2);
  });
}

sliderTime.addEventListener('input', () => {
  state.timeOfDay = parseFloat(sliderTime.value);
  state.autoTime = false;
  chkAutoTime.checked = false;
  syncTimeButtons();
});

chkAutoTime.addEventListener('change', () => {
  state.autoTime = chkAutoTime.checked;
});

timePresetBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    state.timeOfDay = parseFloat(btn.dataset.time);
    sliderTime.value = state.timeOfDay;
    state.autoTime = false;
    chkAutoTime.checked = false;
    // Automatically pair morning preset with light mist
    if (state.timeOfDay < 7.0) {
      setWeather('misty');
    } else if (state.weather === 'misty' && state.timeOfDay > 9 && state.timeOfDay < 15) {
      setWeather('clear');
    }
    syncTimeButtons();
  });
});

// Weather presets
const weatherBtns = document.querySelectorAll('[data-weather]');
function setWeather(w) {
  state.weather = w;
  weatherBtns.forEach((b) => b.classList.toggle('active', b.dataset.weather === w));
  const aqiEl = document.getElementById('stat-aqi');
  if (w === 'rain') aqiEl.textContent = '优 · 16';
  else if (w === 'misty') aqiEl.textContent = '优 · 28';
  else aqiEl.textContent = '优 · 22';
}
weatherBtns.forEach((btn) => btn.addEventListener('click', () => setWeather(btn.dataset.weather)));

// Simulation sliders
const sliderBoats = document.getElementById('slider-boats');
const sliderTraffic = document.getElementById('slider-traffic');
const sliderMist = document.getElementById('slider-mist');
const sliderDensity = document.getElementById('slider-density');

sliderBoats.addEventListener('input', () => {
  state.boatDensity = parseFloat(sliderBoats.value);
  document.getElementById('val-boats').textContent = `${Math.round(state.boatDensity * 100)}%`;
});

sliderTraffic.addEventListener('input', () => {
  state.trafficDensity = parseFloat(sliderTraffic.value);
  document.getElementById('val-traffic').textContent = `${Math.round(state.trafficDensity * 100)}%`;
});

sliderMist.addEventListener('input', () => {
  state.mistLevel = parseFloat(sliderMist.value);
  document.getElementById('val-mist').textContent = `${Math.round(state.mistLevel * 100)}%`;
});

sliderDensity.addEventListener('input', () => {
  state.urbanDensity = parseFloat(sliderDensity.value);
  document.getElementById('val-density').textContent = `${Math.round(state.urbanDensity * 100)}%`;
  urbanSystem.setUrbanDensity(state.urbanDensity);
  updateTelemetry();
});

// Build mode buttons
const buildBtns = document.querySelectorAll('[data-build]');
const buildHint = document.getElementById('build-hint');
const buildHints = {
  inspect: '点击地标查看详情',
  pavilion: '点击空地放置中式亭台',
  courtyard: '点击空地修建岭南民居',
  modern: '点击空地新建现代楼宇',
  grove: '点击空地种植桂花林'
};

buildBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    state.buildMode = btn.dataset.build;
    buildBtns.forEach((b) => b.classList.toggle('active', b.dataset.build === state.buildMode));
    buildHint.textContent = buildHints[state.buildMode] || '';
    renderer.domElement.style.cursor = state.buildMode === 'inspect' ? 'grab' : 'crosshair';
    if (state.buildMode === 'inspect') buildCursor.visible = false;
  });
});

// Spawn extra boat / bamboo raft
document.getElementById('btn-spawn-boat').addEventListener('click', () => {
  const kind = Math.random() > 0.45 ? 'cruise' : 'raft';
  simSystem.spawnVessel(kind);
  updateTelemetry();
});

// Panel collapse & HUD visibility toggle
const panelBody = document.getElementById('panel-body');
const collapseBtn = document.getElementById('btn-collapse-panel');
collapseBtn.addEventListener('click', () => {
  const collapsed = panelBody.classList.toggle('collapsed');
  collapseBtn.textContent = collapsed ? '+' : '−';
});

const hudElements = [
  document.getElementById('hud-header'),
  document.getElementById('control-panel'),
  document.getElementById('landmark-dock')
];
const restoreHudBtn = document.getElementById('btn-restore-hud');

function toggleHud(forceVisible) {
  const isCurrentlyHidden = hudElements[0].classList.contains('hidden');
  const show = forceVisible !== undefined ? forceVisible : isCurrentlyHidden;
  hudElements.forEach((el) => el.classList.toggle('hidden', !show));
  if (!show) closeLandmarkCard();
  restoreHudBtn.classList.toggle('hidden', show);
}

document.getElementById('btn-toggle-hud').addEventListener('click', () => toggleHud(false));
restoreHudBtn.addEventListener('click', () => toggleHud(true));

// Keyboard shortcuts
window.addEventListener('keydown', (e) => {
  if (e.key === 'f' || e.key === 'F') {
    if (firstPerson.isActive()) firstPerson.exit();
    else firstPerson.enter('jiefang-bridge');
    return;
  }
  if (firstPerson.isActive()) return;

  if (e.key === 'e' || e.key === 'E') {
    if (state.engineMode === 'sandbox' && !firstPerson.isActive() && !zoneManager.isActive()) {
      const next = !landmarkEditor.isActive();
      landmarkEditor.setActive(next);
      document.getElementById('btn-toggle-editor').classList.toggle('active', next);
    }
    return;
  }
  if (e.key === 'z' || e.key === 'Z') {
    if (!firstPerson.isActive()) {
      setZoneDrawerOpen(zoneDrawerEl.classList.contains('hidden'));
    }
    return;
  }
  if (e.key === 'h' || e.key === 'H') {
    toggleHud();
  } else if (e.key === ' ') {
    state.autoTime = !state.autoTime;
    chkAutoTime.checked = state.autoTime;
  } else if (e.key >= '1' && e.key <= '8') {
    const lm = LANDMARKS[parseInt(e.key, 10) - 1];
    if (lm) flyToLandmark(lm, true);
  }
});

// Immersive First-Person / Baidu 3D Street Roaming UI bindings
function enterActiveRoam(spawnId = 'jiefang-bridge') {
  if (state.engineMode === 'bmap') {
    closeLandmarkCard();
    hudElements.forEach((el) => el.classList.add('hidden'));
    restoreHudBtn.classList.add('hidden');
    roamHudEl.classList.remove('hidden');
    baiduMap3D.enterRoam(spawnId);
  } else {
    firstPerson.enter(spawnId);
  }
}

function exitActiveRoam() {
  if (state.engineMode === 'bmap') {
    baiduMap3D.exitRoam();
    roamHudEl.classList.add('hidden');
    hudElements.forEach((el) => el.classList.remove('hidden'));
  } else {
    firstPerson.exit();
  }
}

document.getElementById('btn-enter-roam').addEventListener('click', () => {
  enterActiveRoam('jiefang-bridge');
});
document.getElementById('btn-exit-roam').addEventListener('click', () => {
  exitActiveRoam();
});
document.getElementById('btn-roam-view').addEventListener('click', () => {
  if (state.engineMode === 'sandbox') firstPerson.toggleViewMode();
});
document.getElementById('btn-roam-drive').addEventListener('click', () => {
  if (state.engineMode === 'bmap') baiduMap3D.toggleRoamDrive();
  else firstPerson.setDriveMode(!firstPerson.isDriveMode());
});

// Engine mode switcher (🗺 百度实景 3D vs 🏔 独立全 3D 沙盒)
const btnEngineBmap = document.getElementById('btn-engine-bmap');
const btnEngineSandbox = document.getElementById('btn-engine-sandbox');

async function switchEngineMode(mode) {
  if (firstPerson.isActive() || baiduMap3D.isRoamActive()) {
    exitActiveRoam();
  }
  state.engineMode = mode;
  btnEngineBmap.classList.toggle('active', mode === 'bmap');
  btnEngineSandbox.classList.toggle('active', mode === 'sandbox');
  if (mode === 'bmap') {
    await baiduMap3D.show();
    baiduMap3D.setTimeAtmosphere(state.timeOfDay);
  } else {
    baiduMap3D.hide();
  }
}

const btnToggleEditor = document.getElementById('btn-toggle-editor');
const btnCloseEditor = document.getElementById('btn-close-editor');
function setEditorOpen(open) {
  if (open && state.engineMode !== 'sandbox') {
    switchEngineMode('sandbox');
  }
  landmarkEditor.setActive(open);
  btnToggleEditor.classList.toggle('active', open);
  if (open) closeLandmarkCard();
}
btnToggleEditor.addEventListener('click', () => setEditorOpen(!landmarkEditor.isActive()));
btnCloseEditor.addEventListener('click', () => setEditorOpen(false));

btnEngineBmap.addEventListener('click', () => {
  setEditorOpen(false);
  if (zoneManager.isActive()) zoneManager.exitZone();
  setZoneDrawerOpen(false);
  switchEngineMode('bmap');
});
btnEngineSandbox.addEventListener('click', () => switchEngineMode('sandbox'));

// Default to our full custom 3D Guilin world (using exact real-world road coordinates + balanced 3D proportions);
// user can toggle 🗺 百度对照 anytime for 1-click Baidu Maps GL reference!
bmapContainer.classList.add('hidden');
btnEngineSandbox.classList.add('active');
btnEngineBmap.classList.remove('active');

const roamTimeBtns = document.querySelectorAll('[data-roam-time]');
function syncRoamTimeButtons() {
  roamTimeBtns.forEach((b) => {
    const val = parseFloat(b.dataset.roamTime);
    b.classList.toggle('active', Math.abs(state.timeOfDay - val) < 1.5);
  });
}

roamTimeBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    state.timeOfDay = parseFloat(btn.dataset.roamTime);
    sliderTime.value = state.timeOfDay;
    state.autoTime = false;
    chkAutoTime.checked = false;
    syncTimeButtons();
    syncRoamTimeButtons();
  });
});
syncRoamTimeButtons();

const tpBarEl = document.getElementById('roam-teleport-bar');
ROAM_SPAWNS.forEach((sp, i) => {
  const btn = document.createElement('button');
  btn.className = 'roam-tp-btn' + (sp.id === 'jiefang-bridge' ? ' active' : '');
  btn.textContent = `${i + 1}. ${sp.name}`;
  btn.addEventListener('click', () => {
    if (state.engineMode === 'bmap') {
      const bsp = BMAP_ROAM_SPAWNS[i];
      if (bsp) baiduMap3D.teleportRoam(bsp);
    } else {
      firstPerson.teleportTo(sp);
    }
    tpBarEl.querySelectorAll('.roam-tp-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
  });
  tpBarEl.appendChild(btn);
});

// Telemetry updater
const statTimeEl = document.getElementById('stat-time');
const statPopEl = document.getElementById('stat-pop');
const statBoatsEl = document.getElementById('stat-boats');
const statFpsEl = document.getElementById('stat-fps');

function formatClock(hours) {
  const h = Math.floor(((hours % 24) + 24) % 24);
  const m = Math.floor((hours - Math.floor(hours)) * 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function updateTelemetry(visibleBoats) {
  statTimeEl.textContent = formatClock(state.timeOfDay);
  const pop = (102 + state.urbanDensity * 38 + state.userBuiltCount * 0.45).toFixed(1);
  statPopEl.textContent = `${pop}万`;
  if (visibleBoats !== undefined) {
    statBoatsEl.textContent = `${visibleBoats} 艘`;
  }
}

// =========================================================
// 6. MAIN ANIMATION LOOP
// =========================================================
const clock = new THREE.Clock();
let fpsFrames = 0;
let fpsTimer = 0;

function updateNightIllumination(nightFactor) {
  // Twin Pagodas, Palace & Historic Lanterns
  for (const item of landmarkSystem.nightMaterials) {
    item.mat.emissiveIntensity = THREE.MathUtils.lerp(item.baseEmissive, item.nightEmissive, nightFactor);
  }
  for (const pl of landmarkSystem.pointLights) {
    pl.light.intensity = pl.nightIntensity * nightFactor;
  }

  // City building illuminated windows
  const winGlow = 0.04 + nightFactor * 1.45;
  for (const bMat of urbanSystem.buildingMaterials) {
    bMat.emissiveIntensity = winGlow;
  }

  // Streetlights, Bridge Arches, Mountain Pavilions, Streetscape Signs & Boat/Car Lights
  const streetGlow = 0.08 + nightFactor * 2.1;
  for (const m of urbanSystem.nightGlowMats) m.emissiveIntensity = streetGlow;
  for (const m of streetscapeSystem.nightGlowMats) m.emissiveIntensity = 0.12 + nightFactor * 1.35;
  for (const m of terrainSystem.bridgeLights) m.emissiveIntensity = 0.1 + nightFactor * 2.0;
  for (const m of karstSystem.nightGlowMats) m.emissiveIntensity = 0.08 + nightFactor * 1.9;
  for (const m of simSystem.nightGlowMats) m.emissiveIntensity = 0.18 + nightFactor * 2.1;
}

function animate() {
  requestAnimationFrame(animate);

  const dt = Math.min(clock.getDelta(), 0.05);
  const elapsed = clock.elapsedTime;

  // Auto day/night cycle
  if (state.autoTime) {
    state.timeOfDay = (state.timeOfDay + dt * 0.55) % 24;
    sliderTime.value = state.timeOfDay;
  }

  // Smooth camera flight
  if (camFlight) {
    camFlight.progress = Math.min(1, camFlight.progress + dt / camFlight.duration);
    const ease = 1 - Math.pow(1 - camFlight.progress, 3);
    camera.position.lerpVectors(camFlight.startPos, camFlight.endPos, ease);
    controls.target.lerpVectors(camFlight.startTarget, camFlight.endTarget, ease);
    if (camFlight.progress >= 1) camFlight = null;
  }

  // Update atmosphere, sky, sun/moon, water shader & night lights
  if (state.engineMode === 'bmap') {
    baiduMap3D.setTimeAtmosphere(state.timeOfDay);
  }
  const nightFactor = atmosphere.update(
    state.timeOfDay,
    state.weather,
    state.mistLevel,
    dt,
    elapsed,
    terrainSystem.waterUniforms
  );
  terrainSystem.waterUniforms.uTime.value = elapsed;
  updateNightIllumination(nightFactor);

  // Update active regional zone instance (1:1 details, animations, night glow & walk mode)
  if (zoneManager.isActive()) {
    zoneManager.update(dt, elapsed, nightFactor);
  } else {
    // Update living boats, traffic, egrets, rain & osmanthus petals in main world
    const simStats = simSystem.update(dt, elapsed, {
      boatDensity: state.boatDensity,
      trafficDensity: state.trafficDensity,
      flowSpeed: 1.0,
      weather: state.weather
    });

    // Update telemetry & FPS
    fpsFrames++;
    fpsTimer += dt;
    if (fpsTimer >= 0.4) {
      const fps = Math.round(fpsFrames / fpsTimer);
      statFpsEl.textContent = `${fps} FPS`;
      updateTelemetry(simStats.visibleBoats);
      fpsFrames = 0;
      fpsTimer = 0;
    }
  }

  if (zoneManager.isActive()) {
    fpsFrames++;
    fpsTimer += dt;
    if (fpsTimer >= 0.4) {
      statFpsEl.textContent = `${Math.round(fpsFrames / fpsTimer)} FPS`;
      updateTelemetry();
      fpsFrames = 0;
      fpsTimer = 0;
    }
    if (!zoneManager.isWalkActive()) {
      controls.update();
    }
  } else if (firstPerson.isActive()) {
    firstPerson.update(dt, nightFactor);
  } else {
    controls.update();
  }
  renderer.render(scene, camera);
}

// Resize handler
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Expose a clean debug hook for quick verification
window.__GUILIN_SIM__ = {
  state,
  firstPerson,
  zoneManager,
  flyToLandmarkById: (id) => {
    const lm = LANDMARKS.find((l) => l.id === id);
    if (lm) flyToLandmark(lm, true);
  },
  setTime: (h) => {
    state.timeOfDay = h;
    sliderTime.value = h;
    syncTimeButtons();
  },
  setWeather
};

animate();
