# Flight Simulator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-simulation HTML5 flight simulator using Three.js with realistic physics, tropical archipelago environment, and third-person orbit camera.

**Architecture:** Single-page HTML5 application using Three.js for 3D rendering. Custom flight physics model implementing real aerodynamic principles. Modular JavaScript structure with separate files for aircraft, camera, controls, and environment.

**Tech Stack:**
- Three.js (WebGL rendering)
- Vanilla JavaScript (no frameworks)
- HTML5/CSS3

---

## File Structure

```
MiniMax2.5/
├── index.html              # Main HTML entry point
├── css/
│   └── style.css          # HUD and UI styles
├── js/
│   ├── main.js            # Scene setup, game loop
│   ├── aircraft.js        # Aircraft class and physics
│   ├── camera.js         # Orbit camera controller
│   ├── controls.js        # Keyboard/mouse input
│   ├── environment.js    # Islands, ocean, sky
│   ├── clouds.js         # Cloud system
│   ├── wildlife.js       # Birds, balloons, animals
│   └── utils.js          # Helper functions
├── assets/
│   └── models/           # 3D model placeholders
└── docs/
    └── superpowers/
        ├── specs/        # Design documents
        └── plans/        # Implementation plans
```

---

## Phase 1: Core Setup

### Task 1: Project Scaffolding

**Files:**
- Create: `index.html`
- Create: `css/style.css`
- Create: `js/main.js`
- Create: `js/utils.js`

- [ ] **Step 1: Create project directory structure**

```bash
mkdir -p css js assets/models
```

- [ ] **Step 2: Create index.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Flight Simulator</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <div id="hud">
        <div id="speed">Speed: <span id="speed-value">0</span> kts</div>
        <div id="altitude">Altitude: <span id="altitude-value">0</span> ft</div>
        <div id="throttle">Throttle: <span id="throttle-value">0</span>%</div>
        <div id="controls-hint">WASD: Pitch/Roll | QE: Yaw | Shift/Ctrl: Throttle | Space: Brake</div>
    </div>
    <script type="importmap">
    {
        "imports": {
            "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
            "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/"
        }
    }
    </script>
    <script type="module" src="js/main.js"></script>
</body>
</html>
```

- [ ] **Step 3: Create css/style.css**

```css
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    overflow: hidden;
    background: #000;
    font-family: 'Courier New', monospace;
}

#hud {
    position: fixed;
    top: 20px;
    left: 20px;
    color: #0f0;
    font-size: 16px;
    text-shadow: 1px 1px 2px #000;
    pointer-events: none;
    z-index: 100;
}

#hud div {
    margin-bottom: 8px;
}

#controls-hint {
    margin-top: 20px;
    font-size: 12px;
    color: #888;
}
```

- [ ] **Step 4: Create js/utils.js**

```javascript
export function degreesToRadians(degrees) {
    return degrees * (Math.PI / 180);
}

export function radiansToDegrees(radians) {
    return radians * (180 / Math.PI);
}

export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

export function lerp(start, end, t) {
    return start + (end - start) * t;
}
```

- [ ] **Step 5: Create js/main.js skeleton**

```javascript
import * as THREE from 'three';

let scene, camera, renderer;
let aircraft;
let clock;

function init() {
    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.Fog(0x87CEEB, 1000, 50000);
    
    // Camera
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100000);
    camera.position.set(0, 10, -30);
    
    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const sunLight = new THREE.DirectionalLight(0xffffff, 1);
    sunLight.position.set(100, 200, 50);
    sunLight.castShadow = true;
    scene.add(sunLight);
    
    clock = new THREE.Clock();
    
    // Placeholder aircraft
    const geometry = new THREE.BoxGeometry(2, 0.5, 4);
    const material = new THREE.MeshStandardMaterial({ color: 0xcccccc });
    aircraft = new THREE.Mesh(geometry, material);
    aircraft.position.set(0, 2, 0);
    scene.add(aircraft);
    
    // Ground plane (temporary)
    const groundGeometry = new THREE.PlaneGeometry(10000, 10000);
    const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
    
    window.addEventListener('resize', onWindowResize);
    animate();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    renderer.render(scene, camera);
}

init();
```

- [ ] **Step 6: Verify empty shell loads**

Run: Open `index.html` in browser
Expected: Blue sky, green ground plane, gray box aircraft, HUD visible

---

### Task 2: Input Controls System

**Files:**
- Create: `js/controls.js`

- [ ] **Step 1: Create js/controls.js**

```javascript
import { clamp } from './utils.js';

const keys = {};
const mouse = { x: 0, y: 0, deltaX: 0, deltaY: 0 };
let scrollDelta = 0;

export function initControls() {
    window.addEventListener('keydown', (e) => {
        keys[e.code] = true;
        e.preventDefault();
    });
    
    window.addEventListener('keyup', (e) => {
        keys[e.code] = false;
    });
    
    window.addEventListener('mousemove', (e) => {
        mouse.deltaX = e.movementX || 0;
        mouse.deltaY = e.movementY || 0;
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });
    
    window.addEventListener('wheel', (e) => {
        scrollDelta += e.deltaY;
        e.preventDefault();
    }, { passive: false });
}

