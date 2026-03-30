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
    animate();
}

init();
