import * as THREE from 'three';
import { buildEastWestAlleyZone } from './eastWestAlleyZone.js';
import { buildTwinPagodasZone } from './twinPagodasZone.js';
import { buildElephantHillZone } from './elephantHillZone.js';
import { buildJingjiangPalaceZone } from './jingjiangPalaceZone.js';
import { animatePortalBeacon, createPortalBeacon } from './zoneUtils.js';

/**
 * Registry of all 1:1 High-Detail Guilin Regional Instances (区域副本)
 * Each entry includes its real-world portal entrance coordinates in the Main World
 * AND its exit portal inside the 1:1 instance so players can walk seamlessly in & out!
 */
export const ZONE_CATALOG = [
  {
    id: 'east-west-alley',
    landmarkIds: ['jiefang-bridge', 'east-west-alley'],
    badge: '历史街区',
    name: '东西巷 · 逍遥楼',
    desc: '青石板古街、东西巷牌坊、12栋岭南马头墙骑楼、米粉热气摊、28盏迎风红灯笼与三层金顶逍遥楼',
    worldPortalPos: [4.5, 0.55, -13.5],
    worldExitYaw: 0.2,
    zoneExitPortalPos: [-37.5, 0.12, 0],
    builder: buildEastWestAlleyZone
  },
  {
    id: 'twin-pagodas',
    landmarkIds: ['twin-pagodas', 'ronghu-south-gate'],
    badge: '两江四湖',
    name: '日月双塔 · 杉湖园',
    desc: '9层铜金日塔、7层琉璃月塔、环湖栈桥、知音六角亭、荷塘锦鲤与杉湖夜游画舫',
    worldPortalPos: [-23.5, 0.55, 51.0],
    worldExitYaw: 0.0,
    zoneExitPortalPos: [0, 0.56, 37.2],
    builder: buildTwinPagodasZone
  },
  {
    id: 'elephant-hill',
    landmarkIds: ['elephant-hill', 'li-river-cruise'],
    badge: '桂林城徽',
    name: '象鼻山 · 水月洞',
    desc: '雕塑喀斯特象鼻拱门、水月洞钟乳石、普贤塔、鹅卵石滩竹筏码头与漓江渔火竹筏',
    worldPortalPos: [-35.5, 0.55, 83.5],
    worldExitYaw: -Math.PI * 0.45,
    zoneExitPortalPos: [-19.5, 0.65, 22.0],
    builder: buildElephantHillZone
  },
  {
    id: 'jingjiang-palace',
    landmarkIds: ['jingjiang-palace', 'fubo-diecai'],
    badge: '明代王城',
    name: '靖江王府 · 独秀峰',
    desc: '承运门石狮、王城中轴御道、双层汉白玉承运殿、青铜香鼎与独秀峰「桂林山水甲天下」摩崖石刻',
    worldPortalPos: [3.0, 0.55, -29.5],
    worldExitYaw: 0.0,
    zoneExitPortalPos: [0, 0.14, 40.5],
    builder: buildJingjiangPalaceZone
  }
];

export function findZoneForLandmark(landmarkId) {
  return ZONE_CATALOG.find((z) => z.landmarkIds.includes(landmarkId)) || null;
}

