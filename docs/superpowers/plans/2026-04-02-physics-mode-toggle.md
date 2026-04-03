# Physics Mode Toggle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add arcade/realistic physics toggle with strategy pattern, defaulting to arcade mode.

**Architecture:** Extract current physics into ArcadePhysics class, create RealisticPhysics class with realistic aerodynamics, Aircraft delegates to active physics strategy. Config stores mode preference, UI provides toggle.

**Tech Stack:** Three.js, vanilla JavaScript, Jest for testing

---

## File Structure

**Create:**
- `js/physics/arcade-physics.js` - Current physics extracted
- `js/physics/realistic-physics.js` - New realistic model
- `tests/physics.test.js` - Physics mode tests

**Modify:**
- `js/aircraft.js` - Add physics mode switching
- `js/config.js` - Add physics mode setting
- `index.html` - Add physics toggle to settings
- `css/style.css` - Style physics toggle section

---

### Task 1: Create ArcadePhysics Class

**Files:**
- Create: `js/physics/arcade-physics.js`

- [ ] **Step 1: Create arcade physics class with current implementation**

```javascript
// js/physics/arcade-physics.js
class ArcadePhysics {
    constructor(aircraft) {
        this.aircraft = aircraft;
        
        // Rotation rates (from current Aircraft)
        this.rollRate = degreesToRadians(45);
        this.pitchRate = degreesToRadians(30);
        this.yawRate = degreesToRadians(20);
    }
    
    update(delta) {
        const aircraft = this.aircraft;
        
        // Animate propeller
        if (aircraft.propeller) {
            aircraft.propeller.rotation.z += aircraft.throttle * 25 * delta;
        }
        
        // Animate control surfaces
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
        
        // Physics calculations
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
```

- [ ] **Step 2: Commit arcade physics extraction**

```bash
git add js/physics/arcade-physics.js
git commit -m "feat: extract arcade physics into separate class"
```

---

### Task 2: Create RealisticPhysics Class

**Files:**
- Create: `js/physics/realistic-physics.js`

- [ ] **Step 1: Create realistic physics class with aerodynamic model**

