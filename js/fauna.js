// js/fauna.js - Animated wildlife system for Hawaiian flight simulator

class Animal {
    constructor(scene, initialPosition, config = {}) {
        this.scene = scene;
        this.position = initialPosition.clone();
        this.velocity = new THREE.Vector3();
        this.config = {
            speed: 10,
            turnSpeed: 1,
            animationSpeed: 1,
            viewDistance: 1000,
            updateDistance: 2000,
            ...config
        };
        
        this.mesh = null;
        this.state = 'idle';
        this.stateTimer = 0;
        this.animationTime = 0;
        this.isVisible = true;
        
        this.createMesh();
    }
    
    createMesh() {
        this.mesh = new THREE.Group();
        this.scene.add(this.mesh);
    }
    
    update(delta, cameraPosition) {
        const distToCamera = this.position.distanceTo(cameraPosition);
        
        if (distToCamera > this.config.updateDistance) {
            this.mesh.visible = false;
            this.isVisible = false;
            return;
        }
        
        this.isVisible = distToCamera < this.config.viewDistance;
        this.mesh.visible = this.isVisible;
        
        if (this.isVisible) {
            this.animationTime += delta * this.config.animationSpeed;
            this.updateState(delta);
            this.updateAnimation(delta);
        }
        
        this.updateMovement(delta);
        this.mesh.position.copy(this.position);
    }
    
    updateState(delta) {
        this.stateTimer -= delta;
        if (this.stateTimer <= 0) {
            this.chooseNewState();
        }
    }
    
    chooseNewState() {
        this.state = 'idle';
        this.stateTimer = 2 + Math.random() * 3;
    }
    
    updateAnimation(delta) {
        // Override in subclasses
    }
    
    updateMovement(delta) {
        this.position.add(this.velocity.clone().multiplyScalar(delta));
    }
    
    lookAt(target) {
        const direction = target.clone().sub(this.position).normalize();
        const angle = Math.atan2(direction.x, direction.z);
        this.mesh.rotation.y = angle;
    }
    
    moveToward(target, speed) {
        const direction = target.clone().sub(this.position).normalize();
        this.velocity.copy(direction.multiplyScalar(speed));
    }
    
    getRandomPoint(center, radius) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * radius;
        return new THREE.Vector3(
            center.x + Math.cos(angle) * dist,
            center.y,
            center.z + Math.sin(angle) * dist
        );
    }
    
    dispose() {
        if (this.mesh) {
            this.scene.remove(this.mesh);
            this.mesh.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
        }
    }
}

// ==================== MARINE ANIMALS ====================

class Whale extends Animal {
    constructor(scene, initialPosition) {
        super(scene, initialPosition, {
            speed: 3,
            turnSpeed: 0.3,
            viewDistance: 1500,
            updateDistance: 2500
        });
        
        this.patrolCenter = initialPosition.clone();
        this.patrolRadius = 500 + Math.random() * 500;
        this.spoutTimer = 5 + Math.random() * 10;
    }
    
    createMesh() {
        const group = new THREE.Group();
        
        // Body
        const bodyGeo = new THREE.SphereGeometry(1, 16, 12);
        bodyGeo.scale(6, 2.5, 2.5);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2C3E50 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        group.add(body);
        
        // Head
        const headGeo = new THREE.SphereGeometry(1, 12, 10);
        headGeo.scale(2.5, 2, 2);
        const head = new THREE.Mesh(headGeo, bodyMat);
        head.position.set(5, 0.5, 0);
        group.add(head);
        
        // Tail flukes
        const tailGeo = new THREE.ConeGeometry(1.5, 1, 3);
        tailGeo.scale(1, 0.2, 1.5);
        const tail = new THREE.Mesh(tailGeo, bodyMat);
        tail.position.set(-5.5, 0, 0);
        tail.rotation.y = Math.PI / 2;
        group.add(tail);
        this.tail = tail;
        
        // Dorsal fin
        const finGeo = new THREE.ConeGeometry(0.5, 1.5, 3);
        const fin = new THREE.Mesh(finGeo, bodyMat);
        fin.position.set(-1, 2.2, 0);
        fin.rotation.x = -0.3;
        group.add(fin);
        
        this.mesh = group;
        this.scene.add(this.mesh);
        this.mesh.scale.setScalar(2);
    }
    
