// Guilin 3D City - Real Vector Map-Aligned Geography (from real OSM/Baidu road network)
// Projection origin: (25.2796°N, 110.2945°E) | Scale: 1 unit = 12.5 meters (+X East, -Z North)
import { REAL_ROADS } from './guilinRealMapData.js';

// Real Li River centerline waypoints extracted directly from downtown Guilin vector map (z sorted North -> South)
const LI_RIVER_PROFILE = [
  [34.5, -150],
  [44.4, -125.2],
  [55.2, -94.5],
  [51.6, -65.2],
  [39.0, -25.3],
  [30.8, 0.1],    // Exact center of real Jiefang Bridge!
  [24.5, 10.9],
  [12.0, 32.0],   // Shan Lake confluence
  [-0.1, 51.6],
  [-8.2, 78.2],   // Exact Elephant Trunk Hill & Peach Blossom River confluence!
  [-10.3, 131.5],
  [-12.0, 220.0]
];

export function getLiRiverCenterX(z) {
  if (z <= LI_RIVER_PROFILE[0][1]) return LI_RIVER_PROFILE[0][0];
  const last = LI_RIVER_PROFILE[LI_RIVER_PROFILE.length - 1];
  if (z >= last[1]) return last[0];
  for (let i = 0; i < LI_RIVER_PROFILE.length - 1; i++) {
    const [x0, z0] = LI_RIVER_PROFILE[i];
    const [x1, z1] = LI_RIVER_PROFILE[i + 1];
    if (z >= z0 && z <= z1) {
      const t = (z - z0) / (z1 - z0);
      return x0 + (x1 - x0) * t;
    }
  }
  return 30.8;
}

export function getLiRiverHalfWidth(z) {
  return 13.5 + Math.sin(z * 0.02 + 0.7) * 2.0;
}

export function getPeachRiverCenterZ(x) {
  // Real Peach Blossom River enters from WSW (-160, 86) through WenChang Bridge (-47, 79.5) to Li River (-8, 76)
  const t = Math.max(0, Math.min(1, (x + 160) / 155));
  return 86 - t * 10 + Math.sin(t * Math.PI * 1.5) * 3.5;
}

export function getPeachRiverHalfWidth(x) {
  const t = Math.max(0, Math.min(1, (x + 160) / 155));
  return 5.8 + t * 2.0;
}

// Check if a point (x, z) is inside any water body (returns depth > 0 if in water)
export function getWaterDepth(x, z) {
  let depth = 0;

  // 1. Real curved Li River (漓江)
  const liX = getLiRiverCenterX(z);
  const liHalfW = getLiRiverHalfWidth(z);
  const distLi = Math.abs(x - liX);
  if (distLi < liHalfW) {
    depth = Math.max(depth, (1 - distLi / liHalfW) * 4.2);
  }

  // 2. Real Peach Blossom River (桃花江) - west of Li River, merging at Elephant Trunk Hill (-8, 76)
  if (x < liX + 3) {
    const peachZ = getPeachRiverCenterZ(x);
    const peachHalfW = getPeachRiverHalfWidth(x);
    const distPeach = Math.abs(z - peachZ);
    if (distPeach < peachHalfW) {
      depth = Math.max(depth, (1 - distPeach / peachHalfW) * 3.2);
    }
  }

  // 3. Shan Lake (杉湖) - East of Yangqiao (-40, 24), South of Zhengyang St (-6, +4)
  // Real map bounds: x ∈ [-38..-5], z ∈ [22..42], centered at (-21, 32)
  {
    const dx = (x - (-21)) / 17.5;
    const dz = (z - 32) / 11.5;
    const r = Math.sqrt(dx * dx + dz * dz);
    if (r < 1) {
      depth = Math.max(depth, (1 - r) * 3.4);
    }
  }

  // 4. Rong Lake (榕湖) - West of Yangqiao (-40, 24), South of Ancient South Gate (-68, 6)
  // Real map bounds: x ∈ [-102..-42], z ∈ [7..31], centered at (-72, 19)
  {
    const dx = (x - (-72)) / 27;
    const dz = (z - 19) / 13.5;
    const r = Math.sqrt(dx * dx + dz * dz);
    const idx = (x - (-75)) / 5.8;
    const idz = (z - 21) / 3.8;
    const ir = Math.sqrt(idx * idx + idz * idz);
    if (r < 1 && ir > 1.0) {
      const lakeD = (1 - r) * 3.4;
      const islandEdge = Math.min(1, (ir - 1.0) * 3.5);
      depth = Math.max(depth, lakeD * islandEdge);
    }
  }

  // 5. Canal connecting Rong Lake and Shan Lake under Yangqiao Bridge (-40, 25)
  if (x >= -48 && x <= -33) {
    const distC = Math.abs(z - 25.5);
    if (distC < 4.2) {
      depth = Math.max(depth, (1 - distC / 4.2) * 2.5);
    }
  }

  // 6. Canal connecting Shan Lake to Li River (x in [-6..liX], z around 33)
  if (x >= -6 && x <= liX) {
    const distC = Math.abs(z - 33);
    if (distC < 3.6) {
      depth = Math.max(depth, (1 - distC / 3.6) * 2.5);
    }
  }

  return depth;
}

