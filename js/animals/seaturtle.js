// js/animals/seaturtle.js - Sea Turtle species

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

        const shellGeo = new THREE.SphereGeometry(1, 14, 10);
        shellGeo.scale(1, 0.4, 1.1);
        const shellMat = new THREE.MeshStandardMaterial({ color: 0x4A6741 });
        const shell = new THREE.Mesh(shellGeo, shellMat);
        group.add(shell);

        const headGeo = new THREE.SphereGeometry(0.35, 10, 8);
        headGeo.scale(1.2, 0.8, 0.9);
        const headMat = new THREE.MeshStandardMaterial({ color: 0x6B8E6B });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.set(1.2, -0.1, 0);
        group.add(head);

        const flipperGeo = new THREE.BoxGeometry(0.6, 0.1, 0.4);
        this.flippers = [];

        const flipperFL = new THREE.Mesh(flipperGeo, headMat);
        flipperFL.position.set(0.6, -0.2, 0.7);
        flipperFL.rotation.y = 0.5;
        group.add(flipperFL);
        this.flippers.push(flipperFL);

        const flipperFR = new THREE.Mesh(flipperGeo, headMat);
        flipperFR.position.set(0.6, -0.2, -0.7);
        flipperFR.rotation.y = -0.5;
        group.add(flipperFR);
        this.flippers.push(flipperFR);

        const flipperBL = new THREE.Mesh(flipperGeo, headMat);
        flipperBL.position.set(-0.7, -0.2, 0.5);
        flipperBL.rotation.y = 2.5;
        group.add(flipperBL);
        this.flippers.push(flipperBL);

        const flipperBR = new THREE.Mesh(flipperGeo, headMat);
        flipperBR.position.set(-0.7, -0.2, -0.5);
        flipperBR.rotation.y = -2.5;
        group.add(flipperBR);
        this.flippers.push(flipperBR);

        this.mesh = group;
        this.scene.add(this.mesh);
        this.mesh.scale.setScalar(0.8);
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
