// js/animals/frigatebird.js - Frigatebird species

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

        const bodyGeo = new THREE.SphereGeometry(0.4, 10, 8);
        bodyGeo.scale(2, 0.9, 0.9);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1A1A1A });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        group.add(body);

        const wingGeo = new THREE.BoxGeometry(3.5, 0.03, 0.5);
        this.wingL = new THREE.Mesh(wingGeo, bodyMat);
        this.wingL.position.set(0.5, 0, 1.8);
        group.add(this.wingL);

        this.wingR = new THREE.Mesh(wingGeo, bodyMat);
        this.wingR.position.set(0.5, 0, -1.8);
        group.add(this.wingR);

        const tailGeo = new THREE.BoxGeometry(1.5, 0.02, 1);
        const tail = new THREE.Mesh(tailGeo, bodyMat);
        tail.position.set(-1.5, 0, 0);
        group.add(tail);

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

window.Frigatebird = Frigatebird;
