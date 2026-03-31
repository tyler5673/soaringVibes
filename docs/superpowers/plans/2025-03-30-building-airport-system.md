# Building and Airport System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add airports to each Hawaiian island using red dot markers from airport map images, and create a building system similar to the vegetation system with procedural building placement.

**Architecture:** 
- Phase 1: Parse airport maps, update islandPositions with airports array, modify createAirport() to accept position/size
- Phase 2: Create building-manager.js similar to flora-manager.js, with building geometry classes for residential/commercial/industrial types

**Tech Stack:** Three.js (browser), existing SpatialLookup, PerformanceManager classes

---

## File Structure

```
js/
├── islands.js              # Modify: parse airport maps, add airports to islandPositions
├── airport.js              # Modify: accept position/size parameters
├── building-manager.js     # Create: main manager (like flora-manager.js)
├── buildings/
│   ├── residential.js      # Create: house geometry classes
│   ├── commercial.js      # Create: commercial building classes
│   └── industrial.js       # Create: industrial building classes
```

---

## Phase 1: Airport System

### Task 1: Airport Map Parsing Utility

**Files:**
- Create: `js/airport-map-parser.js`
- Modify: `js/islands.js:624-633` (islandPositions definition)

- [ ] **Step 1: Create airport-map-parser.js with parseAirportMap function**

```javascript
// js/airport-map-parser.js
async function parseAirportMap(islandName) {
    const loader = new THREE.TextureLoader();
    
    const texture = await new Promise((resolve, reject) => {
        loader.load(
            `assets/maps/${islandName}-airport.png`,
            resolve,
            undefined,
            reject
        );
    });
    
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(texture.image, 0, 0);
    
    const imageData = ctx.getImageData(0, 0, 1024, 1024);
    const airports = [];
    
    // Scan for red pixels (R > 200, G < 100, B < 100)
    const redPixels = [];
    for (let y = 0; y < 1024; y++) {
        for (let x = 0; x < 1024; x++) {
            const idx = (y * 1024 + x) * 4;
            const r = imageData.data[idx];
            const g = imageData.data[idx + 1];
            const b = imageData.data[idx + 2];
            
            if (r > 200 && g < 100 && b < 100) {
                redPixels.push({ x, y });
            }
        }
    }
    
    // Cluster nearby red pixels into airports
    const clusters = [];
    const threshold = 50;
    
    for (const pixel of redPixels) {
        let foundCluster = false;
        for (const cluster of clusters) {
            const dist = Math.sqrt(
                Math.pow(pixel.x - cluster.x, 2) + 
                Math.pow(pixel.y - cluster.y, 2)
            );
            if (dist < threshold) {
                cluster.pixels.push(pixel);
                cluster.x = cluster.pixels.reduce((s, p) => s + p.x, 0) / cluster.pixels.length;
                cluster.y = cluster.pixels.reduce((s, p) => s + p.y, 0) / cluster.pixels.length;
                foundCluster = true;
                break;
            }
        }
        
        if (!foundCluster) {
            clusters.push({ x: pixel.x, y: pixel.y, pixels: [pixel] });
        }
    }
    
    return clusters.map(c => ({ x: c.x, y: c.y }));
}

window.parseAirportMap = parseAirportMap;
```

- [ ] **Step 2: Test parsing one map in browser console**

Run in browser: `parseAirportMap('maui').then(console.log)`
Expected: Array of {x, y} objects for airport positions

- [ ] **Step 3: Commit**

```bash
git add js/airport-map-parser.js
git commit -m "feat: add airport map parsing utility"
```

---

### Task 2: Update islandPositions with Airports

**Files:**
- Modify: `js/islands.js:624-633`

- [ ] **Step 1: Create async function to load airports for all islands**

Add at top of islandPositions definition or before createAllIslands:

```javascript
async function loadAirportPositions() {
    const airportMap = {};
    
    for (const island of islandPositions) {
        try {
            const airports = await parseAirportMap(island.name);
            airportMap[island.name] = airports;
        } catch (e) {
            console.warn(`No airport map for ${island.name}:`, e);
            airportMap[island.name] = [];
        }
    }
    
    return airportMap;
}
```

