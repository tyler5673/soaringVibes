// ========== AIRCRAFT ==========
class Aircraft {
    constructor() {
        this.mass = 1100;
        this.wingArea = 16;
        this.maxThrust = 3500;
        this.maxSpeed = 80;
        this.airDensity = 1.225;
        
        this.rollRate = degreesToRadians(45);
        this.pitchRate = degreesToRadians(30);
        this.yawRate = degreesToRadians(20);
        
        this.position = new THREE.Vector3(0, 760, -100);
        this.velocity = new THREE.Vector3(0, 0, 60);
        this.rotation = new THREE.Euler(0, Math.PI, 0, 'YXZ');
        this.throttle = 0.5;
        this.altitude = 8;
        
        this.controlInput = { pitch: 0, roll: 0, yaw: 0 };
        this.ias = 0;
        this.groundSpeed = 0;
        this.crashed = false;
        
        this.propeller = null;
        this.leftFlap = null;
        this.rightFlap = null;
        this.aileronL = null;
        this.aileronR = null;
        this.rudder = null;
        this.elevator = null;
        
        this.mesh = this.createMesh();
    }
    
    setRandomStartPosition() {
        // Pick a random island
        const islandPositions = [
            { name: 'maui', x: 0, z: 0 },
            { name: 'big-island', x: 3200, z: -6400 },
            { name: 'oahu', x: -6400, z: -2800 },
            { name: 'kauai', x: -12000, z: -4000 },
            { name: 'molokai', x: -1400, z: -3600 },
            { name: 'lanai', x: 1400, z: -3200 },
            { name: 'niihau', x: -9600, z: -4800 },
            { name: 'kahoolawe', x: 2200, z: -2200 }
        ];
        
        const island = islandPositions[Math.floor(Math.random() * islandPositions.length)];
        
        // Random offset from island center (0-2000m away)
        const offsetDistance = Math.random() * 2000;
        const offsetAngle = Math.random() * Math.PI * 2;
        
        const startX = island.x + Math.cos(offsetAngle) * offsetDistance;
        const startZ = island.z + Math.sin(offsetAngle) * offsetDistance;
        
        // Get actual terrain height at this location to avoid spawning inside island
        let terrainHeight = 0;
        if (typeof getTerrainHeight === 'function') {
            terrainHeight = getTerrainHeight(startX, startZ);
        }
        
        // Random height: 500-3000 ft ABOVE the terrain (not sea level)
        // 500 ft = 152m, 3000 ft = 914m
        const altitudeAboveTerrain = 152 + Math.random() * 762;
        const finalAltitude = Math.max(terrainHeight + altitudeAboveTerrain, 152);
        
        // Set position
        this.position.set(startX, finalAltitude, startZ);
        
        // Set forward momentum - flying roughly toward/around the island
        // Calculate direction to island center
        const dirToIsland = new THREE.Vector3(island.x - startX, 0, island.z - startZ).normalize();
        
        // Add some randomness to direction (fly at slight angle toward island)
        const angleVariation = (Math.random() - 0.5) * Math.PI * 0.5; // +/- 45 degrees
        
        // Calculate angle using atan2 with (z, x) to get standard mathematical angle
        // Then adjust so that rotation.y = angle gives forward pointing in velocity direction
        const angleToIsland = Math.atan2(dirToIsland.z, dirToIsland.x);
        const finalAngle = angleToIsland + angleVariation;
        
        // Forward speed: 60 m/s
        const speed = 60;
        
        // Set velocity based on angle
        this.velocity.set(
            Math.cos(finalAngle) * speed,
            0,
            Math.sin(finalAngle) * speed
        );
        
        // Set rotation to face velocity direction
        const vx = this.velocity.x;
        const vz = this.velocity.z;
        this.rotation.x = 0;
        this.rotation.y = Math.atan2(vx, vz) + Math.PI;
        this.rotation.z = 0;
        
        // Update mesh position
        if (this.mesh) {
            this.mesh.position.copy(this.position);
            this.mesh.rotation.copy(this.rotation);
        }
        
        // Reset control inputs
        this.controlInput = { pitch: 0, roll: 0, yaw: 0 };
        this.throttle = 0.5;
        
        console.log(`Aircraft spawned near ${island.name}: pos(${startX.toFixed(0)}, ${finalAltitude.toFixed(0)}m [${altitudeAboveTerrain.toFixed(0)}m above terrain at ${terrainHeight.toFixed(0)}m], ${startZ.toFixed(0)})`);
    }
    
