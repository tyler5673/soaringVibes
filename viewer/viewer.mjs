// 3D Asset Viewer - ES Module Version
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

console.log('Asset Viewer loaded');

// State
let scene, camera, renderer, controls;
let currentModel = null;
let animationId = null;
let lastTime = 0;
let animationPlaying = true;
let animationSpeed = 1;

// Registry
const modelRegistry = {
    models: new Map(),
    categories: new Map(),
    
    register(model) {
        this.models.set(model.id, model);
        const cat = model.category || 'other';
        if (!this.categories.has(cat)) this.categories.set(cat, []);
        this.categories.get(cat).push(model.id);
        console.log(`Registered: ${model.name}`);
    },
    
    get(id) { return this.models.get(id); },
    getAll() { return Array.from(this.models.values()); },
    getCategories() {
        return Array.from(this.categories.entries()).map(([name, ids]) => ({ name, ids }));
    }
};

// Scene Setup
function initScene() {
    const container = document.getElementById('viewer-container');
    const w = container.clientWidth;
    const h = container.clientHeight;
    
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    
    camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 10000);
    camera.position.set(20, 15, 20);
    
    renderer = new THREE.WebGLRenderer({
        canvas: document.getElementById('webgl-canvas'),
        antialias: true
    });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(50, 100, 50);
    dirLight.castShadow = true;
    scene.add(dirLight);
    
    // Grid
    const grid = new THREE.GridHelper(100, 20, 0x444466, 0x333355);
    scene.add(grid);
    
    // Controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 5;
    controls.maxDistance = 500;
    
    window.addEventListener('resize', onResize);
}

function onResize() {
    const container = document.getElementById('viewer-container');
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
}

function animate(timestamp) {
    animationId = requestAnimationFrame(animate);
    const delta = lastTime ? (timestamp - lastTime) / 1000 : 0.016;
    lastTime = timestamp;
    
    controls.update();
    
    // Update current model animations
    if (currentModel?.instance?.update && animationPlaying) {
        currentModel.instance.update(delta * animationSpeed);
    }
    
    // Simple prop animation for test cube
    if (currentModel?.mesh?.name === 'test' && animationPlaying) {
        currentModel.mesh.rotation.y += delta * animationSpeed;
    }
    
    renderer.render(scene, camera);
}

// Model Loading
function loadModel(id) {
    const model = modelRegistry.get(id);
    if (!model) return;
    
    // Remove old
    if (currentModel?.mesh) {
        scene.remove(currentModel.mesh);
    }
    
    try {
        const result = model.create();
        const mesh = result.mesh || result;
        const instance = result.instance;
        
        // Center model
        const box = new THREE.Box3().setFromObject(mesh);
        const center = box.getCenter(new THREE.Vector3());
        mesh.position.sub(center);
        
        currentModel = { mesh, instance, data: model };
        scene.add(mesh);
        
        // Fit camera
        const size = box.getSize(new THREE.Vector3());
        const dist = Math.max(size.x, size.y, size.z) * 2;
        camera.position.set(dist, dist * 0.7, dist);
        controls.target.set(0, 0, 0);
        
        // Update UI
        document.getElementById('model-name').textContent = model.name;
        document.getElementById('model-category').textContent = `• ${model.category}`;
        document.getElementById('model-stats').textContent = 
            `${size.x.toFixed(1)} × ${size.y.toFixed(1)} × ${size.z.toFixed(1)}`;
        
        console.log(`Loaded: ${model.name}`);
    } catch (e) {
        console.error(`Failed to load ${id}:`, e);
    }
}

// Render Model List
function renderModelList() {
    const list = document.getElementById('model-list');
    list.innerHTML = '';
    
    const cats = modelRegistry.getCategories();
    
    cats.forEach(cat => {
        const section = document.createElement('div');
        section.className = 'category-section';
        
        const header = document.createElement('div');
        header.className = 'category-header';
        header.textContent = cat.name.charAt(0).toUpperCase() + cat.name.slice(1);
        header.onclick = () => {
            section.classList.toggle('collapsed');
        };
        section.appendChild(header);
        
        const items = document.createElement('div');
        items.className = 'category-items';
        
        cat.ids.forEach(id => {
            const model = modelRegistry.get(id);
            const item = document.createElement('div');
            item.className = 'model-item';
            item.textContent = model.name;
            item.onclick = () => {
                document.querySelectorAll('.model-item').forEach(el => el.classList.remove('selected'));
                item.classList.add('selected');
                loadModel(id);
            };
            items.appendChild(item);
        });
        
        section.appendChild(items);
        list.appendChild(section);
    });
    
    console.log(`Rendered ${modelRegistry.getAll().length} models`);
}

