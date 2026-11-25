// Guilin 3D City - Exact Real-World Map-Tile Aligned Geography & Landmark Metadata
// Projected from real OSM / Baidu Maps coordinates centered at Jiefang East Rd & East-West Alley (25.2796°N, 110.2945°E)
// +X = East, -X = West, -Z = North, +Z = South
//
// Exact Street & Building Topology:
// - 解放东路 / 解放西路 (Jiefang Rd): z = 0 (East-West main axis, crosses Li River via 解放桥)
// - NORTH of 解放东路 (z < 0):
//     * 东西巷 (East-West Alley): x ∈ [-10..+20], z ∈ [-24..-6] (between Jingjiang Palace south gate and Jiefang East Rd!)
//     * 逍遥楼 (Xiaoyao Pavilion): (23, -15) at east end of East-West Alley, NW corner of Jiefang Bridge!
//     * 靖江王府 & 独秀峰: (0, -56) directly north of East-West Alley!
//     * 伏波山: (34, -58) due east of Solitary Beauty Peak on Li River west bank!
//     * 叠彩山: (28, -116) north of Fubo Hill on Li River west bank!
// - SOUTH of 解放东路 (z > 0):
//     * 正阳步行街 (Zhengyang Pedestrian Street): x = -6, z ∈ [+5..+28] (runs N-S from Jiefang East Rd down to Shan Lake!)
//     * 杉湖 & 日月双塔: (-10, +46) directly south of Zhengyang St, east of Yangqiao Bridge!
//     * 中山中路 & 阳桥: x = -40, bridge at (-40, +38) separating Shan Lake (east) & Rong Lake (west)!
//     * 榕湖 & 古南门: Rong Lake (-70, +26), Ancient South Gate (-64, +7) on Rong Lake north shore!
//     * 象鼻山 & 桃花江汇流口: (14, +86) south of Shan Lake on Li River west bank!

export function getLiRiverCenterX(z) {
  // Real Li River flows NNE -> SSW:
  // Diecai/Fubo (z=-116..-58): x ≈ 62..58
  // Jiefang Bridge (z=0): x ≈ 52
  // Shan Lake confluence (z=+46): x ≈ 44
  // Elephant Trunk Hill confluence (z=+86): x ≈ 35
  return 52 - z * 0.16 + Math.sin(z * 0.015) * 5;
}

export function getLiRiverHalfWidth(z) {
  return 19 + Math.sin(z * 0.018 + 0.8) * 2.5;
}

export function getPeachRiverCenterZ(x) {
  // Flows from WSW (-200, 108) to merge into Li River right at Elephant Trunk Hill (18, 90)
  const t = Math.max(0, Math.min(1, (x + 200) / 225));
  return 112 - t * 20 + Math.sin(t * Math.PI * 1.9) * 7;
}