    createMesh() {
        const group = new THREE.Group();
        
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.6, metalness: 0.1 });
        const stripeMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.5 });
        const glassMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2e, transparent: true, opacity: 0.7, roughness: 0.1, metalness: 0.3 });
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.8 });
        const strutMat = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.5, metalness: 0.4 });
        const metalMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8, roughness: 0.3 });
        const engineMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.4, metalness: 0.6 });
        const exhaustMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.7 });
        const blackMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
        
        // Plane orientation: +X = right wing, -X = left wing, +Z = tail, -Z = nose
        // Y is up
        
        const fuselageLength = 8;
        const fuselageRadius = 0.65;
        
        // Main fuselage - cylinder along Z axis
        const fuselageGeo = new THREE.CylinderGeometry(fuselageRadius, fuselageRadius * 0.7, fuselageLength, 16);
        fuselageGeo.rotateX(Math.PI / 2);
        const fuselage = new THREE.Mesh(fuselageGeo, bodyMat);
        group.add(fuselage);
        
        // Nose cowling - wider at front
        const noseGeo = new THREE.CylinderGeometry(fuselageRadius * 1.1, fuselageRadius, 1.8, 16);
        noseGeo.rotateX(Math.PI / 2);
        const noseCowling = new THREE.Mesh(noseGeo, bodyMat);
        noseCowling.position.z = -3.6;
        group.add(noseCowling);
        
        // Cowl ring
        const cowlRingGeo = new THREE.TorusGeometry(fuselageRadius * 1.05, 0.08, 8, 20);
        const cowlRing = new THREE.Mesh(cowlRingGeo, bodyMat);
        cowlRing.position.z = -2.95;
        cowlRing.rotation.x = Math.PI / 2;
        group.add(cowlRing);
        
        // Tail taper
        const tailTaperGeo = new THREE.CylinderGeometry(fuselageRadius * 0.65, fuselageRadius * 0.35, 2.0, 14);
        tailTaperGeo.rotateX(Math.PI / 2);
        const tailTaper = new THREE.Mesh(tailTaperGeo, bodyMat);
        tailTaper.position.z = 4.1;
        group.add(tailTaper);
        
        // Tail cone
        const tailConeGeo = new THREE.ConeGeometry(fuselageRadius * 0.35, 1.2, 14);
        tailConeGeo.rotateX(-Math.PI / 2);
        const tailCone = new THREE.Mesh(tailConeGeo, bodyMat);
        tailCone.position.z = 5.35;
        group.add(tailCone);
        
        // Firewall
        const firewallGeo = new THREE.CircleGeometry(fuselageRadius * 0.85, 16);
        const firewall = new THREE.Mesh(firewallGeo, exhaustMat);
        firewall.position.z = -2.9;
        group.add(firewall);
        
        // Windshield frame
        const windshieldFrame = new THREE.Mesh(
            new THREE.BoxGeometry(1.0, 0.55, 0.08),
            new THREE.MeshStandardMaterial({ color: 0x333333 })
        );
        windshieldFrame.position.set(0, 0.5, -2.85);
        windshieldFrame.rotation.x = -0.3;
        group.add(windshieldFrame);
        
        // Windshield glass
        const windshield = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.45, 0.04), glassMat);
        windshield.position.set(0, 0.52, -2.9);
        windshield.rotation.x = -0.3;
        group.add(windshield);
        
        // Side windows
        const sideWindowGeo = new THREE.BoxGeometry(0.04, 0.32, 0.45);
        
        const pilotWindow = new THREE.Mesh(sideWindowGeo, glassMat);
        pilotWindow.position.set(-0.66, 0.42, -2.0);
        group.add(pilotWindow);
        
        const copilotWindow = new THREE.Mesh(sideWindowGeo, glassMat);
        copilotWindow.position.set(0.66, 0.42, -2.0);
        group.add(copilotWindow);
        
        // Passenger windows
        const passWindowGeo = new THREE.BoxGeometry(0.04, 0.28, 0.35);
        for (let side of [-1, 1]) {
            for (let i = 0; i < 2; i++) {
                const pw = new THREE.Mesh(passWindowGeo, glassMat);
                pw.position.set(side * 0.66, 0.38, -0.6 + i * 0.75);
                group.add(pw);
            }
        }
        
        // Exhaust pipes
        const exhaustGeo = new THREE.CylinderGeometry(0.045, 0.055, 0.35, 8);
        [-0.22, 0.22].forEach(x => {
            const exhaust = new THREE.Mesh(exhaustGeo, exhaustMat);
            exhaust.position.set(x, -0.22, -3.25);
            exhaust.rotation.x = Math.PI / 3;
            group.add(exhaust);
        });
        
        // === PROPELLER ===
        this.propeller = new THREE.Group();
        const bladeMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.8, roughness: 0.3 });
        
        for (let i = 0; i < 3; i++) {
            const bladeGroup = new THREE.Group();
            
            const blade = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.85, 0.15), bladeMat);
            blade.position.y = 0.92;
            bladeGroup.add(blade);
            
            const tip = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.18, 0.12), bladeMat);
            tip.position.y = 1.85;
            bladeGroup.add(tip);
            
            bladeGroup.rotation.z = (i * Math.PI * 2) / 3;
            this.propeller.add(bladeGroup);
        }
        
        // Spinner
        const spinner = new THREE.Mesh(
            new THREE.SphereGeometry(0.2, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2),
            stripeMat
        );
        spinner.rotation.x = -Math.PI / 2;
        this.propeller.add(spinner);
        
        this.propeller.position.z = -4.35;
        group.add(this.propeller);
        
        // === HIGH WING ===
        const wingSpan = 11;
        const wingChord = 1.5;
        const wingThickness = 0.16;
        const wingY = 0.72; // On top of fuselage
        
        // Wing root - connects to top of fuselage
        const wingRootGeo = new THREE.BoxGeometry(1.35, wingThickness * 1.2, wingChord * 1.15);
        
        const leftWingRoot = new THREE.Mesh(wingRootGeo, bodyMat);
        leftWingRoot.position.set(-0.68, wingY, -0.25);
        group.add(leftWingRoot);
        
        const rightWingRoot = new THREE.Mesh(wingRootGeo, bodyMat);
        rightWingRoot.position.set(0.68, wingY, -0.25);
        group.add(rightWingRoot);
        
        // Wing struts
        const strutGeo = new THREE.CylinderGeometry(0.045, 0.04, 0.5, 8);
        [-1, 1].forEach(side => {
            const strut = new THREE.Mesh(strutGeo, strutMat);
            strut.position.set(side * 1.3, wingY - 0.28, -0.25);
            group.add(strut);
        });
        
        // Main wing panels
        const wingPanelGeo = new THREE.BoxGeometry(wingSpan / 2 - 0.9, wingThickness, wingChord);
        
        const leftWing = new THREE.Mesh(wingPanelGeo, bodyMat);
        leftWing.position.set(-(wingSpan / 2 + 0.1), wingY, -0.25);
        group.add(leftWing);
        
        const rightWing = new THREE.Mesh(wingPanelGeo, bodyMat);
        rightWing.position.set(wingSpan / 2 + 0.1, wingY, -0.25);
        group.add(rightWing);
        
        // Wing stripes
        const stripeGeo = new THREE.BoxGeometry(wingSpan / 2 - 1.8, wingThickness + 0.015, wingChord * 0.45);
        
        const leftStripe = new THREE.Mesh(stripeGeo, stripeMat);
        leftStripe.position.set(-wingSpan / 2 + 0.6, wingY + 0.01, -0.25);
        group.add(leftStripe);
        
        const rightStripe = new THREE.Mesh(stripeGeo, stripeMat);
        rightStripe.position.set(wingSpan / 2 - 0.6, wingY + 0.01, -0.25);
        group.add(rightStripe);
        
        // Flaps
        const flapGeo = new THREE.BoxGeometry(wingSpan / 2 - 2.4, wingThickness + 0.04, wingChord * 0.32);
        
        this.leftFlap = new THREE.Mesh(flapGeo, bodyMat);
        this.leftFlap.position.set(-wingSpan / 2 + 0.4, wingY, wingChord * 0.32);
        group.add(this.leftFlap);
        
        this.rightFlap = new THREE.Mesh(flapGeo, bodyMat);
        this.rightFlap.position.set(wingSpan / 2 - 0.4, wingY, wingChord * 0.32);
        group.add(this.rightFlap);
        
        // Ailerons
        const aileronGeo = new THREE.BoxGeometry(wingSpan / 2 - 2.8, wingThickness + 0.06, wingChord * 0.28);
        
        this.aileronL = new THREE.Mesh(aileronGeo, bodyMat);
        this.aileronL.position.set(-wingSpan / 2 + 0.55, wingY, -wingChord * 0.32);
        group.add(this.aileronL);
        
        this.aileronR = new THREE.Mesh(aileronGeo, bodyMat);
        this.aileronR.position.set(wingSpan / 2 - 0.55, wingY, -wingChord * 0.32);
        group.add(this.aileronR);
        
        // Wing tips
        const tipGeo = new THREE.BoxGeometry(0.22, wingThickness * 1.8, wingChord * 0.45);
        
        const leftTip = new THREE.Mesh(tipGeo, stripeMat);
        leftTip.position.set(-wingSpan / 2 - 0.08, wingY + 0.12, -0.25);
        leftTip.rotation.z = -0.25;
        group.add(leftTip);
        
        const rightTip = new THREE.Mesh(tipGeo, stripeMat);
        rightTip.position.set(wingSpan / 2 + 0.08, wingY + 0.12, -0.25);
        rightTip.rotation.z = 0.25;
        group.add(rightTip);
        
        // Navigation lights
        const navLightGeo = new THREE.SphereGeometry(0.045, 8, 6);
        const redLightMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.8 });
        const greenLightMat = new THREE.MeshStandardMaterial({ color: 0x00ff00, emissive: 0x00ff00, emissiveIntensity: 0.8 });
        
        const leftNavLight = new THREE.Mesh(navLightGeo, redLightMat);
        leftNavLight.position.set(-wingSpan / 2 - 0.08, wingY + 0.08, -0.25);
        group.add(leftNavLight);
        
        const rightNavLight = new THREE.Mesh(navLightGeo, greenLightMat);
        rightNavLight.position.set(wingSpan / 2 + 0.08, wingY + 0.08, -0.25);
        group.add(rightNavLight);
        
        // === TAIL SECTION ===
        const tailZ = 3.95;
        
        // Vertical stabilizer - rises from top of tail section
        const vStabHeight = 1.9;
        const vStabChord = 1.25;
        
        const vStabGeo = new THREE.BoxGeometry(vStabChord, vStabHeight, 0.1);
        const vStab = new THREE.Mesh(vStabGeo, bodyMat);
        vStab.position.set(0, vStabHeight / 2 + 0.1, tailZ);
        group.add(vStab);
        
        // Rudder - below vertical stabilizer
        this.rudder = new THREE.Mesh(
            new THREE.BoxGeometry(vStabChord * 0.45, vStabHeight * 0.55, 0.1),
            bodyMat
        );
        this.rudder.position.set(0, vStabHeight * 0.28 + 0.1, tailZ + vStabChord * 0.22);
        group.add(this.rudder);
        
        // Rudder stripe
        const rudderStripe = new THREE.Mesh(
            new THREE.BoxGeometry(vStabChord * 0.25, vStabHeight * 0.4, 0.11),
            stripeMat
        );
        rudderStripe.position.set(0, vStabHeight * 0.22 + 0.1, tailZ + vStabChord * 0.22);
        group.add(rudderStripe);
        
        // Horizontal stabilizer
        const hStabSpan = 3.0;
        const hStabChord = 0.9;
        
        const hStabGeo = new THREE.BoxGeometry(hStabSpan / 2 - 0.1, 0.08, hStabChord);
        
        const leftHStab = new THREE.Mesh(hStabGeo, bodyMat);
        leftHStab.position.set(-hStabSpan / 2, 0.12, tailZ);
        group.add(leftHStab);
        
        const rightHStab = new THREE.Mesh(hStabGeo, bodyMat);
        rightHStab.position.set(hStabSpan / 2, 0.12, tailZ);
        group.add(rightHStab);
        
        // Elevator
        this.elevator = new THREE.Mesh(
            new THREE.BoxGeometry(hStabSpan * 0.85, 0.08, hStabChord * 0.55),
            bodyMat
        );
        this.elevator.position.set(0, 0.14, tailZ + hStabChord * 0.28);
        group.add(this.elevator);
        
        // Elevator stripe
        const elevatorStripe = new THREE.Mesh(
            new THREE.BoxGeometry(hStabSpan * 0.4, 0.09, hStabChord * 0.3),
            stripeMat
        );
        elevatorStripe.position.set(0, 0.14, tailZ + hStabChord * 0.22);
        group.add(elevatorStripe);
        
        // === LANDING GEAR ===
        const noseWheelY = -0.52;
        const noseWheelZ = -2.45;
        const mainWheelY = -0.52;
        const mainWheelZ = 1.0;
        const mainWheelSpread = 1.35;
        
        // Nose gear strut
        const noseStrutGeo = new THREE.CylinderGeometry(0.045, 0.055, 0.7, 8);
        const noseStrut = new THREE.Mesh(noseStrutGeo, strutMat);
        noseStrut.position.set(0, noseWheelY + 0.32, noseWheelZ - 0.2);
        noseStrut.rotation.x = Math.PI / 4.5;
        group.add(noseStrut);
        
        // Nose wheel
        const noseWheelGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.1, 14);
        noseWheelGeo.rotateZ(Math.PI / 2);
        const noseWheel = new THREE.Mesh(noseWheelGeo, wheelMat);
        noseWheel.position.set(0, noseWheelY, noseWheelZ);
        group.add(noseWheel);
        
        // Nose gear fairing
        const noseFairing = new THREE.Mesh(
            new THREE.CylinderGeometry(0.12, 0.09, 0.35, 8),
            bodyMat
        );
        noseFairing.rotation.x = Math.PI / 4.5;
        noseFairing.position.set(0, noseWheelY + 0.45, noseWheelZ - 0.35);
        group.add(noseFairing);
        
        // Main gear struts
        const mainStrutGeo = new THREE.CylinderGeometry(0.055, 0.065, 0.85, 8);
        
        const leftMainStrut = new THREE.Mesh(mainStrutGeo, strutMat);
        leftMainStrut.position.set(-mainWheelSpread, mainWheelY + 0.38, mainWheelZ);
        leftMainStrut.rotation.z = 0.08;
        group.add(leftMainStrut);
        
        const rightMainStrut = new THREE.Mesh(mainStrutGeo, strutMat);
        rightMainStrut.position.set(mainWheelSpread, mainWheelY + 0.38, mainWheelZ);
        rightMainStrut.rotation.z = -0.08;
        group.add(rightMainStrut);
        
        // Main wheels
        const mainWheelGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.12, 14);
        mainWheelGeo.rotateZ(Math.PI / 2);
        
        const leftMainWheel = new THREE.Mesh(mainWheelGeo, wheelMat);
        leftMainWheel.position.set(-mainWheelSpread, mainWheelY, mainWheelZ);
        group.add(leftMainWheel);
        
        const rightMainWheel = new THREE.Mesh(mainWheelGeo, wheelMat);
        rightMainWheel.position.set(mainWheelSpread, mainWheelY, mainWheelZ);
        group.add(rightMainWheel);
        
        // Axle
        const axle = new THREE.Mesh(
            new THREE.CylinderGeometry(0.035, 0.035, mainWheelSpread * 2 + 0.15, 8),
            strutMat
        );
        axle.position.set(0, mainWheelY, mainWheelZ);
        axle.rotation.z = Math.PI / 2;
        group.add(axle);
        
        // === ANTENNAS ===
        // VOR antenna on top of vertical stabilizer
        const vor = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.3, 6), metalMat);
        vor.position.set(0, vStabHeight + 0.15, tailZ + vStabChord * 0.35);
        group.add(vor);
        
        // Pitot tube - left wing
        const pitot = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.012, 0.22, 6), blackMat);
        pitot.rotation.z = Math.PI / 2;
        pitot.position.set(-0.72, wingY + 0.08, -wingChord * 0.45);
        group.add(pitot);
        
        // Stall warning horn - left wing
        const stallHorn = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.035, 0.09), blackMat);
        stallHorn.position.set(-0.72, wingY - 0.08, wingChord * 0.1);
        group.add(stallHorn);
        
        group.castShadow = true;
        return group;
    }
    
    setControlInput(input) {
        this.controlInput.pitch = input.pitch;
        this.controlInput.roll = input.roll;
        this.controlInput.yaw = input.yaw;
    }
    
    setThrottle(value) {
        this.throttle = Math.max(0, Math.min(1, value));
    }
    
    applyAutoBrake(delta) {
        // Auto-brake when throttle is near zero and on ground
        const speed = this.velocity.length();
        if (this.throttle < 0.05 && speed > 1) {
            // Check if on ground (within 5m of terrain)
            let terrainHeight = -50;
            if (typeof getTerrainHeight === 'function') {
                terrainHeight = getTerrainHeight(this.position.x, this.position.z);
            }
            const heightAboveTerrain = this.position.y - terrainHeight;
            
            if (heightAboveTerrain < 5) {
                // Apply braking force - stronger at lower speeds
                const brakeForce = Math.min(speed, 15 * delta);
                this.velocity.multiplyScalar(1 - (brakeForce / speed));
            }
        }
    }
    
    updateThrottle(throttleUp, throttleDown, delta) {
        const speed = 0.5;
        if (throttleUp) this.throttle = Math.min(1, this.throttle + speed * delta);
        if (throttleDown) this.throttle = Math.max(0, this.throttle - speed * delta);
    }
    
    update(delta) {
        if (this._debugFrame === undefined) this._debugFrame = 0;
        this._debugFrame++;
        if (this._debugFrame <= 3) {
            console.log(`Frame ${this._debugFrame}: vel=(${this.velocity.x.toFixed(1)}, ${this.velocity.y.toFixed(1)}, ${this.velocity.z.toFixed(1)}), rotY=${this.rotation.y.toFixed(2)}`);
        }
        
        // Animate propeller based on throttle
        if (this.propeller) {
            this.propeller.rotation.z += this.throttle * 25 * delta;
        }
        
        // Animate control surfaces based on input
        const flapAngle = this.controlInput.roll * 0.35;
        if (this.leftFlap) this.leftFlap.rotation.x = flapAngle;
        if (this.rightFlap) this.rightFlap.rotation.x = flapAngle;
        
        const aileronAngle = this.controlInput.roll * 0.3;
        if (this.aileronL) this.aileronL.rotation.x = -aileronAngle;
        if (this.aileronR) this.aileronR.rotation.x = aileronAngle;
        
        const elevatorAngle = this.controlInput.pitch * 0.3;
        if (this.elevator) this.elevator.rotation.x = -elevatorAngle;
        
        const rudderAngle = this.controlInput.yaw * 0.35;
        if (this.rudder) this.rudder.rotation.y = rudderAngle;
        
        // Physics
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyEuler(this.rotation);
        
        const aircraftUp = new THREE.Vector3(0, 1, 0);
        aircraftUp.applyEuler(this.rotation);
        
        const right = new THREE.Vector3(1, 0, 0);
        right.applyEuler(this.rotation);
        
        const thrustMagnitude = this.throttle * this.maxThrust;
        const thrust = forward.clone().multiplyScalar(thrustMagnitude);
        
        const speed = this.velocity.length();
        
        let aoa = 0;
        if (speed > 1) {
            const velocityDir = this.velocity.clone().normalize();
            aoa = forward.angleTo(velocityDir);
            const pitchComponent = velocityDir.dot(aircraftUp);
            if (pitchComponent > 0) aoa = -aoa;
        }
        
        const stallAngle = degreesToRadians(15);
        let cl;
        if (Math.abs(aoa) < stallAngle) {
            cl = 2 * Math.PI * aoa;
        } else {
            cl = 2 * Math.PI * stallAngle * 0.5 * Math.sign(aoa);
        }
        cl = clamp(cl, -1.5, 1.5);
        
        const cd0 = 0.025;
        const k = 0.04;
        const cd = cd0 + k * cl * cl;
        
        const q = 0.5 * this.airDensity * speed * speed;
        
        // Lift perpendicular to velocity, in plane of aircraft up
        const velocityDir = speed > 0.1 ? this.velocity.clone().normalize() : forward.clone();
        let liftDir = new THREE.Vector3().crossVectors(right, velocityDir).normalize();
        if (liftDir.length() < 0.1) {
            liftDir = aircraftUp.clone();
        }
        const lift = liftDir.multiplyScalar(q * this.wingArea * cl);
        
        const drag = velocityDir.clone().multiplyScalar(-q * this.wingArea * cd);
        
        const weight = new THREE.Vector3(0, -this.mass * 9.81, 0);
        
        const groundEffectHeight = 20;
        if (this.position.y < groundEffectHeight && this.position.y > 0) {
            const effect = 1 - (this.position.y / groundEffectHeight);
            lift.multiplyScalar(1 + effect * 0.5);
            drag.multiplyScalar(1 - effect * 0.3);
        }
        
        const totalForce = new THREE.Vector3().add(thrust).add(lift).add(drag).add(weight);
        const acceleration = totalForce.divideScalar(this.mass);
        
        this.velocity.add(acceleration.multiplyScalar(delta));
        
        if (speed > this.maxSpeed) {
            this.velocity.multiplyScalar(this.maxSpeed / speed);
        }
        
        this.position.add(this.velocity.clone().multiplyScalar(delta));
        
        if (this.position.y < 0) {
            this.position.y = 0;
            if (this.velocity.y < 0) this.velocity.y = 0;
        }
        
        this.updateRotation(delta, speed);
        
        this.altitude = this.position.y;
        this.groundSpeed = speed;
        this.ias = speed * 1.944;
        
        this.mesh.position.copy(this.position);
        this.mesh.rotation.copy(this.rotation);
        
        // Apply auto-brake when on ground with low throttle
        this.applyAutoBrake(delta);
    }
    
    updateRotation(delta, speed) {
        const controlEffectiveness = Math.min(1, speed / 30);
        
        this.rotation.x += this.controlInput.pitch * this.pitchRate * delta * controlEffectiveness;
        this.rotation.x = clamp(this.rotation.x, degreesToRadians(-45), degreesToRadians(45));
        
        this.rotation.z -= this.controlInput.roll * this.rollRate * delta * controlEffectiveness;
        this.rotation.z = clamp(this.rotation.z, degreesToRadians(-60), degreesToRadians(60));
        
        this.rotation.y += this.controlInput.yaw * this.yawRate * delta * controlEffectiveness;
        
        if (speed > 20) {
            this.rotation.z *= 0.99;
        }
        
        if (speed > 20 && Math.abs(this.controlInput.pitch) < 0.1) {
            this.rotation.x *= 0.98;
        }
        
        if (speed > 20) {
            this.rotation.y += Math.sin(this.rotation.z) * 0.3 * delta;
        }
    }
    
    reset() {
        // Reset to a random location near an island with forward momentum
        this.setRandomStartPosition();
        
        // Clear any residual physics state
        this.controlInput = { pitch: 0, roll: 0, yaw: 0 };
        this.throttle = 0.5;
        this.ias = 0;
        this.groundSpeed = 0;
        this.crashed = false;
        
        console.log(`Reset complete: pos=(${this.position.x.toFixed(0)}, ${this.position.y.toFixed(0)}, ${this.position.z.toFixed(0)}), vel=(${this.velocity.x.toFixed(1)}, ${this.velocity.y.toFixed(1)}, ${this.velocity.z.toFixed(1)}), rotY=${this.rotation.y.toFixed(2)}`);
    }
    
    checkCrash() {
        if (this.crashed) return true;
        
        // Get terrain height at current position
        // This now returns the actual mesh vertex height (scaled by 0.15)
        let terrainHeight = -50; // Default ocean level
        if (typeof getTerrainHeight === 'function') {
            terrainHeight = getTerrainHeight(this.position.x, this.position.z);
        }
        
        // Debug: Log heights when close to terrain
        if (this.position.y < terrainHeight + 30) {
            console.log(`Height check: plane=${this.position.y.toFixed(1)}, terrain=${terrainHeight.toFixed(1)}, diff=${(this.position.y - terrainHeight).toFixed(1)}`);
        }
        
        // Check if plane is below terrain
        // Plane wheels/bottom is about 1-2m below position point
        const groundClearance = 1.5; // Plane sits ~1.5m above its position point
        const tolerance = 0.5; // Small tolerance
        const isBelowTerrain = this.position.y < (terrainHeight - groundClearance + tolerance);
        
        // Check if there's significant velocity (crashing, not just sitting)
        const speed = this.velocity.length();
        const isMoving = speed > 15; // More than 15 m/s (about 30 knots)
        const isFalling = this.velocity.y < -5; // Falling downward at 5 m/s
        
        // Only crash if: significantly below terrain AND (moving fast OR falling hard)
        if (isBelowTerrain && (isMoving || isFalling)) {
            this.crashed = true;
            this.velocity.set(0, 0, 0); // Stop the plane
            this.throttle = 0;
            console.log('CRASH! Aircraft hit terrain at', this.position.x.toFixed(0), this.position.y.toFixed(0), this.position.z.toFixed(0), 'terrain was', terrainHeight.toFixed(0));
            return true;
        }
        
        return false;
    }
}

// Export for viewer
window.Aircraft = Aircraft;