- [ ] **Step 2: Update islandPositions to include airports array**

```javascript
const islandPositions = [
    { name: 'maui', x: 0, z: 0, hasAirport: true, airports: [], worldScale: 0.08, bounds: {...} },
    { name: 'big-island', x: 3200, z: -6400, hasAirport: false, airports: [], worldScale: 0.08, bounds: {...} },
    // ... etc
];
```

- [ ] **Step 3: Modify createAllIslands to load and assign airports**

```javascript
async function createAllIslands(scene, onProgress) {
    const airportPositions = await loadAirportPositions();
    
    // Assign airports to islandPositions
    for (const island of islandPositions) {
        island.airports = airportPositions[island.name] || [];
    }
    
    // ... rest of existing code
}
```

- [ ] **Step 4: Test - verify airports loaded for each island**

Run in browser, check: `islandPositions.map(i => ({name: i.name, airports: i.airports}))`

- [ ] **Step 5: Commit**

```bash
git add js/islands.js
git commit -m "feat: load airport positions from map images"
```

---

### Task 3: Modify createAirport for Position/Size Parameters

**Files:**
- Modify: `js/airport.js:1-107`

- [ ] **Step 1: Update createAirport function signature**

```javascript
function createAirport(scene, worldX, worldZ, options = {}) {
    const {
        isLarge = true,
        rotation = Math.PI / 2,
        parentGroup = null
    } = options;
    
    const runwayLength = isLarge ? 600 : 400;
    const runwayWidth = isLarge ? 30 : 20;
    // ... rest of function uses these values
}
```

- [ ] **Step 2: Update position assignment (line ~100)**

```javascript
// Replace hardcoded position with worldX, worldZ
group.position.set(worldX, localY, worldZ + 1500);
```

- [ ] **Step 3: Test - call createAirport with different positions**

In browser: `createAirport(scene, 100, -100, { isLarge: true })`

- [ ] **Step 4: Commit**

```bash
git add js/airport.js
git commit -m "feat: make createAirport accept position and size params"
```

---

### Task 4: Create Airports for All Islands

**Files:**
- Modify: `js/islands.js` (in createAllIslands function after flora placement)

- [ ] **Step 1: Add airport creation loop after flora placement**

```javascript
// After floraManager placement, create airports
for (const { island: islandGroup, info } of results) {
    for (const airport of info.airports) {
        // Convert pixel position to world coordinates
        const meta = islandMetadataCache[info.name];
        if (!meta) continue;
        
        const terrainWidth = meta.worldWidth * info.worldScale;
        const terrainHeight = meta.worldHeight * info.worldScale;
        
        const u = airport.x / 1023;
        const v = airport.y / 1023;
        
        const localX = (u - 0.5) * terrainWidth;
        const localZ = (v - 0.5) * terrainHeight;
        
        const worldX = info.x + localX;
        const worldZ = info.z + localZ;
        
        // Determine size based on island
        const isLarge = ['maui', 'oahu', 'kauai', 'big-island'].includes(info.name);
        
        // Call createAirport with (scene, x, z, parentGroup) - isLarge handled by position
        createAirport(scene, worldX, worldZ, islandGroup);
    }
}
```

Note: For different runway sizes based on island, modify airport.js to accept `isLarge` option or adjust in createAirport function.

- [ ] **Step 2: Verify airports appear on islands**

Run game, check each island has airport at correct location

- [ ] **Step 3: Commit**

```bash
git add js/islands.js
git commit -m "feat: create airports on all islands from map data"
```

---

## Phase 2: Building System

### Task 5: Create Building Geometry Classes - Residential

**Files:**
- Create: `js/buildings/residential.js`

- [ ] **Step 1: Create SmallHouseGeometry class**

