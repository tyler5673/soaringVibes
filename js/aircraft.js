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
        
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4, metalness: 0.1 });
        const stripeMat = new THREE.MeshStandardMaterial({ color: 0x0066cc, roughness: 0.4 });
        const glassMat = new THREE.MeshStandardMaterial({ 
            color: 0x4488cc, 
            transparent: true, 
            opacity: 0.5, 
            roughness: 0.02, 
            metalness: 0.1,
            side: THREE.DoubleSide
        });
        const glassTrimMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.5 });
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.85 });
        const strutMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.3, metalness: 0.6 });
        const metalMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.7, roughness: 0.4 });
        const cowlingMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.5, metalness: 0.3 });
        const engineNacelleMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.6 });
        const silverMat = new THREE.MeshStandardMaterial({ color: 0xc0c0c0, metalness: 0.9, roughness: 0.2 });
        const redMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.5 });
        const blackMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.8 });
        
        // Plane orientation: +X = right wing, -X = left wing, +Z = tail, -Z = nose
        // Y is up
        
        // Cessna 172 Skyhawk dimensions (scaled ~1:10 from actual)
        // Length: 8.28m (27ft 2in), Wingspan: 11.0m (36ft), Height: 2.72m (8ft 11in)
        
        // ====== FUSELAGE ======
        // Main fuselage body - smooth cylinder with taper for Cessna shape
        const fuselageLength = 7.5;
        const fuselageRadius = 0.6;
        const fuselageGeo = new THREE.CylinderGeometry(fuselageRadius * 0.7, fuselageRadius, fuselageLength, 16);
        fuselageGeo.rotateX(Math.PI / 2);
        const fuselage = new THREE.Mesh(fuselageGeo, bodyMat);
        fuselage.position.z = 0.2;
        group.add(fuselage);
        
        // Nose section - tapers to a point
        const noseLength = 1.4;
        const noseGeo = new THREE.CylinderGeometry(fuselageRadius * 0.95, fuselageRadius * 0.3, noseLength, 16);
        noseGeo.rotateX(Math.PI / 2);
        const nose = new THREE.Mesh(noseGeo, bodyMat);
        nose.position.z = -4.0;
        group.add(nose);
        
        // ====== ENGINE COWLING ======
        const cowlingLength = 1.0;
        const cowlingRadius = 0.65;
        
        // Main cowling - elliptical cross-section
        const cowlingGeo = new THREE.CylinderGeometry(cowlingRadius, cowlingRadius * 0.9, cowlingLength, 16);
        cowlingGeo.rotateX(Math.PI / 2);
        const cowling = new THREE.Mesh(cowlingGeo, cowlingMat);
        cowling.position.z = -3.2;
        group.add(cowling);
        
        // Cowling cowl flap (visible line)
        const cowlFlap = new THREE.Mesh(
            new THREE.TorusGeometry(cowlingRadius, 0.02, 8, 16),
            metalMat
        );
        cowlFlap.position.z = -2.75;
        cowlFlap.rotation.x = Math.PI / 2;
        group.add(cowlFlap);
        
        // Cowling spinner - pointed nose cone
        const spinnerBody = new THREE.Mesh(
            new THREE.SphereGeometry(0.18, 16, 12),
            silverMat
        );
        spinnerBody.scale.set(1.8, 1, 1);
        spinnerBody.position.z = -3.6;
        spinnerBody.rotation.x = Math.PI / 2;
        group.add(spinnerBody);
        
var spinnerStripeTop = new THREE.Mesh(
            new THREE.SphereGeometry(0.17, 16, 12),
            stripeMat
        );
        spinnerStripeTop.scale.set(1.68, 0.95, 0.95);
        spinnerStripeTop.position.z = -3.35;
        spinnerStripeTop.rotation.x = Math.PI * 0.38;
        group.add(spinnerStripeTop);
        
