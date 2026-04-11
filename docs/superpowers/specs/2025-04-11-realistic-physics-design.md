# Realistic Physics System Design

Date: 2025-04-11
Status: Draft

## Overview

Rewrite the advanced physics mode from custom angular momentum system to a rigid body physics approach using cannon-es, with custom aerodynamics forces layered on top. This provides authentic flight feel where velocity naturally follows nose heading when banked, with snappy but physics-based response.

## Goals

1. Velocity follows nose direction when turning (bank → turn)
2. Snappy but realistic control response
3. Proper stall behavior at low speed/high AoA
4. Support both water landings (floats) and land landings
5. Graceful degradation: physics errors don't break flight

## Architecture

```
index.html (game loop)
    │
    ├── Three.js scene + aircraft mesh
    │
    └── PhysicsBridge ──► cannon-es World
                              │
                    ┌─────────┴─────────┐
                    │                   │
              RealisticPhysics      ArcadePhysics
              (cannon-es based)     (original system)
```

### File Structure

```
js/physics/
├── physics-bridge.js      # Bridge between Three.js and cannon-es
├── realistic-physics.js  # Cannon-es based physics (REWRITE)
├── arcade-physics.js     # Keep original for arcade mode
└── aerodynamics.js      # Shared lift/drag calculations
```

## Core Components

### 1. PhysicsBridge

```javascript
class PhysicsBridge {
    constructor(aircraft) {
        this.world = new CANNON.World();
        this.world.gravity.set(0, -9.81, 0);
        this.world.broadphase = new CANNON.NaiveBroadphase();

        this.body = new CANNON.Body({
            mass: 1100,
            shape: new CANNON.Box(new CANNON.Vec3(2, 1, 5)), // halfExtents
            linearDamping: 0.01,
            angularDamping: 0.1
        });
        this.world.addBody(this.body);
    }

    syncFromThree(aircraft) {
        // Copy position/rotation from Three.js mesh to cannon body
    }

    syncToThree(aircraft) {
        // Copy position/rotation from cannon body to Three.js mesh
    }

    update(delta, controlInput, throttle) {
        // 1. Apply control forces
        // 2. Apply aerodynamic forces  
        // 3. world.step()
        // 4. syncToThree()
    }
}
```

### 2. RealisticPhysics (Rewrite)