```javascript
// js/buildings/residential.js
class SmallHouseGeometry {
    static getGeometry(lod = 'high') {
        const group = new THREE.Group();
        
        // Base
        const baseGeo = new THREE.BoxGeometry(8, 4, 6);
        const baseMat = new THREE.MeshStandardMaterial({ color: 0xF5F5DC }); // beige
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.y = 2;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);
        
        // Roof (only for high LOD)
        if (lod === 'high') {
            const roofGeo = new THREE.ConeGeometry(6, 3, 4);
            const roofMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 }); // brown
            const roof = new THREE.Mesh(roofGeo, roofMat);
            roof.position.y = 5.5;
            roof.rotation.y = Math.PI / 4;
            roof.castShadow = true;
            group.add(roof);
        }
        
        return group;
    }
}

class MediumHomeGeometry {
    static getGeometry(lod = 'high') {
        const group = new THREE.Group();
        
        // Main building
        const mainGeo = new THREE.BoxGeometry(12, 6, 8);
        const mainMat = new THREE.MeshStandardMaterial({ color: 0xFFFAF0 }); // floral white
        const main = new THREE.Mesh(mainGeo, mainMat);
        main.position.y = 3;
        main.castShadow = true;
        main.receiveShadow = true;
        group.add(main);
        
        // Garage
        const garageGeo = new THREE.BoxGeometry(5, 3, 6);
        const garage = new THREE.Mesh(garageGeo, mainMat);
        garage.position.set(5, 1.5, 0);
        garage.castShadow = true;
        group.add(garage);
        
        if (lod === 'high') {
            // Roof
            const roofGeo = new THREE.BoxGeometry(14, 1, 10);
            const roofMat = new THREE.MeshStandardMaterial({ color: 0x696969 }); // dim gray
            const roof = new THREE.Mesh(roofGeo, roofMat);
            roof.position.y = 6.5;
            roof.castShadow = true;
            group.add(roof);
        }
        
        return group;
    }
}

class LargeEstateGeometry {
    static getGeometry(lod = 'high') {
        const group = new THREE.Group();
        
        // Main building - two story
        const mainGeo = new THREE.BoxGeometry(18, 8, 12);
        const mainMat = new THREE.MeshStandardMaterial({ color: 0xFFFFF0 }); // ivory
        const main = new THREE.Mesh(mainGeo, mainMat);
        main.position.y = 4;
        main.castShadow = true;
        main.receiveShadow = true;
        group.add(main);
        
        if (lod === 'high') {
            // Pool (simple plane)
            const poolGeo = new THREE.PlaneGeometry(8, 5);
            const poolMat = new THREE.MeshStandardMaterial({ color: 0x4169E1, transparent: true, opacity: 0.8 });
            const pool = new THREE.Mesh(poolGeo, poolMat);
            pool.rotation.x = -Math.PI / 2;
            pool.position.set(-8, 0.1, 8);
            group.add(pool);
            
            // Windows
            const windowGeo = new THREE.PlaneGeometry(2, 2);
            const windowMat = new THREE.MeshBasicMaterial({ color: 0x87CEEB });
            for (let i = 0; i < 4; i++) {
                const windowMesh = new THREE.Mesh(windowGeo, windowMat);
                windowMesh.position.set(-5 + i * 4, 5, 6.1);
                group.add(windowMesh);
            }
        }
        
        return group;
    }
}

window.SmallHouseGeometry = SmallHouseGeometry;
window.MediumHomeGeometry = MediumHomeGeometry;
window.LargeEstateGeometry = LargeEstateGeometry;
```

- [ ] **Step 2: Create directory and file, test geometry creation**

In browser: `new SmallHouseGeometry().getGeometry('high')` should return THREE.Group

- [ ] **Step 3: Commit**

```bash
git add js/buildings/residential.js
git commit -m "feat: add residential building geometry classes"
```

---

### Task 6: Create Building Geometry Classes - Commercial

**Files:**
- Create: `js/buildings/commercial.js`

- [ ] **Step 1: Create ShopGeometry class**

