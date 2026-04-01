// ========== WILDLIFE ==========
class Wildlife {
    constructor(scene) {
        this.scene = scene;
        this.birds = [];
        
        this.createBirds(30);
    }
    
    createBirds(count) {
        const birdGeo = new THREE.ConeGeometry(0.5, 2, 4);
        birdGeo.rotateX(Math.PI / 2);
        const birdMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
        
        for (let i = 0; i < count; i++) {
            const bird = new THREE.Mesh(birdGeo, birdMat);
            
            bird.position.set(
                (Math.random() - 0.5) * 20000,
                100 + Math.random() * 500,
                (Math.random() - 0.5) * 20000
            );
            
            bird.userData = {
                speed: 10 + Math.random() * 20,
                direction: new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize(),
                turnTimer: Math.random() * 5
            };
            
            bird.rotation.y = Math.atan2(bird.userData.direction.x, bird.userData.direction.z);
            
            this.scene.add(bird);
            this.birds.push(bird);
        }
    }
    
    update(delta) {
        this.birds.forEach(bird => {
            bird.userData.turnTimer -= delta;
            
            if (bird.userData.turnTimer <= 0) {
                bird.userData.direction.set(Math.random() - 0.5, (Math.random() - 0.5) * 0.2, Math.random() - 0.5).normalize();
                bird.userData.turnTimer = 2 + Math.random() * 5;
                bird.rotation.y = Math.atan2(bird.userData.direction.x, bird.userData.direction.z);
            }
            
            bird.position.x += bird.userData.direction.x * bird.userData.speed * delta;
            bird.position.y += bird.userData.direction.y * bird.userData.speed * delta;
            bird.position.z += bird.userData.direction.z * bird.userData.speed * delta;
            
            bird.rotation.z = -bird.userData.direction.x * 0.5;
            
            if (bird.position.x > 15000) bird.position.x = -15000;
            if (bird.position.x < -15000) bird.position.x = 15000;
            if (bird.position.z > 15000) bird.position.z = -15000;
            if (bird.position.z < -15000) bird.position.z = 15000;
            bird.position.y = Math.max(50, Math.min(800, bird.position.y));
        });
    }
}