export function getKeyboardInput() {
    return {
        pitchUp: keys['KeyW'] || keys['ArrowUp'],
        pitchDown: keys['KeyS'] || keys['ArrowDown'],
        rollLeft: keys['KeyA'] || keys['ArrowLeft'],
        rollRight: keys['KeyD'] || keys['ArrowRight'],
        yawLeft: keys['KeyQ'],
        yawRight: keys['KeyE'],
        throttleUp: keys['ShiftLeft'] || keys['ShiftRight'],
        throttleDown: keys['ControlLeft'] || keys['ControlRight'],
        brake: keys['Space'],
        reset: keys['KeyR']
    };
}

export function getMouseInput() {
    const result = {
        deltaX: mouse.deltaX,
        deltaY: mouse.deltaY,
        scrollDelta: scrollDelta
    };
    // Reset deltas after reading
    mouse.deltaX = 0;
    mouse.deltaY = 0;
    scrollDelta = 0;
    return result;
}
```

- [ ] **Step 2: Update js/main.js to use controls**

```javascript
import { initControls, getKeyboardInput } from './controls.js';

// Add in init() after scene setup:
initControls();
```

---

## Phase 2: Flight Physics

### Task 3: Aircraft Physics Class

**Files:**
- Create: `js/aircraft.js`

- [ ] **Step 1: Create js/aircraft.js with physics**

```javascript
import * as THREE from 'three';
import { degreesToRadians, clamp, lerp } from './utils.js';

export class Aircraft {
    constructor() {
        // Physics constants
        this.mass = 5000; // kg
        this.wingArea = 30; // m²
        this.maxThrust = 50000; // N
        this.maxSpeed = 250; // m/s (~500 kts)
        
        // Air density at sea level (kg/m³)
        this.airDensity = 1.225;
        
        // Control surface effectiveness
        this.rollRate = degreesToRadians(60); // degrees/sec
        this.pitchRate = degreesToRadians(40);
        this.yawRate = degreesToRadians(30);
        
        // State
        this.position = new THREE.Vector3(0, 3, 0); // Start on runway
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.rotation = new THREE.Euler(0, 0, 0, 'YXZ');
        this.throttle = 0.3; // 30% starting throttle
        this.altitude = 3; // meters
        
        // Control inputs (normalized -1 to 1)
        this.controlInput = {
            pitch: 0,
            roll: 0,
            yaw: 0
        };
        
        // Derived values for display
        this.ias = 0; // Indicated air speed (knots)
        this.groundSpeed = 0;
        
        // Three.js mesh
        this.mesh = this.createMesh();
    }
    
