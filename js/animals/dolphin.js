// js/animals/dolphin.js - Enhanced Dolphin with spinning, bow riding, and pod behaviors

class Dolphin extends Animal {
    constructor(scene, initialPosition, podIndex = 0) {
        super(scene, initialPosition, {
            speed: 12,
            turnSpeed: 2,
            viewDistance: 1500,
            updateDistance: 2500
        });

        this.podIndex = podIndex;
        this.podCenter = initialPosition.clone();
        this.isJumping = false;
        this.isSpinning = false;
        this.isBowRiding = false;
        this.jumpVelocity = new THREE.Vector3();
        this.gravity = -20;
        this.spinAngle = 0;
        this.spinSpeed = 0;
        
        // Animation states
        this.currentBehavior = 'swim';
        this.behaviorTimer = 0;
        this.breathingTimer = 0;
        this.surfaced = true;
        
        // Trail effect
        this.trailParticles = [];
    }

    createMesh() {
        const group = new THREE.Group();

        const bodyMat = new THREE.MeshStandardMaterial({ 
            color: 0x708090,
            roughness: 0.2,
            metalness: 0.3
        });
        
        const bellyMat = new THREE.MeshStandardMaterial({
            color: 0xB0C4DE,
            roughness: 0.3
        });

        // Main body - sleek torpedo shape
        const bodyGeo = new THREE.SphereGeometry(1, 16, 14);
        bodyGeo.scale(3, 0.85, 0.85);
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.castShadow = true;
        group.add(body);

        // Lighter belly
        const bellyGeo = new THREE.SphereGeometry(1, 12, 10);
        bellyGeo.scale(2.8, 0.6, 0.7);
        const belly = new THREE.Mesh(bellyGeo, bellyMat);
        belly.position.y = -0.3;
        group.add(belly);

        // Beak (rostrum)
        const beakGeo = new THREE.ConeGeometry(0.35, 1, 8);
        const beak = new THREE.Mesh(beakGeo, bodyMat);
        beak.rotation.z = -Math.PI / 2;
        beak.position.set(3.2, 0.1, 0);
        group.add(beak);

        // Blowhole
        const blowholeGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.1, 8);
        const blowhole = new THREE.Mesh(blowholeGeo, new THREE.MeshStandardMaterial({ color: 0x333333 }));
        blowhole.position.set(1.5, 0.7, 0);
        group.add(blowhole);

        // Dorsal fin
        const dorsalGeo = new THREE.ConeGeometry(0.4, 1, 4);
        dorsalGeo.scale(0.2, 1, 0.8);
        this.dorsal = new THREE.Mesh(dorsalGeo, bodyMat);
        this.dorsal.position.set(-0.2, 0.9, 0);
        this.dorsal.rotation.z = -0.3;
        this.dorsal.castShadow = true;
        group.add(this.dorsal);

        // Pectoral fins
        const finGeo = new THREE.ConeGeometry(0.35, 1.2, 4);
        finGeo.scale(1, 0.25, 1);
        
        this.leftFin = new THREE.Mesh(finGeo, bodyMat);
        this.leftFin.position.set(0.8, -0.2, 0.6);
        this.leftFin.rotation.set(0.5, 0, -0.3);
        this.leftFin.castShadow = true;
        group.add(this.leftFin);

        this.rightFin = new THREE.Mesh(finGeo, bodyMat);
        this.rightFin.position.set(0.8, -0.2, -0.6);
        this.rightFin.rotation.set(-0.5, 0, -0.3);
        this.rightFin.castShadow = true;
        group.add(this.rightFin);

        // Tail flukes - horizontal
        const tailGeo = new THREE.ConeGeometry(0.5, 0.8, 3);
        tailGeo.scale(1, 0.12, 1.5);
        this.tail = new THREE.Mesh(tailGeo, bodyMat);
        this.tail.position.set(-2.8, 0, 0);
        this.tail.rotation.y = Math.PI / 2;
        this.tail.castShadow = true;
        group.add(this.tail);

