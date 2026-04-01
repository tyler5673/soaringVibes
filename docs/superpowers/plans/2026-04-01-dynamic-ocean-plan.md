# Dynamic Ocean System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace flat ocean plane with dynamic Gerstner wave-based system featuring 3 LOD rings that follow the camera.

**Architecture:** New `OceanManager` and `WaveSystem` classes in `js/ocean.js`, integrated into main render loop via `environment.js`. Three concentric ring meshes (inner/middle/outer) with decreasing detail, animated using Gerstner wave equations computed on CPU per-frame.

**Tech Stack:** Three.js 0.160.0, vanilla JavaScript ES6+, existing performance monitoring infrastructure.

---

## File Structure

### Files to Create
- `js/ocean.js` - Main ocean system (OceanManager class, WaveSystem class, helper functions)

### Files to Modify
- `index.html:1454` - Replace `createOcean()` call with `createDynamicOcean()`
- `index.html:1542` - Replace `updateOceanWaves(time)` with `updateOcean(deltaTime)`
- `js/environment.js:26-75` - Remove old ocean globals and functions, add new imports/exports
- `js/boats.js:921` - Update boat bobbing to sample wave height instead of flat sine

---

## Implementation Strategy

**Phase 1 (Tasks 1-4):** Core WaveSystem class with Gerstner formula, minimal single-mesh ocean
**Phase 2 (Tasks 5-7):** OceanManager with LOD rings and camera tracking
**Phase 3 (Task 8):** Integration into main app loop, remove old ocean code
**Phase 4 (Tasks 9-10):** Boat integration and final polish

Each task is self-contained, testable by visual inspection in browser.

---

### Task 1: Create WaveSystem Class Skeleton

**Files:**
- Create: `js/ocean.js`

- [ ] **Step 1: Write WaveSystem class with constructor and wave config**

```javascript
// ========== DYNAMIC OCEAN SYSTEM ==========
class WaveSystem {
  constructor() {
    this.time = 0;
    
    // Gerstner wave configuration (3 systems for hybrid realism)
    this.waves = [
      // Swell: Long wavelength base waves
      {
        direction: new THREE.Vector2(1, 0.3).normalize(),
        amplitude: 2.0,
        length: 100,
        steepness: 0.7,
        speed: 6
      },
      // Chop: Medium wind-driven waves
      {
        direction: new THREE.Vector2(0.5, -1).normalize(),
        amplitude: 0.8,
        length: 30,
        steepness: 0.5,
        speed: 12
      },
      // Ripple: Short surface detail
      {
        direction: new THREE.Vector2(-0.7, 0.9).normalize(),
        amplitude: 0.2,
        length: 8,
        steepness: 0.3,
        speed: 20
      }
    ];
  }
  
  update(deltaTime) {
    this.time += deltaTime;
  }
}

export default WaveSystem;
```

- [ ] **Step 2: Add displaceVertex method with Gerstner formula**

```javascript
// Inside WaveSystem class, after constructor:

displaceVertex(position, output = new THREE.Vector3()) {
  const px = position.x;
  const pz = position.z;
  
  let offsetX = 0;
  let offsetY = 0;
  let offsetZ = 0;
  
  for (const wave of this.waves) {
    const dirX = wave.direction.x;
    const dirZ = wave.direction.y;
    
    // Phase calculation: dot(direction, position) * wavelength + time * speed
    const phase = (dirX * px + dirZ * pz) * (Math.PI * 2 / wave.length) + this.time * wave.speed;
    
    const sinPhase = Math.sin(phase);
    const cosPhase = Math.cos(phase);
    
    // Gerstner displacement formula
    const steepFactor = wave.steepness * wave.amplitude;
    
    offsetX += -dirX * wave.amplitude * cosPhase * wave.steepness;
    offsetY += wave.amplitude * sinPhase;
    offsetZ += -dirZ * wave.amplitude * cosPhase * wave.steepness;
  }
  
  output.set(px + offsetX, offsetY, pz + offsetZ);
  return output;
}

getHeight(x, z) {
  let height = 0;
  
  for (const wave of this.waves) {
    const dirX = wave.direction.x;
    const dirZ = wave.direction.y;
    
    const phase = (dirX * x + dirZ * z) * (Math.PI * 2 / wave.length) + this.time * wave.speed;
    height += wave.amplitude * Math.sin(phase);
  }
  
  return height;
}
```

