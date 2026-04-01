# Dynamic Ocean System Design

**Date**: April 1, 2026  
**Author**: Generated via brainstorming skill  
**Status**: Draft - Awaiting review

---

## Overview

Replace the current flat ocean plane with a dynamic wave-based system using Gerstner waves and LOD (Level of Detail) mesh rings. The new system provides realistic-looking ocean waves while maintaining performance through view-dependent detail scaling.

---

## Goals

1. **Visual Realism**: Dynamic waves that propagate and interfere naturally
2. **Performance**: Maintain 60 FPS across all scenes using LOD techniques
3. **Integration**: Seamlessly work with existing boat, aircraft, and environment systems
4. **Browser-Optimized**: Use Three.js efficiently without heavy shaders or compute buffers

---

## Technical Approach

### Wave System: Gerstner Waves

Gerstner waves simulate water by moving vertices in circular paths rather than just displacing vertically (like sine waves). This creates realistic wave peaks and troughs with proper crest steepening.

**Mathematical Formula**:
```javascript
For each vertex at position P(x, y, z):
  For each wave system i:
    // Wave parameters
    dir = wave.direction (normalized 2D vector)
    amp = wave.amplitude (height)
    len = wave.length (wavelength in meters)
    spn = wave.steepness (0-1, controls circular motion)
    spd = wave.speed (meters/second)
    
    // Phase calculation
    phase = dot(dir, [x, z]) * (2π / len) + time * spd
    
    // Gerstner displacement
    offset.x += -dir.x * amp * cos(phase) * spn
    offset.y +=  amp * sin(phase)                    // Vertical lift
    offset.z += -dir.z * amp * cos(phase) * spn
  
  Final position = P + offset
```

**Wave Configuration** (3 systems for hybrid realism):

| System | Wavelength | Amplitude | Steepness | Speed | Direction | Purpose |
|--------|-----------|-----------|-----------|-------|-----------|---------|
| Swell | 100m | 2.0m | 0.7 | 6 m/s | Random slow drift | Ocean swell base |
| Chop | 30m | 0.8m | 0.5 | 12 m/s | Cross pattern | Wind-driven waves |
| Ripple | 8m | 0.2m | 0.3 | 20 m/s | Multiple directions | Surface detail/chop |

**Total Computation Cost**: ~40 floating point operations per vertex, evaluated on CPU before rendering.

---

### LOD System: Concentric Ring Meshes

The ocean is composed of multiple mesh rings that follow the camera, with detail decreasing at distance.

**Ring Configuration**:

| Ring | Distance Range | Segments | Wave Intensity | Use Case |
|------|---------------|----------|----------------|----------|
| Inner | 0-600m | 48×48 (2,352 verts) | 100% | High-detail close-up view |
| Middle | 600-1800m | 24×24 (600 verts, deduplicated) | 50% | Mid-range detail |
| Outer | 1800-3000m | 12×12 (156 verts, deduplicated) | 20% | Far distance, minimal waves |
| Beyond | >3000m | Flat plane or culled | 0% | Hidden by fog |

**Ring Geometry**:
- Each ring is an annulus (doughnut shape) created from `THREE.BufferGeometry`
- Vertices generated in polar coordinates converted to Cartesian
- Inner radius has small gap overlap (~30m) with adjacent rings for smooth blending

**Camera Tracking Strategy**:
```javascript
// Snap ocean position to grid every 200 meters
gridSize = 200
oceanX = Math.floor(camera.x / gridSize) * gridSize
oceanZ = Math.floor(camera.z / gridSize) * gridSize

// Only reposition if camera moved > 50m from center
if (distance(camera, oceanCenter) > 300) {
  snapToGrid()
}
```

This prevents visual jitter and reduces update frequency.

---

### Smooth Blending at LOD Boundaries

**Approach A: Opacity Fade Strip** (Recommended)
- Add 5-meter wide fade strips at ring edges
- Custom `ShaderMaterial` with distance-based alpha blending
- Vertices in overlap zone interpolate between full opacity and transparent

```glsl
// Fragment shader blend
float distFromCenter = length(vUv - vec2(0.5));
float edgeDist = abs(distFromCenter - 0.5); // Distance from ring boundary
alpha = smoothstep(0.0, 0.02, edgeDist);     // Fade over 2% of radius
```

