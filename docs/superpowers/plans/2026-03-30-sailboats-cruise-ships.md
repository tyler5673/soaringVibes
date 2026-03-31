# Sailboats & Cruise Ships Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 25 animated sailboats and 5 cruise ships to the Hawaiian archipelago with random waypoint AI navigation

**Architecture:** New `js/boats.js` module with `BoatManager`, `Sailboat`, and `CruiseShip` classes. Boats use procedural Three.js geometry, follow ocean surface with wave offset, and navigate using random waypoint selection while avoiding land using `getTerrainHeight()`.

**Tech Stack:** Three.js (existing), procedural geometry, waypoint navigation AI

---

## File Structure

- **Create:** `js/boats.js` - Main boats module with all classes
- **Modify:** `index.html:214` - Add script include for boats.js
- **Modify:** `index.html:618` - Instantiate BoatManager in main init

---

## Tasks

### Task 1: Create js/boats.js Module

**Files:**
- Create: `js/boats.js`

- [ ] **Step 1: Write Sailboat class with procedural geometry**

```javascript
class Sailboat {
    constructor(scene, position) {
        this.scene = scene;
        this.mesh = this.createMesh();
        this.mesh.position.copy(position);
        
        // Navigation state
        this.velocity = new THREE.Vector3();
        this.speed = 5 + Math.random() * 10; // 5-15 knots
        this.targetWaypoint = null;
        this.waypointTimer = Math.random() * 10;
        
        // Animation state
        this.bobTimer = Math.random() * Math.PI * 2;
        this.rockTimer = Math.random() * Math.PI * 2;
        
        scene.add(this.mesh);
    }
    
    createMesh() {
        const group = new THREE.Group();
        
        // Hull - tapered white fiberglass
        const hullShape = new THREE.Shape();
        hullShape.moveTo(0, 0);
        hullShape.lineTo(8, 0);
        hullShape.lineTo(6, 2);
        hullShape.lineTo(1, 2);
        hullShape.closePath();
        
        const hullGeo = new THREE.ExtrudeGeometry(hullShape, { depth: 3, bevelEnabled: false });
        hullGeo.rotateX(-Math.PI / 2);
        hullGeo.translate(-4, 0, -1);
        const hullMat = new THREE.MeshStandardMaterial({ color: 0xF5F5F5, roughness: 0.4 });
        const hull = new THREE.Mesh(hullGeo, hullMat);
        hull.castShadow = true;
        group.add(hull);
        
        // Mast
        const mastGeo = new THREE.CylinderGeometry(0.1, 0.15, 12, 8);
        const mastMat = new THREE.MeshStandardMaterial({ color: 0x4A4A4A });
        const mast = new THREE.Mesh(mastGeo, mastMat);
        mast.position.set(0, 6, 0.5);
        group.add(mast);
        
        // Sail - curved cream canvas
        const sailShape = new THREE.Shape();
        sailShape.moveTo(0, 0);
        sailShape.quadraticCurveTo(2, 4, 0, 10);
        sailShape.lineTo(0, 0);
        
        const sailGeo = new THREE.ShapeGeometry(sailShape);
        const sailMat = new THREE.MeshStandardMaterial({ 
            color: 0xFFFACD, 
            side: THREE.DoubleSide,
            roughness: 0.8 
        });
        const sail = new THREE.Mesh(sailGeo, sailMat);
        sail.position.set(0.1, 1, 0.5);
        sail.rotation.y = Math.PI / 2;
        group.add(sail);
        
        // Boom
        const boomGeo = new THREE.CylinderGeometry(0.05, 0.05, 3, 6);
        const boom = new THREE.Mesh(boomGeo, mastMat);
        boom.position.set(0, 1.5, 0.5);
        boom.rotation.z = Math.PI / 2;
        group.add(boom);
        
        return group;
    }
}
```

- [ ] **Step 2: Write CruiseShip class with detailed geometry**