```javascript
// js/buildings/commercial.js
class ShopGeometry {
    static getGeometry(lod = 'high') {
        const group = new THREE.Group();
        
        // Building
        const buildingGeo = new THREE.BoxGeometry(15, 5, 10);
        const buildingMat = new THREE.MeshStandardMaterial({ color: 0xDEB887 }); // burlywood
        const building = new THREE.Mesh(buildingGeo, buildingMat);
        building.position.y = 2.5;
        building.castShadow = true;
        building.receiveShadow = true;
        group.add(building);
        
        // Flat roof
        const roofGeo = new THREE.BoxGeometry(16, 0.5, 11);
        const roofMat = new THREE.MeshStandardMaterial({ color: 0x2F4F4F });
        const roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.y = 5.25;
        roof.castShadow = true;
        group.add(roof);
        
        if (lod === 'high') {
            // Awning
            const awningGeo = new THREE.BoxGeometry(8, 0.3, 2);
            const awningMat = new THREE.MeshStandardMaterial({ color: 0xDC143C }); // crimson
            const awning = new THREE.Mesh(awningGeo, awningMat);
            awning.position.set(0, 3, 6);
            awning.castShadow = true;
            group.add(awning);
            
            // Sign
            const signGeo = new THREE.BoxGeometry(6, 1.5, 0.3);
            const sign = new THREE.Mesh(signGeo, new THREE.MeshStandardMaterial({ color: 0xFFD700 }));
            sign.position.set(0, 4.5, 5.2);
            group.add(sign);
        }
        
        return group;
    }
}

class HotelGeometry {
    static getGeometry(lod = 'high') {
        const group = new THREE.Group();
        
        // Main building - 3-4 stories
        const floors = lod === 'high' ? 4 : 3;
        const buildingGeo = new THREE.BoxGeometry(30, floors * 4, 20);
        const buildingMat = new THREE.MeshStandardMaterial({ color: 0xF0F8FF }); // alice blue
        const building = new THREE.Mesh(buildingGeo, buildingMat);
        building.position.y = floors * 2;
        building.castShadow = true;
        building.receiveShadow = true;
        group.add(building);
        
        if (lod === 'high') {
            // Windows grid
            const windowGeo = new THREE.PlaneGeometry(2, 2.5);
            const windowMat = new THREE.MeshBasicMaterial({ color: 0x87CEEB });
            
            for (let floor = 0; floor < floors; floor++) {
                for (let col = 0; col < 6; col++) {
                    const windowMesh = new THREE.Mesh(windowGeo, windowMat);
                    windowMesh.position.set(-12 + col * 5, 2 + floor * 4, 10.1);
                    group.add(windowMesh);
                }
            }
        }
        
        return group;
    }
}

class RestaurantGeometry {
    static getGeometry(lod = 'high') {
        const group = new THREE.Group();
        
        // Main dining area
        const diningGeo = new THREE.BoxGeometry(20, 4, 15);
        const diningMat = new THREE.MeshStandardMaterial({ color: 0xFFE4C4 }); // bisque
        const dining = new THREE.Mesh(diningGeo, diningMat);
        dining.position.y = 2;
        dining.castShadow = true;
        dining.receiveShadow = true;
        group.add(dining);
        
        // Roof
        const roofGeo = new THREE.BoxGeometry(22, 0.5, 17);
        const roofMat = new THREE.MeshStandardMaterial({ color: 0x556B2F }); // dark olive green
        const roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.y = 4.25;
        roof.castShadow = true;
        group.add(roof);
        
        if (lod === 'high') {
            // Patio area (simple platform)
            const patioGeo = new THREE.BoxGeometry(10, 0.2, 8);
            const patioMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
            const patio = new THREE.Mesh(patioGeo, patioMat);
            patio.position.set(12, 0.1, 0);
            group.add(patio);
        }
        
        return group;
    }
}

window.ShopGeometry = ShopGeometry;
window.HotelGeometry = HotelGeometry;
window.RestaurantGeometry = RestaurantGeometry;
```

- [ ] **Step 2: Test geometry creation**

- [ ] **Step 3: Commit**

```bash
git add js/buildings/commercial.js
git commit -m "feat: add commercial building geometry classes"
```

---

### Task 7: Create Building Geometry Classes - Industrial

**Files:**
- Create: `js/buildings/industrial.js`

- [ ] **Step 1: Create WarehouseGeometry and FactoryGeometry**