// Add sample models for testing
function addSampleModels() {
    // Test Cube
    modelRegistry.register({
        id: 'test',
        name: 'Test Cube',
        category: 'test',
        create: () => {
            const geo = new THREE.BoxGeometry(10, 10, 10);
            const mat = new THREE.MeshStandardMaterial({ color: 0x4fc3f7 });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.name = 'test';
            mesh.castShadow = true;
            return { mesh };
        }
    });
    
    // Palm Tree
    modelRegistry.register({
        id: 'palm',
        name: 'Palm Tree',
        category: 'trees',
        create: () => {
            const group = new THREE.Group();
            const trunk = new THREE.Mesh(
                new THREE.CylinderGeometry(0.3, 0.5, 10, 8),
                new THREE.MeshStandardMaterial({ color: 0x8B4513 })
            );
            trunk.position.y = 5;
            group.add(trunk);
            const leaves = new THREE.Mesh(
                new THREE.ConeGeometry(3, 4, 8),
                new THREE.MeshStandardMaterial({ color: 0x228B22 })
            );
            leaves.position.y = 12;
            group.add(leaves);
            return { mesh: group };
        }
    });
    
    // Cessna (simple)
    modelRegistry.register({
        id: 'cessna',
        name: 'Cessna 182',
        category: 'aircraft',
        create: () => {
            const group = new THREE.Group();
            const body = new THREE.Mesh(
                new THREE.CylinderGeometry(0.5, 0.3, 8, 12),
                new THREE.MeshStandardMaterial({ color: 0xffffff })
            );
            body.rotation.x = Math.PI / 2;
            group.add(body);
            const wing = new THREE.Mesh(
                new THREE.BoxGeometry(10, 0.1, 1.5),
                new THREE.MeshStandardMaterial({ color: 0xffffff })
            );
            group.add(wing);
            const prop = new THREE.Mesh(
                new THREE.BoxGeometry(2, 0.1, 0.3),
                new THREE.MeshStandardMaterial({ color: 0x333333 })
            );
            prop.name = 'propeller';
            prop.position.z = -4.5;
            group.add(prop);
            return { mesh: group };
        }
    });
    
    // Bird
    modelRegistry.register({
        id: 'bird',
        name: 'Seagull',
        category: 'animals',
        create: () => {
            const group = new THREE.Group();
            const body = new THREE.Mesh(
                new THREE.SphereGeometry(0.5, 8, 8),
                new THREE.MeshStandardMaterial({ color: 0xffffff })
            );
            group.add(body);
            const wing = new THREE.Mesh(
                new THREE.BoxGeometry(3, 0.1, 0.5),
                new THREE.MeshStandardMaterial({ color: 0xffffff })
            );
            wing.name = 'wingL';
            wing.position.x = 0;
            group.add(wing);
            return { mesh: group };
        }
    });
    
    // Hot Air Balloon
    modelRegistry.register({
        id: 'balloon',
        name: 'Hot Air Balloon',
        category: 'effects',
        create: () => {
            const group = new THREE.Group();
            const envelope = new THREE.Mesh(
                new THREE.SphereGeometry(5, 16, 16),
                new THREE.MeshStandardMaterial({ color: 0xff6b35 })
            );
            envelope.scale.y = 1.5;
            envelope.position.y = 10;
            group.add(envelope);
            const basket = new THREE.Mesh(
                new THREE.BoxGeometry(2, 1.5, 2),
                new THREE.MeshStandardMaterial({ color: 0x8D6E63 })
            );
            basket.position.y = 1;
            group.add(basket);
            return { mesh: group };
        }
    });
}

// Controls
function setupControls() {
    document.getElementById('play-btn').onclick = () => {
        animationPlaying = true;
    };
    document.getElementById('pause-btn').onclick = () => {
        animationPlaying = false;
    };
    document.getElementById('speed-slider').oninput = (e) => {
        animationSpeed = parseFloat(e.target.value);
    };
    document.getElementById('search-input').oninput = (e) => {
        const q = e.target.value.toLowerCase();
        document.querySelectorAll('.model-item').forEach(item => {
            const model = modelRegistry.get(item.dataset.id);
            item.style.display = !q || model?.name.toLowerCase().includes(q) ? '' : 'none';
        });
    };
    document.getElementById('category-filter').onchange = (e) => {
        const cat = e.target.value;
        document.querySelectorAll('.category-section').forEach(sec => {
            const header = sec.querySelector('.category-header');
            const catName = header.textContent.toLowerCase();
            sec.style.display = cat === 'all' || catName === cat ? '' : 'none';
        });
    };
}

// Load external models from manifest
async function loadExternalModels() {
    try {
        const res = await fetch('model-manifest.json');
        const manifest = await res.json();
        
        // Load deps first
        const deps = ['../js/utils.js', '../js/animals/animal-base.js'];
        for (const dep of deps) {
            await new Promise((resolve, reject) => {
                const s = document.createElement('script');
                s.src = dep;
                s.onload = resolve;
                s.onerror = () => { console.warn('Dep failed:', dep); resolve(); };
                document.head.appendChild(s);
            });
        }
        
        // Load models
        for (const m of manifest.models) {
            await new Promise((resolve) => {
                const s = document.createElement('script');
                s.src = m.script;
                s.onload = () => {
                    let cls = window[m.export];
                    if (!cls && m.export === 'Aircraft') cls = window.Aircraft;
                    if (!cls && m.export === 'Albatross') cls = window.Albatross;
                    if (!cls && m.export === 'PalmGeometry') cls = window.PalmGeometry;
                    
                    if (cls) {
                        modelRegistry.register({
                            id: m.id,
                            name: m.name,
                            category: m.category,
                            create: () => {
                                let instance, mesh;
                                if (cls.prototype) {
                                    instance = new cls();
                                    mesh = instance.mesh || instance;
                                } else if (cls.getGeometry) {
                                    mesh = cls.getGeometry();
                                } else if (typeof cls === 'function') {
                                    mesh = cls();
                                }
                                return { mesh, instance };
                            }
                        });
                    }
                    resolve();
                };
                s.onerror = () => { console.warn('Model failed:', m.id); resolve(); };
                document.head.appendChild(s);
            });
        }
    } catch (e) {
        console.error('Failed to load manifest:', e);
    }
}

// Init
async function init() {
    console.log('Initializing...');
    
    initScene();
    setupControls();
    addSampleModels();
    
    // Try to load external models
    await loadExternalModels();
    
    // Render UI
    renderModelList();
    
    // Load first model
    loadModel('test');
    
    // Start loop
    animate(0);
    
    console.log('Ready!');
}

init();