export function isWaterOrShore(x, z, margin = 4.8) {
  if (getWaterDepth(x, z) > 0.02) return true;
  if (
    getWaterDepth(x + margin, z) > 0.05 ||
    getWaterDepth(x - margin, z) > 0.05 ||
    getWaterDepth(x, z + margin) > 0.05 ||
    getWaterDepth(x, z - margin) > 0.05
  ) {
    return true;
  }
  return false;
}

// Fast point-to-segment squared distance helper for exact real-road collision & building exclusion
function distToSegmentSq(px, pz, ax, az, bx, bz) {
  const vx = bx - ax;
  const vz = bz - az;
  const wx = px - ax;
  const wz = pz - az;
  const c1 = vx * wx + vz * wz;
  if (c1 <= 0) return wx * wx + wz * wz;
  const c2 = vx * vx + vz * vz;
  if (c2 <= c1) {
    const dx = px - bx;
    const dz = pz - bz;
    return dx * dx + dz * dz;
  }
  const t = c1 / c2;
  const projX = ax + t * vx;
  const projZ = az + t * vz;
  const dx = px - projX;
  const dz = pz - projZ;
  return dx * dx + dz * dz;
}

// Precompute bounding boxes for all 214 real vector roads for ultra-fast lookup
const ROAD_BBOXES = REAL_ROADS.map((rd) => {
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const [x, z] of rd.pts) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (z < minZ) minZ = z;
    if (z > maxZ) maxZ = z;
  }
  return { rd, minX, maxX, minZ, maxZ };
});

// Exact check against ALL 214 real curved vector roads from downtown Guilin!
export function isOnRoad(x, z, extraMargin = 0) {
  for (let i = 0; i < ROAD_BBOXES.length; i++) {
    const item = ROAD_BBOXES[i];
    const halfW = item.rd.width * 0.5 + extraMargin;
    if (x < item.minX - halfW || x > item.maxX + halfW || z < item.minZ - halfW || z > item.maxZ + halfW) {
      continue;
    }
    const pts = item.rd.pts;
    const threshSq = halfW * halfW;
    for (let j = 0; j < pts.length - 1; j++) {
      if (distToSegmentSq(x, z, pts[j][0], pts[j][1], pts[j + 1][0], pts[j + 1][1]) <= threshSq) {
        return true;
      }
    }
  }
  return false;
}

// Bridges positioned at their EXACT real map coordinates and true diagonal headings (angle = atan2(dz, dx) in XZ plane)
export const BRIDGES = [
  {
    id: 'jiefang-bridge',
    name: '解放桥',
    cx: 30.8,
    cz: 0.1,
    angle: Math.atan2(7.1, 21.6), // Real ~+18.2° WNW -> ESE heading matching 解放东路!
    spanLength: 28,
    rampLength: 12,
    width: 8.6,
    baseY: 0.58,
    deckY: 3.65,
    style: 'jiefang'
  },
  {
    id: 'yangqiao-bridge',
    name: '阳桥',
    cx: -40.0,
    cz: 25.5,
    angle: Math.PI / 2 + 0.24, // Real NNE -> SSW Zhongshan Rd heading!
    spanLength: 10,
    rampLength: 7.5,
    width: 7.6,
    baseY: 0.58,
    deckY: 2.25,
    style: 'stone'
  },
  {
    id: 'wenchang-bridge',
    name: '文昌桥',
    cx: -47.2,
    cz: 79.5,
    angle: Math.PI / 2 + 0.22, // Real WenChang Bridge over Peach Blossom River!
    spanLength: 14,
    rampLength: 8.0,
    width: 7.6,
    baseY: 0.58,
    deckY: 2.45,
    style: 'stone'
  },
  {
    id: 'binjiang-bridge',
    name: '滨江拱桥',
    cx: 0.0,
    cz: 33.0,
    angle: Math.PI / 2 + 0.28,
    spanLength: 9,
    rampLength: 6.5,
    width: 5.2,
    baseY: 0.58,
    deckY: 2.15,
    style: 'stone'
  }
];

/**
 * Exact bridge surface elevation at world (x, z) supporting arbitrary real-map bridge headings!
 */
