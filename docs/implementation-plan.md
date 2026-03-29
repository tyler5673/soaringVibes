# Biome Flora and Fauna Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement biome-specific vegetation (5 tree types) and animated wildlife (8 species) with LOD and performance optimizations for the Hawaiian flight simulator.

**Architecture:** Extend existing island system with biome-aware flora generation using Three.js instanced meshes for performance. Implement fauna as state-machine-driven animated objects with frustum culling and distance-based LOD. Use object pooling for marine life and birds to maintain steady memory usage.

**Tech Stack:** Three.js (r128+), custom geometry generation, requestAnimationFrame animation loop, ES6 classes

---

## File Structure

### New Files
- `js/flora.js` - Tree generation classes, LOD management, instanced rendering
- `js/fauna.js` - Animal base class, specific species implementations, animation controllers
- `js/performance.js` - Frustum culling, distance culling, LOD switching utilities

### Modified Files
- `js/islands.js` - Integrate biome-aware tree placement via flora system
- `js/wildlife.js` - Replace with new fauna system calls
- `index.html` - Update animation loop, add LOD update calls

---

## Phase 1: Foundation & Performance Utilities

### Task 1: Performance Utilities (js/performance.js)

**Goal:** Create frustum culling and LOD management system

**Files:**
- Create: `js/performance.js`
- Modify: `index.html` (add script tag)

- [ ] **Step 1: Write the frustum culling utility**

```javascript
// js/performance.js
class PerformanceManager {
    constructor(camera) {
        this.camera = camera;
        this.frustum = new THREE.Frustum();
        this.projScreenMatrix = new THREE.Matrix4();
        this.culledObjects = new Set();
    }
    
    updateFrustum() {
        this.projScreenMatrix.multiplyMatrices(
            this.camera.projectionMatrix,
            this.camera.matrixWorldInverse
        );
        this.frustum.setFromProjectionMatrix(this.projScreenMatrix);
    }
    
    isInView(object) {
        const pos = object.position;
        return this.frustum.containsPoint(pos);
    }
    
    getLODLevel(distance) {
        if (distance < 300) return 'high';
        if (distance < 800) return 'medium';
        return 'far';
    }
}

window.PerformanceManager = PerformanceManager;
```

- [ ] **Step 2: Add script to index.html**

```html
<!-- Add in index.html head section, after islands.js -->
<script src="js/performance.js"></script>
<script src="js/flora.js"></script>
<script src="js/fauna.js"></script>
```

- [ ] **Step 3: Test performance utilities load**

Open browser console and verify:
```javascript
const pm = new PerformanceManager(camera);
console.log(pm.getLODLevel(250)); // Should print 'high'
console.log(pm.getLODLevel(500)); // Should print 'medium'
console.log(pm.getLODLevel(1000)); // Should print 'far'
```

- [ ] **Step 4: Commit**

```bash
git add js/performance.js index.html
git commit -m "feat: add performance utilities with frustum culling and LOD"
```

---

## Phase 2: Flora System

### Task 2: Flora Base Classes (js/flora.js Part 1)

**Goal:** Create base tree class and LOD geometry generators

**Files:**
- Create: `js/flora.js` (initial part)

- [ ] **Step 1: Create TreeGeometryCache for LOD levels**

```javascript
// js/flora.js - Part 1
class TreeGeometryCache {
    constructor() {
        this.cache = new Map();
    }
    
    getGeometry(type, lod) {
        const key = `${type}_${lod}`;
        if (!this.cache.has(key)) {
            this.cache.set(key, this.createGeometry(type, lod));
        }
        return this.cache.get(key);
    }
    
    createGeometry(type, lod) {
        switch(type) {
            case 'palm':
                return this.createPalmGeometry(lod);
            case 'koa':
                return this.createKoaGeometry(lod);
            case 'ohia':
                return this.createOhiaGeometry(lod);
            case 'shrub':
                return this.createShrubGeometry(lod);
            case 'grass':
                return this.createGrassGeometry(lod);
            default:
                return new THREE.BoxGeometry(1, 1, 1);
        }
    }
    
    createPalmGeometry(lod) {
        if (lod === 'far') {
            // Simple crossed planes
            const group = new THREE.Group();
            const geo1 = new THREE.PlaneGeometry(3, 8);
            const geo2 = new THREE.PlaneGeometry(3, 8);
            geo2.rotateY(Math.PI / 2);
            group.add(new THREE.Mesh(geo1));
            group.add(new THREE.Mesh(geo2));
            return group;
        }
        
        if (lod === 'medium') {
            // Simple trunk + canopy
            const group = new THREE.Group();
            const trunk = new THREE.Mesh(
                new THREE.CylinderGeometry(0.3, 0.4, 8, 6),
                new THREE.MeshStandardMaterial({ color: 0x8B4513 })
            );
            trunk.position.y = 4;
            const canopy = new THREE.Mesh(
                new THREE.ConeGeometry(2, 3, 6),
                new THREE.MeshStandardMaterial({ color: 0x4CAF50 })
            );
            canopy.position.y = 8;
            group.add(trunk, canopy);
            return group;
        }
        
        // High LOD - full palm tree
        const group = new THREE.Group();
        const trunkGeo = new THREE.CylinderGeometry(0.2, 0.35, 10, 8);
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.y = 5;
        trunk.castShadow = true;
        group.add(trunk);
        
        // 7-9 fronds
        const frondMat = new THREE.MeshStandardMaterial({ color: 0x4CAF50 });
        const frondCount = 7 + Math.floor(Math.random() * 3);
        for (let i = 0; i < frondCount; i++) {
            const frondGeo = new THREE.ConeGeometry(0.8, 3, 4);
            const frond = new THREE.Mesh(frondGeo, frondMat);
            const angle = (i / frondCount) * Math.PI * 2;
            frond.position.set(
                Math.cos(angle) * 0.5,
                10,
                Math.sin(angle) * 0.5
            );
            frond.rotation.x = 1.2;
            frond.rotation.y = angle;
            frond.castShadow = true;
            group.add(frond);
        }
        
        return group;
    }
    
    createKoaGeometry(lod) {
        if (lod === 'far') {
            return new THREE.Mesh(
                new THREE.SphereGeometry(3, 8, 6),
                new THREE.MeshStandardMaterial({ color: 0x2E7D32 })
            );
        }
        
        if (lod === 'medium') {
            const group = new THREE.Group();
            const trunk = new THREE.Mesh(
                new THREE.CylinderGeometry(0.5, 0.8, 15, 8),
                new THREE.MeshStandardMaterial({ color: 0x5D4037 })
            );
            trunk.position.y = 7.5;
            const canopy = new THREE.Mesh(
                new THREE.SphereGeometry(6, 12, 8),
                new THREE.MeshStandardMaterial({ color: 0x2E7D32 })
            );
            canopy.position.y = 15;
            group.add(trunk, canopy);
            return group;
        }
        
        // High LOD
        const group = new THREE.Group();
        // Main trunk
        const trunkHeight = 12 + Math.random() * 8;
        const trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(0.4, 0.7, trunkHeight, 8),
            new THREE.MeshStandardMaterial({ color: 0x5D4037 })
        );
        trunk.position.y = trunkHeight / 2;
        trunk.castShadow = true;
        group.add(trunk);
        
        // Spreading branches
        const branchCount = 5 + Math.floor(Math.random() * 4);
        for (let i = 0; i < branchCount; i++) {
            const branch = new THREE.Mesh(
                new THREE.CylinderGeometry(0.15, 0.3, 4, 6),
                new THREE.MeshStandardMaterial({ color: 0x5D4037 })
            );
            const angle = (i / branchCount) * Math.PI * 2 + Math.random() * 0.5;
            const height = trunkHeight * (0.7 + Math.random() * 0.3);
            branch.position.set(
                Math.cos(angle) * 2,
                height,
                Math.sin(angle) * 2
            );
            branch.rotation.z = Math.PI / 2 - 0.3;
            branch.rotation.y = angle;
            group.add(branch);
            
            // Leaf clusters
            const leaves = new THREE.Mesh(
                new THREE.SphereGeometry(1.5, 6, 4),
                new THREE.MeshStandardMaterial({ color: 0x2E7D32 })
            );
            leaves.position.set(
                Math.cos(angle) * 3.5,
                height - 0.5,
                Math.sin(angle) * 3.5
            );
            group.add(leaves);
        }
        
        return group;
    }
    
    createOhiaGeometry(lod) {
        if (lod === 'far') {
            return new THREE.Mesh(
                new THREE.SphereGeometry(2, 8, 6),
                new THREE.MeshStandardMaterial({ color: 0x1B5E20 })
            );
        }
        
        if (lod === 'medium') {
            const group = new THREE.Group();
            const trunk = new THREE.Mesh(
                new THREE.CylinderGeometry(0.3, 0.5, 8, 8),
                new THREE.MeshStandardMaterial({ color: 0x8D6E63 })
            );
            trunk.position.y = 4;
            const canopy = new THREE.Mesh(
                new THREE.SphereGeometry(3.5, 10, 8),
                new THREE.MeshStandardMaterial({ color: 0x2E7D32 })
            );
            canopy.position.y = 9;
            group.add(trunk, canopy);
            return group;
        }
        
        // High LOD with flowers
        const group = new THREE.Group();
        const trunkHeight = 6 + Math.random() * 6;
        const trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(0.25, 0.4, trunkHeight, 8),
            new THREE.MeshStandardMaterial({ color: 0x8D6E63 })
        );
        trunk.position.y = trunkHeight / 2;
        trunk.castShadow = true;
        group.add(trunk);
        
        // Multiple canopy layers with red flowers
        const canopyMat = new THREE.MeshStandardMaterial({ color: 0x2E7D32 });
        const flowerMat = new THREE.MeshStandardMaterial({ color: 0xD32F2F });
        
        for (let i = 0; i < 3; i++) {
            const canopy = new THREE.Mesh(
                new THREE.SphereGeometry(2 - i * 0.3, 8, 6),
                canopyMat
            );
            canopy.position.y = trunkHeight + 1 + i * 1.5;
            group.add(canopy);
            
            // Red lehua flowers scattered
            for (let j = 0; j < 5; j++) {
                const flower = new THREE.Mesh(
                    new THREE.SphereGeometry(0.15, 4, 4),
                    flowerMat
                );
                const angle = Math.random() * Math.PI * 2;
                const radius = (2 - i * 0.3) * Math.random();
                flower.position.set(
                    Math.cos(angle) * radius,
                    trunkHeight + 1 + i * 1.5,
                    Math.sin(angle) * radius
                );
                group.add(flower);
            }
        }
        
        return group;
    }
    
    createShrubGeometry(lod) {
        if (lod === 'far') {
            return new THREE.Mesh(
                new THREE.SphereGeometry(1.2, 6, 4),
                new THREE.MeshStandardMaterial({ color: 0x6B8E23 })
            );
        }
        
        if (lod === 'medium') {
            return new THREE.Mesh(
                new THREE.SphereGeometry(1.5, 8, 6),
                new THREE.MeshStandardMaterial({ color: 0x6B8E23 })
            );
        }
        
        // High LOD
        const group = new THREE.Group();
        const trunkCount = 2 + Math.floor(Math.random() * 4);
        const mat = new THREE.MeshStandardMaterial({ color: 0x6B8E23 });
        
        for (let i = 0; i < trunkCount; i++) {
            const trunk = new THREE.Mesh(
                new THREE.CylinderGeometry(0.05, 0.1, 3, 5),
                mat
            );
            const angle = (i / trunkCount) * Math.PI * 2;
            trunk.position.set(
                Math.cos(angle) * 0.3,
                1.5,
                Math.sin(angle) * 0.3
            );
            trunk.rotation.z = (Math.random() - 0.5) * 0.3;
            group.add(trunk);
            
            const bush = new THREE.Mesh(
                new THREE.SphereGeometry(0.8, 6, 5),
                mat
            );
            bush.position.set(
                Math.cos(angle) * 0.3,
                2.8,
                Math.sin(angle) * 0.3
            );
            group.add(bush);
        }
        
        return group;
    }
    
    createGrassGeometry(lod) {
        if (lod === 'far') {
            return new THREE.Mesh(
                new THREE.PlaneGeometry(0.8, 1.2),
                new THREE.MeshStandardMaterial({ 
                    color: 0x9ACD32,
                    side: THREE.DoubleSide
                })
            );
        }
        
        // Medium and high - same for grass
        const group = new THREE.Group();
        const mat = new THREE.MeshStandardMaterial({ 
            color: 0x9ACD32,
            side: THREE.DoubleSide
        });
        
        const bladeCount = 8 + Math.floor(Math.random() * 8);
        for (let i = 0; i < bladeCount; i++) {
            const blade = new THREE.Mesh(
                new THREE.PlaneGeometry(0.1 + Math.random() * 0.1, 0.5 + Math.random() * 0.5),
                mat
            );
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 0.4;
            blade.position.set(
                Math.cos(angle) * radius,
                0.25 + Math.random() * 0.3,
                Math.sin(angle) * radius
            );
            blade.rotation.y = angle;
            blade.rotation.x = (Math.random() - 0.5) * 0.2;
            group.add(blade);
        }
        
        return group;
    }
}

window.TreeGeometryCache = TreeGeometryCache;
```