**Approach B: Hard Boundaries** (Fallback)
- Accept visible mesh boundaries if performance is tight
- Can be mitigated with fog density increase at far distances

---

### Material & Visual Polish

**Base Material**: `THREE.MeshStandardMaterial` for PBR lighting

```javascript
const oceanMaterial = {
  color: new THREE.Color(0x1e90ff),      // Deep blue base
  roughness: 0.15,                       // Shiny water surface
  metalness: 0.1,                        // Slight metallic sheen
  emissive: new THREE.Color(0x001133),   // Subtle glow for depth
  emissiveIntensity: 0.2,
  flatShading: false,                    // Smooth shading
  side: THREE.DoubleSide                 // Render both sides underwater
}
```

**Foam Effect** (Inner Ring Only):
- Modify vertex shader to calculate wave slope magnitude
- Pass slope as `vWaveSlope` attribute to fragment shader
- Mix in white color where slope > threshold (steep wave peaks)

```glsl
// Vertex shader
vec2 dx = dFdx(position);
vec2 dy = dFdy(position);
float slope = length(cross(dy, dx));
vWaveSlope = slope;

// Fragment shader  
if (vWaveSlope > 0.3) {
  color = mix(color, vec3(1.0), vWaveSlope * 2.0 - 0.6);
}
```

**Depth Color Gradient**:
- Inner ring: Deep blue (0x1e90ff)
- Middle ring: Slightly lighter (0x40a0ff)  
- Outer ring: Lighter still (0x6bb3ff)
- Creates visual depth cue and helps mask LOD transitions

---

## System Architecture

### New File Structure

```
js/
├── ocean.js                 # NEW - Main ocean system
│   ├── OceanManager class   # Orchestrates everything
│   ├── WaveSystem class     # Gerstner wave computation
│   └── Helper functions     # Height sampling, utilities
└── environment.js           # Modified - calls createDynamicOcean()
```

### Class Design

**`WaveSystem` Class**:
```javascript
class WaveSystem {
  constructor(config) {
    this.waves = config.waves;      // Array of wave definitions
    this.time = 0;
  }
  
  update(deltaTime) {
    this.time += deltaTime;
  }
  
  displaceVertex(position, output) {
    // Apply Gerstner formula for all waves
    // Returns displaced position in output vector
  }
  
  getHeight(x, z) {
    // Sample wave height at world coordinates (for boats/collision)
  }
}
```

**`OceanManager` Class**:
```javascript
class OceanManager {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.waveSystem = new WaveSystem(waveConfig);
    this.rings = [];                // Array of LOD meshes
    this.lastOceanPos = null;
    
    this.createRings();
  }
  
  createRings() {
    // Generate inner, middle, outer ring geometries
    // Apply materials and add to scene
  }
  
  update(deltaTime) {
    // Update wave system time
    // Reposition rings if camera moved significantly
    // Rebuild vertex buffers with new wave displacements
  }
  
  getHeight(x, z) {
    // Delegate to WaveSystem for height sampling
  }
}
```

---

## Integration Points

### With `environment.js`

**Remove**:
```javascript
// OLD CODE - DELETE THESE:
let oceanMesh;
function createOcean(scene, camera) { ... }
function updateOceanWaves(time) { ... }
```

**Add**:
```javascript
// NEW CODE:
import { OceanManager } from './ocean.js';

let oceanManager;

function createDynamicOcean(scene, camera) {
  oceanManager = new OceanManager(scene, camera);
}

function updateOcean(deltaTime) {
  if (oceanManager) oceanManager.update(deltaTime);
}
```

### With `boats.js`

**Modification in boat update loop**:
```javascript
// Current (flat water level):
this.mesh.position.y = BOAT_WATER_LEVEL;

// New (wave-following):
const waveHeight = oceanManager.getHeight(this.mesh.position.x, this.mesh.position.z);
this.mesh.position.y = BOAT_WATER_LEVEL + waveHeight * 0.7; // Dampen for natural bobbing
```

**Note**: Boat mesh should also rotate slightly based on wave slope for realism (optional Phase 3 enhancement).

### With `aircraft.js` (Abby Mode)

**Option A: Ignore Ocean Collision in Abby Mode** (Simpler)
```javascript
// In checkCrash():
if (this.abbyMode) {
  // Skip ocean collision entirely, only check terrain
  const terrainHeight = getTerrainHeight(this.position.x, this.position.z);
  if (this.position.y < terrainHeight && onLand()) {
    // Handle land crash
  }
  return;
}

// Normal ocean + terrain collision below...
```