        this.mesh = group;
        this.scene.add(this.mesh);
        this.mesh.scale.setScalar(1.2);
    }

    chooseNewState() {
        const behaviors = ['swim', 'swim', 'porpoise', 'jump', 'spin', 'spyhop'];
        
        // Check if near aircraft for bow riding
        if (window.aircraft && this.canBowRide()) {
            behaviors.push('bowRide');
        }
        
        this.currentBehavior = behaviors[Math.floor(Math.random() * behaviors.length)];
        this.behaviorTimer = 2 + Math.random() * 6;
        
        switch(this.currentBehavior) {
            case 'jump':
                this.startJump(false);
                break;
            case 'spin':
                this.startJump(true); // Spinning jump
                break;
            case 'spyhop':
                this.startSpyhop();
                break;
            case 'bowRide':
                this.startBowRiding();
                break;
            case 'porpoise':
                this.startPorpoising();
                break;
            default:
                // Swimming - set target within pod
                const offset = new THREE.Vector3(
                    (Math.random() - 0.5) * 80,
                    0,
                    (Math.random() - 0.5) * 80
                );
                this.targetPosition = this.podCenter.clone().add(offset);
        }
    }

    canBowRide() {
        if (!window.aircraft) return false;
        const aircraftPos = window.aircraft.mesh ? window.aircraft.mesh.position : window.aircraft.position;
        const dist = this.position.distanceTo(aircraftPos);
        return dist < 150 && dist > 30 && this.position.y < 30;
    }

    startJump(spinning = false) {
        this.isJumping = true;
        this.isSpinning = spinning;
        this.spinAngle = 0;
        this.spinSpeed = spinning ? 720 : 0; // 720 degrees per second for spinners
        
        // Calculate jump direction toward movement
        const forward = new THREE.Vector3(1, 0, 0).applyAxisAngle(
            new THREE.Vector3(0, 1, 0), 
            this.mesh.rotation.y
        );
        
        this.jumpVelocity.set(
            forward.x * (8 + Math.random() * 4),
            7 + Math.random() * 5,
            forward.z * (8 + Math.random() * 4)
        );
    }

    startSpyhop() {
        this.isJumping = true;
        this.isSpinning = false;
        
        // Vertical rise to look around
        this.jumpVelocity.set(0, 4, 0);
        
        // Pause at top
        setTimeout(() => {
            this.jumpVelocity.y = -2;
        }, 2000);
    }

    startBowRiding() {
        this.isBowRiding = true;
        this.behaviorTimer = 5 + Math.random() * 5;
    }

    startPorpoising() {
        // Series of small jumps
        this.porpoiseCount = 3 + Math.floor(Math.random() * 4);
        this.currentPorpoise = 0;
        this.startJump(false);
    }

    update(delta, cameraPosition) {
        this.breathingTimer += delta;
        
        // Breathing - need to surface every 2-4 minutes (simulated faster)
        if (this.breathingTimer > 15 && !this.surfaced) {
            this.targetPosition = new THREE.Vector3(
                this.position.x + (Math.random() - 0.5) * 100,
                0,
                this.position.z + (Math.random() - 0.5) * 100
            );
            this.surfaced = true;
            this.breathingTimer = 0;
        } else if (this.breathingTimer > 3 && this.surfaced) {
            this.surfaced = false;
        }

        // Bow riding behavior
        if (this.isBowRiding) {
            this.updateBowRiding(delta);
            super.update(delta, cameraPosition);
            return;
        }

        super.update(delta, cameraPosition);
    }

    updateBowRiding(delta) {
        if (!window.aircraft) {
            this.isBowRiding = false;
            return;
        }
        
        const aircraft = window.aircraft;
        const aircraftPos = aircraft.mesh ? aircraft.mesh.position : aircraft.position;
        const aircraftVel = aircraft.velocity || new THREE.Vector3(10, 0, 0);
        
        // Ride the pressure wave in front of aircraft
        const bowOffset = aircraftVel.clone().normalize().multiplyScalar(-30);
        bowOffset.y = -2;
        bowOffset.x += (Math.random() - 0.5) * 10;
        bowOffset.z += (Math.random() - 0.5) * 10;
        
        const targetPos = aircraftPos.clone().add(bowOffset);
        
        // Smooth follow
        this.position.lerp(targetPos, 0.1);
        
        // Match aircraft direction
        this.mesh.lookAt(aircraftPos);
        
        // Tail flick excitedly
        if (this.tail) {
            this.tail.rotation.z = Math.sin(Date.now() * 0.02) * 0.4;
        }
        
        // Occasionally jump while bow riding
        if (Math.random() < 0.01) {
            this.startJump(Math.random() > 0.7);
        }
    }

    updateAnimation(delta) {
        const time = this.animationTime;

        if (this.isJumping) {
            // Spinning animation
            if (this.isSpinning) {
                this.spinAngle += this.spinSpeed * delta;
                this.mesh.rotation.x = this.spinAngle * Math.PI / 180;
            } else {
                // Arc rotation based on velocity
                this.mesh.rotation.z = -this.velocity.y * 0.02;
            }
            
            // Fast tail beats during jump
            if (this.tail) {
                this.tail.rotation.z = Math.sin(time * 15) * 0.4;
            }
        } else {
            // Normal swimming tail movement
            if (this.tail) {
                const speed = this.velocity.length();
                const tailSpeed = 5 + speed * 0.5;
                this.tail.rotation.z = Math.sin(time * tailSpeed) * 0.2;
            }
            
            // Fin movement
            if (this.leftFin && this.rightFin) {
                const finMove = Math.sin(time * 3) * 0.15;
                this.leftFin.rotation.x = 0.5 + finMove;
                this.rightFin.rotation.x = -0.5 - finMove;
            }
            
            // Reset spin rotation
            this.mesh.rotation.x *= 0.9;
        }
    }

    updateMovement(delta) {
        if (this.isBowRiding) {
            return; // Bow riding handles movement
        }
        
        if (this.isJumping) {
            this.velocity.copy(this.jumpVelocity);
            this.jumpVelocity.y += this.gravity * delta;

            if (this.position.y < 0 && this.jumpVelocity.y < 0) {
                // Impact
                this.createSplash();
                
                this.isJumping = false;
                this.isSpinning = false;
                this.position.y = 0;
                this.jumpVelocity.set(0, 0, 0);
                this.mesh.rotation.x = 0;
                this.mesh.rotation.z = 0;
                
                // Continue porpoising if active
                if (this.porpoiseCount && this.currentPorpoise < this.porpoiseCount) {
                    this.currentPorpoise++;
                    setTimeout(() => this.startJump(false), 200);
                }
            }
        } else if (this.targetPosition) {
            const speed = this.currentBehavior === 'porpoise' ? 15 : this.config.speed;
            this.moveToward(this.targetPosition, speed);
            this.lookAt(this.targetPosition);
            this.position.y = Math.max(0, this.position.y);

            if (this.position.distanceTo(this.targetPosition) < 8) {
                this.targetPosition = null;
            }
        }

        super.updateMovement(delta);
    }

    createSplash() {
        // Create smaller splash than whale
        const splashCount = 8 + Math.floor(Math.random() * 6);
        for (let i = 0; i < splashCount; i++) {
            const droplet = new THREE.Mesh(
                new THREE.SphereGeometry(0.15 + Math.random() * 0.25, 5, 5),
                new THREE.MeshBasicMaterial({
                    color: 0xFFFFFF,
                    transparent: true,
                    opacity: 0.7
                })
            );
            droplet.position.copy(this.position);
            droplet.position.y = Math.max(0, droplet.position.y);
            
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 8,
                4 + Math.random() * 6,
                (Math.random() - 0.5) * 8
            );
            
            this.scene.add(droplet);
            
            const animateDroplet = () => {
                velocity.y -= 9.8 * 0.016;
                droplet.position.add(velocity.clone().multiplyScalar(0.016));
                droplet.material.opacity -= 0.03;
                
                if (droplet.material.opacity <= 0 || droplet.position.y < -2) {
                    this.scene.remove(droplet);
                    droplet.geometry.dispose();
                    droplet.material.dispose();
                } else {
                    requestAnimationFrame(animateDroplet);
                }
            };
            animateDroplet();
        }
    }

    updatePodCenter(center) {
        this.podCenter.copy(center);
    }
}

window.Dolphin = Dolphin;