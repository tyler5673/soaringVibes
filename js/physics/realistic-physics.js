// ========== REALISTIC PHYSICS ==========
// Uses cannon-es for rigid body physics

const CANNON = window.CANNON;
const PhysicsBridge = window.PhysicsBridge;
const AERODYNAMICS = window.AERODYNAMICS;

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

class RealisticPhysics {
    constructor(aircraft) {
        this.aircraft = aircraft;
        this.bridge = new PhysicsBridge(aircraft);
        
        // Aircraft properties
        this.wingArea = aircraft.wingArea || 16;
        this.wingspan = aircraft.wingspan || 11;
        this.mass = 1100;
        
        // Control limits
        this.maxElevatorDeflection = 25 * Math.PI / 180;
        this.maxAileronDeflection = 20 * Math.PI / 180;
        this.maxRudderDeflection = 25 * Math.PI / 180;
        
        // Aerodynamic coefficients
        this.Cl_alpha = 6.0;
        this.CLmax = 1.6;
        this.CD0 = 0.022;
        this.maxThrust = 3500;
    }
    
    get aspectRatio() {
        return this.wingspan ** 2 / this.wingArea;
    }
    
    update(delta) {
        const aircraft = this.aircraft;
        const body = this.bridge.body;
        const { controlInput, throttle, hasFloats } = aircraft;
        
        // Animate propeller
        if (aircraft.propeller) {
            aircraft.propeller.rotation.z += throttle * 25 * delta;
        }
        
        // Animate control surfaces
        const aileronAngle = controlInput.roll * this.maxAileronDeflection;
        if (aircraft.aileronL) aircraft.aileronL.rotation.x = -aileronAngle;
        if (aircraft.aileronR) aircraft.aileronR.rotation.x = aileronAngle;
        
        const elevatorAngle = controlInput.pitch * this.maxElevatorDeflection;
        if (aircraft.elevator) aircraft.elevator.rotation.x = -elevatorAngle;
        
        const rudderAngle = controlInput.yaw * this.maxRudderDeflection;
        if (aircraft.rudder) aircraft.rudder.rotation.y = rudderAngle;
        
        // Get state from physics bridge
        const speed = this.bridge.getVelocity();
        const angVel = this.bridge.getAngularVelocity();
        
        // Body vectors in world space
        const forward = new CANNON.Vec3(0, 0, -1);
        body.vectorToWorldFrame(forward, forward);
        forward.normalize();
        
        const up = new CANNON.Vec3(0, 1, 0);
        body.vectorToWorldFrame(up, up);
        up.normalize();
        
        const right = new CANNON.Vec3(1, 0, 0);
        body.vectorToWorldFrame(right, right);
        right.normalize();
        
        // Velocity direction
        const velocity = body.velocity.clone();
        velocity.normalize();
        
        // Calculate angles
        const alpha = clamp(forward.dot(up), -1, 1);
        const beta = clamp(forward.dot(right), -1, 1);
        
        // Dynamic pressure
        const q = 0.5 * AERODYNAMICS.rho * speed * speed;
        
        // Control deflections
        const elevator = controlInput.pitch * this.maxElevatorDeflection;
        const aileron = controlInput.roll * this.maxAileronDeflection;
        const rudder = controlInput.yaw * this.maxRudderDeflection;
        
        // === FORCES ===
        const force = new CANNON.Vec3(0, 0, 0);
        const torque = new CANNON.Vec3(0, 0, 0);
        
        // 1. Thrust
        if (throttle > 0 && speed < 80) {
            const thrustMag = AERODYNAMICS.thrust(throttle, this.maxThrust);
            const thrustForce = forward.clone();
            thrustForce.scale(thrustMag, thrustForce);
            force.vadd(thrustForce, force);
            
            // Prop torque
            torque.z += throttle * 50;
        }
        
        // 2. Lift
        const CL = AERODYNAMICS.liftCoefficient(alpha, {
            Cl_alpha: this.Cl_alpha,
            CLmax: this.CLmax
        });
        
        if (speed > 1) {
            const liftMag = q * this.wingArea * CL;
            const liftForce = up.clone();
            liftForce.scale(liftMag, liftForce);
            force.vadd(liftForce, force);
        }
        
        // 3. Drag
        const CD = AERODYNAMICS.dragCoefficient(CL, {
            CD0: this.CD0,
            AR: this.aspectRatio
        });
        
        if (speed > 1) {
            const dragMag = q * this.wingArea * CD;
            const dragForce = velocity.clone();
            dragForce.scale(-dragMag, dragForce);
            force.vadd(dragForce, force);
        }
        
        // 4. Control Forces (torques)
        const Cm = 2.5;
        const M_pitch = q * this.wingArea * 0.3 * Cm * elevator;
        torque.x += M_pitch;
        
        const Cl_ail = -0.25;
        const M_roll = q * this.wingArea * this.wingspan * 0.5 * Cl_ail * aileron;
        torque.z -= M_roll;
        
        const Cn = 0.50;
        const M_yaw = q * this.wingArea * this.wingspan * 0.5 * Cn * rudder;
        torque.y += M_yaw;
        
        // 5. Bank turn (horizontal force from bank angle)
        const roll = aircraft.rotation.z;
        const bankForce = Math.sin(roll) * speed * 50;
        const bankVec = right.clone();
        bankVec.scale(bankForce, bankVec);
        force.vadd(bankVec, force);
        
        // 6. Adverse yaw from roll
        if (Math.abs(angVel.roll) > 0.01) {
            torque.y -= angVel.roll * 100;
        }
        
        // 7. Gravity
        force.y -= this.mass * 9.81;
        
        // Apply forces
        body.applyForce(force);
        body.applyTorque(torque);
        
        // === LANDING HANDLING ===
        const altitude = body.position.y;
        const terrainHeight = typeof getTerrainHeight === 'function' 
            ? getTerrainHeight(body.position.x, body.position.z) 
            : 0;
        
        // Water physics for floats
        if (hasFloats) {
            const waterLevel = 2;  // Base water level
            const floatBottom = altitude - 0.85;
            
            if (floatBottom <= waterLevel) {
                // Water landing - buoyancy
                const submerged = Math.min(1, (waterLevel - floatBottom) / 2);
                const buoyancy = submerged * this.mass * 9.81 * 2;
                body.applyForce(new CANNON.Vec3(0, buoyancy, 0));
                
                // Water drag
                body.velocity.scale(1 - 2.0 * delta, body.velocity);
                body.angularVelocity.scale(1 - 3.0 * delta, body.angularVelocity);
                
                // Self-righting at low speeds
                if (speed < 10) {
                    const rollCorrection = -aircraft.rotation.z * 0.8 * delta;
                    const pitchCorrection = -aircraft.rotation.x * 0.5 * delta;
                    body.angularVelocity.x += pitchCorrection;
                    body.angularVelocity.z += rollCorrection;
                }
            }
        }
        
        // Land collision
        if (altitude <= terrainHeight) {
            const penetration = terrainHeight - body.position.y;
            const normalForce = penetration * 50000;
            body.applyForce(new CANNON.Vec3(0, normalForce, 0));
            
            // Ground friction
            body.velocity.scale(1 - 5.0 * delta, body.velocity);
            body.angularVelocity.scale(1 - 5.0 * delta, body.angularVelocity);
        }
        
        // === PHYSICS STEP ===
        this.bridge.update(delta);
        
        // === SYNC BACK ===
        this.bridge.syncToThree(aircraft);
        
        // Update gauges
        aircraft.ias = speed;
        aircraft.altitude = body.position.y;
        aircraft.groundSpeed = speed;
    }
}

window.RealisticPhysics = RealisticPhysics;
