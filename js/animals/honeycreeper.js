// js/animals/honeycreeper.js - Hawaiian Honeycreeper species

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

        const bodyGeo = new THREE.SphereGeometry(0.08, 6, 5);
        const bodyMat = new THREE.MeshStandardMaterial({ color: this.birdColor });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        group.add(body);

        const wingGeo = new THREE.BoxGeometry(0.15, 0.01, 0.1);
        this.wingL = new THREE.Mesh(wingGeo, bodyMat);
        this.wingL.position.set(0.05, 0, 0.08);
        group.add(this.wingL);

        this.wingR = new THREE.Mesh(wingGeo, bodyMat);
        this.wingR.position.set(0.05, 0, -0.08);
        group.add(this.wingR);

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

window.Honeycreeper = Honeycreeper;