    createMesh() {
        const group = new THREE.Group();
        
        // Fuselage
        const fuselageGeo = new THREE.CylinderGeometry(0.5, 0.3, 8, 8);
        fuselageGeo.rotateX(Math.PI / 2);
        const fuselageMat = new THREE.MeshStandardMaterial({ color: 0xcccccc });
        const fuselage = new THREE.Mesh(fuselageGeo, fuselageMat);
        group.add(fuselage);
        
        // Wings
        const wingGeo = new THREE.BoxGeometry(12, 0.1, 1.5);
        const wingMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });
        const wings = new THREE.Mesh(wingGeo, wingMat);
        wings.position.set(0, 0, 0.5);
        group.add(wings);
        
        // Tail horizontal
        const tailHGeo = new THREE.BoxGeometry(4, 0.1, 1);
        const tailH = new THREE.Mesh(tailHGeo, wingMat);
        tailH.position.set(0, 0, 3.5);
        group.add(tailH);
        
        // Tail vertical
        const tailVGeo = new THREE.BoxGeometry(0.1, 2, 1);
        const tailV = new THREE.Mesh(tailVGeo, wingMat);
        tailV.position.set(0, 1, 3.5);
        group.add(tailV);
        
        // Cockpit
        const cockpitGeo = new THREE.SphereGeometry(0.6, 8, 8);
        cockpitGeo.scale(1, 0.6, 1.2);
        const cockpitMat = new THREE.MeshStandardMaterial({ 
            color: 0x3366ff, 
            transparent: true, 
            opacity: 0.7 
        });
        const cockpit = new THREE.Mesh(cockpitGeo, cockpitMat);
        cockpit.position.set(0, 0.4, -1.5);
        group.add(cockpit);
        
        // Landing gear
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
        const throttleSpeed = 0.5; // per second
        if (throttleUp) {
            this.throttle = Math.min(1, this.throttle + throttleSpeed * delta);
        }
        if (throttleDown) {
            this.throttle = Math.max(0, this.throttle - throttleSpeed * delta);
        }
    }
    
    update(delta, isOnGround) {
        // Get forward direction from rotation
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyEuler(this.rotation);
        
        const up = new THREE.Vector3(0, 1, 0);
        up.applyEuler(this.rotation);
        
        // Thrust
        const thrustMagnitude = this.throttle * this.maxThrust;
        const thrust = forward.clone().multiplyScalar(thrustMagnitude);
        
        // Velocity magnitude
        const speed = this.velocity.length();
        
        // Calculate angle of attack (simplified)
        // AOA is angle between velocity and fuselage
        let aoa = 0;
        if (speed > 1) {
            const velocityDir = this.velocity.clone().normalize();
            aoa = forward.angleTo(velocityDir);
            // Determine sign based on pitch
            const pitchComponent = velocityDir.dot(up);
            if (pitchComponent > 0) aoa = -aoa;
        }
        
        // Lift coefficient (simplified linear + stall)
        // Cl = 2 * PI * aoa (thin airfoil theory)
        // Stall starts at ~15 degrees
        const stallAngle = degreesToRadians(15);
        let cl;
        if (Math.abs(aoa) < stallAngle) {
            cl = 2 * Math.PI * aoa * 2; // Simplified, tweaked for gameplay
        } else {
            // Stall - lift drops
            cl = 2 * Math.PI * stallAngle * 0.5 * Math.sign(aoa);
        }
        cl = clamp(cl, -1.5, 1.5);
        
        // Drag coefficient
        // Parasitic drag + induced drag
        const cd0 = 0.025; // Zero-lift drag
        const k = 0.04; // Induced drag factor
        const cd = cd0 + k * cl * cl;
        
        // Dynamic pressure: q = 0.5 * rho * v²
        const q = 0.5 * this.airDensity * speed * speed;
        
        // Lift and Drag forces
        const lift = up.clone().multiplyScalar(q * this.wingArea * cl);
        const drag = this.velocity.clone().normalize().multiplyScalar(-q * this.wingArea * cd);
        
        // Weight
        const weight = new THREE.Vector3(0, -this.mass * 9.81, 0);
        
        // Ground effect - increased lift, decreased drag near ground
        const groundEffectHeight = 20;
        if (this.position.y < groundEffectHeight && this.position.y > 0) {
            const effect = 1 - (this.position.y / groundEffectHeight);
            lift.multiplyScalar(1 + effect * 0.5);
            drag.multiplyScalar(1 - effect * 0.3);
        }
        
        // Total force
        const totalForce = new THREE.Vector3()
            .add(thrust)
            .add(lift)
            .add(drag)
            .add(weight);
        
        // Acceleration: F = ma
        const acceleration = totalForce.divideScalar(this.mass);
        
        // Update velocity
        this.velocity.add(acceleration.multiplyScalar(delta));
        
        // Air resistance / speed limits
        if (speed > this.maxSpeed) {
            this.velocity.multiplyScalar(this.maxSpeed / speed);
        }
        
        // Update position
        this.position.add(this.velocity.clone().multiplyScalar(delta));
        
        // Ground collision
        if (this.position.y < 0) {
            this.position.y = 0;
            if (this.velocity.y < 0) {
                this.velocity.y = 0;
            }
        }
        
        // Update rotation based on control input
        this.updateRotation(delta, speed);
        
        // Update derived values
        this.altitude = this.position.y;
        this.groundSpeed = speed;
        this.ias = speed * 1.944; // m/s to knots
        
        // Sync mesh
        this.mesh.position.copy(this.position);
        this.mesh.rotation.copy(this.rotation);
    }
    
    updateRotation(delta, speed) {
        // Only apply control at reasonable speeds or on ground
        const controlEffectiveness = Math.min(1, speed / 30);
        
        // Pitch
        this.rotation.x += this.controlInput.pitch * this.pitchRate * delta * controlEffectiveness;
        this.rotation.x = clamp(this.rotation.x, degreesToRadians(-45), degreesToRadians(45));
        
        // Roll
        this.rotation.z -= this.controlInput.roll * this.rollRate * delta * controlEffectiveness;
        this.rotation.z = clamp(this.rotation.z, degreesToRadians(-60), degreesToRadians(60));
        
        // Yaw
        this.rotation.y += this.controlInput.yaw * this.yawRate * delta * controlEffectiveness;
        
        // Natural roll recovery when banking
        if (speed > 20) {
            this.rotation.z *= 0.99;
        }
        
        // Level out pitch gradually
        if (speed > 20 && Math.abs(this.controlInput.pitch) < 0.1) {
            this.rotation.x *= 0.98;
        }
        
        // Bank turns - yaw based on roll
        if (speed > 20) {
            this.rotation.y += Math.sin(this.rotation.z) * 0.3 * delta;
        }
    }
    
    reset() {
        this.position.set(0, 3, 0);
        this.velocity.set(0, 0, 0);
        this.rotation.set(0, 0, 0);
        this.throttle = 0.3;
    }
}
```

- [ ] **Step 2: Update js/main.js to use Aircraft class**

```javascript
import { Aircraft } from './aircraft.js';
import { initControls, getKeyboardInput, getMouseInput } from './controls.js';