```javascript
class RealisticPhysics {
    constructor(aircraft) {
        this.aircraft = aircraft;
        this.bridge = new PhysicsBridge(aircraft);

        // Aircraft properties
        this.mass = 1100;
        this.wingArea = 16;
        this.wingspan = 11;

        // Control limits
        this.maxElevatorDeflection = 25 * Math.PI / 180;
        this.maxAileronDeflection = 20 * Math.PI / 180;
        this.maxRudderDeflection = 25 * Math.PI / 180;
    }

    update(delta) {
        const { controlInput, throttle } = this.aircraft;
        const body = this.bridge.body;

        // 1. Get velocity in body frame
        const velocity = new CANNON.Vec3();
        body.vectorToWorldFrame(new CANNON.Vec3(0, 0, 0), velocity);
        const speed = velocity.length();

        // 2. Calculate aerodynamic angles
        const forward = new CANNON.Vec3(0, 0, -1);
        body.vectorToWorldFrame(forward, forward);
        const velocityDir = velocity.clone();
        velocityDir.normalize();

        const alpha = this.calculateAngleOfAttack(forward, velocityDir);
        const beta = this.calculateSideslipAngle(forward, velocityDir, velocity);

        // 3. Control surface deflections
        const elevator = controlInput.pitch * this.maxElevatorDeflection;
        const aileron = controlInput.roll * this.maxAileronDeflection;
        const rudder = controlInput.yaw * this.maxRudderDeflection;

        // 4. Calculate forces and torques
        const forces = new CANNON.Vec3();
        const torque = new CANNON.Vec3();

        this.applyThrust(torque, throttle, delta);
        this.applyLift(forces, alpha, speed);
        this.applyDrag(forces, speed, alpha, beta);
        this.applyControlForces(torque, elevator, aileron, rudder, speed);
        this.applyBankTurn(forces, body, aileron, speed);

        // 5. Apply to cannon body
        body.applyForce(forces);
        body.applyTorque(torque);

        // 6. Handle landing (water or land)
        this.handleLanding(body, delta);
    }

    calculateAngleOfAttack(forward, velocityDir) {
        const up = new CANNON.Vec3(0, 1, 0);
        body.vectorToWorldFrame(up, up);
        const pitchComponent = velocityDir.dot(up);
        return Math.asin(clamp(pitchComponent, -1, 1));
    }

    calculateSideslipAngle(forward, velocityDir, velocity) {
        const right = new CANNON.Vec3(1, 0, 0);
        body.vectorToWorldFrame(right, right);
        const sideComponent = velocityDir.dot(right);
        return Math.asin(clamp(sideComponent, -1, 1));
    }

    applyThrust(torque, throttle, delta) {
        const maxThrust = 3500;
        const thrustForce = throttle * maxThrust;
        const forward = new CANNON.Vec3(0, 0, -1);
        this.bridge.body.vectorToWorldFrame(forward, forward);
        forward.scale(thrustForce, forward);
        this.bridge.body.applyForce(forward);

        // Propeller torque (keeps aircraft turning opposite)
        const torqueAmount = throttle * 50;
        torque.z += torqueAmount;
    }

    applyLift(forces, alpha, speed) {
        const rho = 1.225; // air density
        const CL = this.getLiftCoefficient(alpha);
        const liftMagnitude = 0.5 * rho * speed * speed * this.wingArea * CL;

        const lift = new CANNON.Vec3(0, 1, 0);
        this.bridge.body.vectorToWorldFrame(lift, lift);
        lift.scale(liftMagnitude, lift);
        forces.vadd(lift, forces);
    }

    getLiftCoefficient(alpha) {
        const stallAngle = 15 * Math.PI / 180;
        const CLmax = 1.6;
        const Cl_alpha = 6.0;

        if (Math.abs(alpha) < stallAngle) {
            return Cl_alpha * alpha;
        } else {
            const sign = Math.sign(alpha);
            return sign * CLmax * (1 - (Math.abs(alpha) - stallAngle) / stallAngle * 0.5);
        }
    }

    applyDrag(forces, speed, alpha, beta) {
        const rho = 1.225;
        const CD0 = 0.022; // parasitic drag
        const AR = this.aircraft.wingspan ** 2 / this.wingArea;
        const e = 0.8;
        const k = 1 / (Math.PI * AR * e); // induced drag factor

        const CL = this.getLiftCoefficient(alpha);
        const CD = CD0 + k * CL * CL;

        const dragMagnitude = 0.5 * rho * speed * speed * this.wingArea * CD;

        const velocity = this.bridge.body.velocity.clone();
        velocity.normalize();
        velocity.scale(-dragMagnitude, velocity);
        forces.vadd(velocity, forces);
    }

    applyControlForces(torque, elevator, aileron, rudder, speed) {
        const q = 0.5 * 1.225 * speed * speed;

        // Pitch from elevator
        const Cm = 2.5;
        const M_pitch = q * this.wingArea * 0.3 * Cm * elevator;
        torque.x += M_pitch;

        // Roll from ailerons
        const Cl = -0.25;
        const M_roll = q * this.wingArea * this.aircraft.wingspan * 0.5 * Cl * aileron;
        torque.z -= M_roll;

        // Yaw from rudder
        const Cn = 0.50;
        const M_yaw = q * this.wingArea * this.aircraft.wingspan * 0.5 * Cn * rudder;
        torque.y += M_yaw;
    }

    applyBankTurn(forces, body, aileron, speed) {
        // Key fix: bank angle creates horizontal force component
        const bankAngle = this.aircraft.rotation.z; // roll
        const bankForce = Math.sin(bankAngle) * speed * 50;

        const right = new CANNON.Vec3(1, 0, 0);
        body.vectorToWorldFrame(right, right);
        right.scale(bankForce, right);
        forces.vadd(right, forces);
    }

    handleLanding(body, delta) {
        // Check altitude
        const altitude = body.position.y;

        if (altitude < 5) { // Near water/ground
            const hasFloats = this.aircraft.hasFloats;

            if (hasFloats && altitude <= 0) {
                // Water landing
                this.handleWaterLanding(body, delta);
            } else if (!hasFloats && altitude <= this.getTerrainHeight()) {
                // Land landing
                this.handleLandLanding(body, delta);
            }
        }
    }

    handleWaterLanding(body, delta) {
        // Buoyancy when floats deployed
        const submerged = Math.min(1, -body.position.y / 2);
        const buoyancy = submerged * this.mass * 9.81 * 2;

        body.applyForce(new CANNON.Vec3(0, buoyancy, 0));

        // Water drag (high damping)
        body.velocity.scale(1 - 2.0 * delta, body.velocity);
        body.angularVelocity.scale(1 - 3.0 * delta, body.angularVelocity);
    }

    handleLandLanding(body, delta) {
        // Ground contact
        const terrainHeight = this.getTerrainHeight();
        const penetration = terrainHeight - body.position.y;

        if (penetration > 0) {
            // Push up
            const normalForce = penetration * 50000;
            body.applyForce(new CANNON.Vec3(0, normalForce, 0));

            // Ground friction
            body.velocity.scale(1 - 5.0 * delta, body.velocity);
            body.angularVelocity.scale(1 - 5.0 * delta, body.angularVelocity);
        }
    }

    getTerrainHeight() {
        // Delegate to existing terrain system
        return getTerrainHeight(this.aircraft.position.x, this.aircraft.position.z);
    }
}
```

