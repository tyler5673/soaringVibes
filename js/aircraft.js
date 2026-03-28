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
        this.position = new THREE.Vector3(0, -310, -100);
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
        
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const accentMat = new THREE.MeshStandardMaterial({ color: 0xcc0000 });
        const glassMat = new THREE.MeshStandardMaterial({ color: 0x3366ff, transparent: true, opacity: 0.7 });
        const propMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
        
        const fuselageGeo = new THREE.CylinderGeometry(0.6, 0.4, 7, 12);
        fuselageGeo.rotateX(Math.PI / 2);
        const fuselage = new THREE.Mesh(fuselageGeo, bodyMat);
        fuselage.position.z = 0.5;
        group.add(fuselage);
        
        const noseGeo = new THREE.CylinderGeometry(0.4, 0.5, 1.2, 12);
        noseGeo.rotateX(Math.PI / 2);
        const nose = new THREE.Mesh(noseGeo, bodyMat);
        nose.position.set(0, -0.1, -3);
        group.add(nose);
        
        const spinnerGeo = new THREE.ConeGeometry(0.35, 0.5, 12);
        spinnerGeo.rotateX(-Math.PI / 2);
        const spinner = new THREE.Mesh(spinnerGeo, accentMat);
        spinner.position.set(0, 0, -3.6);
        group.add(spinner);
        
        const propGeo = new THREE.BoxGeometry(2.2, 0.08, 0.15);
        const prop = new THREE.Mesh(propGeo, propMat);
        prop.position.set(0, 0, -3.7);
        group.add(prop);
        
        const wingSpan = 11;
        const wingChord = 1.2;
        
        const leftWingGeo = new THREE.BoxGeometry(wingSpan / 2, 0.12, wingChord);
        const leftWing = new THREE.Mesh(leftWingGeo, bodyMat);
        leftWing.position.set(-wingSpan / 4 - 0.3, 0.3, 0);
        leftWing.rotation.z = -0.02;
        group.add(leftWing);
        
        const rightWing = new THREE.Mesh(leftWingGeo, bodyMat);
        rightWing.position.set(wingSpan / 4 + 0.3, 0.3, 0);
        rightWing.rotation.z = 0.02;
        group.add(rightWing);
        
        const wingStripeGeo = new THREE.BoxGeometry(wingSpan / 2 - 1, 0.13, wingChord * 0.4);
        const leftStripe = new THREE.Mesh(wingStripeGeo, accentMat);
        leftStripe.position.set(-wingSpan / 4 - 0.3, 0.31, 0);
        leftStripe.rotation.z = -0.02;
        group.add(leftStripe);
        
        const rightStripe = new THREE.Mesh(wingStripeGeo, accentMat);
        rightStripe.position.set(wingSpan / 4 + 0.3, 0.31, 0);
        rightStripe.rotation.z = 0.02;
        group.add(rightStripe);
        
        const tailLength = 2.2;
        const tailHeight = 2;
        const tailChord = 1;
        
        const vStabGeo = new THREE.BoxGeometry(0.1, tailHeight, tailChord);
        const vStab = new THREE.Mesh(vStabGeo, bodyMat);
        vStab.position.set(0, tailHeight / 2 + 0.2, 3.8);
        group.add(vStab);
        
        const vStripeGeo = new THREE.BoxGeometry(0.11, tailHeight * 0.7, tailChord * 0.5);
        const vStripe = new THREE.Mesh(vStripeGeo, accentMat);
        vStripe.position.set(0, tailHeight / 2 + 0.4, 3.8);
        group.add(vStripe);
        
        const hStabSpan = 3.5;
        const hStabGeo = new THREE.BoxGeometry(hStabSpan, 0.1, tailChord);
        const hStab = new THREE.Mesh(hStabGeo, bodyMat);
        hStab.position.set(0, 0.1, 3.8);
        group.add(hStab);
        
        const hStripeGeo = new THREE.BoxGeometry(hStabSpan * 0.6, 0.11, tailChord * 0.4);
        const hStripe = new THREE.Mesh(hStripeGeo, accentMat);
        hStripe.position.set(0, 0.11, 3.8);
        group.add(hStripe);
        
        const cockpitGeo = new THREE.SphereGeometry(0.5, 12, 10);
        cockpitGeo.scale(1, 0.6, 1.3);
        const cockpit = new THREE.Mesh(cockpitGeo, glassMat);
        cockpit.position.set(0, 0.35, -1.8);
        group.add(cockpit);
        
        const wheelGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.15, 12);
        wheelGeo.rotateZ(Math.PI / 2);
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
        
        const frontWheel = new THREE.Mesh(wheelGeo, wheelMat);
        frontWheel.position.set(0, -0.6, -2.5);
        group.add(frontWheel);
        
        const strutGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.8, 6);
        const strutMat = new THREE.MeshStandardMaterial({ color: 0x666666 });
        
        const leftStrut = new THREE.Mesh(strutGeo, strutMat);
        leftStrut.position.set(-1.8, -0.3, 1);
        group.add(leftStrut);
        
        const rightStrut = new THREE.Mesh(strutGeo, strutMat);
        rightStrut.position.set(1.8, -0.3, 1);
        group.add(rightStrut);
        
        const leftWheelPos = new THREE.Mesh(wheelGeo, wheelMat);
        leftWheelPos.position.set(-1.8, -0.7, 1);
        group.add(leftWheelPos);
        
        const rightWheelPos = new THREE.Mesh(wheelGeo, wheelMat);
        rightWheelPos.position.set(1.8, -0.7, 1);
        group.add(rightWheelPos);
        
        const axelGeo = new THREE.CylinderGeometry(0.04, 0.04, 3.8, 6);
        axelGeo.rotateZ(Math.PI / 2);
        const axel = new THREE.Mesh(axelGeo, strutMat);
        axel.position.set(0, -0.7, 1);
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
        this.position.set(0, -310, -150);
        this.velocity.set(0, 0, 0);
        this.rotation.set(0, Math.PI, 0);
        this.throttle = 0.4;
    }
}
