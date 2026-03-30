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
        const stripeMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.5 });
        const glassMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2e, transparent: true, opacity: 0.75, roughness: 0.1, metalness: 0.3 });
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.8 });
        const strutMat = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.5, metalness: 0.4 });
        const metalMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8, roughness: 0.3 });
        const engineMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.4, metalness: 0.6 });
        const exhaustMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.7 });
        
        // Fuselage - more detailed with panels
        const fuselageLength = 8;
        const fuselageRadius = 0.65;
        
        const fuselageGeo = new THREE.CylinderGeometry(fuselageRadius, fuselageRadius * 0.65, fuselageLength, 20);
        fuselageGeo.rotateX(Math.PI / 2);
        const fuselage = new THREE.Mesh(fuselageGeo, bodyMat);
        fuselage.position.set(0, 0, 0);
        group.add(fuselage);
        
        // Fuselage panel lines
        for (let i = -3; i <= 3; i++) {
            const panelGeo = new THREE.TorusGeometry(fuselageRadius * 0.98, 0.02, 4, 20);
            const panel = new THREE.Mesh(panelGeo, new THREE.MeshStandardMaterial({ color: 0xcccccc }));
            panel.rotation.x = Math.PI / 2;
            panel.position.z = i * 1;
            group.add(panel);
        }
        
        // Tail taper
        const tailTaperGeo = new THREE.CylinderGeometry(fuselageRadius * 0.65, fuselageRadius * 0.35, 1.5, 16);
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
        
        // Nose cowling - characteristic 182 shape
        const cowlingGeo = new THREE.CylinderGeometry(0.7, 0.55, 1.2, 24);
        cowlingGeo.rotateX(Math.PI / 2);
        const cowling = new THREE.Mesh(cowlingGeo, bodyMat);
        cowling.position.set(0, -0.05, -3.5);
        group.add(cowling);
        
        // Oil cooler scoop
        const scoopGeo = new THREE.BoxGeometry(0.25, 0.15, 0.5);
        const scoop = new THREE.Mesh(scoopGeo, metalMat);
        scoop.position.set(0.3, -0.35, -3.2);
        group.add(scoop);
        
        // Engine cylinders (Continental IO-520 style)
        const cylRadius = 0.12;
        const cylHeight = 0.8;
        for (let row = 0; row < 2; row++) {
            for (let col = 0; col < 3; col++) {
                const cylGeo = new THREE.CylinderGeometry(cylRadius, cylRadius, cylHeight, 12);
                const cyl = new THREE.Mesh(cylGeo, engineMat);
                cyl.position.set(
                    (col - 1) * 0.3,
                    -0.15 + row * 0.25,
                    -3.8
                );
                group.add(cyl);
            }
        }
        
        // Intake manifold
        const intakeGeo = new THREE.TorusGeometry(0.2, 0.04, 8, 12, Math.PI);
        const intake = new THREE.Mesh(intakeGeo, metalMat);
        intake.position.set(0, -0.2, -3.9);
        intake.rotation.x = Math.PI / 2;
        group.add(intake);
        
        // Spinner
        const spinnerGeo = new THREE.ConeGeometry(0.28, 0.45, 16);
        spinnerGeo.rotateX(-Math.PI / 2);
        const spinner = new THREE.Mesh(spinnerGeo, stripeMat);
        spinner.position.set(0, 0, -4.1);
        group.add(spinner);
        
        // Propeller hub
        const hubGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.2, 12);
        hubGeo.rotateX(Math.PI / 2);
        const hub = new THREE.Mesh(hubGeo, metalMat);
        hub.position.set(0, 0, -4.25);
        group.add(hub);
        
        // Propeller - 3 blades
        this.propeller = new THREE.Group();
        const bladeMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.9, roughness: 0.2 });
        for (let i = 0; i < 3; i++) {
            const bladeGroup = new THREE.Group();
            
            const bladeGeo = new THREE.BoxGeometry(0.08, 1.9, 0.25);
            const blade = new THREE.Mesh(bladeGeo, bladeMat);
            blade.position.y = 0.95;
            bladeGroup.add(blade);
            
            const tipGeo = new THREE.BoxGeometry(0.1, 0.15, 0.3);
            const tip = new THREE.Mesh(tipGeo, bladeMat);
            tip.position.y = 1.85;
            bladeGroup.add(tip);
            
            bladeGroup.rotation.z = (i * Math.PI * 2) / 3;
            this.propeller.add(bladeGroup);
        }
        this.propeller.position.set(0, 0, -4.35);
        group.add(this.propeller);
        
        // Exhaust stacks
        const exhaustGeo = new THREE.CylinderGeometry(0.05, 0.06, 0.4, 8);
        [-0.25, 0.25].forEach(x => {
            const exhaust = new THREE.Mesh(exhaustGeo, exhaustMat);
            exhaust.position.set(x, -0.3, -3.6);
            exhaust.rotation.x = Math.PI / 4;
            group.add(exhaust);
        });
        
        // Wings - high wing with flaps and ailerons
        const wingSpan = 11;
        const wingChord = 1.5;
        const wingThickness = 0.2;
        const wingY = 0.4;
        
        // Main wing sections
        const wingGeo = new THREE.BoxGeometry(wingSpan / 2 - 0.5, wingThickness, wingChord);
        
        const leftWing = new THREE.Mesh(wingGeo, bodyMat);
        leftWing.position.set(-wingSpan / 4 - 0.3, wingY, -0.2);
        leftWing.rotation.z = -0.015;
        group.add(leftWing);
        
        const rightWing = new THREE.Mesh(wingGeo, bodyMat);
        rightWing.position.set(wingSpan / 4 + 0.3, wingY, -0.2);
        rightWing.rotation.z = 0.015;
        group.add(rightWing);
        
        // Wing stripes
        const stripeGeo = new THREE.BoxGeometry(wingSpan / 2 - 3, wingThickness + 0.02, wingChord * 0.5);
        
        const leftStripe = new THREE.Mesh(stripeGeo, stripeMat);
        leftStripe.position.set(-wingSpan / 4 - 0.3, wingY + 0.01, -0.2);
        leftStripe.rotation.z = -0.015;
        group.add(leftStripe);
        
        const rightStripe = new THREE.Mesh(stripeGeo, stripeMat);
        rightStripe.position.set(wingSpan / 4 + 0.3, wingY + 0.01, -0.2);
        rightStripe.rotation.z = 0.015;
        group.add(rightStripe);
        
        // Flaps (animated)
        const flapGeo = new THREE.BoxGeometry(wingSpan / 2 - 4, 0.08, wingChord * 0.35);
        
        this.leftFlap = new THREE.Mesh(flapGeo, bodyMat);
        this.leftFlap.position.set(-wingSpan / 4 - 0.8, wingY - 0.05, wingChord * 0.25);
        group.add(this.leftFlap);
        
        this.rightFlap = new THREE.Mesh(flapGeo, bodyMat);
        this.rightFlap.position.set(wingSpan / 4 + 0.8, wingY - 0.05, wingChord * 0.25);
        group.add(this.rightFlap);
        
        // Ailerons (animated)
        const aileronGeo = new THREE.BoxGeometry(wingSpan / 2 - 5, 0.1, wingChord * 0.3);
        
        this.aileronL = new THREE.Mesh(aileronGeo, bodyMat);
        this.aileronL.position.set(-wingSpan / 4 - 0.8, wingY - 0.05, -wingChord * 0.4);
        group.add(this.aileronL);
        
        this.aileronR = new THREE.Mesh(aileronGeo, bodyMat);
        this.aileronR.position.set(wingSpan / 4 + 0.8, wingY - 0.05, -wingChord * 0.4);
        group.add(this.aileronR);
        
        // Wing tips
        const tipShape = new THREE.BoxGeometry(0.3, wingThickness, wingChord * 0.6);
        
        const leftTip = new THREE.Mesh(tipShape, stripeMat);
        leftTip.position.set(-wingSpan / 2, wingY, -0.2);
        group.add(leftTip);
        
        const rightTip = new THREE.Mesh(tipShape, stripeMat);
        rightTip.position.set(wingSpan / 2, wingY, -0.2);
        group.add(rightTip);
        
        // Landing lights
        const lightGeo = new THREE.CircleGeometry(0.1, 12);
        const lightMat = new THREE.MeshStandardMaterial({ color: 0xffffaa, emissive: 0xffffaa, emissiveIntensity: 0.5 });
        
        const leftLight = new THREE.Mesh(lightGeo, lightMat);
        leftLight.position.set(-wingSpan / 2 + 0.2, wingY - 0.1, 0.5);
        leftLight.rotation.y = Math.PI / 2;
        group.add(leftLight);
        
        const rightLight = new THREE.Mesh(lightGeo, lightMat);
        rightLight.position.set(wingSpan / 2 - 0.2, wingY - 0.1, 0.5);
        rightLight.rotation.y = Math.PI / 2;
        group.add(rightLight);
        
        // Vertical stabilizer (tail)
        const vStabHeight = 2.1;
        const vStabChord = 1.3;
        const vStabGeo = new THREE.BoxGeometry(0.16, vStabHeight, vStabChord);
        const vStab = new THREE.Mesh(vStabGeo, bodyMat);
        vStab.position.set(0, vStabHeight / 2 + 0.2, 4.5);
        group.add(vStab);
        
        // Rudder (animated)
        this.rudder = new THREE.Mesh(new THREE.BoxGeometry(0.1, vStabHeight * 0.7, vStabChord * 0.6), bodyMat);
        this.rudder.position.set(0, vStabHeight / 2 + 0.2, 4.8);
        group.add(this.rudder);
        
        // Vertical stripe
        const vStripeGeo = new THREE.BoxGeometry(0.17, vStabHeight * 0.6, vStabChord * 0.5);
        const vStripe = new THREE.Mesh(vStripeGeo, stripeMat);
        vStripe.position.set(0, vStabHeight / 2 + 0.3, 4.5);
        group.add(vStripe);
        
        // Horizontal stabilizer
        const hStabSpan = 3.6;
        const hStabChord = 0.95;
        const hStabGeo = new THREE.BoxGeometry(hStabSpan, 0.14, hStabChord);
        const hStab = new THREE.Mesh(hStabGeo, bodyMat);
        hStab.position.set(0, 0.14, 4.5);
        group.add(hStab);
        
        // Elevator (animated)
        this.elevator = new THREE.Mesh(new THREE.BoxGeometry(hStabSpan * 0.9, 0.1, hStabChord * 0.6), bodyMat);
        this.elevator.position.set(0, 0.14, 4.95);
        group.add(this.elevator);
        
        // Horizontal stripe
        const hStripeGeo = new THREE.BoxGeometry(hStabSpan * 0.5, 0.15, hStabChord * 0.5);
        const hStripe = new THREE.Mesh(hStripeGeo, stripeMat);
        hStripe.position.set(0, 0.15, 4.5);
        group.add(hStripe);
        
        // Cockpit - 4 seats visible
        const cabinWidth = 0.8;
        const cabinHeight = 0.5;
        
        // Main cabin glass
        const cabinGeo = new THREE.CylinderGeometry(cabinWidth, cabinWidth, 1.5, 16, 1, true, 0, Math.PI);
        const cabin = new THREE.Mesh(cabinGeo, glassMat);
        cabin.position.set(0, 0.35, -1.2);
        cabin.rotation.x = Math.PI / 2;
        cabin.scale.set(1, 1, 1);
        group.add(cabin);
        
        // Window frames
        const frameMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
        for (let i = 0; i < 4; i++) {
            const frameGeo = new THREE.BoxGeometry(0.02, 0.35, 0.02);
            const frame = new THREE.Mesh(frameGeo, frameMat);
            frame.position.set(
                Math.cos(i * Math.PI / 4) * (cabinWidth + 0.01),
                0.35,
                -1.2 + Math.sin(i * Math.PI / 4) * 0.8
            );
            frame.rotation.y = i * Math.PI / 4;
            group.add(frame);
        }
        
        // Windshield
        const windshieldGeo = new THREE.CylinderGeometry(0.4, 0.35, 0.6, 16, 1, true, -Math.PI / 3, Math.PI * 2 / 3);
        const windshield = new THREE.Mesh(windshieldGeo, glassMat);
        windshield.position.set(0, 0.4, -1.8);
        windshield.rotation.x = -0.4;
        group.add(windshield);
        
        // Landing gear
        const noseWheelY = -0.7;
        const noseWheelZ = -2.6;
        
        // Nose strut
        const noseStrutGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.6, 8);
        const noseStrut = new THREE.Mesh(noseStrutGeo, strutMat);
        noseStrut.position.set(0, noseWheelY + 0.3, noseWheelZ - 0.2);
        noseStrut.rotation.x = Math.PI / 6;
        group.add(noseStrut);
        
        // Nose wheel
        const noseWheelGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.12, 16);
        noseWheelGeo.rotateZ(Math.PI / 2);
        const noseWheel = new THREE.Mesh(noseWheelGeo, wheelMat);
        noseWheel.position.set(0, noseWheelY, noseWheelZ);
        group.add(noseWheel);
        
        // Main landing gear
        const mainWheelY = -0.75;
        const mainWheelZ = 1.2;
        const mainWheelSpread = 1.6;
        
        // Main struts
        const mainStrutGeo = new THREE.CylinderGeometry(0.06, 0.05, 0.9, 8);
        
        const leftMainStrut = new THREE.Mesh(mainStrutGeo, strutMat);
        leftMainStrut.position.set(-mainWheelSpread, mainWheelY + 0.4, mainWheelZ);
        leftMainStrut.rotation.z = 0.12;
        group.add(leftMainStrut);
        
        const rightMainStrut = new THREE.Mesh(mainStrutGeo, strutMat);
        rightMainStrut.position.set(mainWheelSpread, mainWheelY + 0.4, mainWheelZ);
        rightMainStrut.rotation.z = -0.12;
        group.add(rightMainStrut);
        
        // Main wheels
        const mainWheelGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.14, 16);
        mainWheelGeo.rotateZ(Math.PI / 2);
        
        const leftMainWheel = new THREE.Mesh(mainWheelGeo, wheelMat);
        leftMainWheel.position.set(-mainWheelSpread, mainWheelY, mainWheelZ);
        group.add(leftMainWheel);
        
        const rightMainWheel = new THREE.Mesh(mainWheelGeo, wheelMat);
        rightMainWheel.position.set(mainWheelSpread, mainWheelY, mainWheelZ);
        group.add(rightMainWheel);
        
        // Axle
        const axelGeo = new THREE.CylinderGeometry(0.04, 0.04, mainWheelSpread * 2, 8);
        axelGeo.rotateZ(Math.PI / 2);
        const axel = new THREE.Mesh(axelGeo, strutMat);
        axel.position.set(0, mainWheelY, mainWheelZ);
        group.add(axel);
        
        group.castShadow = true;
        return group;
    }
    
    setControlInput(input) {
        this.controlInput.pitch = input.pitch;
        this.controlInput.roll = input.roll;
        this.controlInput.yaw = input.yaw;
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