```javascript
class CruiseShip {
    constructor(scene, position) {
        this.scene = scene;
        this.mesh = this.createMesh();
        this.mesh.position.copy(position);
        
        // Navigation
        this.velocity = new THREE.Vector3();
        this.speed = 10 + Math.random() * 10; // 10-20 knots
        this.targetWaypoint = null;
        this.waypointTimer = Math.random() * 20;
        
        // Animation
        this.bobTimer = Math.random() * Math.PI * 2;
        this.windowLightsOn = Math.random() > 0.3;
        
        scene.add(this.mesh);
    }
    
    createMesh() {
        const group = new THREE.Group();
        
        // Hull - large white with red stripe
        const hullGeo = new THREE.BoxGeometry(60, 12, 15);
        const hullMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.3 });
        const hull = new THREE.Mesh(hullGeo, hullMat);
        hull.position.y = 4;
        hull.castShadow = true;
        group.add(hull);
        
        // Red stripe
        const stripeGeo = new THREE.BoxGeometry(60, 2, 15.1);
        const stripeMat = new THREE.MeshStandardMaterial({ color: 0xCC0000 });
        const stripe = new THREE.Mesh(stripeGeo, stripeMat);
        stripe.position.y = 7;
        group.add(stripe);
        
        // Decks (3 levels)
        for (let i = 0; i < 3; i++) {
            const deckGeo = new THREE.BoxGeometry(55, 3, 14);
            const deckMat = new THREE.MeshStandardMaterial({ color: 0xDDDDDD });
            const deck = new THREE.Mesh(deckGeo, deckMat);
            deck.position.set(0, 11 + i * 3.5, 0);
            deck.castShadow = true;
            group.add(deck);
            
            // Windows with glow
            for (let w = 0; w < 10; w++) {
                const windowGeo = new THREE.BoxGeometry(2, 1.5, 0.2);
                const windowMat = new THREE.MeshStandardMaterial({ 
                    color: 0xFFFFAA, 
                    emissive: 0xFFFFAA,
                    emissiveIntensity: this.windowLightsOn ? 0.5 : 0
                });
                const windowMesh = new THREE.Mesh(windowGeo, windowMat);
                windowMesh.position.set(-25 + w * 5.5, 12 + i * 3.5, 7.1);
                group.add(windowMesh);
            }
        }
        
        // Bridge/superstructure at rear
        const bridgeGeo = new THREE.BoxGeometry(15, 10, 12);
        const bridgeMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
        const bridge = new THREE.Mesh(bridgeGeo, bridgeMat);
        bridge.position.set(-20, 16, 0);
        bridge.castShadow = true;
        group.add(bridge);
        
        // Smoke stacks
        for (let i = 0; i < 2; i++) {
            const stackGeo = new THREE.CylinderGeometry(2, 2.5, 8, 8);
            const stackMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
            const stack = new THREE.Mesh(stackGeo, stackMat);
            stack.position.set(15 + i * 5, 22, 0);
            group.add(stack);
        }
        
        // Lifeboats
        for (let side = -1; side <= 1; side += 2) {
            for (let i = 0; i < 3; i++) {
                const boatGeo = new THREE.BoxGeometry(4, 1.5, 2);
                const boatMat = new THREE.MeshStandardMaterial({ color: 0xFF6600 });
                const boat = new THREE.Mesh(boatGeo, boatMat);
                boat.position.set(-10 + i * 10, 10.5, side * 8);
                group.add(boat);
            }
        }
        
        // Passenger silhouettes (simple boxes)
        for (let i = 0; i < 20; i++) {
            const personGeo = new THREE.BoxGeometry(0.5, 1.5, 0.3);
            const personMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
            const person = new THREE.Mesh(personGeo, personMat);
            person.position.set(
                (Math.random() - 0.5) * 40,
                24 + Math.floor(Math.random() * 3) * 3.5,
                (Math.random() - 0.5) * 8
            );
            person.userData.walkOffset = Math.random() * Math.PI * 2;
            group.add(person);
        }
        
        return group;
    }
}
```

- [ ] **Step 3: Write BoatManager class with waypoint AI**

