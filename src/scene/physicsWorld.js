import * as CANNON from 'cannon-es';
import {
  BRIDGES,
  getBridgeSurfaceY,
  getWaterDepth
} from '../data/landmarksData.js';

/**
 * Real 3D Rigid-Body Physics World powered by cannon-es:
 * - Sloped bridge ramps & decks matching 3D bridge meshes
 * - Bridge side railing air-walls (prevent falling off bridges)
 * - Waterfront shoreline air-walls (prevent walking/driving into rivers & lakes)
 * - Building, landmark & karst mountain solid colliders
 * - City outer perimeter boundary air-walls
 * - Dynamic player rigid body with smooth wall-sliding contact material
 */
export function createPhysicsWorld() {
  const world = new CANNON.World({
    gravity: new CANNON.Vec3(0, -24, 0)
  });
  world.broadphase = new CANNON.SAPBroadphase(world);
  world.allowSleep = false;

  const groundMat = new CANNON.Material('ground');
  const wallMat = new CANNON.Material('wall');
  const playerMat = new CANNON.Material('player');

  // Crisp grip on ground/ramps, zero-friction smooth sliding on walls/railings!
  world.addContactMaterial(
    new CANNON.ContactMaterial(playerMat, groundMat, {
      friction: 0.0,
      restitution: 0.0
    })
  );
  world.addContactMaterial(
    new CANNON.ContactMaterial(playerMat, wallMat, {
      friction: 0.0,
      restitution: 0.0
    })
  );

  // 1. Flat urban ground plane at y = 0.55
  const groundBody = new CANNON.Body({
    mass: 0,
    material: groundMat,
    shape: new CANNON.Plane()
  });
  groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
  groundBody.position.set(0, 0.55, 0);
  world.addBody(groundBody);

  // Helper: add a static AABB box collider (buildings, walls, landmarks)
  function addBoxCollider(cx, cy, cz, w, h, d, rotY = 0, isWall = true) {
    const body = new CANNON.Body({
      mass: 0,
      material: isWall ? wallMat : groundMat,
      shape: new CANNON.Box(new CANNON.Vec3(w / 2, h / 2, d / 2))
    });
    body.position.set(cx, cy, cz);
    if (rotY !== 0) {
      body.quaternion.setFromEuler(0, rotY, 0);
    }
    world.addBody(body);
    return body;
  }

  // Helper: add a static vertical cylinder collider (karst peaks, pagodas)
  function addCylinderCollider(cx, cz, radius, height = 40) {
    const body = new CANNON.Body({
      mass: 0,
      material: wallMat,
      shape: new CANNON.Cylinder(radius * 0.85, radius, height, 12)
    });
    body.position.set(cx, height / 2, cz);
    world.addBody(body);
    return body;
  }

  // 2. Build Exact Sloped Bridge Decks, Ramps & Side Railing Air-Walls!
  function addBridgePhysics(b) {
    const thickness = 0.6;
    const rise = b.deckY - b.baseY;
    const rampHyp = Math.hypot(b.rampLength, rise);
    const rampAngle = Math.atan2(rise, b.rampLength);
    const halfSpan = b.spanLength / 2;
    const rampCenterAlong = halfSpan + b.rampLength / 2;
    const rampMidY = (b.baseY + b.deckY) / 2;
    const railH = 3.4; // Tall invisible guardrail wall so player/car cannot jump off bridge
    const railThick = 0.55;
    const railOffset = b.width / 2 - 0.15;

    if (b.axis === 'x') {
      // Main flat bridge deck
      addBoxCollider(b.cx, b.deckY - thickness / 2, b.cz, b.spanLength + 0.4, thickness, b.width, 0, false);

      // West approach ramp (rising +X)
      const westRamp = new CANNON.Body({
        mass: 0,
        material: groundMat,
        shape: new CANNON.Box(new CANNON.Vec3(rampHyp / 2 + 0.2, thickness / 2, b.width / 2))
      });
      westRamp.position.set(b.cx - rampCenterAlong, rampMidY - thickness / 2, b.cz);
      westRamp.quaternion.setFromEuler(0, 0, rampAngle);
      world.addBody(westRamp);

      // East approach ramp (descending +X)
      const eastRamp = new CANNON.Body({
        mass: 0,
        material: groundMat,
        shape: new CANNON.Box(new CANNON.Vec3(rampHyp / 2 + 0.2, thickness / 2, b.width / 2))
      });
      eastRamp.position.set(b.cx + rampCenterAlong, rampMidY - thickness / 2, b.cz);
      eastRamp.quaternion.setFromEuler(0, 0, -rampAngle);
      world.addBody(eastRamp);

      // Continuous bridge side railing air-walls along full bridge + ramps
      const totalLen = b.spanLength + b.rampLength * 2;
      for (const side of [-1, 1]) {
        addBoxCollider(b.cx, b.deckY + railH / 2 - 1.2, b.cz + side * railOffset, totalLen, railH + 2.4, railThick, 0, true);
      }
    } else {
      // North-South bridge (axis === 'z')
      addBoxCollider(b.cx, b.deckY - thickness / 2, b.cz, b.width, thickness, b.spanLength + 0.4, 0, false);

      // North approach ramp (rising +Z)
      const northRamp = new CANNON.Body({
        mass: 0,
        material: groundMat,
        shape: new CANNON.Box(new CANNON.Vec3(b.width / 2, thickness / 2, rampHyp / 2 + 0.2))
      });
      northRamp.position.set(b.cx, rampMidY - thickness / 2, b.cz - rampCenterAlong);
      northRamp.quaternion.setFromEuler(-rampAngle, 0, 0);
      world.addBody(northRamp);

      // South approach ramp (descending +Z)
      const southRamp = new CANNON.Body({
        mass: 0,
        material: groundMat,
        shape: new CANNON.Box(new CANNON.Vec3(b.width / 2, thickness / 2, rampHyp / 2 + 0.2))
      });
      southRamp.position.set(b.cx, rampMidY - thickness / 2, b.cz + rampCenterAlong);
      southRamp.quaternion.setFromEuler(rampAngle, 0, 0);
      world.addBody(southRamp);

      // Side railing air-walls along full bridge + ramps
      const totalLen = b.spanLength + b.rampLength * 2;
      for (const side of [-1, 1]) {
        addBoxCollider(b.cx + side * railOffset, b.deckY + railH / 2 - 1.2, b.cz, railThick, railH + 2.4, totalLen, 0, true);
      }
    }
  }

  for (const b of BRIDGES) {
    addBridgePhysics(b);
  }

  // 3. City Outer Perimeter Air-Walls (keep player inside playable Guilin basin)
  const boundX = 156;
  const boundZ = 146;
  const boundH = 26;
  addBoxCollider(0, boundH / 2, -boundZ, boundX * 2 + 8, boundH, 4, 0, true);
  addBoxCollider(0, boundH / 2, boundZ, boundX * 2 + 8, boundH, 4, 0, true);
  addBoxCollider(-boundX, boundH / 2, 0, 4, boundH, boundZ * 2 + 8, 0, true);
  addBoxCollider(boundX, boundH / 2, 0, 4, boundH, boundZ * 2 + 8, 0, true);

  // 4. Waterfront Shoreline Air-Walls (sampled grid cells along river/lake edges, excluding bridges!)
  // Uses lightweight static boxes at water boundary so the player cannot walk/drive into rivers or lakes
  const cell = 5.0;
  for (let gx = -150; gx <= 150; gx += cell) {
    for (let gz = -140; gz <= 140; gz += cell) {
      if (getBridgeSurfaceY(gx, gz, 1.5) !== null) continue; // Keep bridge approaches completely open!
      const d = getWaterDepth(gx, gz);
      if (d <= 0.12) continue;

      // Only place collider on perimeter cells of water bodies (adjacent to land) to keep body count super lean!
      const adjLand =
        getWaterDepth(gx + cell, gz) <= 0.12 ||
        getWaterDepth(gx - cell, gz) <= 0.12 ||
        getWaterDepth(gx, gz + cell) <= 0.12 ||
        getWaterDepth(gx, gz - cell) <= 0.12;
      if (adjLand) {
        addBoxCollider(gx, 2.2, gz, cell * 0.96, 4.4, cell * 0.96, 0, true);
      }
    }
  }

  // 5. Dynamic Player Rigid Body (Sphere collider for buttery-smooth ramp climbing & wall sliding)
  const playerRadius = 0.72;
  const playerBody = new CANNON.Body({
    mass: 75,
    material: playerMat,
    fixedRotation: true,
    linearDamping: 0.0,
    shape: new CANNON.Sphere(playerRadius)
  });
  playerBody.position.set(24, 5.2, -23.5);
  world.addBody(playerBody);

  let grounded = false;
  playerBody.addEventListener('collide', (ev) => {
    const contactNormal = new CANNON.Vec3();
    if (ev.contact.bi.id === playerBody.id) {
      ev.contact.ni.negate(contactNormal);
    } else {
      contactNormal.copy(ev.contact.ni);
    }
    if (contactNormal.y > 0.45) {
      grounded = true;
    }
  });

  function step(dt) {
    grounded = false;
    world.step(1 / 60, dt, 4);
  }

  function teleportPlayer(x, y, z) {
    playerBody.position.set(x, y + playerRadius + 0.08, z);
    playerBody.velocity.set(0, 0, 0);
    playerBody.angularVelocity.set(0, 0, 0);
  }

  return {
    world,
    playerBody,
    playerRadius,
    isGrounded: () => grounded,
    step,
    teleportPlayer,
    addBoxCollider,
    addCylinderCollider
  };
}