- [ ] **Step 3: Test WaveSystem in isolation**

Open browser console and run:
```javascript
import('./js/ocean.js').then(({ default: WaveSystem }) => {
  const waves = new WaveSystem();
  waves.update(0.016); // ~60fps delta
  
  const pos = new THREE.Vector3(10, 0, 20);
  const displaced = waves.displaceVertex(pos);
  console.log('Original:', pos);
  console.log('Displaced:', displaced);
  console.log('Height at (10, 20):', waves.getHeight(10, 20));
  
  // Expected: Displaced Y should be between -3 and +3 meters
  // Height should match displaced.y approximately
});
```

- [ ] **Step 4: Commit WaveSystem class**

```bash
git add js/ocean.js
git commit -m "feat(ocean): Add WaveSystem with Gerstner wave formula

- Implement 3-wave system (swell, chop, ripple)
- displaceVertex() applies full Gerstner displacement
- getHeight() samples vertical offset at world coordinates"
```

---

### Task 2: Create Single Mesh Dynamic Ocean (MVP)

**Files:**
- Modify: `js/ocean.js` (add new class after WaveSystem)

- [ ] **Step 1: Write SimpleOceanManager class for MVP testing**

```javascript
// At end of js/ocean.js, before export

class SimpleOceanManager {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.waveSystem = new WaveSystem();
    
    // Single large mesh for MVP (will replace with LOD later)
    const size = 4000;
    const segments = 128;
    const geometry = new THREE.PlaneGeometry(size, segments, segments);
    
    // Store original flat positions for wave calculation
    this.originalPositions = new Float32Array(geometry.attributes.position.array.length);
    this.originalPositions.set(geometry.attributes.position.array);
    
    const material = new THREE.MeshStandardMaterial({
      color: 0x1e90ff,
      roughness: 0.15,
      metalness: 0.1,
      flatShading: false,
      side: THREE.DoubleSide
    });
    
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.position.y = typeof WATER_LEVEL !== 'undefined' ? WATER_LEVEL : 2;
    this.mesh.receiveShadow = true;
    
    scene.add(this.mesh);
    
    // Grid snapping for camera follow
    this.gridSize = 500;
    this.lastCameraPos = new THREE.Vector3();
  }
  
  update(deltaTime) {
    // Update wave system time
    this.waveSystem.update(deltaTime);
    
    // Snap ocean position to grid based on camera
    if (this.camera && this.camera.position) {
      const camX = this.camera.position.x;
      const camZ = this.camera.position.z;
      
      const dist = Math.sqrt(
        Math.pow(camX - this.lastCameraPos.x, 2) + 
        Math.pow(camZ - this.lastCameraPos.z, 2)
      );
      
      // Only reposition if camera moved > 100m
      if (dist > 100) {
        this.mesh.position.x = Math.floor(camX / this.gridSize) * this.gridSize;
        this.mesh.position.z = Math.floor(camZ / this.gridSize) * this.gridSize;
        
        this.lastCameraPos.set(camX, this.camera.position.y, camZ);
      }
    }
    
    // Apply wave displacement to vertices
    const positions = this.mesh.geometry.attributes.position;
    const original = this.originalPositions;
    const oceanY = this.mesh.position.y;
    
    let changed = false;
    
    for (let i = 0; i < positions.count; i++) {
      // World coordinates of vertex
      const worldX = original[i * 3] + this.mesh.position.x;
      const worldZ = original[i * 3 + 2] + this.mesh.position.z;
      
      // Calculate wave displacement
      const displaced = this.waveSystem.displaceVertex(
        new THREE.Vector3(worldX, oceanY, worldZ)
      );
      
      // Set local Z (which is Y when rotated flat) to wave height
      const newY = original[i * 3 + 1] + displaced.y;
      
      if (Math.abs(newY - positions.getY(i)) > 0.01) {
        positions.setY(i, newY);
        changed = true;
      }
    }
    
    if (changed) {
      positions.needsUpdate = true;
      this.mesh.geometry.computeVertexNormals();
    }
  }
  
  getHeight(x, z) {
    return this.waveSystem.getHeight(x, z);
  }
}

export { SimpleOceanManager };
```