var spinnerStripeBottom = new THREE.Mesh(
            new THREE.SphereGeometry(0.17, 16, 12),
            stripeMat
        );
        spinnerStripeBottom.scale.set(1.68, 0.95, 0.95);
        spinnerStripeBottom.position.z = -3.35;
        spinnerStripeBottom.rotation.x = Math.PI * 0.62;
        group.add(spinnerStripeBottom);
        
        // ====== COCKPIT AREA ======
        // Simple transparent blue cabin
        const cockpitY = 0.75;
        const cabinWidth = 0.9;
        const cabinHeight = 0.55;
        const cabinLength = 2.2;
        
        // Single transparent blue cube for the cockpit
        const cockpit = new THREE.Mesh(
            new THREE.BoxGeometry(cabinWidth, cabinHeight, cabinLength),
            glassMat
        );
        cockpit.position.set(0, cockpitY, -0.1);
        group.add(cockpit);
        
        // ====== EXHAUST MANIFOLD (Lycoming O-320/IO-360 style) ======
        // Cessna 172 has left-side cylinder head exhaust
        const exhaustGeo = new THREE.CylinderGeometry(0.025, 0.035, 0.45, 6);
        [-0.42].forEach(x => {
            const exhaust = new THREE.Mesh(exhaustGeo, metalMat);
            exhaust.position.set(x, -0.12, -2.45);
            exhaust.rotation.x = Math.PI * 0.22;
            group.add(exhaust);
        });
        
        // === PROPELLER (3-bladed McCauley/Faure-style) ===
        this.propeller = new THREE.Group();
        const bladeMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.8, roughness: 0.3 });
        
        for (let i = 0; i < 3; i++) {
            const bladeGroup = new THREE.Group();
            
            const blade = new THREE.Mesh(new THREE.BoxGeometry(0.09, 1.9, 0.14), bladeMat);
            blade.position.y = 0.95;
            // Tapered blade shape
            blade.scale.z = 0.85;
            bladeGroup.add(blade);
            
            // Blade tip (rounded)
            const tip = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.22, 0.11), bladeMat);
            tip.position.y = 1.9;
            bladeGroup.add(tip);
            
            bladeGroup.rotation.z = (i * Math.PI * 2) / 3;
            this.propeller.add(bladeGroup);
        }
        
        this.propeller.position.z = -4.3;
        group.add(this.propeller);
        
        // === HIGH WING (Cessna 172 signature high-wing design) ===
        const wingSpan = 11; // Cessna 172 span is 11m (36ft)
        const wingChord = 1.55;
        const wingThickness = 0.17;
        const wingY = 0.95; // Raised higher on fuselage for better Skyhawk profile
        
        // Wing root fairing - smooth transition from fuselage to wing
        const wingRootFairing = new THREE.Mesh(
            new THREE.BoxGeometry(1.8, 0.28, wingChord * 1.15),
            bodyMat
        );
        wingRootFairing.position.set(0, wingY, -0.15);
        group.add(wingRootFairing);
        
        // Wing struts - distinctive Cessna strut (one on each wing)
        // Creates V shape: /\ struts angle OUT from center as they go up
        const strutWingX = 1.85; // Wing attach point
        const strutFuselageX = 0.35; // Deep into fuselage for solid intersection
        const strutFuselageY = -0.25; // Higher on fuselage side
        const strutZ = 0.12;
        
        // Calculate strut geometry
        const run = strutWingX - strutFuselageX; // Horizontal distance
        const rise = wingY - strutFuselageY; // Vertical distance
        const strutLen = Math.sqrt(run * run + rise * rise);
        
        // Angle from horizontal - strut rises up and outward
        const strutAngle = Math.atan2(rise, run);
        
        [-1, 1].forEach(side => {
            // Midpoint between fuselage attach and wing attach
            const midX = (strutFuselageX + strutWingX) / 2;
            const midY = (strutFuselageY + wingY) / 2;
            
            const strut = new THREE.Mesh(
                new THREE.CylinderGeometry(0.07, 0.055, strutLen, 10),
                strutMat
            );
            strut.position.set(side * midX, midY, strutZ);
            
            // Rotate to create V: left strut leans left, right strut leans right
            // Cylinder starts vertical, rotate around Z axis
            strut.rotation.z = side * -strutAngle;
            group.add(strut);
        });
        
        // Main wing panels - full width wings that connect to fuselage
        const wingPanelWidth = wingSpan / 2 - 0.75; // Account for fuselage width
        
        const leftWing = new THREE.Mesh(
            new THREE.BoxGeometry(wingPanelWidth, wingThickness, wingChord * 1.1),
            bodyMat
        );
        leftWing.position.set(-(wingPanelWidth / 2 + 0.75), wingY, -0.15);
        group.add(leftWing);
        
        const rightWing = new THREE.Mesh(
            new THREE.BoxGeometry(wingPanelWidth, wingThickness, wingChord * 1.1),
            bodyMat
        );
        rightWing.position.set(wingPanelWidth / 2 + 0.75, wingY, -0.15);
        group.add(rightWing);
        
        // Wing tip fairings - rounded tips at the very end of wings
        const leftWingTip = new THREE.Mesh(
            new THREE.BoxGeometry(0.32, wingThickness * 1.6, wingChord * 0.35),
            bodyMat
        );
        leftWingTip.position.set(-wingSpan / 2 + 0.15, wingY + 0.08, -wingChord * 0.3);
        leftWingTip.rotation.z = -0.22;
        group.add(leftWingTip);
        
        const rightWingTip = new THREE.Mesh(
            new THREE.BoxGeometry(0.32, wingThickness * 1.6, wingChord * 0.35),
            bodyMat
        );
        rightWingTip.position.set(wingSpan / 2 - 0.15, wingY + 0.08, -wingChord * 0.3);
        rightWingTip.rotation.z = 0.22;
        group.add(rightWingTip);
        
        // Ailerons - control surfaces on trailing edge near wingtips
        const aileronWidth = 1.8;
        const aileronLength = wingChord * 0.28; // Length along wing chord
        const aileronThickness = wingThickness * 0.6; // Thinner than wing
        const aileronGeo = new THREE.BoxGeometry(aileronWidth, aileronThickness, aileronLength);
        
        // Position ailerons further out on wings, near trailing edge (BACK of wing)
        // Ailerons start about 1.8m in from wingtips
        const aileronXOffset = 1.8;
        const trailingEdgeZ = wingChord * 0.45; // Positive Z = back/tail of wing
        
        // Left aileron
        this.aileronL = new THREE.Mesh(aileronGeo, bodyMat);
        this.aileronL.position.set(-(wingSpan / 2 - aileronWidth / 2 - aileronXOffset), wingY, trailingEdgeZ);
        group.add(this.aileronL);
        
        // Right aileron
        this.aileronR = new THREE.Mesh(aileronGeo, bodyMat);
        this.aileronR.position.set(wingSpan / 2 - aileronWidth / 2 - aileronXOffset, wingY, trailingEdgeZ);
        group.add(this.aileronR);
        
        // Wing tips with stripes
        const tipGeo = new THREE.BoxGeometry(0.22, wingThickness * 1.8, wingChord * 0.45);
        
        const leftTip = new THREE.Mesh(tipGeo, stripeMat);
        leftTip.position.set(-wingSpan / 2, wingY + 0.12, -0.25);
        leftTip.rotation.z = -0.25;
        group.add(leftTip);
        
        const rightTip = new THREE.Mesh(tipGeo, stripeMat);
        rightTip.position.set(wingSpan / 2, wingY + 0.12, -0.25);
        rightTip.rotation.z = 0.25;
        group.add(rightTip);
        
        // Navigation & marker lights at wingtips
        // Positioned at extreme ends for maximum visibility
        const wingTipX = wingSpan / 2 + 0.15; // Slightly past wing edge
        
        // Navigation lights (steady) - Red left, Green right
        const navLightGeo = new THREE.SphereGeometry(0.065, 10, 8);
        const redNavMat = new THREE.MeshStandardMaterial({ 
            color: 0xff0000, 
            emissive: 0xff0000, 
            emissiveIntensity: 1.2 
        });
        const greenNavMat = new THREE.MeshStandardMaterial({ 
            color: 0x00ff00, 
            emissive: 0x00ff00, 
            emissiveIntensity: 1.2 
        });
        
        // Left wing - red nav light
        const leftNav = new THREE.Mesh(navLightGeo, redNavMat);
        leftNav.position.set(-wingTipX, wingY + 0.06, -0.25);
        group.add(leftNav);
        
        // Right wing - green nav light
        const rightNav = new THREE.Mesh(navLightGeo, greenNavMat);
        rightNav.position.set(wingTipX, wingY + 0.06, -0.25);
        group.add(rightNav);
        
        // Anti-collision strobe lights (white, blinky)
        const strobeGeo = new THREE.SphereGeometry(0.05, 8, 6);
        const strobeMat = new THREE.MeshStandardMaterial({ 
            color: 0xffffff, 
            emissive: 0xffffff, 
            emissiveIntensity: 2.0 
        });
        
        // Left wingtip strobe
        const leftStrobe = new THREE.Mesh(strobeGeo, strobeMat);
        leftStrobe.position.set(-wingTipX - 0.05, wingY + 0.1, -0.35);
        group.add(leftStrobe);
        
        // Right wingtip strobe
        const rightStrobe = new THREE.Mesh(strobeGeo, strobeMat);
        rightStrobe.position.set(wingTipX + 0.05, wingY + 0.1, -0.35);
        group.add(rightStrobe);
        
        
        // === TAIL SECTION ===
        const tailZ = 4.2;
        
        // Vertical stabilizer (fin) - Cessna style tapered fin
        const vStabHeight = 1.85;
        const vStabChord = 1.4;
        const vStabY = 0.15;
        
        // Main vertical stabilizer - tapered box shape
        const vStab = new THREE.Mesh(
            new THREE.BoxGeometry(0.14, vStabHeight, vStabChord),
            bodyMat
        );
        vStab.position.set(0, vStabY + vStabHeight / 2, tailZ);
        vStab.rotation.y = -0.15; // Swept back
        group.add(vStab);
        
        // Leading edge fairing - rounded front
        const vStabLeading = new THREE.Mesh(
            new THREE.CylinderGeometry(0.11, 0.15, vStabHeight, 8),
            bodyMat
        );
        vStabLeading.position.set(0, vStabY + vStabHeight / 2, tailZ - vStabChord * 0.35);
        vStabLeading.rotation.x = -0.08;
        vStabLeading.scale.set(1, 1, 0.3);
        group.add(vStabLeading);
        
        // Rudder - on trailing edge
        const rudderHeight = vStabHeight * 0.7;
        const rudderChord = vStabChord * 0.5;
        
        this.rudder = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, rudderHeight, rudderChord),
            bodyMat
        );
        this.rudder.position.set(0, vStabY + rudderHeight / 2 - 0.1, tailZ + vStabChord * 0.25);
        this.rudder.rotation.y = -0.15;
        group.add(this.rudder);
        
        // Rudder stripe
        const rudderStripe = new THREE.Mesh(
            new THREE.BoxGeometry(0.08, rudderHeight * 0.5, rudderChord * 0.6),
            stripeMat
        );
        rudderStripe.position.set(0, vStabY + rudderHeight * 0.4, tailZ + vStabChord * 0.22);
        rudderStripe.rotation.y = -0.15;
        group.add(rudderStripe);
        
        // Tail beacon on vertical stabilizer
        const tailBeacon = new THREE.Mesh(
            new THREE.SphereGeometry(0.05, 8, 6),
            new THREE.MeshStandardMaterial({ 
                color: 0xffffff, 
                emissive: 0xffffff, 
                emissiveIntensity: 2.0 
            })
        );
        tailBeacon.position.set(0, vStabY + vStabHeight + 0.15, tailZ - vStabChord * 0.2);
        group.add(tailBeacon);
        
        // Horizontal stabilizer
        const hStabSpan = 3.4;
        const hStabChord = 0.95;
        const hStabY = 0.12;
        
        // Left horizontal stabilizer
        const leftHStab = new THREE.Mesh(
            new THREE.BoxGeometry(hStabSpan / 2 - 0.1, 0.08, hStabChord),
            bodyMat
        );
        leftHStab.position.set(-hStabSpan / 4 - 0.15, hStabY, tailZ);
        group.add(leftHStab);
        
        // Right horizontal stabilizer
        const rightHStab = new THREE.Mesh(
            new THREE.BoxGeometry(hStabSpan / 2 - 0.1, 0.08, hStabChord),
            bodyMat
        );
        rightHStab.position.set(hStabSpan / 4 + 0.15, hStabY, tailZ);
        group.add(rightHStab);
        
        // Stabilizer tip fairings
        [-1, 1].forEach(side => {
            const tip = new THREE.Mesh(
                new THREE.BoxGeometry(0.2, 0.08, 0.5),
                bodyMat
            );
            tip.position.set(side * (hStabSpan / 2 + 0.08), hStabY + 0.02, tailZ - 0.1);
            tip.rotation.z = side * 0.12;
            group.add(tip);
        });
        
        // Elevator - on trailing edge
        const elevatorSpan = hStabSpan * 0.9;
        const elevatorChord = hStabChord * 0.55;
        
        this.elevator = new THREE.Mesh(
            new THREE.BoxGeometry(elevatorSpan, 0.08, elevatorChord),
            bodyMat
        );
        this.elevator.position.set(0, hStabY + 0.02, tailZ + hStabChord * 0.25);
        group.add(this.elevator);
        
        // Elevator stripe
        const elevatorStripe = new THREE.Mesh(
            new THREE.BoxGeometry(elevatorSpan * 0.5, 0.09, hStabChord * 0.3),
            stripeMat
        );
        elevatorStripe.position.set(0, hStabY + 0.02, tailZ + hStabChord * 0.15);
        group.add(elevatorStripe);
        
        // === LANDING GEAR ===
        // Properly angled struts connecting wheels to fuselage
        const noseWheelY = -0.85;
        const noseWheelZ = -2.3;
        const mainWheelY = -0.9;
        const mainWheelZ = 1.2;
        const mainWheelSpread = 1.25;
        
        // Fuselage attach points
        const noseAttachY = -0.25;
        const noseAttachZ = -1.8;
        const mainAttachY = -0.3;
        const mainAttachX = 0.65;
        
        // Nose gear strut - calculate angle and length
        const noseStrutLen = Math.sqrt(
            Math.pow(noseWheelY - noseAttachY, 2) + 
            Math.pow(noseWheelZ - noseAttachZ, 2)
        );
        const noseStrutAngle = Math.atan2(noseWheelY - noseAttachY, noseWheelZ - noseAttachZ);
        
        const noseStrut = new THREE.Mesh(
            new THREE.CylinderGeometry(0.05, 0.04, noseStrutLen, 8),
            strutMat
        );
        noseStrut.position.set(0, (noseAttachY + noseWheelY) / 2, (noseAttachZ + noseWheelZ) / 2);
        noseStrut.rotation.x = noseStrutAngle + Math.PI / 2;
        group.add(noseStrut);
        
        // Nose wheel
        const noseWheel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.16, 0.16, 0.1, 14),
            wheelMat
        );
        noseWheel.rotation.z = Math.PI / 2;
        noseWheel.position.set(0, noseWheelY, noseWheelZ);
        group.add(noseWheel);
        
        // Main gear struts (left and right)
        [-1, 1].forEach(side => {
            // Calculate strut geometry
            const strutLen = Math.sqrt(
                Math.pow(mainWheelY - mainAttachY, 2) + 
                Math.pow(mainWheelSpread - mainAttachX, 2) +
                Math.pow(mainWheelZ - mainWheelZ, 2) // Z is same, but keep for clarity
            );
            // Angle in X-Y plane (outward angle)
            const outwardAngle = Math.atan2(mainWheelSpread - mainAttachX, mainAttachY - mainWheelY);
            
            const strut = new THREE.Mesh(
                new THREE.CylinderGeometry(0.06, 0.05, Math.abs(mainAttachY - mainWheelY) + 0.1, 8),
                strutMat
            );
            // Position at midpoint between attach point and wheel
            strut.position.set(
                side * (mainAttachX + mainWheelSpread) / 2,
                (mainAttachY + mainWheelY) / 2,
                mainWheelZ
            );
            // Rotate to angle outward and down
            strut.rotation.z = side * outwardAngle;
            group.add(strut);
            
            // Main wheel
            const wheel = new THREE.Mesh(
                new THREE.CylinderGeometry(0.2, 0.2, 0.12, 14),
                wheelMat
            );
            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(side * mainWheelSpread, mainWheelY, mainWheelZ);
            group.add(wheel);
        });
        
        // === ANTENNAS ===
        // VOR antenna on top of vertical stabilizer
        const vor = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.3, 6), metalMat);
        vor.position.set(-0.05, vStabY + vStabHeight + 0.2, tailZ - vStabChord * 0.2);
        group.add(vor);
        
        // Pitot tube - left wing (further out, past the strut attach)
        const pitot = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.012, 0.22, 6), blackMat);
        pitot.rotation.z = Math.PI / 2;
        pitot.position.set(-3.5, wingY + 0.08, -wingChord * 0.45);
        group.add(pitot);
        
        // Stall warning horn - left wing
        const stallHorn = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.035, 0.09), blackMat);
        stallHorn.position.set(-3.5, wingY - 0.08, wingChord * 0.1);
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
        const tolerance = 2.0; // Allow 2m buffer above terrain
        const isBelowTerrain = this.position.y < (terrainHeight + groundClearance + tolerance);
        
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
