// js/animals/frigatebird.js - Magnificent Frigatebird (Fregata magnificens)
// Wingspan: 2.3-2.8m, Forked tail, deeply notched wings, 10-12 ft flying range

class Frigatebird extends Animal {
    constructor(scene, initialPosition) {
        super(scene, initialPosition, {
            speed: 14,
            turnSpeed: 1.2,
            viewDistance: 2500,
            updateDistance: 4000
        });

        this.coastTarget = initialPosition.clone();
        this.isMale = Math.random() > 0.5;
    }

    createMesh() {
        this.primaryFeathers = []; // Initialize before super() calls this
        const group = new THREE.Group();

        const bodyMat = new THREE.MeshStandardMaterial({ 
            color: 0x0D0D0D,
            roughness: 0.7,
            metalness: 0.05
        });

        const beakMat = new THREE.MeshStandardMaterial({ 
            color: 0xD32F2F, 
            roughness: 0.6
        });

        const eyeMat = new THREE.MeshStandardMaterial({ 
            color: 0xFFF176,
            roughness: 0.9
        });

        // Streamlined body - 2.3m wingspan scaled proportionally
        const bodyGeo = new THREE.CapsuleGeometry(0.25, 0.8, 8, 6);
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.rotation.z = Math.PI / 2;
        group.add(body);

        // Hooked beak - characteristic of frigatebirds
        const beakUpper = new THREE.Mesh(
            new THREE.ConeGeometry(0.03, 0.25, 6),
            beakMat
        );
        beakUpper.rotation.z = Math.PI / 2 + 0.3;
        beakUpper.position.set(0.65, 0.05, 0);
        group.add(beakUpper);

        const beakLower = new THREE.Mesh(
            new THREE.ConeGeometry(0.025, 0.2, 6),
            beakMat
        );
        beakLower.rotation.z = Math.PI / 2 - 0.2;
        beakLower.position.set(0.65, 0.02, 0);
        group.add(beakLower);

        // Eye
        const eye = new THREE.Mesh(
            new THREE.SphereGeometry(0.03, 6, 4),
            eyeMat
        );
        eye.position.set(0.45, 0.08, 0);
        group.add(eye);

        // Deeply notched wings - 2.3-2.8m wingspan
        // Left wing with primary feathers
        const wingSegmentCount = 6;
        const wingLength = 1.2;
        
        for (let i = 0; i < wingSegmentCount; i++) {
            const segLength = wingLength / wingSegmentCount;
            const primaryLength = 0.4 + i * 0.15;
            const primaryFeather = new THREE.Mesh(
                new THREE.ConeGeometry(0.02, primaryLength, 3),
                bodyMat
            );
            
            const yPos = 0.2 + i * 0.08;
            const zPos = 0.6 + i * 0.18;
            
            primaryFeather.position.set(0.3, yPos, zPos);
            primaryFeather.rotation.x = 0.5 + i * 0.05;
            primaryFeather.rotation.z = -0.1 - i * 0.03;
            primaryFeather.scale.z = 0.1;
            
            group.add(primaryFeather);
            this.primaryFeathers.push({
                mesh: primaryFeather,
                baseRot: primaryFeather.rotation.x,
                index: i
            });
        }

        // Right wing mirrored
        for (let i = 0; i < wingSegmentCount; i++) {
            const segLength = wingLength / wingSegmentCount;
            const primaryLength = 0.4 + i * 0.15;
            const primaryFeather = new THREE.Mesh(
                new THREE.ConeGeometry(0.02, primaryLength, 3),
                bodyMat
            );
            
            const yPos = 0.2 + i * 0.08;
            const zPos = -0.6 - i * 0.18;
            
            primaryFeather.position.set(0.3, yPos, zPos);
            primaryFeather.rotation.x = 0.5 + i * 0.05;
            primaryFeather.rotation.z = 0.1 + i * 0.03;
            primaryFeather.scale.z = 0.1;
            
            group.add(primaryFeather);
            this.primaryFeathers.push({
                mesh: primaryFeather,
                baseRot: primaryFeather.rotation.x,
                index: i
            });
        }

        // Forked tail - deeply V-shaped
        const leftTail = new THREE.Mesh(
            new THREE.ConeGeometry(0.03, 0.6, 3),
            bodyMat
        );
        leftTail.position.set(-0.4, 0.1, 0.25);
        leftTail.rotation.x = 0.3;
        leftTail.rotation.z = -0.4;
        leftTail.scale.z = 0.12;
        group.add(leftTail);

        const rightTail = new THREE.Mesh(
            new THREE.ConeGeometry(0.03, 0.6, 3),
            bodyMat
        );
        rightTail.position.set(-0.4, 0.1, -0.25);
        rightTail.rotation.x = 0.3;
        rightTail.rotation.z = 0.4;
        rightTail.scale.z = 0.12;
        group.add(rightTail);

        // Red gular pouch (males only) - inflates to bright red
        if (this.isMale) {
            const pouchGeo = new THREE.SphereGeometry(0.15, 8, 6);
            const pouchMat = new THREE.MeshStandardMaterial({ 
                color: 0xFF1744,
                roughness: 0.4,
                metalness: 0.1
            });
            this.pouch = new THREE.Mesh(pouchGeo, pouchMat);
            this.pouch.position.set(0.1, -0.15, 0);
            this.pouch.scale.set(0.3, 0.3, 1);
            group.add(this.pouch);
        }

        // Legs/feet (small when flying)
        const legGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.15);
        const leftLeg = new THREE.Mesh(legGeo, beakMat);
        leftLeg.position.set(0.2, -0.15, 0.1);
        leftLeg.rotation.x = 0.8;
        group.add(leftLeg);

        const rightLeg = new THREE.Mesh(legGeo, beakMat);
        rightLeg.position.set(0.2, -0.15, -0.1);
        rightLeg.rotation.x = 0.8;
        group.add(rightLeg);

        this.mesh = group;
        this.mesh.scale.setScalar(1.8);
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
        
        // Soaring/gliding wings - frigatebirds are master gliders with 2.8m wingspan
        const wingspread = Math.sin(time * 0.5) * 0.15;
        
        // Animate primary feathers for wingtip articulation
        this.primaryFeathers.forEach(f => {
            const adjustment = Math.sin(time * 1.5 + f.index * 0.3) * 0.1;
            f.mesh.rotation.x = f.baseRot + adjustment;
        });
        
        // Breathing motion on gular pouch
        if (this.isMale && this.pouch) {
            const breathe = Math.sin(time * 2) * 0.1;
            this.pouch.scale.set(0.3 + breathe, 0.3 + breathe, 1);
        }
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
