import * as THREE from 'three';
import {
  createChinesePlaqueMaterial,
  getMaterialsLibrary
} from '../scene/materialsLibrary.js';

/**
 * Shared 1:1 high-detail prop builders for Guilin Regional Instances (区域副本)
 */

export function createDetailedLantern(glowMats, scale = 1.0) {
  const g = new THREE.Group();
  const cord = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.025, 0.55, 6),
    new THREE.MeshStandardMaterial({ color: 0x2d241c, roughness: 0.9 })
  );
  cord.position.y = 0.25;
  g.add(cord);

  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xe6b84c,
    roughness: 0.35,
    metalness: 0.72
  });
  const topCap = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 0.08, 12), goldMat);
  topCap.position.y = -0.02;
  g.add(topCap);

  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xd92b24,
    emissive: 0xff5a1f,
    emissiveIntensity: 0.35,
    roughness: 0.45
  });
  glowMats.push({ mat: bodyMat, base: 0.28, night: 2.2 });

  const body = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 10), bodyMat);
  body.scale.set(1.0, 1.18, 1.0);
  body.position.y = -0.36;
  g.add(body);

  const botCap = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.16, 0.08, 12), goldMat);
  botCap.position.y = -0.7;
  g.add(botCap);

  const tassel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.07, 0.32, 6),
    new THREE.MeshStandardMaterial({ color: 0xc9221d, roughness: 0.7 })
  );
  tassel.position.y = -0.9;
  g.add(tassel);

  g.scale.setScalar(scale);
  return g;
}

export function createStoneLion(scale = 1.0) {
  const g = new THREE.Group();
  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0xc8c2b4,
    roughness: 0.86,
    metalness: 0.04
  });

  const plinth = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.75, 1.45), stoneMat);
  plinth.position.y = 0.375;
  plinth.castShadow = true;
  plinth.receiveShadow = true;
  g.add(plinth);

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.72, 1.05), stoneMat);
  body.position.set(0, 1.05, -0.05);
  body.rotation.x = -0.18;
  body.castShadow = true;
  g.add(body);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.36, 10, 10), stoneMat);
  head.position.set(0, 1.56, 0.32);
  head.castShadow = true;
  g.add(head);

  const mane = new THREE.Mesh(new THREE.DodecahedronGeometry(0.41, 0), stoneMat);
  mane.position.set(0, 1.52, 0.24);
  g.add(mane);

  for (const sx of [-0.22, 0.22]) {
    const paw = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.56, 8), stoneMat);
    paw.position.set(sx, 0.98, 0.42);
    g.add(paw);
  }

  g.scale.setScalar(scale);
  return g;
}

export function createOsmanthusTree(scale = 1.0, seed = 1) {
  const g = new THREE.Group();
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c4636, roughness: 0.92 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x2e6437, roughness: 0.84 });
  const blossomMat = new THREE.MeshStandardMaterial({
    color: 0xf4c94e,
    emissive: 0x9e7114,
    emissiveIntensity: 0.14,
    roughness: 0.75
  });

  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.3, 2.5, 8), trunkMat);
  trunk.position.y = 1.25;
  trunk.castShadow = true;
  g.add(trunk);

  const crownOffsets = [
    [0, 3.1, 0, 1.55],
    [-0.95, 2.75, 0.55, 1.15],
    [0.95, 2.85, -0.45, 1.2],
    [0.35, 3.65, 0.45, 1.05],
    [-0.5, 3.45, -0.65, 0.95]
  ];
  for (let i = 0; i < crownOffsets.length; i++) {
    const [ox, oy, oz, r] = crownOffsets[i];
    const puff = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 1), leafMat);
    puff.position.set(ox, oy, oz);
    puff.scale.set(1.1, 0.82, 1.05);
    puff.castShadow = true;
    puff.receiveShadow = true;
    g.add(puff);

    // Golden Guilin osmanthus flower clusters
    const flower = new THREE.Mesh(new THREE.DodecahedronGeometry(r * 0.38, 0), blossomMat);
    flower.position.set(ox + Math.sin(seed + i * 2.1) * 0.55, oy + 0.35, oz + Math.cos(seed + i) * 0.55);
    g.add(flower);
  }

  g.scale.setScalar(scale);
  return g;
}