- [ ] **Step 2: Add temporary test function to index.html**

At line ~1450 in `index.html`, before the existing ocean call:
```javascript
// TEMPORARY TEST - will be replaced by proper integration
import('./js/ocean.js').then(({ SimpleOceanManager }) => {
  window.oceanManager = new SimpleOceanManager(scene, camera);
  console.log('Dynamic ocean initialized');
}).catch(err => {
  console.error('Failed to load ocean module:', err);
});

// Comment out old ocean for test:
// createOcean(scene, camera);
```

- [ ] **Step 3: Test MVP in browser**

Run `npx serve` and verify:
1. Ocean mesh appears (blue plane)
2. Waves are animating (visible vertex movement)
3. FPS stays above 50 (check PerformanceMonitor if visible)

Open console and test wave sampling:
```javascript
window.oceanManager.update(0.016);
console.log('Wave height at camera:', window.oceanManager.getHeight(camera.position.x, camera.position.z));
// Expected: Value between -3 and +3 meters
```

- [ ] **Step 4: Commit MVP ocean**

```bash
git add js/ocean.js index.html
git commit -m "feat(ocean): Add SimpleOceanManager with single mesh MVP

- PlaneGeometry with 128x128 segments over 4000m² area
- Camera-following with 500m grid snapping
- Per-frame wave vertex displacement + normal recalculation"
```

---

### Task 3: Create LOD Ring Geometry Generator

**Files:**
- Modify: `js/ocean.js` (add helper function)

- [ ] **Step 1: Add createRingGeometry function**

After WaveSystem class, before SimpleOceanManager:
```javascript
/**
 * Generate annulus geometry for LOD rings
 * @param {number} innerRadius - Inner radius of ring
 * @param {number} outerRadius - Outer radius of ring  
 * @param {number} radialSegments - Segments around circumference
 * @param {number} concentricSegments - Segments from inner to outer
 * @returns {THREE.BufferGeometry} Polar ring geometry
 */
function createRingGeometry(innerRadius, outerRadius, radialSegments = 64, concentricSegments = 16) {
  const vertices = [];
  const indices = [];
  
  // Generate vertices in polar coordinates
  for (let j = 0; j <= concentricSegments; j++) {
    const rInner = innerRadius + (outerRadius - innerRadius) * (j / concentricSegments);
    
    for (let i = 0; i <= radialSegments; i++) {
      const theta = (i / radialSegments) * Math.PI * 2;
      
      const x = rInner * Math.cos(theta);
      const z = rInner * Math.sin(theta);
      
      vertices.push(x, 0, z); // y=0 will be displaced by waves
    }
  }
  
  // Generate indices for triangle fan between segments
  for (let j = 0; j < concentricSegments; j++) {
    for (let i = 0; i < radialSegments; i++) {
      const a = j * (radialSegments + 1) + i;
      const b = a + radialSegments + 1;
      const c = a + 1;
      const d = b + 1;
      
      // Two triangles per quad
      indices.push(a, b, c);
      indices.push(b, d, c);
    }
  }
  
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  
  return geometry;
}

export { createRingGeometry };
```

- [ ] **Step 2: Test ring generation**

In browser console after loading page:
```javascript
import('./js/ocean.js').then(({ createRingGeometry }) => {
  const inner = createRingGeometry(0, 600, 48, 16);
  const middle = createRingGeometry(570, 1800, 24, 8);
  const outer = createRingGeometry(1770, 3000, 12, 4);
  
  console.log('Inner ring vertices:', inner.attributes.position.count);
  console.log('Middle ring vertices:', middle.attributes.position.count);
  console.log('Outer ring vertices:', outer.attributes.position.count);
  
  // Expected: ~768, ~576, ~168 vertices respectively (with overlap gaps)
});
```

- [ ] **Step 3: Commit ring geometry generator**

```bash
git add js/ocean.js
git commit -m "feat(ocean): Add createRingGeometry for LOD mesh generation

- Polar coordinate annulus with configurable radial/concentric segments
- Overlap gap support (570 vs 600 inner radius allows blending)"
```

---

### Task 4: Create Full OceanManager with LOD Rings

**Files:**
- Modify: `js/ocean.js` (add new class, keep SimpleOceanManager for fallback)