// In init():
aircraft = new Aircraft();
scene.add(aircraft.mesh);

// Remove old placeholder aircraft code

// In animate():
const input = getKeyboardInput();
const throttleUp = input.throttleUp;
const throttleDown = input.throttleDown;
aircraft.updateThrottle(throttleUp, throttleDown, delta);
aircraft.update(delta, aircraft.position.y < 0.5);
```

- [ ] **Step 3: Test physics**

Run: Open in browser, observe HUD values
Expected: Throttle responds to Shift/Ctrl, aircraft accelerates, controls affect rotation

---

## Phase 3: Camera System

### Task 4: Orbit Camera

**Files:**
- Create: `js/camera.js`

- [ ] **Step 1: Create js/camera.js**

```javascript
import * as THREE from 'three';
import { clamp, lerp } from './utils.js';

export class OrbitCamera {
    constructor(camera, target) {
        this.camera = camera;
        this.target = target; // Aircraft instance
        
        // Orbit parameters
        this.distance = 25;
        this.minDistance = 8;
        this.maxDistance = 80;
        this.azimuth = 0; // Horizontal angle
        this.elevation = 0.3; // Vertical angle (radians)
        
        // Mouse sensitivity
        this.orbitSensitivity = 0.005;
        this.zoomSensitivity = 0.05;
        
        // Smooth following
        this.smoothness = 5;
        
        // Current interpolated values
        this.currentPosition = new THREE.Vector3();
        this.currentLookAt = new THREE.Vector3();
    }
    
    handleMouseInput(deltaX, deltaY) {
        this.azimuth -= deltaX * this.orbitSensitivity;
        this.elevation += deltaY * this.orbitSensitivity;
        this.elevation = clamp(this.elevation, -Math.PI / 3, Math.PI / 2.5);
    }
    
    handleScroll(scrollDelta) {
        this.distance += scrollDelta * this.zoomSensitivity;
        this.distance = clamp(this.distance, this.minDistance, this.maxDistance);
    }
    
    update(delta) {
        if (!this.target) return;
        
        // Calculate desired camera position based on orbit angles
        const targetPos = this.target.position.clone();
        
        // Calculate offset from target
        const offset = new THREE.Vector3(
            Math.sin(this.azimuth) * Math.cos(this.elevation) * this.distance,
            Math.sin(this.elevation) * this.distance,
            Math.cos(this.azimuth) * Math.cos(this.elevation) * this.distance
        );
        
        // Add some height offset to look down at aircraft
        offset.y += 3;
        
        const desiredPosition = targetPos.clone().add(offset);
        
        // Smooth interpolation
        const t = 1 - Math.exp(-this.smoothness * delta);
        this.currentPosition.lerp(desiredPosition, t);
        
        // Look at target (slightly ahead of aircraft)
        const lookAhead = new THREE.Vector3(0, 0, -5);
        lookAhead.applyEuler(this.target.rotation);
        this.currentLookAt.lerp(targetPos.clone().add(lookAhead), t);
        
        // Apply to camera
        this.camera.position.copy(this.currentPosition);
        this.camera.lookAt(this.currentLookAt);
    }
}
```

- [ ] **Step 2: Update js/main.js to use OrbitCamera**

```javascript
import { OrbitCamera } from './camera.js';

let orbitCamera;

// In init():
orbitCamera = new OrbitCamera(camera, aircraft);

// In animate():
const mouseInput = getMouseInput();
orbitCamera.handleMouseInput(mouseInput.deltaX, mouseInput.deltaY);
orbitCamera.handleScroll(mouseInput.scrollDelta);
orbitCamera.update(delta);

// Update to use aircraft from class
```

- [ ] **Step 3: Test camera**

Run: Open in browser, move mouse to orbit, scroll to zoom
Expected: Camera orbits around aircraft smoothly, scroll zooms in/out

---

## Phase 4: Environment

### Task 5: Ocean and Sky

**Files:**
- Create: `js/environment.js`

- [ ] **Step 1: Create js/environment.js**

```javascript
import * as THREE from 'three';

export function createOcean(scene) {
    const geometry = new THREE.PlaneGeometry(100000, 100000, 128, 128);
    
    const material = new THREE.MeshStandardMaterial({
        color: 0x006994,
        roughness: 0.2,
        metalness: 0.8,
        transparent: true,
        opacity: 0.9
    });
    
    const ocean = new THREE.Mesh(geometry, material);
    ocean.rotation.x = -Math.PI / 2;
    ocean.position.y = -0.5;
    ocean.receiveShadow = true;
    scene.add(ocean);
    
    return ocean;
}

