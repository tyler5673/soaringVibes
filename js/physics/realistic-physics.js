// ========== REALISTIC PHYSICS ==========
// Uses cannon-es for rigid body physics - self-contained

(function() {
    'use strict';
    
    const CANNON = window.CANNON;
    const AERODYNAMICS = window.AERODYNAMICS;
    
    if (!CANNON || !AERODYNAMICS) {
        console.error('Missing physics deps:', { CANNON: !!CANNON, AERODYNAMICS: !!AERODYNAMICS });
        return;
    }
    
    // ========== PHYSICS BRIDGE ==========
    class PhysicsBridge {
        constructor(aircraft) {
            this.aircraft = aircraft;
            
            this.world = new CANNON.World();
            this.world.gravity.set(0, -9.81, 0);
            this.world.broadphase = new CANNON.NaiveBroadphase();
            
            const material = new CANNON.Material('aircraft');
            const contactMaterial = new CANNON.ContactMaterial(material, material, {
                friction: 0.3,
                restitution: 0.1
            });
            this.world.addContactMaterial(contactMaterial);
            this.material = material;
            
            this.body = new CANNON.Body({
                mass: 1100,
                shape: new CANNON.Box(new CANNON.Vec3(2, 1, 5)),
                material: material,
                linearDamping: 0.5,
                angularDamping: 0.7,
                position: new CANNON.Vec3(
                    aircraft.position.x,
                    aircraft.position.y,
                    aircraft.position.z
                )
            });
            
            this.body.quaternion.setFromEuler(
                aircraft.rotation.x,
                aircraft.rotation.y,
                aircraft.rotation.z,
                'YXZ'
            );
            
            // Sync initial velocity
            if (aircraft.velocity) {
                this.body.velocity.set(
                    aircraft.velocity.x,
                    aircraft.velocity.y,
                    aircraft.velocity.z
                );
            }
            
            this.world.addBody(this.body);
        }
        
        syncFromThree(aircraft) {
            this.body.position.set(
                aircraft.position.x,
                aircraft.position.y,
                aircraft.position.z
            );
            this.body.quaternion.setFromEuler(
                aircraft.rotation.x,
                aircraft.rotation.y,
                aircraft.rotation.z,
                'YXZ'
            );
        }
        
        syncToThree(aircraft) {
            const euler = new CANNON.Vec3();
            this.body.quaternion.toEuler(euler);
            
            aircraft.position.x = this.body.position.x;
            aircraft.position.y = this.body.position.y;
            aircraft.position.z = this.body.position.z;
            
            aircraft.rotation.x = euler.x;
            aircraft.rotation.y = euler.y;
            aircraft.rotation.z = euler.z;
        }
        
        getVelocity() {
            return Math.sqrt(
                this.body.velocity.x ** 2 +
                this.body.velocity.y ** 2 +
                this.body.velocity.z ** 2
            );
        }
        
        getAngularVelocity() {
            return {
                pitch: this.body.angularVelocity.x,
                roll: this.body.angularVelocity.z,
                yaw: this.body.angularVelocity.y
            };
        }
        
        reset(aircraft) {
            // Reset body to aircraft position/rotation/velocity
            this.body.position.set(
                aircraft.position.x,
                aircraft.position.y,
                aircraft.position.z
            );
            this.body.quaternion.setFromEuler(
                aircraft.rotation.x,
                aircraft.rotation.y,
                aircraft.rotation.z,
                'YXZ'
            );
            this.body.velocity.set(
                aircraft.velocity.x,
                aircraft.velocity.y,
                aircraft.velocity.z
            );
            this.body.angularVelocity.set(0, 0, 0);
        }
        
        update(delta, substeps) {
            substeps = substeps || 3;
            const dt = delta / substeps;
            for (let i = 0; i < substeps; i++) {
                this.world.step(dt);
            }
        }
    }
    
    // Using clamp from utils.js
    const clamp = window.clamp || function(v, min, max) { return Math.max(min, Math.min(max, v)); };
    
    // ========== REALISTIC PHYSICS ==========
    class RealisticPhysics {
        constructor(aircraft) {
            this.aircraft = aircraft;
            this.bridge = new PhysicsBridge(aircraft);
            
            this.wingArea = aircraft.wingArea || 16;
            this.wingspan = aircraft.wingspan || 11;
            this.mass = 1100;
            
            this.maxElevatorDeflection = 25 * Math.PI / 180;
            this.maxAileronDeflection = 20 * Math.PI / 180;
            this.maxRudderDeflection = 25 * Math.PI / 180;
            
            this.Cl_alpha = 6.0;
            this.frameCount = 0;
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
            const controlInput = aircraft.controlInput;
            const throttle = aircraft.throttle;
            const hasFloats = aircraft.hasFloats;
            
            if (aircraft.propeller) {
                aircraft.propeller.rotation.z += throttle * 25 * delta;
            }
            
            const aileronAngle = controlInput.roll * this.maxAileronDeflection;
            if (aircraft.aileronL) aircraft.aileronL.rotation.x = -aileronAngle;
            if (aircraft.aileronR) aircraft.aileronR.rotation.x = aileronAngle;
            
            const elevatorAngle = controlInput.pitch * this.maxElevatorDeflection;
            if (aircraft.elevator) aircraft.elevator.rotation.x = -elevatorAngle;
            
            const rudderAngle = controlInput.yaw * this.maxRudderDeflection;
            if (aircraft.rudder) aircraft.rudder.rotation.y = rudderAngle;
            
            const speed = this.bridge.getVelocity();
            const angVel = this.bridge.getAngularVelocity();
            
            const forward = new CANNON.Vec3(0, 0, -1);
            body.vectorToWorldFrame(forward, forward);
            forward.normalize();
            
            const up = new CANNON.Vec3(0, 1, 0);
            body.vectorToWorldFrame(up, up);
            up.normalize();
            
            const right = new CANNON.Vec3(1, 0, 0);
            body.vectorToWorldFrame(right, right);
            right.normalize();
            
            const velocity = body.velocity.clone();
            velocity.normalize();
            
            // Alpha = angle between velocity and forward (aircraft nose)
            let alpha = 0;
            let beta = 0;
            if (speed > 1) {
                alpha = Math.asin(Math.max(-1, Math.min(1, -velocity.dot(up))));
                beta = Math.asin(Math.max(-1, Math.min(1, velocity.dot(right))));
            }
            
            const q = 0.5 * AERODYNAMICS.rho * speed * speed;
            
            // Control inputs are already -1 to 1
            const elevator = controlInput.pitch * this.maxElevatorDeflection;
            const aileron = controlInput.roll * this.maxAileronDeflection;
            const rudder = controlInput.yaw * this.maxRudderDeflection;
            
            const force = new CANNON.Vec3(0, 0, 0);
            const torque = new CANNON.Vec3(0, 0, 0);
            
            // Thrust - along forward vector
            if (throttle > 0 && speed < 80) {
                const thrustMag = AERODYNAMICS.thrust(throttle, this.maxThrust);
                const thrustForce = forward.clone();
                thrustForce.scale(thrustMag, thrustForce);
                force.vadd(thrustForce, force);
            }
            
            // Lift - perpendicular to velocity, in aircraft up direction
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
            
            // Drag - opposite to velocity
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
            
            // Control torques - direct input response (very high power for testing)
            const controlPower = 50000;
            torque.x += controlPower * controlInput.pitch;
            torque.z += controlPower * controlInput.roll;
            torque.y += controlPower * controlInput.yaw;
            
            // Bank turn
            const roll = aircraft.rotation.z;
            const bankForce = Math.sin(roll) * speed * 50;
            const bankVec = right.clone();
            bankVec.scale(bankForce, bankVec);
            force.vadd(bankVec, force);
            
            // Adverse yaw
            if (Math.abs(angVel.roll) > 0.01) {
                torque.y -= angVel.roll * 100;
            }
            
            // Gravity (cannon-es world applies it, but ensure it's there)
            force.y -= this.mass * 9.81;
            
            body.applyForce(force);
            body.applyTorque(torque);
            
            // Landing handling
            const altitude = body.position.y;
            const terrainHeight = typeof getTerrainHeight === 'function' 
                ? getTerrainHeight(body.position.x, body.position.z) 
                : 0;
            
            if (hasFloats) {
                const waterLevel = 2;
                const floatBottom = altitude - 0.85;
                
                if (floatBottom <= waterLevel) {
                    const submerged = Math.min(1, (waterLevel - floatBottom) / 2);
                    const buoyancy = submerged * this.mass * 9.81 * 2;
                    body.applyForce(new CANNON.Vec3(0, buoyancy, 0));
                    
                    body.velocity.scale(1 - 2.0 * delta, body.velocity);
                    body.angularVelocity.scale(1 - 3.0 * delta, body.angularVelocity);
                    
                    if (speed < 10) {
                        const rollCorrection = -aircraft.rotation.z * 0.8 * delta;
                        const pitchCorrection = -aircraft.rotation.x * 0.5 * delta;
                        body.angularVelocity.x += pitchCorrection;
                        body.angularVelocity.z += rollCorrection;
                    }
                }
            }
            
            if (altitude <= terrainHeight) {
                const penetration = terrainHeight - body.position.y;
                const normalForce = penetration * 50000;
                body.applyForce(new CANNON.Vec3(0, normalForce, 0));
                
                body.velocity.scale(1 - 5.0 * delta, body.velocity);
                body.angularVelocity.scale(1 - 5.0 * delta, body.angularVelocity);
            }
            
            // Step
            this.bridge.update(delta);
            
            // Sync back
            this.bridge.syncToThree(aircraft);
            
            aircraft.ias = speed;
            aircraft.altitude = body.position.y;
            aircraft.groundSpeed = speed;
        }
    }
    
    window.RealisticPhysics = RealisticPhysics;
    console.log('RealisticPhysics loaded');
})();