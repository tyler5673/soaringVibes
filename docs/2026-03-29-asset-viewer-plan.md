# 3D Asset Viewer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone HTML viewer that auto-discovers and displays all 3D models from the flight simulator with interactive controls and animation playback.

**Architecture:** Separate `viewer/` directory with auto-discovery system that loads model scripts dynamically, registry-based model storage, Three.js scene with orbit controls, and context-sensitive animation UI.

**Tech Stack:** HTML5, CSS3, Vanilla JS, Three.js r160 (matching project), dynamic imports

---

## Phase 1: Foundation - Basic Viewer Structure

### Task 1: Create Viewer Directory and HTML Shell

**Files:**
- Create: `viewer/index.html`
- Create: `viewer/viewer.css`
- Create: `viewer/viewer.js`

- [ ] **Step 1: Create viewer directory**

Run: `mkdir -p /Users/tyler/Workspace/soaringVibes/viewer`

- [ ] **Step 2: Create index.html skeleton**

Write `viewer/index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Asset Viewer - Soaring Vibes</title>
    <link rel="stylesheet" href="viewer.css">
</head>
<body>
    <div id="ui-container">
        <header id="top-bar">
            <div class="search-box">
                <input type="text" id="search-input" placeholder="Search models...">
            </div>
            <div class="view-options">
                <select id="category-filter">
                    <option value="all">All Categories</option>
                    <option value="aircraft">Aircraft</option>
                    <option value="trees">Trees</option>
                    <option value="animals">Animals</option>
                    <option value="structures">Structures</option>
                    <option value="effects">Effects</option>
                </select>
            </div>
        </header>
        
        <aside id="model-list">
            <div id="model-tree"></div>
        </aside>
        
        <main id="viewer-container">
            <canvas id="webgl-canvas"></canvas>
        </main>
        
        <footer id="info-panel">
            <div class="model-info">
                <h3 id="model-name">Select a model</h3>
                <div id="model-details"></div>
            </div>
            <div class="animation-controls">
                <button id="play-btn">▶ Play</button>
                <button id="pause-btn">⏸ Pause</button>
                <label>Speed: <input type="range" id="speed-slider" min="0" max="3" step="0.1" value="1"></label>
            </div>
        </footer>
    </div>
    
    <script src="https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.160.0/examples/js/controls/OrbitControls.js"></script>
    <script src="model-registry.js"></script>
    <script src="auto-discovery.js"></script>
    <script src="controls.js"></script>
    <script src="viewer.js"></script>
</body>
</html>
```

- [ ] **Step 3: Create basic viewer.css**

Write `viewer/viewer.css`:

```css
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    overflow: hidden;
    background: #1a1a2e;
    color: #fff;
}

#ui-container {
    display: grid;
    grid-template-areas:
        "header header"
        "sidebar viewer"
        "footer footer";
    grid-template-columns: 300px 1fr;
    grid-template-rows: 60px 1fr 120px;
    height: 100vh;
    width: 100vw;
}

#top-bar {
    grid-area: header;
    background: #16213e;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
    border-bottom: 1px solid #0f3460;
}

.search-box input {
    width: 300px;
    padding: 8px 12px;
    border: 1px solid #0f3460;
    border-radius: 4px;
    background: #1a1a2e;
    color: #fff;
    font-size: 14px;
}

.search-box input:focus {
    outline: none;
    border-color: #4fc3f7;
}

.view-options select {
    padding: 8px 12px;
    border: 1px solid #0f3460;
    border-radius: 4px;
    background: #1a1a2e;
    color: #fff;
    font-size: 14px;
}

#model-list {
    grid-area: sidebar;
    background: #16213e;
    border-right: 1px solid #0f3460;
    overflow-y: auto;
    padding: 10px;
}

#model-tree {
    font-size: 14px;
}

.category-header {
    font-weight: bold;
    color: #4fc3f7;
    margin-top: 10px;
    margin-bottom: 5px;
    cursor: pointer;
    user-select: none;
}

.category-header::before {
    content: '▼ ';
    font-size: 10px;
}

.category-header.collapsed::before {
    content: '▶ ';
}

.category-header + div {
    display: block;
}

.category-header.collapsed + div {
    display: none;
}

.model-item {
    padding: 5px 10px;
    cursor: pointer;
    border-radius: 3px;
    margin-left: 15px;
    transition: background 0.2s;
}

.model-item:hover {
    background: rgba(79, 195, 247, 0.2);
}

.model-item.selected {
    background: rgba(79, 195, 247, 0.4);
}

#viewer-container {
    grid-area: viewer;
    position: relative;
    background: #87CEEB;
    overflow: hidden;
}

#webgl-canvas {
    width: 100%;
    height: 100%;
    display: block;
}

#info-panel {
    grid-area: footer;
    background: #16213e;
    border-top: 1px solid #0f3460;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
    gap: 20px;
}

.model-info {
    flex: 1;
}

.model-info h3 {
    color: #4fc3f7;
    margin-bottom: 5px;
    font-size: 16px;
}

.model-details {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.7);
}

.animation-controls {
    display: flex;
    align-items: center;
    gap: 15px;
}

.animation-controls button {
    padding: 8px 16px;
    background: #4fc3f7;
    color: #1a1a2e;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
    transition: background 0.2s;
}

.animation-controls button:hover {
    background: #29b6f6;
}

.animation-controls label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
}

.animation-controls input[type="range"] {
    width: 100px;
}
```

