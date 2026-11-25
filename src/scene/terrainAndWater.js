import * as THREE from 'three';
import {
  BRIDGES,
  getWaterDepth,
  isOnRoad
} from '../data/landmarksData.js';
import { getMaterialsLibrary } from './materialsLibrary.js';

// Subtle deterministic noise for natural terrain variation
function hash2(x, z) {
  const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453123;
  return s - Math.floor(s);
}

function valueNoise(x, z) {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx);
  const uz = fz * fz * (3 - 2 * fz);
  const a = hash2(ix, iz);
  const b = hash2(ix + 1, iz);
  const c = hash2(ix, iz + 1);
  const d = hash2(ix + 1, iz + 1);
  return a + (b - a) * ux + (c - a) * uz + (a - b - c + d) * ux * uz;
}

export function createTerrainAndWater(scene) {
  const group = new THREE.Group();
  group.name = 'TerrainAndWater';

  // 1. Sculpted Guilin Basin Terrain Mesh
  const terrainSize = 680;
  const segments = 240;
  const geo = new THREE.PlaneGeometry(terrainSize, terrainSize, segments, segments);
  geo.rotateX(-Math.PI / 2);

  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);

  const grassLush = new THREE.Color(0x4c7c46);
  const grassMeadow = new THREE.Color(0x5e8e50);
  const cityGround = new THREE.Color(0x8c8d84);
  const sandBank = new THREE.Color(0xb8aa8a);
  const riverBed = new THREE.Color(0x284a44);
  const hillBase = new THREE.Color(0x3a643d);
  const tmpColor = new THREE.Color();

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const waterDepth = getWaterDepth(x, z);
    const distFromCenter = Math.sqrt(x * x + z * z);

    let y = 0.0;
    if (waterDepth > 0.01) {
      // Carve river & lake beds smoothly
      y = -0.35 - waterDepth * 1.15;
    } else {
      // Gentle basin rise outside urban core
      const n1 = valueNoise(x * 0.025, z * 0.025);
      const n2 = valueNoise(x * 0.07, z * 0.07) * 0.35;
      const urbanFlat = Math.max(0, Math.min(1, (distFromCenter - 125) / 110));
      y = 0.45 + urbanFlat * (3.5 + n1 * 7.5) + (n1 * 0.35 + n2 * 0.25) * (0.2 + urbanFlat);

      // Slight gentle embankment taper near water
      const nearWater =
        getWaterDepth(x + 3.2, z) > 0 ||
        getWaterDepth(x - 3.2, z) > 0 ||
        getWaterDepth(x, z + 3.2) > 0 ||
        getWaterDepth(x, z - 3.2) > 0;
      if (nearWater) {
        y = Math.min(y, 0.32);
      }
    }

    pos.setY(i, y);

    // Vertex coloring for natural Guilin ground
    if (waterDepth > 0.25) {
      tmpColor.copy(riverBed);
    } else if (waterDepth > 0.0) {
      tmpColor.copy(sandBank).lerp(riverBed, waterDepth * 3.5);
    } else {
      const n = valueNoise(x * 0.04, z * 0.04);
      const inCityCore = x > -135 && x < 135 && z > -120 && z < 110;
      if (isOnRoad(x, z, 1.5)) {
        tmpColor.copy(cityGround).multiplyScalar(0.88);
      } else if (inCityCore && distFromCenter < 118) {
        // Blend between park greenery and urban ground
        const parkZone =
          (x > -115 && x < 15 && z > -5 && z < 50) || // Two Lakes Park belt
          (x > 75 && z > -55 && z < 45); // Seven Star Park east bank
        if (parkZone) {
          tmpColor.copy(grassLush).lerp(grassMeadow, n);
        } else {
          tmpColor.copy(grassMeadow).lerp(cityGround, 0.42 + n * 0.15);
        }
      } else {
        tmpColor.copy(grassLush).lerp(hillBase, Math.min(1, (distFromCenter - 110) / 140) * 0.65 + n * 0.2);
      }
    }

    colors[i * 3] = tmpColor.r;
    colors[i * 3 + 1] = tmpColor.g;
    colors[i * 3 + 2] = tmpColor.b;
  }

  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();

  const mats = getMaterialsLibrary();
  const terrainMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    map: mats.terrainDetail.map,
    bumpMap: mats.terrainDetail.bumpMap,
    bumpScale: 0.42,
    roughness: 0.9,
    metalness: 0.02
  });
  const terrainMesh = new THREE.Mesh(geo, terrainMat);
  terrainMesh.receiveShadow = true;
  terrainMesh.name = 'GuilinTerrain';
  group.add(terrainMesh);

  // 2. Animated Custom GLSL Water Plane (漓江 & 两江四湖)
  const waterUniforms = {
    uTime: { value: 0 },
    uFlowSpeed: { value: 1.0 },
    uDeepColor: { value: new THREE.Color(0x165e5c) },
    uShallowColor: { value: new THREE.Color(0x3ba094) },
    uSunColor: { value: new THREE.Color(0xfff1d0) },
    uSunDir: { value: new THREE.Vector3(0.5, 0.6, 0.4).normalize() },
    uSkyColor: { value: new THREE.Color(0x88b8d0) },
    uNightFactor: { value: 0.0 },
    uFogColor: { value: new THREE.Color(0xcbdbe2) },
    uFogDensity: { value: 0.0022 }
  };

  const waterMat = new THREE.ShaderMaterial({
    uniforms: waterUniforms,
    transparent: true,
    vertexShader: /* glsl */ `
      uniform float uTime;
      uniform float uFlowSpeed;
      varying vec3 vWorldPos;
      varying vec2 vUv;

      void main() {
        vUv = uv;
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        float wave = sin(worldPos.x * 0.18 + uTime * 1.4 * uFlowSpeed) * 0.045
                   + cos(worldPos.z * 0.22 - uTime * 1.8 * uFlowSpeed) * 0.045;
        worldPos.y += wave;
        vWorldPos = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uFlowSpeed;
      uniform vec3 uDeepColor;
      uniform vec3 uShallowColor;
      uniform vec3 uSunColor;
      uniform vec3 uSunDir;
      uniform vec3 uSkyColor;
      uniform float uNightFactor;
      uniform vec3 uFogColor;
      uniform float uFogDensity;

      varying vec3 vWorldPos;
      varying vec2 vUv;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }

      void main() {
        vec2 flowCoord1 = vWorldPos.xz * 0.16 + vec2(0.0, -uTime * 0.45 * uFlowSpeed);
        vec2 flowCoord2 = vWorldPos.xz * 0.34 + vec2(uTime * 0.18 * uFlowSpeed, -uTime * 0.68 * uFlowSpeed);

        float n1 = noise(flowCoord1);
        float n2 = noise(flowCoord2);
        float ripple = (n1 * 0.6 + n2 * 0.4);

        // Compute perturbed water normal
        float eps = 0.25;
        float nx = noise(flowCoord1 + vec2(eps, 0.0)) - noise(flowCoord1 - vec2(eps, 0.0));
        float nz = noise(flowCoord1 + vec2(0.0, eps)) - noise(flowCoord1 - vec2(0.0, eps));
        vec3 N = normalize(vec3(nx * 0.55, 1.0, nz * 0.55));

        vec3 V = normalize(cameraPosition - vWorldPos);
        float fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.2);

        // Emerald jade Li River base color
        vec3 baseColor = mix(uDeepColor, uShallowColor, ripple * 0.55 + 0.2);

        // Sky reflection
        vec3 color = mix(baseColor, uSkyColor * 0.92, clamp(fresnel * 0.72 + 0.08, 0.0, 0.85));

        // Sun / Moon specular shimmer
        vec3 H = normalize(uSunDir + V);
        float spec = pow(max(dot(N, H), 0.0), 96.0);
        color += uSunColor * spec * mix(1.15, 0.45, uNightFactor);

        // Night reflections under Sun & Moon Pagodas (Shan Lake) and Jiefang Bridge
        if (uNightFactor > 0.05) {
          // Golden Sun Pagoda reflection around (1, 35)
          float dSun = length(vWorldPos.xz - vec2(1.0, 35.0));
          float sunGlow = exp(-dSun * 0.11) * (0.65 + 0.35 * sin(vWorldPos.z * 1.8 + uTime * 3.0));
          color += vec3(1.0, 0.72, 0.22) * sunGlow * uNightFactor * 1.15;

          // Silver-blue Moon Pagoda reflection around (-13, 37)
          float dMoon = length(vWorldPos.xz - vec2(-13.0, 37.0));
          float moonGlow = exp(-dMoon * 0.12) * (0.65 + 0.35 * cos(vWorldPos.z * 2.0 - uTime * 2.6));
          color += vec3(0.45, 0.82, 1.0) * moonGlow * uNightFactor * 1.05;

          // Jiefang Bridge warm reflection along z = -14, x in [18, 76]
          float dBridgeZ = abs(vWorldPos.z - (-14.0));
          float inBridgeX = smoothstep(14.0, 24.0, vWorldPos.x) * (1.0 - smoothstep(68.0, 78.0, vWorldPos.x));
          float bridgeGlow = exp(-dBridgeZ * 0.2) * inBridgeX * (0.7 + 0.3 * ripple);
          color += vec3(1.0, 0.78, 0.35) * bridgeGlow * uNightFactor * 0.75;

          // Elephant Trunk Hill Water Moon Cave moonlight shimmer around (24, 76)
          float dEleph = length(vWorldPos.xz - vec2(24.0, 76.0));
          color += vec3(0.85, 0.9, 1.0) * exp(-dEleph * 0.12) * uNightFactor * 0.55;
        }

        // Exponential squared fog matching Three.js FogExp2
        float dist = length(cameraPosition - vWorldPos);
        float fogFactor = 1.0 - exp(-pow(dist * uFogDensity, 2.0));
        color = mix(color, uFogColor, clamp(fogFactor, 0.0, 1.0));

        gl_FragColor = vec4(color, 0.90);
      }
    `
  });

  const waterGeo = new THREE.PlaneGeometry(520, 520, 96, 96);
  waterGeo.rotateX(-Math.PI / 2);
  const waterMesh = new THREE.Mesh(waterGeo, waterMat);
  waterMesh.position.y = -0.15;
  waterMesh.name = 'GuilinWater';
  group.add(waterMesh);

  // 3. Bridges across Two Rivers & Four Lakes (with true sculpted approach ramps!)
  const bridgeLights = [];
  const bridgesGroup = new THREE.Group();
  bridgesGroup.name = 'Bridges';

  for (const b of BRIDGES) {
    const bridgeMesh =
      b.style === 'jiefang'
        ? createJiefangBridge(b, bridgeLights)
        : createStoneArchBridge(b, 0xd8d1c2, bridgeLights);
    if (b.id === 'jiefang-bridge') {
      bridgeMesh.userData = { landmarkId: 'jiefang-bridge' };
    }
    bridgesGroup.add(bridgeMesh);
  }

  // Ronghu Crystal Arch Bridge (榕湖玻璃桥) spanning Rong Lake to island
  const crystalBridge = createCrystalBridge(-74, 27, 22, bridgeLights);
  crystalBridge.userData = { landmarkId: 'ronghu-gate' };
  bridgesGroup.add(crystalBridge);

  group.add(bridgesGroup);

  // 4. Decorative stone promenade railings along Shan Lake & Binjiang Waterfront
  const promenade = createLakesidePromenade();
  group.add(promenade);

  scene.add(group);

  return {
    group,
    terrainMesh,
    waterUniforms,
    bridgeLights
  };
}