export function getPeachRiverHalfWidth(x) {
  const t = Math.max(0, Math.min(1, (x + 200) / 225));
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
    depth = Math.max(depth, (1 - distLi / liHalfW) * 4.2);
  }

  // 2. Peach Blossom River (桃花江) - west of Li River, merging at Elephant Trunk Hill
  if (x < liX + 4) {
    const peachZ = getPeachRiverCenterZ(x);
    const peachHalfW = getPeachRiverHalfWidth(x);
    const distPeach = Math.abs(z - peachZ);
    if (distPeach < peachHalfW) {
      depth = Math.max(depth, (1 - distPeach / peachHalfW) * 3.2);
    }
  }

  // 3. Shan Lake (杉湖) - South of Zhengyang Pedestrian Street, East of Yangqiao (-40)
  // Centered at (-10, 46), rx=23, rz=15
  {
    const dx = (x - (-10)) / 23;
    const dz = (z - 46) / 15;
    const r = Math.sqrt(dx * dx + dz * dz);
    if (r < 1) {
      depth = Math.max(depth, (1 - r) * 3.5);
    }
  }

  // 4. Rong Lake (榕湖) - West of Yangqiao (-40), slightly northwest of Shan Lake
  // Centered at (-72, 30), rx=28, rz=17
  {
    const dx = (x - (-72)) / 28;
    const dz = (z - 30) / 17;
    const r = Math.sqrt(dx * dx + dz * dz);
    // Scenic island at (-74, 32)
    const idx = (x - (-74)) / 6.2;
    const idz = (z - 32) / 4.4;
    const ir = Math.sqrt(idx * idx + idz * idz);
    if (r < 1 && ir > 1.0) {
      const lakeD = (1 - r) * 3.5;
      const islandEdge = Math.min(1, (ir - 1.0) * 3.5);
      depth = Math.max(depth, lakeD * islandEdge);
    }
  }

  // 5. Canal connecting Rong Lake and Shan Lake under Yangqiao Bridge (x in [-48, -31], z around 38)
  if (x >= -48 && x <= -30) {
    const distC = Math.abs(z - 38);
    if (distC < 4.6) {
      depth = Math.max(depth, (1 - distC / 4.6) * 2.6);
    }
  }

  // 6. Canal connecting Shan Lake to Li River (x in [10, liX], z around 46)
  if (x >= 10 && x <= liX) {
    const distC = Math.abs(z - 46);
    if (distC < 4.2) {
      depth = Math.max(depth, (1 - distC / 4.2) * 2.6);
    }
  }

  return depth;
}

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

