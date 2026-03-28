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
    constructor(scene, count = 180) {
        this.clouds = [];
        this.scene = scene;
        this.bounds = 20000;
        
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
            
            if (Math.random() < 0.7) {
                const island = islandPositions[Math.floor(Math.random() * islandPositions.length)];
                const radius = 1500 + Math.random() * 6000;
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
        let baseSize, puffCount, spread, layers;
        
        if (type < 0.3) {
            baseSize = 35 + Math.random() * 25;
            puffCount = 12 + Math.floor(Math.random() * 8);
            spread = 60;
            layers = 2;
        } else if (type < 0.6) {
            baseSize = 55 + Math.random() * 35;
            puffCount = 18 + Math.floor(Math.random() * 10);
            spread = 80;
            layers = 3;
        } else if (type < 0.85) {
            baseSize = 75 + Math.random() * 45;
            puffCount = 25 + Math.floor(Math.random() * 12);
            spread = 100;
            layers = 4;
        } else {
            baseSize = 100 + Math.random() * 60;
            puffCount = 35 + Math.floor(Math.random() * 15);
            spread = 130;
            layers = 5;
        }
        
        const puffGeo = new THREE.SphereGeometry(1, 16, 16);
        
        for (let layer = 0; layer < layers; layer++) {
            const layerOffset = (layer - layers / 2) * spread * 0.25;
            const layerScale = 1 - layer * 0.15;
            const puffsInLayer = Math.floor(puffCount / layers);
            
            for (let i = 0; i < puffsInLayer; i++) {
                const shade = 0.92 + Math.random() * 0.08;
                const                 const puffMat = new THREE.MeshStandardMaterial({
                    color: new THREE.Color(shade, shade, shade),
                    transparent: true,
                    opacity: 0.85 + Math.random() * 0.15,
                    roughness: 1,
                    depthWrite: false
                });
                
                const puff = new THREE.Mesh(puffGeo, puffMat);
                
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.random() * Math.PI * 0.55;
                const r = Math.random() * spread * layerScale;
                
                puff.position.set(
                    Math.sin(phi) * Math.cos(theta) * r + (Math.random() - 0.5) * 20,
                    layerOffset + (Math.random() - 0.4) * spread * 0.3,
                    Math.sin(phi) * Math.sin(theta) * r + (Math.random() - 0.5) * 20
                );
                
                const scale = baseSize * layerScale * (0.35 + Math.random() * 0.65);
                const squash = 0.5 + Math.random() * 0.5;
                puff.scale.set(scale, scale * squash, scale);
                
                cloudGroup.add(puff);
            }
        }
        
        const altitude = 300 + Math.random() * 1500;
        cloudGroup.position.set(x, altitude, z);
        
        const baseSpeed = 3 + Math.random() * 12;
        const baseDir = Math.random() * Math.PI * 2;
        
        cloudGroup.userData = {
            velocity: new THREE.Vector3(
                Math.cos(baseDir) * baseSpeed,
                (Math.random() - 0.5) * 0.3,
                Math.sin(baseDir) * baseSpeed
            ),
            rotationSpeedX: (Math.random() - 0.5) * 0.008,
            rotationSpeedY: (Math.random() - 0.5) * 0.012,
            rotationSpeedZ: (Math.random() - 0.5) * 0.006,
            bobPhaseX: Math.random() * Math.PI * 2,
            bobPhaseY: Math.random() * Math.PI * 2,
            bobSpeedX: 0.3 + Math.random() * 0.4,
            bobSpeedY: 0.4 + Math.random() * 0.3,
            bobAmountX: 1.5 + Math.random() * 2,
            bobAmountY: 1 + Math.random() * 1.5,
            baseY: altitude,
            time: Math.random() * 100
        };
        
        this.scene.add(cloudGroup);
        this.clouds.push(cloudGroup);
    }
    
    update(delta, time) {
        this.clouds.forEach(cloud => {
            const ud = cloud.userData;
            
            cloud.position.x += ud.velocity.x * delta;
            cloud.position.y += ud.velocity.y * delta;
            cloud.position.z += ud.velocity.z * delta;
            
            const t = time + ud.time;
            cloud.position.x = cloud.position.x + Math.sin(t * ud.bobSpeedX + ud.bobPhaseX) * ud.bobAmountX * delta;
            cloud.position.y = ud.baseY + Math.sin(t * ud.bobSpeedY + ud.bobPhaseY) * ud.bobAmountY;
            cloud.position.z = cloud.position.z + Math.cos(t * ud.bobSpeedX * 0.7 + ud.bobPhaseX) * ud.bobAmountZ * delta;
            
            cloud.rotation.x += ud.rotationSpeedX * delta;
            cloud.rotation.y += ud.rotationSpeedY * delta;
            cloud.rotation.z += ud.rotationSpeedZ * delta;
            
            if (cloud.position.y < 100) cloud.position.y = 100;
            if (cloud.position.y > 3000) cloud.position.y = 3000;
            
            const b = this.bounds;
            if (cloud.position.x > b) cloud.position.x = -b;
            if (cloud.position.x < -b) cloud.position.x = b;
            if (cloud.position.z > b) cloud.position.z = -b;
            if (cloud.position.z < -b) cloud.position.z = b;
        });
    }
}