```javascript
// js/buildings/industrial.js
class WarehouseGeometry {
    static getGeometry(lod = 'high') {
        const group = new THREE.Group();
        
        // Main warehouse body
        const buildingGeo = new THREE.BoxGeometry(40, 8, 25);
        const buildingMat = new THREE.MeshStandardMaterial({ color: 0x708090 }); // slate gray
        const building = new THREE.Mesh(buildingGeo, buildingMat);
        building.position.y = 4;
        building.castShadow = true;
        building.receiveShadow = true;
        group.add(building);
        
        // Flat roof with slight slope
        const roofGeo = new THREE.BoxGeometry(42, 1, 27);
        const roofMat = new THREE.MeshStandardMaterial({ color: 0x2F4F4F });
        const roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.y = 8.5;
        roof.castShadow = true;
        group.add(roof);
        
        if (lod === 'high') {
            // Large roll-up doors
            const doorGeo = new THREE.PlaneGeometry(6, 5);
            const doorMat = new THREE.MeshStandardMaterial({ color: 0x696969 });
            for (let i = 0; i < 2; i++) {
                const door = new THREE.Mesh(doorGeo, doorMat);
                door.position.set(-10 + i * 20, 2.5, 12.6);
                group.add(door);
            }
        }
        
        return group;
    }
}

class FactoryGeometry {
    static getGeometry(lod = 'high') {
        const group = new THREE.Group();
        
        // Multiple connected units
        const unit1Geo = new THREE.BoxGeometry(20, 10, 20);
        const unit2Geo = new THREE.BoxGeometry(15, 8, 25);
        
        const buildingMat = new THREE.MeshStandardMaterial({ color: 0xA9A9A9 }); // dark gray
        
        const unit1 = new THREE.Mesh(unit1Geo, buildingMat);
        unit1.position.set(-5, 5, 0);
        unit1.castShadow = true;
        unit1.receiveShadow = true;
        group.add(unit1);
        
        const unit2 = new THREE.Mesh(unit2Geo, buildingMat);
        unit2.position.set(12, 4, 2);
        unit2.castShadow = true;
        unit2.receiveShadow = true;
        group.add(unit2);
        
        if (lod === 'high') {
            // Smokestack
            const stackGeo = new THREE.CylinderGeometry(1.5, 2, 15, 8);
            const stackMat = new THREE.MeshStandardMaterial({ color: 0x8B0000 });
            const stack = new THREE.Mesh(stackGeo, stackMat);
            stack.position.set(-8, 17, -5);
            stack.castShadow = true;
            group.add(stack);
        }
        
        return group;
    }
}

window.WarehouseGeometry = WarehouseGeometry;
window.FactoryGeometry = FactoryGeometry;
```

- [ ] **Step 2: Commit**

```bash
git add js/buildings/industrial.js
git commit -m "feat: add industrial building geometry classes"
```

---

### Task 8: Create BuildingManager Class

**Files:**
- Create: `js/building-manager.js`

- [ ] **Step 1: Create BuildingManager class structure**

