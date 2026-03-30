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

        // Laysan Albatross: White head/body, black wingtips, yellow bill
        // Wingspan: 3-3.5m (one of largest in the world)
        const bodyMat = new THREE.MeshStandardMaterial({ 
            color: 0xFFFFFF,
            roughness: 0.5
        });
        
        const wingtipMat = new THREE.MeshStandardMaterial({ 
            color: 0x1A1A1A,
            roughness: 0.7
        });
        
        const beakMat = new THREE.MeshStandardMaterial({ 
            color: 0xFFB300,
            roughness: 0.6
        });
        
        const eyeMat = new THREE.MeshStandardMaterial({
            color: 0x000000,
            roughness: 0.9
        });

        // Robust body - 80-90cm length
        const bodyGeo = new THREE.CapsuleGeometry(0.35, 1.2, 8, 6);
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.rotation.z = Math.PI / 2;
        group.add(body);

        // Neck and head
        const neckGeo = new THREE.CylinderGeometry(0.18, 0.25, 0.4, 6);
        const neck = new THREE.Mesh(neckGeo, bodyMat);
        neck.position.set(0.6, 0.15, 0);
        neck.rotation.z = -0.4;
        group.add(neck);

        const headGeo = new THREE.SphereGeometry(0.22, 8, 6);
        const head = new THREE.Mesh(headGeo, bodyMat);
        head.position.set(0.9, 0.25, 0);
        group.add(head);

        // Eye
        const eye = new THREE.Mesh(
            new THREE.SphereGeometry(0.025, 6, 4),
            eyeMat
        );
        eye.position.set(0.95, 0.28, 0.08);
        group.add(eye);

        // Large hooked orange-yellow bill
        const beakUpper = new THREE.Mesh(
            new THREE.ConeGeometry(0.04, 0.22, 6),
            beakMat
        );
        beakUpper.rotation.z = Math.PI / 2 + 0.2;
        beakUpper.position.set(1.1, 0.28, 0);
        group.add(beakUpper);

        const beakLower = new THREE.Mesh(
            new THREE.ConeGeometry(0.03, 0.15, 6),
            beakMat
        );
        beakLower.rotation.z = Math.PI / 2 - 0.1;
        beakLower.position.set(1.1, 0.22, 0);
        group.add(beakLower);

        // Wings - 3-3.5m wingspan with distinctive black tips
        const wingSpan = 1.6;
        const wingSegments = [];
        
        // Left wing with slotted primary feathers
        for (let i = 0; i < 8; i++) {
            const isTip = i >= 5;
            const featherMat = isTip ? wingtipMat : bodyMat;
            
            const length = 0.35 + i * 0.12;
            const feather = new THREE.Mesh(
                new THREE.ConeGeometry(0.025, length, 3),
                featherMat
            );
            
            const x = 0.2 + i * 0.18;
            const z = 0.3 + i * 0.22;
            
            feather.position.set(x, 0, z);
            feather.rotation.x = 0.4 + i * 0.03;
            feather.rotation.z = -0.05 - i * 0.02;
            feather.scale.z = 0.1;
            
            group.add(feather);
            wingSegments.push({ mesh: feather, isLeft: true });
        }
        
        // Right wing mirrored
        for (let i = 0; i < 8; i++) {
            const isTip = i >= 5;
            const featherMat = isTip ? wingtipMat : bodyMat;
            
            const length = 0.35 + i * 0.12;
            const feather = new THREE.Mesh(
                new THREE.ConeGeometry(0.025, length, 3),
                featherMat
            );
            
            const x = 0.2 + i * 0.18;
            const z = -0.3 - i * 0.22;
            
            feather.position.set(x, 0, z);
            feather.rotation.x = 0.4 + i * 0.03;
            feather.rotation.z = 0.05 + i * 0.02;
            feather.scale.z = 0.1;
            
            group.add(feather);
            wingSegments.push({ mesh: feather, isLeft: false });
        }

        // Short stocky tail
        const tailGeo = new THREE.ConeGeometry(0.2, 0.4, 6);
        const tail = new THREE.Mesh(tailGeo, bodyMat);
        tail.position.set(-0.6, 0, 0);
        tail.rotation.x = 0.8;
        tail.scale.z = 0.3;
        group.add(tail);

        this.mesh = group;
        this.wingSegments = wingSegments;
        this.scene.add(this.mesh);
        this.mesh.scale.setScalar(2.8);
    }

    chooseNewState() {
        this.isGliding = Math.random() > 0.1;
        this.stateTimer = 5 + Math.random() * 15;
    }

    updateAnimation(delta) {
        const time = this.animationTime;
        
        // Albatross wings - dynamic soaring master
        // Soaring for long periods between occasional wing beats
        const flap = this.isGliding ? 
            Math.sin(time * 0.8) * 0.05 : 
            Math.sin(time * 6) * 0.2;
        
        // Animate wing feathers
        this.wingSegments.forEach((seg, i) => {
            const offset = i * 0.1;
            const wingFlex = Math.sin(time * 0.5 + offset) * 0.03;
            seg.mesh.rotation.x = 0.4 + flap + wingFlex;
        });

        const turnBank = this.turnAmount || 0;
        this.mesh.rotation.z = turnBank * 0.2;
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