- [ ] **Step 2: Commit**

```bash
git add js/flora.js
git commit -m "feat: add TreeGeometryCache with LOD levels for 5 tree types"
```

---

### Task 3: Flora Manager Class (js/flora.js Part 2)

**Goal:** Create FloraManager to handle biome-aware tree placement and LOD switching

**Files:**
- Modify: `js/flora.js` (append)

- [ ] **Step 1: Create FloraManager class**

```javascript
// Append to js/flora.js

class FloraManager {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.geometryCache = new TreeGeometryCache();
        this.allTrees = []; // { mesh, type, position, lod, lastUpdate }
        this.maxVisibleTrees = 500;
        this.updateInterval = 0.5; // seconds between LOD updates
        this.lastUpdate = 0;
    }
    
    // Determine tree type based on biome
    getTreeTypeForBiome(biome) {
        switch(biome) {
            case 'beach':
                return { type: 'palm', scale: 0.8 + Math.random() * 0.4 };
            case 'forest':
                const forestTypes = ['koa', 'ohia', 'ohia'];
                return { 
                    type: forestTypes[Math.floor(Math.random() * forestTypes.length)],
                    scale: 0.9 + Math.random() * 0.3
                };
            case 'shrubland':
                const shrubTypes = ['shrub', 'shrub', 'ohia'];
                return {
                    type: shrubTypes[Math.floor(Math.random() * shrubTypes.length)],
                    scale: 0.7 + Math.random() * 0.4
                };
            case 'grassland':
                return { type: 'grass', scale: 0.6 + Math.random() * 0.5 };
            case 'cliff':
            case 'rock':
                return null; // No trees on cliffs/rock
            default:
                return { type: 'shrub', scale: 0.5 + Math.random() * 0.3 };
        }
    }
    
    // Calculate tree density per biome
    getDensityForBiome(biome) {
        switch(biome) {
            case 'forest': return 1.0;
            case 'shrubland': return 0.6;
            case 'grassland': return 0.3;
            case 'beach': return 0.15;
            case 'cliff': return 0.02;
            case 'rock': return 0.05;
            default: return 0.1;
        }
    }
    
    // Place trees for an island
    placeTreesForIsland(islandGroup, islandName, islandWorldX, islandWorldZ) {
        const spacing = 50;
        const meta = islandMetadataCache[islandName];
        if (!meta) return;
        
        const terrainWidth = meta.worldWidth * 0.08;
        const terrainHeight = meta.worldHeight * 0.08;
        const halfWidth = terrainWidth / 2;
        const halfHeight = terrainHeight / 2;
        
        const startX = islandWorldX - halfWidth;
        const startZ = islandWorldZ - halfHeight;
        const endX = islandWorldX + halfWidth;
        const endZ = islandWorldZ + halfHeight;
        
        let placed = 0;
        
        for (let x = startX; x <= endX; x += spacing) {
            for (let z = startZ; z <= endZ; z += spacing) {
                // Skip if not on island
                if (!isPointOnIsland(x, z, islandName)) continue;
                
                // Get terrain height
                const terrainY = getTerrainMeshHeight(x, z, islandName);
                if (terrainY <= WATER_LEVEL + 0.5) continue;
                
                // Get biome info
                const biomeInfo = getBiomeFromTerrain(x, z);
                if (!biomeInfo || biomeInfo.biome === 'water' || biomeInfo.biome === 'unknown') continue;
                
                // Check density
                const density = this.getDensityForBiome(biomeInfo.biome);
                if (Math.random() > density) continue;
                
                // Get tree type
                const treeConfig = this.getTreeTypeForBiome(biomeInfo.biome);
                if (!treeConfig) continue;
                
                // Create tree at medium LOD initially
                const localX = x - islandWorldX;
                const localZ = z - islandWorldZ;
                const tree = this.createTree(treeConfig.type, 'medium', localX, terrainY, localZ, treeConfig.scale);
                
                if (tree) {
                    islandGroup.add(tree);
                    this.allTrees.push({
                        mesh: tree,
                        type: treeConfig.type,
                        worldPos: new THREE.Vector3(x, terrainY, z),
                        currentLOD: 'medium',
                        scale: treeConfig.scale
                    });
                    placed++;
                }
            }
        }
        
        console.log(`FloraManager: Placed ${placed} trees on ${islandName}`);
    }
    
    createTree(type, lod, x, y, z, scale) {
        const geometry = this.geometryCache.getGeometry(type, lod);
        if (!geometry) return null;
        
        const tree = geometry.clone();
        tree.position.set(x, y, z);
        tree.scale.setScalar(scale);
        
        // Add random rotation for variety
        tree.rotation.y = Math.random() * Math.PI * 2;
        
        return tree;
    }
    
    // Switch LOD for a tree
    switchLOD(treeData, newLOD) {
        if (treeData.currentLOD === newLOD) return;
        
        const parent = treeData.mesh.parent;
        const oldMesh = treeData.mesh;
        
        // Create new mesh at new LOD
        const newMesh = this.createTree(treeData.type, newLOD, 
            oldMesh.position.x, oldMesh.position.y, oldMesh.position.z,
            treeData.scale);
        
        if (newMesh && parent) {
            parent.remove(oldMesh);
            parent.add(newMesh);
            treeData.mesh = newMesh;
            treeData.currentLOD = newLOD;
            
            // Dispose old geometry to free memory
            oldMesh.traverse(child => {
                if (child.geometry) child.geometry.dispose();
            });
        }
    }
    
    // Main update loop - call from animate()
    update(delta) {
        this.lastUpdate += delta;
        if (this.lastUpdate < this.updateInterval) return;
        this.lastUpdate = 0;
        
        const camPos = this.camera.position;
        let visibleCount = 0;
        
        // Update LOD for all trees
        this.allTrees.forEach(treeData => {
            const dist = camPos.distanceTo(treeData.worldPos);
            
            // Distance culling
            if (dist > TREE_RENDER_DISTANCE) {
                treeData.mesh.visible = false;
                return;
            }
            
            // Frustum culling (check if in camera view)
            const pm = window.perfManager;
            if (pm && !pm.isInView(treeData.mesh)) {
                treeData.mesh.visible = false;
                return;
            }
            
            treeData.mesh.visible = true;
            visibleCount++;
            
            // Update LOD based on distance
            let targetLOD = 'far';
            if (dist < 300) targetLOD = 'high';
            else if (dist < 800) targetLOD = 'medium';
            
            if (treeData.currentLOD !== targetLOD) {
                this.switchLOD(treeData, targetLOD);
            }
        });
        
        // Limit visible trees
        if (visibleCount > this.maxVisibleTrees) {
            // Sort by distance and hide farthest
            const sorted = this.allTrees
                .filter(t => t.mesh.visible)
                .sort((a, b) => {
                    const da = camPos.distanceTo(a.worldPos);
                    const db = camPos.distanceTo(b.worldPos);
                    return db - da; // Farthest first
                });
            
            for (let i = this.maxVisibleTrees; i < sorted.length; i++) {
                sorted[i].mesh.visible = false;
            }
        }
    }
}

window.FloraManager = FloraManager;
```

