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
    constructor(scene, count = 80) {
        this.clouds = [];
        this.scene = scene;
        this.bounds = 25000;
        
        const islandPositions = [
            { x: 0, z: 0 },
            { x: 4800, z: -9600 },
            { x: -9600, z: -4200 },
            { x: -18000, z: -6000 },
            { x: -2100, z: -5400 },
            { x: 2100, z: -4800 },
            { x: -14400, z: -7200 },
            { x: 3300, z: -3300 }
        ];
        
        for (let i = 0; i < count; i++) {
            let x, z;
            
            if (Math.random() < 0.6) {
                const island = islandPositions[Math.floor(Math.random() * islandPositions.length)];
                const radius = 3000 + Math.random() * 8000;
                const angle = Math.random() * Math.PI * 2;
                x = island.x + Math.cos(angle) * radius;
                z = island.z + Math.sin(angle) * radius;
            } else {
                x = (Math.random() - 0.5) * this.bounds * 2;
                z = (Math.random() - 0.5) * this.bounds * 2;
            }
            
            this.createCloud(x, z);
        }
    }
    
    createCloud(x, z) {
        const cloudGroup = new THREE.Group();
        
        const type = Math.random();
        let baseSize, puffCount, spread;
        
        if (type < 0.4) {
            baseSize = 40 + Math.random() * 30;
            puffCount = 8 + Math.floor(Math.random() * 6);
            spread = 50;
        } else if (type < 0.7) {
            baseSize = 60 + Math.random() * 40;
            puffCount = 12 + Math.floor(Math.random() * 8);
            spread = 70;
        } else {
            baseSize = 80 + Math.random() * 50;
            puffCount = 15 + Math.floor(Math.random() * 10);
            spread = 90;
        }
        
        const puffGeo = new THREE.SphereGeometry(1, 12, 12);
        const puffMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.85,
            roughness: 1,
            depthWrite: false
        });
        
        for (let i = 0; i < puffCount; i++) {
            const puff = new THREE.Mesh(puffGeo, puffMat.clone());
            
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI * 0.5;
            const r = Math.random() * spread;
            
            puff.position.set(
                Math.sin(phi) * Math.cos(theta) * r,
                (Math.random() - 0.3) * spread * 0.4,
                Math.sin(phi) * Math.sin(theta) * r
            );
            
            const scale = baseSize * (0.4 + Math.random() * 0.6);
            puff.scale.set(scale, scale * (0.6 + Math.random() * 0.4), scale);
            
            puff.material.opacity = 0.6 + Math.random() * 0.35;
            cloudGroup.add(puff);
        }
        
        const altitude = 200 + Math.random() * 2000;
        cloudGroup.position.set(x, altitude, z);
        
        const baseSpeed = 5 + Math.random() * 15;
        const baseDir = Math.random() * Math.PI * 2;
        
        cloudGroup.userData = {
            velocity: new THREE.Vector3(
                Math.cos(baseDir) * baseSpeed,
                (Math.random() - 0.5) * 0.5,
                Math.sin(baseDir) * baseSpeed
            ),
            rotationSpeed: (Math.random() - 0.5) * 0.01,
            bobPhase: Math.random() * Math.PI * 2,
            bobSpeed: 0.5 + Math.random() * 0.5,
            bobAmount: 2 + Math.random() * 3,
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
            
            cloud.rotation.y += ud.rotationSpeed * delta;
            
            const b = this.bounds;
            if (cloud.position.x > b) cloud.position.x = -b;
            if (cloud.position.x < -b) cloud.position.x = b;
            if (cloud.position.z > b) cloud.position.z = -b;
            if (cloud.position.z < -b) cloud.position.z = b;
        });
    }
}