**Option B: Wave-Aware Collision** (More Realistic)
```javascript
const waveHeight = oceanManager.getHeight(this.position.x, this.position.z);
const effectiveWaterLevel = WATER_LEVEL + waveHeight;

if (this.position.y < effectiveWaterLevel && !onLand()) {
  // Water collision at dynamic level
}
```

Recommendation: **Option A** for MVP, implement Option B later if desired.

---

## Performance Budget

### Memory Usage

| Component | Size Estimate | Notes |
|-----------|---------------|-------|
| Inner Ring Geometry | ~150 KB | 2,352 vertices × 3 coords × 4 bytes |
| Middle Ring Geometry | ~36 KB | 600 vertices |
| Outer Ring Geometry | ~9 KB | 156 vertices |
| Materials | ~5 KB | Shared across rings |
| **Total** | **~200 KB** | Negligible impact |

### CPU Usage (Per Frame at 60 FPS)

| Operation | Cost Estimate |
|-----------|---------------|
| Wave calculations (3,108 vertices × ~40 ops) | ~0.5ms |
| Geometry updates & `needsUpdate` flags | ~0.2ms |
| Camera distance checks + grid snapping | ~0.1ms |
| **Total per frame** | **~0.8ms** |

This leaves significant headroom for other systems (flora, fauna, physics).

### GPU Usage

- 3 mesh draw calls (trivial)
- Vertex shader: Gerstner already computed on CPU, just position pass-through
- Fragment shader: Standard PBR material (~5-10% fill rate for ocean coverage)

---

## Implementation Phases

### Phase 1: Core Wave System (MVP) - **Priority 1**
**Deliverables**:
- ✅ `WaveSystem` class with Gerstner implementation
- ✅ Single mesh ocean (no LOD yet) with animated waves  
- ✅ Basic integration replacing old flat ocean
- ✅ Remove old `oceanMesh`, `createOcean()`, `updateOceanWaves()`

**Success Criteria**:
- Waves visibly animate in real-time
- FPS remains above 55 with single mesh active
- No visual artifacts or crashes

---

### Phase 2: LOD System - **Priority 1**
**Deliverables**:
- ✅ Concentric ring geometry generation (inner, middle, outer)
- ✅ Camera-following logic with grid snapping
- ✅ Vertex displacement applied per-ring at appropriate intensity
- ✅ Basic blending or acceptable hard boundaries

**Success Criteria**:
- No visible LOD popping during camera movement
- Performance stays stable across all distances
- Ocean seamlessly follows aircraft during flight

---

### Phase 3: Visual Polish - **Priority 2**
**Deliverables**:
- 🟡 Foam effect on inner ring (custom `ShaderMaterial`)
- 🟡 Depth color gradient between rings
- 🟡 Specular highlight tuning for sun reflection
- 🟡 Optional: Boat rotation based on wave slope

**Success Criteria**:
- Foam visible at wave peaks in close-up view
- Ocean looks more dynamic and realistic than current version
- Visual improvements don't impact FPS noticeably

---

### Phase 4: Full Integration & Settings - **Priority 2**
**Deliverables**:
- 🟡 Boat height sampling from `oceanManager.getHeight()`
- 🟡 Abby mode ocean collision adjustment
- 🟡 Settings UI: wave intensity slider, toggle for foam/LOD
- 🟡 Performance monitor integration to scale down on mobile

**Success Criteria**:
- All existing features continue working (boats, aircraft, multiplayer)
- Users can adjust visual quality vs performance tradeoffs
- Mobile devices maintain 30+ FPS with reduced settings

---

## Error Handling & Edge Cases

### Camera at World Boundary
- **Issue**: Outer rings may partially render near map edges at ±20km
- **Solution**: Accept partial rendering; fog density hides abrupt cutoffs
- **Alternative**: Dynamically scale outer ring radius based on camera position (deferred)

### Rapid Camera Movement
- **Issue**: Grid snapping could cause visible "teleport" if threshold too large
- **Solution**: 50m reposition threshold + smooth camera lerp prevents jitter
- **Test Case**: Fly aircraft at max speed across ocean, check for visual artifacts