```javascript
// js/physics/realistic-physics.js
class RealisticPhysics {
    constructor(aircraft) {
        this.aircraft = aircraft;
        
        // Moments of inertia (kg·m²)
        this.I_pitch = 1200;
        this.I_roll = 800;
        this.I_yaw = 1800;
        
        // Angular velocities (rad/s)
        this.angularVelocity = { pitch: 0, roll: 0, yaw: 0 };
        
        // Aerodynamic coefficients
        this.Cl_alpha = 5.7;  // Lift curve slope (per radian)
        this.Cl_max = 1.5;
        this.Cd0 = 0.025;
        this.e = 0.8;  // Oswald efficiency
        this.aspectRatio = aircraft.wingspan * aircraft.wingspan / aircraft.wingArea;
        
        // Control effectiveness
        this.Cm_elevator = -1.2;
        this.Cl_aileron = 0.15;
        this.Cn_rudder = 0.1;
        
        // Control limits (degrees)
        this.maxElevatorDeflection = 25;
        this.maxAileronDeflection = 20;
        this.maxRudderDeflection = 25;
        
        // Damping coefficients
        this.pitchDamping = 0.5;
        this.rollDamping = 0.8;
        this.yawDamping = 0.3;
        
        // Propeller effects
        this.propRadius = 1.0;  // meters
    }
    
    update(delta) {
        const aircraft = this.aircraft;
        
        // Animate propeller
        if (aircraft.propeller) {
            aircraft.propeller.rotation.z += aircraft.throttle * 25 * delta;
        }
        
        // Animate control surfaces
        const aileronAngle = aircraft.controlInput.roll * this.maxAileronDeflection * Math.PI / 180;
        if (aircraft.aileronL) aircraft.aileronL.rotation.x = -aileronAngle;
        if (aircraft.aileronR) aircraft.aileronR.rotation.x = aileronAngle;
        
        const elevatorAngle = aircraft.controlInput.pitch * this.maxElevatorDeflection * Math.PI / 180;
        if (aircraft.elevator) aircraft.elevator.rotation.x = -elevatorAngle;
        
        const rudderAngle = aircraft.controlInput.yaw * this.maxRudderDeflection * Math.PI / 180;
        if (aircraft.rudder) aircraft.rudder.rotation.y = rudderAngle;
        
        // Calculate forces
        const forces = this.calculateForces(delta);
        
        // Update velocity
        const acceleration = forces.total.divideScalar(aircraft.mass);
        aircraft.velocity.add(acceleration.multiplyScalar(delta));
        
        // Limit speed
        const speed = aircraft.velocity.length();
        if (speed > aircraft.maxSpeed) {
            aircraft.velocity.multiplyScalar(aircraft.maxSpeed / speed);
        }
        
        // Update position
        aircraft.position.add(aircraft.velocity.clone().multiplyScalar(delta));
        
        // Ground collision
        if (aircraft.position.y < 0) {
            aircraft.position.y = 0;
            if (aircraft.velocity.y < 0) aircraft.velocity.y = 0;
        }
        
        // Update rotation
        this.updateRotation(delta);
        
        // Update gauges
        aircraft.altitude = aircraft.position.y;
        aircraft.groundSpeed = speed;
        aircraft.ias = speed * 1.944;
    }
    
    calculateForces(delta) {
        const aircraft = this.aircraft;
        const speed = aircraft.velocity.length();
        
        // Get aircraft orientation vectors
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyEuler(aircraft.rotation);
        
        const up = new THREE.Vector3(0, 1, 0);
        up.applyEuler(aircraft.rotation);
        
        const right = new THREE.Vector3(1, 0, 0);
        right.applyEuler(aircraft.rotation);
        
        // Dynamic pressure
        const q = 0.5 * aircraft.airDensity * speed * speed;
        
        // Angle of attack
        let aoa = 0;
        if (speed > 1) {
            const velocityDir = aircraft.velocity.clone().normalize();
            aoa = Math.asin(velocityDir.dot(up));
        }
        
        // Lift coefficient with stall
        let Cl;
        const stallAngle = degreesToRadians(15);
        if (Math.abs(aoa) < stallAngle) {
            Cl = this.Cl_alpha * aoa;
        } else {
            // Post-stall: reduced lift
            const sign = Math.sign(aoa);
            Cl = sign * this.Cl_max * (1 - (Math.abs(aoa) - stallAngle) / stallAngle * 0.5);
        }
        Cl = clamp(Cl, -this.Cl_max, this.Cl_max);
        
        // Drag coefficient
        const Cd = this.Cd0 + Cl * Cl / (Math.PI * this.e * this.aspectRatio);
        
        // Lift (perpendicular to velocity, in plane of aircraft up)
        const velocityDir = speed > 0.1 ? aircraft.velocity.clone().normalize() : forward.clone();
        let liftDir = new THREE.Vector3().crossVectors(right, velocityDir).normalize();
        if (liftDir.length() < 0.1) liftDir = up.clone();
        const lift = liftDir.multiplyScalar(q * aircraft.wingArea * Cl);
        
        // Drag (opposite to velocity)
        const drag = velocityDir.clone().multiplyScalar(-q * aircraft.wingArea * Cd);
        
        // Thrust
        const thrustMagnitude = aircraft.throttle * aircraft.maxThrust;
        const thrust = forward.clone().multiplyScalar(thrustMagnitude);
        
        // Weight
        const weight = new THREE.Vector3(0, -aircraft.mass * 9.81, 0);
        
        // Ground effect
        if (aircraft.position.y < 20 && aircraft.position.y > 0) {
            const effect = 1 - (aircraft.position.y / 20);
            lift.multiplyScalar(1 + effect * 0.5);
            drag.multiplyScalar(1 - effect * 0.3);
        }
        
        const total = new THREE.Vector3().add(thrust).add(lift).add(drag).add(weight);
        
        return { lift, drag, thrust, weight, total };
    }
    
    updateRotation(delta) {
        const aircraft = this.aircraft;
        const speed = aircraft.velocity.length();
        const q = 0.5 * aircraft.airDensity * speed * speed;
        
        // Control deflections
        const elevatorDeflection = aircraft.controlInput.pitch * this.maxElevatorDeflection * Math.PI / 180;
        const aileronDeflection = aircraft.controlInput.roll * this.maxAileronDeflection * Math.PI / 180;
        const rudderDeflection = aircraft.controlInput.yaw * this.maxRudderDeflection * Math.PI / 180;
        
        // Moments
        const M_pitch = q * aircraft.wingArea * 1.5 * this.Cm_elevator * elevatorDeflection;
        const M_roll = q * aircraft.wingArea * 11 * this.Cl_aileron * aileronDeflection;
        
        // Adverse yaw from ailerons
        const adverseYaw = -aileronDeflection * 0.1 * q * aircraft.wingArea * 11;
        const M_yaw = q * aircraft.wingArea * 11 * this.Cn_rudder * rudderDeflection + adverseYaw;
        
        // Propeller torque (rolling moment)
        const propTorque = aircraft.throttle * 0.05 * aircraft.maxThrust;
        M_roll += propTorque;
        
        // Angular accelerations
        const alpha_pitch = M_pitch / this.I_pitch;
        const alpha_roll = M_roll / this.I_roll;
        const alpha_yaw = M_yaw / this.I_yaw;
        
        // Update angular velocities
        this.angularVelocity.pitch += alpha_pitch * delta;
        this.angularVelocity.roll += alpha_roll * delta;
        this.angularVelocity.yaw += alpha_yaw * delta;
        
        // Apply damping
        this.angularVelocity.pitch *= (1 - this.pitchDamping * delta);
        this.angularVelocity.roll *= (1 - this.rollDamping * delta);
        this.angularVelocity.yaw *= (1 - this.yawDamping * delta);
        
        // Update rotation
        aircraft.rotation.x += this.angularVelocity.pitch * delta;
        aircraft.rotation.z += this.angularVelocity.roll * delta;
        aircraft.rotation.y += this.angularVelocity.yaw * delta;
        
        // Clamp rotations
        aircraft.rotation.x = clamp(aircraft.rotation.x, degreesToRadians(-45), degreesToRadians(45));
        aircraft.rotation.z = clamp(aircraft.rotation.z, degreesToRadians(-60), degreesToRadians(60));
    }
}

window.RealisticPhysics = RealisticPhysics;
```

