// js/animals/whale.js - Enhanced Whale species with complex behaviors

class Whale extends Animal {
    constructor(scene, initialPosition) {
        super(scene, initialPosition, {
            speed: 3,
            turnSpeed: 0.3,
            viewDistance: 2500,
            updateDistance: 4000
        });

        this.patrolCenter = initialPosition.clone();
        this.patrolRadius = 800 + Math.random() * 600;
        this.spoutTimer = 3 + Math.random() * 8;
        this.spoutDuration = 0;
        this.spoutMesh = null;
        this.spoutParticles = [];
        
        // Breaching behavior
        this.canBreach = true;
        this.breachTimer = 10 + Math.random() * 20;
        this.breachState = 'none'; // none, approach, launch, airborne, splash
        this.breachProgress = 0;
        this.breachStartPos = new THREE.Vector3();
        this.breachDirection = new THREE.Vector3();
        this.preBreachDepth = 0;
        
        // Tail slap behavior
        this.tailSlapTimer = 5 + Math.random() * 15;
        this.isTailSlapping = false;
        this.tailSlapPhase = 0;
    }

    createMesh() {
        const group = new THREE.Group();

        const bodyMat = new THREE.MeshStandardMaterial({ 
            color: 0x2C3E50,
            roughness: 0.3,
            metalness: 0.1
        });
        
        const bellyMat = new THREE.MeshStandardMaterial({
            color: 0x5D6D7E,
            roughness: 0.4
        });

        // Main body - streamlined whale shape
        const bodyGeo = new THREE.SphereGeometry(1, 20, 16);
        bodyGeo.scale(7, 2.8, 3);
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.castShadow = true;
        group.add(body);

        // Belly (lighter underside)
        const bellyGeo = new THREE.SphereGeometry(1, 16, 8);
        bellyGeo.scale(6.5, 2.5, 2.8);
        const belly = new THREE.Mesh(bellyGeo, bellyMat);
        belly.position.y = -0.5;
        group.add(belly);

        // Head with distinct snout
        const headGeo = new THREE.SphereGeometry(1, 16, 14);
        headGeo.scale(2.8, 2.2, 2.2);
        const head = new THREE.Mesh(headGeo, bodyMat);
        head.position.set(6, 0.3, 0);
        head.castShadow = true;
        group.add(head);

        // Blowhole (for spouting)
        const blowholeGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.3, 8);
        const blowhole = new THREE.Mesh(blowholeGeo, new THREE.MeshStandardMaterial({ color: 0x1a1a1a }));
        blowhole.position.set(4.5, 2.5, 0);
        group.add(blowhole);

        // Tail flukes - horizontal
        const tailGeo = new THREE.ConeGeometry(1.8, 1.2, 3);
        tailGeo.scale(1, 0.15, 1.8);
        this.tail = new THREE.Mesh(tailGeo, bodyMat);
        this.tail.position.set(-6.5, 0, 0);
        this.tail.rotation.y = Math.PI / 2;
        this.tail.castShadow = true;
        group.add(this.tail);

        // Pectoral fins
        const finGeo = new THREE.ConeGeometry(0.6, 2.2, 4);
        finGeo.scale(1, 0.3, 1);
        
        const leftFin = new THREE.Mesh(finGeo, bodyMat);
        leftFin.position.set(1, -0.5, 2);
        leftFin.rotation.set(-0.4, 0, -0.5);
        leftFin.castShadow = true;
        group.add(leftFin);
        this.leftFin = leftFin;

        const rightFin = new THREE.Mesh(finGeo, bodyMat);
        rightFin.position.set(1, -0.5, -2);
        rightFin.rotation.set(0.4, 0, -0.5);
        rightFin.castShadow = true;
        group.add(rightFin);
        this.rightFin = rightFin;

        // Dorsal fin
        const dorsalGeo = new THREE.ConeGeometry(0.4, 1.5, 4);
        dorsalGeo.scale(0.3, 1, 1);
        const dorsal = new THREE.Mesh(dorsalGeo, bodyMat);
        dorsal.position.set(-1, 2.8, 0);
        dorsal.rotation.z = -0.3;
        group.add(dorsal);
        this.dorsal = dorsal;

        // Create spout effect (hidden initially)
        this.createSpoutEffect(group);

        this.mesh = group;
        this.scene.add(this.mesh);
        this.mesh.scale.setScalar(2.5);
        