### Mobile Device Performance
- **Issue**: Lower-end phones may struggle with vertex updates
- **Solution**: PerformanceMonitor callback to reduce segment counts:
  - Inner: 32×32 instead of 48×48
  - Middle/Outer: Skip or reduce further
- **Detection**: `navigator.hardwareConcurrency < 4` or FPS < 30 sustained

### Aircraft Underwater Edge Case
- **Issue**: Wave height could cause aircraft to clip in/out of water rapidly
- **Solution**: Use averaged wave height over small area (2-meter radius sample)
- **Abby Mode Override**: Skip ocean collision entirely when enabled

---

## Testing & Validation

### Visual Tests
1. **Wave Animation**: Fly close to ocean, verify waves propagate and interfere naturally
2. **LOD Transition**: Circle at increasing radii from center, check for popping or seams
3. **Foam Rendering**: Inspect wave peaks in inner ring for white foam highlights
4. **Color Gradient**: Verify depth color change between rings is subtle but visible

### Performance Tests
1. **FPS Baseline**: Record FPS with current flat ocean (expected: 60 FPS)
2. **Wave Impact**: Measure FPS with single animated mesh (target: >55 FPS)
3. **Full System**: All 3 LOD rings active, compare to baseline (target: >50 FPS)
4. **Stress Test**: Add flora/fauna/boats at max density, ensure no frame drops

### Integration Tests
1. **Boat Positioning**: Verify boats sit at correct wave height with natural bobbing
2. **Aircraft Collision**: Test Abby mode and normal water crash detection
3. **Multiplayer Sync**: Confirm ocean state is client-only (no sync needed)
4. **Camera Orbit**: Ensure orbit camera works smoothly over dynamic ocean

### Mobile Tests
1. **iOS Safari**: Test on iPhone SE (2020) or simulator, verify 30+ FPS with reduced LOD
2. **Android Chrome**: Test on mid-tier device (Snapdragon 700 series), same target
3. **Touch Controls**: Ensure ocean updates don't interfere with mobile joystick response

---

## Dependencies & Assumptions

### Three.js Version
- Currently using: `three@0.160.0` (CDN)
- No version upgrade needed; all features available in current version

### Browser Compatibility
- **Target**: Modern browsers (Chrome 90+, Firefox 88+, Safari 14+)
- **Excluded**: IE11, old Android WebView (< Chrome 70)
- All target browsers support required WebGL 2.0 features

### Existing Code Stability
- Assumes current `PerformanceMonitor`, `orbitCamera`, and `floraManager` systems remain stable
- No changes to aircraft physics or terrain generation expected during implementation

---

## Future Enhancements (Out of Scope)

These could be added later if desired:

1. **Dynamic Wave Generation**: Aircraft wake trails, boat wakes
2. **Reflection/Refraction**: Render targets for water reflections (performance-heavy)
3. **Caustics**: Light projection patterns underwater/shoreline
4. **Shoreline Integration**: Waves interact with terrain at beach boundaries
5. **Weather System**: Wind direction affects wave patterns dynamically
6. **Voxel Fluid Simulation**: Full Navier-Stokes for maximum realism (very expensive)

---

## Open Questions & Decisions

### Decision: ShaderMaterial vs StandardMaterial + CPU Vertices
- **Current Choice**: CPU vertex updates with `MeshStandardMaterial`
- **Rationale**: Simpler to implement, debuggable, avoids shader complexity in Phase 1
- **Trade-off**: Slightly less efficient than GPU-based approach but adequate for target performance

### Decision: Foam in Shader vs Particle System
- **Current Choice**: Vertex/fragment shader slope calculation
- **Rationale**: Zero additional draw calls, integrated with existing mesh
- **Trade-off**: Less control over foam physics, but sufficient for visual effect

### TBD: Settings UI Implementation Detail
- Should wave intensity be per-wave-type or global multiplier? (Recommend: global 0-2.0 slider)
- Should LOD distances be user-adjustable? (Recommend: No, auto-scale based on performance only)

---

## Conclusion

This design provides a balanced approach to dynamic ocean rendering that prioritizes visual quality while maintaining strong performance through LOD and optimized wave calculations. The phased implementation allows for iterative testing and validation before committing to full feature set.

**Next Steps**:
1. Review this specification for accuracy and completeness
2. Address any open questions or concerns
3. Proceed to `writing-plans` skill for detailed implementation plan with file edits and test cases