- [ ] **Step 2: Commit realistic physics class**

```bash
git add js/physics/realistic-physics.js
git commit -m "feat: add realistic physics with aerodynamic model"
```

---

### Task 3: Add Physics Script Tags to HTML

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Add physics script tags before aircraft.js**

In `index.html`, add after line 461 (`<script src="js/controls.js"></script>`):

```html
    <!-- Physics classes (must load before aircraft.js) -->
    <script src="js/physics/arcade-physics.js"></script>
    <script src="js/physics/realistic-physics.js"></script>
```

- [ ] **Step 2: Commit HTML changes**

```bash
git add index.html
git commit -m "feat: add physics class script tags"
```

---

### Task 4: Modify Aircraft Class

**Files:**
- Modify: `js/aircraft.js`

- [ ] **Step 1: Add physics mode property and initialization**

In `js/aircraft.js`, add after line 24 (`this.abbyMode = false;`):

```javascript
this.physicsMode = 'arcade';  // 'arcade' or 'realistic'
this.physics = null;  // Will be initialized in initPhysics()
```

- [ ] **Step 2: Add physics initialization method**

Add new method after `setColors()` method (around line 868):

```javascript
initPhysics() {
    if (this.physicsMode === 'arcade') {
        this.physics = new ArcadePhysics(this);
    } else {
        this.physics = new RealisticPhysics(this);
    }
}

setPhysicsMode(mode) {
    if (this.physicsMode === mode) return;
    
    this.physicsMode = mode;
    this.initPhysics();
    
    // Reset angular velocity for realistic mode
    if (mode === 'realistic' && this.physics.angularVelocity) {
        this.physics.angularVelocity = { pitch: 0, roll: 0, yaw: 0 };
    }
}
```