    chooseNewState() {
        const states = ['swim', 'swim', 'swim', 'surface', 'dive'];
        this.state = states[Math.floor(Math.random() * states.length)];
        this.stateTimer = 15 + Math.random() * 20;
        
        if (this.state === 'swim') {
            this.targetPosition = this.getRandomPoint(this.patrolCenter, this.patrolRadius);
        }
    }
    
    updateAnimation(delta) {
        const time = this.animationTime;
        
        // Tail undulation
        if (this.tail) {
            this.tail.rotation.z = Math.sin(time * 1.5) * 0.1;
        }
    }
    
    updateMovement(delta) {
        if (this.targetPosition) {
            this.moveToward(this.targetPosition, this.config.speed);
            this.lookAt(this.targetPosition);
            
            if (this.position.distanceTo(this.targetPosition) < 20) {
                this.targetPosition = null;
            }
        }
        
        super.updateMovement(delta);
    }
}

class Dolphin extends Animal {
    constructor(scene, initialPosition, podIndex = 0) {
        super(scene, initialPosition, {
            speed: 12,
            turnSpeed: 2,
            viewDistance: 1200,
            updateDistance: 2000
        });
        
        this.podIndex = podIndex;
        this.podCenter = initialPosition.clone();
        this.isJumping = false;
        this.jumpVelocity = new THREE.Vector3();
        this.gravity = -20;
    }
    
    createMesh() {
        const group = new THREE.Group();
        
        // Body
        const bodyGeo = new THREE.SphereGeometry(1, 12, 10);
        bodyGeo.scale(2.5, 0.8, 0.8);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x708090 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        group.add(body);
        
        // Beak
        const beakGeo = new THREE.ConeGeometry(0.4, 0.8, 8);
        const beak = new THREE.Mesh(beakGeo, bodyMat);
        beak.rotation.z = -Math.PI / 2;
        beak.position.set(2.8, 0, 0);
        group.add(beak);
        
        // Dorsal fin
        const finGeo = new THREE.ConeGeometry(0.3, 0.8, 3);
        const fin = new THREE.Mesh(finGeo, bodyMat);
        fin.position.set(-0.3, 0.7, 0);
        fin.rotation.x = -0.2;
        group.add(fin);
        
        // Tail
        const tailGeo = new THREE.ConeGeometry(0.4, 0.6, 3);
        tailGeo.scale(1, 0.15, 1.2);
        const tail = new THREE.Mesh(tailGeo, bodyMat);
        tail.position.set(-2.2, 0, 0);
        tail.rotation.y = Math.PI / 2;
        group.add(tail);
        this.tail = tail;
        
        this.mesh = group;
        this.scene.add(this.mesh);
    }
    
    chooseNewState() {
        const states = ['swim', 'swim', 'porpoise', 'jump'];
        this.state = states[Math.floor(Math.random() * states.length)];
        this.stateTimer = 3 + Math.random() * 8;
        
        if (this.state === 'jump' && !this.isJumping) {
            this.startJump();
        }
        
        const offset = new THREE.Vector3(
            (Math.random() - 0.5) * 100,
            0,
            (Math.random() - 0.5) * 100
        );
        this.targetPosition = this.podCenter.clone().add(offset);
    }
    
    startJump() {
        this.isJumping = true;
        this.jumpVelocity.set(
            (Math.random() - 0.5) * 10,
            8 + Math.random() * 4,
            (Math.random() - 0.5) * 10
        );
    }
    
    updateAnimation(delta) {
        const time = this.animationTime;
        
        if (this.tail) {
            if (this.isJumping) {
                this.tail.rotation.z = Math.sin(time * 10) * 0.3;
            } else {
                this.tail.rotation.z = Math.sin(time * 8) * 0.15;
            }
        }
    }
    