- [ ] **Step 1: Write OceanManager class replacing SimpleOceanManager**

Add before export statements:
```javascript
class OceanManager {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.waveSystem = new WaveSystem();
    
    this.rings = [];
    this.gridSize = 200;
    this.lastCameraPos = new THREE.Vector3();
    
    const waterLevel = typeof WATER_LEVEL !== 'undefined' ? WATER_LEVEL : 2;
    this.waterLevel = waterLevel;
    
    // Create 3 LOD rings
    this.createRings(waterLevel);
  }
  
  createRings(waterY) {
    // Ring configurations: [innerRadius, outerRadius, radialSegs, concentricSegs, waveIntensity, color]
    const configs = [
      { inner: 0, outer: 600, radial: 48, conc: 16, intensity: 1.0, color: 0x1e90ff },   // Inner (high detail)
      { inner: 570, outer: 1800, radial: 24, conc: 8, intensity: 0.5, color: 0x40a0ff }, // Middle (medium, slight overlap)
      { inner: 1770, outer: 3000, radial: 12, conc: 4, intensity: 0.2, color: 0x6bb3ff }  // Outer (low, slight overlap)
    ];
    
    for (const config of configs) {
      const geometry = createRingGeometry(
        config.inner, 
        config.outer, 
        config.radial, 
        config.conc
      );
      
      // Store original positions for wave calculation
      const originalPositions = new Float32Array(geometry.attributes.position.array.length);
      originalPositions.set(geometry.attributes.position.array);
      geometry.userData.originalPositions = originalPositions;
      
      const material = new THREE.MeshStandardMaterial({
        color: config.color,
        roughness: 0.15,
        metalness: 0.1,
        flatShading: false,
        side: THREE.DoubleSide
      });
      
      const mesh = new THREE.Mesh(geometry, material);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = waterY;
      mesh.receiveShadow = true;
      mesh.userData.waveIntensity = config.intensity;
      
      this.scene.add(mesh);
      this.rings.push({ mesh, geometry, original: originalPositions });
    }
  }
  
  update(deltaTime) {
    // Update wave time
    this.waveSystem.update(deltaTime);
    
    // Reposition rings if camera moved significantly
    if (this.camera && this.camera.position) {
      const camX = this.camera.position.x;
      const camZ = this.camera.position.z;
      
      const dist = Math.sqrt(
        Math.pow(camX - this.lastCameraPos.x, 2) + 
        Math.pow(camZ - this.lastCameraPos.z, 2)
      );
      
      if (dist > 50) { // Reposition threshold
        const snapX = Math.floor(camX / this.gridSize) * this.gridSize;
        const snapZ = Math.floor(camZ / this.gridSize) * this.gridSize;
        
        for (const ring of this.rings) {
          ring.mesh.position.x = snapX;
          ring.mesh.position.z = snapZ;
        }
        
        this.lastCameraPos.set(camX, this.camera.position.y, camZ);
      }
    }
    
    // Update wave displacements on all rings
    for (const ring of this.rings) {
      this.updateRingWaves(ring);
    }
  }
  
  updateRingWaves(ring) {
    const positions = ring.geometry.attributes.position;
    const original = ring.original;
    const intensity = ring.mesh.userData.waveIntensity;
    const oceanX = ring.mesh.position.x;
    const oceanZ = ring.mesh.position.z;
    const waterY = this.waterLevel;
    
    let changed = false;
    
    for (let i = 0; i < positions.count; i++) {
      // Local position converted to world coordinates
      const localX = original[i * 3];
      const localZ = original[i * 3 + 2];
      
      const worldX = localX + oceanX;
      const worldZ = localZ + oceanZ;
      
      // Calculate wave displacement at this point
      const displaced = this.waveSystem.displaceVertex(
        new THREE.Vector3(worldX, waterY, worldZ)
      );
      
      // Apply with ring-specific intensity
      const waveHeight = original[i * 3 + 1] + (displaced.y * intensity);
      
      if (Math.abs(waveHeight - positions.getY(i)) > 0.01) {
        positions.setY(i, waveHeight);
        changed = true;
      }
    }
    
    if (changed) {
      positions.needsUpdate = true;
      ring.geometry.computeVertexNormals();
    }
  }
  
  getHeight(x, z) {
    return this.waveSystem.getHeight(x, z);
  }
}

export { OceanManager };
```