- [ ] **Step 3: Replace update() method physics with delegation**

Replace the entire `update(delta)` method (lines 683-794) with:

```javascript
update(delta) {
    if (this._debugFrame === undefined) this._debugFrame = 0;
    this._debugFrame++;
    if (this._debugFrame <= 3) {
        console.log(`Frame ${this._debugFrame}: vel=(${this.velocity.x.toFixed(1)}, ${this.velocity.y.toFixed(1)}, ${this.velocity.z.toFixed(1)}), rotY=${this.rotation.y.toFixed(2)}`);
    }
    
    // Initialize physics if not set
    if (!this.physics) {
        this.initPhysics();
    }
    
    // Delegate to physics strategy
    this.physics.update(delta);
    
    // Update mesh
    this.mesh.position.copy(this.position);
    this.mesh.rotation.copy(this.rotation);
    
    // Apply auto-brake when on ground with low throttle
    this.applyAutoBrake(delta);
}
```

- [ ] **Step 4: Remove updateRotation method**

Delete the `updateRotation(delta, speed)` method (lines 796-818) - it's now in ArcadePhysics.

- [ ] **Step 5: Update reset() method**

In the `reset()` method (around line 820), add after `this.throttle = 0.5;`:

```javascript
// Re-initialize physics
this.initPhysics();
```

- [ ] **Step 6: Add wingspan property**

In constructor, add after `this.wingArea = 16;` (line 5):

```javascript
this.wingspan = 11;  // meters
```

- [ ] **Step 7: Commit aircraft modifications**

```bash
git add js/aircraft.js
git commit -m "feat: add physics mode switching to Aircraft class"
```

---

### Task 5: Add Config Setting

**Files:**
- Modify: `js/config.js`

- [ ] **Step 1: Add physics mode to config**

Add at the end of `js/config.js`:

```javascript
// Physics mode configuration
let physicsMode = localStorage.getItem('physicsMode') || 'arcade';

function getPhysicsMode() {
    return physicsMode;
}

function setPhysicsMode(mode) {
    physicsMode = mode;
    localStorage.setItem('physicsMode', mode);
    
    // Update aircraft if exists
    if (window.aircraft) {
        window.aircraft.setPhysicsMode(mode);
    }
    
    // Update controls hint
    updateControlsHint(mode);
}

function updateControlsHint(mode) {
    const hint = document.getElementById('controls-hint');
    if (!hint) return;
    
    if (mode === 'realistic') {
        hint.textContent = 'WASD: Pitch/Roll | QE: Rudder (coordinate turns) | Shift/Ctrl: Throttle | Space: Brake | R: Reset | C: Config';
    } else {
        hint.textContent = 'WASD: Pitch/Roll | QE: Yaw | Shift/Ctrl: Throttle | Space: Brake | R: Reset | C: Config';
    }
}

// Export for global access
window.getPhysicsMode = getPhysicsMode;
window.setPhysicsMode = setPhysicsMode;
window.updateControlsHint = updateControlsHint;
```

- [ ] **Step 2: Commit config changes**

```bash
git add js/config.js
git commit -m "feat: add physics mode config setting"
```

---

### Task 6: Add UI Toggle

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Add physics toggle section to settings modal**

In `index.html`, find the Abby Mode section (around line 272) and add this BEFORE it:

```html
<div class="settings-section" id="physics-section">
    <div class="settings-section-header">
        <h3 class="settings-section-title">Flight Physics</h3>
    </div>
    
    <div class="setting-row">
        <label for="physics-mode-toggle">Realistic Physics</label>
        <label class="settings-toggle">
            <input type="checkbox" id="physics-mode-toggle">
            <span class="toggle-slider"></span>
        </label>
    </div>
</div>
```

- [ ] **Step 2: Add physics toggle event handler**

In the main script section (around line 1063, after color picker handlers), add:

```javascript
// Physics mode toggle
const physicsModeToggle = document.getElementById('physics-mode-toggle');
if (physicsModeToggle) {
    // Initialize from saved setting
    const savedMode = localStorage.getItem('physicsMode') || 'arcade';
    physicsModeToggle.checked = (savedMode === 'realistic');
    
    physicsModeToggle.addEventListener('change', function() {
        const mode = this.checked ? 'realistic' : 'arcade';
        window.setPhysicsMode(mode);
    });
}
```

- [ ] **Step 3: Initialize physics mode on startup**

In the game initialization section (where aircraft is created), add after aircraft creation:

```javascript
// Apply saved physics mode
const savedPhysicsMode = localStorage.getItem('physicsMode') || 'arcade';
if (window.aircraft) {
    window.aircraft.setPhysicsMode(savedPhysicsMode);
}
window.updateControlsHint(savedPhysicsMode);
```

- [ ] **Step 4: Commit UI changes**

```bash
git add index.html
git commit -m "feat: add physics mode toggle to settings UI"
```

---

### Task 7: Write Tests

**Files:**
- Create: `tests/physics.test.js`

- [ ] **Step 1: Write physics mode tests**

```javascript
// tests/physics.test.js
describe('Physics Mode Toggle', () => {
    let aircraft;
    
    beforeEach(() => {
        // Mock THREE.js
        global.THREE = {
            Vector3: class Vector3 {
                constructor(x = 0, y = 0, z = 0) {
                    this.x = x;
                    this.y = y;
                    this.z = z;
                }
                set(x, y, z) {
                    this.x = x;
                    this.y = y;
                    this.z = z;
                }
                copy(v) {
                    this.x = v.x;
                    this.y = v.y;
                    this.z = v.z;
                    return this;
                }
                clone() {
                    return new THREE.Vector3(this.x, this.y, this.z);
                }
                normalize() {
                    const len = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
                    if (len > 0) {
                        this.x /= len;
                        this.y /= len;
                        this.z /= len;
                    }
                    return this;
                }
                multiplyScalar(s) {
                    this.x *= s;
                    this.y *= s;
                    this.z *= s;
                    return this;
                }
                add(v) {
                    this.x += v.x;
                    this.y += v.y;
                    this.z += v.z;
                    return this;
                }
                length() {
                    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
                }
                divideScalar(s) {
                    this.x /= s;
                    this.y /= s;
                    this.z /= s;
                    return this;
                }
            },
            Euler: class Euler {
                constructor(x = 0, y = 0, z = 0, order = 'YXZ') {
                    this.x = x;
                    this.y = y;
                    this.z = z;
                }
                copy(e) {
                    this.x = e.x;
                    this.y = e.y;
                    this.z = e.z;
                    return this;
                }
            },
            Group: class Group {
                constructor() {
                    this.position = new THREE.Vector3();
                    this.rotation = new THREE.Euler();
                }
            }
        };
        
        // Mock utility functions
        global.degreesToRadians = (deg) => deg * Math.PI / 180;
        global.radiansToDegrees = (rad) => rad * 180 / Math.PI;
        global.clamp = (val, min, max) => Math.max(min, Math.min(max, val));
        global.lerp = (a, b, t) => a + (b - a) * t;
        
        // Create aircraft
        aircraft = new Aircraft({ main: '#ffffff', highlight: '#0066cc' });
    });
    
    test('aircraft starts in arcade mode by default', () => {
        expect(aircraft.physicsMode).toBe('arcade');
    });
    
    test('switching to realistic mode changes physics class', () => {
        aircraft.setPhysicsMode('realistic');
        expect(aircraft.physicsMode).toBe('realistic');
        expect(aircraft.physics).toBeInstanceOf(window.RealisticPhysics);
    });
    
    test('switching back to arcade mode works', () => {
        aircraft.setPhysicsMode('realistic');
        aircraft.setPhysicsMode('arcade');
        expect(aircraft.physicsMode).toBe('arcade');
        expect(aircraft.physics).toBeInstanceOf(window.ArcadePhysics);
    });
    
    test('physics update does not crash in arcade mode', () => {
        const delta = 1/60;
        expect(() => aircraft.update(delta)).not.toThrow();
    });
    
    test('physics update does not crash in realistic mode', () => {
        aircraft.setPhysicsMode('realistic');
        const delta = 1/60;
        expect(() => aircraft.update(delta)).not.toThrow();
    });
    
    test('switching modes mid-flight maintains position', () => {
        aircraft.position.set(100, 500, 200);
        aircraft.velocity.set(10, 0, 50);
        
        aircraft.setPhysicsMode('realistic');
        
        expect(aircraft.position.x).toBe(100);
        expect(aircraft.position.y).toBe(500);
        expect(aircraft.position.z).toBe(200);
        expect(aircraft.velocity.x).toBe(10);
        expect(aircraft.velocity.z).toBe(50);
    });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: Tests fail (ArcadePhysics and RealisticPhysics not loaded in test environment)

- [ ] **Step 3: Add imports to test file**

Add at the top of `tests/physics.test.js`:

```javascript
// Mock window object
global.window = {};