    updateMovement(delta) {
        if (this.isJumping) {
            this.velocity.copy(this.jumpVelocity);
            this.jumpVelocity.y += this.gravity * delta;
            
            if (this.position.y < 0 && this.jumpVelocity.y < 0) {
                this.isJumping = false;
                this.position.y = 0;
                this.jumpVelocity.set(0, 0, 0);
            }
        } else if (this.targetPosition) {
            this.moveToward(this.targetPosition, this.config.speed);
            this.lookAt(this.targetPosition);
            this.position.y = Math.max(0, this.position.y);
            
            if (this.position.distanceTo(this.targetPosition) < 5) {
                this.targetPosition = null;
            }
        }
        
        super.updateMovement(delta);
    }
    
    updatePodCenter(center) {
        this.podCenter.copy(center);
    }
}

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
        
        // Shell
        const shellGeo = new THREE.SphereGeometry(1, 14, 10);
        shellGeo.scale(1, 0.4, 1.1);
        const shellMat = new THREE.MeshStandardMaterial({ color: 0x4A6741 });
        const shell = new THREE.Mesh(shellGeo, shellMat);
        group.add(shell);
        
        // Head
        const headGeo = new THREE.SphereGeometry(0.35, 10, 8);
        headGeo.scale(1.2, 0.8, 0.9);
        const headMat = new THREE.MeshStandardMaterial({ color: 0x6B8E6B });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.set(1.2, -0.1, 0);
        group.add(head);
        
        // Flippers
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

window.Animal = Animal;
window.Whale = Whale;
window.Dolphin = Dolphin;
window.SeaTurtle = SeaTurtle;

// ==================== BIRDS ====================

class Albatross extends Animal {
    constructor(scene, initialPosition) {
        super(scene, initialPosition, {
            speed: 15,
            turnSpeed: 0.5,
            viewDistance: 2000,
            updateDistance: 3000
        });
        
        this.circleCenter = initialPosition.clone();
        this.circleRadius = 200 + Math.random() * 300;
        this.circleAngle = Math.random() * Math.PI * 2;
        this.isGliding = true;
    }
    
    createMesh() {
        const group = new THREE.Group();
        
        // Body
        const bodyGeo = new THREE.SphereGeometry(0.3, 8, 6);
        bodyGeo.scale(2, 0.8, 0.8);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        group.add(body);
        
        // Wings
        const wingGeo = new THREE.BoxGeometry(4, 0.05, 0.6);
        const wingMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
        
        this.wingL = new THREE.Mesh(wingGeo, wingMat);
        this.wingL.position.set(0.5, 0, 2);
        group.add(this.wingL);
        
        this.wingR = new THREE.Mesh(wingGeo, wingMat);
        this.wingR.position.set(0.5, 0, -2);
        group.add(this.wingR);
        
        // Wing tips (black)
        const tipGeo = new THREE.BoxGeometry(1, 0.05, 0.4);
        const tipMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
        
        const tipL = new THREE.Mesh(tipGeo, tipMat);
        tipL.position.set(2.5, 0, 0);
        this.wingL.add(tipL);
        
        const tipR = new THREE.Mesh(tipGeo, tipMat);
        tipR.position.set(2.5, 0, 0);
        this.wingR.add(tipR);
        
        this.mesh = group;
        this.scene.add(this.mesh);
    }
    
    chooseNewState() {
        this.isGliding = Math.random() > 0.1;
        this.stateTimer = 5 + Math.random() * 15;
    }
    