export function createSky(scene) {
    // Sky dome
    const skyGeo = new THREE.SphereGeometry(50000, 32, 32);
    const skyMat = new THREE.MeshBasicMaterial({
        color: 0x87CEEB,
        side: THREE.BackSide
    });
    const sky = new THREE.Mesh(skyGeo, skyMat);
    scene.add(sky);
    
    // Sun
    const sunGeo = new THREE.SphereGeometry(500, 32, 32);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const sun = new THREE.Mesh(sunGeo, sunMat);
    sun.position.set(10000, 15000, 20000);
    scene.add(sun);
    
    // Sun light
    const sunLight = new THREE.DirectionalLight(0xffffee, 1.2);
    sunLight.position.copy(sun.position);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 100;
    sunLight.shadow.camera.far = 50000;
    sunLight.shadow.camera.left = -1000;
    sunLight.shadow.camera.right = 1000;
    sunLight.shadow.camera.top = 1000;
    sunLight.shadow.camera.bottom = -1000;
    scene.add(sunLight);
    
    return { sky, sun };
}

export function createIsland(scene, x, z, scale = 1) {
    const group = new THREE.Group();
    
    // Island base (ellipsoid)
    const islandGeo = new THREE.SphereGeometry(500 * scale, 32, 16);
    islandGeo.scale(2, 0.3, 1.5);
    const islandMat = new THREE.MeshStandardMaterial({ 
        color: 0x228B22,
        roughness: 0.9
    });
    const island = new THREE.Mesh(islandGeo, islandMat);
    island.position.y = -50 * scale;
    island.receiveShadow = true;
    group.add(island);
    
    // Beach
    const beachGeo = new THREE.RingGeometry(300 * scale, 500 * scale, 32);
    beachGeo.rotateX(-Math.PI / 2);
    const beachMat = new THREE.MeshStandardMaterial({ 
        color: 0xF4D03F,
        roughness: 1
    });
    const beach = new THREE.Mesh(beachGeo, beachMat);
    beach.position.y = 0.1;
    beach.receiveShadow = true;
    group.add(beach);
    
    // Mountains
    const mountainGeo = new THREE.ConeGeometry(200 * scale, 400 * scale, 8);
    const mountainMat = new THREE.MeshStandardMaterial({ 
        color: 0x4A5D23,
        roughness: 0.9,
        flatShading: true
    });
    
    const positions = [
        { x: 100 * scale, z: 50 * scale, scale: 1 },
        { x: -150 * scale, z: -80 * scale, scale: 0.8 },
        { x: 50 * scale, z: -150 * scale, scale: 0.6 }
    ];
    
    positions.forEach(pos => {
        const mountain = new THREE.Mesh(mountainGeo, mountainMat);
        mountain.position.set(pos.x, 100 * pos.scale * scale, pos.z);
        mountain.scale.setScalar(pos.scale);
        mountain.castShadow = true;
        group.add(mountain);
    });
    
    // Palm trees
    addPalmTrees(group, scale);
    
    // Buildings
    addBuildings(group, scale);
    
    group.position.set(x, 0, z);
    scene.add(group);
    
    return group;
}

function addPalmTrees(island, scale) {
    const trunkGeo = new THREE.CylinderGeometry(1 * scale, 2 * scale, 30 * scale, 8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    const leafGeo = new THREE.ConeGeometry(15 * scale, 10 * scale, 8);
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x228B22 });
    
    for (let i = 0; i < 15; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 250 * scale * Math.random();
        
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.set(
            Math.cos(angle) * radius,
            15 * scale,
            Math.sin(angle) * radius
        );
        trunk.castShadow = true;
        island.add(trunk);
        
        const leaf = new THREE.Mesh(leafGeo, leafMat);
        leaf.position.set(trunk.position.x, 35 * scale, trunk.position.z);
        leaf.castShadow = true;
        island.add(leaf);
    }
}

function addBuildings(island, scale) {
    // Simple resort building
    const buildingGeo = new THREE.BoxGeometry(40 * scale, 20 * scale, 30 * scale);
    const buildingMat = new THREE.MeshStandardMaterial({ color: 0xFFFAF0 });
    const building = new THREE.Mesh(buildingGeo, buildingMat);
    building.position.set(100 * scale, 10 * scale, 50 * scale);
    building.castShadow = true;
    island.add(building);
    
    // Roof
    const roofGeo = new THREE.BoxGeometry(45 * scale, 5 * scale, 35 * scale);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0xFF6B6B });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(100 * scale, 22 * scale, 50 * scale);
    roof.castShadow = true;
    island.add(roof);
}
```

- [ ] **Step 2: Update js/main.js to create environment**

```javascript
import { createOcean, createSky, createIsland } from './environment.js';

// In init():
createOcean(scene);
createSky(scene);

// Main island with airport
const mainIsland = createIsland(scene, 0, -2000, 3);

