// Guilin 3D City - Real-World Baidu Maps Aligned Geography & Landmark Metadata
// Coordinate system: +X = East, -X = West, -Z = North, +Z = South
// Origin (0, 0) ≈ center between Jingjiang Palace (North) and Shan Lake (South)

export function getLiRiverCenterX(z) {
  // Real Li River flows NNE -> SSW through downtown Guilin:
  // North at Diecai/Fubo (z=-120..-75): x ≈ 54..50
  // Jiefang Bridge (z=-14): x ≈ 48
  // Shan Lake confluence (z=+36): x ≈ 42
  // Elephant Trunk Hill & Peach Blossom River confluence (z=+78): x ≈ 36
  return 46 - z * 0.11 + Math.sin(z * 0.014) * 7 + Math.cos(z * 0.008) * 3;
}

export function getLiRiverHalfWidth(z) {
  return 20 + Math.sin(z * 0.018 + 0.8) * 2.8;
}

export function getPeachRiverCenterZ(x) {
  // Flows from WSW (-200, 96) to merge into Li River right at Elephant Trunk Hill (22, 82)
  const t = Math.max(0, Math.min(1, (x + 200) / 230));
  return 102 - t * 18 + Math.sin(t * Math.PI * 2.0) * 8;
}

export function getPeachRiverHalfWidth(x) {
  const t = Math.max(0, Math.min(1, (x + 200) / 230));
  return 7.5 + t * 2.5;
}

// Check if a point (x, z) is inside any water body (returns depth > 0 if in water)
export function getWaterDepth(x, z) {
  let depth = 0;

  // 1. Li River (漓江)
  const liX = getLiRiverCenterX(z);
  const liHalfW = getLiRiverHalfWidth(z);
  const distLi = Math.abs(x - liX);
  if (distLi < liHalfW) {
    const d = 1 - distLi / liHalfW;
    depth = Math.max(depth, d * 4.2);
  }

  // 2. Peach Blossom River (桃花江) - west of Li River, merging at Elephant Trunk Hill
  if (x < liX + 4) {
    const peachZ = getPeachRiverCenterZ(x);
    const peachHalfW = getPeachRiverHalfWidth(x);
    const distPeach = Math.abs(z - peachZ);
    if (distPeach < peachHalfW) {
      const d = 1 - distPeach / peachHalfW;
      depth = Math.max(depth, d * 3.2);
    }
  }

  // 3. Shan Lake (杉湖) - directly South of Zhengyang St / Jingjiang Palace, East of Yangqiao (-32)
  // Centered at (-6, 36), rx=23, rz=16
  {
    const dx = (x - (-6)) / 23;
    const dz = (z - 36) / 16;
    const r = Math.sqrt(dx * dx + dz * dz);
    if (r < 1) {
      depth = Math.max(depth, (1 - r) * 3.5);
    }
  }

  // 4. Rong Lake (榕湖) - West of Yangqiao (-32), slightly northwest of Shan Lake
  // Centered at (-64, 27), rx=29, rz=18
  {
    const dx = (x - (-64)) / 29;
    const dz = (z - 27) / 18;
    const r = Math.sqrt(dx * dx + dz * dz);
    // Scenic lake island at (-66, 29)
    const idx = (x - (-66)) / 6.5;
    const idz = (z - 29) / 4.5;
    const ir = Math.sqrt(idx * idx + idz * idz);
    if (r < 1 && ir > 1.0) {
      const lakeD = (1 - r) * 3.5;
      const islandEdge = Math.min(1, (ir - 1.0) * 3.5);
      depth = Math.max(depth, lakeD * islandEdge);
    }
  }

  // 5. Canal connecting Rong Lake and Shan Lake under Yangqiao Bridge (x in [-40, -24], z around 32)
  if (x >= -42 && x <= -22) {
    const distC = Math.abs(z - 32);
    if (distC < 4.8) {
      depth = Math.max(depth, (1 - distC / 4.8) * 2.6);
    }
  }

  // 6. Canal connecting Shan Lake to Li River (x in [14, liX], z around 36)
  if (x >= 13 && x <= liX) {
    const distC = Math.abs(z - 36);
    if (distC < 4.2) {
      depth = Math.max(depth, (1 - distC / 4.2) * 2.6);
    }
  }

  return depth;
}

