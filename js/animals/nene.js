// js/animals/nene.js - Hawaiian Nene Goose (Branta sandvicensis)
// Endemic to Hawaii: brown speckled body, white eyebrow stripe, distinctive call
// Size: 75-90cm length, 150cm wingspan

class Nene extends Animal {
    constructor(scene, initialPosition) {
        super(scene, initialPosition, {
            speed: 3.5,
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

        // Main body colors - brown with gray speckling
        const bodyMat = new THREE.MeshStandardMaterial({ 
            color: 0x8D6E63,
            roughness: 0.8
        });
        
        const bellyMat = new THREE.MeshStandardMaterial({
            color: 0x6D4C41,
            roughness: 0.8
        });
        
        // Black throat/upper neck with speckled pattern
        const neckMat = new THREE.MeshStandardMaterial({ 
            color: 0x5D4037,
            roughness: 0.9
        });
        
        const headMat = new THREE.MeshStandardMaterial({ 
            color: 0x3E2723,
            roughness: 0.9
        });
        
        const beakMat = new THREE.MeshStandardMaterial({ color: 0x212121 });
        const eyeMat = new THREE.MeshStandardMaterial({ color: 0xFFE082 });

        // Plump body - 75-90cm
        const bodyGeo = new THREE.SphereGeometry(0.4, 10, 8);
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.scale.set(1.8, 0.9, 1.1);
        group.add(body);

        // Lighter belly
        const bellyGeo = new THREE.SphereGeometry(0.35, 8, 6);
        const belly = new THREE.Mesh(bellyGeo, bellyMat);
        belly.scale.set(1.6, 0.7, 1);
        belly.position.y = -0.15;
        group.add(belly);

        // Long neck - black at base, light brown speckled, gradient
        const neckGeo = new THREE.CylinderGeometry(0.12, 0.18, 0.6, 6);
        const neck = new THREE.Mesh(neckGeo, neckMat);
        neck.position.set(0.45, 0.35, 0);
        neck.rotation.z = -0.3;
        group.add(neck);

        // Add speckling to neck (simulated with small dots)
        for (let s = 0; s < 6; s++) {
            const speckle = new THREE.Mesh(
                new THREE.SphereGeometry(0.015, 4, 3),
                new THREE.MeshStandardMaterial({ color: 0xA1887F })
            );
            const t = 0.2 + s * 0.12;
            const angle = Math.random() * Math.PI * 2;
            speckle.position.set(
                0.45 + t * 0.5,
                0.35 + t * 0.5,
                Math.sin(angle) * 0.14
            );
            group.add(speckle);
        }

        // Small head with sloping forehead
        const headGeo = new THREE.SphereGeometry(0.18, 8, 6);
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.set(0.62, 0.65, 0);
        head.scale.set(1.1, 0.95, 0.95);
        group.add(head);

        // Characteristic white eyebrow stripe
        const eyebrowL = new THREE.Mesh(
            new THREE.SphereGeometry(0.025, 6, 4),
            new THREE.MeshStandardMaterial({ color: 0xFAFAFA })
        );
        eyebrowL.position.set(0.62, 0.72, 0.14);
        eyebrowL.scale.set(2.5, 0.6, 0.8);
        group.add(eyebrowL);

        const eyebrowR = new THREE.Mesh(
            new THREE.SphereGeometry(0.025, 6, 4),
            new THREE.MeshStandardMaterial({ color: 0xFAFAFA })
        );
        eyebrowR.position.set(0.62, 0.72, -0.14);
        eyebrowR.scale.set(2.5, 0.6, 0.8);
        group.add(eyebrowR);

        // Eye
        const eye = new THREE.Mesh(
            new THREE.SphereGeometry(0.025, 6, 4),
            eyeMat
        );
        eye.position.set(0.68, 0.68, 0.08);
        group.add(eye);

        // Short stout black beak - adapted for grazing
        const beakGeo = new THREE.ConeGeometry(0.04, 0.12, 4);
        const beak = new THREE.Mesh(beakGeo, beakMat);
        beak.rotation.z = -Math.PI / 2;
        beak.position.set(0.8, 0.64, 0);
        group.add(beak);

        // Wings folded at side
        const wingGeo = new THREE.BoxGeometry(0.9, 0.06, 0.45);
        this.wingL = new THREE.Mesh(wingGeo, bodyMat);
        this.wingL.position.set(-0.05, 0.15, 0.42);
        this.wingL.rotation.y = 0.1;
        group.add(this.wingL);

        this.wingR = new THREE.Mesh(wingGeo, bodyMat);
        this.wingR.position.set(-0.05, 0.15, -0.42);
        this.wingR.rotation.y = -0.1;
        group.add(this.wingR);

        // Strong legs for walking/climbing - adapted for volcanic terrain
        const legGeo = new THREE.CylinderGeometry(0.04, 0.05, 0.25, 6);
        const legMat = new THREE.MeshStandardMaterial({ color: 0x37474F });
        
        const leftLeg = new THREE.Mesh(legGeo, legMat);
        leftLeg.position.set(-0.1, -0.35, 0.15);
        leftLeg.rotation.x = 0.2;
        group.add(leftLeg);

        const rightLeg = new THREE.Mesh(legGeo, legMat);
        rightLeg.position.set(-0.1, -0.35, -0.15);
        rightLeg.rotation.x = -0.2;
        group.add(rightLeg);

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

window.Nene = Nene;
