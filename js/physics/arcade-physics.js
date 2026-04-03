class ArcadePhysics {
    constructor(aircraft) {
        this.aircraft = aircraft;
        
        this.rollRate = degreesToRadians(45);
        this.pitchRate = degreesToRadians(30);
        this.yawRate = degreesToRadians(20);
    }
    
    update(delta) {
        const aircraft = this.aircraft;
        
        if (aircraft.propeller) {
            aircraft.propeller.rotation.z += aircraft.throttle * 25 * delta;
        }
        
        const flapAngle = aircraft.controlInput.roll * 0.35;
        if (aircraft.leftFlap) aircraft.leftFlap.rotation.x = flapAngle;
        if (aircraft.rightFlap) aircraft.rightFlap.rotation.x = flapAngle;
        
        const aileronAngle = aircraft.controlInput.roll * 0.3;
        if (aircraft.aileronL) aircraft.aileronL.rotation.x = -aileronAngle;
        if (aircraft.aileronR) aircraft.aileronR.rotation.x = aileronAngle;
        
        const elevatorAngle = aircraft.controlInput.pitch * 0.3;
        if (aircraft.elevator) aircraft.elevator.rotation.x = -elevatorAngle;
        
        const rudderAngle = aircraft.controlInput.yaw * 0.35;
        if (aircraft.rudder) aircraft.rudder.rotation.y = rudderAngle;
        
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyEuler(aircraft.rotation);
        
        const aircraftUp = new THREE.Vector3(0, 1, 0);
        aircraftUp.applyEuler(aircraft.rotation);
        
        const right = new THREE.Vector3(1, 0, 0);
        right.applyEuler(aircraft.rotation);
        
        const thrustMagnitude = aircraft.throttle * aircraft.maxThrust;
        const thrust = forward.clone().multiplyScalar(thrustMagnitude);
        
        const speed = aircraft.velocity.length();
        
        let aoa = 0;
        if (speed > 1) {
            const velocityDir = aircraft.velocity.clone().normalize();
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
        
        const q = 0.5 * aircraft.airDensity * speed * speed;
        
        const velocityDir = speed > 0.1 ? aircraft.velocity.clone().normalize() : forward.clone();
        let liftDir = new THREE.Vector3().crossVectors(right, velocityDir).normalize();
        if (liftDir.length() < 0.1) {
            liftDir = aircraftUp.clone();
        }
        const lift = liftDir.multiplyScalar(q * aircraft.wingArea * cl);
        
        const drag = velocityDir.clone().multiplyScalar(-q * aircraft.wingArea * cd);
        
        const weight = new THREE.Vector3(0, -aircraft.mass * 9.81, 0);
        
        const groundEffectHeight = 20;
        if (aircraft.position.y < groundEffectHeight && aircraft.position.y > 0) {
            const effect = 1 - (aircraft.position.y / groundEffectHeight);
            lift.multiplyScalar(1 + effect * 0.5);
            drag.multiplyScalar(1 - effect * 0.3);
        }
        
        const totalForce = new THREE.Vector3().add(thrust).add(lift).add(drag).add(weight);
        const acceleration = totalForce.divideScalar(aircraft.mass);
        
        aircraft.velocity.add(acceleration.multiplyScalar(delta));
        
        if (speed > aircraft.maxSpeed) {
            aircraft.velocity.multiplyScalar(aircraft.maxSpeed / speed);
        }
        
        aircraft.position.add(aircraft.velocity.clone().multiplyScalar(delta));
        
        if (aircraft.position.y < 0) {
            aircraft.position.y = 0;
            if (aircraft.velocity.y < 0) aircraft.velocity.y = 0;
        }
        
        this.updateRotation(delta, speed);
        
        aircraft.altitude = aircraft.position.y;
        aircraft.groundSpeed = speed;
        aircraft.ias = speed * 1.944;
    }
    
    updateRotation(delta, speed) {
        const aircraft = this.aircraft;
        const controlEffectiveness = Math.min(1, speed / 30);
        
        aircraft.rotation.x += aircraft.controlInput.pitch * this.pitchRate * delta * controlEffectiveness;
        aircraft.rotation.x = clamp(aircraft.rotation.x, degreesToRadians(-45), degreesToRadians(45));
        
        aircraft.rotation.z -= aircraft.controlInput.roll * this.rollRate * delta * controlEffectiveness;
        aircraft.rotation.z = clamp(aircraft.rotation.z, degreesToRadians(-60), degreesToRadians(60));
        
        aircraft.rotation.y += aircraft.controlInput.yaw * this.yawRate * delta * controlEffectiveness;
        
        if (speed > 20) {
            aircraft.rotation.z *= 0.99;
        }
        
        if (speed > 20 && Math.abs(aircraft.controlInput.pitch) < 0.1) {
            aircraft.rotation.x *= 0.98;
        }
        
        if (speed > 20) {
            aircraft.rotation.y += Math.sin(aircraft.rotation.z) * 0.3 * delta;
        }
    }
}

window.ArcadePhysics = ArcadePhysics;
