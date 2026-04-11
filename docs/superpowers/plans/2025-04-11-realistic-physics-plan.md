# Realistic Physics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite advanced physics to use cannon-es rigid body physics with custom aerodynamics so velocity naturally follows nose direction when turning

**Architecture:** Use cannon-es for rigid body dynamics, layer custom aerodynamics (lift, drag, thrust, control forces) on top. Bank angle creates horizontal force component that redirects momentum toward heading.

**Tech Stack:** cannon-es (new dependency), Three.js (existing)

---

## File Structure

| File | Action |
|------|--------|
| `js/physics/physics-bridge.js` | Create - bridge between Three.js and cannon-es |
| `js/physics/realistic-physics.js` | Rewrite - replace custom angular momentum with cannon-es |
| `js/physics/aerodynamics.js` | Create - shared lift/drag calculations |
| `package.json` | Modify - add cannon-es dependency |
| `js/aircraft.js` | Modify - integrate new physics system |
| `tests/physics/physics.test.js` | Create - physics verification tests |

---

## Prerequisites

- [ ] Install cannon-es: `npm install cannon-es`

---

## Task 1: Create PhysicsBridge class

**Files:**
- Create: `js/physics/physics-bridge.js`

**Interface required:**

```javascript
class PhysicsBridge {
    constructor(aircraft)
    syncFromThree(aircraft)  // Copy Three.js position/quat to cannon body
    syncToThree(aircraft)   // Copy cannon body position/quat to Three.js
    getVelocity()          // Returns speed in m/s
    getAngularVelocity()   // Returns rad/s for each axis
}
```

- [ ] **Step 1: Write the failing test**

Write test that PhysicsBridge can be imported and instantiated

```javascript
import PhysicsBridge from './physics/physics-bridge.js';

describe('PhysicsBridge', () => {
    test('should export PhysicsBridge class', () => {
        expect(typeof PhysicsBridge).toBe('function');
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --testPathPattern=physics`
Expected: FAIL - file not found

- [ ] **Step 3: Implement PhysicsBridge**

```javascript
import * as CANNON from 'cannon-es';

export default class PhysicsBridge {
    constructor(aircraft) {
        this.aircraft = aircraft;
        
        this.world = new CANNON.World();
        this.world.gravity.set(0, -9.81, 0);
        this.world.broadphase = new CANNON.NaiveBroadphase();
        
        // Default material with some friction
        const material = new CANNON.Material('aircraft');
        const contactMaterial = new CANNON.ContactMaterial(material, material, {
            friction: 0.3,
            restitution: 0.1
        });
        this.world.addContactMaterial(contactMaterial);
        this.material = material;
        
        // Aircraft body - approximate box shape
        this.body = new CANNON.Body({
            mass: 1100,
            shape: new CANNON.Box(new CANNON.Vec3(2, 1, 5)),
            material: material,
            linearDamping: 0.01,
            angularDamping: 0.05,
            position: new CANNON.Vec3(aircraft.position.x, aircraft.position.y, aircraft.position.z)
        });
        this.body.quaternion.setFromEuler(
            aircraft.rotation.x,
            aircraft.rotation.y,
            aircraft.rotation.z,
            'YXZ'
        );
        
        this.world.addBody(this.body);
    }
    
    syncFromThree(aircraft) {
        this.body.position.set(aircraft.position.x, aircraft.position.y, aircraft.position.z);
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
        aircraft.position.set(this.body.position.x, this.body.position.y, this.body.position.z);
        aircraft.rotation.set(euler.x, euler.y, euler.z);
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
    
    update(delta, substeps = 3) {
        const dt = delta / substeps;
        for (let i = 0; i < substeps; i++) {
            this.world.step(dt);
        }
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

- [ ] **Step 5: Commit**

---

## Task 2: Create Aerodynamics module

**Files:**
- Create: `js/physics/aerodynamics.js`

**Interface:**

```javascript
export const AERODYNAMICS = {
    rho: 1.225,  // sea level air density
    
    liftCoefficient(alpha, {Cl_alpha, CLmax, stallAngle})
    dragCoefficient(CL, CD0, AR, e)
    thrust(throttle, maxThrust)
}
```

- [ ] **Step 1: Write tests for lift/drag calculations**

```javascript
import { AERODYNAMICS } from './physics/aerodynamics.js';

describe('Aerodynamics', () => {
    test('lift coefficient increases linearly below stall', () => {
        // At 5° alpha, should be roughly 0.52 * Cl_alpha
    });
    
    test('lift coefficient drops after stall', () => {
        // Above 15° stall angle, coefficient decreases
    });
    
    test('drag increases with lift squared', () => {
        // Induced drag = k * CL²
    });
});
```

- [ ] **Step 2: Implement AERODYNAMICS module**

```javascript
export const AERODYNAMICS = {
    rho: 1.225,
    
    liftCoefficient(alpha, options = {}) {
        const { Cl_alpha = 6.0, CLmax = 1.6, stallAngle = 15 * Math.PI / 180 } = options;
        const absAlpha = Math.abs(alpha);
        
        if (absAlpha < stallAngle) {
            return Cl_alpha * alpha;
        } else {
            const sign = Math.sign(alpha);
            const postStall = CLmax * (1 - (absAlpha - stallAngle) / stallAngle * 0.5);
            return sign * Math.max(0, postStall);
        }
    },
    
    dragCoefficient(CL, options = {}) {
        const { CD0 = 0.022, AR = 7.6, e = 0.8 } = options;
        const k = 1 / (Math.PI * AR * e);
        return CD0 + k * CL * CL;
    },
    
    thrust(throttle, maxThrust = 3500) {
        return throttle * maxThrust;
    },
    
    forceMagnitude(q, S, C) {
        return 0.5 * this.rho * q * q * S * C;
    }
};

