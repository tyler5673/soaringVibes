// Main viewer application
console.log('Asset Viewer loaded');

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

let lastTime = 0;

function init() {
    initScene();
    
    // Register test model
    function createTestCube() {
        const geometry = new THREE.BoxGeometry(10, 10, 10);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0x4fc3f7 
        });
        const cube = new THREE.Mesh(geometry, material);
        cube.castShadow = true;
        return cube;
    }

    window.modelRegistry.register({
        id: 'test-cube',
        name: 'Test Cube',
        category: 'test',
        description: 'Simple cube for testing the viewer',
        create: () => createTestCube(),
        animations: []
    });
    
    // Load and display test cube
    loadModel('test-cube');
    
    // Wait for models to be discovered, then render list
    // Retry until models are loaded
    function tryRenderList() {
        const modelCount = window.modelRegistry.getAll().length;
        const tree = document.getElementById('model-tree');
        
        if (modelCount > 1) { // More than just the test cube
            renderModelList();
            setupSearch();
            console.log(`Rendered ${modelCount} models in sidebar`);
        } else {
            tree.innerHTML = '<div style="padding: 20px; text-align: center; color: rgba(255,255,255,0.5);">Loading models...</div>';
            setTimeout(tryRenderList, 500); // Retry in 500ms
        }
    }
    
    // Show loading initially
    document.getElementById('model-tree').innerHTML = '<div style="padding: 20px; text-align: center; color: rgba(255,255,255,0.5);">Loading models...</div>';
    
    // Start trying to render
    setTimeout(tryRenderList, 500);
    
    animate();
}

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

function loadModel(modelId) {
    // Dispose previous model
    if (currentModel) {
        if (currentModel.mesh) {
            scene.remove(currentModel.mesh);
        }
        currentModel = null;
        
        // Clear animation handlers
        if (window.animationController) {
            window.animationController.clearHandlers();
        }
    }
    
    // Load new model
    const modelData = window.modelRegistry.get(modelId);
    if (!modelData) {
        console.error(`Model not found: ${modelId}`);
        return;
    }
    
    console.log(`Loading model: ${modelData.name}`);
    
    // Use Promise to handle async model creation
    Promise.resolve(modelData.create()).then(result => {
        const mesh = result.mesh;
        const instance = result.instance;
        
        currentModel = {
            mesh,
            instance,
            data: modelData
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
        
        // Detect and register animations
        detectAndRegisterAnimations(instance, mesh);
        
    }).catch(error => {
        console.error(`Error loading model ${modelId}:`, error);
    });
}

function detectAndRegisterAnimations(instance, mesh) {
    if (!window.animationController) return;
    
    let animationCount = 0;
    
    // Pattern 1: Has update() method (e.g., Aircraft, Animals)
    if (instance && typeof instance.update === 'function') {
        window.animationController.registerHandler((time, delta) => {
            instance.update(delta);
        });
        animationCount++;
        console.log('Animation: registered instance.update()');
    }
    
    // Pattern 2: Has animateable parts by name
    if (mesh) {
        mesh.traverse(child => {
            // Propeller rotation
            if (child.name?.toLowerCase().includes('propeller') || 
                child.name === 'propeller') {
                window.animationController.registerHandler((time, delta) => {
                    child.rotation.z += delta * 10; // Rotate 10 rad/s
                });
                animationCount++;
                console.log('Animation: registered propeller rotation');
            }
            
            // Wing flapping (for birds)
            if (child.name?.toLowerCase().includes('wing')) {
                const initialRotX = child.rotation.x;
                window.animationController.registerHandler((time, delta) => {
                    child.rotation.x = initialRotX + Math.sin(time * 5) * 0.3;
                });
                animationCount++;
                console.log('Animation: registered wing flapping');
            }
        });
    }
    
    // Auto-play if animations were found
    if (animationCount > 0) {
        window.animationController.play();
        console.log(`Animation: ${animationCount} animations registered, auto-playing`);
    } else {
        console.log('Animation: no animations detected for this model');
    }
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

init();