// Additional islands for archipelago
createIsland(scene, 8000, -5000, 1.5);
createIsland(scene, -6000, -8000, 2);
createIsland(scene, 12000, 3000, 1);
createIsland(scene, -10000, 5000, 1.8);
createIsland(scene, 5000, 10000, 1.2);
```

---

### Task 6: Airport with Runway

**Files:**
- Modify: `js/environment.js`

- [ ] **Step 1: Add airport creation function**

Add to js/environment.js:

```javascript
export function createAirport(scene, x, z) {
    const group = new THREE.Group();
    
    // Runway
    const runwayGeo = new THREE.PlaneGeometry(3000, 60);
    const runwayMat = new THREE.MeshStandardMaterial({ 
        color: 0x333333,
        roughness: 0.8
    });
    const runway = new THREE.Mesh(runwayGeo, runwayMat);
    runway.rotation.x = -Math.PI / 2;
    runway.receiveShadow = true;
    group.add(runway);
    
    // Runway markings
    const markingGeo = new THREE.PlaneGeometry(50, 2);
    const markingMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    
    for (let i = -1200; i < 1200; i += 150) {
        const marking = new THREE.Mesh(markingGeo, markingMat);
        marking.rotation.x = -Math.PI / 2;
        marking.position.set(i, 0.1, 0);
        group.add(marking);
    }
    
    // Centerline
    const centerlineGeo = new THREE.PlaneGeometry(3000, 0.5);
    const centerline = new THREE.Mesh(centerlineGeo, markingMat);
    centerline.rotation.x = -Math.PI / 2;
    centerline.position.y = 0.1;
    group.add(centerline);
    
    // Threshold markings
    const thresholdMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    for (let i = -20; i <= 20; i += 4) {
        const thresh = new THREE.Mesh(
            new THREE.PlaneGeometry(2, 8),
            thresholdMat
        );
        thresh.rotation.x = -Math.PI / 2;
        thresh.position.set(-1350, 0.1, i * 1.5);
        group.add(thresh);
        
        const thresh2 = thresh.clone();
        thresh2.position.set(1350, 0.1, i * 1.5);
        group.add(thresh2);
    }
    
    // Taxiway
    const taxiwayGeo = new THREE.PlaneGeometry(200, 30);
    const taxiway = new THREE.Mesh(taxiwayGeo, runwayMat);
    taxiway.rotation.x = -Math.PI / 2;
    taxiway.position.set(1400, 0.01, 150);
    taxiway.receiveShadow = true;
    group.add(taxiway);
    
    // Apron
    const apronGeo = new THREE.PlaneGeometry(400, 300);
    const apron = new THREE.Mesh(apronGeo, runwayMat);
    apron.rotation.x = -Math.PI / 2;
    apron.position.set(1700, 0.01, 300);
    apron.receiveShadow = true;
    group.add(apron);
    
    // Terminal building
    const terminalGeo = new THREE.BoxGeometry(200, 25, 60);
    const terminalMat = new THREE.MeshStandardMaterial({ color: 0xDDDDDD });
    const terminal = new THREE.Mesh(terminalGeo, terminalMat);
    terminal.position.set(1700, 12.5, 500);
    terminal.castShadow = true;
    group.add(terminal);
    
    // Terminal roof
    const terminalRoofGeo = new THREE.BoxGeometry(220, 5, 80);
    const terminalRoofMat = new THREE.MeshStandardMaterial({ color: 0x4169E1 });
    const terminalRoof = new THREE.Mesh(terminalRoofGeo, terminalRoofMat);
    terminalRoof.position.set(1700, 32, 500);
    terminalRoof.castShadow = true;
    group.add(terminalRoof);
    
    // Control tower
    const towerGeo = new THREE.CylinderGeometry(8, 10, 60, 8);
    const towerMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
    const tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.set(1500, 30, -50);
    tower.castShadow = true;
    group.add(tower);
    
    // Tower cab
    const cabGeo = new THREE.BoxGeometry(20, 15, 20);
    const cab = new THREE.Mesh(cabGeo, towerMat);
    cab.position.set(1500, 67, -50);
    cab.castShadow = true;
    group.add(cab);
    
    // Hangar
    const hangarGeo = new THREE.BoxGeometry(150, 35, 100);
    const hangarMat = new THREE.MeshStandardMaterial({ color: 0xCC3333 });
    const hangar = new THREE.Mesh(hangarGeo, hangarMat);
    hangar.position.set(1800, 17.5, 100);
    hangar.castShadow = true;
    group.add(hangar);
    
    // Hangar roof
    const hangarRoofGeo = new THREE.BoxGeometry(160, 10, 110);
    const hangarRoofMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const hangarRoof = new THREE.Mesh(hangarRoofGeo, hangarRoofMat);
    hangarRoof.position.set(1800, 45, 100);
    group.add(hangarRoof);
    
    group.position.set(x, 0.5, z);
    scene.add(group);
    
    return group;
}
```

- [ ] **Step 2: Update js/main.js to add airport**

```javascript
import { createOcean, createSky, createIsland, createAirport } from './environment.js';

