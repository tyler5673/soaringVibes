// ========== ENVIRONMENT ==========
function createSky(scene) {
    const sunGeo = new THREE.SphereGeometry(400, 32, 32);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xffffcc });
    const sun = new THREE.Mesh(sunGeo, sunMat);
    sun.position.set(8000, 6000, -10000);
    scene.add(sun);
    
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
    sunLight.position.copy(sun.position);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 100;
    sunLight.shadow.camera.far = 20000;
    sunLight.shadow.camera.left = -2000;
    sunLight.shadow.camera.right = 2000;
    sunLight.shadow.camera.top = 2000;
    sunLight.shadow.camera.bottom = -2000;
    scene.add(sunLight);
    
    const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x006994, 0.8);
    scene.add(hemiLight);
}

let oceanMesh;
let cameraReference = null;

function createOcean(scene, camera) {
    cameraReference = camera;
    
    // Create ocean that follows camera - much larger to cover all islands
    const geometry = new THREE.PlaneGeometry(40000, 40000, 256, 256);
    const material = new THREE.MeshStandardMaterial({
        color: 0x006994,
        roughness: 0.3,
        metalness: 0.1,
        flatShading: false
    });
    oceanMesh = new THREE.Mesh(geometry, material);
    oceanMesh.rotation.x = -Math.PI / 2;
    oceanMesh.position.y = 2;
    oceanMesh.receiveShadow = true;
    oceanMesh.userData.originalPositions = geometry.attributes.position.array.slice();
    scene.add(oceanMesh);
}

function updateOceanWaves(time) {
    if (!oceanMesh) return;
    
    // Make ocean follow camera horizontally (infinite ocean effect)
    if (cameraReference && cameraReference.position) {
        const camPos = cameraReference.position;
        // Snap to grid to avoid jitter
        const gridSize = 1000;
        oceanMesh.position.x = Math.floor(camPos.x / gridSize) * gridSize;
        oceanMesh.position.z = Math.floor(camPos.z / gridSize) * gridSize;
    }
    
    const positions = oceanMesh.geometry.attributes.position;
    const original = oceanMesh.userData.originalPositions;
    
    for (let i = 0; i < positions.count; i++) {
        const x = original[i * 3] + oceanMesh.position.x;
        const y = original[i * 3 + 1] + oceanMesh.position.z;
        
        const wave1 = Math.sin(x * 0.003 + time * 0.8) * Math.cos(y * 0.003 + time * 0.5) * 0.5;
        const wave2 = Math.sin(x * 0.008 + y * 0.006 + time * 1.2) * 0.25;
        const wave3 = Math.cos(x * 0.001 - y * 0.002 + time * 0.3) * 0.4;
        
        positions.setZ(i, wave1 + wave2 + wave3);
    }
    positions.needsUpdate = true;
    oceanMesh.geometry.computeVertexNormals();
}

// ========== CLOUDS ==========
class CloudSystem {
    constructor(scene, count = 100) {
        this.clouds = [];
        this.scene = scene;
        this.bounds = 12000;
        
        const islandPositions = [
            { x: 0, z: 0 },
            { x: 3200, z: -6400 },
            { x: -6400, z: -2800 },
            { x: -12000, z: -4000 },
            { x: -1400, z: -3600 },
            { x: 1400, z: -3200 },
            { x: -9600, z: -4800 },
            { x: 2200, z: -2200 }
        ];
        
        for (let i = 0; i < count; i++) {
            let x, z;
            
            const island = islandPositions[Math.floor(Math.random() * islandPositions.length)];
            const radius = 1000 + Math.random() * 4000;
            const angle = Math.random() * Math.PI * 2;
            x = island.x + Math.cos(angle) * radius;
            z = island.z + Math.sin(angle) * radius;
            
            this.createCloud(x, z);
        }
    }
    
    createCloud(x, z) {
        const cloudGroup = new THREE.Group();
        
        const puffCount = 10 + Math.floor(Math.random() * 20);
        const baseSize = 120 + Math.random() * 100;
        const spread = 80 + Math.random() * 80;
        
        const puffGeo = new THREE.SphereGeometry(1, 12, 12);
        
        for (let i = 0; i < puffCount; i++) {
            const opacity = 0.8 + Math.random() * 0.2;
            const puffMat = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: opacity,
                roughness: 0.5,
                depthWrite: false
            });
            
            const puff = new THREE.Mesh(puffGeo, puffMat);
            
            const theta = Math.random() * Math.PI * 2;
            const r = Math.random() * spread;
            
            puff.position.set(
                Math.cos(theta) * r,
                (Math.random() - 0.5) * spread * 0.6,
                Math.sin(theta) * r
            );
            
            const scale = baseSize * (0.4 + Math.random() * 0.6);
            puff.scale.set(scale, scale * (0.5 + Math.random() * 0.5), scale);
            
            cloudGroup.add(puff);
        }
        
        const altitude = 200 + Math.random() * 1200;
        cloudGroup.position.set(x, altitude, z);
        
        const speed = 2 + Math.random() * 8;
        const dir = Math.random() * Math.PI * 2;
        
        cloudGroup.userData = {
            velocity: new THREE.Vector3(Math.cos(dir) * speed, 0, Math.sin(dir) * speed),
            bobPhase: Math.random() * Math.PI * 2,
            bobSpeed: 0.5 + Math.random() * 0.5,
            bobAmount: 3 + Math.random() * 4,
            baseY: altitude
        };
        
        this.scene.add(cloudGroup);
        this.clouds.push(cloudGroup);
    }
    
    update(delta, time) {
        this.clouds.forEach(cloud => {
            const ud = cloud.userData;
            
            cloud.position.x += ud.velocity.x * delta;
            cloud.position.z += ud.velocity.z * delta;
            cloud.position.y = ud.baseY + Math.sin(time * ud.bobSpeed + ud.bobPhase) * ud.bobAmount;
            
            const b = this.bounds;
            if (cloud.position.x > b) cloud.position.x = -b;
            if (cloud.position.x < -b) cloud.position.x = b;
            if (cloud.position.z > b) cloud.position.z = -b;
            if (cloud.position.z < -b) cloud.position.z = b;
        });
    }
    
    rebuild(count) {
        const islandPositions = [
            { x: 0, z: 0 },
            { x: 3200, z: -6400 },
            { x: -6400, z: -2800 },
            { x: -12000, z: -4000 },
            { x: -1400, z: -3600 },
            { x: 1400, z: -3200 },
            { x: -9600, z: -4800 },
            { x: 2200, z: -2200 }
        ];
        
        while (this.clouds.length > count) {
            const cloud = this.clouds.pop();
            this.scene.remove(cloud);
            cloud.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
        }
        
        while (this.clouds.length < count) {
            const island = islandPositions[Math.floor(Math.random() * islandPositions.length)];
            const radius = 1000 + Math.random() * 4000;
            const angle = Math.random() * Math.PI * 2;
            this.createCloud(
                island.x + Math.cos(angle) * radius,
                island.z + Math.sin(angle) * radius
            );
        }
    }
}