/**
 * Helper: creates two solid sloped approach ramps (引桥上下坡) + sloped balustrades
 * + solid stone ramp abutments so every bridge smoothly meets the city road surface.
 */
function addSlopedBridgeRamps(g, b, deckMat, stoneMat) {
  const rise = b.deckY - b.baseY;
  const rampHyp = Math.hypot(b.rampLength, rise);
  const rampAngle = Math.atan2(rise, b.rampLength);
  const halfSpan = b.spanLength / 2;
  const rampCenterX = halfSpan + b.rampLength / 2;
  const rampMidY = (b.baseY + b.deckY) / 2;
  const deckThick = 0.65;

  // Build trapezoidal wedge abutment geometry under each ramp so there is no floating gap
  const wedgeShape = new THREE.Shape();
  wedgeShape.moveTo(0, b.baseY - 0.5);
  wedgeShape.lineTo(b.rampLength, b.baseY - 0.5);
  wedgeShape.lineTo(b.rampLength, b.deckY - 0.35);
  wedgeShape.lineTo(0, b.baseY - 0.05);
  wedgeShape.closePath();

  const wedgeGeo = new THREE.ExtrudeGeometry(wedgeShape, {
    depth: b.width - 0.5,
    bevelEnabled: false
  });
  wedgeGeo.translate(0, 0, -(b.width - 0.5) / 2);

  for (const dir of [-1, 1]) {
    // Sloped road deck surface
    const rampDeck = new THREE.Mesh(
      new THREE.BoxGeometry(rampHyp + 0.3, deckThick, b.width),
      deckMat
    );
    rampDeck.position.set(dir * rampCenterX, rampMidY - deckThick / 2, 0);
    rampDeck.rotation.z = dir === -1 ? rampAngle : -rampAngle;
    rampDeck.castShadow = true;
    rampDeck.receiveShadow = true;
    g.add(rampDeck);

    // Solid stone ramp abutment wall underneath
    const wedge = new THREE.Mesh(wedgeGeo, stoneMat);
    if (dir === -1) {
      wedge.position.set(-halfSpan - b.rampLength, 0, 0);
    } else {
      wedge.scale.x = -1;
      wedge.position.set(halfSpan + b.rampLength, 0, 0);
    }
    wedge.castShadow = true;
    wedge.receiveShadow = true;
    g.add(wedge);

    // Continuous sloped balustrades on both sides of the ramp
    for (const side of [-b.width / 2 + 0.24, b.width / 2 - 0.24]) {
      const rail = new THREE.Mesh(
        new THREE.BoxGeometry(rampHyp + 0.2, 0.82, 0.4),
        stoneMat
      );
      rail.position.set(dir * rampCenterX, rampMidY + 0.38, side);
      rail.rotation.z = dir === -1 ? rampAngle : -rampAngle;
      rail.castShadow = true;
      g.add(rail);
    }
  }
}

