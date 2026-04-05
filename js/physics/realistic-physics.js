class RealisticPhysics {
    constructor(aircraft) {
        this.aircraft = aircraft;
        
        this.I_pitch = 1200;
        this.I_roll = 800;
        this.I_yaw = 1800;
        
        this.angularVelocity = { pitch: 0, roll: 0, yaw: 0 };
        
        this.Cl_alpha = 6.0;
        this.Cl_max = 1.6;
        this.Cd0 = 0.022;
        this.e = 0.8;
        this.aspectRatio = aircraft.wingspan * aircraft.wingspan / aircraft.wingArea;
        
        this.Cm_elevator = 0.8;
        this.Cl_aileron = -0.08;
        this.Cn_rudder = 0.06;
        
        this.maxElevatorDeflection = 25;
        this.maxAileronDeflection = 20;
        this.maxRudderDeflection = 25;
        
        this.pitchDamping = 1.2;
        this.rollDamping = 1.5;
        this.yawDamping = 2.0;
        
        this.propRadius = 1.0;
        
        this.groundEffectHeight = 20;
    }
    
    update(delta) {
        const aircraft = this.aircraft;
        
        if (aircraft.propeller) {
            aircraft.propeller.rotation.z += aircraft.throttle * 25 * delta;
        }
        
        const aileronAngle = aircraft.controlInput.roll * this.maxAileronDeflection * Math.PI / 180;
        if (aircraft.aileronL) aircraft.aileronL.rotation.x = -aileronAngle;
        if (aircraft.aileronR) aircraft.aileronR.rotation.x = aileronAngle;
        
        const elevatorAngle = aircraft.controlInput.pitch * this.maxElevatorDeflection * Math.PI / 180;
        if (aircraft.elevator) aircraft.elevator.rotation.x = -elevatorAngle;
        
        const rudderAngle = aircraft.controlInput.yaw * this.maxRudderDeflection * Math.PI / 180;
        if (aircraft.rudder) aircraft.rudder.rotation.y = rudderAngle;
        
        const forces = this.calculateForces(delta);
        
        const acceleration = forces.total.divideScalar(aircraft.mass);
        aircraft.velocity.add(acceleration.multiplyScalar(delta));
        
        const speed = aircraft.velocity.length();
        if (speed > aircraft.maxSpeed) {
            aircraft.velocity.multiplyScalar(aircraft.maxSpeed / speed);
        }
        
        aircraft.position.add(aircraft.velocity.clone().multiplyScalar(delta));
        
        if (aircraft.position.y < 0) {
            aircraft.position.y = 0;
            if (aircraft.velocity.y < 0) aircraft.velocity.y = 0;
        }
        
        this.updateRotation(delta);
        
        aircraft.altitude = aircraft.position.y;
        aircraft.groundSpeed = speed;
        aircraft.ias = speed * 1.944;
    }
    
    calculateForces(delta) {
        const aircraft = this.aircraft;
        const speed = aircraft.velocity.length();
        
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyEuler(aircraft.rotation);
        
        const up = new THREE.Vector3(0, 1, 0);
        up.applyEuler(aircraft.rotation);
        
        const right = new THREE.Vector3(1, 0, 0);
        right.applyEuler(aircraft.rotation);
        
        const q = 0.5 * aircraft.airDensity * speed * speed;
        
        let aoa = 0;
        if (speed > 1) {
            const velocityDir = aircraft.velocity.clone().normalize();
            aoa = forward.angleTo(velocityDir);
            const pitchComponent = velocityDir.dot(up);
            if (pitchComponent > 0) aoa = -aoa;
        }
        
        let Cl;
        const stallAngle = degreesToRadians(15);
        if (Math.abs(aoa) < stallAngle) {
            Cl = this.Cl_alpha * aoa;
        } else {
            const sign = Math.sign(aoa);
            Cl = sign * this.Cl_max * (1 - (Math.abs(aoa) - stallAngle) / stallAngle * 0.5);
        }
        Cl = clamp(Cl, -this.Cl_max, this.Cl_max);
        
        const Cd = this.Cd0 + Cl * Cl / (Math.PI * this.e * this.aspectRatio);
        
        const velocityDir = speed > 0.1 ? aircraft.velocity.clone().normalize() : forward.clone();
        
        const cosRoll = Math.cos(aircraft.rotation.z);
        const liftFactor = clamp(cosRoll, 0, 1);
        const liftMagnitude = q * aircraft.wingArea * Cl * liftFactor;
        const lift = up.clone().multiplyScalar(liftMagnitude);
        
        const drag = velocityDir.clone().multiplyScalar(-q * aircraft.wingArea * Cd);
        
        const thrustMagnitude = aircraft.throttle * aircraft.maxThrust;
        const thrust = forward.clone().multiplyScalar(thrustMagnitude);
        
        const weight = new THREE.Vector3(0, -aircraft.mass * 9.81, 0);
        
        if (aircraft.position.y < this.groundEffectHeight && aircraft.position.y > 0) {
            const effect = 1 - (aircraft.position.y / this.groundEffectHeight);
            lift.multiplyScalar(1 + effect * 0.5);
            drag.multiplyScalar(1 - effect * 0.3);
        }
        
        let total = new THREE.Vector3().add(thrust).add(lift).add(drag).add(weight);
        
        return { lift, drag, thrust, weight, total };
    }
    
    updateRotation(delta) {
        const aircraft = this.aircraft;
        const speed = aircraft.velocity.length();
        const q = 0.5 * aircraft.airDensity * speed * speed;
        
        const elevatorDeflection = aircraft.controlInput.pitch * this.maxElevatorDeflection * Math.PI / 180;
        const aileronDeflection = aircraft.controlInput.roll * this.maxAileronDeflection * Math.PI / 180;
        const rudderDeflection = aircraft.controlInput.yaw * this.maxRudderDeflection * Math.PI / 180;
        
        const M_pitch = q * aircraft.wingArea * 0.3 * this.Cm_elevator * elevatorDeflection;
        let M_roll = q * aircraft.wingArea * 2.5 * this.Cl_aileron * aileronDeflection;
        
        let M_yaw = q * aircraft.wingArea * 2.5 * this.Cn_rudder * rudderDeflection;
        
        const adverseYaw = -aileronDeflection * 0.05 * q * aircraft.wingArea;
        M_yaw += adverseYaw;
        
        const propTorque = aircraft.throttle * 0.02 * aircraft.maxThrust;
        M_roll += propTorque;
        
        const alpha_pitch = M_pitch / this.I_pitch;
        const alpha_roll = M_roll / this.I_roll;
        const alpha_yaw = M_yaw / this.I_yaw;
        
        this.angularVelocity.pitch += alpha_pitch * delta;
        this.angularVelocity.roll += alpha_roll * delta;
        this.angularVelocity.yaw += alpha_yaw * delta;
        
        this.angularVelocity.pitch *= (1 - this.pitchDamping * delta);
        this.angularVelocity.roll *= (1 - this.rollDamping * delta);
        this.angularVelocity.yaw *= (1 - this.yawDamping * delta);
        
        aircraft.rotation.x += this.angularVelocity.pitch * delta;
        aircraft.rotation.z += this.angularVelocity.roll * delta;
        aircraft.rotation.y += this.angularVelocity.yaw * delta;
        
        if (speed > 20 && Math.abs(aircraft.controlInput.pitch) < 0.1) {
            aircraft.rotation.x *= 0.98;
        }
        
        if (speed > 20) {
            aircraft.rotation.z *= 0.99;
        }
        
        aircraft.rotation.x = clamp(aircraft.rotation.x, degreesToRadians(-45), degreesToRadians(45));
        aircraft.rotation.z = clamp(aircraft.rotation.z, degreesToRadians(-60), degreesToRadians(60));
    }
}

window.RealisticPhysics = RealisticPhysics;
