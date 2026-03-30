// js/animals/albatross.js - Albatross species

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

        const bodyGeo = new THREE.SphereGeometry(0.3, 8, 6);
        bodyGeo.scale(2, 0.8, 0.8);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        group.add(body);

        const wingGeo = new THREE.BoxGeometry(4, 0.05, 0.6);
        const wingMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });

        this.wingL = new THREE.Mesh(wingGeo, wingMat);
        this.wingL.position.set(0.5, 0, 2);
        group.add(this.wingL);

        this.wingR = new THREE.Mesh(wingGeo, wingMat);
        this.wingR.position.set(0.5, 0, -2);
        group.add(this.wingR);

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

window.Albatross = Albatross;