export function createWeepingWillow(scale = 1.0) {
  const g = new THREE.Group();
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x554233, roughness: 0.92 });
  const frondMat = new THREE.MeshStandardMaterial({
    color: 0x4b8744,
    roughness: 0.82,
    side: THREE.DoubleSide
  });

  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.38, 3.4, 8), trunkMat);
  trunk.position.y = 1.7;
  trunk.rotation.z = 0.08;
  trunk.castShadow = true;
  g.add(trunk);

  const canopy = new THREE.Mesh(new THREE.SphereGeometry(2.1, 10, 8), frondMat);
  canopy.position.set(0.2, 4.1, 0);
  canopy.scale.set(1.25, 0.72, 1.25);
  canopy.castShadow = true;
  g.add(canopy);

  // Hanging weeping willow curtains
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    const dist = 1.3 + (i % 3) * 0.45;
    const len = 2.0 + (i % 3) * 0.55;
    const strip = new THREE.Mesh(new THREE.BoxGeometry(0.18, len, 0.06), frondMat);
    strip.position.set(0.2 + Math.cos(a) * dist, 3.6 - len * 0.45, Math.sin(a) * dist);
    strip.rotation.y = -a;
    g.add(strip);
  }

  g.scale.setScalar(scale);
  return g;
}

export function createStoneLantern(glowMats, scale = 1.0) {
  const g = new THREE.Group();
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0xb5b0a2, roughness: 0.88 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.48, 0.35, 6), stoneMat);
  base.position.y = 0.175;
  g.add(base);

  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 1.3, 6), stoneMat);
  post.position.y = 1.0;
  post.castShadow = true;
  g.add(post);

  const lampMat = new THREE.MeshStandardMaterial({
    color: 0xffe49e,
    emissive: 0xffb347,
    emissiveIntensity: 0.25
  });
  glowMats.push({ mat: lampMat, base: 0.18, night: 2.0 });

  const lampBox = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.45, 6), lampMat);
  lampBox.position.y = 1.85;
  g.add(lampBox);

  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.58, 0.38, 6), stoneMat);
  cap.position.y = 2.25;
  cap.castShadow = true;
  g.add(cap);

  g.scale.setScalar(scale);
  return g;
}

export function createChineseSignboard(text, width, height, options = {}, glowMats = null) {
  const mat = createChinesePlaqueMaterial(text, options);
  if (glowMats) {
    glowMats.push({ mat, base: 0.22, night: 1.55 });
  }
  const frameMat = new THREE.MeshStandardMaterial({
    color: options.frameHex || 0x3b2316,
    roughness: 0.65
  });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.14), [
    frameMat,
    frameMat,
    frameMat,
    frameMat,
    mat,
    mat
  ]);
  mesh.castShadow = true;
  return mesh;
}

export function createWalkingTourist(seed = 1) {
  const palette = [0xc94b42, 0x3a6e8c, 0xd8a348, 0x45856a, 0x7b588f, 0xe0d6c5];
  const shirtColor = palette[seed % palette.length];
  const pantsColor = seed % 2 === 0 ? 0x2a333d : 0x443b33;

  const g = new THREE.Group();
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xf0c9a5, roughness: 0.72 });
  const shirtMat = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.75 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: pantsColor, roughness: 0.85 });
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x1e1a18, roughness: 0.85 });

  const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.72, 6), pantsMat);
  legL.position.set(-0.11, 0.36, 0);
  g.add(legL);

  const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.72, 6), pantsMat);
  legR.position.set(0.11, 0.36, 0);
  g.add(legR);

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.58, 0.24), shirtMat);
  torso.position.y = 1.0;
  torso.castShadow = true;
  g.add(torso);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 8), skinMat);
  head.position.y = 1.48;
  g.add(head);

  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.58), hairMat);
  hair.position.y = 1.5;
  g.add(hair);

  g.userData.legL = legL;
  g.userData.legR = legR;
  return g;
}