- [ ] **Step 2: Test LOD rings**

Replace test in index.html with:
```javascript
// In index.html around line 1450, replace SimpleOceanManager import
import('./js/ocean.js').then(({ OceanManager }) => {
  window.oceanManager = new OceanManager(scene, camera);
  console.log('LOD Ocean initialized with', window.oceanManager.rings.length, 'rings');
}).catch(err => {
  console.error('Failed to load ocean module:', err);
});
```

Run browser and verify:
1. Console shows "3 rings"
2. Concentric circles visible (different colors help debug)
3. Wave intensity higher near center (larger displacement on inner ring)
4. No gaps between rings (overlap should be seamless or minimally visible)

- [ ] **Step 3: Commit full OceanManager**

```bash
git add js/ocean.js
git commit -m "feat(ocean): Add OceanManager with 3 LOD rings

- Inner: 0-600m, 48x16 segments, 100% wave intensity, deep blue
- Middle: 570-1800m, 24x8 segments, 50% intensity, medium blue  
- Outer: 1770-3000m, 12x4 segments, 20% intensity, light blue
- Grid-snapped camera following at 200m intervals"
```

---

### Task 5: Integrate Ocean into Main Render Loop

**Files:**
- Modify: `js/environment.js` (lines 26-75)
- Modify: `index.html` (lines 1450-1460, 1538-1545)

- [ ] **Step 1: Remove old ocean code from environment.js**

Replace lines 26-75 in `js/environment.js`:
```javascript
// OLD CODE DELETE (lines 26-75):
let oceanMesh;
let cameraReference = null;

function createOcean(scene, camera) {
    // ... entire function ...
}

function updateOceanWaves(time) {
    // ... entire function ...
}

// NEW REPLACEMENT:

// Dynamic ocean imported from ocean.js - exposed globally for boat integration
export let oceanManagerInstance = null;

/**
 * Initialize dynamic ocean with LOD system
 */
export function createDynamicOcean(scene, camera) {
  import('./ocean.js').then(({ OceanManager }) => {
    oceanManagerInstance = new OceanManager(scene, camera);
    window.oceanManager = oceanManagerInstance; // Global for boats/aircraft access
    console.log('[Ocean] Dynamic ocean system initialized');
  }).catch(err => {
    console.error('[Ocean] Failed to load:', err);
  });
}

/**
 * Update ocean waves and camera tracking
 */
export function updateOcean(deltaTime) {
  if (oceanManagerInstance) {
    oceanManagerInstance.update(deltaTime);
  }
}

/**
 * Get wave height at world coordinates (for boats, collision)
 */
export function getOceanHeight(x, z) {
  return oceanManagerInstance ? oceanManagerInstance.getHeight(x, z) : 0;
}
```

- [ ] **Step 2: Update index.html to use new ocean system**

Line ~1454 in `index.html`, replace:
```javascript
// OLD:
createOcean(scene, camera);

// NEW:
import('./js/environment.js').then(({ createDynamicOcean }) => {
  createDynamicOcean(scene, camera);
});
```

Lines ~1538-1545 in `index.html`, find the render loop and replace:
```javascript
// OLD (around line 1542):
updateOceanWaves(time);

// NEW:
import('./js/environment.js').then(({ updateOcean }) => {
  if (typeof updateOcean === 'function') {
    updateOcean(deltaTime);
  }
});
```

**Note:** The render loop should already have `deltaTime` available from performance.now() calculation.

- [ ] **Step 3: Test integration**

Run `npx serve`, load page, verify:
1. Loading completes without errors
2. Console shows "[Ocean] Dynamic ocean system initialized"
3. Ocean visible with animated waves (not flat)
4. No JavaScript errors in console
5. FPS above 50 (check PerformanceMonitor overlay if enabled)

- [ ] **Step 4: Commit integration**

```bash
git add js/environment.js index.html
git commit -m "feat(ocean): Integrate dynamic ocean into main render loop

- Remove old createOcean() and updateOceanWaves() from environment.js
- Add ES module exports for createDynamicOcean, updateOcean, getOceanHeight
- Update index.html to import and call new functions"
```

