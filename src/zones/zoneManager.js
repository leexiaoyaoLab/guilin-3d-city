import * as THREE from 'three';
import { buildEastWestAlleyZone } from './eastWestAlleyZone.js';
import { buildTwinPagodasZone } from './twinPagodasZone.js';
import { buildElephantHillZone } from './elephantHillZone.js';
import { buildJingjiangPalaceZone } from './jingjiangPalaceZone.js';

/**
 * Registry of all 1:1 High-Detail Guilin Regional Instances (区域副本)
 * Easily extensible: add new regional builders here to expand Guilin district by district!
 */
export const ZONE_CATALOG = [
  {
    id: 'east-west-alley',
    landmarkIds: ['jiefang-bridge', 'east-west-alley'],
    badge: '历史街区',
    name: '东西巷 · 逍遥楼',
    desc: '青石板古街、东西巷牌坊、12栋岭南马头墙骑楼、米粉热气摊、28盏迎风红灯笼与三层金顶逍遥楼',
    builder: buildEastWestAlleyZone
  },
  {
    id: 'twin-pagodas',
    landmarkIds: ['twin-pagodas', 'ronghu-south-gate'],
    badge: '两江四湖',
    name: '日月双塔 · 杉湖园',
    desc: '9层铜金日塔、7层琉璃月塔、环湖栈桥、知音六角亭、荷塘锦鲤与杉湖夜游画舫',
    builder: buildTwinPagodasZone
  },
  {
    id: 'elephant-hill',
    landmarkIds: ['elephant-hill', 'li-river-cruise'],
    badge: '桂林城徽',
    name: '象鼻山 · 水月洞',
    desc: '雕塑喀斯特象鼻拱门、水月洞钟乳石、普贤塔、鹅卵石滩竹筏码头与漓江渔火竹筏',
    builder: buildElephantHillZone
  },
  {
    id: 'jingjiang-palace',
    landmarkIds: ['jingjiang-palace', 'fubo-diecai'],
    badge: '明代王城',
    name: '靖江王府 · 独秀峰',
    desc: '承运门石狮、王城中轴御道、双层汉白玉承运殿、青铜香鼎与独秀峰「桂林山水甲天下」摩崖石刻',
    builder: buildJingjiangPalaceZone
  }
];

export function findZoneForLandmark(landmarkId) {
  return ZONE_CATALOG.find((z) => z.landmarkIds.includes(landmarkId)) || null;
}