// In init():
createAirport(scene, 0, -2000); // On main island
```

---

## Phase 5: Animated Elements

### Task 7: Cloud System

**Files:**
- Create: `js/clouds.js`

- [ ] **Step 1: Create js/clouds.js**

```javascript
import * as THREE from 'three';

export class CloudSystem {
    constructor(scene, count = 50) {
        this.clouds = [];
        this.scene = scene;
        
        for (let i = 0; i < count; i++) {
            this.createCloud();
        }
    }
    
    createCloud() {
        const cloudGroup = new THREE.Group();
        
        // Create cloud puffs
        const puffCount = 5 + Math.floor(Math.random() * 5);
        const puffGeo = new THREE.SphereGeometry(1, 8, 8);
        const puffMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.9,
            roughness: 1
        });
        
        for (let i = 0; i < puffCount; i++) {
            const puff = new THREE.Mesh(puffGeo, puffMat);
            puff.position.set(
                (Math.random() - 0.5) * 30,
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 20
            );
            puff.scale.setScalar(10 + Math.random() * 15);
            cloudGroup.add(puff);
        }
        
        // Position randomly
        cloudGroup.position.set(
            (Math.random() - 0.5) * 40000,
            500 + Math.random() * 1500,
            (Math.random() - 0.5) * 40000
        );
        
        // Store velocity for animation
        cloudGroup.userData.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 10,
            0,
            (Math.random() - 0.5) * 5
        );
        
        this.scene.add(cloudGroup);
        this.clouds.push(cloudGroup);
    }
    
    update(delta) {
        this.clouds.forEach(cloud => {
            // Move cloud
            cloud.position.add(
                cloud.userData.velocity.clone().multiplyScalar(delta)
            );
            
            // Wrap around
            if (cloud.position.x > 20000) cloud.position.x = -20000;
            if (cloud.position.x < -20000) cloud.position.x = 20000;
            if (cloud.position.z > 20000) cloud.position.z = -20000;
            if (cloud.position.z < -20000) cloud.position.z = 20000;
        });
    }
}
```

- [ ] **Step 2: Update js/main.js to use clouds**

```javascript
import { CloudSystem } from './clouds.js';

let cloudSystem;

// In init():
cloudSystem = new CloudSystem(scene);

// In animate():
cloudSystem.update(delta);
```

---

### Task 8: Wildlife (Birds and Balloons)

**Files:**
- Create: `js/wildlife.js`

- [ ] **Step 1: Create js/wildlife.js**

```javascript
import * as THREE from 'three';

export class Wildlife {
    constructor(scene) {
        this.scene = scene;
        this.birds = [];
        this.balloons = [];
        
        this.createBirds(30);
        this.createBalloons(5);
    }
    
    createBirds(count) {
        const birdGeo = new THREE.ConeGeometry(0.5, 2, 4);
        birdGeo.rotateX(Math.PI / 2);
        const birdMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
        
        for (let i = 0; i < count; i++) {
            const bird = new THREE.Mesh(birdGeo, birdMat);
            
            // Random position
            bird.position.set(
                (Math.random() - 0.5) * 20000,
                100 + Math.random() * 500,
                (Math.random() - 0.5) * 20000
            );
            
            // Store movement data
            bird.userData = {
                speed: 10 + Math.random() * 20,
                direction: new THREE.Vector3(
                    Math.random() - 0.5,
                    0,
                    Math.random() - 0.5
                ).normalize(),
                turnTimer: Math.random() * 5
            };
            
            bird.rotation.y = Math.atan2(
                bird.userData.direction.x,
                bird.userData.direction.z
            );
            
            this.scene.add(bird);
            this.birds.push(bird);
        }
    }
    
    createBalloons(count) {
        const balloonGroup = new THREE.Group();
        
        // Balloon
        const balloonGeo = new THREE.SphereGeometry(15, 16, 16);
        balloonGeo.scale(1, 1.3, 1);
        const colors = [0xFF6B6B, 0x4ECDC4, 0xFFE66D, 0x95E1D3, 0xF38181];
        const balloonMat = new THREE.MeshStandardMaterial({
            color: colors[Math.floor(Math.random() * colors.length)]
        });
        const balloon = new THREE.Mesh(balloonGeo, balloonMat);
        balloon.position.y = 15;
        balloonGroup.add(balloon);
        
        // Basket
        const basketGeo = new THREE.BoxGeometry(5, 4, 5);
        const basketMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
        const basket = new THREE.Mesh(basketGeo, basketMat);
        basket.position.y = -2;
        balloonGroup.add(basket);
        
        // Ropes
        const ropeGeo = new THREE.CylinderGeometry(0.1, 0.1, 17);
        const ropeMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
        [-2, 2].forEach(x => {
            [-2, 2].forEach(z => {
                const rope = new THREE.Mesh(ropeGeo, ropeMat);
                rope.position.set(x, 6.5, z);
                balloonGroup.add(rope);
            });
        });
        
        for (let i = 0; i < count; i++) {
            const balloon = balloonGroup.clone();
            
            balloon.position.set(
                (Math.random() - 0.5) * 30000,
                200 + Math.random() * 400,
                (Math.random() - 0.5) * 30000
            );
            
            balloon.userData = {
                driftSpeed: 5 + Math.random() * 10,
                driftDirection: new THREE.Vector3(
                    Math.random() - 0.5,
                    0,
                    Math.random() - 0.5
                ).normalize(),
                bobTimer: Math.random() * Math.PI * 2
            };
            
            this.scene.add(balloon);
            this.balloons.push(balloon);
        }
    }
    