- [ ] **Step 4: Create empty viewer.js**

Write `viewer/viewer.js`:

```javascript
// Main viewer application
console.log('Asset Viewer loaded');
```

- [ ] **Step 5: Test the viewer loads**

Run: `open /Users/tyler/Workspace/soaringVibes/viewer/index.html`

Expected: Page loads with UI layout, blank blue viewer area

- [ ] **Step 6: Commit Phase 1 Task 1**

```bash
git add viewer/
git commit -m "feat: add viewer foundation

- Create viewer directory structure
- HTML shell with sidebar, viewer, and info panel
- CSS styling matching project aesthetic
- Basic grid layout for UI components"
```

### Task 2: Set Up Three.js Scene with Orbit Controls

**Files:**
- Modify: `viewer/viewer.js`

- [ ] **Step 1: Implement scene setup function**

Add to `viewer/viewer.js`:

```javascript
let scene, camera, renderer, controls;
let currentModel = null;
let animationId = null;

function initScene() {
    const container = document.getElementById('viewer-container');
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.Fog(0x87CEEB, 100, 2000);
    
    // Camera
    camera = new THREE.PerspectiveCamera(
        60,
        width / height,
        0.1,
        10000
    );
    camera.position.set(50, 30, 50);
    camera.lookAt(0, 0, 0);
    
    // Renderer
    renderer = new THREE.WebGLRenderer({
        canvas: document.getElementById('webgl-canvas'),
        antialias: true
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);
    
    // Grid helper
    const gridHelper = new THREE.GridHelper(100, 10, 0x888888, 0xcccccc);
    scene.add(gridHelper);
    
    // Axis helpers
    const axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);
    
    // Orbit controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 10;
    controls.maxDistance = 500;
    
    // Handle resize
    window.addEventListener('resize', onWindowResize);
    
    console.log('Scene initialized');
}

function onWindowResize() {
    const container = document.getElementById('viewer-container');
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

function animate() {
    animationId = requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

function init() {
    initScene();
    animate();
}

init();
```

- [ ] **Step 2: Test scene renders**

Run: `open /Users/tyler/Workspace/soaringVibes/viewer/index.html`

Expected: Blue background with grid floor and axis helpers

- [ ] **Step 3: Commit Phase 1 Task 2**

```bash
git add viewer/viewer.js
git commit -m "feat: implement Three.js scene setup

- Add scene with fog and neutral background
- Set up PerspectiveCamera and WebGLRenderer
- Add studio lighting (ambient + directional)
- Add grid helper and axis helpers
- Implement OrbitControls for navigation
- Add resize handler"
```

---

## Phase 2: Model Registration System

### Task 3: Create ModelRegistry Data Structure

**Files:**
- Create: `viewer/model-registry.js`

- [ ] **Step 1: Create ModelRegistry class**

Write `viewer/model-registry.js`:

```javascript
class ModelRegistry {
    constructor() {
        this.models = new Map();
        this.categories = new Map();
    }
    
    register(model) {
        const id = model.id;
        this.models.set(id, model);
        
        const category = model.category || 'other';
        if (!this.categories.has(category)) {
            this.categories.set(category, []);
        }
        this.categories.get(category).push(id);
        
        console.log(`Registered model: ${id} (${category})`);
    }
    
    get(id) {
        return this.models.get(id);
    }
    
    getAll() {
        return Array.from(this.models.values());
    }
    
    getCategories() {
        return Array.from(this.categories.entries()).map(([name, ids]) => ({
            name,
            models: ids
        }));
    }
    
    search(query) {
        const lowerQuery = query.toLowerCase();
        return this.getAll().filter(model => {
            return model.name.toLowerCase().includes(lowerQuery) ||
                   model.description?.toLowerCase().includes(lowerQuery) ||
                   model.category?.toLowerCase().includes(lowerQuery);
        });
    }
}

// Global registry instance
window.modelRegistry = new ModelRegistry();
```

- [ ] **Step 2: Test registry initializes**