// Real Guilin Downtown Road Grid
export function isOnRoad(x, z, extraMargin = 0) {
  // 中山中路 (Zhongshan Central Rd): x = -40 (crosses Yangqiao Bridge & Peach Bridge)
  if (Math.abs(x - (-40)) < 4.8 + extraMargin && z > -135 && z < 135) return true;
  // 解放东路 / 解放西路 (Jiefang Rd): z = 0 (North = East-West Alley & Xiaoyao Pavilion, South = Zhengyang St)
  if (Math.abs(z - 0) < 5.0 + extraMargin && x > -145 && x < 145) return true;
  // 杉湖北路 / 榕湖北路 (Lakeside North Ave): z = 25 (between Zhengyang St & Shan Lake)
  if (Math.abs(z - 25) < 3.6 + extraMargin && x > -125 && x < 24) return true;
  // 文明路 / 南环路 (Wenming Ave): z = 67 (south of Shan Lake)
  if (Math.abs(z - 67) < 3.6 + extraMargin && x > -130 && x < 14) return true;
  // 西城路 (West Ring Rd): x = -112
  if (Math.abs(x - (-112)) < 3.8 + extraMargin && z > -120 && z < 110) return true;
  // 凤北路 (Fengbei North Ave): z = -84
  if (Math.abs(z - (-84)) < 3.6 + extraMargin && x > -120 && x < 26) return true;
  // 滨江路 (Binjiang Waterfront Rd): west bank of Li River
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
    cx: getLiRiverCenterX(0),
    cz: 0,
    spanLength: 46,
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
    cx: -40,
    cz: 38,
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
    cz: 46,
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
    cx: -40,
    cz: getPeachRiverCenterZ(-40),
    spanLength: 18,
    rampLength: 9.5,
    width: 8.0,
    baseY: 0.58,
    deckY: 2.55,
    style: 'stone'
  }
];

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

  // Ronghu Crystal Bridge (榕湖玻璃桥) centered around (-82, 30)
  const dCrystal = Math.hypot(x - (-82), z - 30);
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
    category: '全城视角 · 精准地图格局',
    elevation: '海拔 150m 盆地',
    description: '严格依据桂林实景瓦片地图分布：以解放东路为东西中轴，北侧为靖江王府、东西巷与江畔逍遥楼（东临伏波山/叠彩山），南侧为正阳步行街、杉湖日月双塔与象鼻山，西侧经阳桥连接榕湖古南门。',
    position: [0, 0, 10],
    cameraPos: [-88, 96, 152],
    cameraTarget: [2, 8, 12]
  },
  {
    id: 'elephant-hill',
    name: '象鼻山',
    enName: 'Elephant Trunk Hill',
    category: '桂林城徽 · 5A景区',
    elevation: '山高 55m · 普贤塔',
    description: '位于桂林城区南部漓江与桃花江汇流处（杉湖南侧），酷似俯身痛饮漓江水的巨象，象鼻与象身间形成水月洞，山顶矗立明代普贤塔。',
    position: [14, 14, 86],
    cameraPos: [76, 28, 126],
    cameraTarget: [16, 10, 86]
  },
  {
    id: 'twin-pagodas',
    name: '日月双塔',
    enName: 'Sun & Moon Twin Pagodas',
    category: '两江四湖地标',
    elevation: '日塔41m · 月塔35m',
    description: '屹立于市中心杉湖碧波之上（阳桥以东、正阳步行街正南），东侧九级铜金日塔与西侧七级琉璃月塔交相辉映，水下玻璃通道相连。',
    position: [-10, 16, 46],
    cameraPos: [-8, 22, 86],
    cameraTarget: [-10, 12, 46]
  },
  {
    id: 'jingjiang-palace',
    name: '独秀峰 · 靖江王府',
    enName: 'Solitary Beauty Peak & Palace',
    category: '明代藩王城 · 历史核心',
    elevation: '峰高 66m · 南天一柱',
    description: '坐落于东西巷正北侧，独秀峰拔地而起，明代靖江王府依峰而建；出承运门与正阳门向南即为东西巷与解放东路。',
    position: [0, 16, -56],
    cameraPos: [0, 38, -2],
    cameraTarget: [0, 14, -56]
  },
  {
    id: 'jiefang-bridge',
    name: '解放桥 · 东西巷逍遥楼',
    enName: 'Jiefang Bridge & Xiaoyao Pavilion',
    category: '城市动脉 · 历史江畔',
    elevation: '跨漓江主桥 · 逍遥楼',
    description: '解放东路向东跨漓江即解放桥；桥西北角矗立唐代名楼逍遥楼，紧连解放东路北侧的东西巷古街，路南侧即为正阳步行街。',
    position: [52, 6, 0],
    cameraPos: [104, 34, 42],
    cameraTarget: [36, 8, -4]
  },
  {
    id: 'ronghu-gate',
    name: '榕湖 · 古南门',
    enName: 'Rong Lake & Ancient South Gate',
    category: '唐代古城遗址',
    elevation: '千年古榕相伴',
    description: '位于阳桥以西的榕湖北岸，始建于唐代，门畔千年古榕枝繁叶茂，向东南可望阳桥与杉湖日月双塔。',
    position: [-64, 8, 12],
    cameraPos: [-106, 28, 56],
    cameraTarget: [-66, 6, 24]
  },
  {
    id: 'fubo-diecai',
    name: '伏波山 · 叠彩山',
    enName: 'Fubo & Diecai Hills',
    category: '滨江奇峰',
    elevation: '江畔孤峰 · 拿云亭',
    description: '位于解放桥正北的漓江西岸：伏波山与独秀峰东西遥望，再向北为层峦叠翠的叠彩山与山顶拿云亭。',
    position: [32, 22, -84],
    cameraPos: [104, 42, -62],
    cameraTarget: [32, 16, -84]
  },
  {
    id: 'river-cruise',
    name: '漓江泛舟视角',
    enName: 'Li River Boat POV',
    category: '沉浸游船',
    elevation: '水面低空视角',
    description: '乘一叶竹筏或画舫沿漓江顺流而下，自北向南依次经过叠彩山、伏波山、逍遥楼、解放桥与象鼻山，感受“舟行碧波上，人在画中游”。',
    position: [44, 3, 52],
    cameraPos: [48, 6.2, 118],
    cameraTarget: [34, 11, 48]
  }
];