- [ ] **Step 2: Commit**

```bash
git add js/flora.js
git commit -m "feat: add FloraManager with biome-aware placement and dynamic LOD"
```

---

### Task 4: Integrate Flora with Islands

**Goal:** Replace old tree grid system with FloraManager

**Files:**
- Modify: `js/islands.js` (replace addTreesOnGrid calls)
- Modify: `index.html` (add flora update to animate loop)

- [ ] **Step 1: Modify createAllIslands to use FloraManager**

```javascript
// In js/islands.js, modify the createAllIslands function:

async function createAllIslands(scene, onProgress) {
    const total = islandPositions.length;
    let loaded = 0;
    
    const loadPromises = islandPositions.map(island => {
        return createIslandFromHeightmap(
            scene,
            island.name,
            island.x,
            island.z,
            { hasAirport: island.hasAirport, worldScale: island.worldScale }
        ).then(islandGroup => {
            loaded++;
            if (onProgress) onProgress(Math.round((loaded / total) * 100));
            return { island: islandGroup, info: island };
        });
    });

    const results = await Promise.all(loadPromises);
    
    const landcoverPromises = islandPositions.map(island => {
        return loadLandcoverData(island.name);
    });
    await Promise.all(landcoverPromises);
    
    // Initialize FloraManager
    const floraManager = new FloraManager(scene, camera);
    window.floraManager = floraManager;
    
    // Place trees for each island
    for (const { island: islandGroup, info } of results) {
        floraManager.placeTreesForIsland(islandGroup, info.name, info.x, info.z);
    }

    return results.map(r => r.island);
}
```

- [ ] **Step 2: Add flora update to animate loop**

```javascript
// In index.html, in the animate function, add:

function animate() {
    requestAnimationFrame(animate);
    
    const delta = clock.getDelta();
    
    // Update controls
    controls.update();
    
    // Update aircraft physics
    aircraft.update(delta);
    
    // Update camera follow
    updateCamera();
    
    // Update environment (clouds, etc)
    if (environment) {
        environment.update(delta, aircraft.getPosition());
    }
    
    // Update flora LOD
    if (window.floraManager) {
        window.floraManager.update(delta);
    }
    
    // Update wildlife
    if (wildlife) {
        wildlife.update(delta);
    }
    
    // Render
    renderer.render(scene, camera);
}
```

- [ ] **Step 3: Remove old tree placement**

Comment out or remove the old addTreesOnGrid call in islands.js:

```javascript
// Remove or comment out this line:
// addTreesOnGrid(islandGroup, info.name, info.x, info.z);
```

- [ ] **Step 4: Test flora placement**

Refresh browser and verify:
- Different tree types appear per biome
- Trees are properly placed on terrain
- Console shows "FloraManager: Placed X trees"

- [ ] **Step 5: Commit**

```bash
git add js/islands.js index.html
git commit -m "feat: integrate FloraManager with islands and animation loop"
```

---

## Phase 3: Fauna System

### Task 5: Animal Base Class (js/fauna.js Part 1)

**Goal:** Create base Animal class with state machine and animation support

**Files:**
- Create: `js/fauna.js` (initial)

- [ ] **Step 1: Create Animal base class**

```javascript
// js/fauna.js - Part 1

class Animal {
    constructor(scene, initialPosition, config = {}) {
        this.scene = scene;
        this.position = initialPosition.clone();
        this.velocity = new THREE.Vector3();
        this.config = {
            speed: 10,
            turnSpeed: 1,
            animationSpeed: 1,
            viewDistance: 1000,
            updateDistance: 2000,
            ...config
        };
        
        this.mesh = null;
        this.state = 'idle';
        this.stateTimer = 0;
        this.animationTime = 0;
        this.lastUpdate = 0;
        this.isVisible = true;
        
        this.createMesh();
    }
    
    createMesh() {
        // Override in subclasses
        this.mesh = new THREE.Group();
        this.scene.add(this.mesh);
    }
    
    // Main update called every frame
    update(delta, cameraPosition) {
        // Check if should update (distance culling for AI)
        const distToCamera = this.position.distanceTo(cameraPosition);
        
        if (distToCamera > this.config.updateDistance) {
            this.mesh.visible = false;
            return;
        }
        
        // Visibility check
        this.isVisible = distToCamera < this.config.viewDistance;
        this.mesh.visible = this.isVisible;
        
        // Only animate if visible
        if (this.isVisible) {
            this.animationTime += delta * this.config.animationSpeed;
            this.updateState(delta);
            this.updateAnimation(delta);
        }
        
        // Always update position/movement
        this.updateMovement(delta);
        
        // Sync mesh position
        this.mesh.position.copy(this.position);
    }
    
    // State machine - override in subclasses
    updateState(delta) {
        this.stateTimer -= delta;
        
        if (this.stateTimer <= 0) {
            this.chooseNewState();
        }
    }
    
    chooseNewState() {
        // Override in subclasses
        this.state = 'idle';
        this.stateTimer = 2 + Math.random() * 3;
    }
    
    // Animation updates
    updateAnimation(delta) {
        // Override in subclasses
    }
    
    // Movement/physics
    updateMovement(delta) {
        this.position.add(this.velocity.clone().multiplyScalar(delta));
    }
    
    // Look at a target
    lookAt(target) {
        const direction = target.clone().sub(this.position).normalize();
        const angle = Math.atan2(direction.x, direction.z);
        this.mesh.rotation.y = angle;
    }
    
    // Move toward target
    moveToward(target, speed) {
        const direction = target.clone().sub(this.position).normalize();
        this.velocity.copy(direction.multiplyScalar(speed));
    }
    
    // Get random point in range
    getRandomPoint(center, radius) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * radius;
        return new THREE.Vector3(
            center.x + Math.cos(angle) * dist,
            center.y,
            center.z + Math.sin(angle) * dist
        );
    }
    
    dispose() {
        if (this.mesh) {
            this.scene.remove(this.mesh);
            this.mesh.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
        }
    }
}

window.Animal = Animal;
```

