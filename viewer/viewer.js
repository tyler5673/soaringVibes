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

function animate() {
    animationId = requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

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
    
    animate();
}

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

init();