---

### Task 6: Update Boat Bobbing to Use Wave Height

**Files:**
- Modify: `js/boats.js` (line ~921)

- [ ] **Step 1: Find current boat update code**

Verify line 921 in `js/boats.js`:
```javascript
boat.mesh.position.y = BOAT_WATER_LEVEL + Math.sin(boat.bobTimer) * 0.3;
```

- [ ] **Step 2: Replace with wave-sampled bobbing**

Replace the above line:
```javascript
// Sample ocean height at boat position for realistic water following
const getOceanHeight = window.getOceanHeight || (() => 0);
const waveHeight = getOceanHeight(boat.mesh.position.x, boat.mesh.position.z);

// Combine wave height with small bobbing offset for natural motion
const bobOffset = Math.sin(boat.bobTimer) * 0.2;
boat.mesh.position.y = BOAT_WATER_LEVEL + waveHeight * 0.7 + bobOffset;
```

The `waveHeight * 0.7` dampens the full wave displacement slightly so boats don't ride peaks too aggressively (more realistic buoyancy).

- [ ] **Step 3: Test boat integration**

1. Run simulator with boats enabled (check settings toggle)
2. Fly near ocean, observe boats
3. Boats should follow wave crests/troughs as waves pass underneath
4. Motion should look natural, not jittery or floating

Console test:
```javascript
// Find a boat's position
const boat = window.boatManager?.boats?.[0]?.mesh;
if (boat) {
  console.log('Boat position:', boat.position);
  console.log('Expected wave height:', window.oceanManager.getHeight(boat.position.x, boat.position.z));
  console.log('Boat Y should be ~2 + (waveHeight * 0.7) + small bob');
}
```

- [ ] **Step 4: Commit boat updates**

```bash
git add js/boats.js
git commit -m "feat(ocean): Update boats to follow dynamic wave heights

- Sample getOceanHeight() at boat position each frame
- Dampen wave height by 0.7 for realistic buoyancy
- Preserve small sine bobbing offset for natural motion"
```

---

### Task 7: Clean Up Test Code and Optimize

**Files:**
- Modify: `js/ocean.js` (optional optimization)
- Modify: index.html (remove any remaining test imports if separate)

- [ ] **Step 1: Remove SimpleOceanManager (no longer needed)**

In `js/ocean.js`, remove the entire `SimpleOceanManager` class and its export since `OceanManager` is now production. Keep comment noting it was MVP test code.

- [ ] **Step 2: Add performance optimization - skip vertex updates if camera stationary**

In `OceanManager.update()`, add early-out check:
```javascript
update(deltaTime) {
  this.waveSystem.update(deltaTime); // Always update time for getHeight() accuracy
  
  // Skip expensive repositioning if camera barely moved
  if (this.camera && this.camera.position) {
    const camX = this.camera.position.x;
    const camZ = this.camera.position.z;
    
    const dist = Math.sqrt(
      Math.pow(camX - this.lastCameraPos.x, 2) + 
      Math.pow(camZ - this.lastCameraPos.z, 2)
    );
    
    if (dist > 50) {
      // ... reposition code as before ...
    }
  }
  
  // Always update waves even when stationary (ocean should animate)
  for (const ring of this.rings) {
    this.updateRingWaves(ring);
  }
}
```

- [ ] **Step 3: Add mobile detection to reduce segment counts**

At start of `OceanManager.constructor()`:
```javascript
constructor(scene, camera) {
  // ... existing code ...
  
  // Detect mobile devices and use lighter LOD settings
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  if (isMobile || navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) {
    console.log('[Ocean] Mobile/low-CPU detected, reducing segment counts');
    // Reduce all ring segments by ~50%
    configs[0].radial = 32; configs[0].conc = 12;   // Inner: 32x12 instead of 48x16
    configs[1].radial = 16; configs[1].conc = 6;    // Middle: 16x6 instead of 24x8
    configs[2].radial = 8;  configs[2].conc = 3;    // Outer: 8x3 instead of 12x4
  }
  
  this.createRings(waterLevel);
}
```

- [ ] **Step 4: Test performance**

Desktop test:
```bash
npx serve
# Open browser, check FPS with PerformanceMonitor visible (should be >50 FPS)
```