export function createZoneWaterMesh(width, depth, colorHex = 0x1e6b62) {
  const geo = new THREE.PlaneGeometry(width, depth, 48, 48);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshStandardMaterial({
    color: colorHex,
    roughness: 0.14,
    metalness: 0.32,
    transparent: true,
    opacity: 0.9
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  return mesh;
}

export function createDistantKarstRing(radius = 85, count = 14) {
  const ring = new THREE.Group();
  const mats = getMaterialsLibrary();
  const peakMat = new THREE.MeshStandardMaterial({
    color: 0x3b6355,
    map: mats.karstRock.map,
    roughness: 0.92
  });
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const r = radius + (i % 3) * 14;
    const h = 24 + ((i * 19) % 28);
    const w = 12 + ((i * 7) % 10);
    const peak = new THREE.Mesh(new THREE.ConeGeometry(w, h, 9), peakMat);
    peak.position.set(Math.cos(a) * r, h * 0.45 - 1, Math.sin(a) * r);
    peak.scale.set(1.0, 1.0, 0.8 + (i % 3) * 0.15);
    ring.add(peak);
  }
  return ring;
}

/**
 * Creates a glowing, animated RPG-style 3D Portal Beacon (实景传送光柱)
 * Used in both the Main World (to enter 1:1 zones) and inside Zones (to return to the Main World).
 */
export function createPortalBeacon(labelText, accentHex = 0x4ec4a7, scale = 1.0) {
  const g = new THREE.Group();

  // Outer rotating energy ring on ground
  const ringMat = new THREE.MeshBasicMaterial({
    color: accentHex,
    transparent: true,
    opacity: 0.85,
    side: THREE.DoubleSide
  });
  const outerRing = new THREE.Mesh(new THREE.RingGeometry(1.45, 1.85, 32), ringMat);
  outerRing.rotation.x = -Math.PI / 2;
  outerRing.position.y = 0.08;
  g.add(outerRing);

  const innerRing = new THREE.Mesh(
    new THREE.RingGeometry(0.9, 1.12, 24),
    new THREE.MeshBasicMaterial({
      color: 0xf5c756,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide
    })
  );
  innerRing.rotation.x = -Math.PI / 2;
  innerRing.position.y = 0.12;
  g.add(innerRing);

  // Translucent vertical light pillar
  const beamMat = new THREE.MeshBasicMaterial({
    color: accentHex,
    transparent: true,
    opacity: 0.24,
    side: THREE.DoubleSide,
    depthWrite: false
  });
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.45, 6.2, 20, 1, true), beamMat);
  beam.position.y = 3.1;
  g.add(beam);

  // Floating golden portal diamond crystal
  const crystalMat = new THREE.MeshStandardMaterial({
    color: 0xffe48f,
    emissive: accentHex,
    emissiveIntensity: 1.4,
    roughness: 0.2,
    metalness: 0.7
  });
  const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.45, 0), crystalMat);
  crystal.position.y = 2.6;
  g.add(crystal);

  // Floating double-sided label plaque
  const plaque = createChineseSignboard(labelText, 3.6, 0.88, {
    bgHex: '#0d2229',
    borderHex: '#f5c756',
    textHex: '#fff1b8',
    glowHex: '#4ec4a7'
  });
  plaque.position.y = 4.25;
  g.add(plaque);

  g.scale.setScalar(scale);
  g.userData.anim = { outerRing, innerRing, beam, crystal, plaque };
  return g;
}

export function animatePortalBeacon(beacon, elapsed) {
  const a = beacon && beacon.userData && beacon.userData.anim;
  if (!a) return;
  a.outerRing.rotation.z = elapsed * 0.75;
  a.innerRing.rotation.z = -elapsed * 1.25;
  a.crystal.rotation.y = elapsed * 1.6;
  a.crystal.position.y = 2.55 + Math.sin(elapsed * 2.8) * 0.24;
  a.plaque.position.y = 4.2 + Math.sin(elapsed * 2.1) * 0.14;
  a.beam.material.opacity = 0.18 + Math.sin(elapsed * 3.0) * 0.06;
}
