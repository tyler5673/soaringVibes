// js/animals/nene.js - Hawaiian Nene (Goose) species

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

        const bodyGeo = new THREE.SphereGeometry(0.3, 8, 6);
        bodyGeo.scale(1.8, 1, 1);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x8D6E63 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        group.add(body);

        const neckGeo = new THREE.CylinderGeometry(0.12, 0.15, 0.5, 6);
        const neck = new THREE.Mesh(neckGeo, bodyMat);
        neck.position.set(0.4, 0.4, 0);
        neck.rotation.z = -0.3;
        group.add(neck);

        const headGeo = new THREE.SphereGeometry(0.15, 8, 6);
        const headMat = new THREE.MeshStandardMaterial({ color: 0x5D4037 });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.set(0.55, 0.7, 0);
        group.add(head);

        const beakGeo = new THREE.ConeGeometry(0.05, 0.15, 4);
        const beakMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
        const beak = new THREE.Mesh(beakGeo, beakMat);
        beak.rotation.z = -Math.PI / 2;
        beak.position.set(0.7, 0.7, 0);
        group.add(beak);

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

window.Nene = Nene;
