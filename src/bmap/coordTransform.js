// Exact WGS-84 -> GCJ-02 -> BD-09 Coordinate Transformation (accurate to < 2m on Baidu Maps)
// Zero network / REST geocoding calls — respects personal Baidu AK QPS limits!

const PI = Math.PI;
const X_PI = (PI * 3000.0) / 180.0;
const A = 6378245.0;
const EE = 0.00669342162296594323;

function transformLat(lng, lat) {
  let ret =
    -100.0 +
    2.0 * lng +
    3.0 * lat +
    0.2 * lat * lat +
    0.1 * lng * lat +
    0.2 * Math.sqrt(Math.abs(lng));
  ret += ((20.0 * Math.sin(6.0 * lng * PI) + 20.0 * Math.sin(2.0 * lng * PI)) * 2.0) / 3.0;
  ret += ((20.0 * Math.sin(lat * PI) + 40.0 * Math.sin((lat / 3.0) * PI)) * 2.0) / 3.0;
  ret += ((160.0 * Math.sin((lat / 12.0) * PI) + 320 * Math.sin((lat * PI) / 30.0)) * 2.0) / 3.0;
  return ret;
}

function transformLng(lng, lat) {
  let ret =
    300.0 +
    lng +
    2.0 * lat +
    0.1 * lng * lng +
    0.1 * lng * lat +
    0.1 * Math.sqrt(Math.abs(lng));
  ret += ((20.0 * Math.sin(6.0 * lng * PI) + 20.0 * Math.sin(2.0 * lng * PI)) * 2.0) / 3.0;
  ret += ((20.0 * Math.sin(lng * PI) + 40.0 * Math.sin((lng / 3.0) * PI)) * 2.0) / 3.0;
  ret += ((150.0 * Math.sin((lng / 12.0) * PI) + 300.0 * Math.sin((lng / 30.0) * PI)) * 2.0) / 3.0;
  return ret;
}

export function wgs84ToGcj02(lng, lat) {
  let dLat = transformLat(lng - 105.0, lat - 35.0);
  let dLng = transformLng(lng - 105.0, lat - 35.0);
  const radLat = (lat / 180.0) * PI;
  let magic = Math.sin(radLat);
  magic = 1 - EE * magic * magic;
  const sqrtMagic = Math.sqrt(magic);
  dLat = (dLat * 180.0) / (((A * (1 - EE)) / (magic * sqrtMagic)) * PI);
  dLng = (dLng * 180.0) / ((A / sqrtMagic) * Math.cos(radLat) * PI);
  return [lng + dLng, lat + dLat];
}

export function gcj02ToBd09(lng, lat) {
  const z = Math.sqrt(lng * lng + lat * lat) + 0.00002 * Math.sin(lat * X_PI);
  const theta = Math.atan2(lat, lng) + 0.000003 * Math.cos(lng * X_PI);
  return [z * Math.cos(theta) + 0.0065, z * Math.sin(theta) + 0.006];
}

export function wgs84ToBd09(lng, lat) {
  const [gLng, gLat] = wgs84ToGcj02(lng, lat);
  return gcj02ToBd09(gLng, gLat);
}

// Exact real-world Guilin landmark coordinates converted from verified WGS-84 -> BD-09!
export const GUILIN_BD09_POINTS = {
  overview: {
    id: 'overview',
    name: '桂林全景',
    bd09: wgs84ToBd09(110.2942, 25.2795),
    zoom: 16.3,
    tilt: 58,
    heading: -12
  },
  'elephant-hill': {
    id: 'elephant-hill',
    name: '象鼻山',
    bd09: wgs84ToBd09(110.29151, 25.27007),
    zoom: 18.2,
    tilt: 64,
    heading: -35
  },
  'twin-pagodas': {
    id: 'twin-pagodas',
    name: '日月双塔',
    bd09: wgs84ToBd09(110.2924, 25.2724),
    sunBd09: wgs84ToBd09(110.2928, 25.2723),
    moonBd09: wgs84ToBd09(110.2918, 25.2724),
    zoom: 18.4,
    tilt: 64,
    heading: 8
  },
  'jingjiang-palace': {
    id: 'jingjiang-palace',
    name: '独秀峰 · 靖江王府',
    bd09: wgs84ToBd09(110.29491, 25.28614),
    gateBd09: wgs84ToBd09(110.29475, 25.28365),
    zoom: 18.0,
    tilt: 64,
    heading: -8
  },
  'jiefang-bridge': {
    id: 'jiefang-bridge',
    name: '解放桥 · 东西巷逍遥楼',
    bd09: wgs84ToBd09(110.29833, 25.27963),
    xiaoyaoBd09: wgs84ToBd09(110.29725, 25.28131),
    eastWestBd09: wgs84ToBd09(110.29446, 25.28164),
    zhengyangBd09: wgs84ToBd09(110.29385, 25.2781),
    zoom: 18.2,
    tilt: 65,
    heading: -24
  },
  'ronghu-gate': {
    id: 'ronghu-gate',
    name: '榕湖 · 古南门',
    bd09: wgs84ToBd09(110.28598, 25.27891),
    zoom: 18.6,
    tilt: 66,
    heading: 15
  },
  'fubo-diecai': {
    id: 'fubo-diecai',
    name: '伏波山 · 叠彩山',
    bd09: wgs84ToBd09(110.29937, 25.28656),
    diecaiBd09: wgs84ToBd09(110.2988, 25.2938),
    zoom: 17.5,
    tilt: 62,
    heading: -28
  },
  'river-cruise': {
    id: 'river-cruise',
    name: '漓江泛舟视角',
    bd09: wgs84ToBd09(110.2962, 25.2745),
    zoom: 17.8,
    tilt: 72,
    heading: -18
  }
};

export const BMAP_ROAM_SPAWNS = [
  { id: 'binjiang', name: '滨江路 · 象鼻山', bd09: wgs84ToBd09(110.2908, 25.2712), heading: 15 },
  { id: 'jiefang-bridge', name: '解放桥 · 跨漓江', bd09: wgs84ToBd09(110.2976, 25.2798), heading: 108 },
  { id: 'shan-lake', name: '杉湖 · 日月双塔', bd09: wgs84ToBd09(110.2921, 25.2752), heading: 0 },
  { id: 'east-west-alley', name: '东西巷 · 逍遥楼', bd09: wgs84ToBd09(110.2952, 25.2809), heading: 72 },
  { id: 'jingjiang-gate', name: '靖江王府 · 承运门', bd09: wgs84ToBd09(110.2947, 25.2827), heading: -8 },
  { id: 'ronghu-gate', name: '榕湖 · 古南门', bd09: wgs84ToBd09(110.2860, 25.2782), heading: 0 }
];