// Check if (x, z) is near water bank
export function isWaterOrShore(x, z, margin = 5.5) {
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

// Check if point is on a main road (aligned to real Guilin road grid)
export function isOnRoad(x, z, extraMargin = 0) {
  // 中山中路 (Zhongshan Central Rd): x = -32 (runs N-S across Yangqiao Bridge & Peach Bridge)
  if (Math.abs(x - (-32)) < 4.8 + extraMargin && z > -135 && z < 135) return true;
  // 解放东路 / 解放西路 (Jiefang Rd): z = -14 (runs E-W across Jiefang Bridge)
  if (Math.abs(z - (-14)) < 5.0 + extraMargin && x > -145 && x < 145) return true;
  // 杉湖北路 / 榕湖北路 (Lakeside North Ave): z = 14 (south of Zhengyang St, north of Shan Lake)
  if (Math.abs(z - 14) < 3.6 + extraMargin && x > -125 && x < 24) return true;
  // 文明路 / 南环路 (Wenming / South Ave): z = 58 (south of Shan Lake, leading to Elephant Hill)
  if (Math.abs(z - 58) < 3.6 + extraMargin && x > -130 && x < 18) return true;
  // 西城路 (West Ring Rd): x = -108
  if (Math.abs(x - (-108)) < 3.8 + extraMargin && z > -120 && z < 110) return true;
  // 凤北路 (Fengbei North Ave): z = -72
  if (Math.abs(z - (-72)) < 3.6 + extraMargin && x > -120 && x < 22) return true;
  // 滨江路 (Binjiang Scenic Waterfront Rd): west bank of Li River
  const binjiangX = getLiRiverCenterX(z) - getLiRiverHalfWidth(z) - 6.5;
  if (Math.abs(x - binjiangX) < 3.6 + extraMargin && z > -125 && z < 115) return true;
  // 漓江东路 (East Bank Waterfront Rd)
  const eastRoadX = getLiRiverCenterX(z) + getLiRiverHalfWidth(z) + 7.5;
  if (Math.abs(x - eastRoadX) < 3.6 + extraMargin && z > -115 && z < 105) return true;

  return false;
}

export const BRIDGES = [
  {
    id: 'jiefang-bridge',
    name: '解放桥',
    axis: 'x',
    cx: getLiRiverCenterX(-14),
    cz: -14,
    spanLength: 48,
    rampLength: 15,
    width: 9.2,
    baseY: 0.58,
    deckY: 3.85,
    style: 'jiefang'
  },
  {
    id: 'yangqiao-bridge',
    name: '阳桥',
    axis: 'z',
    cx: -32,
    cz: 32,
    spanLength: 12,
    rampLength: 8.5,
    width: 7.8,
    baseY: 0.58,
    deckY: 2.35,
    style: 'stone'
  },
  {
    id: 'binjiang-bridge',
    name: '滨江拱桥',
    axis: 'z',
    cx: 18,
    cz: 36,
    spanLength: 10,
    rampLength: 7.0,
    width: 5.4,
    baseY: 0.58,
    deckY: 2.2,
    style: 'stone'
  },
  {
    id: 'peach-bridge',
    name: '桃花江大桥',
    axis: 'z',
    cx: -32,
    cz: getPeachRiverCenterZ(-32),
    spanLength: 18,
    rampLength: 9.5,
    width: 8.0,
    baseY: 0.58,
    deckY: 2.55,
    style: 'stone'
  }
];

/**
 * Exact bridge surface elevation at world (x, z), or null if outside all bridges.
 */
export function getBridgeSurfaceY(x, z, extraWidth = 0) {
  for (const b of BRIDGES) {
    const along = b.axis === 'x' ? Math.abs(x - b.cx) : Math.abs(z - b.cz);
    const across = b.axis === 'x' ? Math.abs(z - b.cz) : Math.abs(x - b.cx);
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

  // Ronghu Crystal Bridge (榕湖玻璃桥) centered around (-74, 27)
  const dCrystal = Math.hypot(x - (-74), z - 27);
  if (dCrystal < 11.2) {
    const arch = Math.max(0, 1 - dCrystal / 11.2);
    return 0.58 + arch * 2.35;
  }

  return null;
}

export const LANDMARKS = [
  {
    id: 'overview',
    name: '桂林全景',
    enName: 'Guilin Panorama',
    category: '全城视角 · 按实景地图布局',
    elevation: '海拔 150m 盆地',
    description: '严格参照桂林真实城市地理分布：北起叠彩山、伏波山，中揽独秀峰王城、东西巷、正阳步行街与解放桥，西连榕湖古南门、阳桥，南拥杉湖日月双塔与漓江象鼻山。',
    position: [0, 0, 10],
    cameraPos: [-88, 94, 146],
    cameraTarget: [2, 8, 12]
  },
  {
    id: 'elephant-hill',
    name: '象鼻山',
    enName: 'Elephant Trunk Hill',
    category: '桂林城徽 · 5A景区',
    elevation: '山高 55m · 普贤塔',
    description: '位于桂林城区南部漓江与桃花江汇流处（杉湖南侧），酷似俯身痛饮漓江水的巨象，象鼻与象身间形成水月洞，山顶矗立明代普贤塔。',
    position: [20, 14, 76],
    cameraPos: [82, 28, 118],
    cameraTarget: [22, 10, 76]
  },
  {
    id: 'twin-pagodas',
    name: '日月双塔',
    enName: 'Sun & Moon Twin Pagodas',
    category: '两江四湖地标',
    elevation: '日塔41m · 月塔35m',
    description: '屹立于市中心杉湖碧波之上（阳桥以东、正阳步行街南端），东侧九级铜金日塔与西侧七级琉璃月塔交相辉映，水下玻璃通道相连。',
    position: [-6, 16, 36],
    cameraPos: [-4, 22, 76],
    cameraTarget: [-6, 12, 36]
  },
  {
    id: 'jingjiang-palace',
    name: '独秀峰 · 靖江王府',
    enName: 'Solitary Beauty Peak & Palace',
    category: '明代藩王城 · 历史核心',
    elevation: '峰高 66m · 南天一柱',
    description: '坐落于桂林市中心正中（正阳步行街与东西巷北侧），独秀峰拔地而起，明代靖江王府依峰而建，“桂林山水甲天下”摩崖石刻即镌刻于此。',
    position: [0, 16, -42],
    cameraPos: [0, 38, 12],
    cameraTarget: [0, 14, -42]
  },
  {
    id: 'jiefang-bridge',
    name: '解放桥 · 漓江水韵',
    enName: 'Jiefang Bridge & Li River',
    category: '城市动脉 · 观景长廊',
    elevation: '跨漓江主桥',
    description: '横跨漓江两岸的城市主干道，西紧邻东西巷与正阳步行街，东接七星公园峰群。入夜后桥拱流光溢彩，游船与竹筏穿桥而过。',
    position: [48, 6, -14],
    cameraPos: [102, 34, 34],
    cameraTarget: [44, 6, -14]
  },
  {
    id: 'ronghu-gate',
    name: '榕湖 · 古南门',
    enName: 'Rong Lake & Ancient South Gate',
    category: '唐代古城遗址',
    elevation: '千年古榕相伴',
    description: '位于阳桥以西的榕湖北岸，始建于唐代，门畔千年古榕枝繁叶茂，向东南可望阳桥与杉湖日月双塔。',
    position: [-54, 8, 12],
    cameraPos: [-98, 28, 56],
    cameraTarget: [-58, 6, 22]
  },
  {
    id: 'fubo-diecai',
    name: '伏波山 · 叠彩山',
    enName: 'Fubo & Diecai Hills',
    category: '滨江奇峰',
    elevation: '江畔孤峰 · 拿云亭',
    description: '位于解放桥以北的漓江西岸：伏波山半枕陆地半插江潭，再向北为层峦叠翠的叠彩山与山顶拿云亭。',
    position: [22, 22, -98],
    cameraPos: [98, 42, -78],
    cameraTarget: [22, 16, -98]
  },
  {
    id: 'river-cruise',
    name: '漓江泛舟视角',
    enName: 'Li River Boat POV',
    category: '沉浸游船',
    elevation: '水面低空视角',
    description: '乘一叶竹筏或两江四湖画舫沿漓江顺流而下，自北向南依次经过叠彩山、伏波山、解放桥与象鼻山，感受“舟行碧波上，人在画中游”。',
    position: [38, 3, 48],
    cameraPos: [44, 6.2, 114],
    cameraTarget: [32, 11, 48]
  }
];