        // Store initial position for breaching calculations
        this.preBreachDepth = this.position.y;
    }

    createSpoutEffect(group) {
        // Spout particle system simulation
        const spoutGeo = new THREE.ConeGeometry(0.8, 12, 8);
        const spoutMat = new THREE.MeshBasicMaterial({
            color: 0xFFFFFF,
            transparent: true,
            opacity: 0
        });
        this.spoutMesh = new THREE.Mesh(spoutGeo, spoutMat);
        this.spoutMesh.position.set(4.5, 8, 0);
        group.add(this.spoutMesh);
    }

    chooseNewState() {
        if (this.breachState !== 'none') return; // Don't interrupt breaching
        
        const states = ['swim', 'swim', 'surface', 'dive', 'tailSlap'];
        if (this.canBreach && this.position.y > -5) {
            states.push('prepareBreach');
        }
        
        this.state = states[Math.floor(Math.random() * states.length)];
        this.stateTimer = 10 + Math.random() * 20;

        switch(this.state) {
            case 'swim':
                this.targetPosition = this.getRandomPoint(this.patrolCenter, this.patrolRadius);
                break;
            case 'surface':
                this.targetPosition = new THREE.Vector3(
                    this.position.x + (Math.random() - 0.5) * 200,
                    2, // Surface level
                    this.position.z + (Math.random() - 0.5) * 200
                );
                break;
            case 'dive':
                this.targetPosition = new THREE.Vector3(
                    this.position.x + (Math.random() - 0.5) * 300,
                    -30 - Math.random() * 20,
                    this.position.z + (Math.random() - 0.5) * 300
                );
                break;
            case 'prepareBreach':
                this.state = 'swim'; // Set up for breach
                this.breachTimer = 3; // Short timer before breach
                break;
            case 'tailSlap':
                this.isTailSlapping = true;
                this.tailSlapPhase = 0;
                this.stateTimer = 5;
                break;
        }
    }

    update(delta, cameraPosition) {
        // Breaching takes precedence
        if (this.breachState !== 'none') {
            this.updateBreach(delta);
            this.mesh.position.copy(this.position);
            return;
        }

        // Check for breach initiation
        if (this.breachTimer > 0) {
            this.breachTimer -= delta;
            if (this.breachTimer <= 0 && this.canBreach) {
                this.startBreach();
            }
        }

        // Regular spouting at surface
        if (this.position.y > -2) {
            this.updateSpout(delta);
        }

        // Tail slap animation
        if (this.isTailSlapping) {
            this.updateTailSlap(delta);
        }

        super.update(delta, cameraPosition);
    }

    startBreach() {
        this.breachState = 'approach';
        this.breachProgress = 0;
        this.breachStartPos.copy(this.position);
        
        // Pick breach direction (away from camera for best view)
        this.breachDirection.set(
            (Math.random() - 0.5),
            0,
            (Math.random() - 0.5)
        ).normalize();
        
        this.preBreachDepth = this.position.y;
    }

    updateBreach(delta) {
        const speed = 8; // Much faster during breach
        
        switch(this.breachState) {
            case 'approach':
                // Swim fast toward breach point
                this.breachProgress += delta * 0.3;
                const approachDist = 50;
                this.position.x = this.breachStartPos.x + this.breachDirection.x * approachDist * this.breachProgress;
                this.position.z = this.breachStartPos.z + this.breachDirection.z * approachDist * this.breachProgress;
                this.position.y = this.preBreachDepth - 10; // Dive deep first
                
                // Orient toward breach direction
                this.lookAt(new THREE.Vector3(
                    this.position.x + this.breachDirection.x * 100,
                    20,
                    this.position.z + this.breachDirection.z * 100
                ));
                
                if (this.breachProgress >= 1) {
                    this.breachState = 'launch';
                    this.breachProgress = 0;
                }
                break;
                
            case 'launch':
                // Launch out of water
                this.breachProgress += delta * 0.4;
                const launchHeight = 15;
                const launchDist = 30;
                
                this.position.x += this.breachDirection.x * speed * delta;
                this.position.z += this.breachDirection.z * speed * delta;
                this.position.y = -15 + this.breachProgress * (launchHeight + 15);
                
                // Arc trajectory
                const arc = Math.sin(this.breachProgress * Math.PI) * 0.5;
                this.mesh.rotation.z = -arc;
                
                if (this.breachProgress >= 1) {
                    this.breachState = 'airborne';
                    this.breachProgress = 0;
                }
                break;
                
            case 'airborne':
                // Brief moment airborne
                this.breachProgress += delta * 0.8;
                this.position.y -= 5 * delta; // Gravity
                this.position.x += this.breachDirection.x * 5 * delta;
                this.position.z += this.breachDirection.z * 5 * delta;
                
                if (this.breachProgress >= 1 || this.position.y < 5) {
                    this.breachState = 'splash';
                    this.breachProgress = 0;
                    this.createSplash();
                }
                break;
                
            case 'splash':
                // Impact and re-enter
                this.breachProgress += delta * 0.5;
                this.position.y -= 20 * delta;
                this.position.x += this.breachDirection.x * 3 * delta;
                this.position.z += this.breachDirection.z * 3 * delta;
                
                // Reset rotation
                this.mesh.rotation.z *= 0.9;
                
                if (this.position.y < this.preBreachDepth) {
                    this.breachState = 'none';
                    this.canBreach = false;
                    setTimeout(() => { this.canBreach = true; }, 30000); // 30s cooldown
                    this.chooseNewState();
                }
                break;
        }
    }

    createSplash() {
        // Create splash effect
        const splashCount = 20 + Math.floor(Math.random() * 15);
        for (let i = 0; i < splashCount; i++) {
            const droplet = new THREE.Mesh(
                new THREE.SphereGeometry(0.3 + Math.random() * 0.5, 6, 6),
                new THREE.MeshBasicMaterial({
                    color: 0xFFFFFF,
                    transparent: true,
                    opacity: 0.8
                })
            );
            droplet.position.copy(this.position);
            droplet.position.y = Math.max(0, droplet.position.y);
            
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 15,
                8 + Math.random() * 12,
                (Math.random() - 0.5) * 15
            );
            
            this.scene.add(droplet);
            
            // Animate and remove
            const animateDroplet = () => {
                velocity.y -= 9.8 * 0.016;
                droplet.position.add(velocity.clone().multiplyScalar(0.016));
                droplet.material.opacity -= 0.02;
                
                if (droplet.material.opacity <= 0 || droplet.position.y < -5) {
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

    updateSpout(delta) {
        this.spoutTimer -= delta;
        
        if (this.spoutTimer <= 0 && this.spoutTimer > -2) {
            // Active spout
            this.spoutDuration += delta;
            const intensity = Math.sin(this.spoutDuration * Math.PI / 2);
            
            if (this.spoutMesh && this.spoutMesh.material) {
                this.spoutMesh.material.opacity = intensity * 0.7;
                this.spoutMesh.scale.set(
                    0.5 + intensity * 0.5,
                    0.5 + intensity,
                    0.5 + intensity * 0.5
                );
            }
            
            if (this.spoutDuration >= 2) {
                this.spoutTimer = 10 + Math.random() * 15; // Reset
                this.spoutDuration = 0;
                if (this.spoutMesh && this.spoutMesh.material) {
                    this.spoutMesh.material.opacity = 0;
                }
            }
        }
    }

    updateTailSlap(delta) {
        this.tailSlapPhase += delta * 3;
        const slap = Math.sin(this.tailSlapPhase);
        
        // Raise tail high then slam down
        if (this.tail) {
            this.tail.rotation.z = -0.5 + slap * 1.5;
        }
        
        if (this.tailSlapPhase > Math.PI) {
            this.isTailSlapping = false;
            if (this.tail) this.tail.rotation.z = 0;
            
            // Create splash at surface
            if (this.position.y > -5) {
                this.createSplash();
            }
        }
    }

    updateAnimation(delta) {
        const time = this.animationTime;

        // Regular swimming tail movement
        if (!this.isTailSlapping && this.tail && this.breachState === 'none') {
            this.tail.rotation.z = Math.sin(time * 1.5) * 0.15;
        }

        // Fin movement
        if (this.leftFin && this.rightFin) {
            const finMovement = Math.sin(time * 0.8) * 0.1;
            this.leftFin.rotation.x = -0.4 + finMovement;
            this.rightFin.rotation.x = 0.4 - finMovement;
        }
    }

    updateMovement(delta) {
        if (this.breachState !== 'none') return; // Breaching handles its own movement
        
        if (this.targetPosition && !this.isTailSlapping) {
            this.moveToward(this.targetPosition, this.config.speed);
            this.lookAt(this.targetPosition);

            if (this.position.distanceTo(this.targetPosition) < 20) {
                this.targetPosition = null;
            }
        }

        super.updateMovement(delta);
    }
}

window.Whale = Whale;