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
        const cos = Math.cos(angleVariation);
        const sin = Math.sin(angleVariation);
        
        const velocityX = dirToIsland.x * cos - dirToIsland.z * sin;
        const velocityZ = dirToIsland.x * sin + dirToIsland.z * cos;
        
        // Forward speed: 60 m/s (same as original)
        const speed = 60;
        this.velocity.set(velocityX * speed, 0, velocityZ * speed);
        
        // Set rotation to face velocity direction
        this.rotation.y = Math.atan2(velocityX, velocityZ);
        
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
        const stripeMat = new THREE.MeshStandardMaterial({ color: 0x0066cc, roughness: 0.5 });
        const glassMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2e, transparent: true, opacity: 0.7, roughness: 0.1, metalness: 0.3 });
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.8 });
        const strutMat = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.5, metalness: 0.4 });
        const metalMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8, roughness: 0.3 });
        const engineMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.4, metalness: 0.6 });
        const exhaustMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.7 });
        const blackMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
        
        // Scale: 1 unit = ~1.1m (182 is 8.84m long, using 8 as reference)
        const scale = 1.1;
        
        // === FUSELAGE ===
        // Main fuselage body - more tapered at nose and tail like real 182
        const fuselageLength = 8.5 * scale;
        const fuselageRadius = 0.7;
        
        // Create custom fuselage shape using lathe
        const fuselagePoints = [];
        const segments = 20;
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            let radius;
            
            // Nose section (front)
            if (t < 0.15) {
                // Tapered nose
                radius = fuselageRadius * (0.6 + (t / 0.15) * 0.4);
            } else if (t < 0.35) {
                // Cowling area - slightly wider
                const cowlT = (t - 0.15) / 0.2;
                radius = fuselageRadius * (1.0 + Math.sin(cowlT * Math.PI) * 0.08);
            } else if (t < 0.7) {
                // Main cabin section
                radius = fuselageRadius;
            } else if (t < 0.85) {
                // Taper toward tail
                const tailT = (t - 0.7) / 0.15;
                radius = fuselageRadius * (1.0 - tailT * 0.5);
            } else {
                // Tail cone
                const coneT = (t - 0.85) / 0.15;
                radius = fuselageRadius * 0.5 * (1 - coneT);
            }
            
            const z = (t - 0.5) * fuselageLength;
            fuselagePoints.push(new THREE.Vector2(radius, z));
        }
        
        const fuselageGeo = new THREE.LatheGeometry(fuselagePoints, 24);
        fuselageGeo.rotateX(Math.PI / 2);
        const fuselage = new THREE.Mesh(fuselageGeo, bodyMat);
        group.add(fuselage);
        
        // === COCKPIT WINDOWS - Cessna style rectangular ===
        // Windshield (front)
        const windshieldShape = new THREE.Shape();
        windshieldShape.moveTo(-0.35, 0);
        windshieldShape.lineTo(-0.3, 0.5);
        windshieldShape.lineTo(0.3, 0.5);
        windshieldShape.lineTo(0.35, 0);
        windshieldShape.lineTo(0.25, 0);
        windshieldShape.lineTo(0.2, 0.45);
        windshieldShape.lineTo(-0.2, 0.45);
        windshieldShape.lineTo(-0.25, 0);
        windshieldShape.lineTo(-0.35, 0);
        
        const windshieldGeo = new THREE.ExtrudeGeometry(windshieldShape, { depth: 0.05, bevelEnabled: false });
        const windshield = new THREE.Mesh(windshieldGeo, glassMat);
        windshield.rotation.y = Math.PI / 2;
        windshield.position.set(-0.025, 0.55, -1.3);
        group.add(windshield);
        
        // Side windows (pilot) - 2 large sliding windows
        const sideWindowGeo = new THREE.BoxGeometry(0.5, 0.4, 0.02);
        
        const pilotWindow = new THREE.Mesh(sideWindowGeo, glassMat);
        pilotWindow.position.set(-0.7, 0.5, -0.8);
        group.add(pilotWindow);
        
        const copilotWindow = new THREE.Mesh(sideWindowGeo, glassMat);
        copilotWindow.position.set(-0.7, 0.5, 0.2);
        group.add(copilotWindow);
        
        // Passenger windows - 2 on each side
        [-1, 1].forEach(side => {
            for (let i = 0; i < 2; i++) {
                const passWindow = new THREE.Mesh(sideWindowGeo, glassMat);
                passWindow.position.set(side * 0.7, 0.45, 0.8 + i * 0.6);
                group.add(passWindow);
            }
        });
        
        // === ENGINE COWLING ===
        // Large, distinctive 182 cowling
        const cowlingGeo = new THREE.CylinderGeometry(0.75, 0.65, 1.3, 24);
        cowlingGeo.rotateX(Math.PI / 2);
        const cowling = new THREE.Mesh(cowlingGeo, bodyMat);
        cowling.position.set(0, 0.05, -3.5);
        group.add(cowling);
        
        // Cowl flaps (cooling vents)
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI;
            const flapGeo = new THREE.BoxGeometry(0.08, 0.15, 0.02);
            const flap = new THREE.Mesh(flapGeo, metalMat);
            flap.position.set(
                Math.cos(angle) * 0.72,
                Math.sin(angle) * 0.72 - 0.1,
                -3.9
            );
            flap.rotation.x = Math.sin(angle) * 0.3;
            group.add(flap);
        }
        
        // Air intake on top
        const intakeGeo = new THREE.BoxGeometry(0.4, 0.15, 0.3);
        const intake = new THREE.Mesh(intakeGeo, metalMat);
        intake.position.set(0, 0.6, -3.4);
        group.add(intake);
        
        // === EXHAUST SYSTEM ===
        const exhaustGeo = new THREE.CylinderGeometry(0.06, 0.07, 0.5, 8);
        [-0.35, 0.35].forEach(x => {
            const exhaust = new THREE.Mesh(exhaustGeo, exhaustMat);
            exhaust.position.set(x, -0.25, -3.2);
            exhaust.rotation.x = Math.PI / 3;
            group.add(exhaust);
        });
        
        // === PROPELLER ===
        // Larger, more distinctive 182 propeller
        this.propeller = new THREE.Group();
        const bladeMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.8, roughness: 0.3 });
        
        for (let i = 0; i < 3; i++) {
            const bladeGroup = new THREE.Group();
            
            // Main blade
            const bladeGeo = new THREE.BoxGeometry(0.1, 2.0, 0.15);
            const blade = new THREE.Mesh(bladeGeo, bladeMat);
            blade.position.y = 1.0;
            bladeGroup.add(blade);
            
            // Blade taper at tip
            const tipGeo = new THREE.BoxGeometry(0.08, 0.2, 0.12);
            const tip = new THREE.Mesh(tipGeo, bladeMat);
            tip.position.y = 2.0;
            bladeGroup.add(tip);
            
            bladeGroup.rotation.z = (i * Math.PI * 2) / 3;
            this.propeller.add(bladeGroup);
        }
        
        // Spinner (distinctive 182 shape)
        const spinnerGeo = new THREE.SphereGeometry(0.25, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
        spinnerGeo.rotateX(-Math.PI / 2);
        const spinner = new THREE.Mesh(spinnerGeo, stripeMat);
        this.propeller.add(spinner);
        
        this.propeller.position.set(0, 0, -4.4);
        group.add(this.propeller);
        
        // === WINGS - HIGH WING CONFIGURATION ===
        const wingSpan = 11 * scale;
        const wingChord = 1.8;
        const wingThickness = 0.18;
        const wingY = 1.1; // High wing position
        
        // Main wing - slightly swept
        const wingShape = new THREE.Shape();
        wingShape.moveTo(0, 0);
        wingShape.lineTo(0.3, 0);
        wingShape.lineTo(0.35, 0.5);
        wingShape.lineTo(0.3, 0.7);
        wingShape.lineTo(0.15, 0.8);
        wingShape.lineTo(0, 0.8);
        
        const wingExtrudeSettings = { depth: wingSpan / 2 - 0.5, bevelEnabled: false };
        const wingGeo = new THREE.ExtrudeGeometry(wingShape, wingExtrudeSettings);
        wingGeo.rotateX(-Math.PI / 2);
        wingGeo.rotateZ(Math.PI / 2);
        
        const leftWing = new THREE.Mesh(wingGeo, bodyMat);
        leftWing.position.set(-wingSpan / 2 + 0.3, wingY, -0.4);
        group.add(leftWing);
        
        const rightWingGeo = wingGeo.clone();
        const rightWing = new THREE.Mesh(rightWingGeo, bodyMat);
        rightWing.scale.x = -1;
        rightWing.position.set(wingSpan / 2 - 0.3, wingY, -0.4);
        group.add(rightWing);
        
        // Wing root fairing (where wing meets fuselage)
        const fairingGeo = new THREE.CylinderGeometry(0.5, 0.4, 1.2, 12);
        fairingGeo.rotateZ(Math.PI / 2);
        const leftFairing = new THREE.Mesh(fairingGeo, bodyMat);
        leftFairing.position.set(-0.6, wingY, -0.1);
        group.add(leftFairing);
        
        const rightFairing = new THREE.Mesh(fairingGeo, bodyMat);
        rightFairing.scale.x = -1;
        rightFairing.position.set(0.6, wingY, -0.1);
        group.add(rightFairing);
        
        // Wing stripes
        const stripeGeo = new THREE.BoxGeometry(2.5, wingThickness + 0.02, wingChord * 0.6);
        
        const leftStripe = new THREE.Mesh(stripeGeo, stripeMat);
        leftStripe.position.set(-wingSpan / 4 - 0.5, wingY + 0.01, -0.2);
        group.add(leftStripe);
        
        const rightStripe = new THREE.Mesh(stripeGeo, stripeMat);
        rightStripe.position.set(wingSpan / 4 + 0.5, wingY + 0.01, -0.2);
        group.add(rightStripe);
        
        // Flaps
        const flapGeo = new THREE.BoxGeometry(2.0, wingThickness + 0.1, wingChord * 0.4);
        
        this.leftFlap = new THREE.Mesh(flapGeo, bodyMat);
        this.leftFlap.position.set(-wingSpan / 4 - 1.0, wingY, wingChord * 0.3);
        group.add(this.leftFlap);
        
        this.rightFlap = new THREE.Mesh(flapGeo, bodyMat);
        this.rightFlap.position.set(wingSpan / 4 + 1.0, wingY, wingChord * 0.3);
        group.add(this.rightFlap);
        
        // Ailerons
        const aileronGeo = new THREE.BoxGeometry(2.2, wingThickness + 0.1, wingChord * 0.3);
        
        this.aileronL = new THREE.Mesh(aileronGeo, bodyMat);
        this.aileronL.position.set(-wingSpan / 4 - 1.2, wingY, -wingChord * 0.4);
        group.add(this.aileronL);
        
        this.aileronR = new THREE.Mesh(aileronGeo, bodyMat);
        this.aileronR.position.set(wingSpan / 4 + 1.2, wingY, -wingChord * 0.4);
        group.add(this.aileronR);
        
        // Wing tips (rounded)
        const tipGeo = new THREE.SphereGeometry(0.25, 12, 8, 0, Math.PI, 0, Math.PI / 2);
        
        const leftTip = new THREE.Mesh(tipGeo, stripeMat);
        leftTip.rotation.z = -Math.PI / 2;
        leftTip.position.set(-wingSpan / 2, wingY, -0.1);
        group.add(leftTip);
        
        const rightTip = new THREE.Mesh(tipGeo, stripeMat);
        rightTip.rotation.z = Math.PI / 2;
        rightTip.position.set(wingSpan / 2, wingY, -0.1);
        group.add(rightTip);
        
        // Nav lights on wing tips
        const lightGeo = new THREE.SphereGeometry(0.06, 8, 6);
        const redLightMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.8 });
        const greenLightMat = new THREE.MeshStandardMaterial({ color: 0x00ff00, emissive: 0x00ff00, emissiveIntensity: 0.8 });
        
        const leftNavLight = new THREE.Mesh(lightGeo, redLightMat);
        leftNavLight.position.set(-wingSpan / 2, wingY, -0.1);
        group.add(leftNavLight);
        
        const rightNavLight = new THREE.Mesh(lightGeo, greenLightMat);
        rightNavLight.position.set(wingSpan / 2, wingY, -0.1);
        group.add(rightNavLight);
        
        // === TAIL SECTION ===
        // Vertical stabilizer
        const vStabHeight = 2.0;
        const vStabChord = 1.4;
        
        // Custom stabilizer shape
        const vStabShape = new THREE.Shape();
        vStabShape.moveTo(0, 0);
        vStabShape.lineTo(vStabChord, 0);
        vStabShape.lineTo(vStabChord * 0.8, vStabHeight);
        vStabShape.lineTo(0, vStabHeight * 0.9);
        
        const vStabGeo = new THREE.ExtrudeGeometry(vStabShape, { depth: 0.12, bevelEnabled: false });
        const vStab = new THREE.Mesh(vStabGeo, bodyMat);
        vStab.position.set(-0.06, 0.1, 3.8);
        group.add(vStab);
        
        // Rudder
        this.rudder = new THREE.Mesh(new THREE.BoxGeometry(0.1, vStabHeight * 0.65, vStabChord * 0.5), bodyMat);
        this.rudder.position.set(0, vStabHeight * 0.35 + 0.1, 4.4);
        group.add(this.rudder);
        
        // Rudder stripe
        const rudderStripeGeo = new THREE.BoxGeometry(0.11, vStabHeight * 0.5, vStabChord * 0.3);
        const rudderStripe = new THREE.Mesh(rudderStripeGeo, stripeMat);
        rudderStripe.position.set(0, vStabHeight * 0.3 + 0.1, 4.3);
        group.add(rudderStripe);
        
        // Horizontal stabilizer
        const hStabSpan = 3.4;
        const hStabChord = 1.0;
        
        const hStabShape = new THREE.Shape();
        hStabShape.moveTo(0, 0);
        hStabShape.lineTo(hStabChord, 0);
        hStabShape.lineTo(hStabChord * 0.7, hStabSpan / 2);
        hStabShape.lineTo(0, hStabSpan / 2);
        
        const hStabGeo = new THREE.ExtrudeGeometry(hStabShape, { depth: 0.1, bevelEnabled: false });
        
        const leftHStab = new THREE.Mesh(hStabGeo, bodyMat);
        leftHStab.position.set(-hStabSpan / 2, 0.12, 3.8);
        group.add(leftHStab);
        
        const rightHStab = new THREE.Mesh(hStabGeo, bodyMat);
        rightHStab.scale.x = -1;
        rightHStab.position.set(hStabSpan / 2, 0.12, 3.8);
        group.add(rightHStab);
        
        // Elevators
        this.elevator = new THREE.Mesh(new THREE.BoxGeometry(hStabSpan * 0.85, 0.1, hStabChord * 0.55), bodyMat);
        this.elevator.position.set(0, 0.15, 4.4);
        group.add(this.elevator);
        
        // Elevator stripe
        const elevatorStripe = new THREE.Mesh(new THREE.BoxGeometry(hStabSpan * 0.4, 0.11, hStabChord * 0.3), stripeMat);
        elevatorStripe.position.set(0, 0.15, 4.3);
        group.add(elevatorStripe);
        
        // === LANDING GEAR ===
        const noseWheelY = -0.65;
        const noseWheelZ = -2.2;
        const mainWheelY = -0.7;
        const mainWheelZ = 0.8;
        const mainWheelSpread = 1.4;
        
        // Nose gear
        const noseStrutGeo = new THREE.CylinderGeometry(0.05, 0.06, 0.7, 8);
        const noseStrut = new THREE.Mesh(noseStrutGeo, strutMat);
        noseStrut.position.set(0, noseWheelY + 0.3, noseWheelZ - 0.3);
        noseStrut.rotation.x = Math.PI / 5;
        group.add(noseStrut);
        
        // Nose wheel
        const noseWheelGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.12, 16);
        noseWheelGeo.rotateZ(Math.PI / 2);
        const noseWheel = new THREE.Mesh(noseWheelGeo, wheelMat);
        noseWheel.position.set(0, noseWheelY, noseWheelZ);
        group.add(noseWheel);
        
        // Nose gear fairing
        const noseFairingGeo = new THREE.CylinderGeometry(0.15, 0.12, 0.4, 8);
        const noseFairing = new THREE.Mesh(noseFairingGeo, bodyMat);
        noseFairing.rotation.x = Math.PI / 5;
        noseFairing.position.set(0, noseWheelY + 0.5, noseWheelZ - 0.5);
        group.add(noseFairing);
        
        // Main gear
        const mainStrutGeo = new THREE.CylinderGeometry(0.06, 0.07, 0.85, 8);
        
        const leftMainStrut = new THREE.Mesh(mainStrutGeo, strutMat);
        leftMainStrut.position.set(-mainWheelSpread, mainWheelY + 0.35, mainWheelZ);
        leftMainStrut.rotation.z = 0.1;
        group.add(leftMainStrut);
        
        const rightMainStrut = new THREE.Mesh(mainStrutGeo, strutMat);
        rightMainStrut.position.set(mainWheelSpread, mainWheelY + 0.35, mainWheelZ);
        rightMainStrut.rotation.z = -0.1;
        group.add(rightMainStrut);
        
        // Main wheels
        const mainWheelGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.14, 16);
        mainWheelGeo.rotateZ(Math.PI / 2);
        
        const leftMainWheel = new THREE.Mesh(mainWheelGeo, wheelMat);
        leftMainWheel.position.set(-mainWheelSpread, mainWheelY, mainWheelZ);
        group.add(leftMainWheel);
        
        const rightMainWheel = new THREE.Mesh(mainWheelGeo, wheelMat);
        rightMainWheel.position.set(mainWheelSpread, mainWheelY, mainWheelZ);
        group.add(rightMainWheel);
        
        // Axle
        const axleGeo = new THREE.CylinderGeometry(0.04, 0.04, mainWheelSpread * 2 + 0.2, 8);
        axleGeo.rotateZ(Math.PI / 2);
        const axle = new THREE.Mesh(axleGeo, strutMat);
        axle.position.set(0, mainWheelY, mainWheelZ);
        group.add(axle);
        
        // === ANTENNAS ===
        // VOR antenna on top
        const vorGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 6);
        const vor = new THREE.Mesh(vorGeo, metalMat);
        vor.position.set(0, 0.9, 0.5);
        group.add(vor);
        
        // Pitot tube
        const pitotGeo = new THREE.CylinderGeometry(0.02, 0.015, 0.25, 6);
        const pitot = new THREE.Mesh(pitotGeo, blackMat);
        pitot.rotation.z = Math.PI / 2;
        pitot.position.set(-0.72, 0.3, -1.5);
        group.add(pitot);
        
        // Stall warning horn
        const stallHornGeo = new THREE.BoxGeometry(0.08, 0.04, 0.1);
        const stallHorn = new THREE.Mesh(stallHornGeo, blackMat);
        stallHorn.position.set(0.72, wingY - 0.1, 0);
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
        this.crashed = false;
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