```javascript
// js/building-manager.js
class BuildingManager {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.allBuildings = [];
        
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
            || (navigator.maxTouchPoints > 0 && window.innerWidth < 1024);
        this.maxVisibleBuildings = isMobile ? 0 : 400;
        
        this.updateInterval = 0.1;
        this.lastUpdate = 0;
        this.perfManager = new PerformanceManager(camera);
    }
    
    getBuildingTypesForZone(zone) {
        switch(zone) {
            case 'airport':
                return [
                    { type: 'commercial-shop', weight: 0.4 },
                    { type: 'commercial-hotel', weight: 0.2 },
                    { type: 'industrial-warehouse', weight: 0.3 },
                    { type: 'residential-medium', weight: 0.1 }
                ];
            case 'coastal':
                return [
                    { type: 'residential-small', weight: 0.3 },
                    { type: 'residential-medium', weight: 0.25 },
                    { type: 'commercial-hotel', weight: 0.25 },
                    { type: 'commercial-restaurant', weight: 0.2 }
                ];
            case 'inland':
                return [
                    { type: 'residential-small', weight: 0.3 },
                    { type: 'residential-medium', weight: 0.35 },
                    { type: 'residential-large', weight: 0.15 },
                    { type: 'industrial-warehouse', weight: 0.2 }
                ];
            default:
                return [{ type: 'residential-small', weight: 1.0 }];
        }
    }
    
    getDensityForZone(zone) {
        switch(zone) {
            case 'airport': return 0.6;
            case 'coastal': return 0.4;
            case 'inland': return 0.2;
            default: return 0.1;
        }
    }
    
    selectBuildingType(buildingTypes) {
        const totalWeight = buildingTypes.reduce((sum, t) => sum + t.weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const bt of buildingTypes) {
            random -= bt.weight;
            if (random <= 0) return bt;
        }
        
        return buildingTypes[0];
    }
    
    getBuildingZone(worldX, worldZ, islandName, islandInfo) {
        // Check if near airport
        if (islandInfo.airports && islandInfo.airports.length > 0) {
            for (const airport of islandInfo.airports) {
                const meta = islandMetadataCache[islandName];
                if (!meta) continue;
                
                const terrainWidth = meta.worldWidth * islandInfo.worldScale;
                const terrainHeight = meta.worldHeight * islandInfo.worldScale;
                
                const localX = (airport.x / 1023 - 0.5) * terrainWidth;
                const localZ = (airport.y / 1023 - 0.5) * terrainHeight;
                
                const airportWorldX = islandInfo.x + localX;
                const airportWorldZ = islandInfo.z + localZ;
                
                const dist = Math.sqrt(
                    Math.pow(worldX - airportWorldX, 2) + 
                    Math.pow(worldZ - airportWorldZ, 2)
                );
                
                if (dist < 500) return 'airport';
            }
        }
        
        // Check if coastal (within 200m of water)
        const terrainY = getTerrainHeight(worldX, worldZ);
        if (terrainY < 20) return 'coastal';
        
        return 'inland';
    }
    
    createBuilding(type, lod, x, y, z) {
        let geometry;
        const [category, variant] = type.split('-');
        
        switch(type) {
            case 'residential-small':
                geometry = SmallHouseGeometry.getGeometry(lod);
                break;
            case 'residential-medium':
                geometry = MediumHomeGeometry.getGeometry(lod);
                break;
            case 'residential-large':
                geometry = LargeEstateGeometry.getGeometry(lod);
                break;
            case 'commercial-shop':
                geometry = ShopGeometry.getGeometry(lod);
                break;
            case 'commercial-hotel':
                geometry = HotelGeometry.getGeometry(lod);
                break;
            case 'commercial-restaurant':
                geometry = RestaurantGeometry.getGeometry(lod);
                break;
            case 'industrial-warehouse':
                geometry = WarehouseGeometry.getGeometry(lod);
                break;
            case 'industrial-factory':
                geometry = FactoryGeometry.getGeometry(lod);
                break;
            default:
                console.warn(`Unknown building type: ${type}`);
                return null;
        }
        
        if (!geometry) return null;
        
        const building = geometry.clone();
        building.position.set(x, y, z);
        building.rotation.y = Math.random() * Math.PI * 2;
        building.visible = true;
        
        return building;
    }
    
    placeBuildingsForIsland(islandGroup, islandName, islandWorldX, islandWorldZ) {
        console.log(`BuildingManager: Placing buildings on ${islandName}`);
        
        const meta = islandMetadataCache[islandName];
        if (!meta) {
            console.warn(`BuildingManager: No metadata for ${islandName}`);
            return;
        }
        
        const islandInfo = islandPositions.find(i => i.name === islandName);
        if (!islandInfo) return;
        
        const worldScale = islandInfo.worldScale || 0.08;
        const terrainWidth = meta.worldWidth * worldScale;
        const terrainHeight = meta.worldHeight * worldScale;
        const halfWidth = terrainWidth / 2;
        const halfHeight = terrainHeight / 2;
        
        const gridSize = 25;
        let placed = 0;
        
        for (let x = islandWorldX - halfWidth; x <= islandWorldX + halfWidth; x += gridSize) {
            for (let z = islandWorldZ - halfHeight; z <= islandWorldZ + halfHeight; z += gridSize) {
                const jitterX = (Math.random() - 0.5) * gridSize * 0.8;
                const jitterZ = (Math.random() - 0.5) * gridSize * 0.8;
                const worldX = x + jitterX;
                const worldZ = z + jitterZ;
                
                if (!isPointOnIsland(worldX, worldZ, islandName)) continue;
                
                const terrainY = getTerrainMeshHeight(worldX, worldZ, islandName);
                if (terrainY <= 2 + 5) continue; // WATER_LEVEL = 2
                
                // Check slope
                const slope = getTerrainSlope(worldX, worldZ, islandName);
                if (slope > 15) continue;
                
                if (terrainY > 400) continue;
                
                const zone = this.getBuildingZone(worldX, worldZ, islandName, islandInfo);
                const density = this.getDensityForZone(zone);
                const clustering = Math.sin(worldX * 0.008) * Math.cos(worldZ * 0.008) * 0.3 + 0.7;
                const finalDensity = density * clustering;
                
                if (Math.random() > finalDensity) continue;
                
                const buildingTypes = this.getBuildingTypesForZone(zone);
                const buildingConfig = this.selectBuildingType(buildingTypes);
                
                const building = this.createBuilding(buildingConfig.type, 'high', 
                    worldX - islandWorldX, terrainY, worldZ - islandWorldZ);
                
                if (building) {
                    islandGroup.add(building);
                    this.allBuildings.push({
                        mesh: building,
                        type: buildingConfig.type,
                        worldPos: new THREE.Vector3(worldX, terrainY, worldZ),
                        currentLOD: 'high',
                        islandName
                    });
                    placed++;
                }
            }
        }
        
        console.log(`BuildingManager: Placed ${placed} buildings on ${islandName}`);
    }
    
    update(delta) {
        this.lastUpdate += delta;
        if (this.lastUpdate < this.updateInterval) return;
        this.lastUpdate = 0;
        
        this.perfManager.updateFrustum();
        const camPos = this.camera.position;
        
        this.allBuildings.forEach(buildingData => {
            const dist = camPos.distanceTo(buildingData.worldPos);
            
            if (dist > 800) {
                buildingData.mesh.visible = false;
                return;
            }
            
            buildingData.mesh.visible = true;
            
            const targetLOD = this.perfManager.getLODLevel(dist);
            // LOD switching for buildings would go here
        });
    }
}

window.BuildingManager = BuildingManager;
```