    updateAnimation(delta) {
        const time = this.animationTime;
        
        if (this.isGliding) {
            const bank = Math.sin(time * 0.5) * 0.2;
            this.wingL.rotation.z = bank;
            this.wingR.rotation.z = -bank;
            this.wingL.rotation.x = 0.1 + Math.sin(time * 0.3) * 0.05;
            this.wingR.rotation.x = 0.1 + Math.sin(time * 0.3) * 0.05;
        } else {
            const flap = Math.sin(time * 8) * 0.3;
            this.wingL.rotation.z = flap;
            this.wingR.rotation.z = -flap;
        }
        
        const turnBank = this.turnAmount || 0;
        this.mesh.rotation.z = turnBank * 0.3;
    }
    
    updateMovement(delta) {
        this.circleAngle += delta * 0.1;
        
        const targetX = this.circleCenter.x + Math.cos(this.circleAngle) * this.circleRadius;
        const targetZ = this.circleCenter.z + Math.sin(this.circleAngle) * this.circleRadius;
        const targetPos = new THREE.Vector3(targetX, this.position.y, targetZ);
        
        const currentAngle = Math.atan2(
            this.position.x - this.circleCenter.x,
            this.position.z - this.circleCenter.z
        );
        this.turnAmount = this.circleAngle - currentAngle;
        
        this.moveToward(targetPos, this.config.speed);
        this.lookAt(targetPos);
        
        const altitude = 50 + Math.sin(this.circleAngle * 3) * 20;
        this.velocity.y = (altitude - this.position.y) * 0.5;
        
        super.updateMovement(delta);
        
        if (this.position.distanceTo(this.circleCenter) > 3000) {
            this.circleCenter.copy(this.position);
        }
    }
}

class Frigatebird extends Animal {
    constructor(scene, initialPosition) {
        super(scene, initialPosition, {
            speed: 12,
            turnSpeed: 1,
            viewDistance: 2000,
            updateDistance: 3000
        });
        
        this.coastTarget = initialPosition.clone();
        this.isMale = Math.random() > 0.5;
    }
    
    createMesh() {
        const group = new THREE.Group();
        
        // Black body
        const bodyGeo = new THREE.SphereGeometry(0.4, 10, 8);
        bodyGeo.scale(2, 0.9, 0.9);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1A1A1A });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        group.add(body);
        
        // Wings
        const wingGeo = new THREE.BoxGeometry(3.5, 0.03, 0.5);
        this.wingL = new THREE.Mesh(wingGeo, bodyMat);
        this.wingL.position.set(0.5, 0, 1.8);
        group.add(this.wingL);
        
        this.wingR = new THREE.Mesh(wingGeo, bodyMat);
        this.wingR.position.set(0.5, 0, -1.8);
        group.add(this.wingR);
        
        // Forked tail
        const tailGeo = new THREE.BoxGeometry(1.5, 0.02, 1);
        const tail = new THREE.Mesh(tailGeo, bodyMat);
        tail.position.set(-1.5, 0, 0);
        group.add(tail);
        
        // Red throat pouch (males only)
        if (this.isMale) {
            const pouchGeo = new THREE.SphereGeometry(0.25, 8, 6);
            const pouchMat = new THREE.MeshStandardMaterial({ color: 0xFF1744 });
            const pouch = new THREE.Mesh(pouchGeo, pouchMat);
            pouch.position.set(0.8, -0.3, 0);
            pouch.scale.set(1, 1.3, 1);
            group.add(pouch);
        }
        
        this.mesh = group;
        this.scene.add(this.mesh);
    }
    
    chooseNewState() {
        this.stateTimer = 8 + Math.random() * 15;
        const angle = Math.random() * Math.PI * 2;
        const dist = 500 + Math.random() * 1000;
        this.coastTarget.set(
            this.position.x + Math.cos(angle) * dist,
            80 + Math.random() * 100,
            this.position.z + Math.sin(angle) * dist
        );
    }
    
    updateAnimation(delta) {
        const time = this.animationTime;
        const adjustment = Math.sin(time * 0.8) * 0.1;
        this.wingL.rotation.z = adjustment;
        this.wingR.rotation.z = -adjustment;
    }
    
    updateMovement(delta) {
        if (this.coastTarget) {
            this.moveToward(this.coastTarget, this.config.speed);
            this.lookAt(this.coastTarget);
            
            if (this.position.distanceTo(this.coastTarget) < 50) {
                this.chooseNewState();
            }
        }
        super.updateMovement(delta);
    }
}

