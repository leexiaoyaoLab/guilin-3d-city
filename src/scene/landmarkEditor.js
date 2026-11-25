import * as THREE from 'three';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';

const STORAGE_KEY = 'guilin_3d_landmark_overrides_v1';

/**
 * Interactive 3D Landmark Editor powered by Three.js TransformControls:
 * - Click any landmark in 3D or choose from dropdown to attach 3D Move / Rotate / Scale gizmo
 * - Numeric X / Y / Z / Rotation° / Scale fine-tuning inputs
 * - Auto-persists edits in localStorage across page reloads
 * - One-click Copy JSON Export & Reset Single / Reset All
 */
export function createLandmarkEditor(scene, camera, renderer, orbitControls, editableItems) {
  let active = false;
  let selectedItem = null;
  let mode = 'translate'; // translate | rotate | scale

  // Record original default transforms for reset
  const defaults = new Map();
  for (const item of editableItems) {
    defaults.set(item.id, {
      pos: item.object.position.toArray(),
      rotY: item.object.rotation.y,
      scale: item.object.scale.x
    });
    // Tag all descendant meshes so raycasting finds this editable item
    item.object.traverse((child) => {
      child.userData.editableId = item.id;
    });
  }

  // Load saved transforms from localStorage immediately on startup!
  function loadSaved() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      for (const item of editableItems) {
        const s = saved[item.id];
        if (!s) continue;
        if (Array.isArray(s.pos) && s.pos.length === 3) {
          item.object.position.set(s.pos[0], s.pos[1], s.pos[2]);
        }
        if (typeof s.rotY === 'number') {
          item.object.rotation.y = s.rotY;
        }
        if (typeof s.scale === 'number') {
          item.object.scale.setScalar(s.scale);
        }
      }
    } catch {
      // Ignore corrupted storage
    }
  }

  function saveAll() {
    const out = {};
    for (const item of editableItems) {
      out[item.id] = {
        name: item.name,
        pos: [
          Number(item.object.position.x.toFixed(2)),
          Number(item.object.position.y.toFixed(2)),
          Number(item.object.position.z.toFixed(2))
        ],
        rotY: Number(item.object.rotation.y.toFixed(3)),
        scale: Number(item.object.scale.x.toFixed(2))
      };
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(out));
    } catch {
      // Ignore quota errors
    }
    return out;
  }

  loadSaved();

  // Three.js TransformControls 3D Gizmo
  const gizmo = new TransformControls(camera, renderer.domElement);
  gizmo.setMode('translate');
  gizmo.setSpace('world');
  gizmo.setSize(0.85);
  gizmo.enabled = false;

  // In Three.js r170+, TransformControls helper is added via gizmo.getHelper()
  const gizmoHelper = typeof gizmo.getHelper === 'function' ? gizmo.getHelper() : gizmo;
  gizmoHelper.visible = false;
  scene.add(gizmoHelper);

  // Subtle selection highlight ring around selected landmark
  const ringGeo = new THREE.RingGeometry(4.5, 5.4, 32);
  ringGeo.rotateX(-Math.PI / 2);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xf5c756,
    transparent: true,
    opacity: 0.85,
    side: THREE.DoubleSide,
    depthTest: false
  });
  const selectRing = new THREE.Mesh(ringGeo, ringMat);
  selectRing.visible = false;
  scene.add(selectRing);

  // Pause OrbitControls while dragging gizmo handles!
  gizmo.addEventListener('dragging-changed', (ev) => {
    orbitControls.enabled = !ev.value;
    if (!ev.value) {
      saveAll();
    }
  });

  gizmo.addEventListener('objectChange', () => {
    if (!selectedItem) return;
    // Keep uniform scale in scale mode
    if (mode === 'scale') {
      const s = THREE.MathUtils.clamp(selectedItem.object.scale.x, 0.25, 3.5);
      selectedItem.object.scale.setScalar(s);
    }
    syncRingAndInputs();
  });

  // UI Elements
  const panelEl = document.getElementById('editor-panel');
  const selectEl = document.getElementById('editor-select');
  const inX = document.getElementById('ed-x');
  const inY = document.getElementById('ed-y');
  const inZ = document.getElementById('ed-z');
  const inRot = document.getElementById('ed-rot');
  const inScale = document.getElementById('ed-scale');
  const statusEl = document.getElementById('editor-status');
  const modeBtns = document.querySelectorAll('[data-ed-mode]');

  // Populate landmark selector dropdown
  if (selectEl) {
    selectEl.innerHTML = '';
    for (const item of editableItems) {
      const opt = document.createElement('option');
      opt.value = item.id;
      opt.textContent = item.name;
      selectEl.appendChild(opt);
    }
    selectEl.addEventListener('change', () => {
      selectById(selectEl.value);
    });
  }

  function syncRingAndInputs() {
    if (!selectedItem) return;
    const o = selectedItem.object;
    selectRing.position.set(o.position.x, Math.max(0.75, o.position.y + 0.25), o.position.z);
    if (inX) inX.value = o.position.x.toFixed(1);
    if (inY) inY.value = o.position.y.toFixed(1);
    if (inZ) inZ.value = o.position.z.toFixed(1);
    if (inRot) inRot.value = Math.round(THREE.MathUtils.radToDeg(o.rotation.y));
    if (inScale) inScale.value = o.scale.x.toFixed(2);
  }

  function selectById(id) {
    const found = editableItems.find((i) => i.id === id);
    if (!found) return;
    selectedItem = found;
    if (selectEl) selectEl.value = found.id;
    if (active) {
      gizmo.attach(found.object);
      gizmoHelper.visible = true;
      selectRing.visible = true;
    }
    syncRingAndInputs();
  }

  function setMode(m) {
    mode = m;
    gizmo.setMode(m);
    if (m === 'rotate') {
      gizmo.showX = false;
      gizmo.showY = true;
      gizmo.showZ = false;
    } else {
      gizmo.showX = true;
      gizmo.showY = true;
      gizmo.showZ = true;
    }
    modeBtns.forEach((b) => b.classList.toggle('active', b.dataset.edMode === m));
  }

  modeBtns.forEach((b) => b.addEventListener('click', () => setMode(b.dataset.edMode)));

  // Numeric input handlers
  function applyInputs() {
    if (!selectedItem) return;
    const o = selectedItem.object;
    const x = parseFloat(inX.value);
    const y = parseFloat(inY.value);
    const z = parseFloat(inZ.value);
    const rotDeg = parseFloat(inRot.value);
    const sc = parseFloat(inScale.value);
    if (!Number.isNaN(x)) o.position.x = x;
    if (!Number.isNaN(y)) o.position.y = y;
    if (!Number.isNaN(z)) o.position.z = z;
    if (!Number.isNaN(rotDeg)) o.rotation.y = THREE.MathUtils.degToRad(rotDeg);
    if (!Number.isNaN(sc) && sc > 0.1) o.scale.setScalar(THREE.MathUtils.clamp(sc, 0.25, 3.5));
    selectRing.position.set(o.position.x, Math.max(0.75, o.position.y + 0.25), o.position.z);
    saveAll();
  }

  [inX, inY, inZ, inRot, inScale].forEach((el) => {
    if (el) el.addEventListener('change', applyInputs);
  });

  // Reset single / Reset all / Copy JSON
  const btnResetOne = document.getElementById('btn-ed-reset-one');
  const btnResetAll = document.getElementById('btn-ed-reset-all');
  const btnCopyJson = document.getElementById('btn-ed-copy');

  function flashStatus(msg) {
    if (!statusEl) return;
    statusEl.textContent = msg;
    setTimeout(() => {
      if (statusEl.textContent === msg) statusEl.textContent = '拖拽 3D 坐标轴或修改数值（自动保存）';
    }, 2400);
  }

  if (btnResetOne) {
    btnResetOne.addEventListener('click', () => {
      if (!selectedItem) return;
      const d = defaults.get(selectedItem.id);
      if (!d) return;
      selectedItem.object.position.set(...d.pos);
      selectedItem.object.rotation.y = d.rotY;
      selectedItem.object.scale.setScalar(d.scale);
      syncRingAndInputs();
      saveAll();
      flashStatus(`已重置「${selectedItem.name}」`);
    });
  }

  if (btnResetAll) {
    btnResetAll.addEventListener('click', () => {
      for (const item of editableItems) {
        const d = defaults.get(item.id);
        if (!d) continue;
        item.object.position.set(...d.pos);
        item.object.rotation.y = d.rotY;
        item.object.scale.setScalar(d.scale);
      }
      localStorage.removeItem(STORAGE_KEY);
      syncRingAndInputs();
      flashStatus('已恢复全部地标默认位置');
    });
  }

  if (btnCopyJson) {
    btnCopyJson.addEventListener('click', async () => {
      const data = saveAll();
      const json = JSON.stringify(data, null, 2);
      try {
        await navigator.clipboard.writeText(json);
        flashStatus('✓ 全部地标坐标 JSON 已复制到剪贴板');
      } catch {
        console.log('GUILIN_LANDMARKS_JSON:', json);
        flashStatus('已在控制台输出 JSON');
      }
    });
  }

  // Click-to-select landmark in 3D when editor is active
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let downPos = { x: 0, y: 0 };

  renderer.domElement.addEventListener('pointerdown', (e) => {
    downPos = { x: e.clientX, y: e.clientY };
  });

  renderer.domElement.addEventListener('pointerup', (e) => {
    if (!active || gizmo.dragging) return;
    if (Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y) > 5) return;

    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);

    const targets = editableItems.map((i) => i.object);
    const hits = raycaster.intersectObjects(targets, true);
    for (const hit of hits) {
      let obj = hit.object;
      while (obj) {
        if (obj.userData && obj.userData.editableId) {
          selectById(obj.userData.editableId);
          return;
        }
        obj = obj.parent;
      }
    }
  });

  // Keyboard shortcuts while editing: G (move), R (rotate), S (scale)
  window.addEventListener('keydown', (e) => {
    if (!active) return;
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT')) return;
    if (e.key === 'g' || e.key === 'G') setMode('translate');
    else if (e.key === 'r' || e.key === 'R') setMode('rotate');
    else if (e.key === 's' || e.key === 'S') setMode('scale');
  });

  function setActive(enabled) {
    active = enabled;
    gizmo.enabled = enabled;
    if (panelEl) panelEl.classList.toggle('hidden', !enabled);
    if (enabled) {
      if (!selectedItem && editableItems.length > 0) {
        selectById(editableItems[0].id);
      } else if (selectedItem) {
        gizmo.attach(selectedItem.object);
        gizmoHelper.visible = true;
        selectRing.visible = true;
        syncRingAndInputs();
      }
    } else {
      gizmo.detach();
      gizmoHelper.visible = false;
      selectRing.visible = false;
      orbitControls.enabled = true;
    }
  }

  return {
    setActive,
    toggle: () => setActive(!active),
    isActive: () => active,
    selectById,
    setMode,
    exportJson: saveAll
  };
}