- [ ] **Step 2: Commit**

```bash
git add js/fauna.js
git commit -m "feat: add Animal base class with state machine and animation support"
```

---

### Task 6: Marine Animals (js/fauna.js Part 2)

**Goal:** Implement whale, dolphin, and sea turtle classes

**Files:**
- Modify: `js/fauna.js` (append)

- [ ] **Step 1: Create Whale class**

```javascript
// Append to js/fauna.js

class Whale extends Animal {
    constructor(scene, initialPosition) {
        super(scene, initialPosition, {
            speed: 3,
            turnSpeed: 0.3,
            viewDistance: 1500,
            updateDistance: 2500
        });
        
        this.breachTimer = 0;
        this.isBreaching = false;
        this.spoutTimer = 0;
        this.patrolCenter = initialPosition.clone();
        this.patrolRadius = 500 + Math.random() * 500;
    }
    
    createMesh() {
        const group = new THREE.Group();
        
        // Body
        const bodyGeo = new THREE.SphereGeometry(1, 16, 12);
        bodyGeo.scale(6, 2.5, 2.5);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2C3E50 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        group.add(body);
        
        // Head (slightly raised)
        const headGeo = new THREE.SphereGeometry(1, 12, 10);
        headGeo.scale(2.5, 2, 2);
        const head = new THREE.Mesh(headGeo, bodyMat);
        head.position.set(5, 0.5, 0);
        group.add(head);
        
        // Tail flukes
        const tailGeo = new THREE.ConeGeometry(1.5, 1, 3);
        tailGeo.scale(1, 0.2, 1.5);
        const tail = new THREE.Mesh(tailGeo, bodyMat);
        tail.position.set(-5.5, 0, 0);
        tail.rotation.y = Math.PI / 2;
        group.add(tail);
        
        // Dorsal fin
        const finGeo = new THREE.ConeGeometry(0.5, 1.5, 3);
        const fin = new THREE.Mesh(finGeo, bodyMat);
        fin.position.set(-1, 2.2, 0);
        fin.rotation.x = -0.3;
        group.add(fin);
        
        // Spout particles (initially hidden)
        this.spoutParticles = [];
        for (let i = 0; i < 20; i++) {
            const particle = new THREE.Mesh(
                new THREE.SphereGeometry(0.1, 4, 4),
                new THREE.MeshBasicMaterial({ 
                    color: 0xFFFFFF, 
                    transparent: true, 
                    opacity: 0.6 
                })
            );
            particle.visible = false;
            particle.position.set(6, 1.5, 0);
            group.add(particle);
            this.spoutParticles.push({
                mesh: particle,
                velocity: new THREE.Vector3(),
                life: 0
            });
        }
        
        this.mesh = group;
        this.scene.add(this.mesh);
        this.mesh.scale.setScalar(2); // Make it bigger
    }
    
    chooseNewState() {
        const states = ['swim', 'swim', 'swim', 'surface', 'dive'];
        this.state = states[Math.floor(Math.random() * states.length)];
        this.stateTimer = 10 + Math.random() * 20;
        
        if (this.state === 'swim') {
            // Pick new patrol point
            const target = this.getRandomPoint(this.patrolCenter, this.patrolRadius);
            this.targetPosition = target;
        }
    }
    
    updateAnimation(delta) {
        // Tail undulation
        const time = this.animationTime;
        const tail = this.mesh.children[2]; // Tail is 3rd child
        tail.rotation.z = Math.sin(time * 2) * 0.1;
        
        // Update spout particles
        this.spoutParticles.forEach(p => {
            if (p.life > 0) {
                p.life -= delta;
                p.mesh.position.add(p.velocity.clone().multiplyScalar(delta));
                p.velocity.y += 2 * delta; // Gravity-ish
                p.mesh.material.opacity = (p.life / 3) * 0.6;
                
                if (p.life <= 0) {
                    p.mesh.visible = false;
                }
            }
        });
        
        // Trigger spout occasionally
        this.spoutTimer -= delta;
        if (this.spoutTimer <= 0 && this.state === 'surface') {
            this.triggerSpout();
            this.spoutTimer = 15 + Math.random() * 30;
        }
    }
    
    triggerSpout() {
        this.spoutParticles.forEach((p, i) => {
            p.mesh.visible = true;
            p.life = 2 + Math.random() * 2;
            p.mesh.position.set(6, 2.5, (Math.random() - 0.5) * 0.5);
            p.velocity.set(
                (Math.random() - 0.5) * 2,
                3 + Math.random() * 2,
                (Math.random() - 0.5) * 2
            );
        });
    }
    
    updateMovement(delta) {
        if (this.targetPosition) {
            this.moveToward(this.targetPosition, this.config.speed);
            this.lookAt(this.targetPosition);
            
            // Check if reached target
            if (this.position.distanceTo(this.targetPosition) < 10) {
                this.targetPosition = null;
                this.velocity.set(0, 0, 0);
            }
        }
        
        super.updateMovement(delta);
    }
}

window.Whale = Whale;
```

- [ ] **Step 2: Create Dolphin class**

```javascript
// Append to js/fauna.js

class Dolphin extends Animal {
    constructor(scene, initialPosition, podIndex = 0) {
        super(scene, initialPosition, {
            speed: 12,
            turnSpeed: 2,
            viewDistance: 1200,
            updateDistance: 2000
        });
        
        this.podIndex = podIndex;
        this.podCenter = initialPosition.clone();
        this.jumpTimer = 0;
        this.isJumping = false;
        this.jumpVelocity = new THREE.Vector3();
        this.gravity = -20;
    }
    
    createMesh() {
        const group = new THREE.Group();
        
        // Body (torpedo shaped)
        const bodyGeo = new THREE.SphereGeometry(1, 12, 10);
        bodyGeo.scale(2.5, 0.8, 0.8);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x708090 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        group.add(body);
        
        // Beak
        const beakGeo = new THREE.ConeGeometry(0.4, 0.8, 8);
        const beak = new THREE.Mesh(beakGeo, bodyMat);
        beak.rotation.z = -Math.PI / 2;
        beak.position.set(2.8, 0, 0);
        group.add(beak);
        
        // Dorsal fin
        const finGeo = new THREE.ConeGeometry(0.3, 0.8, 3);
        const fin = new THREE.Mesh(finGeo, bodyMat);
        fin.position.set(-0.3, 0.7, 0);
        fin.rotation.x = -0.2;
        group.add(fin);
        
        // Tail flukes
        const tailGeo = new THREE.ConeGeometry(0.4, 0.6, 3);
        tailGeo.scale(1, 0.15, 1.2);
        const tail = new THREE.Mesh(tailGeo, bodyMat);
        tail.position.set(-2.2, 0, 0);
        tail.rotation.y = Math.PI / 2;
        group.add(tail);
        
        this.mesh = group;
        this.scene.add(this.mesh);
    }
    
    chooseNewState() {
        const states = ['swim', 'swim', 'swim', 'porpoise', 'jump'];
        this.state = states[Math.floor(Math.random() * states.length)];
        this.stateTimer = 3 + Math.random() * 8;
        
        if (this.state === 'jump' && !this.isJumping) {
            this.startJump();
        }
        
        // Pick random target in pod area
        const offset = new THREE.Vector3(
            (Math.random() - 0.5) * 100,
            0,
            (Math.random() - 0.5) * 100
        );
        this.targetPosition = this.podCenter.clone().add(offset);
    }
    
    startJump() {
        this.isJumping = true;
        this.jumpVelocity.set(
            (Math.random() - 0.5) * 10,
            8 + Math.random() * 4,
            (Math.random() - 0.5) * 10
        );
    }
    
    updateAnimation(delta) {
        const time = this.animationTime;
        const tail = this.mesh.children[3]; // Tail is 4th child
        
        if (this.isJumping) {
            // Rotate during jump
            this.mesh.rotation.z = Math.sin(time * 5) * 0.5;
        } else {
            // Normal tail flapping
            tail.rotation.z = Math.sin(time * 8) * 0.15;
        }
    }
    
    updateMovement(delta) {
        if (this.isJumping) {
            // Physics-based jump
            this.velocity.copy(this.jumpVelocity);
            this.jumpVelocity.y += this.gravity * delta;
            
            // End jump when back in water
            if (this.position.y < 0 && this.jumpVelocity.y < 0) {
                this.isJumping = false;
                this.position.y = 0;
                this.jumpVelocity.set(0, 0, 0);
                this.mesh.rotation.z = 0;
                this.splash();
            }
        } else if (this.targetPosition) {
            this.moveToward(this.targetPosition, this.config.speed);
            this.lookAt(this.targetPosition);
            this.position.y = Math.max(0, this.position.y); // Stay at/above surface
            
            if (this.position.distanceTo(this.targetPosition) < 5) {
                this.targetPosition = null;
            }
        }
        
        super.updateMovement(delta);
    }
    
    splash() {
        // Could add particle effect here
    }
    
    updatePodCenter(center) {
        this.podCenter.copy(center);
    }
}

window.Dolphin = Dolphin;
```

