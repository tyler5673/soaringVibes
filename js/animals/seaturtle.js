// js/animals/seaturtle.js - Hawaiian Green Sea Turtle (Honu)
// Chelonia mydas: 3-4 ft (0.9-1.2m) carapace, 400-500 lbs
// Hexagonal scute pattern on shell

class SeaTurtle extends Animal {
    constructor(scene, initialPosition) {
        super(scene, initialPosition, {
            speed: 2,
            turnSpeed: 0.5,
            viewDistance: 600,
            updateDistance: 1000
        });

        this.isSurfacing = true;
        this.diveTimer = 0;
    }

    createMesh() {
        const group = new THREE.Group();

        // Shell has distinct scute pattern - hexagonal plates
        const shellMat = new THREE.MeshStandardMaterial({ 
            color: 0x4A6741,
            roughness: 0.7
        });
        
        const scuteMat = new THREE.MeshStandardMaterial({ 
            color: 0x556B2F,
            roughness: 0.6
        });
        
        const skinMat = new THREE.MeshStandardMaterial({ 
            color: 0x6B8E6B,
            roughness: 0.5
        });

        // Main shell (carapace) - oval, domed
        const shellGeo = new THREE.SphereGeometry(1, 16, 12);
        shellGeo.scale(1.1, 0.35, 1);
        const shell = new THREE.Mesh(shellGeo, shellMat);
        group.add(shell);

        // Add scute pattern - 13 scutes typical: 1 nuchal, 4 vertebrals, 4+4 marginals
        // Central vertebral scutes (4 along midline)
        for (let i = 0; i < 4; i++) {
            const t = 0.2 + i * 0.2;
            const scute = new THREE.Mesh(
                new THREE.PlaneGeometry(0.25, 0.28),
                scuteMat
            );
            scute.position.set(t * 1.5, 0.28, 0);
            scute.rotation.x = Math.PI / 2;
            scute.scale.z = 0.02;
            group.add(scute);
        }

        // Left costal scutes (4 on left side)
        for (let i = 0; i < 4; i++) {
            const t = 0.15 + i * 0.25;
            const scute = new THREE.Mesh(
                new THREE.PlaneGeometry(0.22, 0.3),
                scuteMat
            );
            const xPos = t * 1.4;
            const zPos = Math.sin(t * Math.PI) * 0.7;
            scute.position.set(xPos, 0.22, zPos + 0.2);
            scute.rotation.x = Math.PI / 2 + 0.4;
            scute.rotation.y = Math.random() * 0.2;
            group.add(scute);
        }

        // Right costal scutes (4 on right side)
        for (let i = 0; i < 4; i++) {
            const t = 0.15 + i * 0.25;
            const scute = new THREE.Mesh(
                new THREE.PlaneGeometry(0.22, 0.3),
                scuteMat
            );
            const xPos = t * 1.4;
            const zPos = Math.sin(t * Math.PI) * 0.7;
            scute.position.set(xPos, 0.22, -zPos - 0.2);
            scute.rotation.x = Math.PI / 2 + 0.4;
            scute.rotation.y = -Math.random() * 0.2;
            group.add(scute);
        }

        // Head with beak-like mouth
        const headGeo = new THREE.SphereGeometry(0.28, 10, 8);
        headGeo.scale(1.3, 0.9, 0.85);
        const head = new THREE.Mesh(headGeo, skinMat);
        head.position.set(1.4, -0.05, 0);
        group.add(head);

        // Snout/beak
        const snout = new THREE.Mesh(
            new THREE.ConeGeometry(0.1, 0.15, 6),
            skinMat
        );
        snout.rotation.z = -Math.PI / 2 - 0.2;
        snout.position.set(1.7, -0.03, 0);
        group.add(snout);

        // Flippers - powerful paddles
        const flipperGeo = new THREE.ConeGeometry(0.35, 1.2, 6);
        
        // Front flippers
        const frontL = new THREE.Mesh(flipperGeo, skinMat);
        frontL.position.set(0.6, -0.1, 0.6);
        frontL.rotation.y = 0.4;
        frontL.rotation.x = 0.3;
        frontL.scale.set(1, 0.18, 1);
        group.add(frontL);
        this.flippers = [frontL];

        const frontR = new THREE.Mesh(flipperGeo, skinMat);
        frontR.position.set(0.6, -0.1, -0.6);
        frontR.rotation.y = -0.4;
        frontR.rotation.x = 0.3;
        frontR.scale.set(1, 0.18, 1);
        group.add(frontR);
        this.flippers.push(frontR);

        // Rear flippers (smaller)
        const rearL = new THREE.Mesh(flipperGeo, skinMat);
        rearL.position.set(-0.8, -0.1, 0.45);
        rearL.rotation.y = 2.4;
        rearL.rotation.x = 0.7;
        rearL.scale.set(0.8, 0.15, 0.8);
        group.add(rearL);
        this.flippers.push(rearL);

        const rearR = new THREE.Mesh(flipperGeo, skinMat);
        rearR.position.set(-0.8, -0.1, -0.45);
        rearR.rotation.y = -2.4;
        rearR.rotation.x = 0.7;
        rearR.scale.set(0.8, 0.15, 0.8);
        group.add(rearR);
        this.flippers.push(rearR);

        this.mesh = group;
        this.scene.add(this.mesh);
        this.mesh.scale.setScalar(1.5);
    }

    chooseNewState() {
        if (this.isSurfacing) {
            this.state = 'surface';
            this.stateTimer = 10 + Math.random() * 20;
            this.diveTimer = 30 + Math.random() * 60;
        } else {
            this.state = 'dive';
            this.stateTimer = this.diveTimer;
        }

        const angle = Math.random() * Math.PI * 2;
        this.targetDirection = new THREE.Vector3(
            Math.cos(angle),
            this.isSurfacing ? 0 : (Math.random() - 0.5) * 0.3,
            Math.sin(angle)
        ).normalize();
    }

    updateState(delta) {
        this.stateTimer -= delta;
        if (this.stateTimer <= 0) {
            this.isSurfacing = !this.isSurfacing;
            this.chooseNewState();
        }
    }

    updateAnimation(delta) {
        const time = this.animationTime;
        const speed = this.isSurfacing ? 2 : 1;

        this.flippers.forEach((flipper, i) => {
            const offset = i < 2 ? 0 : Math.PI;
            flipper.rotation.x = Math.sin(time * speed + offset) * 0.3;
        });

        this.mesh.rotation.z = Math.sin(time * 0.5) * 0.05;
    }

    updateMovement(delta) {
        if (this.targetDirection) {
            const speed = this.isSurfacing ? this.config.speed : this.config.speed * 0.7;
            this.velocity.copy(this.targetDirection.multiplyScalar(speed));

            const targetAngle = Math.atan2(this.targetDirection.x, this.targetDirection.z);
            const currentAngle = this.mesh.rotation.y;
            let diff = targetAngle - currentAngle;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            this.mesh.rotation.y += diff * this.config.turnSpeed * delta;
        }

        super.updateMovement(delta);

        if (this.isSurfacing) {
            this.position.y = Math.max(0, this.position.y);
        } else {
            this.position.y = Math.max(-10, Math.min(0, this.position.y));
        }
    }
}

window.SeaTurtle = SeaTurtle;
