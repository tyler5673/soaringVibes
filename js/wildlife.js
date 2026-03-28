// ========== WILDLIFE ==========
class Wildlife {
    constructor(scene) {
        this.scene = scene;
        this.birds = [];
        this.balloons = [];
        
        this.createBirds(30);
        this.createBalloons(5);
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
    
    createBalloons(count) {
        const balloonGroup = new THREE.Group();
        
        const balloonGeo = new THREE.SphereGeometry(15, 16, 16);
        balloonGeo.scale(1, 1.3, 1);
        const colors = [0xFF6B6B, 0x4ECDC4, 0xFFE66D, 0x95E1D3, 0xF38181];
        const balloonMat = new THREE.MeshStandardMaterial({ color: 0xFF6B6B });
        const balloon = new THREE.Mesh(balloonGeo, balloonMat);
        balloon.position.y = 15;
        balloonGroup.add(balloon);
        
        const basketGeo = new THREE.BoxGeometry(5, 4, 5);
        const basketMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
        const basket = new THREE.Mesh(basketGeo, basketMat);
        basket.position.y = -2;
        balloonGroup.add(basket);
        
        const ropeGeo = new THREE.CylinderGeometry(0.1, 0.1, 17);
        const ropeMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
        [-2, 2].forEach(x => {
            [-2, 2].forEach(z => {
                const rope = new THREE.Mesh(ropeGeo, ropeMat);
                rope.position.set(x, 6.5, z);
                balloonGroup.add(rope);
            });
        });
        
        for (let i = 0; i < count; i++) {
            const balloon = balloonGroup.clone();
            
            balloon.children[0].material = balloon.children[0].material.clone();
            balloon.children[0].material.color.setHex(colors[Math.floor(Math.random() * colors.length)]);
            
            balloon.position.set(
                (Math.random() - 0.5) * 30000,
                200 + Math.random() * 400,
                (Math.random() - 0.5) * 30000
            );
            
            balloon.userData = {
                driftSpeed: 5 + Math.random() * 10,
                driftDirection: new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize(),
                bobTimer: Math.random() * Math.PI * 2
            };
            
            this.scene.add(balloon);
            this.balloons.push(balloon);
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
        
        this.balloons.forEach(balloon => {
            balloon.userData.bobTimer += delta * 2;
            
            balloon.position.x += balloon.userData.driftDirection.x * balloon.userData.driftSpeed * delta;
            balloon.position.y += Math.sin(balloon.userData.bobTimer) * 0.3;
            balloon.position.z += balloon.userData.driftDirection.z * balloon.userData.driftSpeed * delta;
            
            balloon.rotation.y += delta * 0.1;
            
            if (balloon.position.x > 20000) balloon.position.x = -20000;
            if (balloon.position.x < -20000) balloon.position.x = 20000;
            if (balloon.position.z > 20000) balloon.position.z = -20000;
            if (balloon.position.z < -20000) balloon.position.z = 20000;
        });
    }
}
