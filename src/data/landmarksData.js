// Guilin 3D City - Geography Helpers & Landmark Metadata

export function getLiRiverCenterX(z) {
  return 44 + Math.sin(z * 0.013) * 16 + Math.cos(z * 0.007) * 9;
}

export function getLiRiverHalfWidth(z) {
  return 22 + Math.sin(z * 0.018 + 0.8) * 3.2;
}

export function getPeachRiverCenterZ(x) {
  // Flows from southwest (-220, 128) to confluence with Li River around (34, 86)
  const t = Math.max(0, Math.min(1, (x + 220) / 260));
  return 132 - t * 44 + Math.sin(t * Math.PI * 2.1) * 11;
}

export function getPeachRiverHalfWidth(x) {
  const t = Math.max(0, Math.min(1, (x + 220) / 260));
  return 8.5 + t * 3.0;
}

// Check if a point (x, z) is inside any water body (returns depth > 0 if in water)
export function getWaterDepth(x, z) {
  let depth = 0;

  // 1. Li River (漓江)
  const liX = getLiRiverCenterX(z);
  const liHalfW = getLiRiverHalfWidth(z);
  const distLi = Math.abs(x - liX);
  if (distLi < liHalfW) {
    const d = (1 - distLi / liHalfW);
    depth = Math.max(depth, d * 4.2);
  }

  // 2. Peach Blossom River (桃花江) - west of Li River
  if (x < liX + 6) {
    const peachZ = getPeachRiverCenterZ(x);
    const peachHalfW = getPeachRiverHalfWidth(x);
    const distPeach = Math.abs(z - peachZ);
    if (distPeach < peachHalfW) {
      const d = 1 - distPeach / peachHalfW;
      depth = Math.max(depth, d * 3.2);
    }
  }

  // 3. Shan Lake (杉湖) centered at (-16, 26), rx=26, rz=18
  {
    const dx = (x - (-16)) / 26;
    const dz = (z - 26) / 18;
    const r = Math.sqrt(dx * dx + dz * dz);
    if (r < 1) {
      depth = Math.max(depth, (1 - r) * 3.5);
    }
  }

  // 4. Rong Lake (榕湖) centered at (-78, 25), rx=33, rz=20
  {
    const dx = (x - (-78)) / 33;
    const dz = (z - 25) / 20;
    const r = Math.sqrt(dx * dx + dz * dz);
    // Keep a small scenic island at (-76, 28)
    const idx = (x - (-76)) / 7.2;
    const idz = (z - 28) / 4.8;
    const ir = Math.sqrt(idx * idx + idz * idz);
    if (r < 1 && ir > 1.0) {
      const lakeD = (1 - r) * 3.5;
      const islandEdge = Math.min(1, (ir - 1.0) * 3.5);
      depth = Math.max(depth, lakeD * islandEdge);
    }
  }

  // 5. Canal connecting Rong Lake and Shan Lake (x in [-52, -36], z around 25.5)
  if (x >= -54 && x <= -34) {
    const distC = Math.abs(z - 25.5);
    if (distC < 5.2) {
      depth = Math.max(depth, (1 - distC / 5.2) * 2.6);
    }
  }

  // 6. Canal connecting Shan Lake to Li River (x in [5, 36], z around 26)
  if (x >= 4 && x <= liX) {
    const distC = Math.abs(z - 26);
    if (distC < 4.5) {
      depth = Math.max(depth, (1 - distC / 4.5) * 2.6);
    }
  }

  return depth;
}