class Honeycreeper extends Animal {
    constructor(scene, initialPosition, forestCenter) {
        super(scene, initialPosition, {
            speed: 8,
            turnSpeed: 3,
            viewDistance: 300,
            updateDistance: 600
        });
        
        this.forestCenter = forestCenter;
        
        const colors = [0xFF1744, 0xFFC107, 0x4CAF50, 0xFF9800];
        this.birdColor = colors[Math.floor(Math.random() * colors.length)];
    }
    
    createMesh() {
        const group = new THREE.Group();
        
        // Small colorful body
        const bodyGeo = new THREE.SphereGeometry(0.08, 6, 5);
        const bodyMat = new THREE.MeshStandardMaterial({ color: this.birdColor });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        group.add(body);
        
        // Short wings
        const wingGeo = new THREE.BoxGeometry(0.15, 0.01, 0.1);
        this.wingL = new THREE.Mesh(wingGeo, bodyMat);
        this.wingL.position.set(0.05, 0, 0.08);
        group.add(this.wingL);
        
        this.wingR = new THREE.Mesh(wingGeo, bodyMat);
        this.wingR.position.set(0.05, 0, -0.08);
        group.add(this.wingR);
        
        // Curved beak
        const beakGeo = new THREE.ConeGeometry(0.02, 0.08, 4);
        const beakMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
        const beak = new THREE.Mesh(beakGeo, beakMat);
        beak.rotation.z = -Math.PI / 2;
        beak.position.set(0.1, 0, 0);
        group.add(beak);
        
        this.mesh = group;
        this.scene.add(this.mesh);
    }
    
    chooseNewState() {
        const states = ['perch', 'hop', 'fly'];
        this.state = states[Math.floor(Math.random() * states.length)];
        
        if (this.state === 'perch') {
            this.stateTimer = 3 + Math.random() * 5;
            this.velocity.set(0, 0, 0);
        } else if (this.state === 'hop') {
            this.stateTimer = 1 + Math.random() * 2;
            this.velocity.set(
                (Math.random() - 0.5) * 3,
                2,
                (Math.random() - 0.5) * 3
            );
        } else {
            this.stateTimer = 2 + Math.random() * 3;
            const angle = Math.random() * Math.PI * 2;
            const dist = 5 + Math.random() * 10;
            this.targetPosition = new THREE.Vector3(
                this.position.x + Math.cos(angle) * dist,
                this.position.y + (Math.random() - 0.5) * 3,
                this.position.z + Math.sin(angle) * dist
            );
        }
    }
    
    updateAnimation(delta) {
        const time = this.animationTime;
        
        if (this.state === 'fly') {
            const flap = Math.sin(time * 20) * 0.5;
            this.wingL.rotation.z = flap;
            this.wingR.rotation.z = -flap;
        } else if (this.state === 'hop') {
            const flap = Math.sin(time * 15) * 0.3;
            this.wingL.rotation.z = flap;
            this.wingR.rotation.z = -flap;
        } else {
            this.wingL.rotation.z = 0;
            this.wingR.rotation.z = 0;
        }
    }
    
    updateMovement(delta) {
        if (this.state === 'fly' && this.targetPosition) {
            this.moveToward(this.targetPosition, this.config.speed);
            this.lookAt(this.targetPosition);
            
            if (this.position.distanceTo(this.targetPosition) < 1) {
                this.targetPosition = null;
                this.state = 'perch';
            }
        } else if (this.state === 'hop') {
            this.velocity.y -= 9.8 * delta;
            if (this.position.y < this.forestCenter.y + 8) {
                this.position.y = this.forestCenter.y + 8;
                this.velocity.set(0, 0, 0);
                this.state = 'perch';
            }
        }
        
        super.updateMovement(delta);
    }
}