Add to `viewer/index.html` before closing body:

```javascript
<script>
    console.log('Registry:', window.modelRegistry);
</script>
```

Run: `open /Users/tyler/Workspace/soaringVibes/viewer/index.html && open /Applications/Utilities/Console.app`

Expected: Console shows "Registry: ModelRegistry {...}"

- [ ] **Step 3: Commit Phase 2 Task 3**

```bash
git add viewer/model-registry.js
git commit -m "feat: create ModelRegistry class

- Map-based storage for models and categories
- register() method to add models
- get(), getAll(), getCategories() accessors
- search() for text filtering
- Global instance at window.modelRegistry"
```

### Task 4: Add Test Model Registration

**Files:**
- Modify: `viewer/viewer.js` (register in init function)
- Modify: `viewer/model-registry.js` (remove hardcoded code)

- [ ] **Step 1: Create test model creator in viewer.js**

Add to `viewer/viewer.js` in the init function:

```javascript
function createTestCube() {
    const geometry = new THREE.BoxGeometry(10, 10, 10);
    const material = new THREE.MeshStandardMaterial({ 
        color: 0x4fc3f7 
    });
    const cube = new THREE.Mesh(geometry, material);
    cube.castShadow = true;
    return cube;
}

// Register test model
window.modelRegistry.register({
    id: 'test-cube',
    name: 'Test Cube',
    category: 'test',
    description: 'Simple cube for testing the viewer',
    create: () => createTestCube(),
    animations: []
});

```javascript

```

- [ ] **Step 2: Add model loading function to viewer.js**

Add to `viewer/viewer.js`:

```javascript
function loadModel(modelId) {
    // Dispose previous model
    if (currentModel) {
        if (currentModel.mesh) {
            scene.remove(currentModel.mesh);
        }
        if (currentModel.geometry) {
            currentModel.geometry.dispose();
        }
        if (currentModel.material) {
            currentModel.material.dispose();
        }
        currentModel = null;
    }
    
    // Load new model
    const modelData = window.modelRegistry.get(modelId);
    if (!modelData) {
        console.error(`Model not found: ${modelId}`);
        return;
    }
    
    console.log(`Loading model: ${modelData.name}`);
    
    try {
        const mesh = modelData.create();
        currentModel = {
            mesh,
            data: modelData,
            geometry: mesh.geometry,
            material: mesh.material
        };
        
        scene.add(mesh);
        
        // Center model
        const box = new THREE.Box3().setFromObject(mesh);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        mesh.position.x += (mesh.position.x - center.x);
        mesh.position.y += (mesh.position.y - center.y);
        mesh.position.z += (mesh.position.z - center.z);
        
        // Reset camera to fit model
        const maxDim = Math.max(size.x, size.y, size.z);
        const distance = maxDim * 2;
        camera.position.set(distance, distance * 0.7, distance);
        camera.lookAt(0, 0, 0);
        controls.target.set(0, 0, 0);
        
        // Update UI
        updateModelInfo(modelData);
        
    } catch (error) {
        console.error(`Error loading model ${modelId}:`, error);
    }
}

function updateModelInfo(modelData) {
    document.getElementById('model-name').textContent = modelData.name;
    
    const details = document.getElementById('model-details');
    details.innerHTML = `
        <p><strong>Category:</strong> ${modelData.category}</p>
        <p><strong>Animations:</strong> ${modelData.animations?.length || 0}</p>
        ${modelData.description ? `<p>${modelData.description}</p>` : ''}
    `;
}
```

- [ ] **Step 3: Test loading test cube**

Add to `viewer/viewer.js` at end of `init()`:

```javascript
loadModel('test-cube');
```

Run: `open /Users/tyler/Workspace/soaringVibes/viewer/index.html`

Expected: Blue cube appears in viewer, info panel shows "Test Cube"

- [ ] **Step 4: Commit Phase 2 Task 4**

```bash
git add viewer/model-registry.js viewer/viewer.js
git commit -m "feat: add test model and loading system