function createJiefangBridge(b, bridgeLights) {
  const g = new THREE.Group();
  g.position.set(b.cx, 0, b.cz);
  if (b.axis === 'z') g.rotation.y = Math.PI / 2;

  const mats = getMaterialsLibrary();
  const length = b.spanLength;
  const deckMat = new THREE.MeshStandardMaterial({
    map: mats.asphalt.map,
    bumpMap: mats.asphalt.bumpMap,
    bumpScale: 0.12,
    roughnessMap: mats.asphalt.roughnessMap,
    roughness: 0.85,
    metalness: 0.05
  });
  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0xe6dfd2,
    map: mats.granite.map,
    bumpMap: mats.granite.bumpMap,
    bumpScale: 0.18,
    roughness: 0.72,
    metalness: 0.04
  });
  const archGlowMat = new THREE.MeshStandardMaterial({
    color: 0xffd27d,
    emissive: 0xffa833,
    emissiveIntensity: 0.1,
    roughness: 0.4
  });
  bridgeLights.push(archGlowMat);

  // Main flat road deck (top surface exactly at b.deckY)
  const deckThick = 0.7;
  const deck = new THREE.Mesh(new THREE.BoxGeometry(length + 0.3, deckThick, b.width), deckMat);
  deck.position.y = b.deckY - deckThick / 2;
  deck.castShadow = true;
  deck.receiveShadow = true;
  g.add(deck);

  // Sloped East & West Approach Ramps (引桥上下坡)
  addSlopedBridgeRamps(g, b, deckMat, stoneMat);

  // Side balustrades on main span
  for (const side of [-b.width / 2 + 0.25, b.width / 2 - 0.25]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(length, 0.85, 0.45), stoneMat);
    rail.position.set(0, b.deckY + 0.4, side);
    rail.castShadow = true;
    g.add(rail);
  }

  // Three graceful stone arches + submerged piers (pier tops sit cleanly BELOW road deck!)
  const numSpans = 3;
  const spanLen = length / numSpans;
  for (let i = 0; i <= numSpans; i++) {
    const px = -length / 2 + i * spanLen;
    const pierH = b.deckY + 0.8;
    const pier = new THREE.Mesh(new THREE.BoxGeometry(2.1, pierH, b.width + 0.4), stoneMat);
    pier.position.set(px, pierH / 2 - 1.1, 0);
    pier.castShadow = true;
    g.add(pier);

    if (i < numSpans) {
      const archCenterX = px + spanLen / 2;
      const archGeo = new THREE.TorusGeometry(spanLen * 0.48, 0.55, 8, 22, Math.PI);
      for (const side of [-b.width / 2 + 0.45, b.width / 2 - 0.45]) {
        const arch = new THREE.Mesh(archGeo, stoneMat);
        arch.position.set(archCenterX, 0.85, side);
        g.add(arch);

        // Glowing night contour strip along the arch
        const lightArch = new THREE.Mesh(
          new THREE.TorusGeometry(spanLen * 0.45, 0.16, 6, 20, Math.PI),
          archGlowMat
        );
        lightArch.position.set(archCenterX, 0.85, side + Math.sign(side) * 0.35);
        g.add(lightArch);
      }
    }
  }

  // Traditional ornate lamp posts along main span
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x3a3d42, metalness: 0.5, roughness: 0.4 });
  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xfff3cc,
    emissive: 0xffc66b,
    emissiveIntensity: 0.15
  });
  bridgeLights.push(bulbMat);

  for (let x = -length / 2 + 4; x <= length / 2 - 4; x += 9) {
    for (const side of [-b.width / 2 + 0.45, b.width / 2 - 0.45]) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 2.8, 6), poleMat);
      pole.position.set(x, b.deckY + 1.8, side);
      g.add(pole);

      const globe = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 8), bulbMat);
      globe.position.set(x, b.deckY + 3.3, side);
      g.add(globe);
    }
  }

  return g;
}