- [ ] **Step 3: Create SeaTurtle class**

```javascript
// Append to js/fauna.js

class SeaTurtle extends Animal {
    constructor(scene, initialPosition) {
        super(scene, initialPosition, {
            speed: 2,
            turnSpeed: 0.5,
            viewDistance: 600,
            updateDistance: 1000
        });
        
        this.surfaceTimer = 0;
        this.isSurfacing = true;
        this.diveDuration = 0;
    }
    
    createMesh() {
        const group = new THREE.Group();
        
        // Shell
        const shellGeo = new THREE.SphereGeometry(1, 14, 10);
        shellGeo.scale(1, 0.4, 1.1);
        const shellMat = new THREE.MeshStandardMaterial({ color: 0x4A6741 });
        const shell = new THREE.Mesh(shellGeo, shellMat);
        group.add(shell);
        
        // Head
        const headGeo = new THREE.SphereGeometry(0.35, 10, 8);
        headGeo.scale(1.2, 0.8, 0.9);
        const headMat = new THREE.MeshStandardMaterial({ color: 0x6B8E6B });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.set(1.2, -0.1, 0);
        group.add(head);
        
        // Flippers
        const flipperGeo = new THREE.BoxGeometry(0.6, 0.1, 0.4);
        this.flippers = [];
        
        // Front flippers
        const flipperFL = new THREE.Mesh(flipperGeo, headMat);
        flipperFL.position.set(0.6, -0.2, 0.7);
        flipperFL.rotation.y = 0.5;
        group.add(flipperFL);
        this.flippers.push(flipperFL);
        
        const flipperFR = new THREE.Mesh(flipperGeo, headMat);
        flipperFR.position.set(0.6, -0.2, -0.7);
        flipperFR.rotation.y = -0.5;
        group.add(flipperFR);
        this.flippers.push(flipperFR);
        
        // Back flippers
        const flipperBL = new THREE.Mesh(flipperGeo, headMat);
        flipperBL.position.set(-0.7, -0.2, 0.5);
        flipperBL.rotation.y = 2.5;
        group.add(flipperBL);
        this.flippers.push(flipperBL);
        
        const flipperBR = new THREE.Mesh(flipperGeo, headMat);
        flipperBR.position.set(-0.7, -0.2, -0.5);
        flipperBR.rotation.y = -2.5;
        group.add(flipperBR);
        this.flippers.push(flipperBR);
        
        this.mesh = group;
        this.scene.add(this.mesh);
        this.mesh.scale.setScalar(0.8);
    }
    
    chooseNewState() {
        if (this.isSurfacing) {
            // Surface for a bit then dive
            this.state = 'surface';
            this.stateTimer = 10 + Math.random() * 20;
            this.diveDuration = 30 + Math.random() * 60;
        } else {
            // Underwater swimming
            this.state = 'dive';
            this.stateTimer = this.diveDuration;
        }
        
        // Pick random direction
        const angle = Math.random() * Math.PI * 2;
        this.targetDirection = new THREE.Vector3(
            Math.cos(angle),
            this.isSurfacing ? 0 : (Math.random() - 0.5) * 0.3,
            Math.sin(angle)
        ).normalize();
    }
    
    updateState(delta) {
        this.stateTimer -= delta;
        
        // Toggle between surface and dive
        if (this.stateTimer <= 0) {
            this.isSurfacing = !this.isSurfacing;
            this.chooseNewState();
        }
    }
    
    updateAnimation(delta) {
        const time = this.animationTime;
        
        // Flipper paddling
        this.flippers.forEach((flipper, i) => {
            const offset = i < 2 ? 0 : Math.PI;
            const speed = this.isSurfacing ? 2 : 1;
            flipper.rotation.x = Math.sin(time * speed + offset) * 0.3;
        });
        
        // Gentle body roll
        this.mesh.rotation.z = Math.sin(time * 0.5) * 0.05;
    }
    
    updateMovement(delta) {
        if (this.targetDirection) {
            const speed = this.isSurfacing ? this.config.speed : this.config.speed * 0.7;
            this.velocity.copy(this.targetDirection.multiplyScalar(speed));
            
            // Smooth rotation toward direction
            const targetAngle = Math.atan2(this.targetDirection.x, this.targetDirection.z);
            const currentAngle = this.mesh.rotation.y;
            let diff = targetAngle - currentAngle;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            this.mesh.rotation.y += diff * this.config.turnSpeed * delta;
        }
        
        super.updateMovement(delta);
        
        // Keep at surface when surfacing
        if (this.isSurfacing) {
            this.position.y = Math.max(0, this.position.y);
        } else {
            // Dive depth limit
            this.position.y = Math.max(-10, Math.min(0, this.position.y));
        }
    }
}

window.SeaTurtle = SeaTurtle;
```

- [ ] **Step 4: Commit**

```bash
git add js/fauna.js
git commit -m "feat: add marine animals - Whale, Dolphin, SeaTurtle"
```

---

### Task 7: Bird Classes (js/fauna.js Part 3)

**Goal:** Implement albatross, frigatebird, honeycreeper, and nene classes

**Files:**
- Modify: `js/fauna.js` (append)

- [ ] **Step 1: Create Albatross class**

```javascript
// Append to js/fauna.js

class Albatross extends Animal {
    constructor(scene, initialPosition) {
        super(scene, initialPosition, {
            speed: 15,
            turnSpeed: 0.5,
            viewDistance: 2000,
            updateDistance: 3000
        });
        
        this.circleCenter = initialPosition.clone();
        this.circleRadius = 200 + Math.random() * 300;
        this.circleAngle = Math.random() * Math.PI * 2;
        this.glideTimer = 0;
        this.isGliding = true;
    }
    
    createMesh() {
        const group = new THREE.Group();
        
        // Body (small compared to wings)
        const bodyGeo = new THREE.SphereGeometry(0.3, 8, 6);
        bodyGeo.scale(2, 0.8, 0.8);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        group.add(body);
        
        // Wings (very long and narrow)
        const wingGeo = new THREE.BoxGeometry(4, 0.05, 0.6);
        const wingMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
        
        // Left wing
        this.wingL = new THREE.Mesh(wingGeo, wingMat);
        this.wingL.position.set(0.5, 0, 2);
        group.add(this.wingL);
        
        // Right wing
        this.wingR = new THREE.Mesh(wingGeo, wingMat);
        this.wingR.position.set(0.5, 0, -2);
        group.add(this.wingR);
        
        // Wing tips (black)
        const tipGeo = new THREE.BoxGeometry(1, 0.05, 0.4);
        const tipMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
        
        const tipL = new THREE.Mesh(tipGeo, tipMat);
        tipL.position.set(2.5, 0, 0);
        this.wingL.add(tipL);
        
        const tipR = new THREE.Mesh(tipGeo, tipMat);
        tipR.position.set(2.5, 0, 0);
        this.wingR.add(tipR);
        
        this.mesh = group;
        this.scene.add(this.mesh);
    }
    
    chooseNewState() {
        // Albatrosses mostly glide, occasionally flap
        this.isGliding = Math.random() > 0.1;
        this.stateTimer = 5 + Math.random() * 15;
    }
    
    updateAnimation(delta) {
        const time = this.animationTime;
        
        if (this.isGliding) {
            // Gentle wing adjustments for soaring
            const bank = Math.sin(time * 0.5) * 0.2;
            this.wingL.rotation.z = bank;
            this.wingR.rotation.z = -bank;
            
            // Slight dihedral adjustment
            this.wingL.rotation.x = 0.1 + Math.sin(time * 0.3) * 0.05;
            this.wingR.rotation.x = 0.1 + Math.sin(time * 0.3) * 0.05;
        } else {
            // Flapping
            const flap = Math.sin(time * 8) * 0.3;
            this.wingL.rotation.z = flap;
            this.wingR.rotation.z = -flap;
        }
        
        // Bank into turns
        const turnBank = this.turnAmount || 0;
        this.mesh.rotation.z = turnBank * 0.3;
    }
    
    updateMovement(delta) {
        // Circular soaring pattern
        this.circleAngle += delta * 0.1;
        
        const targetX = this.circleCenter.x + Math.cos(this.circleAngle) * this.circleRadius;
        const targetZ = this.circleCenter.z + Math.sin(this.circleAngle) * this.circleRadius;
        const targetPos = new THREE.Vector3(targetX, this.position.y, targetZ);
        
        // Calculate turn amount for banking
        const currentAngle = Math.atan2(
            this.position.x - this.circleCenter.x,
            this.position.z - this.circleCenter.z
        );
        this.turnAmount = this.circleAngle - currentAngle;
        
        this.moveToward(targetPos, this.config.speed);
        this.lookAt(targetPos);
        
        // Dynamic soaring - adjust altitude
        const altitude = 50 + Math.sin(this.circleAngle * 3) * 20;
        this.velocity.y = (altitude - this.position.y) * 0.5;
        
        super.updateMovement(delta);
        
        // Wrap position if too far
        if (this.position.distanceTo(this.circleCenter) > 3000) {
            this.circleCenter.copy(this.position);
        }
    }
}

window.Albatross = Albatross;
```