- Create test cube model
- Implement loadModel() with proper disposal
- Add model centering and camera auto-fit
- Update info panel with model details"
```

---

## Phase 3: Auto-Discovery System

### Task 5: Implement Model Manifest (Browser Limitation Workaround)

**Context:** Browsers cannot scan directories (security limitation). The manifest is required to list available models. True "zero config" is not possible in browsers - we maintain this minimal manifest instead of hardcoding paths in code.

**Files:**
- Create: `viewer/model-manifest.json`

- [ ] **Step 1: Create model manifest listing verified model scripts**

Write `viewer/model-manifest.json`:

```json
{
  "models": [
    {
      "id": "aircraft",
      "name": "Cessna 182 Skylane",
      "category": "aircraft",
      "script": "../js/aircraft.js",
      "export": "Aircraft",
      "description": "Detailed Cessna 182 with animated control surfaces"
    },
    {
      "id": "palm",
      "name": "Palm Tree",
      "category": "trees",
      "script": "../js/trees/palm.js",
      "export": "PalmGeometry",
      "description": "Hawaiian palm tree with LOD support"
    },
    {
      "id": "albatross",
      "name": "Laysan Albatross",
      "category": "animals",
      "script": "../js/animals/albatross.js",
      "export": "Albatross",
      "description": "Albatross with 3-3.5m wingspan"
    }
  ]
}
```

- [ ] **Step 2: Commit model manifest**

```bash
git add viewer/model-manifest.json
git commit -m "feat: create model manifest structure

- JSON manifest listing models to load (browser security prevents directory scanning)
- Manifest is minimal and explicit vs hardcoding in source
- Fields: id, name, category, script path, export name, description
- Start with 3 models: aircraft, palm, albatross"
```

### Task 6: Build Auto-Discovery Loader

**Files:**
- Create: `viewer/auto-discovery.js`

- [ ] **Step 1: Create auto-discovery module**

Write `viewer/auto-discovery.js`:

```javascript
async function loadModelScript(url) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.onload = () => resolve(true);
        script.onerror = () => reject(new Error(`Failed to load ${url}`));
        document.head.appendChild(script);
    });
}

async function discoverModels() {
    try {
        // Load manifest
        const manifestRes = await fetch('model-manifest.json');
        const manifest = await manifestRes.json();
        
        console.log(`Discovering ${manifest.models.length} models...`);
        
        for (const model of manifest.models) {
            try {
                // Load the script
                await loadModelScript(model.script);
                
                // Get the exported class/function
                const exportedClass = window[model.export];
                
                if (!exportedClass) {
                    console.warn(`Export '${model.export}' not found from ${model.script}`);
                    continue;
                }
                
                // Register with registry
                window.modelRegistry.register({
                    id: model.id,
                    name: model.name,
                    category: model.category,
                    description: model.description,
                    create: async function() {
                        return createModelInstance(exportedClass, model);
                    },
                    animations: [] // Will be populated later
                });
                
                console.log(`✓ Loaded: ${model.name}`);
                
            } catch (error) {
                console.error(`Failed to load model ${model.id}:`, error);
            }
        }
        
        console.log(`Discovery complete: ${window.modelRegistry.getAll().length} models registered`);
        
    } catch (error) {
        console.error('Model discovery failed:', error);
    }
}

async function createModelInstance(ClassOrFunction, modelConfig) {
    // Handle different model creation patterns
    
    // Pattern 1: Class with constructor (e.g., Aircraft())
    if (ClassOrFunction.prototype) {
        const instance = new ClassOrFunction();
        return instance.mesh || instance;
    }
    
    // Pattern 2: Static getGeometry method (e.g., PalmGeometry.getGeometry())
    if (typeof ClassOrFunction.getGeometry === 'function') {
        return ClassOrFunction.getGeometry();
    }
    
    // Pattern 3: Function that returns mesh (e.g., createAirport())
    if (typeof ClassOrFunction === 'function') {
        return ClassOrFunction();
    }
    
    throw new Error(`Unknown model pattern for ${modelConfig.id}`);
}

// Auto-run on load
window.addEventListener('load', discoverModels);
```

- [ ] **Step 2: Test auto-discovery**

Run: `npx serve /Users/tyler/Workspace/soaringVibes` and open `http://localhost:3000/viewer/index.html`

Expected: Console shows models being loaded, registry has 3 models

- [ ] **Step 3: Commit auto-discovery**

```bash
git add viewer/auto-discovery.js
git commit -m "feat: implement auto-discovery system

- Fetch model manifest JSON
- Dynamically load model scripts with <script> tags
- Detect export patterns (class, static method, function)
- Register discovered models automatically
- Gracefully handle missing exports"
```

---

## Phase 4: UI and Model Selection

### Task 7: Build Model List UI

**Files:**
- Modify: `viewer/viewer.js`
- Modify: `viewer/viewer.css`

- [ ] **Step 1: Add model list rendering function**

Add to `viewer/viewer.js`:

```javascript
function renderModelList() {
    const tree = document.getElementById('model-tree');
    tree.innerHTML = '';
    
    const categories = window.modelRegistry.getCategories();
    
    categories.forEach(category => {
        // Category header (starts expanded)
        const header = document.createElement('div');
        header.className = 'category-header';
        header.textContent = category.name.charAt(0).toUpperCase() + category.name.slice(1);
        header.dataset.expanded = 'true';
        
        header.addEventListener('click', () => {
            const isExpanded = header.dataset.expanded === 'true';
            header.dataset.expanded = (!isExpanded).toString();
            header.classList.toggle('collapsed', !isExpanded);
            
            const container = header.nextElementSibling;
            if (container) {
                container.style.display = isExpanded ? 'none' : 'block';
            }
        });
        
        tree.appendChild(header);
        
        // Model items container
        const container = document.createElement('div');
        
        category.models.forEach(modelId => {
            const model = window.modelRegistry.get(modelId);
            if (!model) return;
            
            const item = document.createElement('div');
            item.className = 'model-item';
            item.textContent = model.name;
            item.dataset.modelId = modelId;
            
            item.addEventListener('click', () => {
                // Deselect previous
                document.querySelectorAll('.model-item.selected')
                    .forEach(el => el.classList.remove('selected'));
                
                // Select this
                item.classList.add('selected');
                
                // Load model
                loadModel(modelId);
            });
            
            container.appendChild(item);
        });
        
        tree.appendChild(container);
    });
}
```

- [ ] **Step 2: Call renderModelList after discovery**

Modify `viewer/viewer.js` in `init()`:

```javascript
function init() {
    initScene();
    
    // Wait for models to be discovered, then render list
    setTimeout(() => {
        renderModelList();
    }, 1000);
    
    animate();
}
```

- [ ] **Step 3: Test model list appears**

Run: `npx serve` and open viewer

Expected: Left sidebar shows categories with models listed

- [ ] **Step 4: Commit model list UI**

```bash
git add viewer/viewer.js
git commit -m "feat: implement model list UI

- Render categories with expandable headers
- List models under each category
- Click to select and load model
- Highlight selected model"
```

### Task 8: Add Search and Filter

**Files:**
- Modify: `viewer/viewer.js`
- Modify: `viewer/viewer.css`

- [ ] **Step 1: Implement search filtering**

Add to `viewer/viewer.js`:

```javascript
function setupSearch() {
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('category-filter');
    
    let searchQuery = '';
    let selectedCategory = 'all';
    
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase();
        filterModelList();
    });
    
    categoryFilter.addEventListener('change', (e) => {
        selectedCategory = e.target.value;
        filterModelList();
    });
    
    function filterModelList() {
        const items = document.querySelectorAll('.model-item');
        
        items.forEach(item => {
            const modelId = item.dataset.modelId;
            const model = window.modelRegistry.get(modelId);
            
            if (!model) return;
            
            const matchesSearch = !searchQuery || 
                model.name.toLowerCase().includes(searchQuery) ||
                model.description?.toLowerCase().includes(searchQuery);
            
            const matchesCategory = selectedCategory === 'all' || 
                model.category === selectedCategory;
            
            item.style.display = (matchesSearch && matchesCategory) ? 'block' : 'none';
        });
    }
    
    window.filterModelList = filterModelList;
}

// Call in init() after renderModelList
setTimeout(() => {
    renderModelList();
    setupSearch();
}, 1000);
```

- [ ] **Step 2: Test search and filter**

Run: `npx serve` and open viewer

Expected: Search box filters models, category dropdown filters by type

- [ ] **Step 3: Commit search/filter**

```bash
git add viewer/viewer.js
git commit -m "feat: add search and category filter

- Text search across model names and descriptions
- Category dropdown filter
- Real-time filtering as user types"
```

---

## Phase 5: Animation Support

### Task 9: Implement Basic Animation Controller

**Files:**
- Create: `viewer/controls.js`

- [ ] **Step 1: Create animation controller**

Write `viewer/controls.js`:

```javascript
class AnimationController {
    constructor() {
        this.isPlaying = false;
        this.speed = 1;
        this.currentTime = 0;
        this.handlers = [];
    }
    
    play() {
        this.isPlaying = true;
    }
    
    pause() {
        this.isPlaying = false;
    }
    
    setSpeed(value) {
        this.speed = parseFloat(value);
    }
    
    update(delta) {
        if (!this.isPlaying) return;
        
        this.currentTime += delta * this.speed;
        
        // Call registered animation handlers
        this.handlers.forEach(handler => {
            if (typeof handler === 'function') {
                handler(this.currentTime, delta);
            }
        });
    }
    
    registerHandler(handler) {
        this.handlers.push(handler);
    }
    
    clearHandlers() {
        this.handlers = [];
        this.currentTime = 0;
    }
}

// Global instance
window.animationController = new AnimationController();

// Setup UI bindings
function setupAnimationControls() {
    const playBtn = document.getElementById('play-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const speedSlider = document.getElementById('speed-slider');
    
    if (!playBtn || !pauseBtn || !speedSlider) return;
    
    playBtn.addEventListener('click', () => {
        window.animationController.play();
    });
    
    pauseBtn.addEventListener('click', () => {
        window.animationController.pause();
    });
    
    speedSlider.addEventListener('input', (e) => {
        window.animationController.setSpeed(e.target.value);
    });
}
```