function createStoneArchBridge(b, colorHex, bridgeLights) {
  const g = new THREE.Group();
  g.position.set(b.cx, 0, b.cz);
  if (b.axis === 'z') g.rotation.y = Math.PI / 2;

  const mats = getMaterialsLibrary();
  const length = b.spanLength;
  const width = b.width;
  const stoneMat = new THREE.MeshStandardMaterial({
    color: colorHex,
    map: mats.granite.map,
    bumpMap: mats.granite.bumpMap,
    bumpScale: 0.18,
    roughness: 0.74
  });
  const roadMat = new THREE.MeshStandardMaterial({
    map: mats.asphalt.map,
    bumpMap: mats.asphalt.bumpMap,
    bumpScale: 0.12,
    roughnessMap: mats.asphalt.roughnessMap,
    roughness: 0.86
  });
  const glowMat = new THREE.MeshStandardMaterial({
    color: 0xffe0a3,
    emissive: 0xffb347,
    emissiveIntensity: 0.1
  });
  bridgeLights.push(glowMat);

  // Main flat deck (top at b.deckY)
  const deckThick = 0.65;
  const deck = new THREE.Mesh(new THREE.BoxGeometry(length + 0.3, deckThick, width), roadMat);
  deck.position.y = b.deckY - deckThick / 2;
  deck.castShadow = true;
  deck.receiveShadow = true;
  g.add(deck);

  // Sloped Approach Ramps (引桥上下坡)
  addSlopedBridgeRamps(g, b, roadMat, stoneMat);

  for (const side of [-width / 2 + 0.25, width / 2 - 0.25]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(length, 0.75, 0.36), stoneMat);
    rail.position.set(0, b.deckY + 0.36, side);
    g.add(rail);

    const arch = new THREE.Mesh(new THREE.TorusGeometry(length * 0.42, 0.38, 7, 18, Math.PI), stoneMat);
    arch.position.set(0, 0.4, side);
    g.add(arch);

    const strip = new THREE.Mesh(new THREE.TorusGeometry(length * 0.40, 0.12, 6, 16, Math.PI), glowMat);
    strip.position.set(0, 0.4, side + Math.sign(side) * 0.22);
    g.add(strip);
  }

  return g;
}