- [ ] **Step 2: Commit**

```bash
git add js/building-manager.js
git commit -m "feat: add BuildingManager class"
```

---

### Task 9: Integrate BuildingManager into Island Loading

**Files:**
- Modify: `js/islands.js:669-680` (after flora creation)

- [ ] **Step 1: Add BuildingManager creation and placement**

```javascript
// After floraManager creation in createAllIslands:
// Create BuildingManager
if (window.camera && !isMobile) {
    const buildingManager = new BuildingManager(scene, window.camera);
    window.buildingManager = buildingManager;
    
    for (const { island: islandGroup, info } of results) {
        buildingManager.placeBuildingsForIsland(islandGroup, info.name, info.x, info.z);
    }
    
    console.log(`BuildingManager created with ${buildingManager.allBuildings.length} total buildings`);
}
```

- [ ] **Step 2: Add getTerrainSlope helper function to islands.js**

```javascript
function getTerrainSlope(worldX, worldZ, islandName) {
    const delta = 5;
    const h1 = getTerrainMeshHeight(worldX - delta, worldZ, islandName);
    const h2 = getTerrainMeshHeight(worldX + delta, worldZ, islandName);
    const h3 = getTerrainMeshHeight(worldX, worldZ - delta, islandName);
    const h4 = getTerrainMeshHeight(worldX, worldZ + delta, islandName);
    
    const dx = (h2 - h1) / (delta * 2);
    const dz = (h4 - h3) / (delta * 2);
    
    return Math.atan(Math.sqrt(dx * dx + dz * dz)) * (180 / Math.PI);
}
```

- [ ] **Step 3: Test in browser - verify buildings appear**

Run game, check that buildings appear around airports and coast

- [ ] **Step 4: Commit**

```bash
git add js/islands.js
git commit -m "feat: integrate BuildingManager into island loading"
```

---

## Summary

After completing all tasks:
- Airports will be placed on all 8 Hawaiian islands using red dot markers from airport maps
- Buildings will cluster around airports, coastlines, and inland areas
- LOD system will reduce detail for distant buildings
- Mobile devices will show no buildings (performance optimization)