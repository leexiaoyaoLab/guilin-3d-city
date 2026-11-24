import * as THREE from 'three';

/**
 * Dynamic Guilin Atmosphere System:
 * - Procedural sky dome shader with sun/moon disc & ink-wash horizon mist
 * - Directional sun/moon shadows & hemisphere ambient fill
 * - Floating low-altitude karst valley mist clouds (桂林晨雾/烟雨)
 */
export function createAtmosphere(scene) {
  // Exponential valley fog
  const fog = new THREE.FogExp2(0xc8dce0, 0.0021);
  scene.fog = fog;

  // 1. Custom Gradient Sky Dome Shader
  const skyUniforms = {
    uTopColor: { value: new THREE.Color(0x4b8ec2) },
    uHorizonColor: { value: new THREE.Color(0xd2e5e8) },
    uBottomColor: { value: new THREE.Color(0xb6ced2) },
    uSunDir: { value: new THREE.Vector3(0.4, 0.5, 0.3).normalize() },
    uSunColor: { value: new THREE.Color(0xfff4d6) },
    uStarIntensity: { value: 0.0 }
  };

  const skyMat = new THREE.ShaderMaterial({
    uniforms: skyUniforms,
    side: THREE.BackSide,
    depthWrite: false,
    vertexShader: /* glsl */ `
      varying vec3 vWorldDir;
      void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldDir = normalize(worldPos.xyz);
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uTopColor;
      uniform vec3 uHorizonColor;
      uniform vec3 uBottomColor;
      uniform vec3 uSunDir;
      uniform vec3 uSunColor;
      uniform float uStarIntensity;
      varying vec3 vWorldDir;

      float hash(vec3 p) {
        p = fract(p * 0.3183099 + 0.1);
        p *= 17.0;
        return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
      }

      void main() {
        vec3 dir = normalize(vWorldDir);
        float h = dir.y;

        vec3 col;
        if (h >= 0.0) {
          col = mix(uHorizonColor, uTopColor, pow(h, 0.58));
        } else {
          col = mix(uHorizonColor, uBottomColor, clamp(-h * 3.0, 0.0, 1.0));
        }

        // Sun / Moon halo & disc
        float sunAmt = max(dot(dir, normalize(uSunDir)), 0.0);
        col += uSunColor * pow(sunAmt, 14.0) * 0.32;
        col += uSunColor * smoothstep(0.9965, 0.9992, sunAmt) * 1.4;

        // Subtle starry night sky
        if (uStarIntensity > 0.02 && h > 0.08) {
          vec3 grid = floor(dir * 260.0);
          float star = hash(grid);
          if (star > 0.9965) {
            float twinkle = (star - 0.9965) / 0.0035;
            col += vec3(0.85, 0.92, 1.0) * twinkle * uStarIntensity * smoothstep(0.08, 0.35, h);
          }
        }

        gl_FragColor = vec4(col, 1.0);
      }
    `
  });

  const skyDome = new THREE.Mesh(new THREE.SphereGeometry(520, 32, 20), skyMat);
  scene.add(skyDome);

  // 2. Lights
  const hemiLight = new THREE.HemisphereLight(0xd9eef5, 0x456348, 0.85);
  scene.add(hemiLight);

  const sunLight = new THREE.DirectionalLight(0xfff5e0, 1.85);
  sunLight.position.set(120, 140, 80);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 20;
  sunLight.shadow.camera.far = 420;
  const d = 170;
  sunLight.shadow.camera.left = -d;
  sunLight.shadow.camera.right = d;
  sunLight.shadow.camera.top = d;
  sunLight.shadow.camera.bottom = -d;
  sunLight.shadow.bias = -0.0005;
  scene.add(sunLight);

  // Subtle fill light from opposite side for soft ink-painting mountain shading
  const fillLight = new THREE.DirectionalLight(0x88b4cc, 0.35);
  fillLight.position.set(-100, 65, -90);
  scene.add(fillLight);

  // 3. Drifting Low-Altitude Karst Mist Clouds (桂林山间云雾带)
  const mistGroup = new THREE.Group();
  const mistCanvas = document.createElement('canvas');
  mistCanvas.width = 128;
  mistCanvas.height = 128;
  const mCtx = mistCanvas.getContext('2d');
  const grad = mCtx.createRadialGradient(64, 64, 6, 64, 64, 62);
  grad.addColorStop(0, 'rgba(255,255,255,0.52)');
  grad.addColorStop(0.5, 'rgba(235,246,248,0.22)');
  grad.addColorStop(1, 'rgba(255,255,255,0.0)');
  mCtx.fillStyle = grad;
  mCtx.fillRect(0, 0, 128, 128);

  const mistTex = new THREE.CanvasTexture(mistCanvas);
  const mistMat = new THREE.SpriteMaterial({
    map: mistTex,
    transparent: true,
    opacity: 0.32,
    depthWrite: false,
    color: 0xe6f2f5
  });

  const mistSprites = [];
  for (let i = 0; i < 42; i++) {
    const angle = (i / 42) * Math.PI * 2 + (i % 3) * 0.25;
    const radius = 85 + (i % 7) * 32;
    const sp = new THREE.Sprite(mistMat);
    const sx = 46 + (i % 5) * 16;
    const sy = 14 + (i % 3) * 5;
    sp.scale.set(sx, sy, 1);
    sp.position.set(
      Math.cos(angle) * radius,
      14 + (i % 4) * 6.5,
      Math.sin(angle) * radius
    );
    sp.userData = {
      angle,
      radius,
      speed: 0.008 + (i % 4) * 0.004,
      baseY: sp.position.y
    };
    mistGroup.add(sp);
    mistSprites.push(sp);
  }
  scene.add(mistGroup);

  // Keyframe atmosphere palettes by time-of-day (hours 0..24)
  const palettes = [
    {
      hour: 0,
      top: 0x071022,
      horizon: 0x132642,
      fog: 0x102036,
      sunCol: 0x9ec8ff,
      sunInt: 0.48,
      hemiSky: 0x20395c,
      hemiGround: 0x13222b,
      hemiInt: 0.45,
      waterDeep: 0x091d2b,
      waterShallow: 0x153a4d,
      night: 1.0
    },
    {
      hour: 6.2, // 晨雾 (Misty Guilin Dawn)
      top: 0x5c83a6,
      horizon: 0xf4ccb2,
      fog: 0xdfdad5,
      sunCol: 0xffcda0,
      sunInt: 1.25,
      hemiSky: 0xf2d7c4,
      hemiGround: 0x48614d,
      hemiInt: 0.78,
      waterDeep: 0x1c595c,
      waterShallow: 0x4a948e,
      night: 0.18
    },
    {
      hour: 11.5, // 晴日 (Crisp Emerald Day)
      top: 0x3b84c4,
      horizon: 0xd0e7ea,
      fog: 0xc5dde2,
      sunCol: 0xfff8e8,
      sunInt: 1.95,
      hemiSky: 0xdff2fa,
      hemiGround: 0x4c704c,
      hemiInt: 0.92,
      waterDeep: 0x14635f,
      waterShallow: 0x3ba696,
      night: 0.0
    },
    {
      hour: 17.6, // 日落 (Golden Guilin Sunset)
      top: 0x3e5682,
      horizon: 0xf49d62,
      fog: 0xdba688,
      sunCol: 0xff9a4c,
      sunInt: 1.65,
      hemiSky: 0xffbf8c,
      hemiGround: 0x47453e,
      hemiInt: 0.72,
      waterDeep: 0x1c4752,
      waterShallow: 0x5a857e,
      night: 0.25
    },
    {
      hour: 20.5, // 夜景 (Two Rivers & Four Lakes Night)
      top: 0x09152b,
      horizon: 0x193152,
      fog: 0x132640,
      sunCol: 0xaad0ff,
      sunInt: 0.52,
      hemiSky: 0x26436b,
      hemiGround: 0x172933,
      hemiInt: 0.5,
      waterDeep: 0x0b2233,
      waterShallow: 0x184154,
      night: 1.0
    },
    {
      hour: 24,
      top: 0x071022,
      horizon: 0x132642,
      fog: 0x102036,
      sunCol: 0x9ec8ff,
      sunInt: 0.48,
      hemiSky: 0x20395c,
      hemiGround: 0x13222b,
      hemiInt: 0.45,
      waterDeep: 0x091d2b,
      waterShallow: 0x153a4d,
      night: 1.0
    }
  ];

  const c1 = new THREE.Color();
  const c2 = new THREE.Color();

  function lerpHex(hexA, hexB, t, out) {
    c1.setHex(hexA);
    c2.setHex(hexB);
    return out.copy(c1).lerp(c2, t);
  }

  let currentNightFactor = 0;

  function update(timeOfDay, weather, mistLevel, dt, elapsed, waterUniforms) {
    const h = ((timeOfDay % 24) + 24) % 24;

    // Find surrounding palette keyframes
    let pA = palettes[0];
    let pB = palettes[palettes.length - 1];
    for (let i = 0; i < palettes.length - 1; i++) {
      if (h >= palettes[i].hour && h <= palettes[i + 1].hour) {
        pA = palettes[i];
        pB = palettes[i + 1];
        break;
      }
    }
    const span = Math.max(0.001, pB.hour - pA.hour);
    const t = (h - pA.hour) / span;

    // Interpolate sky, fog, lighting
    lerpHex(pA.top, pB.top, t, skyUniforms.uTopColor.value);
    lerpHex(pA.horizon, pB.horizon, t, skyUniforms.uHorizonColor.value);
    lerpHex(pA.fog, pB.fog, t, fog.color);
    skyUniforms.uBottomColor.value.copy(fog.color);
    lerpHex(pA.sunCol, pB.sunCol, t, skyUniforms.uSunColor.value);
    sunLight.color.copy(skyUniforms.uSunColor.value);

    let sunInt = THREE.MathUtils.lerp(pA.sunInt, pB.sunInt, t);
    let hemiInt = THREE.MathUtils.lerp(pA.hemiInt, pB.hemiInt, t);
    currentNightFactor = THREE.MathUtils.lerp(pA.night, pB.night, t);

    lerpHex(pA.hemiSky, pB.hemiSky, t, hemiLight.color);
    lerpHex(pA.hemiGround, pB.hemiGround, t, hemiLight.groundColor);

    // Weather adjustments (clear | misty | rain)
    let baseFogDensity = 0.0014 + mistLevel * 0.0022;
    let mistSpriteOpacity = 0.14 + mistLevel * 0.42;

    if (weather === 'misty') {
      baseFogDensity += 0.0015;
      mistSpriteOpacity += 0.22;
      fog.color.lerp(new THREE.Color(currentNightFactor > 0.5 ? 0x263d54 : 0xdde8ea), 0.35);
      skyUniforms.uHorizonColor.value.lerp(fog.color, 0.4);
      sunInt *= 0.82;
    } else if (weather === 'rain') {
      baseFogDensity += 0.0021;
      mistSpriteOpacity += 0.28;
      const rainTint = new THREE.Color(currentNightFactor > 0.5 ? 0x162638 : 0x99aeb5);
      fog.color.lerp(rainTint, 0.55);
      skyUniforms.uTopColor.value.lerp(rainTint, 0.65);
      skyUniforms.uHorizonColor.value.lerp(rainTint, 0.5);
      sunInt *= 0.55;
      hemiInt *= 0.85;
    }

    fog.density = baseFogDensity;
    sunLight.intensity = sunInt;
    hemiLight.intensity = hemiInt;
    skyUniforms.uStarIntensity.value = weather === 'rain' ? 0.0 : Math.max(0, currentNightFactor - 0.35) * 1.4;

    // Sun / Moon orbital arc
    const isDay = h >= 5.5 && h <= 18.8;
    const orbitAngle = isDay
      ? ((h - 5.5) / 13.3) * Math.PI
      : ((h > 18.8 ? h - 18.8 : h + 5.2) / 10.7) * Math.PI;
    const sunX = Math.cos(orbitAngle) * 165;
    const sunY = Math.max(18, Math.sin(orbitAngle) * 165);
    const sunZ = 75;
    sunLight.position.set(sunX, sunY, sunZ);
    skyUniforms.uSunDir.value.set(sunX, sunY, sunZ).normalize();

    // Sync water shader with atmosphere
    if (waterUniforms) {
      lerpHex(pA.waterDeep, pB.waterDeep, t, waterUniforms.uDeepColor.value);
      lerpHex(pA.waterShallow, pB.waterShallow, t, waterUniforms.uShallowColor.value);
      waterUniforms.uSunColor.value.copy(skyUniforms.uSunColor.value);
      waterUniforms.uSunDir.value.copy(skyUniforms.uSunDir.value);
      waterUniforms.uSkyColor.value.copy(skyUniforms.uHorizonColor.value);
      waterUniforms.uNightFactor.value = currentNightFactor;
      waterUniforms.uFogColor.value.copy(fog.color);
      waterUniforms.uFogDensity.value = fog.density;
    }

    // Animate drifting valley mist sprites
    mistMat.opacity = Math.min(0.68, mistSpriteOpacity * (1.0 - currentNightFactor * 0.45));
    mistMat.color.copy(fog.color).lerp(new THREE.Color(0xffffff), 0.35);
    for (const sp of mistSprites) {
      sp.userData.angle += sp.userData.speed * dt;
      sp.position.x = Math.cos(sp.userData.angle) * sp.userData.radius;
      sp.position.z = Math.sin(sp.userData.angle) * sp.userData.radius;
      sp.position.y = sp.userData.baseY + Math.sin(elapsed * 0.35 + sp.userData.radius) * 1.4;
    }

    return currentNightFactor;
  }

  return {
    update,
    fog,
    sunLight,
    hemiLight
  };
}