Mobile simulation in Chrome DevTools:
1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select "iPhone SE" or similar low-end device
4. Refresh page, check console for "reducing segment counts" message
5. Verify FPS stays above 30

- [ ] **Step 5: Commit optimizations**

```bash
git add js/ocean.js index.html
git commit -m "perf(ocean): Add mobile detection and optimization

- Detect mobile/low-CPU devices via userAgent and hardwareConcurrency
- Reduce segment counts by ~40% on detected devices
- Keep wave animation running even when camera stationary"
```

---

### Task 8: Adjust Abby Mode for Wave-Aware Collision (Optional)

**Files:**
- Modify: `js/aircraft.js` (lines ~873-895, in checkCrash method)

- [ ] **Step 1: Find current water collision code**

In `js/aircraft.js`, locate the `checkCrash()` method around line 883. Verify existing code:
```javascript
const WATER_LEVEL = 2;
const isBelowWater = this.position.y < WATER_LEVEL;
```

- [ ] **Step 2: Make water level wave-aware (only in non-Abby mode)**

Replace with:
```javascript
const baseWaterLevel = typeof WATER_LEVEL !== 'undefined' ? WATER_LEVEL : 2;

// Sample dynamic ocean height if available
let effectiveWaterLevel = baseWaterLevel;
if (!this.abbyMode && window.oceanManager) {
  const waveHeight = window.oceanManager.getHeight(this.position.x, this.position.z);
  effectiveWaterLevel = baseWaterLevel + waveHeight * 0.85; // Slightly dampen for collision buffer
}

const isBelowWater = this.position.y < effectiveWaterLevel;
```