export function getBridgeSurfaceY(x, z, extraWidth = 0) {
  for (const b of BRIDGES) {
    const dx = x - b.cx;
    const dz = z - b.cz;
    const cosA = Math.cos(b.angle);
    const sinA = Math.sin(b.angle);
    // Project onto bridge local longitudinal (along) and transverse (across) axes
    const along = Math.abs(dx * cosA + dz * sinA);
    const across = Math.abs(-dx * sinA + dz * cosA);
    const halfSpan = b.spanLength / 2;
    const totalHalf = halfSpan + b.rampLength;

    if (across <= b.width / 2 + extraWidth && along <= totalHalf) {
      if (along <= halfSpan) {
        return b.deckY;
      }
      const t = 1 - (along - halfSpan) / b.rampLength;
      return b.baseY + t * (b.deckY - b.baseY);
    }
  }

  // Ronghu Crystal Bridge (榕湖玻璃桥) centered around (-82, 19)
  const dCrystal = Math.hypot(x - (-82), z - 19);
  if (dCrystal < 10.5) {
    const arch = Math.max(0, 1 - dCrystal / 10.5);
    return 0.58 + arch * 2.25;
  }

  return null;
}

export const LANDMARKS = [
  {
    id: 'overview',
    name: '桂林全景',
    enName: 'Guilin Panorama',
    category: '实景路网 · 精确地图投影',
    elevation: '海拔 150m 盆地',
    description: '基于桂林市中心真实矢量路网（214 条实景道路曲线）与经纬度精确投影构建：解放西路—十字街—解放东路—解放桥呈真实的西北—东南走向，中山中路与正阳步行街与之垂直交汇，完整还原两江四湖与喀斯特名山。',
    position: [-15, 0, 10],
    cameraPos: [-98, 96, 138],
    cameraTarget: [-8, 8, 10]
  },
  {
    id: 'elephant-hill',
    name: '象鼻山',
    enName: 'Elephant Trunk Hill',
    category: '桂林城徽 · 5A景区',
    elevation: '山高 55m · 普贤塔',
    description: '位于桂林城区南部漓江与桃花江真实汇流处（滨江路南端、文昌桥以东），酷似俯身饮江的巨象，山顶矗立明代普贤塔。',
    position: [-24, 14, 84],
    cameraPos: [36, 28, 124],
    cameraTarget: [-20, 10, 84]
  },
  {
    id: 'twin-pagodas',
    name: '日月双塔',
    enName: 'Sun & Moon Twin Pagodas',
    category: '两江四湖地标',
    elevation: '日塔41m · 月塔35m',
    description: '屹立于阳桥以东、正阳步行街南端的杉湖碧波之上，东侧九级铜金日塔与西侧七级琉璃月塔交相辉映。',
    position: [-21, 16, 32],
    cameraPos: [-18, 22, 72],
    cameraTarget: [-21, 12, 32]
  },
  {
    id: 'jingjiang-palace',
    name: '独秀峰 · 靖江王府',
    enName: 'Solitary Beauty Peak & Palace',
    category: '明代藩王城 · 历史核心',
    elevation: '峰高 66m · 南天一柱',
    description: '坐落于东西巷与解放东路北侧，独秀峰拔地而起，东与漓江畔伏波山隔街遥望，南出承运门与正阳门即达东西巷。',
    position: [3, 16, -56],
    cameraPos: [3, 38, -2],
    cameraTarget: [3, 14, -56]
  },
  {
    id: 'jiefang-bridge',
    name: '解放桥 · 东西巷逍遥楼',
    enName: 'Jiefang Bridge & Xiaoyao Pavilion',
    category: '城市动脉 · 历史江畔',
    elevation: '跨漓江主桥 · 逍遥楼',
    description: '解放东路沿真实西北—东南轴线跨越漓江即解放桥；桥西北角矗立唐代名楼逍遥楼，紧邻解放东路北侧的东西巷古街，路南侧即为正阳步行街。',
    position: [31, 6, 0],
    cameraPos: [84, 34, 42],
    cameraTarget: [20, 8, -6]
  },
  {
    id: 'ronghu-gate',
    name: '榕湖 · 古南门',
    enName: 'Rong Lake & Ancient South Gate',
    category: '唐代古城遗址',
    elevation: '千年古榕相伴',
    description: '位于阳桥以西的榕湖北岸（榕湖北路旁），始建于唐代，门畔千年古榕枝繁叶茂。',
    position: [-68, 8, 6],
    cameraPos: [-108, 28, 48],
    cameraTarget: [-68, 6, 16]
  },
  {
    id: 'fubo-diecai',
    name: '伏波山 · 叠彩山',
    enName: 'Fubo & Diecai Hills',
    category: '滨江奇峰',
    elevation: '江畔孤峰 · 拿云亭',
    description: '位于解放桥以北的漓江西岸：伏波山与独秀峰同纬度东西遥望，向北沿滨江路即为叠彩山。',
    position: [36, 22, -88],
    cameraPos: [108, 42, -68],
    cameraTarget: [36, 16, -88]
  },
  {
    id: 'river-cruise',
    name: '漓江泛舟视角',
    enName: 'Li River Boat POV',
    category: '沉浸游船',
    elevation: '水面低空视角',
    description: '乘一叶竹筏或画舫沿真实的东北—西南弯曲漓江顺流而下，依次经过叠彩山、伏波山、逍遥楼、解放桥与象鼻山。',
    position: [12, 3, 45],
    cameraPos: [4, 6.2, 108],
    cameraTarget: [8, 11, 40]
  }
];