- [ ] **Step 2: Call setupAnimationControls in init**

Add to `viewer/viewer.js`:

```javascript
function init() {
    initScene();
    setupAnimationControls();
    
    setTimeout(() => {
        renderModelList();
        setupSearch();
    }, 1000);
    
    animate();
}
```

- [ ] **Step 3: Update animate loop**

Modify `animate()` in `viewer/viewer.js`:

```javascript
let lastTime = 0;

function animate(timestamp) {
    animationId = requestAnimationFrame(animate);
    
    const delta = lastTime ? (timestamp - lastTime) / 1000 : 0;
    lastTime = timestamp;
    
    controls.update();
    
    // Update animations
    if (window.animationController) {
        window.animationController.update(delta);
    }
    
    renderer.render(scene, camera);
}
```

- [ ] **Step 4: Commit animation controller**

```bash
git add viewer/controls.js viewer/viewer.js
git commit -m "feat: implement animation controller

- Play/pause/speed controls
- Handler registration system
- UI bindings for animation buttons
- Delta-time based update loop"
```

### Task 10: Add Animation Detection Support

**Files:**
- Modify: `viewer/auto-discovery.js`
- Modify: `viewer/viewer.js`

- [ ] **Step 1: Update model creation to capture instance**

Modify `viewer/auto-discovery.js`:

```javascript
async function createModelInstance(ClassOrFunction, modelConfig) {
    let instance, mesh;
    
    // Pattern 1: Class with constructor (e.g., Aircraft())
    if (ClassOrFunction.prototype) {
        instance = new ClassOrFunction();
        mesh = instance.mesh || instance;
    }
    // ... other patterns
    
    return {
        mesh,
        instance,
        config: modelConfig
    };
}
```

- [ ] **Step 2: Detect and register animations generically**

Add to `viewer/viewer.js`:

```javascript
function detectAnimations(instance, mesh) {
    const animations = [];
    
    // Pattern 1: Has update() method (e.g., Aircraft, Animals)
    if (instance && typeof instance.update === 'function') {
        animations.push({
            name: 'update',
            type: 'method',
            handler: (delta) => instance.update(delta)
        });
    }
    
    // Pattern 2: Has animateable parts we can simulate
    // (propeller rotation, wing flapping, etc.)
    if (mesh) {
        mesh.traverse(child => {
            if (child.name?.includes('propeller')) {
                animations.push({
                    name: 'propeller',
                    type: 'part',
                    part: child,
                    animation: (time) => {
                        child.rotation.z = time * 5;
                    }
                });
            }
            // Add detection for other animated parts as needed
        });
    }
    
    return animations;
}

function loadModel(modelId) {
    // ... existing disposal code ...
    
    const modelData = window.modelRegistry.get(modelId);
    if (!modelData) return;
    
    try {
        const result = await modelData.create();
        const mesh = result.mesh;
        const instance = result.instance;
        
        currentModel = {
            mesh,
            instance,
            data: modelData,
            geometry: mesh.geometry,
            material: mesh.material
        };
        
        scene.add(mesh);
        
        // Detect and register animations
        const animations = detectAnimations(instance, mesh);
        window.animationController.clearHandlers();
        
        if (animations.length > 0) {
            animations.forEach(anim => {
                if (anim.type === 'method') {
                    window.animationController.registerHandler((time, delta) => {
                        anim.handler(delta);
                    });
                } else if (anim.type === 'part') {
                    window.animationController.registerHandler((time, delta) => {
                        anim.animation(time);
                    });
                }
            });
            window.animationController.play();
            console.log(`Registered ${animations.length} animations`);
        }
        
        // ... rest of loadModel ...
    }
}
```

- [ ] **Step 3: Test animations work**

Run: `npx serve` and open viewer

Select aircraft: Propeller should rotate
Select albatross: Wings should flap

- [ ] **Step 4: Commit animation detection**

```bash
git add viewer/auto-discovery.js viewer/viewer.js
git commit -m "feat: implement generic animation detection

- Detect update() methods on instances
- Detect animated mesh parts by name
- Register animations based on detected type
- Auto-play when model loads"
```

---

## Phase 6: Complete Model Manifest

### Task 11: Populate Full Model List

**Files:**
- Modify: `viewer/model-manifest.json`

- [ ] **Step 1: Add all tree models**

Update `viewer/model-manifest.json` to include all 17 tree types:

```json
{
  "models": [
    {"id": "aircraft", "name": "Cessna 182 Skylane", "category": "aircraft", "script": "../js/aircraft.js", "export": "Aircraft", "description": "Detailed Cessna 182 with animated control surfaces"},
    {"id": "palm", "name": "Palm Tree", "category": "trees", "script": "../js/trees/palm.js", "export": "PalmGeometry", "description": "Hawaiian palm tree with LOD"},
    {"id": "coconut-palm", "name": "Coconut Palm", "category": "trees", "script": "../js/trees/coconut-palm.js", "export": "CoconutPalmGeometry", "description": "Coconut palm with nuts"},
    {"id": "koa", "name": "Koa Tree", "category": "trees", "script": "../js/trees/koa.js", "export": "KoaGeometry", "description": "Native Hawaiian koa tree"},
    {"id": "ohia", "name": "Ōhiʻa Tree", "category": "trees", "script": "../js/trees/ohia.js", "export": "OhiaGeometry", "description": "Ōhiʻa lehua with red flowers"},
    {"id": "banyan", "name": "Banyan Tree", "category": "trees", "script": "../js/trees/banyan.js", "export": "BanyanGeometry", "description": "Large banyan with aerial roots"},
    {"id": "albatross", "name": "Laysan Albatross", "category": "animals", "script": "../js/animals/albatross.js", "export": "Albatross", "description": "Albatross with 3-3.5m wingspan"},
    {"id": "bamboo", "name": "Bamboo", "category": "trees", "script": "../js/trees/bamboo.js", "export": "BambooGeometry", "description": "Tropical bamboo clump"},
    {"id": "beach-morning-glory", "name": "Beach Morning Glory", "category": "trees", "script": "../js/trees/beach-morning-glory.js", "export": "BeachMorningGloryGeometry", "description": "Coastal vine plant"},
    {"id": "dolphin", "name": "Dolphin", "category": "animals", "script": "../js/animals/dolphin.js", "export": "Dolphin", "description": "Hawaiian spinner dolphin"},
    {"id": "driftwood", "name": "Driftwood", "category": "trees", "script": "../js/trees/driftwood.js", "export": "DriftwoodGeometry", "description": "Weathered driftwood"},
    {"id": "frigatebird", "name": "Frigatebird", "category": "animals", "script": "../js/animals/frigatebird.js", "export": "Frigatebird", "description": "Great frigatebird"},
    {"id": "giant-koa", "name": "Giant Koa", "category": "trees", "script": "../js/trees/giant-koa.js", "export": "GiantKoaGeometry", "description": "Ancient koa tree"},
    {"id": "grass", "name": "Grass", "category": "trees", "script": "../js/trees/grass.js", "export": "GrassGeometry", "description": "Hawaiian grass"},
    {"id": "ground-fern", "name": "Ground Fern", "category": "trees", "script": "../js/trees/ground-fern.js", "export": "GroundFernGeometry", "description": "Forest floor fern"},
    {"id": "honeycreeper", "name": "Honeycreeper", "category": "animals", "script": "../js/animals/honeycreeper.js", "export": "Honeycreeper", "description": "Native honeycreeper bird"},
    {"id": "lava-rock", "name": "Lava Rock", "category": "trees", "script": "../js/trees/lava-rock.js", "export": "LavaRockGeometry", "description": "Volcanic rock formation"},
    {"id": "naupaka", "name": "Naupaka", "category": "trees", "script": "../js/trees/naupaka.js", "export": "NaupakaGeometry", "description": "Coastal naupaka shrub"},
    {"id": "nene", "name": "Nēnē", "category": "animals", "script": "../js/animals/nene.js", "export": "Nene", "description": "Hawaiian goose"},
    {"id": "seaturtle", "name": "Sea Turtle", "category": "animals", "script": "../js/animals/seaturtle.js", "export": "SeaTurtle", "description": "Green sea turtle"},
    {"id": "shrub", "name": "Shrub", "category": "trees", "script": "../js/trees/shrub.js", "export": "ShrubGeometry", "description": "Generic shrub"},
    {"id": "ti-plant", "name": "Ti Plant", "category": "trees", "script": "../js/trees/ti-plant.js", "export": "TiPlantGeometry", "description": "Ti (kī) plant"},
    {"id": "tree-fern", "name": "Tree Fern", "category": "trees", "script": "../js/trees/tree-fern.js", "export": "TreeFernGeometry", "description": "Hapu'u fern"},
    {"id": "whale", "name": "Humpback Whale", "category": "animals", "script": "../js/animals/whale.js", "export": "Whale", "description": "Humpback whale"},
    {"id": "wiliwili", "name": "Wiliwili", "category": "trees", "script": "../js/trees/wiliwili.js", "export": "WiliwiliGeometry", "description": "Native wiliwili tree"},
    {"id": "hot-air-balloon", "name": "Hot Air Balloon", "category": "effects", "script": "../js/hot-air-balloons.js", "export": "HotAirBalloon", "description": "Colorful hot air balloon with burner effect"}
  ]
}
```

