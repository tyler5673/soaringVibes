# 3D Asset Viewer Design Spec

**Date**: 2026-03-29  
**Author**: opencode  
**Status**: Draft  

---

## Overview

A standalone HTML-based viewer for browsing, inspecting, and animating all 3D models in the flight simulator project. The viewer auto-discovers all model classes, displays them in an interactive 3D scene, and provides controls for rotation, zoom, and animation playback.

---

## Requirements

### Functional Requirements

1. **Auto-discovery** - Automatically detect and load all model scripts from the codebase without manual configuration
2. **Model display** - Render each model in a neutral 3D viewing environment
3. **Navigation** - Orbit (rotate), zoom, and pan controls for examining models
4. **Model selection** - Browse models by category (Aircraft, Trees, Animals, Structures, Effects)
5. **Animation playback** - Detect and control model-specific animations
6. **Model information** - Display metadata including name, category, animations, and statistics

### Non-Functional Requirements

1. **Zero configuration** - New models automatically appear without code changes to viewer
2. **Isolated execution** - Models load without conflicting with each other or viewer code
3. **Performance** - Lazy loading, proper disposal of GPU resources
4. **Same architecture** - Match existing project patterns (HTML + vanilla JS, Three.js)

---

## System Architecture

### File Structure

```
viewer/
├── index.html      # Entry point, loads Three.js and viewer scripts
├── viewer.css      # UI styling
├── viewer.js       # Main viewer application
├── auto-discovery.js  # Model detection and loading
├── model-registry.js  # Central registry of detected models
└── controls.js     # UI controls for animations
```

### Component Design

#### 1. AutoDiscovery Module (`auto-discovery.js`)

**Purpose**: Dynamically detect and load all model scripts.

**Approach**: Use dynamic `import()` to load scripts into isolated closures, then scan for model definitions.

**Detection patterns**:
- Classes with `createMesh()` or `getGeometry()` methods
- Classes extending base classes (Animal, TreeGeometry)
- Global exports ending with "Geometry", "System", or known model names

**Algorithm**:
```javascript
// 1. Define known script paths (auto-generated from filesystem or maintained)
const scriptPaths = [
  '/js/aircraft.js',
  '/js/trees/palm.js',
  '/js/animals/albatross.js',
  // ... all other model scripts
];

// 2. Load each script in isolation
async function loadModels() {
  for (const path of scriptPaths) {
    const module = await import(path);
    detectModels(module);
  }
}

// 3. Detect model definitions
function detectModels(module) {
  // Check for class definitions
  // Check for global exports
  // Extract metadata
}
```

**Limitation**: Browsers cannot scan directories. Workaround: Maintain a minimal `model-manifest.json` listing all model script paths (auto-generatable via build script).

#### 2. ModelRegistry Module (`model-registry.js`)

**Purpose**: Central store of all detected models with metadata.

**Registry entry structure**:
```javascript
{
  id: 'aircraft',
  name: 'Cessna 182 Skylane',
  category: 'aircraft',
  scriptPath: '/js/aircraft.js',
  createFn: function(scene) { return new Aircraft(); },
  animations: ['propeller', 'flaps', 'ailerons', 'rudder', 'elevator'],
  boundingBox: { x: 11, y: 3, z: 9 },
  description: 'Detailed Cessna 182 with animated control surfaces'
}
```

**Categories**:
- `aircraft` - Planes and vehicles
- `trees` - Flora geometries
- `animals` - Fauna geometries
- `structures` - Airport, buildings
- `effects` - Clouds, balloons

#### 3. SceneManager Module (`viewer.js`)

**Purpose**: Manages the 3D viewing environment.

**Components**:
- Single Three.js scene with grid floor, neutral lighting
- OrbitControls for camera navigation
- Model loading/unloading with proper disposal

**Scene setup**:
```javascript
// Neutral blue background
scene.background = new THREE.Color(0x87CEEB);
scene.fog = new THREE.Fog(0x87CEEB, 100, 2000);

// Grid helper for scale reference
const grid = new THREE.GridHelper(100, 10, 0x888888, 0xcccccc);

// Studio-like lighting
const ambient = new THREE.AmbientLight(0xffffff, 0.6);
const directional = new THREE.DirectionalLight(0xffffff, 0.8);
directional.position.set(50, 100, 50);
```