// Utility for clamping
function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
}
```

- [ ] **Step 3: Run tests**

- [ ] **Step 4: Commit**

---

## Task 3: Rewrite RealisticPhysics

**Files:**
- Rewrite: `js/physics/realistic-physics.js`

- [ ] **Step 1: Backup existing file**

```bash
cp js/physics/realistic-physics.js js/physics/realistic-physics.js.bak
```

- [ ] **Step 2: Write tests for physics behavior**

```javascript
import RealisticPhysics from './physics/realistic-physics.js';

describe('RealisticPhysics', () => {
    let mockAircraft;
    
    beforeEach(() => {
        mockAircraft = {
            position: { x: 0, y: 2500, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            velocity: { x: 0, y: 0, z: -50 },  // moving forward
            throttle: 0.5,
            controlInput: { pitch: 0, roll: 0, yaw: 0 },
            hasFloats: false,
            wingspan: 11,
            wingArea: 16
        };
    });
    
    test('applies thrust force in direction of heading', () => {
        // Given throttle, thrust should accelerate aircraft
    });
    
    test('bank angle creates horizontal turn force', () => {
        // Roll left should create force turning nose left
    });
    
    test('stall occurs at low speed with high AoA', () => {
        // At slow speed + pitch up, lift drops
    });
});
```

- [ ] **Step 3: Implement RealisticPhysics with cannon-es**

```javascript
import * as CANNON from 'cannon-es';
import PhysicsBridge from './physics-bridge.js';
import { AERODYNAMICS } from './aerodynamics.js';

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

export default class RealisticPhysics {
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
        const { controlInput, throttle } = aircraft;
        
        // Get state
        const speed = this.bridge.getVelocity();
        const angVel = this.bridge.getAngularVelocity();
        
        // Body vectors
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
        
        // 5. Bank turn (KEY: horizontal force from bank angle)
        const roll = aircraft.rotation.z;
        const bankForce = Math.sin(roll) * speed * 50;
        const bankVec = right.clone();
        bankVec.scale(bankForce, bankVec);
        force.vadd(bankVec, force);
        
        // 6. Adverse yaw from roll
        if (Math.abs(angVel.roll) > 0.01) {
            torque.y -= angVel.roll * 100;
        }
        
        // Apply forces
        body.applyForce(force);
        body.applyTorque(torque);
        
        // === LANDING HANDLING ===
        const altitude = body.position.y;
        const terrainHeight = getTerrainHeight(body.position.x, body.position.z);
        
        if (altitude < 10) {
            if (aircraft.hasFloats && altitude <= terrainHeight) {
                // Water landing - buoyancy
                const submerged = Math.min(1, (terrainHeight - body.position.y) / 2);
                const buoyancy = submerged * this.mass * 9.81 * 2;
                body.applyForce(new CANNON.Vec3(0, buoyancy, 0));
                
                // Water drag
                body.velocity.scale(1 - 2.0 * delta, body.velocity);
                body.angularVelocity.scale(1 - 3.0 * delta, body.angularVelocity);
            } else if (!aircraft.hasFloats && altitude <= terrainHeight) {
                // Land landing
                const penetration = terrainHeight - body.position.y;
                const normalForce = penetration * 50000;
                body.applyForce(new CANNON.Vec3(0, normalForce, 0));
                
                // Ground friction
                body.velocity.scale(1 - 5.0 * delta, body.velocity);
                body.angularVelocity.scale(1 - 5.0 * delta, body.angularVelocity);
            }
        }
        
        // === PHYSICS STEP ===
        this.bridge.update(delta);
        
        // === SYNC BACK ===
        this.bridge.syncToThree(aircraft);
        
        // Update gauges
        aircraft.ias = speed;
        aircraft.altitude = body.position.y;
    }
}
```

- [ ] **Step 4: Run tests**

- [ ] **Step 5: Test in browser**

- [ ] **Step 6: Commit**

---

## Task 4: Update Aircraft integration

**Files:**
- Modify: `js/aircraft.js:929-947`

- [ ] **Step 1: Update aircraft.js**

The existing initPhysics() should work as-is since it selects RealisticPhysics by name. Verify imports work.

```javascript
// At top of aircraft.js, add:
import RealisticPhysics from './physics/realistic-physics.js';
```

- [ ] **Step 2: Test in browser**

- [ ] **Step 3: Commit**

---

## Task 5: Landing validation tests

**Files:**
- Modify: `tests/physics/physics.test.js`

- [ ] **Test: Water landing with floats floats**

Bank until speed = 0, altitude = 0, verify doesn't sink

- [ ] **Test: Water without floats crashes**

Same as above, but hasFloats = false, verify velocity goes to 0

- [ ] **Test: Land landing stops**

High descent rate, contact ground, verify stops

- [ ] **Commit**

---

## Task 6: Tuning

This is iterative - test and adjust coefficients:

| Parameter | Current | Should feel like |
|-----------|---------|----------------|
| roll → turn force | speed * 50 | Snappy but not instant |
| yawDamping | 15.0 | May need adjustment with cannon-es |
| pitchDamping | 10.0 | May need adjustment |
| bankForce multiplier | TBD | Tune for feel |

- [ ] Test bank-and-turn responsiveness
- [ ] Adjust bankForce multiplier
- [ ] Tune damping if oscillation occurs
- [ ] Final commit

---

## Execution Choice

**Plan complete and saved to `docs/superpowers/plans/2025-04-11-realistic-physics-plan.md`. Two execution options:**

1. **Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

2. **Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**