class Nene extends Animal {
    constructor(scene, initialPosition) {
        super(scene, initialPosition, {
            speed: 3,
            turnSpeed: 1,
            viewDistance: 800,
            updateDistance: 1200
        });
        
        this.flockCenter = initialPosition.clone();
        this.isFlying = false;
        this.groundY = this.position.y;
    }
    
    createMesh() {
        const group = new THREE.Group();
        
        // Brown body
        const bodyGeo = new THREE.SphereGeometry(0.3, 8, 6);
        bodyGeo.scale(1.8, 1, 1);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x8D6E63 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        group.add(body);
        
        // Long neck
        const neckGeo = new THREE.CylinderGeometry(0.12, 0.15, 0.5, 6);
        const neck = new THREE.Mesh(neckGeo, bodyMat);
        neck.position.set(0.4, 0.4, 0);
        neck.rotation.z = -0.3;
        group.add(neck);
        
        // Head
        const headGeo = new THREE.SphereGeometry(0.15, 8, 6);
        const headMat = new THREE.MeshStandardMaterial({ color: 0x5D4037 });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.set(0.55, 0.7, 0);
        group.add(head);
        
        // Beak
        const beakGeo = new THREE.ConeGeometry(0.05, 0.15, 4);
        const beakMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
        const beak = new THREE.Mesh(beakGeo, beakMat);
        beak.rotation.z = -Math.PI / 2;
        beak.position.set(0.7, 0.7, 0);
        group.add(beak);
        
        // Wings
        const wingGeo = new THREE.BoxGeometry(0.8, 0.05, 0.4);
        this.wingL = new THREE.Mesh(wingGeo, bodyMat);
        this.wingL.position.set(0, 0.2, 0.4);
        group.add(this.wingL);
        
        this.wingR = new THREE.Mesh(wingGeo, bodyMat);
        this.wingR.position.set(0, 0.2, -0.4);
        group.add(this.wingR);
        
        this.mesh = group;
        this.scene.add(this.mesh);
    }
    
    chooseNewState() {
        const states = ['graze', 'graze', 'walk', 'walk', 'fly'];
        this.state = states[Math.floor(Math.random() * states.length)];
        this.stateTimer = 5 + Math.random() * 10;
        
        if (this.state === 'walk') {
            const angle = Math.random() * Math.PI * 2;
            const dist = 10 + Math.random() * 20;
            this.targetPosition = new THREE.Vector3(
                this.position.x + Math.cos(angle) * dist,
                this.groundY,
                this.position.z + Math.sin(angle) * dist
            );
        } else if (this.state === 'fly') {
            this.isFlying = true;
            this.velocity.y = 5;
            const angle = Math.random() * Math.PI * 2;
            const dist = 100 + Math.random() * 200;
            this.targetPosition = new THREE.Vector3(
                this.flockCenter.x + Math.cos(angle) * dist,
                this.groundY + 30 + Math.random() * 20,
                this.flockCenter.z + Math.sin(angle) * dist
            );
        } else {
            this.isFlying = false;
            this.velocity.set(0, 0, 0);
        }
    }
    
    updateAnimation(delta) {
        const time = this.animationTime;
        
        if (this.isFlying) {
            const flap = Math.sin(time * 10) * 0.4;
            this.wingL.rotation.z = flap;
            this.wingR.rotation.z = -flap;
            this.mesh.rotation.x = 0.2;
        } else {
            if (this.state === 'walk') {
                const bob = Math.abs(Math.sin(time * 8)) * 0.1;
                this.mesh.children[2].position.y = 0.7 + bob;
            } else {
                this.mesh.children[2].position.y = 0.5;
                this.mesh.children[2].rotation.z = -0.8;
            }
            
            this.wingL.rotation.z = 0;
            this.wingR.rotation.z = 0;
            this.mesh.rotation.x = 0;
        }
    }
    
