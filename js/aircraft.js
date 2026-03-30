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
        // Based on Three.js: forward at rotation.y = a points to (sin(a), -cos(a))
        // So to get forward = (vx, vz), we need sin(a) = vx, cos(a) = -vz
        // a = atan2(vx, -vz)
        const vx = this.velocity.x;
        const vz = this.velocity.z;
        this.rotation.x = 0;
        this.rotation.y = Math.atan2(vx, -vz);
        this.rotation.z = 0;
        
        // Verify: compute forward vector and compare to velocity direction
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyEuler(this.rotation);
        const velocityDir = this.velocity.clone().normalize();
        const dot = forward.dot(velocityDir);
        
        console.log(`Spawn: dirToIsland=(${dirToIsland.x.toFixed(2)},${dirToIsland.z.toFixed(2)}), angleToIsland=${(angleToIsland*180/Math.PI).toFixed(0)}deg, finalAngle=${(finalAngle*180/Math.PI).toFixed(0)}deg`);
        console.log(`Spawn CHECK: forward=(${forward.x.toFixed(2)},${forward.z.toFixed(2)}), velDir=(${velocityDir.x.toFixed(2)},${velocityDir.z.toFixed(2)}), dot=${dot.toFixed(2)}`);
        
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
        
        // === FUSELAGE - Cylindrical with tapered ends ===
        const fuselageLength = 8;
        const fuselageRadius = 0.65;
        
        // Main fuselage body
        const fuselageGeo = new THREE.CylinderGeometry(fuselageRadius, fuselageRadius * 0.7, fuselageLength, 20);
        fuselageGeo.rotateX(Math.PI / 2);
        const fuselage = new THREE.Mesh(fuselageGeo, bodyMat);
        group.add(fuselage);
        
        // Nose cowling - attached to front of fuselage
        const noseCowlingGeo = new THREE.CylinderGeometry(fuselageRadius * 1.15, fuselageRadius, 1.5, 20);
        noseCowlingGeo.rotateX(Math.PI / 2);
        const noseCowling = new THREE.Mesh(noseCowlingGeo, bodyMat);
        noseCowling.position.set(0, 0, -3.5);
        group.add(noseCowling);
        
        // Cowl ring (the characteristic 182 cowling flare)
        const cowlRingGeo = new THREE.TorusGeometry(fuselageRadius * 1.1, 0.08, 12, 24);
        const cowlRing = new THREE.Mesh(cowlRingGeo, bodyMat);
        cowlRing.position.set(0, 0, -3.0);
        cowlRing.rotation.x = Math.PI / 2;
        group.add(cowlRing);
        
        // Tail taper
        const tailTaperGeo = new THREE.CylinderGeometry(fuselageRadius * 0.7, fuselageRadius * 0.35, 2, 16);
        tailTaperGeo.rotateX(Math.PI / 2);
        const tailTaper = new THREE.Mesh(tailTaperGeo, bodyMat);
        tailTaper.position.set(0, 0, 4.2);
        group.add(tailTaper);
        
        // Tail cone
        const tailConeGeo = new THREE.ConeGeometry(fuselageRadius * 0.35, 1.5, 16);
        tailConeGeo.rotateX(Math.PI / 2);
        const tailCone = new THREE.Mesh(tailConeGeo, bodyMat);
        tailCone.position.set(0, 0, 5.2);
        group.add(tailCone);
        
        // === COCKPIT - Rectangular windows like real Cessna ===
        // Windshield frame
        const windshieldFrameGeo = new THREE.BoxGeometry(1.0, 0.6, 0.1);
        const windshieldFrame = new THREE.Mesh(windshieldFrameGeo, new THREE.MeshStandardMaterial({ color: 0x333333 }));
        windshieldFrame.position.set(0, 0.5, -2.8);
        windshieldFrame.rotation.x = -0.3;
        group.add(windshieldFrame);
        
        // Windshield glass
        const windshieldGeo = new THREE.BoxGeometry(0.9, 0.5, 0.05);
        const windshield = new THREE.Mesh(windshieldGeo, glassMat);
        windshield.position.set(0, 0.52, -2.85);
        windshield.rotation.x = -0.3;
        group.add(windshield);
        
        // Side windows - rectangular, angled back
        const sideWindowGeo = new THREE.BoxGeometry(0.05, 0.35, 0.5);
        
        // Pilot window
        const pilotWindow = new THREE.Mesh(sideWindowGeo, glassMat);
        pilotWindow.position.set(-0.68, 0.45, -2.0);
        group.add(pilotWindow);
        
        // Copilot window
        const copilotWindow = new THREE.Mesh(sideWindowGeo, glassMat);
        copilotWindow.position.set(0.68, 0.45, -2.0);
        group.add(copilotWindow);
        
        // Passenger windows - smaller, 2 on each side
        const passWindowGeo = new THREE.BoxGeometry(0.05, 0.3, 0.4);
        for (let side of [-1, 1]) {
            for (let i = 0; i < 2; i++) {
                const passWindow = new THREE.Mesh(passWindowGeo, glassMat);
                passWindow.position.set(side * 0.68, 0.4, -0.5 + i * 0.8);
                group.add(passWindow);
            }
        }
        
        // === EXHAUST ===
        const exhaustGeo = new THREE.CylinderGeometry(0.05, 0.06, 0.4, 8);
        [-0.25, 0.25].forEach(x => {
            const exhaust = new THREE.Mesh(exhaustGeo, exhaustMat);
            exhaust.position.set(x, -0.25, -3.3);
            exhaust.rotation.x = Math.PI / 4;
            group.add(exhaust);
        });
        
        // === PROPELLER ===
        this.propeller = new THREE.Group();
        const bladeMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.8, roughness: 0.3 });
        
        for (let i = 0; i < 3; i++) {
            const bladeGroup = new THREE.Group();
            
            const bladeGeo = new THREE.BoxGeometry(0.1, 1.9, 0.18);
            const blade = new THREE.Mesh(bladeGeo, bladeMat);
            blade.position.y = 0.95;
            bladeGroup.add(blade);
            
            const tipGeo = new THREE.BoxGeometry(0.08, 0.2, 0.15);
            const tip = new THREE.Mesh(tipGeo, bladeMat);
            tip.position.y = 1.9;
            bladeGroup.add(tip);
            
            bladeGroup.rotation.z = (i * Math.PI * 2) / 3;
            this.propeller.add(bladeGroup);
        }
        
        // Spinner
        const spinnerGeo = new THREE.SphereGeometry(0.22, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
        spinnerGeo.rotateX(-Math.PI / 2);
        const spinner = new THREE.Mesh(spinnerGeo, stripeMat);
        this.propeller.add(spinner);
        
        this.propeller.position.set(0, 0, -4.3);
        group.add(this.propeller);
        
        // === HIGH WING ===
        const wingSpan = 11;
        const wingChord = 1.6;
        const wingThickness = 0.18;
        const wingY = 0.95; // High wing position (above fuselage)
        
        // Wing root - connects directly to top of fuselage
        const wingRootGeo = new THREE.BoxGeometry(1.4, wingThickness, wingChord * 1.2);
        const leftWingRoot = new THREE.Mesh(wingRootGeo, bodyMat);
        leftWingRoot.position.set(-0.7, wingY, -0.3);
        group.add(leftWingRoot);
        
        const rightWingRoot = new THREE.Mesh(wingRootGeo, bodyMat);
        rightWingRoot.position.set(0.7, wingY, -0.3);
        group.add(rightWingRoot);
        
        // Wing strut (characteristic of high wing Cessnas)
        const strutGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.8, 8);
        
        [-1, 1].forEach(side => {
            const strut = new THREE.Mesh(strutGeo, strutMat);
            strut.position.set(side * 1.3, wingY - 0.4, -0.3);
            group.add(strut);
        });
        
        // Main wing panels
        const wingPanelGeo = new THREE.BoxGeometry(wingSpan / 2 - 1.0, wingThickness, wingChord);
        
        const leftWing = new THREE.Mesh(wingPanelGeo, bodyMat);
        leftWing.position.set(-wingSpan / 2 - 0.2, wingY, -0.3);
        group.add(leftWing);
        
        const rightWing = new THREE.Mesh(wingPanelGeo, bodyMat);
        rightWing.position.set(wingSpan / 2 + 0.2, wingY, -0.3);
        group.add(rightWing);
        
        // Wing stripes
        const stripeGeo = new THREE.BoxGeometry(wingSpan / 2 - 2.0, wingThickness + 0.02, wingChord * 0.5);
        
        const leftStripe = new THREE.Mesh(stripeGeo, stripeMat);
        leftStripe.position.set(-wingSpan / 2 + 0.5, wingY + 0.01, -0.3);
        group.add(leftStripe);
        
        const rightStripe = new THREE.Mesh(stripeGeo, stripeMat);
        rightStripe.position.set(wingSpan / 2 - 0.5, wingY + 0.01, -0.3);
        group.add(rightStripe);
        
        // Flaps
        const flapGeo = new THREE.BoxGeometry(wingSpan / 2 - 2.5, wingThickness + 0.05, wingChord * 0.35);
        
        this.leftFlap = new THREE.Mesh(flapGeo, bodyMat);
        this.leftFlap.position.set(-wingSpan / 2 + 0.3, wingY, wingChord * 0.3);
        group.add(this.leftFlap);
        
        this.rightFlap = new THREE.Mesh(flapGeo, bodyMat);
        this.rightFlap.position.set(wingSpan / 2 - 0.3, wingY, wingChord * 0.3);
        group.add(this.rightFlap);
        
        // Ailerons
        const aileronGeo = new THREE.BoxGeometry(wingSpan / 2 - 3.0, wingThickness + 0.08, wingChord * 0.3);
        
        this.aileronL = new THREE.Mesh(aileronGeo, bodyMat);
        this.aileronL.position.set(-wingSpan / 2 + 0.5, wingY, -wingChord * 0.35);
        group.add(this.aileronL);
        
        this.aileronR = new THREE.Mesh(aileronGeo, bodyMat);
        this.aileronR.position.set(wingSpan / 2 - 0.5, wingY, -wingChord * 0.35);
        group.add(this.aileronR);
        
        // Wing tips - angled up
        const tipGeo = new THREE.BoxGeometry(0.25, wingThickness * 2, wingChord * 0.5);
        
        const leftTip = new THREE.Mesh(tipGeo, stripeMat);
        leftTip.position.set(-wingSpan / 2 - 0.1, wingY + 0.15, -0.3);
        leftTip.rotation.z = -0.2;
        group.add(leftTip);
        
        const rightTip = new THREE.Mesh(tipGeo, stripeMat);
        rightTip.position.set(wingSpan / 2 + 0.1, wingY + 0.15, -0.3);
        rightTip.rotation.z = 0.2;
        group.add(rightTip);
        
        // Navigation lights
        const navLightGeo = new THREE.SphereGeometry(0.05, 8, 6);
        const redLightMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.8 });
        const greenLightMat = new THREE.MeshStandardMaterial({ color: 0x00ff00, emissive: 0x00ff00, emissiveIntensity: 0.8 });
        
        const leftNavLight = new THREE.Mesh(navLightGeo, redLightMat);
        leftNavLight.position.set(-wingSpan / 2 - 0.1, wingY + 0.1, -0.3);
        group.add(leftNavLight);
        
        const rightNavLight = new THREE.Mesh(navLightGeo, greenLightMat);
        rightNavLight.position.set(wingSpan / 2 + 0.1, wingY + 0.1, -0.3);
        group.add(rightNavLight);
        
        // === TAIL SECTION ===
        // Vertical stabilizer
        const vStabHeight = 2.0;
        const vStabChord = 1.3;
        
        const vStabShape = new THREE.Shape();
        vStabShape.moveTo(0, 0);
        vStabShape.lineTo(vStabChord, 0);
        vStabShape.lineTo(vStabChord * 0.75, vStabHeight);
        vStabShape.lineTo(0, vStabHeight * 0.85);
        
        const vStabGeo = new THREE.ExtrudeGeometry(vStabShape, { depth: 0.12, bevelEnabled: false });
        const vStab = new THREE.Mesh(vStabGeo, bodyMat);
        vStab.position.set(-0.06, 0.1, 4.0);
        group.add(vStab);
        
        // Rudder
        this.rudder = new THREE.Mesh(new THREE.BoxGeometry(0.1, vStabHeight * 0.6, vStabChord * 0.5), bodyMat);
        this.rudder.position.set(0, vStabHeight * 0.3 + 0.1, 4.6);
        group.add(this.rudder);
        
        // Rudder stripe
        const rudderStripeGeo = new THREE.BoxGeometry(0.11, vStabHeight * 0.45, vStabChord * 0.28);
        const rudderStripe = new THREE.Mesh(rudderStripeGeo, stripeMat);
        rudderStripe.position.set(0, vStabHeight * 0.25 + 0.1, 4.5);
        group.add(rudderStripe);
        
        // Horizontal stabilizer
        const hStabSpan = 3.2;
        const hStabChord = 0.95;
        
        const hStabShape = new THREE.Shape();
        hStabShape.moveTo(0, 0);
        hStabShape.lineTo(hStabChord, 0);
        hStabShape.lineTo(hStabChord * 0.65, hStabSpan / 2);
        hStabShape.lineTo(0, hStabSpan / 2);
        
        const hStabGeo = new THREE.ExtrudeGeometry(hStabShape, { depth: 0.1, bevelEnabled: false });
        
        const leftHStab = new THREE.Mesh(hStabGeo, bodyMat);
        leftHStab.position.set(-hStabSpan / 2, 0.12, 4.0);
        group.add(leftHStab);
        
        const rightHStab = new THREE.Mesh(hStabGeo, bodyMat);
        rightHStab.scale.x = -1;
        rightHStab.position.set(hStabSpan / 2, 0.12, 4.0);
        group.add(rightHStab);
        
        // Elevator
        this.elevator = new THREE.Mesh(new THREE.BoxGeometry(hStabSpan * 0.88, 0.1, hStabChord * 0.58), bodyMat);
        this.elevator.position.set(0, 0.14, 4.55);
        group.add(this.elevator);
        
        // Elevator stripe
        const elevatorStripe = new THREE.Mesh(new THREE.BoxGeometry(hStabSpan * 0.45, 0.11, hStabChord * 0.32), stripeMat);
        elevatorStripe.position.set(0, 0.14, 4.4);
        group.add(elevatorStripe);
        
        // === LANDING GEAR ===
        const noseWheelY = -0.6;
        const noseWheelZ = -2.4;
        const mainWheelY = -0.65;
        const mainWheelZ = 0.9;
        const mainWheelSpread = 1.5;
        
        // Nose gear strut
        const noseStrutGeo = new THREE.CylinderGeometry(0.05, 0.06, 0.75, 8);
        const noseStrut = new THREE.Mesh(noseStrutGeo, strutMat);
        noseStrut.position.set(0, noseWheelY + 0.35, noseWheelZ - 0.25);
        noseStrut.rotation.x = Math.PI / 5;
        group.add(noseStrut);
        
        // Nose wheel
        const noseWheelGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.12, 16);
        noseWheelGeo.rotateZ(Math.PI / 2);
        const noseWheel = new THREE.Mesh(noseWheelGeo, wheelMat);
        noseWheel.position.set(0, noseWheelY, noseWheelZ);
        group.add(noseWheel);
        
        // Nose gear fairing
        const noseFairingGeo = new THREE.CylinderGeometry(0.14, 0.1, 0.4, 8);
        const noseFairing = new THREE.Mesh(noseFairingGeo, bodyMat);
        noseFairing.rotation.x = Math.PI / 5;
        noseFairing.position.set(0, noseWheelY + 0.5, noseWheelZ - 0.4);
        group.add(noseFairing);
        
        // Main gear struts
        const mainStrutGeo = new THREE.CylinderGeometry(0.06, 0.07, 0.9, 8);
        
        const leftMainStrut = new THREE.Mesh(mainStrutGeo, strutMat);
        leftMainStrut.position.set(-mainWheelSpread, mainWheelY + 0.4, mainWheelZ);
        leftMainStrut.rotation.z = 0.1;
        group.add(leftMainStrut);
        
        const rightMainStrut = new THREE.Mesh(mainStrutGeo, strutMat);
        rightMainStrut.position.set(mainWheelSpread, mainWheelY + 0.4, mainWheelZ);
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
        vor.position.set(0, 0.85, 0.6);
        group.add(vor);
        
        // Pitot tube
        const pitotGeo = new THREE.CylinderGeometry(0.02, 0.015, 0.25, 6);
        const pitot = new THREE.Mesh(pitotGeo, blackMat);
        pitot.rotation.z = Math.PI / 2;
        pitot.position.set(-0.78, 0.3, -1.6);
        group.add(pitot);
        
        // Stall warning horn
        const stallHornGeo = new THREE.BoxGeometry(0.08, 0.04, 0.1);
        const stallHorn = new THREE.Mesh(stallHornGeo, blackMat);
        stallHorn.position.set(0.78, wingY - 0.12, 0);
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
