// ========== AIRCRAFT ==========
class Aircraft {
    constructor() {
        // Physics constants - Cessna 172 style
        this.mass = 2300;  // ~5100 lbs gross
        this.wingArea = 26;
        this.maxThrust = 12000;  // ~210 hp
        this.maxSpeed = 180;  // ~120 kts cruise
        this.airDensity = 1.225;
        
        // Control rates - docile handling
        this.rollRate = degreesToRadians(40);
        this.pitchRate = degreesToRadians(25);
        this.yawRate = degreesToRadians(20);
        
        // Initial state
        this.position = new THREE.Vector3(0, 20, -100);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.rotation = new THREE.Euler(0, Math.PI, 0, 'YXZ');
        this.throttle = 0.4;
        this.altitude = 8;
        
        this.controlInput = { pitch: 0, roll: 0, yaw: 0 };
        this.ias = 0;
        this.groundSpeed = 0;
        
        this.mesh = this.createMesh();
    }
    
    createMesh() {
        const group = new THREE.Group();
        
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f5 });
        const stripeMat = new THREE.MeshStandardMaterial({ color: 0xcc0000 });
        const glassMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2e, transparent: true, opacity: 0.8 });
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
        const strutMat = new THREE.MeshStandardMaterial({ color: 0x666666 });
        const metalMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8, roughness: 0.3 });
        
        const fuselageLength = 6.5;
        const fuselageRadius = 0.65;
        
        const fuselageGeo = new THREE.CylinderGeometry(fuselageRadius * 0.9, fuselageRadius * 0.6, fuselageLength, 16);
        fuselageGeo.rotateX(Math.PI / 2);
        const fuselage = new THREE.Mesh(fuselageGeo, bodyMat);
        fuselage.position.set(0, 0, 0.3);
        group.add(fuselage);
        
        const tailConeGeo = new THREE.ConeGeometry(fuselageRadius * 0.6, 1.5, 16);
        tailConeGeo.rotateX(Math.PI / 2);
        const tailCone = new THREE.Mesh(tailConeGeo, bodyMat);
        tailCone.position.set(0, 0, 4);
        group.add(tailCone);
        
        const noseGeo = new THREE.SphereGeometry(0.55, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
        const nose = new THREE.Mesh(noseGeo, bodyMat);
        nose.position.set(0, -0.15, -3);
        nose.rotation.x = Math.PI;
        group.add(nose);
        
        const spinnerGeo = new THREE.ConeGeometry(0.3, 0.5, 12);
        spinnerGeo.rotateX(-Math.PI / 2);
        const spinner = new THREE.Mesh(spinnerGeo, stripeMat);
        spinner.position.set(0, 0, -3.4);
        group.add(spinner);
        
        const propHubGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.2, 8);
        propHubGeo.rotateX(Math.PI / 2);
        const propHub = new THREE.Mesh(propHubGeo, metalMat);
        propHub.position.set(0, 0, -3.6);
        group.add(propHub);
        
        const bladeCount = 2;
        for (let i = 0; i < bladeCount; i++) {
            const bladeGeo = new THREE.BoxGeometry(0.08, 1.8, 0.2);
            const blade = new THREE.Mesh(bladeGeo, metalMat);
            blade.rotation.z = (i / bladeCount) * Math.PI;
            blade.position.set(0, 0, -3.65);
            group.add(blade);
        }
        
        const wingSpan = 10;
        const wingChord = 1.3;
        const wingThickness = 0.15;
        const wingY = 0.35;
        
        const wingGeo = new THREE.BoxGeometry(wingSpan / 2 - 0.3, wingThickness, wingChord);
        
        const leftWing = new THREE.Mesh(wingGeo, bodyMat);
        leftWing.position.set(-wingSpan / 4 - 0.3, wingY, -0.2);
        leftWing.rotation.z = -0.015;
        group.add(leftWing);
        
        const rightWing = new THREE.Mesh(wingGeo, bodyMat);
        rightWing.position.set(wingSpan / 4 + 0.3, wingY, -0.2);
        rightWing.rotation.z = 0.015;
        group.add(rightWing);
        
        const stripeWidth = wingSpan / 2 - 2;
        const stripeGeo = new THREE.BoxGeometry(stripeWidth, wingThickness + 0.02, wingChord * 0.5);
        
        const leftStripe = new THREE.Mesh(stripeGeo, stripeMat);
        leftStripe.position.set(-wingSpan / 4 - 0.3, wingY + 0.01, -0.2);
        leftStripe.rotation.z = -0.015;
        group.add(leftStripe);
        
        const rightStripe = new THREE.Mesh(stripeGeo, stripeMat);
        rightStripe.position.set(wingSpan / 4 + 0.3, wingY + 0.01, -0.2);
        rightStripe.rotation.z = 0.015;
        group.add(rightStripe);
        
        const vStabHeight = 1.8;
        const vStabChord = 1.2;
        const vStabGeo = new THREE.BoxGeometry(0.12, vStabHeight, vStabChord);
        const vStab = new THREE.Mesh(vStabGeo, bodyMat);
        vStab.position.set(0, vStabHeight / 2 + 0.1, 3.6);
        group.add(vStab);
        
        const vStripeGeo = new THREE.BoxGeometry(0.13, vStabHeight * 0.6, vStabChord * 0.5);
        const vStripe = new THREE.Mesh(vStripeGeo, stripeMat);
        vStripe.position.set(0, vStabHeight / 2 + 0.2, 3.6);
        group.add(vStripe);
        
        const hStabSpan = 3.2;
        const hStabChord = 0.9;
        const hStabGeo = new THREE.BoxGeometry(hStabSpan, 0.1, hStabChord);
        const hStab = new THREE.Mesh(hStabGeo, bodyMat);
        hStab.position.set(0, 0.1, 3.6);
        group.add(hStab);
        
        const hStripeGeo = new THREE.BoxGeometry(hStabSpan * 0.5, 0.11, hStabChord * 0.5);
        const hStripe = new THREE.Mesh(hStripeGeo, stripeMat);
        hStripe.position.set(0, 0.11, 3.6);
        group.add(hStripe);
        
        const cockpitGeo = new THREE.SphereGeometry(0.45, 12, 10, 0, Math.PI * 2, 0, Math.PI / 2);
        const cockpit = new THREE.Mesh(cockpitGeo, glassMat);
        cockpit.position.set(0, 0.25, -1.5);
        cockpit.scale.set(1, 0.7, 1.2);
        group.add(cockpit);
        
        const windshieldGeo = new THREE.SphereGeometry(0.35, 8, 6, -Math.PI / 4, Math.PI / 2, 0, Math.PI / 2);
        const windshield = new THREE.Mesh(windshieldGeo, glassMat);
        windshield.position.set(0, 0.3, -2);
        windshield.scale.set(1.1, 0.8, 1.2);
        windshield.rotation.x = -0.2;
        group.add(windshield);
        
        const noseWheelY = -0.7;
        const noseWheelZ = -2.2;
        
        const noseStrutGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.6, 8);
        const noseStrut = new THREE.Mesh(noseStrutGeo, strutMat);
        noseStrut.position.set(0, noseWheelY + 0.3, noseWheelZ);
        noseStrut.rotation.x = Math.PI / 6;
        group.add(noseStrut);
        
        const noseWheelGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.12, 12);
        noseWheelGeo.rotateZ(Math.PI / 2);
        const noseWheel = new THREE.Mesh(noseWheelGeo, wheelMat);
        noseWheel.position.set(0, noseWheelY, noseWheelZ);
        group.add(noseWheel);
        
        const mainWheelY = -0.75;
        const mainWheelZ = 1.2;
        const mainWheelSpread = 1.6;
        
        const mainStrutGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.9, 8);
        
        const leftMainStrut = new THREE.Mesh(mainStrutGeo, strutMat);
        leftMainStrut.position.set(-mainWheelSpread, mainWheelY + 0.35, mainWheelZ);
        leftMainStrut.rotation.z = 0.1;
        group.add(leftMainStrut);
        
        const rightMainStrut = new THREE.Mesh(mainStrutGeo, strutMat);
        rightMainStrut.position.set(mainWheelSpread, mainWheelY + 0.35, mainWheelZ);
        rightMainStrut.rotation.z = -0.1;
        group.add(rightMainStrut);
        
        const mainWheelGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.14, 12);
        mainWheelGeo.rotateZ(Math.PI / 2);
        
        const leftMainWheel = new THREE.Mesh(mainWheelGeo, wheelMat);
        leftMainWheel.position.set(-mainWheelSpread, mainWheelY, mainWheelZ);
        group.add(leftMainWheel);
        
        const rightMainWheel = new THREE.Mesh(mainWheelGeo, wheelMat);
        rightMainWheel.position.set(mainWheelSpread, mainWheelY, mainWheelZ);
        group.add(rightMainWheel);
        
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
        const throttleSpeed = 0.5;
        if (throttleUp) this.throttle = Math.min(1, this.throttle + throttleSpeed * delta);
        if (throttleDown) this.throttle = Math.max(0, this.throttle - throttleSpeed * delta);
    }
    
    update(delta) {
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyEuler(this.rotation);
        
        const up = new THREE.Vector3(0, 1, 0);
        up.applyEuler(this.rotation);
        
        const thrustMagnitude = this.throttle * this.maxThrust;
        const thrust = forward.clone().multiplyScalar(thrustMagnitude);
        
        const speed = this.velocity.length();
        
        let aoa = 0;
        if (speed > 1) {
            const velocityDir = this.velocity.clone().normalize();
            aoa = forward.angleTo(velocityDir);
            const pitchComponent = velocityDir.dot(up);
            if (pitchComponent > 0) aoa = -aoa;
        }
        
        const stallAngle = degreesToRadians(15);
        let cl;
        if (Math.abs(aoa) < stallAngle) {
            cl = 2 * Math.PI * aoa * 2;
        } else {
            cl = 2 * Math.PI * stallAngle * 0.5 * Math.sign(aoa);
        }
        cl = clamp(cl, -1.5, 1.5);
        
        const cd0 = 0.025;
        const k = 0.04;
        const cd = cd0 + k * cl * cl;
        
        const q = 0.5 * this.airDensity * speed * speed;
        
        const lift = up.clone().multiplyScalar(q * this.wingArea * cl);
        const drag = this.velocity.clone().normalize().multiplyScalar(-q * this.wingArea * cd);
        
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
        this.position.set(0, 20, -150);
        this.velocity.set(0, 0, 0);
        this.rotation.set(0, Math.PI, 0);
        this.throttle = 0.4;
    }
}
