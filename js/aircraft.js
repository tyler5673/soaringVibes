// ========== AIRCRAFT ==========
class Aircraft {
    constructor() {
        // Physics constants
        this.mass = 5000;
        this.wingArea = 30;
        this.maxThrust = 60000;
        this.maxSpeed = 280;
        this.airDensity = 1.225;
        
        // Control rates
        this.rollRate = degreesToRadians(70);
        this.pitchRate = degreesToRadians(45);
        this.yawRate = degreesToRadians(35);
        
        // Initial state
        this.position = new THREE.Vector3(0, 10, -250);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.rotation = new THREE.Euler(0, Math.PI, 0, 'YXZ');
        this.throttle = 0.35;
        this.altitude = 8;
        
        this.controlInput = { pitch: 0, roll: 0, yaw: 0 };
        this.ias = 0;
        this.groundSpeed = 0;
        
        this.mesh = this.createMesh();
    }
    
    createMesh() {
        const group = new THREE.Group();
        
        const fuselageGeo = new THREE.CylinderGeometry(0.5, 0.3, 8, 8);
        fuselageGeo.rotateX(Math.PI / 2);
        const fuselageMat = new THREE.MeshStandardMaterial({ color: 0xcccccc });
        const fuselage = new THREE.Mesh(fuselageGeo, fuselageMat);
        group.add(fuselage);
        
        const wingGeo = new THREE.BoxGeometry(12, 0.1, 1.5);
        const wingMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });
        const wings = new THREE.Mesh(wingGeo, wingMat);
        wings.position.set(0, 0, 0.5);
        group.add(wings);
        
        const tailHGeo = new THREE.BoxGeometry(4, 0.1, 1);
        const tailH = new THREE.Mesh(tailHGeo, wingMat);
        tailH.position.set(0, 0, 3.5);
        group.add(tailH);
        
        const tailVGeo = new THREE.BoxGeometry(0.1, 2, 1);
        const tailV = new THREE.Mesh(tailVGeo, wingMat);
        tailV.position.set(0, 1, 3.5);
        group.add(tailV);
        
        const cockpitGeo = new THREE.SphereGeometry(0.6, 8, 8);
        cockpitGeo.scale(1, 0.6, 1.2);
        const cockpitMat = new THREE.MeshStandardMaterial({ color: 0x3366ff, transparent: true, opacity: 0.7 });
        const cockpit = new THREE.Mesh(cockpitGeo, cockpitMat);
        cockpit.position.set(0, 0.4, -1.5);
        group.add(cockpit);
        
        const wheelGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 8);
        wheelGeo.rotateZ(Math.PI / 2);
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
        
        const frontWheel = new THREE.Mesh(wheelGeo, wheelMat);
        frontWheel.position.set(0, -0.5, -2);
        group.add(frontWheel);
        
        const leftWheel = new THREE.Mesh(wheelGeo, wheelMat);
        leftWheel.position.set(-1.5, -0.5, 2);
        group.add(leftWheel);
        
        const rightWheel = new THREE.Mesh(wheelGeo, wheelMat);
        rightWheel.position.set(1.5, -0.5, 2);
        group.add(rightWheel);
        
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
        this.position.set(0, 10, -350);
        this.velocity.set(0, 0, 0);
        this.rotation.set(0, Math.PI, 0);
        this.throttle = 0.35;
    }
}