// Check if (x, z) is near water bank (for avoiding building placement in water/shore)
export function isWaterOrShore(x, z, margin = 5.5) {
  if (getWaterDepth(x, z) > 0.02) return true;
  // Sample 4 cardinal points around margin
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

// Check if point is on a main road
export function isOnRoad(x, z, extraMargin = 0) {
  // Zhongshan Central Road (中山中路): x = -45
  if (Math.abs(x - (-45)) < 4.8 + extraMargin && z > -135 && z < 135) return true;
  // Jiefang Road (解放路): z = -25
  if (Math.abs(z - (-25)) < 5.0 + extraMargin && x > -145 && x < 145) return true;
  // Lakeside North Road (杉湖/榕湖北路): z = 1.5
  if (Math.abs(z - 1.5) < 3.6 + extraMargin && x > -130 && x < 24) return true;
  // South Avenue (南环路): z = 54
  if (Math.abs(z - 54) < 3.6 + extraMargin && x > -135 && x < 20) return true;
  // West Ring Road (西城路): x = -115
  if (Math.abs(x - (-115)) < 3.8 + extraMargin && z > -120 && z < 110) return true;
  // North Avenue (凤北路): z = -76
  if (Math.abs(z - (-76)) < 3.6 + extraMargin && x > -120 && x < 18) return true;
  // Binjiang Road (滨江路): follows west bank of Li River
  const binjiangX = getLiRiverCenterX(z) - getLiRiverHalfWidth(z) - 6.5;
  if (Math.abs(x - binjiangX) < 3.6 + extraMargin && z > -125 && z < 115) return true;
  // East Bank Binjiang / Qixing Rd (漓江东路)
  const eastRoadX = getLiRiverCenterX(z) + getLiRiverHalfWidth(z) + 7.5;
  if (Math.abs(x - eastRoadX) < 3.6 + extraMargin && z > -115 && z < 105) return true;

  return false;
}

export const LANDMARKS = [
  {
    id: 'overview',
    name: '桂林全景',
    enName: 'Guilin Panorama',
    category: '全城视角',
    elevation: '海拔 150m 盆地',
    description: '“桂林山水甲天下”——漓江与桃花江蜿蜒穿城，杉湖、榕湖点缀其中，百座喀斯特峰林环抱现代与古韵交融的山水名城。',
    position: [0, 0, 0],
    cameraPos: [-95, 92, 138],
    cameraTarget: [-5, 8, 12]
  },
  {
    id: 'elephant-hill',
    name: '象鼻山',
    enName: 'Elephant Trunk Hill',
    category: '桂林城徽 · 5A景区',
    elevation: '山高 55m · 普贤塔',
    description: '位于漓江与桃花江汇流处，酷似一头俯身漓江痛饮江水的巨象。象鼻与象身之间形成圆拱形“水月洞”，山顶矗立明代普贤塔。',
    position: [31, 14, 77],
    cameraPos: [92, 28, 118],
    cameraTarget: [32, 10, 77]
  },
  {
    id: 'twin-pagodas',
    name: '日月双塔',
    enName: 'Sun & Moon Twin Pagodas',
    category: '两江四湖地标',
    elevation: '日塔41m · 月塔35m',
    description: '屹立于杉湖碧波之上：日塔为九级纯铜金塔，月塔为七级琉璃银塔，双塔间以水下玻璃通道相连，夜幕降临时金银交辉、倒影如画。',
    position: [-17, 16, 26],
    cameraPos: [-12, 22, 68],
    cameraTarget: [-17, 12, 26]
  },
  {
    id: 'jingjiang-palace',
    name: '独秀峰 · 靖江王府',
    enName: 'Solitary Beauty Peak & Palace',
    category: '明代藩王城 · 历史核心',
    elevation: '峰高 66m · 南天一柱',
    description: '孤峰拔地而起于桂林市中心，素有“南天一柱”之誉；明代靖江王府依峰而建，朱墙黄瓦、承运门巍峨，“桂林山水甲天下”摩崖石刻即源于此。',
    position: [-32, 16, -46],
    cameraPos: [-32, 42, 10],
    cameraTarget: [-32, 14, -46]
  },
  {
    id: 'jiefang-bridge',
    name: '解放桥 · 漓江水韵',
    enName: 'Jiefang Bridge & Li River',
    category: '城市动脉 · 观景长廊',
    elevation: '跨漓江主桥',
    description: '横跨漓江两岸的城市主干道，西连正阳步行街与东西巷，东接七星公园与喀斯特峰群。入夜后桥拱流光溢彩，游船与竹筏穿桥而过。',
    position: [44, 6, -25],
    cameraPos: [98, 34, 24],
    cameraTarget: [40, 6, -25]
  },
  {
    id: 'ronghu-gate',
    name: '榕湖 · 古南门',
    enName: 'Rong Lake & Ancient South Gate',
    category: '唐代古城遗址',
    elevation: '千年古榕相伴',
    description: '始建于唐代的桂林古城南门，门畔千年古榕枝繁叶茂。榕湖湖心岛与玻璃桥相映成趣，是桂林“两江四湖”夜游的诗意精华段。',
    position: [-78, 8, 12],
    cameraPos: [-122, 28, 56],
    cameraTarget: [-76, 6, 20]
  },
  {
    id: 'fubo-diecai',
    name: '伏波山 · 叠彩山',
    enName: 'Fubo & Diecai Hills',
    category: '滨江奇峰',
    elevation: '江畔孤峰 · 拿云亭',
    description: '漓江西岸北段的绝美双峰：伏波山半枕陆地半插江潭，叠彩山层峦叠翠、山顶拿云亭可一览全城山水画卷。',
    position: [18, 22, -92],
    cameraPos: [95, 42, -72],
    cameraTarget: [18, 16, -90]
  },
  {
    id: 'river-cruise',
    name: '漓江泛舟视角',
    enName: 'Li River Boat POV',
    category: '沉浸游船',
    elevation: '水面低空视角',
    description: '乘一叶竹筏或两江四湖画舫顺流而下，近距离仰望象鼻山、解放桥与两岸灯火，感受“舟行碧波上，人在画中游”。',
    position: [46, 3, 40],
    cameraPos: [51, 6.2, 112],
    cameraTarget: [38, 11, 45]
  }
];
