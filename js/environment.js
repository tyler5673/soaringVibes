// ========== ENVIRONMENT ==========
function createSky(scene) {
    const sunGeo = new THREE.SphereGeometry(400, 32, 32);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const sun = new THREE.Mesh(sunGeo, sunMat);
    sun.position.set(8000, 6000, -10000);
    scene.add(sun);
    
    const sunLight = new THREE.DirectionalLight(0xffffee, 1.2);
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
    
    const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x006994, 0.6);
    scene.add(hemiLight);
}

let oceanMesh;

function createOcean(scene) {
    const geometry = new THREE.PlaneGeometry(20000, 20000, 128, 128);
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
    const positions = oceanMesh.geometry.attributes.position;
    const original = oceanMesh.userData.originalPositions;
    
    for (let i = 0; i < positions.count; i++) {
        const x = original[i * 3];
        const y = original[i * 3 + 1];
        
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
    constructor(scene, count = 50) {
        this.clouds = [];
        this.scene = scene;
        
        for (let i = 0; i < count; i++) {
            this.createCloud();
        }
    }
    
    createCloud() {
        const cloudGroup = new THREE.Group();
        
        const puffCount = 5 + Math.floor(Math.random() * 5);
        const puffGeo = new THREE.SphereGeometry(1, 8, 8);
        const puffMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.9,
            roughness: 1
        });
        
        for (let i = 0; i < puffCount; i++) {
            const puff = new THREE.Mesh(puffGeo, puffMat);
            puff.position.set(
                (Math.random() - 0.5) * 30,
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 20
            );
            puff.scale.setScalar(10 + Math.random() * 15);
            cloudGroup.add(puff);
        }
        
        cloudGroup.position.set(
            (Math.random() - 0.5) * 40000,
            500 + Math.random() * 1500,
            (Math.random() - 0.5) * 40000
        );
        
        cloudGroup.userData.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 10,
            0,
            (Math.random() - 0.5) * 5
        );
        
        this.scene.add(cloudGroup);
        this.clouds.push(cloudGroup);
    }
    
    update(delta) {
        this.clouds.forEach(cloud => {
            cloud.position.x += cloud.userData.velocity.x * delta;
            cloud.position.z += cloud.userData.velocity.z * delta;
            
            if (cloud.position.x > 20000) cloud.position.x = -20000;
            if (cloud.position.x < -20000) cloud.position.x = 20000;
            if (cloud.position.z > 20000) cloud.position.z = -20000;
            if (cloud.position.z < -20000) cloud.position.z = 20000;
        });
    }
}