**Model lifecycle**:
```javascript
function loadModel(modelId) {
  // Dispose previous model
  if (currentModel) {
    scene.remove(currentModel.mesh);
    disposeGeometry(currentModel.mesh);
  }
  
  // Load new model
  const modelDef = registry.get(modelId);
  const model = modelDef.createFn();
  currentModel = model;
  scene.add(model.mesh);
  
  // Reset camera to fit model
  resetCameraToModel(model.mesh);
}
```

#### 4. AnimationController Module (`controls.js`)

**Purpose**: Detect and control model animations.

**Detection strategy**: Scan model mesh for recognizable animated parts:

**Aircraft**:
- `propeller` - rotation animation
- `aileronL`, `aileronR` - deflection animation
- `flaps`, `elevator`, `rudder` - deflection animation

**Animals**:
- `wingSegments`, `wingParts`, `feathers` - flapping animation
- Body parts that rotate/scale over time

**Balloons**:
- `flameMesh`, `burner` - pulse animation

**Control interface**:
```javascript
{
  play: () => void,
  pause: () => void,
  setSpeed: (multiplier) => void,
  cycle: () => void,
  reset: () => void
}
```

#### 5. UI Components

**Layout**:

```
+--------------------------------------------------+
|  Search: [________]  View: [Options v]           |
+------+-------------------------------------------+
|      |                                           |
|      |                                           |
| UI   |              3D View                      |
|      |                                           |
|      |                                           |
| List |                                           |
|      |                                           |
+------+-------------------------------------------+
| Model: Cessna 182 Skylane                        |
| Category: aircraft                               |
| Animations: propeller, flaps, ailerons           |
| [Play] [Pause] Speed: [----o----]                |
+--------------------------------------------------+
```

**Components**:

1. **Model list** (left sidebar)
   - Tree structure by category
   - Searchable/filterable
   - Click to select model

2. **3D view** (main area)
   - WebGL canvas
   - Full-screen overlay for UI panels

3. **Info panel** (bottom)
   - Model name, category
   - Detected animations
   - Statistics (bounding box, polygon count)

4. **Animation controls** (bottom, context-sensitive)
   - Play/pause buttons
   - Speed slider
   - Per-animation toggles (if multiple)

---

## Implementation Plan

### Phase 1: Foundation
1. Create basic viewer HTML/CSS skeleton
2. Set up Three.js scene with grid, lighting, orbit controls
3. Load single hardcoded model (aircraft) to validate pipeline

### Phase 2: Model Registration
4. Implement ModelRegistry data structure
5. Add manual registration for 5-10 key models
6. Build UI to list and select models

### Phase 3: Auto-Discovery
7. Implement dynamic script loading
8. Add detection patterns for model classes
9. Auto-generate manifest file (build script)

### Phase 4: Animation Support
10. Implement animation detection
11. Build animation control UI
12. Add per-model animation logic

### Phase 5: Polish
13. Search/filter functionality
14. Model statistics display
15. Performance optimization

---

## Integration Points

### How models should export themselves

**Standard export pattern** (for compatibility):
```javascript
// At end of each model file:
window.ModelViewerRegistry = window.ModelViewerRegistry || { models: [] };

window.ModelViewerRegistry.models.push({
  id: 'aircraft',
  name: 'Cessna 182',
  category: 'aircraft',
  create: function(scene) {
    const aircraft = new Aircraft();
    return { mesh: aircraft.mesh, update: aircraft.update.bind(aircraft) };
  },
  animations: ['propeller', 'flaps', 'ailerons']
});
```

**Fallback**: Auto-detection without explicit registration by scanning for classes with `createMesh()` methods.

---

## Edge Cases

1. **Models requiring scene parameters** - Create mock scene object with minimal required properties
2. **Models with external dependencies** (textures, models) - Graceful degradation with placeholder geometry
3. **Models that share state** - Isolate in closures, deep copy where needed
4. **Very large models** - Implement LOD fallback or downscaling

---

## Success Criteria

1. Opening `viewer/index.html` shows list of all models in project
2. Clicking any model renders it in 3D view within 2 seconds
3. Mouse controls rotate/zoom/pan the view
4. Animation controls play detected animations
5. Adding a new model script to the project makes it appear in viewer without viewer code changes

---

## Open Questions

1. Should viewer run alongside the main sim, or as a completely separate page? (Recommendation: separate)
2. Should we include terrain/islands in the viewer? (Recommendation: no, focus on discrete models)
3. What's the preferred manifest generation method? (Manual list vs. build-time script scanning)