This means:
- In Abby mode: Always use flat WATER_LEVEL (waves don't affect crash detection)
- Normal mode: Water level varies with waves, making water collisions more realistic
- 0.85 damping prevents false positives from rapid wave oscillations

- [ ] **Step 3: Test aircraft collision**

1. Disable Abby mode in settings
2. Fly low over ocean (< 5m altitude)
3. Observe if crash detection triggers at appropriate height (should vary slightly with waves)
4. Enable Abby mode, repeat - should ignore ocean entirely and only check terrain

- [ ] **Step 4: Commit Abby mode adjustment**

```bash
git add js/aircraft.js
git commit -m "feat(ocean): Make aircraft water collision wave-aware in normal mode

- Sample getOceanHeight() at aircraft position for dynamic water level
- Disable wave effect in Abby mode (flat WATER_LEVEL only)
- Apply 0.85 damping to prevent false positives from rapid waves"
```

---

### Task 9: Visual Polish - Add Depth Fog Integration

**Files:**
- Modify: `index.html` (scene setup, around line ~1420-1450 where fog is configured)

- [ ] **Step 1: Find existing fog configuration**

Search for `THREE.FogExp2` in index.html. Verify current settings (likely density around 0.0001-0.0003).

- [ ] **Step 2: Increase fog density slightly to mask outer ring boundary at 3000m**

Current setup likely already has appropriate fog, but ensure it's tuned for the 3km ocean radius:
```javascript
// Recommended fog settings for 3000m ocean rings:
scene.fog = new THREE.FogExp2(0x87CEEB, 0.00015); // Slightly denser if currently < 0.0001

// This ensures:
// - Clear visibility within 1000-1500m (good for gameplay)
// - Outer ring fades naturally into horizon at ~3000m
// - No visible cutoff beyond ocean boundary
```

If fog is already in this range, no change needed.

- [ ] **Step 3: Test visual integration**

Fly to edge of ocean (~2500-3000m from center):
1. Outer ring should fade into horizon smoothly (no hard edge)
2. Fog color should match sky color for seamless blend
3. No visible "cliff" where ocean ends

Take screenshot or note visual quality.

- [ ] **Step 4: Commit fog adjustment (if changed)**

```bash
git add index.html
git commit -m "style(ocean): Tune fog density to mask 3km outer ring boundary

- Set FogExp2 density to 0.00015 for smooth fade at ocean edge"
```

---

### Task 10: Final Testing and Documentation

**Files:**
- Modify: `AGENTS.md` (add new file to file structure)
- Create: None (design doc already written)

- [ ] **Step 1: Update AGENTS.md with new file**

In `/Users/tyler/Workspace/soaringVibes/AGENTS.md`, find the "File Structure" section and add under `js/`:

```markdown
├── ocean.js              # Dynamic ocean system (Gerstner waves, LOD rings)
```

Also update "Current Features" to mention:
- **Ocean**: Dynamic Gerstner wave system with 3 LOD levels, follows camera with grid snapping, mobile-optimized segment counts

- [ ] **Step 2: Run comprehensive visual test checklist**

Open simulator and verify:

**Visual Tests:**
- [ ] Waves animate smoothly at 60 FPS (no stuttering)
- [ ] Inner ring shows largest wave amplitude (~±2m from baseline)
- [ ] Middle/outer rings show progressively smaller waves
- [ ] No visible seams between overlapping ring boundaries (570/600 and 1770/1800 transitions)
- [ ] Ocean follows aircraft during flight without popping or lag
- [ ] Fog masks outer edge cleanly at ~3km distance

**Performance Tests:**
- [ ] Desktop FPS > 50 with all systems enabled (flora, fauna, boats, ocean)
- [ ] Mobile-simulated FPS > 30 with reduced segments
- [ ] No memory warnings in DevTools after 2+ minutes of flight

**Integration Tests:**
- [ ] Boats follow wave heights realistically (visible bobbing on crests/troughs)
- [ ] Aircraft can land on water in normal mode (wave-aware collision works)
- [ ] Abby mode ignores ocean waves, only terrain collision active
- [ ] Multiplayer sync unaffected (ocean is client-only visual system)

**Edge Case Tests:**
- [ ] Rapid camera movement (> 100m/s) - ocean snaps smoothly without teleporting
- [ ] Flight at extreme altitude (5000m+) - rings stay centered correctly below
- [ ] Underwater flight in Abby mode - ocean renders double-sided, visible from below

- [ ] **Step 3: Document known limitations**

Add to AGENTS.md under "Known Issues":
```markdown
- Ocean waves use CPU-based vertex displacement (may impact very low-end devices)
- Foam effect not yet implemented (planned for future enhancement)
- No dynamic wave generation from aircraft/boat wakes (cosmetic only)
```

- [ ] **Step 4: Final commit**

```bash
git add AGENTS.md
git commit -m "docs: Update AGENTS.md with ocean.js and known limitations

- Add ocean.js to file structure documentation
- Note dynamic wave system in Current Features
- Document known issues (CPU-based, no foam, no wake generation)"
```

---

## Verification Commands

After all tasks complete, run full validation:

### Visual Validation
```bash
npx serve
# Open http://localhost:3000
# Fly over ocean, observe waves at multiple distances
# Enable/disable Abby mode, test water collision
```

### Performance Validation  
```javascript
// In browser console:
console.log('Ring count:', window.oceanManager.rings.length);
window.oceanManager.rings.forEach((ring, i) => {
  console.log(`Ring ${i}: ${ring.geometry.attributes.position.count} vertices`);
});

// Expected output:
// Ring 0: ~768 vertices (inner, high detail)
// Ring 1: ~576 vertices (middle, medium)  
// Ring 2: ~144 vertices (outer, low)
```

### Wave Sampling Test
```javascript
const heights = [];
for (let x = -100; x <= 100; x += 10) {
  heights.push(window.oceanManager.getHeight(x, 0));
}
console.log('Wave height range:', Math.min(...heights), 'to', Math.max(...heights));
// Expected: Between -3 and +3 meters across sampled area
```

---

## Rollback Plan

If issues arise, rollback steps:

1. **Keep old ocean as fallback**: Don't delete `createOcean()` until new system stable for 24+ hours
2. **Feature flag approach** (optional): Add config toggle to switch between old/new systems via URL param
3. **Git revert ready**: Each task is separate commit, can individually revert if problematic

---

## Success Criteria Summary

✅ Gerstner waves animate smoothly on 3 concentric LOD rings  
✅ Ocean follows camera with grid snapping (no jitter)  
✅ FPS > 50 desktop, > 30 mobile-simulated  
✅ Boats bob realistically following wave heights  
✅ Aircraft collision respects dynamic water level in normal mode  
✅ Abby mode unaffected by waves (flat water or no collision)  
✅ Fog masks outer boundary at 3km seamlessly