```javascript
class BoatManager {
    constructor(scene) {
        this.scene = scene;
        this.sailboats = [];
        this.cruiseShips = [];
        
        this.createSailboats(25);
        this.createCruiseShips(5);
    }
    
    createSailboats(count) {
        // 15 near coastlines, 10 in open water
        const coastalCount = 15;
        
        for (let i = 0; i < coastalCount; i++) {
            const pos = this.getCoastalPosition();
            const boat = new Sailboat(this.scene, pos);
            this.sailboats.push(boat);
        }
        
        for (let i = 0; i < count - coastalCount; i++) {
            const pos = this.getOpenWaterPosition();
            const boat = new Sailboat(this.scene, pos);
            this.sailboats.push(boat);
        }
    }
    
    createCruiseShips(count) {
        const positions = [
            { x: 1500, z: 500 },    // Near Maui
            { x: -500, z: -800 },   // Near Maui
            { x: 3500, z: -6000 },  // Near Big Island
            { x: -6000, z: -2500 }, // Near Oahu
            { x: 2000, z: -4000 }  // Between islands
        ];
        
        for (let i = 0; i < count; i++) {
            const pos = positions[i] || this.getOpenWaterPosition();
            const ship = new CruiseShip(this.scene, new THREE.Vector3(pos.x, 0, pos.z));
            this.cruiseShips.push(ship);
        }
    }
    
    getCoastalPosition() {
        // Pick random island and get position near coastline
        const island = islandPositions[Math.floor(Math.random() * islandPositions.length)];
        const angle = Math.random() * Math.PI * 2;
        const distance = 200 + Math.random() * 300;
        
        return new THREE.Vector3(
            island.x + Math.cos(angle) * distance,
            0,
            island.z + Math.sin(angle) * distance
        );
    }
    
    getOpenWaterPosition() {
        return new THREE.Vector3(
            (Math.random() - 0.5) * 20000,
            0,
            (Math.random() - 0.5) * 20000
        );
    }
    
    pickNewWaypoint(boat) {
        // For coastal boats, stay near coast
        // For open water, pick random point
        const isCoastal = boat instanceof Sailboat && this.sailboats.indexOf(boat) < 15;
        
        let newTarget;
        if (isCoastal) {
            newTarget = this.getCoastalPosition();
        } else {
            newTarget = this.getOpenWaterPosition();
        }
        
        // Ensure waypoint is not on land
        let attempts = 0;
        while (getTerrainHeight(newTarget.x, newTarget.z) > 5 && attempts < 10) {
            newTarget = isCoastal ? this.getCoastalPosition() : this.getOpenWaterPosition();
            attempts++;
        }
        
        boat.targetWaypoint = newTarget;
    }
    
    update(delta, time) {
        const allBoats = [...this.sailboats, ...this.cruiseShips];
        
        allBoats.forEach(boat => {
            // Update waypoint timer
            boat.waypointTimer -= delta;
            
            if (!boat.targetWaypoint || boat.waypointTimer <= 0) {
                this.pickNewWaypoint(boat);
                boat.waypointTimer = 10 + Math.random() * 20;
            }
            
            // Move toward waypoint
            const direction = new THREE.Vector3()
                .subVectors(boat.targetWaypoint, boat.mesh.position)
                .setY(0)
                .normalize();
            
            boat.mesh.position.x += direction.x * boat.speed * delta;
            boat.mesh.position.z += direction.z * boat.speed * delta;
            
            // Face direction of travel
            if (boat.speed > 0.1) {
                boat.mesh.rotation.y = Math.atan2(direction.x, direction.z);
            }
            
            // Wave bobbing animation
            boat.bobTimer += delta * 2;
            boat.rockTimer += delta * 1.5;
            
            const waveHeight = getTerrainHeight(boat.mesh.position.x, boat.mesh.position.z);
            boat.mesh.position.y = waveHeight + Math.sin(boat.bobTimer) * 0.3;
            
            // Rock side to side
            boat.mesh.rotation.z = Math.sin(boat.rockTimer) * 0.05;
            boat.mesh.rotation.x = Math.cos(boat.rockTimer * 0.7) * 0.03;
            
            // Cruise ship specific updates
            if (boat instanceof CruiseShip) {
                // Animate passengers walking
                boat.mesh.children.forEach(child => {
                    if (child.userData.walkOffset !== undefined) {
                        child.position.x += Math.sin(time * 2 + child.userData.walkOffset) * 0.01;
                    }
                });
            }
            
            // Sailboat sail animation
            if (boat instanceof Sailboat && boat.mesh.children[2]) {
                // Subtle sail flutter
                boat.mesh.children[2].rotation.z = Math.sin(time * 3 + boat.bobTimer) * 0.02;
            }
        });
    }
}
```

- [ ] **Step 4: Commit**

```bash
git add js/boats.js
git commit -m "feat: add sailboats and cruise ships with waypoint AI"
```

---

### Task 2: Integrate boats into index.html

**Files:**
- Modify: `index.html:214` (after wildlife.js script)
- Modify: `index.html:618` (after wildlife instantiation)

- [ ] **Step 1: Add script include**

In `index.html` after line 214 (`<script src="js/wildlife.js"></script>`):

```html
<script src="js/boats.js"></script>
```

- [ ] **Step 2: Add boat manager initialization**

After line 618 (`wildlife = new Wildlife(scene);`), add:

```javascript
// Create boats
const boatManager = new BoatManager(scene);
window.boatManager = boatManager;
```

- [ ] **Step 3: Add boat manager update to game loop**

Find the wildlife update line (727) and add boatManager update after it:

```javascript
boatManager.update(delta, clock.getElapsedTime());
```

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: integrate boats into main game loop"
```

---

### Task 3: Verify boats visible in viewer

**Files:**
- Test: Open viewer and check for boats

- [ ] **Step 1: Start server and open viewer**

Run: `npx serve` then open http://localhost:3000/viewer

- [ ] **Step 2: Verify sailboats exist**

In browser console: `console.log(window.boatManager?.sailboats.length)`
Expected: 25

- [ ] **Step 3: Verify cruise ships exist**

In browser console: `console.log(window.boatManager?.cruiseShips.length)`
Expected: 5

- [ ] **Step 4: Verify boats are positioned correctly**

In browser console: `window.boatManager?.sailboats[0]?.mesh?.position`
Expected: Vector3 with valid x, y, z (y should be near ocean surface ~2)

- [ ] **Step 5: Commit**

```bash
git commit -m "test: verify boats integration"
```

---

## Summary

| Task | Files | Steps |
|------|-------|-------|
| Task 1: Create boats.js | Create: js/boats.js | 4 steps |
| Task 2: Integrate into index.html | Modify: index.html | 4 steps |
| Task 3: Verify | Test: viewer | 5 steps |

**Total: 13 steps**