export function createZoneManager({ scene, camera, controls, worldGroups, onZoneChange }) {
  const instances = new Map();
  let activeZone = null;
  let activeMeta = null;
  let savedWorldCamPos = null;
  let savedWorldTarget = null;
  let zoneCamFlight = null;

  // Build glowing 3D Portal Beacons in the Main World at each district's real street entrance!
  const worldPortalsGroup = new THREE.Group();
  worldPortalsGroup.name = 'WorldZonePortals';
  const worldBeacons = [];
  for (const meta of ZONE_CATALOG) {
    const beacon = createPortalBeacon(`副本 · ${meta.name}`, 0x4ec4a7, 1.05);
    beacon.position.set(...meta.worldPortalPos);
    worldPortalsGroup.add(beacon);
    worldBeacons.push({ meta, beacon });
  }
  scene.add(worldPortalsGroup);
  worldGroups.push(worldPortalsGroup);

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
    built.meta = meta;

    // Add glowing Return-to-World Exit Portal inside the 1:1 regional instance
    const exitBeacon = createPortalBeacon('返回桂林大世界', 0xf5c756, 0.92);
    exitBeacon.position.set(...meta.zoneExitPortalPos);
    built.group.add(exitBeacon);
    built.exitBeacon = exitBeacon;

    built.group.visible = false;
    scene.add(built.group);
    instances.set(zoneId, built);
    return built;
  }

  function flyToViewpoint(vp) {
    if (!vp) return;
    zoneCamFlight = {
      startPos: camera.position.clone(),
      endPos: new THREE.Vector3(...vp.pos),
      startTarget: controls.target.clone(),
      endTarget: new THREE.Vector3(...vp.target),
      progress: 0,
      duration: 1.05
    };
  }

  function enterZone(zoneId, { preserveRoam = false } = {}) {
    const next = getOrBuildZone(zoneId);
    if (!next) return null;

    if (!activeZone) {
      savedWorldCamPos = camera.position.clone();
      savedWorldTarget = controls.target.clone();
      setWorldVisible(false);
    } else {
      activeZone.group.visible = false;
    }

    activeZone = next;
    activeMeta = next.meta;
    activeZone.group.visible = true;
    zoneCamFlight = null;

    if (!preserveRoam) {
      controls.enabled = true;
      controls.minDistance = 4;
      controls.maxDistance = 135;
      camera.position.set(...activeZone.defaultCamera.pos);
      controls.target.set(...activeZone.defaultCamera.target);
      controls.update();
    }

    if (onZoneChange) onZoneChange(activeZone, preserveRoam);
    return activeZone;
  }

  function exitZone({ preserveRoam = false } = {}) {
    if (!activeZone) return null;
    const exitedMeta = activeMeta;
    activeZone.group.visible = false;
    activeZone = null;
    activeMeta = null;
    zoneCamFlight = null;

    setWorldVisible(true);

    if (!preserveRoam) {
      controls.enabled = true;
      controls.minDistance = 14;
      controls.maxDistance = 320;
      if (savedWorldCamPos && savedWorldTarget) {
        camera.position.copy(savedWorldCamPos);
        controls.target.copy(savedWorldTarget);
        controls.update();
      }
    }

    if (onZoneChange) onZoneChange(null, preserveRoam);
    return exitedMeta;
  }

  /**
   * Checks if a roaming player at (px, pz) is standing near an interactive portal
   * Returns { type: 'enter', meta } in Main World, or { type: 'exit', meta } inside a Zone, or null.
   */
  function getNearbyPortal(px, pz) {
    if (!activeZone) {
      for (const meta of ZONE_CATALOG) {
        const [wx, , wz] = meta.worldPortalPos;
        if (Math.hypot(px - wx, pz - wz) < 8.5) {
          return { type: 'enter', meta };
        }
      }
      return null;
    } else if (activeMeta) {
      const [ex, , ez] = activeMeta.zoneExitPortalPos;
      if (Math.hypot(px - ex, pz - ez) < 6.2) {
        return { type: 'exit', meta: activeMeta };
      }
    }
    return null;
  }

  function update(dt, elapsed, nightFactor) {
    if (!activeZone) {
      // Animate main-world portal beacons
      for (const wb of worldBeacons) {
        animatePortalBeacon(wb.beacon, elapsed);
      }
      return;
    }

    if (typeof activeZone.update === 'function') {
      activeZone.update(dt, elapsed, nightFactor);
    }
    if (activeZone.exitBeacon) {
      animatePortalBeacon(activeZone.exitBeacon, elapsed);
    }

    if (zoneCamFlight) {
      zoneCamFlight.progress = Math.min(1, zoneCamFlight.progress + dt / zoneCamFlight.duration);
      const ease = 1 - Math.pow(1 - zoneCamFlight.progress, 3);
      camera.position.lerpVectors(zoneCamFlight.startPos, zoneCamFlight.endPos, ease);
      controls.target.lerpVectors(zoneCamFlight.startTarget, zoneCamFlight.endTarget, ease);
      if (zoneCamFlight.progress >= 1) zoneCamFlight = null;
    }
  }

  return {
    catalog: ZONE_CATALOG,
    enterZone,
    exitZone,
    flyToViewpoint,
    getNearbyPortal,
    isActive: () => activeZone !== null,
    getActiveZone: () => activeZone,
    update
  };
}