- [ ] **Step 2: Create remaining bird classes (Frigatebird, Honeycreeper, Nene)**

Due to space, I'll provide the structure - these follow the same pattern:

```javascript
// Append to js/fauna.js

class Frigatebird extends Animal {
    constructor(scene, initialPosition) {
        super(scene, initialPosition, {
            speed: 12,
            turnSpeed: 1,
            viewDistance: 2000,
            updateDistance: 3000
        });
        
        this.coastTarget = initialPosition.clone();
        this.isMale = Math.random() > 0.5;
    }
    
    createMesh() {
        const group = new THREE.Group();
        
        // Black body
        const bodyGeo = new THREE.SphereGeometry(0.4, 10, 8);
        bodyGeo.scale(2, 0.9, 0.9);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1A1A1A });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        group.add(body);
        
        // Long angular wings
        const wingGeo = new THREE.BoxGeometry(3.5, 0.03, 0.5);
        this.wingL = new THREE.Mesh(wingGeo, bodyMat);
        this.wingL.position.set(0.5, 0, 1.8);
        group.add(this.wingL);
        
        this.wingR = new THREE.Mesh(wingGeo, bodyMat);
        this.wingR.position.set(0.5, 0, -1.8);
        group.add(this.wingR);
        
        // Forked tail
        const tailGeo = new THREE.BoxGeometry(1.5, 0.02, 1);
        const tail = new THREE.Mesh(tailGeo, bodyMat);
        tail.position.set(-1.5, 0, 0);
        group.add(tail);
        
        // Red throat pouch (males only)
        if (this.isMale) {
            const pouchGeo = new THREE.SphereGeometry(0.25, 8, 6);
            const pouchMat = new THREE.MeshStandardMaterial({ color: 0xFF1744 });
            const pouch = new THREE.Mesh(pouchGeo, pouchMat);
            pouch.position.set(0.8, -0.3, 0);
            pouch.scale.set(1, 1.3, 1);
            group.add(pouch);
        }
        
        this.mesh = group;
        this.scene.add(this.mesh);
    }
    
    chooseNewState() {
        this.stateTimer = 8 + Math.random() * 15;
        // Pick new coastal position
        const angle = Math.random() * Math.PI * 2;
        const dist = 500 + Math.random() * 1000;
        this.coastTarget.set(
            this.position.x + Math.cos(angle) * dist,
            80 + Math.random() * 100,
            this.position.z + Math.sin(angle) * dist
        );
    }
    
    updateAnimation(delta) {
        const time = this.animationTime;
        // Steady soaring with occasional wing adjustments
        const adjustment = Math.sin(time * 0.8) * 0.1;
        this.wingL.rotation.z = adjustment;
        this.wingR.rotation.z = -adjustment;
    }
    
    updateMovement(delta) {
        if (this.coastTarget) {
            this.moveToward(this.coastTarget, this.config.speed);
            this.lookAt(this.coastTarget);
            
            if (this.position.distanceTo(this.coastTarget) < 50) {
                this.chooseNewState();
            }
        }
        super.updateMovement(delta);
    }
}

window.Frigatebird = Frigatebird;

class Honeycreeper extends Animal {
    constructor(scene, initialPosition, forestCenter) {
        super(scene, initialPosition, {
            speed: 8,
            turnSpeed: 3,
            viewDistance: 300,
            updateDistance: 600
        });
        
        this.forestCenter = forestCenter;
        this.perchTree = null;
        this.perchTimer = 0;
        
        // Random color variety
        const colors = [0xFF1744, 0xFFC107, 0x4CAF50, 0xFF9800];
        this.birdColor = colors[Math.floor(Math.random() * colors.length)];
    }
    
    createMesh() {
        const group = new THREE.Group();
        
        // Small colorful body
        const bodyGeo = new THREE.SphereGeometry(0.08, 6, 5);
        const bodyMat = new THREE.MeshStandardMaterial({ color: this.birdColor });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        group.add(body);
        
        // Short wings
        const wingGeo = new THREE.BoxGeometry(0.15, 0.01, 0.1);
        this.wingL = new THREE.Mesh(wingGeo, bodyMat);
        this.wingL.position.set(0.05, 0, 0.08);
        group.add(this.wingL);
        
        this.wingR = new THREE.Mesh(wingGeo, bodyMat);
        this.wingR.position.set(0.05, 0, -0.08);
        group.add(this.wingR);
        
        // Curved beak
        const beakGeo = new THREE.ConeGeometry(0.02, 0.08, 4);
        const beakMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
        const beak = new THREE.Mesh(beakGeo, beakMat);
        beak.rotation.z = -Math.PI / 2;
        beak.position.set(0.1, 0, 0);
        group.add(beak);
        
        this.mesh = group;
        this.scene.add(this.mesh);
    }
    
    chooseNewState() {
        const states = ['perch', 'hop', 'fly'];
        this.state = states[Math.floor(Math.random() * states.length)];
        
        if (this.state === 'perch') {
            this.stateTimer = 3 + Math.random() * 5;
            this.velocity.set(0, 0, 0);
        } else if (this.state === 'hop') {
            this.stateTimer = 1 + Math.random() * 2;
            // Small hop
            this.velocity.set(
                (Math.random() - 0.5) * 3,
                2,
                (Math.random() - 0.5) * 3
            );
        } else {
            this.stateTimer = 2 + Math.random() * 3;
            // Fly to nearby tree
            const angle = Math.random() * Math.PI * 2;
            const dist = 5 + Math.random() * 10;
            this.targetPosition = new THREE.Vector3(
                this.position.x + Math.cos(angle) * dist,
                this.position.y + (Math.random() - 0.5) * 3,
                this.position.z + Math.sin(angle) * dist
            );
        }
    }
    
    updateAnimation(delta) {
        const time = this.animationTime;
        
        if (this.state === 'fly') {
            // Fast wing flapping
            const flap = Math.sin(time * 20) * 0.5;
            this.wingL.rotation.z = flap;
            this.wingR.rotation.z = -flap;
        } else if (this.state === 'hop') {
            // Quick flaps
            const flap = Math.sin(time * 15) * 0.3;
            this.wingL.rotation.z = flap;
            this.wingR.rotation.z = -flap;
        } else {
            // At rest
            this.wingL.rotation.z = 0;
            this.wingR.rotation.z = 0;
        }
    }
    
    updateMovement(delta) {
        if (this.state === 'fly' && this.targetPosition) {
            this.moveToward(this.targetPosition, this.config.speed);
            this.lookAt(this.targetPosition);
            
            if (this.position.distanceTo(this.targetPosition) < 1) {
                this.targetPosition = null;
                this.state = 'perch';
            }
        } else if (this.state === 'hop') {
            this.velocity.y -= 9.8 * delta; // Gravity
            if (this.position.y < this.forestCenter.y + 8) {
                this.position.y = this.forestCenter.y + 8;
                this.velocity.set(0, 0, 0);
                this.state = 'perch';
            }
        }
        
        super.updateMovement(delta);
    }
}

window.Honeycreeper = Honeycreeper;

class Nene extends Animal {
    constructor(scene, initialPosition) {
        super(scene, initialPosition, {
            speed: 3,
            turnSpeed: 1,
            viewDistance: 800,
            updateDistance: 1200
        });
        
        this.flockCenter = initialPosition.clone();
        this.isFlying = false;
        this.groundY = this.position.y;
    }
    
    createMesh() {
        const group = new THREE.Group();
        
        // Brown body
        const bodyGeo = new THREE.SphereGeometry(0.3, 8, 6);
        bodyGeo.scale(1.8, 1, 1);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x8D6E63 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        group.add(body);
        
        // Long neck
        const neckGeo = new THREE.CylinderGeometry(0.12, 0.15, 0.5, 6);
        const neck = new THREE.Mesh(neckGeo, bodyMat);
        neck.position.set(0.4, 0.4, 0);
        neck.rotation.z = -0.3;
        group.add(neck);
        
        // Head with distinctive pattern
        const headGeo = new THREE.SphereGeometry(0.15, 8, 6);
        const headMat = new THREE.MeshStandardMaterial({ color: 0x5D4037 });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.set(0.55, 0.7, 0);
        group.add(head);
        
        // Beak
        const beakGeo = new THREE.ConeGeometry(0.05, 0.15, 4);
        const beakMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
        const beak = new THREE.Mesh(beakGeo, beakMat);
        beak.rotation.z = -Math.PI / 2;
        beak.position.set(0.7, 0.7, 0);
        group.add(beak);
        
        // Wings
        const wingGeo = new THREE.BoxGeometry(0.8, 0.05, 0.4);
        this.wingL = new THREE.Mesh(wingGeo, bodyMat);
        this.wingL.position.set(0, 0.2, 0.4);
        group.add(this.wingL);
        
        this.wingR = new THREE.Mesh(wingGeo, bodyMat);
        this.wingR.position.set(0, 0.2, -0.4);
        group.add(this.wingR);
        
        this.mesh = group;
        this.scene.add(this.mesh);
    }
    
    chooseNewState() {
        const states = ['graze', 'graze', 'walk', 'walk', 'fly'];
        this.state = states[Math.floor(Math.random() * states.length)];
        this.stateTimer = 5 + Math.random() * 10;
        
        if (this.state === 'walk') {
            // Pick nearby grazing spot
            const angle = Math.random() * Math.PI * 2;
            const dist = 10 + Math.random() * 20;
            this.targetPosition = new THREE.Vector3(
                this.position.x + Math.cos(angle) * dist,
                this.groundY,
                this.position.z + Math.sin(angle) * dist
            );
        } else if (this.state === 'fly') {
            this.isFlying = true;
            this.velocity.y = 5;
            // Fly to new area
            const angle = Math.random() * Math.PI * 2;
            const dist = 100 + Math.random() * 200;
            this.targetPosition = new THREE.Vector3(
                this.flockCenter.x + Math.cos(angle) * dist,
                this.groundY + 30 + Math.random() * 20,
                this.flockCenter.z + Math.sin(angle) * dist
            );
        } else {
            this.isFlying = false;
            this.velocity.set(0, 0, 0);
        }
    }
    
    updateAnimation(delta) {
        const time = this.animationTime;
        
        if (this.isFlying) {
            // Wing flapping
            const flap = Math.sin(time * 10) * 0.4;
            this.wingL.rotation.z = flap;
            this.wingR.rotation.z = -flap;
            
            // Head forward while flying
            this.mesh.rotation.x = 0.2;
        } else {
            // Walking - head bob
            if (this.state === 'walk') {
                const bob = Math.abs(Math.sin(time * 8)) * 0.1;
                this.mesh.children[2].position.y = 0.7 + bob; // Head
            } else {
                // Grazing - head down
                this.mesh.children[2].position.y = 0.5;
                this.mesh.children[2].rotation.z = -0.8;
            }
            
            this.wingL.rotation.z = 0;
            this.wingR.rotation.z = 0;
            this.mesh.rotation.x = 0;
        }
    }
    
    updateMovement(delta) {
        if (this.isFlying) {
            if (this.targetPosition) {
                this.moveToward(this.targetPosition, this.config.speed * 2);
                this.lookAt(this.targetPosition);
                
                // Landing
                if (this.position.distanceTo(this.targetPosition) < 10) {
                    this.isFlying = false;
                    this.position.y = this.groundY;
                    this.state = 'graze';
                }
            }
        } else if (this.state === 'walk' && this.targetPosition) {
            this.moveToward(this.targetPosition, this.config.speed);
            this.lookAt(this.targetPosition);
            
            if (this.position.distanceTo(this.targetPosition) < 2) {
                this.targetPosition = null;
                this.state = 'graze';
            }
        }
        
        super.updateMovement(delta);
    }
}

window.Nene = Nene;
```