export function createZoneManager({ scene, camera, controls, worldGroups, onZoneChange }) {
  const instances = new Map();
  let activeZone = null;
  let savedWorldCamPos = null;
  let savedWorldTarget = null;
  let zoneCamFlight = null;

  // Lightweight 1st-person walking mode inside any regional instance
  let zoneWalkActive = false;
  let walkYaw = 0;
  let walkPitch = 0;
  let isDraggingWalk = false;
  let lastPointer = { x: 0, y: 0 };
  const keys = new Set();

  window.addEventListener('keydown', (e) => {
    if (!zoneWalkActive) return;
    keys.add(e.code);
    if (e.code === 'Escape') {
      setZoneWalk(false);
    }
  });
  window.addEventListener('keyup', (e) => keys.delete(e.code));

  window.addEventListener('pointerdown', (e) => {
    if (!zoneWalkActive) return;
    if (e.target && e.target.tagName !== 'CANVAS') return;
    isDraggingWalk = true;
    lastPointer = { x: e.clientX, y: e.clientY };
  });
  window.addEventListener('pointermove', (e) => {
    if (!zoneWalkActive || !isDraggingWalk) return;
    const dx = e.clientX - lastPointer.x;
    const dy = e.clientY - lastPointer.y;
    lastPointer = { x: e.clientX, y: e.clientY };
    walkYaw -= dx * 0.0045;
    walkPitch = THREE.MathUtils.clamp(walkPitch - dy * 0.0035, -0.55, 0.65);
  });
  window.addEventListener('pointerup', () => {
    isDraggingWalk = false;
  });

  function setWorldVisible(visible) {
    for (const g of worldGroups) {
      if (g) g.visible = visible;
    }
  }

  function getOrBuildZone(zoneId) {
    if (instances.has(zoneId)) return instances.get(zoneId);
    const meta = ZONE_CATALOG.find((z) => z.id === zoneId);
    if (!meta) return null;
    const built = meta.builder();
    built.group.visible = false;
    scene.add(built.group);
    instances.set(zoneId, built);
    return built;
  }

  function setZoneWalk(enabled) {
    if (!activeZone) {
      zoneWalkActive = false;
      return;
    }
    zoneWalkActive = enabled;
    controls.enabled = !enabled;
    zoneCamFlight = null;

    if (enabled) {
      const sp = activeZone.roamSpawn;
      camera.position.set(...sp.pos);
      walkYaw = sp.yaw || 0;
      walkPitch = 0.04;
    } else {
      flyToViewpoint(activeZone.defaultCamera);
    }
    if (onZoneChange) onZoneChange(activeZone, zoneWalkActive);
  }

  function flyToViewpoint(vp) {
    if (!vp) return;
    if (zoneWalkActive) {
      zoneWalkActive = false;
      controls.enabled = true;
    }
    zoneCamFlight = {
      startPos: camera.position.clone(),
      endPos: new THREE.Vector3(...vp.pos),
      startTarget: controls.target.clone(),
      endTarget: new THREE.Vector3(...vp.target),
      progress: 0,
      duration: 1.05
    };
  }

  function enterZone(zoneId) {
    const next = getOrBuildZone(zoneId);
    if (!next) return;

    if (!activeZone) {
      // Save main-world camera & controls state before entering regional instance
      savedWorldCamPos = camera.position.clone();
      savedWorldTarget = controls.target.clone();
      setWorldVisible(false);
    } else {
      activeZone.group.visible = false;
    }

    zoneWalkActive = false;
    controls.enabled = true;
    activeZone = next;
    activeZone.group.visible = true;

    // Fine-tune OrbitControls for 1:1 human-scale close-up inspection
    controls.minDistance = 4;
    controls.maxDistance = 135;
    camera.position.set(...activeZone.defaultCamera.pos);
    controls.target.set(...activeZone.defaultCamera.target);
    controls.update();
    zoneCamFlight = null;

    if (onZoneChange) onZoneChange(activeZone, zoneWalkActive);
  }

  function exitZone() {
    if (!activeZone) return;
    zoneWalkActive = false;
    activeZone.group.visible = false;
    activeZone = null;
    zoneCamFlight = null;

    setWorldVisible(true);
    controls.enabled = true;
    controls.minDistance = 14;
    controls.maxDistance = 320;
    if (savedWorldCamPos && savedWorldTarget) {
      camera.position.copy(savedWorldCamPos);
      controls.target.copy(savedWorldTarget);
      controls.update();
    }
    if (onZoneChange) onZoneChange(null, false);
  }

  function update(dt, elapsed, nightFactor) {
    if (!activeZone) return;

    if (typeof activeZone.update === 'function') {
      activeZone.update(dt, elapsed, nightFactor);
    }

    if (zoneCamFlight) {
      zoneCamFlight.progress = Math.min(1, zoneCamFlight.progress + dt / zoneCamFlight.duration);
      const ease = 1 - Math.pow(1 - zoneCamFlight.progress, 3);
      camera.position.lerpVectors(zoneCamFlight.startPos, zoneCamFlight.endPos, ease);
      controls.target.lerpVectors(zoneCamFlight.startTarget, zoneCamFlight.endTarget, ease);
      if (zoneCamFlight.progress >= 1) zoneCamFlight = null;
    }

    if (zoneWalkActive) {
      const speed = (keys.has('ShiftLeft') || keys.has('ShiftRight') ? 10.5 : 5.2) * dt;
      const forward = new THREE.Vector3(-Math.sin(walkYaw), 0, -Math.cos(walkYaw));
      const right = new THREE.Vector3(Math.cos(walkYaw), 0, -Math.sin(walkYaw));

      if (keys.has('KeyW') || keys.has('ArrowUp')) camera.position.addScaledVector(forward, speed);
      if (keys.has('KeyS') || keys.has('ArrowDown')) camera.position.addScaledVector(forward, -speed);
      if (keys.has('KeyD') || keys.has('ArrowRight')) camera.position.addScaledVector(right, speed);
      if (keys.has('KeyA') || keys.has('ArrowLeft')) camera.position.addScaledVector(right, -speed);

      const b = activeZone.roamSpawn.bounds;
      if (b) {
        camera.position.x = THREE.MathUtils.clamp(camera.position.x, b.minX, b.maxX);
        camera.position.z = THREE.MathUtils.clamp(camera.position.z, b.minZ, b.maxZ);
      }
      camera.position.y = activeZone.roamSpawn.pos[1];

      const euler = new THREE.Euler(walkPitch, walkYaw, 0, 'YXZ');
      camera.quaternion.setFromEuler(euler);
    }
  }

  return {
    catalog: ZONE_CATALOG,
    enterZone,
    exitZone,
    flyToViewpoint,
    setZoneWalk,
    isWalkActive: () => zoneWalkActive,
    isActive: () => activeZone !== null,
    getActiveZone: () => activeZone,
    update
  };
}