    updateMovement(delta) {
        if (this.isFlying) {
            if (this.targetPosition) {
                this.moveToward(this.targetPosition, this.config.speed * 2);
                this.lookAt(this.targetPosition);
                
                if (this.position.distanceTo(this.targetPosition) < 10) {
                    this.isFlying = false;
                    this.position.y = this.groundY;
                    this.state = 'graze';
                }
            }
        } else if (this.state === 'walk' && this.targetPosition) {
            this.moveToward(this.targetPosition, this.config.speed);
            this.lookAt(this.targetPosition);
            
            if (this.position.distanceTo(this.targetPosition) < 2) {
                this.targetPosition = null;
                this.state = 'graze';
            }
        }
        
        super.updateMovement(delta);
    }
}

window.Albatross = Albatross;
window.Frigatebird = Frigatebird;
window.Honeycreeper = Honeycreeper;
window.Nene = Nene;

// ==================== FAUNA MANAGER ====================

class FaunaManager {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.animals = [];
        
        // Object pools
        this.whalePool = [];
        this.dolphinPool = [];
        this.turtlePool = [];
        this.albatrossPool = [];
        this.frigatebirdPool = [];
        this.honeycreeperPool = [];
        this.nenePool = [];
        
        // Spawn configuration
        this.spawnConfig = {
            whale: { count: 4, radius: 5000 },
            dolphin: { count: 15, radius: 3000 },
            turtle: { count: 10, radius: 2000 },
            albatross: { count: 8, radius: 6000 },
            frigatebird: { count: 12, radius: 4000 },
            honeycreeper: { count: 20, radius: 1500 },
            nene: { count: 12, radius: 2000 }
        };
    }
    
    init() {
        // Spawn whales in open ocean
        for (let i = 0; i < this.spawnConfig.whale.count; i++) {
            const pos = this.getOceanPosition(this.spawnConfig.whale.radius);
            const whale = new Whale(this.scene, pos);
            this.animals.push(whale);
            this.whalePool.push(whale);
        }
        
        // Spawn dolphins in pods
        const podCenters = [];
        for (let i = 0; i < 3; i++) {
            podCenters.push(this.getCoastalPosition(2000));
        }
        
        for (let i = 0; i < this.spawnConfig.dolphin.count; i++) {
            const podIndex = i % 3;
            const offset = new THREE.Vector3(
                (Math.random() - 0.5) * 100,
                0,
                (Math.random() - 0.5) * 100
            );
            const pos = podCenters[podIndex].clone().add(offset);
            const dolphin = new Dolphin(this.scene, pos, podIndex);
            this.animals.push(dolphin);
            this.dolphinPool.push(dolphin);
        }
        
        // Spawn turtles
        for (let i = 0; i < this.spawnConfig.turtle.count; i++) {
            const pos = this.getCoastalPosition(this.spawnConfig.turtle.radius);
            const turtle = new SeaTurtle(this.scene, pos);
            this.animals.push(turtle);
            this.turtlePool.push(turtle);
        }
        
        // Spawn albatrosses over ocean
        for (let i = 0; i < this.spawnConfig.albatross.count; i++) {
            const pos = this.getOceanPosition(this.spawnConfig.albatross.radius);
            pos.y = 100 + Math.random() * 100;
            const albatross = new Albatross(this.scene, pos);
            this.animals.push(albatross);
            this.albatrossPool.push(albatross);
        }
        
        // Spawn frigatebirds near coasts
        for (let i = 0; i < this.spawnConfig.frigatebird.count; i++) {
            const pos = this.getCoastalPosition(this.spawnConfig.frigatebird.radius);
            pos.y = 80 + Math.random() * 80;
            const frigatebird = new Frigatebird(this.scene, pos);
            this.animals.push(frigatebird);
            this.frigatebirdPool.push(frigatebird);
        }
        
        // Spawn honeycreepers in forest areas
        const forestCenters = [
            new THREE.Vector3(0, 50, 0),
            new THREE.Vector3(-6400, 50, -2800),
            new THREE.Vector3(3200, 50, -6400)
        ];
        
        for (let i = 0; i < this.spawnConfig.honeycreeper.count; i++) {
            const center = forestCenters[Math.floor(Math.random() * forestCenters.length)];
            const offset = new THREE.Vector3(
                (Math.random() - 0.5) * 500,
                (Math.random() - 0.5) * 50,
                (Math.random() - 0.5) * 500
            );
            const pos = center.clone().add(offset);
            const bird = new Honeycreeper(this.scene, pos, center);
            this.animals.push(bird);
            this.honeycreeperPool.push(bird);
        }
        
        // Spawn nene in grassland areas
        for (let i = 0; i < this.spawnConfig.nene.count; i++) {
            const pos = this.getGrasslandPosition(this.spawnConfig.nene.radius);
            const nene = new Nene(this.scene, pos);
            this.animals.push(nene);
            this.nenePool.push(nene);
        }
        
        console.log(`FaunaManager: Spawned ${this.animals.length} animals`);
    }
    
    getOceanPosition(radius) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 2000 + Math.random() * radius;
        return new THREE.Vector3(
            Math.cos(angle) * dist,
            0,
            Math.sin(angle) * dist
        );
    }
    
    getCoastalPosition(radius) {
        if (typeof islandPositions === 'undefined') {
            // Fallback if islandPositions not loaded yet
            const angle = Math.random() * Math.PI * 2;
            const dist = 500 + Math.random() * radius;
            return new THREE.Vector3(
                Math.cos(angle) * dist,
                0,
                Math.sin(angle) * dist
            );
        }
        
        const islandPos = islandPositions[Math.floor(Math.random() * islandPositions.length)];
        const angle = Math.random() * Math.PI * 2;
        const dist = 500 + Math.random() * radius;
        return new THREE.Vector3(
            islandPos.x + Math.cos(angle) * dist,
            0,
            islandPos.z + Math.sin(angle) * dist
        );
    }
    
    getGrasslandPosition(radius) {
        if (typeof islandPositions === 'undefined') {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * radius;
            return new THREE.Vector3(
                Math.cos(angle) * dist,
                10,
                Math.sin(angle) * dist
            );
        }
        
        const islandPos = islandPositions[Math.floor(Math.random() * islandPositions.length)];
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * radius;
        return new THREE.Vector3(
            islandPos.x + Math.cos(angle) * dist,
            10,
            islandPos.z + Math.sin(angle) * dist
        );
    }
    
    update(delta) {
        const camPos = this.camera.position;
        
        // Update dolphins pod centers
        const leadDolphins = this.dolphinPool.filter((_, i) => i < 3);
        this.dolphinPool.forEach((dolphin, i) => {
            const podIndex = i % 3;
            if (leadDolphins[podIndex]) {
                dolphin.updatePodCenter(leadDolphins[podIndex].position);
            }
        });
        
        // Update all animals
        this.animals.forEach(animal => {
            animal.update(delta, camPos);
        });
        
        // Respawn animals that go too far
        this.checkRespawns();
    }
    
    checkRespawns() {
        const maxDist = 8000;
        
        this.animals.forEach(animal => {
            if (animal.position.distanceTo(new THREE.Vector3(0, 0, 0)) > maxDist) {
                const aircraft = window.aircraft;
                if (aircraft) {
                    const pos = aircraft.getPosition ? aircraft.getPosition() : aircraft.mesh.position;
                    const angle = Math.random() * Math.PI * 2;
                    const dist = 2000 + Math.random() * 2000;
                    
                    const isMarine = animal instanceof Whale || animal instanceof Dolphin || animal instanceof SeaTurtle;
                    animal.position.set(
                        pos.x + Math.cos(angle) * dist,
                        isMarine ? 0 : 100 + Math.random() * 100,
                        pos.z + Math.sin(angle) * dist
                    );
                }
            }
        });
    }
    
    dispose() {
        this.animals.forEach(animal => animal.dispose());
        this.animals = [];
    }
}

window.FaunaManager = FaunaManager;