### 3. ArcadePhysics (Original)

Keep existing `js/physics/arcade-physics.js` unchanged for arcade mode.

### 4. Aerodynamics (Shared)

Extract common lift/drag calculations that both modes can use:

```javascript
const AERODYNAMICS = {
    rho: 1.225, // sea level air density

    liftCoefficient(alpha, Cl_alpha = 6.0, CLmax = 1.6) {
        // Same calculation as above - used by both modes
    },

    dragCoefficient(CL, CD0 = 0.022, AR = 7.6, e = 0.8) {
        // CD = CD0 + k * CL²
    }
};
```

## Integration Points

### Aircraft class changes

```javascript
class Aircraft {
    initPhysics() {
        // Mode selection from config
        const mode = getPhysicsMode();
        
        if (mode === 'arcade') {
            this.physics = new ArcadePhysics(this);
        } else {
            this.physics = new RealisticPhysics(this);
        }
    }
}
```

### Game loop changes

Minimal - existing loop already calls `aircraft.update(delta)`.

## Landing Handling Details

| Scenario | Behavior |
|----------|----------|
| Water + floats | Buoyancy force, high drag, floats plane |
| Water + no floats | Crash (splash + break) |
| Land + wheels | Ground friction, roll stops naturally |
| Land + floats | Crash (wheels up, no absorption) |

## Error Handling

1. **Physics instability**: Clamp forces/torques to max values
2. **NaN position**: Reset to last known good position
3. **Out of bounds**: Teleport back with warning
4. **Speed cap**: Limit to maxSpeed (80 m/s)

## Testing Checklist

- [ ] Plane turns toward nose when banked (bank = turn)
- [ ] Velocity follows heading (not sliding sideways)
- [ ] Stall at low speed with high AoA
- [ ] Water landing with floats floats
- [ ] Land landing stops naturally
- [ ] Crash on water without floats
- [ ] Crash on land with floats
- [ ] Controls feel snappy but physics-based

## Dependencies

```json
{
  "cannon-es": "^0.20.0"
}
```

npm install cannon-es

## Implementation Order

1. Create `js/physics/physics-bridge.js`
2. Rewrite `js/physics/realistic-physics.js` with cannon-es
3. Extract `js/physics/aerodynamics.js`
4. Update aircraft.js to use new physics
5. Test each scenario in checklist
6. Tune coefficients for feel

## Notes

- Keep arcade physics as fallback - don't break existing flight
- Can tune "snappiness" via damping coefficients
- Floats state comes from aircraft.hasFloats property