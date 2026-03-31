// ========== SAILBOATS & CRUISE SHIPS ==========
class Sailboat {
    constructor(scene, position) {
        this.scene = scene;
        this.mesh = this.createMesh();
        
        if (position) {
            this.mesh.position.copy(position);
        }
        
        this.velocity = new THREE.Vector3();
        this.speed = 5 + Math.random() * 10;
        this.targetWaypoint = null;
        this.waypointTimer = Math.random() * 10;
        
        this.bobTimer = Math.random() * Math.PI * 2;
        this.rockTimer = Math.random() * Math.PI * 2;
        
        if (scene) {
            scene.add(this.mesh);
        }
    }
    
    static getGeometry() {
        const temp = new Sailboat();
        return temp.mesh;
    }
    
    createMesh() {
        const group = new THREE.Group();
        
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
        
        const mastGeo = new THREE.CylinderGeometry(0.1, 0.15, 12, 8);
        const mastMat = new THREE.MeshStandardMaterial({ color: 0x4A4A4A });
        const mast = new THREE.Mesh(mastGeo, mastMat);
        mast.position.set(0, 6, 0.5);
        group.add(mast);
        
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
        
        const boomGeo = new THREE.CylinderGeometry(0.05, 0.05, 3, 6);
        const boom = new THREE.Mesh(boomGeo, mastMat);
        boom.position.set(0, 1.5, 0.5);
        boom.rotation.z = Math.PI / 2;
        group.add(boom);
        
        return group;
    }
}

class CruiseShip {
    constructor(scene, position) {
        this.scene = scene;
        this.mesh = this.createMesh();
        
        if (position) {
            this.mesh.position.copy(position);
        }
        
        this.velocity = new THREE.Vector3();
        this.speed = 10 + Math.random() * 10;
        this.targetWaypoint = null;
        this.waypointTimer = Math.random() * 20;
        
        this.bobTimer = Math.random() * Math.PI * 2;
        this.windowLightsOn = Math.random() > 0.3;
        
        if (scene) {
            scene.add(this.mesh);
        }
    }
    
    static getGeometry() {
        const temp = new CruiseShip();
        return temp.mesh;
    }
    
    createMesh() {
        const group = new THREE.Group();
        
        const hullGeo = new THREE.BoxGeometry(60, 12, 15);
        const hullMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.3 });
        const hull = new THREE.Mesh(hullGeo, hullMat);
        hull.position.y = 4;
        hull.castShadow = true;
        group.add(hull);
        
        const stripeGeo = new THREE.BoxGeometry(60, 2, 15.1);
        const stripeMat = new THREE.MeshStandardMaterial({ color: 0xCC0000 });
        const stripe = new THREE.Mesh(stripeGeo, stripeMat);
        stripe.position.y = 7;
        group.add(stripe);
        
        for (let i = 0; i < 3; i++) {
            const deckGeo = new THREE.BoxGeometry(55, 3, 14);
            const deckMat = new THREE.MeshStandardMaterial({ color: 0xDDDDDD });
            const deck = new THREE.Mesh(deckGeo, deckMat);
            deck.position.set(0, 11 + i * 3.5, 0);
            deck.castShadow = true;
            group.add(deck);
            
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
        
        const bridgeGeo = new THREE.BoxGeometry(15, 10, 12);
        const bridgeMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
        const bridge = new THREE.Mesh(bridgeGeo, bridgeMat);
        bridge.position.set(-20, 16, 0);
        bridge.castShadow = true;
        group.add(bridge);
        
        for (let i = 0; i < 2; i++) {
            const stackGeo = new THREE.CylinderGeometry(2, 2.5, 8, 8);
            const stackMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
            const stack = new THREE.Mesh(stackGeo, stackMat);
            stack.position.set(15 + i * 5, 22, 0);
            group.add(stack);
        }
        
        for (let side = -1; side <= 1; side += 2) {
            for (let i = 0; i < 3; i++) {
                const boatGeo = new THREE.BoxGeometry(4, 1.5, 2);
                const boatMat = new THREE.MeshStandardMaterial({ color: 0xFF6600 });
                const boat = new THREE.Mesh(boatGeo, boatMat);
                boat.position.set(-10 + i * 10, 10.5, side * 8);
                group.add(boat);
            }
        }
        
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

class BoatManager {
    constructor(scene) {
        this.scene = scene;
        this.sailboats = [];
        this.cruiseShips = [];
        
        this.createSailboats(50);
        this.createCruiseShips(10);
    }
    
    createSailboats(count) {
        const coastalCount = 30;
        
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
            { x: 1500, z: 500 },
            { x: -500, z: -800 },
            { x: 3500, z: -6000 },
            { x: -6000, z: -2500 },
            { x: 2000, z: -4000 }
        ];
        
        for (let i = 0; i < count; i++) {
            const pos = positions[i] || this.getOpenWaterPosition();
            const ship = new CruiseShip(this.scene, new THREE.Vector3(pos.x, 0, pos.z));
            this.cruiseShips.push(ship);
        }
    }
    
    getCoastalPosition() {
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
        const isCoastal = boat instanceof Sailboat && this.sailboats.indexOf(boat) < 30;
        
        let newTarget;
        if (isCoastal) {
            newTarget = this.getCoastalPosition();
        } else {
            newTarget = this.getOpenWaterPosition();
        }
        
        let attempts = 0;
        while (getTerrainHeight(newTarget.x, newTarget.z) > 2 && attempts < 20) {
            newTarget = isCoastal ? this.getCoastalPosition() : this.getOpenWaterPosition();
            attempts++;
        }
        
        boat.targetWaypoint = newTarget;
    }
    
    update(delta, time) {
        const allBoats = [...this.sailboats, ...this.cruiseShips];
        
        allBoats.forEach(boat => {
            boat.waypointTimer -= delta;
            
            if (!boat.targetWaypoint || boat.waypointTimer <= 0) {
                this.pickNewWaypoint(boat);
                boat.waypointTimer = 10 + Math.random() * 20;
            }
            
            const direction = new THREE.Vector3()
                .subVectors(boat.targetWaypoint, boat.mesh.position)
                .setY(0)
                .normalize();
            
            boat.mesh.position.x += direction.x * boat.speed * delta;
            boat.mesh.position.z += direction.z * boat.speed * delta;
            
            if (boat.speed > 0.1) {
                boat.mesh.rotation.y = Math.atan2(direction.x, direction.z);
            }
            
            boat.bobTimer += delta * 2;
            boat.rockTimer += delta * 1.5;
            
            const waveHeight = getTerrainHeight(boat.mesh.position.x, boat.mesh.position.z);
            boat.mesh.position.y = waveHeight + Math.sin(boat.bobTimer) * 0.3;
            
            boat.mesh.rotation.z = Math.sin(boat.rockTimer) * 0.05;
            boat.mesh.rotation.x = Math.cos(boat.rockTimer * 0.7) * 0.03;
            
            if (boat instanceof CruiseShip) {
                boat.mesh.children.forEach(child => {
                    if (child.userData.walkOffset !== undefined) {
                        child.position.x += Math.sin(time * 2 + child.userData.walkOffset) * 0.01;
                    }
                });
            }
            
            if (boat instanceof Sailboat && boat.mesh.children[2]) {
                boat.mesh.children[2].rotation.z = Math.sin(time * 3 + boat.bobTimer) * 0.02;
            }
        });
    }
}