- [ ] **Step 3: Commit**

```bash
git add js/fauna.js
git commit -m "feat: add bird classes - Albatross, Frigatebird, Honeycreeper, Nene"
```

---

### Task 8: Fauna Manager (js/fauna.js Part 4)

**Goal:** Create FaunaManager to orchestrate all animals with spawning and pooling

**Files:**
- Modify: `js/fauna.js` (append)

- [ ] **Step 1: Create FaunaManager class**

```javascript
// Append to js/fauna.js

class FaunaManager {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.animals = [];
        
        // Object pools
        this.whalePool = [];
        this.dolphinPool = [];
        this.turtlePool = [];
        this.albatrossPool = [];
        this.frigatebirdPool = [];
        this.honeycreeperPool = [];
        this.nenePool = [];
        
        // Spawn configuration
        this.spawnConfig = {
            whale: { count: 4, radius: 5000 },
            dolphin: { count: 15, radius: 3000 },
            turtle: { count: 10, radius: 2000 },
            albatross: { count: 8, radius: 6000 },
            frigatebird: { count: 12, radius: 4000 },
            honeycreeper: { count: 20, radius: 1500 },
            nene: { count: 12, radius: 2000 }
        };
    }
    
    // Initialize all animals
    init() {
        // Spawn whales in open ocean
        for (let i = 0; i < this.spawnConfig.whale.count; i++) {
            const pos = this.getOceanPosition(this.spawnConfig.whale.radius);
            const whale = new Whale(this.scene, pos);
            this.animals.push(whale);
            this.whalePool.push(whale);
        }
        
        // Spawn dolphins in pods
        const podCenters = [];
        for (let i = 0; i < 3; i++) {
            podCenters.push(this.getCoastalPosition(2000));
        }
        
        for (let i = 0; i < this.spawnConfig.dolphin.count; i++) {
            const podIndex = i % 3;
            const offset = new THREE.Vector3(
                (Math.random() - 0.5) * 100,
                0,
                (Math.random() - 0.5) * 100
            );
            const pos = podCenters[podIndex].clone().add(offset);
            const dolphin = new Dolphin(this.scene, pos, podIndex);
            this.animals.push(dolphin);
            this.dolphinPool.push(dolphin);
        }
        
        // Spawn turtles
        for (let i = 0; i < this.spawnConfig.turtle.count; i++) {
            const pos = this.getCoastalPosition(this.spawnConfig.turtle.radius);
            const turtle = new SeaTurtle(this.scene, pos);
            this.animals.push(turtle);
            this.turtlePool.push(turtle);
        }
        
        // Spawn albatrosses over ocean
        for (let i = 0; i < this.spawnConfig.albatross.count; i++) {
            const pos = this.getOceanPosition(this.spawnConfig.albatross.radius);
            pos.y = 100 + Math.random() * 100;
            const albatross = new Albatross(this.scene, pos);
            this.animals.push(albatross);
            this.albatrossPool.push(albatross);
        }
        
        // Spawn frigatebirds near coasts
        for (let i = 0; i < this.spawnConfig.frigatebird.count; i++) {
            const pos = this.getCoastalPosition(this.spawnConfig.frigatebird.radius);
            pos.y = 80 + Math.random() * 80;
            const frigatebird = new Frigatebird(this.scene, pos);
            this.animals.push(frigatebird);
            this.frigatebirdPool.push(frigatebird);
        }
        
        // Spawn honeycreepers in forest areas (near Maui)
        const forestCenters = [
            new THREE.Vector3(0, 50, 0), // Maui forest
            new THREE.Vector3(-6400, 50, -2800), // Oahu
            new THREE.Vector3(3200, 50, -6400) // Big Island
        ];
        
        for (let i = 0; i < this.spawnConfig.honeycreeper.count; i++) {
            const center = forestCenters[Math.floor(Math.random() * forestCenters.length)];
            const offset = new THREE.Vector3(
                (Math.random() - 0.5) * 500,
                (Math.random() - 0.5) * 50,
                (Math.random() - 0.5) * 500
            );
            const pos = center.clone().add(offset);
            const bird = new Honeycreeper(this.scene, pos, center);
            this.animals.push(bird);
            this.honeycreeperPool.push(bird);
        }
        
        // Spawn nene in grassland areas
        for (let i = 0; i < this.spawnConfig.nene.count; i++) {
            const pos = this.getGrasslandPosition(this.spawnConfig.nene.radius);
            const nene = new Nene(this.scene, pos);
            this.animals.push(nene);
            this.nenePool.push(nene);
        }
        
        console.log(`FaunaManager: Spawned ${this.animals.length} animals`);
    }
    
    getOceanPosition(radius) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 2000 + Math.random() * radius;
        return new THREE.Vector3(
            Math.cos(angle) * dist,
            0,
            Math.sin(angle) * dist
        );
    }
    
    getCoastalPosition(radius) {
        // Near islands but not on them
        const islandPos = islandPositions[Math.floor(Math.random() * islandPositions.length)];
        const angle = Math.random() * Math.PI * 2;
        const dist = 500 + Math.random() * radius;
        return new THREE.Vector3(
            islandPos.x + Math.cos(angle) * dist,
            0,
            islandPos.z + Math.sin(angle) * dist
        );
    }
    
    getGrasslandPosition(radius) {
        // On islands in lower elevations
        const islandPos = islandPositions[Math.floor(Math.random() * islandPositions.length)];
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * radius;
        return new THREE.Vector3(
            islandPos.x + Math.cos(angle) * dist,
            10,
            islandPos.z + Math.sin(angle) * dist
        );
    }
    
    // Update all animals
    update(delta) {
        const camPos = this.camera.position;
        
        // Update dolphins pod centers (follow lead dolphin)
        const leadDolphins = this.dolphinPool.filter((_, i) => i < 3);
        this.dolphinPool.forEach((dolphin, i) => {
            const podIndex = i % 3;
            dolphin.updatePodCenter(leadDolphins[podIndex].position);
        });
        
        // Update all animals
        this.animals.forEach(animal => {
            animal.update(delta, camPos);
        });
        
        // Respawn animals that go too far
        this.checkRespawns();
    }
    
    checkRespawns() {
        const maxDist = 8000;
        
        this.animals.forEach(animal => {
            if (animal.position.distanceTo(new THREE.Vector3(0, 0, 0)) > maxDist) {
                // Respawn near aircraft or at origin
                const aircraft = window.aircraft;
                if (aircraft) {
                    const pos = aircraft.getPosition();
                    const angle = Math.random() * Math.PI * 2;
                    const dist = 2000 + Math.random() * 2000;
                    animal.position.set(
                        pos.x + Math.cos(angle) * dist,
                        animal instanceof Whale || animal instanceof SeaTurtle ? 0 : 100 + Math.random() * 100,
                        pos.z + Math.sin(angle) * dist
                    );
                }
            }
        });
    }
    
    dispose() {
        this.animals.forEach(animal => animal.dispose());
        this.animals = [];
    }
}

window.FaunaManager = FaunaManager;
```