function createCrystalBridge(cx, cz, length, bridgeLights) {
  // Guilin Ronghu Glass / Crystal Bridge (榕湖玻璃桥)
  const g = new THREE.Group();
  g.position.set(cx, 0, cz);
  g.rotation.y = Math.PI * 0.38;

  const glassMat = new THREE.MeshStandardMaterial({
    color: 0xbef5ff,
    emissive: 0x45c8ff,
    emissiveIntensity: 0.18,
    roughness: 0.15,
    metalness: 0.2,
    transparent: true,
    opacity: 0.85
  });
  bridgeLights.push(glassMat);

  const archCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-length / 2, 0.5, 0),
    new THREE.Vector3(-length / 4, 2.5, 0),
    new THREE.Vector3(0, 3.2, 0),
    new THREE.Vector3(length / 4, 2.5, 0),
    new THREE.Vector3(length / 2, 0.5, 0)
  ]);

  const deckGeo = new THREE.TubeGeometry(archCurve, 24, 1.35, 6, false);
  deckGeo.scale(1, 0.28, 1.4);
  const deck = new THREE.Mesh(deckGeo, glassMat);
  deck.position.y = 0.2;
  g.add(deck);

  // Decorative luminous side ribs
  for (const zOff of [-1.5, 1.5]) {
    const railGeo = new THREE.TubeGeometry(archCurve, 24, 0.16, 6, false);
    const rail = new THREE.Mesh(railGeo, glassMat);
    rail.position.set(0, 0.95, zOff);
    g.add(rail);
  }

  return g;
}

function createLakesidePromenade() {
  const g = new THREE.Group();
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0xc8c2b6, roughness: 0.8 });

  // Stone rim posts around Shan Lake for crisp urban waterfront definition
  const count = 42;
  const postGeo = new THREE.BoxGeometry(0.65, 0.65, 0.65);
  const inst = new THREE.InstancedMesh(postGeo, stoneMat, count);
  const dummy = new THREE.Object3D();
  let idx = 0;

  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const x = -6 + Math.cos(a) * 23.8;
    const z = 36 + Math.sin(a) * 16.8;
    if (getWaterDepth(x, z) > 0.05) continue;
    dummy.position.set(x, 0.65, z);
    dummy.rotation.set(0, -a, 0);
    dummy.updateMatrix();
    inst.setMatrixAt(idx++, dummy.matrix);
  }
  inst.count = idx;
  g.add(inst);
  return g;
}