// Load physics classes
require('../js/physics/arcade-physics.js');
require('../js/physics/realistic-physics.js');
require('../js/aircraft.js');
```

- [ ] **Step 4: Run tests again**

Run: `npm test`
Expected: Tests pass

- [ ] **Step 5: Commit tests**

```bash
git add tests/physics.test.js
git commit -m "test: add physics mode toggle tests"
```

---

### Task 8: Integration Testing

**Files:**
- None (manual testing)

- [ ] **Step 1: Start local server**

Run: `npx serve`

- [ ] **Step 2: Open browser and test arcade mode**

1. Open http://localhost:3000
2. Start game
3. Verify controls feel like current implementation
4. Test takeoff, flight, landing
5. Verify no regression

- [ ] **Step 3: Test realistic mode**

1. Open settings (C key or settings button)
2. Toggle "Realistic Physics" ON
3. Verify immediate switch (no reset)
4. Test controls:
   - Sluggish at low speed
   - Adverse yaw during rolls
   - Stall at high angle of attack
   - Requires rudder coordination

- [ ] **Step 4: Test mode switching**

1. Switch back to arcade mode
2. Verify immediate switch
3. Switch to realistic mode again
4. Verify both modes work

- [ ] **Step 5: Test persistence**

1. Set realistic mode
2. Refresh page
3. Verify mode persists (still realistic)
4. Set arcade mode
5. Refresh page
6. Verify mode persists (arcade)

- [ ] **Step 6: Test on mobile**

1. Open on mobile device
2. Test touch controls in both modes
3. Verify no issues

---

### Task 9: Final Commit and Documentation

**Files:**
- Modify: `AGENTS.md`

- [ ] **Step 1: Update AGENTS.md with physics mode info**

Add to "Current Features" section:

```markdown
- **Physics modes**: Arcade (default) and realistic flight physics with toggle in settings
```

Add to "Key Systems" section:

```markdown
### Physics Modes

**Arcade Mode (default):**
- Direct rotation rates for instant response
- Simplified lift/drag model
- Forgiving, no coordination required

**Realistic Mode:**
- Full aerodynamic model with lift/drag curves
- Control surface deflections create moments
- Adverse yaw requires rudder coordination
- Stall behavior at high angle of attack
- Propeller effects (torque, P-factor)
- Control effectiveness varies with speed²
```

- [ ] **Step 2: Commit documentation**

```bash
git add AGENTS.md
git commit -m "docs: document physics mode feature"
```

- [ ] **Step 3: Create final commit**

```bash
git add -A
git commit -m "feat: complete physics mode toggle implementation"
```

---

## Success Criteria

- [ ] Arcade mode unchanged from current implementation
- [ ] Realistic mode provides authentic flight physics
- [ ] Toggle works immediately without reset
- [ ] Setting persists across sessions
- [ ] Both modes work on desktop and mobile
- [ ] All tests pass
- [ ] No performance impact