    update(delta) {
        // Update birds
        this.birds.forEach(bird => {
            bird.userData.turnTimer -= delta;
            
            if (bird.userData.turnTimer <= 0) {
                bird.userData.direction.set(
                    Math.random() - 0.5,
                    (Math.random() - 0.5) * 0.2,
                    Math.random() - 0.5
                ).normalize();
                bird.userData.turnTimer = 2 + Math.random() * 5;
                
                bird.rotation.y = Math.atan2(
                    bird.userData.direction.x,
                    bird.userData.direction.z
                );
            }
            
            // Move bird
            bird.position.add(
                bird.userData.direction.clone().multiplyScalar(
                    bird.userData.speed * delta
                )
            );
            
            // Banking
            bird.rotation.z = -bird.userData.direction.x * 0.5;
            
            // Keep in bounds
            if (bird.position.x > 15000) bird.position.x = -15000;
            if (bird.position.x < -15000) bird.position.x = 15000;
            if (bird.position.z > 15000) bird.position.z = -15000;
            if (bird.position.z < -15000) bird.position.z = 15000;
            bird.position.y = Math.max(50, Math.min(800, bird.position.y));
        });
        
        // Update balloons
        this.balloons.forEach(balloon => {
            balloon.userData.bobTimer += delta * 2;
            
            // Drift
            balloon.position.add(
                balloon.userData.driftDirection.clone().multiplyScalar(
                    balloon.userData.driftSpeed * delta
                )
            );
            
            // Bob up and down
            balloon.position.y += Math.sin(balloon.userData.bobTimer) * 0.3;
            
            // Gentle rotation
            balloon.rotation.y += delta * 0.1;
            
            // Keep in bounds
            if (balloon.position.x > 20000) balloon.position.x = -20000;
            if (balloon.position.x < -20000) balloon.position.x = 20000;
            if (balloon.position.z > 20000) balloon.position.z = -20000;
        });
    }
}
```

- [ ] **Step 2: Update js/main.js to use wildlife**

```javascript
import { Wildlife } from './wildlife.js';

let wildlife;

// In init():
wildlife = new Wildlife(scene);

// In animate():
wildlife.update(delta);
```

---

## Phase 6: HUD and Polish

### Task 9: HUD Updates

**Files:**
- Modify: `js/main.js`

- [ ] **Step 1: Update HUD in animate loop**

```javascript
// In animate(), update HUD:
document.getElementById('speed-value').textContent = Math.round(aircraft.ias);
document.getElementById('altitude-value').textContent = Math.round(aircraft.altitude * 3.281); // m to ft
document.getElementById('throttle-value').textContent = Math.round(aircraft.throttle * 100);
```

- [ ] **Step 2: Add reset functionality**

```javascript
// In animate(), check for reset:
if (input.reset) {
    aircraft.reset();
}
```

---

### Task 10: Starting Position

**Files:**
- Modify: `js/aircraft.js`

- [ ] **Step 1: Update starting position**

In the Aircraft constructor, change:
```javascript
this.position = new THREE.Vector3(-1400, 2, 0); // On runway, facing forward
```

And add initial rotation to face down the runway:
```javascript
this.rotation = new THREE.Euler(0, Math.PI, 0); // Facing down runway
```

---

## Implementation Complete Checklist

- [ ] Project scaffolding (HTML, CSS, basic JS)
- [ ] Input controls (keyboard + mouse)
- [ ] Aircraft physics (lift, drag, thrust, stall)
- [ ] Third-person orbit camera
- [ ] Ocean and sky
- [ ] Islands with terrain
- [ ] Airport with runway and buildings
- [ ] Cloud system with animation
- [ ] Birds with flight patterns
- [ ] Hot air balloons
- [ ] HUD (speed, altitude, throttle)
- [ ] Aircraft starts on runway

---

## Running the Project

To run the flight simulator:

1. Serve the project with any local HTTP server:
```bash
cd /Users/tyler/Workspace/flightSimulator/MiniMax2.5
python3 -m http.server 8000
```

2. Open in browser:
```
http://localhost:8000
```

---

## Future Enhancements (Out of Scope)

- Additional aircraft types
- Instrument panel (airspeed indicator, altimeter, attitude indicator)
- Sound effects (engine, wind)
- More detailed island scenery
- Day/night cycle
- Weather effects (rain, turbulence)
- VR support