- [ ] **Step 2: Commit**

```bash
git add js/fauna.js
git commit -m "feat: add FaunaManager with spawning and respawn system"
```

---

### Task 9: Integrate Fauna System

**Goal:** Replace old wildlife system with new fauna manager

**Files:**
- Modify: `index.html`
- Modify: `js/wildlife.js` (or delete)

- [ ] **Step 1: Update index.html to use FaunaManager**

```javascript
// In index.html, replace wildlife initialization:

// OLD:
// const wildlife = new Wildlife(scene);

// NEW:
const faunaManager = new FaunaManager(scene, camera);
faunaManager.init();
window.faunaManager = faunaManager;
```

- [ ] **Step 2: Update animate loop**

```javascript
// In index.html animate() function, replace:

// OLD:
// if (wildlife) {
//     wildlife.update(delta);
// }

// NEW:
if (window.faunaManager) {
    window.faunaManager.update(delta);
}
```

- [ ] **Step 3: Add script to index.html**

Ensure fauna.js is loaded (should already be done in Task 1):

```html
<script src="js/fauna.js"></script>
```

- [ ] **Step 4: Test fauna system**

Refresh browser and verify:
- Console shows "FaunaManager: Spawned X animals"
- Animals are visible (whales, dolphins, birds)
- Animals animate and move
- Check for errors in console

- [ ] **Step 5: Remove or archive old wildlife.js**

```bash
# Option 1: Delete
rm js/wildlife.js

# Option 2: Archive
mv js/wildlife.js js/wildlife.js.bak
```

- [ ] **Step 6: Commit**

```bash
git add index.html js/wildlife.js  # or rm js/wildlife.js first
git commit -m "feat: integrate FaunaManager, replace old wildlife system"
```

---

## Phase 4: Performance Optimization

### Task 10: Add Performance Monitoring

**Goal:** Add FPS counter and performance metrics

**Files:**
- Modify: `index.html`
- Modify: `js/performance.js`

- [ ] **Step 1: Add Stats.js or custom FPS counter**

Add to index.html head:

```html
<!-- Add Stats.js for performance monitoring -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/stats.js/r17/Stats.min.js"></script>
```

Or create simple FPS counter in performance.js:

```javascript
// Append to js/performance.js

class PerformanceMonitor {
    constructor() {
        this.frameCount = 0;
        this.lastTime = performance.now();
        this.fps = 60;
        this.visibleTrees = 0;
        this.visibleAnimals = 0;
        
        this.createDisplay();
    }
    
    createDisplay() {
        this.element = document.createElement('div');
        this.element.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            background: rgba(0,0,0,0.7);
            color: #0f0;
            font-family: monospace;
            font-size: 12px;
            padding: 10px;
            border-radius: 5px;
            z-index: 1000;
        `;
        document.body.appendChild(this.element);
    }
    
    update() {
        this.frameCount++;
        const now = performance.now();
        
        if (now - this.lastTime >= 1000) {
            this.fps = Math.round((this.frameCount * 1000) / (now - this.lastTime));
            this.frameCount = 0;
            this.lastTime = now;
            
            // Count visible objects
            this.visibleTrees = window.floraManager ? 
                window.floraManager.allTrees.filter(t => t.mesh.visible).length : 0;
            this.visibleAnimals = window.faunaManager ? 
                window.faunaManager.animals.filter(a => a.isVisible).length : 0;
            
            this.render();
        }
    }
    
    render() {
        this.element.innerHTML = `
            FPS: ${this.fps}<br>
            Trees: ${this.visibleTrees}<br>
            Animals: ${this.visibleAnimals}
        `;
    }
}

window.PerformanceMonitor = PerformanceMonitor;
```

- [ ] **Step 2: Initialize monitor in index.html**

```javascript
// In index.html after scene setup:
const perfMonitor = new PerformanceMonitor();

// In animate():
function animate() {
    // ... existing updates ...
    perfMonitor.update();
    renderer.render(scene, camera);
}
```

- [ ] **Step 3: Test performance**

Refresh browser and verify:
- FPS counter visible in top-left
- Tree count updates as you fly around
- Animal count shows active animals

- [ ] **Step 4: Commit**

```bash
git add js/performance.js index.html
git commit -m "feat: add performance monitoring with FPS counter"
```

---

## Testing & Validation

### Task 11: End-to-End Testing

**Goal:** Verify all features work together

- [ ] **Step 1: Functional test checklist**

Test each feature:
- [ ] 5 tree types visible (palm, koa, ohia, shrub, grass)
- [ ] LOD switching works (trees get simpler when far)
- [ ] Frustum culling working (trees behind camera not rendered)
- [ ] Distance culling working (trees >1000 units not rendered)
- [ ] Whale breaching animation visible
- [ ] Dolphins jumping out of water
- [ ] Sea turtles surface and dive
- [ ] Albatross soaring in circles
- [ ] Frigatebirds near cliffs
- [ ] Honeycreepers in forest canopy
- [ ] Nene walking/flying in grasslands
- [ ] FPS stays above 45-50 during flight

- [ ] **Step 2: Performance stress test**

Fly aircraft around islands for 5 minutes:
- Monitor FPS in Performance Monitor
- Note any drops below 30 FPS
- Check memory usage in browser dev tools

- [ ] **Step 3: Edge case testing**

- [ ] Fly to edge of world (8000+ units) - animals respawn correctly
- [ ] Rapid camera movement - LOD updates smoothly
- [ ] Low altitude flight - animals don't clip through terrain
- [ ] Multiple islands visible - all flora renders correctly

- [ ] **Step 4: Final commit**

```bash
git add .
git commit -m "feat: complete biome flora and fauna system with LOD and performance optimization

- 5 tree types: Palm, Koa, Ohia, Shrub, Grass
- 8 animal species: Whale, Dolphin, Turtle, Albatross, Frigatebird, Honeycreeper, Nene
- LOD system with 3 levels (high/med/far) at 300m/800m transitions
- Frustum and distance culling for performance
- FaunaManager with spawning and respawn system
- Performance monitoring with FPS counter"
```

---

## Summary

This implementation adds:
- **5 tree types** with 3 LOD levels each
- **8 animal species** with unique behaviors and animations
- **Performance optimizations**: frustum culling, distance culling, LOD switching, object pooling
- **Performance monitoring**: FPS counter, visible object counts

**Key files created/modified:**
- `js/flora.js` - Tree generation and LOD management
- `js/fauna.js` - Animal classes and FaunaManager
- `js/performance.js` - Culling utilities and performance monitoring
- `js/islands.js` - Integrated flora placement
- `index.html` - Updated animation loop and initialization

**Expected performance:**
- 60 FPS on mid-range hardware
- <500 visible trees, <20 active animals
- Smooth LOD transitions
- No memory leaks with object pooling