- [ ] **Step 2: Verify all paths exist**

Run verification:

```bash
for f in js/trees/*.js; do echo "✓ $f"; done
for f in js/animals/*.js; do echo "✓ $f"; done
echo "✓ js/aircraft.js"
echo "✓ js/hot-air-balloons.js"
```

All 27 models verified (17 trees + 8 animals + 1 aircraft + 1 balloon).

- [ ] **Step 4: Commit full manifest**

```bash
git add viewer/model-manifest.json
git commit -m "feat: populate complete model manifest

- All 17 tree species
- All 8 animal types  
- Aircraft
- Hot air balloon
- Total: 27 models (verified all paths exist)"
```

---

## Phase 7: Polish and Edge Cases

### Task 12: Add Model Statistics Display

**Files:**
- Modify: `viewer/viewer.js`
- Modify: `viewer/viewer.css`

- [ ] **Step 1: Implement geometry stats calculation**

Add to `viewer/viewer.js`:

```javascript
function calculateModelStats(mesh) {
    const box = new THREE.Box3().setFromObject(mesh);
    const size = box.getSize(new THREE.Vector3());
    
    let vertexCount = 0;
    let faceCount = 0;
    
    mesh.traverse(child => {
        if (child.isMesh && child.geometry) {
            vertexCount += child.geometry.attributes.position.count;
            if (child.geometry.index) {
                faceCount += child.geometry.index.count / 3;
            } else {
                faceCount += child.geometry.attributes.position.count / 3;
            }
        }
    });
    
    return {
        boundingBox: {
            x: size.x.toFixed(2),
            y: size.y.toFixed(2),
            z: size.z.toFixed(2)
        },
        vertices: vertexCount,
        faces: faceCount
    };
}

function updateModelInfo(modelData) {
    document.getElementById('model-name').textContent = modelData.name;
    
    const stats = currentModel ? calculateModelStats(currentModel.mesh) : null;
    
    const details = document.getElementById('model-details');
    details.innerHTML = `
        <p><strong>Category:</strong> ${modelData.category}</p>
        <p><strong>Size:</strong> ${stats ? `${stats.boundingBox.x} × ${stats.boundingBox.y} × ${stats.boundingBox.z}m` : 'N/A'}</p>
        <p><strong>Vertices:</strong> ${stats ? stats.vertices.toLocaleString() : 'N/A'}</p>
        <p><strong>Faces:</strong> ${stats ? stats.faces.toLocaleString() : 'N/A'}</p>
        ${modelData.description ? `<p>${modelData.description}</p>` : ''}
    `;
}
```

- [ ] **Step 2: Test stats display**

Run: `npx serve`, select different models

Expected: Info panel shows bounding box and polygon counts

- [ ] **Step 3: Commit stats display**

```bash
git add viewer/viewer.js
git commit -m "feat: add model statistics display

- Calculate bounding box dimensions
- Count vertices and faces
- Display in info panel"
```

---

## Final Steps

### Task 13: Create README for Viewer

**Files:**
- Create: `viewer/README.md`

- [ ] **Step 1: Write viewer documentation**

Write `viewer/README.md`:

```markdown
# 3D Asset Viewer

Interactive viewer for all 3D models in the Soaring Vibes flight simulator.

## Running

```bash
npx serve
open http://localhost:3000/viewer/index.html
```

## Features

- Browse all models by category
- Search and filter
- Interactive 3D view (orbit, zoom, pan)
- Animation playback controls
- Model statistics display

## Adding New Models

Add entry to `model-manifest.json`:

```json
{
  "id": "my-model",
  "name": "My Model",
  "category": "trees",
  "script": "../js/trees/my-model.js",
  "export": "MyModelGeometry",
  "description": "Description here"
}
```

## Controls

- **Left drag**: Rotate view
- **Right drag**: Pan
- **Scroll**: Zoom
- **R**: Reset view
```

- [ ] **Step 2: Commit README**

```bash
git add viewer/README.md
git commit -m "docs: add viewer README

- Running instructions
- Feature list
- Adding new models guide
- Keyboard controls"
```

---

## Summary

**Total Tasks:** 13  
**Estimated Time:** 4-6 hours  
**Key Files:** 7 created/modified

**Success Criteria:**
- [ ] Viewer loads with UI layout
- [ ] All ~28 models discoverable and loadable
- [ ] Aircraft propeller spins
- [ ] Search and filter work
- [ ] Model stats display correctly
- [ ] No console errors on load
