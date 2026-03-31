# Building and Airport System Design

## Overview
Add a building system similar to the vegetation system with procedural building placement, plus airports on each island using red dot markers from airport map images.

---

## 1. Airport System

### 1.1 Airport Map Parsing
- Load each `{island}-airport.png` from `assets/maps/`
- Scan pixels for red channel > 200 (detects red dots)
- Convert pixel position to island local coordinates
- Map to world coordinates using island's worldScale

### 1.2 Airport Placement
- Add `airportX`, `airportZ` to each island in `islandPositions`
- Modify `createAirport()` to accept position parameters (x, z)
- Create airports for all islands with markers

### 1.3 Airport Infrastructure
- **Large airport** (population > 100k or real commercial airport):
  - Runway: 600m x 30m
  - Multiple hangars (2)
  - Large terminal
- **Small airport** (small island or private airstrip):
  - Runway: 400m x 20m
  - Single hangar
  - Basic terminal

#### Airport Size Criteria
- Big Island: 2 airports (Kona = large, Hilo = large)
- Maui, Oahu, Kauai: large
- Molokai, Lanai: small
- Niihau, Kahoolawe: none (no airport markers)

### 1.4 Runway Orientation
- Default: Align to east-west (rotation.y = Math.PI / 2)
- Future: Could analyze map for runway shape (two parallel lines) to determine actual heading

---

## 2. Building System

### 2.1 Building Types

#### Residential
- **Small House**: 8m x 6m, single story, peaked roof
- **Medium Home**: 12m x 8m, 1-2 story, garage
- **Large Estate**: 18m x 12m, 2 story, pool

#### Commercial
- **Shop**: 15m x 10m, flat roof, awning
- **Hotel**: 30m x 20m, 3-4 story, rectangular
- **Restaurant**: 20m x 15m, patio area

#### Industrial
- **Warehouse**: 40m x 25m, large doors, flat roof
- **Factory**: 35m x 30m, multiple units

### 2.2 LOD System
- Reuse existing `PerformanceManager.getLODLevel()` from flora system
- Thresholds: 150m (high), 400m (medium), 800m (low)
- Below 150m: Full geometry with windows, doors, roof details
- 150-400m: Simplified box with basic roof shape
- Above 400m: Simple box or billboard

### 2.3 Placement Algorithm

#### Clustering Pattern (reuse flora patterns)
- Use similar grid-based placement as flora system
- Grid size: 20m for buildings (larger than trees)
- Apply clustering: `clustering = Math.sin(worldX * 0.008) * Math.cos(worldZ * 0.008) * 0.3 + 0.7`

### 2.3 Placement Algorithm

#### Cluster Areas
1. **Airport clusters**: Dense buildings within 500m of airports
2. **Coastal clusters**: Tourist/residential along beaches
3. **Inland clusters**: Scattered residential in flat areas

#### Density Rules
- Airport area: 0.6 density (buildings per 100m²)
- Coast: 0.4 density, max 200m from water
- Inland: 0.2 density, flat areas only

#### Placement Rules
- Min distance between buildings: 15m
- Max slope: 15° (no cliffs)
- Min elevation: WATER_LEVEL + 5m
- Max elevation: 400m (no high mountains)

### 2.4 Spatial Management
- Reuse existing `SpatialLookup` class
- Frustum culling similar to flora system
- Max visible buildings: 400 (mobile: 0)

```javascript
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    || (navigator.maxTouchPoints > 0 && window.innerWidth < 1024);
this.maxVisibleBuildings = isMobile ? 0 : 400;
```

---

## 3. Integration

### 3.1 File Structure
```
js/
├── building-manager.js     # Main manager (new)
├── buildings/
│   ├── residential.js       # House classes (new)
│   ├── commercial.js        # Shop, hotel, restaurant (new)
│   └── industrial.js       # Warehouse, factory (new)
```

### 3.2 Island Loading
1. Parse airport maps → get airport positions
2. Create terrain (existing)
3. Place flora (existing)
4. Place buildings (new)
5. Create airports (new)

### 3.3 Performance
- Lazy loading: Only create buildings within 800m of camera
- Instance pooling for similar building types
- Mobile: Disable entirely (same as flora)

---

## 4. Data Structures

### Island Position Update
```javascript
{
    name: 'maui',
    x: 0,
    z: 0,
    hasAirport: true,
    airports: [{ x: 512, z: 256 }],  // Array for multiple airports
    worldScale: 0.08
}
```

### Coordinate Transformation
To convert pixel to world coordinates:
1. Load airport map (1024x1024)
2. Find red pixels (R > 200)
3. Calculate pixel center of mass for each red cluster
4. Normalize to 0-1: `u = pixelX / 1023`, `v = pixelY / 1023`
5. Apply same transformation as heightmap:
   - localX = (u - 0.5) * terrainWidth
   - localZ = (v - 0.5) * terrainHeight
6. Add island world offset: worldX = localX + islandWorldX

Note: If airport maps have different bounds than heightmaps, add offset calibration per island.

### Building Data
```javascript
{
    mesh: THREE.Group,
    type: 'residential-small',
    worldPos: THREE.Vector3,
    currentLOD: 'high',
    scale: 1.0,
    islandName: 'maui'
}
```

---

## 5. Acceptance Criteria

1. Airport maps parsed correctly for all 8 islands
2. Airports created at correct world positions
3. Buildings cluster around airports and coastlines
4. LOD system works (detail changes with distance)
5. Frustum culling keeps FPS reasonable
6. Mobile: No buildings rendered
7. No buildings on steep slopes or in water