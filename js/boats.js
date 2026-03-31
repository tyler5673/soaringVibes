// ========== SAILBOATS & CRUISE SHIPS ==========
const BOAT_WATER_LEVEL = typeof WATER_LEVEL !== 'undefined' ? WATER_LEVEL : 2;

class Sailboat {
    constructor(scene, position) {
        this.scene = scene;
        this.mesh = this.createMesh();
        
        if (position) {
            this.mesh.position.copy(position);
        }
        
        this.velocity = new THREE.Vector3();
        this.speed = 3 + Math.random() * 5;
        this.targetWaypoint = null;
        this.waypointTimer = Math.random() * 10;
        
        this.bobTimer = Math.random() * Math.PI * 2;
        this.rockTimer = Math.random() * Math.PI * 2;
        this.sailFlutterTimer = Math.random() * Math.PI * 2;
        
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
        
        // Main hull - classic schooner shape
        const hullShape = new THREE.Shape();
        hullShape.moveTo(0, 0);
        hullShape.lineTo(15, 0);
        hullShape.lineTo(14, 3);
        hullShape.lineTo(1, 3);
        hullShape.closePath();
        
        const hullGeo = new THREE.ExtrudeGeometry(hullShape, { depth: 5, bevelEnabled: false });
        hullGeo.rotateX(-Math.PI / 2);
        hullGeo.translate(-7.5, 0, -2.5);
        
        const hullMat = new THREE.MeshStandardMaterial({ 
            color: 0x2C1810,
            roughness: 0.7,
            metalness: 0.1
        });
        const hull = new THREE.Mesh(hullGeo, hullMat);
        hull.castShadow = true;
        group.add(hull);
        
        // Deck
        const deckGeo = new THREE.BoxGeometry(14, 0.3, 4.5);
        const deckMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.8 });
        const deck = new THREE.Mesh(deckGeo, deckMat);
        deck.position.set(0, 3.1, 0);
        group.add(deck);
        
        // Cabin
        const cabinGeo = new THREE.BoxGeometry(4, 2.5, 3.5);
        const cabinMat = new THREE.MeshStandardMaterial({ color: 0xF5F5DC, roughness: 0.5 });
        const cabin = new THREE.Mesh(cabinGeo, cabinMat);
        cabin.position.set(-3, 4.4, 0);
        cabin.castShadow = true;
        group.add(cabin);
        
        // Cabin roof
        const roofGeo = new THREE.BoxGeometry(4.5, 0.3, 4);
        const roof = new THREE.Mesh(roofGeo, hullMat);
        roof.position.set(-3, 5.7, 0);
        group.add(roof);
        
        // Main mast (forward)
        const mainMastGeo = new THREE.CylinderGeometry(0.15, 0.2, 18, 8);
        const mastMat = new THREE.MeshStandardMaterial({ color: 0x3D2817, roughness: 0.8 });
        const mainMast = new THREE.Mesh(mainMastGeo, mastMat);
        mainMast.position.set(2, 12, 0);
        group.add(mainMast);
        
        // Fore mast (aft)
        const foreMastGeo = new THREE.CylinderGeometry(0.12, 0.18, 14, 8);
        const foreMast = new THREE.Mesh(foreMastGeo, mastMat);
        foreMast.position.set(-4, 10, 0);
        group.add(foreMast);
        
        // Main sail
        const mainSailShape = new THREE.Shape();
        mainSailShape.moveTo(0, 0);
        mainSailShape.quadraticCurveTo(2.5, 6, 0, 12);
        mainSailShape.lineTo(0, 0);
        
        const mainSailGeo = new THREE.ShapeGeometry(mainSailShape);
        const sailMat = new THREE.MeshStandardMaterial({ 
            color: 0xFEFEFA,
            side: THREE.DoubleSide,
            roughness: 0.9
        });
        const mainSail = new THREE.Mesh(mainSailGeo, sailMat);
        mainSail.position.set(0.1, 3.5, 0);
        mainSail.rotation.y = Math.PI / 2;
        mainSail.userData.isSail = true;
        group.add(mainSail);
        
        // Main sail gaff
        const gaffGeo = new THREE.CylinderGeometry(0.05, 0.05, 3.5, 6);
        const gaff = new THREE.Mesh(gaffGeo, mastMat);
        gaff.position.set(0, 9.5, 0);
        gaff.rotation.z = Math.PI / 2;
        gaff.rotation.x = 0.3;
        group.add(gaff);
        
        // Main boom
        const boomGeo = new THREE.CylinderGeometry(0.06, 0.06, 3, 6);
        const boom = new THREE.Mesh(boomGeo, mastMat);
        boom.position.set(0, 3.5, 0);
        boom.rotation.z = Math.PI / 2;
        group.add(boom);
        
        // Fore sail
        const foreSailShape = new THREE.Shape();
        foreSailShape.moveTo(0, 0);
        foreSailShape.quadraticCurveTo(2, 4.5, 0, 9);
        foreSailShape.lineTo(0, 0);
        
        const foreSailGeo = new THREE.ShapeGeometry(foreSailShape);
        const foreSail = new THREE.Mesh(foreSailGeo, sailMat.clone());
        foreSail.position.set(-2.1, 3, 0);
        foreSail.rotation.y = Math.PI / 2;
        foreSail.userData.isSail = true;
        group.add(foreSail);
        
        // Jib
        const jibShape = new THREE.Shape();
        jibShape.moveTo(0, 0);
        jibShape.quadraticCurveTo(1.5, 3, 0, 7);
        jibShape.lineTo(0, 0);
        
        const jibGeo = new THREE.ShapeGeometry(jibShape);
        const jib = new THREE.Mesh(jibGeo, sailMat.clone());
        jib.position.set(4.1, 3, 0);
        jib.rotation.y = Math.PI / 2;
        jib.userData.isSail = true;
        group.add(jib);
        
        // Railing
        const railMat = new THREE.MeshStandardMaterial({ color: 0x2C1810 });
        for (let side = -1; side <= 1; side += 2) {
            for (let i = 0; i < 6; i++) {
                const postGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.2, 6);
                const post = new THREE.Mesh(postGeo, railMat);
                post.position.set(-6 + i * 2.5, 3.7, side * 2);
                group.add(post);
            }
            
            const railGeo = new THREE.CylinderGeometry(0.03, 0.03, 14, 6);
            const rail = new THREE.Mesh(railGeo, railMat);
            rail.position.set(0, 4.2, side * 2);
            rail.rotation.z = Math.PI / 2;
            group.add(rail);
        }
        
        // Anchor
        const anchorGeo = new THREE.TorusGeometry(0.4, 0.1, 8, 12, Math.PI);
        const anchorMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8 });
        const anchor = new THREE.Mesh(anchorGeo, anchorMat);
        anchor.position.set(6, 1.5, 0);
        anchor.rotation.x = Math.PI / 2;
        group.add(anchor);
        
        // Portholes
        const portholeMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.5 });
        for (let i = 0; i < 3; i++) {
            const portholeGeo = new THREE.CircleGeometry(0.25, 12);
            const porthole = new THREE.Mesh(portholeGeo, portholeMat);
            porthole.position.set(-5 + i * 2, 4.5, 1.76);
            group.add(porthole);
            
            const porthole2 = porthole.clone();
            porthole2.position.z = -1.76;
            group.add(porthole2);
        }
        
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

class Speedboat {
    constructor(scene, position, colors = null) {
        this.scene = scene;
        this.mesh = this.createMesh(colors);
        
        if (position) {
            this.mesh.position.copy(position);
        }
        
        this.velocity = new THREE.Vector3();
        this.speed = 15 + Math.random() * 10;
        this.targetWaypoint = null;
        this.waypointTimer = Math.random() * 8;
        
        this.bobTimer = Math.random() * Math.PI * 2;
        this.rockTimer = Math.random() * Math.PI * 2;
        
        if (scene) {
            scene.add(this.mesh);
        }
    }
    
    static getGeometry(colors) {
        const temp = new Speedboat(null, null, colors);
        return temp.mesh;
    }
    
    createMesh(colors) {
        const group = new THREE.Group();
        
        const primaryColor = colors?.primary || 0x0066CC;
        const secondaryColor = colors?.secondary || 0xFFFFFF;
        
        const hullShape = new THREE.Shape();
        hullShape.moveTo(0, 0);
        hullShape.lineTo(6, 0);
        hullShape.lineTo(5, 1.8);
        hullShape.lineTo(0.5, 1.8);
        hullShape.closePath();
        
        const hullGeo = new THREE.ExtrudeGeometry(hullShape, { depth: 2.5, bevelEnabled: false });
        hullGeo.rotateX(-Math.PI / 2);
        hullGeo.translate(-3, 0, -1.2);
        
        const hullMat = new THREE.MeshStandardMaterial({ color: primaryColor, roughness: 0.3, metalness: 0.6 });
        const hull = new THREE.Mesh(hullGeo, hullMat);
        hull.castShadow = true;
        group.add(hull);
        
        const deckGeo = new THREE.BoxGeometry(5.5, 0.2, 2.2);
        const deckMat = new THREE.MeshStandardMaterial({ color: secondaryColor, roughness: 0.5 });
        const deck = new THREE.Mesh(deckGeo, deckMat);
        deck.position.set(0, 1.7, 0);
        group.add(deck);
        
        const windshieldGeo = new THREE.BoxGeometry(0.1, 1.2, 1.8);
        const windshieldMat = new THREE.MeshStandardMaterial({ 
            color: 0x87CEEB, 
            transparent: true, 
            opacity: 0.6,
            metalness: 0.9,
            roughness: 0.1
        });
        const windshield = new THREE.Mesh(windshieldGeo, windshieldMat);
        windshield.position.set(1, 2.4, 0);
        windshield.rotation.z = -0.3;
        group.add(windshield);
        
        const consoleGeo = new THREE.BoxGeometry(1.5, 0.6, 1.2);
        const consoleMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.7 });
        const console = new THREE.Mesh(consoleGeo, consoleMat);
        console.position.set(1.5, 2.1, 0);
        group.add(console);
        
        const seatGeo = new THREE.BoxGeometry(1.2, 0.5, 1.4);
        const seatMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 });
        
        const seat1 = new THREE.Mesh(seatGeo, seatMat);
        seat1.position.set(-0.5, 2.1, 0);
        group.add(seat1);
        
        const seat2 = new THREE.Mesh(seatGeo, seatMat);
        seat2.position.set(-2, 2.1, 0);
        group.add(seat2);
        
        const engineGeo = new THREE.CylinderGeometry(0.3, 0.4, 1.2, 8);
        const engineMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.8 });
        const engine = new THREE.Mesh(engineGeo, engineMat);
        engine.position.set(-3.2, 1, 0);
        engine.rotation.z = Math.PI / 2;
        group.add(engine);
        
        const trimTabs = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.7 });
        for (let side = -1; side <= 1; side += 2) {
            const tabGeo = new THREE.BoxGeometry(0.8, 0.1, 0.4);
            const tab = new THREE.Mesh(tabGeo, trimTabs);
            tab.position.set(-2.5, 0.3, side * 1.2);
            group.add(tab);
        }
        
        return group;
    }
}

class PirateShip {
    constructor(scene, position) {
        this.scene = scene;
        this.mesh = this.createMesh();
        
        if (position) {
            this.mesh.position.copy(position);
        }
        
        this.velocity = new THREE.Vector3();
        this.speed = 4 + Math.random() * 3;
        this.targetWaypoint = null;
        this.waypointTimer = Math.random() * 15;
        
        this.bobTimer = Math.random() * Math.PI * 2;
        this.rockTimer = Math.random() * Math.PI * 2;
        
        if (scene) {
            scene.add(this.mesh);
        }
    }
    
    static getGeometry() {
        const temp = new PirateShip();
        return temp.mesh;
    }
    
    createMesh() {
        const group = new THREE.Group();
        
        const darkWood = new THREE.MeshStandardMaterial({ color: 0x1a0f00, roughness: 0.85 });
        const oldWood = new THREE.MeshStandardMaterial({ color: 0x2d1f0f, roughness: 0.9 });
        
        const hullShape = new THREE.Shape();
        hullShape.moveTo(0, 0);
        hullShape.lineTo(18, 0);
        hullShape.lineTo(16, 3.5);
        hullShape.lineTo(1, 3.5);
        hullShape.closePath();
        
        const hullGeo = new THREE.ExtrudeGeometry(hullShape, { depth: 5.5, bevelEnabled: false });
        hullGeo.rotateX(-Math.PI / 2);
        hullGeo.translate(-9, 0, -2.75);
        
        const hull = new THREE.Mesh(hullGeo, darkWood);
        hull.castShadow = true;
        group.add(hull);
        
        const deckGeo = new THREE.BoxGeometry(16, 0.4, 5);
        const deck = new THREE.Mesh(deckGeo, oldWood);
        deck.position.set(0, 3.5, 0);
        group.add(deck);
        
        const mainMastGeo = new THREE.CylinderGeometry(0.2, 0.3, 22, 8);
        const mainMast = new THREE.Mesh(mainMastGeo, darkWood);
        mainMast.position.set(2, 15, 0);
        group.add(mainMast);
        
        const foreMastGeo = new THREE.CylinderGeometry(0.15, 0.25, 16, 8);
        const foreMast = new THREE.Mesh(foreMastGeo, darkWood);
        foreMast.position.set(-5, 11, 0);
        group.add(foreMast);
        
        const mizzenMastGeo = new THREE.CylinderGeometry(0.12, 0.2, 12, 8);
        const mizzenMast = new THREE.Mesh(mizzenMastGeo, darkWood);
        mizzenMast.position.set(-7, 9, 0);
        group.add(mizzenMast);
        
        const sailMat = new THREE.MeshStandardMaterial({ 
            color: 0x1a1a1a, 
            side: THREE.DoubleSide,
            roughness: 0.95
        });
        
        const mainSailShape = new THREE.Shape();
        mainSailShape.moveTo(0, 0);
        mainSailShape.quadraticCurveTo(3, 7, 0, 14);
        mainSailShape.lineTo(0, 0);
        const mainSailGeo = new THREE.ShapeGeometry(mainSailShape);
        const mainSail = new THREE.Mesh(mainSailGeo, sailMat);
        mainSail.position.set(0.1, 4, 0);
        mainSail.rotation.y = Math.PI / 2;
        group.add(mainSail);
        
        const foreSailShape = new THREE.Shape();
        foreSailShape.moveTo(0, 0);
        foreSailShape.quadraticCurveTo(2.5, 5, 0, 10);
        foreSailShape.lineTo(0, 0);
        const foreSailGeo = new THREE.ShapeGeometry(foreSailShape);
        const foreSail = new THREE.Mesh(foreSailGeo, sailMat);
        foreSail.position.set(-3.1, 3, 0);
        foreSail.rotation.y = Math.PI / 2;
        group.add(foreSail);
        
        const mizzenSailShape = new THREE.Shape();
        mizzenSailShape.moveTo(0, 0);
        mizzenSailShape.quadraticCurveTo(1.5, 3, 0, 7);
        mizzenSailShape.lineTo(0, 0);
        const mizzenSailGeo = new THREE.ShapeGeometry(mizzenSailShape);
        const mizzenSail = new THREE.Mesh(mizzenSailGeo, sailMat);
        mizzenSail.position.set(-5.1, 3, 0);
        mizzenSail.rotation.y = Math.PI / 2;
        group.add(mizzenSail);
        
        const flagPoleGeo = new THREE.CylinderGeometry(0.05, 0.05, 5, 6);
        const flagPole = new THREE.Mesh(flagPoleGeo, darkWood);
        flagPole.position.set(2, 24, 0);
        group.add(flagPole);
        
        const flagShape = new THREE.Shape();
        flagShape.moveTo(0, 0);
        flagShape.lineTo(2.5, 0.8);
        flagShape.lineTo(0, 1.6);
        flagShape.lineTo(0, 0);
        const flagGeo = new THREE.ShapeGeometry(flagShape);
        const flagMat = new THREE.MeshStandardMaterial({ color: 0x000000, side: THREE.DoubleSide });
        const flag = new THREE.Mesh(flagGeo, flagMat);
        flag.position.set(1.2, 23.5, 0);
        group.add(flag);
        
        const skullGeo = new THREE.SphereGeometry(0.2, 8, 8);
        const skullMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee });
        
        const leftArmGeo = new THREE.BoxGeometry(3, 0.2, 0.2);
        const leftArm = new THREE.Mesh(leftArmGeo, darkWood);
        leftArm.position.set(-3, 15, 1.5);
        leftArm.rotation.z = -0.4;
        group.add(leftArm);
        
        const rightArm = new THREE.Mesh(leftArmGeo, darkWood);
        rightArm.position.set(-3, 15, -1.5);
        rightArm.rotation.z = -0.4;
        group.add(rightArm);
        
        const crowNestGeo = new THREE.BoxGeometry(1.5, 0.8, 1.5);
        const crowNest = new THREE.Mesh(crowNestGeo, darkWood);
        crowNest.position.set(2, 16, 0);
        group.add(crowNest);
        
        const cannonMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.7 });
        for (let i = 0; i < 4; i++) {
            const cannonGeo = new THREE.CylinderGeometry(0.2, 0.25, 1.5, 8);
            const cannon = new THREE.Mesh(cannonGeo, cannonMat);
            cannon.position.set(-2 + i * 2, 4, 2.5);
            cannon.rotation.x = Math.PI / 2;
            cannon.rotation.z = Math.PI / 2;
            group.add(cannon);
        }
        
        const railMat = new THREE.MeshStandardMaterial({ color: 0x1a0f00 });
        for (let side = -1; side <= 1; side += 2) {
            for (let i = 0; i < 7; i++) {
                const postGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.5, 6);
                const post = new THREE.Mesh(postGeo, railMat);
                post.position.set(-7 + i * 2.5, 4.2, side * 2.3);
                group.add(post);
            }
        }
        
        return group;
    }
}

class BoatManager {
    constructor(scene) {
        this.scene = scene;
        this.sailboats = [];
        this.speedboats = [];
        this.pirateShips = [];
        this.cruiseShips = [];
        
        console.log('BoatManager: Creating boats, islandPositions available:', typeof islandPositions !== 'undefined');
        
        if (typeof islandPositions === 'undefined') {
            console.warn('BoatManager: islandPositions not defined yet, boats will use default positions');
        }
        
        this.createSailboats(105);
        this.createSpeedboats(45);
        this.createPirateShips(15);
        this.createCruiseShips(30);
        
        console.log('BoatManager: Created', 
            this.sailboats.length, 'sailboats,', 
            this.speedboats.length, 'speedboats,',
            this.pirateShips.length, 'pirate ships,',
            this.cruiseShips.length, 'cruise ships');
    }
    
    getRandomBoatColors() {
        const primaries = [0x0066CC, 0xFF4444, 0x00AA44, 0xFFAA00, 0x8800FF, 0xFF0088, 0x00CCCC, 0xDDDD00];
        const secondaries = [0xFFFFFF, 0xFFFFFF, 0xFFFFFF, 0xF0F0F0, 0xEEEEEE, 0xCCCCCC];
        
        return {
            primary: primaries[Math.floor(Math.random() * primaries.length)],
            secondary: secondaries[Math.floor(Math.random() * secondaries.length)]
        };
    }
    
    createSailboats(count) {
        const coastalCount = Math.floor(count * 0.7);
        
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
    
    createSpeedboats(count) {
        const coastalCount = Math.floor(count * 0.6);
        
        for (let i = 0; i < coastalCount; i++) {
            const pos = this.getCoastalPosition();
            const colors = this.getRandomBoatColors();
            const boat = new Speedboat(this.scene, pos, colors);
            this.speedboats.push(boat);
        }
        
        for (let i = 0; i < count - coastalCount; i++) {
            const pos = this.getOpenWaterPosition();
            const colors = this.getRandomBoatColors();
            const boat = new Speedboat(this.scene, pos, colors);
            this.speedboats.push(boat);
        }
    }
    
    createPirateShips(count) {
        for (let i = 0; i < count; i++) {
            const pos = this.getOpenWaterPosition();
            const ship = new PirateShip(this.scene, pos);
            this.pirateShips.push(ship);
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
            const ship = new CruiseShip(this.scene, new THREE.Vector3(pos.x, BOAT_WATER_LEVEL, pos.z));
            this.cruiseShips.push(ship);
        }
    }
    
    getCoastalPosition() {
        const island = islandPositions[Math.floor(Math.random() * islandPositions.length)];
        const angle = Math.random() * Math.PI * 2;
        const distance = 200 + Math.random() * 300;
        
        return new THREE.Vector3(
            island.x + Math.cos(angle) * distance,
            BOAT_WATER_LEVEL,
            island.z + Math.sin(angle) * distance
        );
    }
    
    getOpenWaterPosition() {
        return new THREE.Vector3(
            (Math.random() - 0.5) * 20000,
            BOAT_WATER_LEVEL,
            (Math.random() - 0.5) * 20000
        );
    }
    
    pickNewWaypoint(boat) {
        let isCoastal = false;
        if (boat instanceof Sailboat || boat instanceof Speedboat) {
            const idx = boat instanceof Sailboat ? this.sailboats.indexOf(boat) : this.speedboats.indexOf(boat);
            const coastalCount = boat instanceof Sailboat ? Math.floor(this.sailboats.length * 0.7) : Math.floor(this.speedboats.length * 0.6);
            isCoastal = idx >= 0 && idx < coastalCount;
        }
        
        let newTarget;
        if (isCoastal) {
            newTarget = this.getCoastalPosition();
        } else {
            newTarget = this.getOpenWaterPosition();
        }
        
        if (typeof getTerrainHeight === 'function' && typeof islandPositions !== 'undefined') {
            let attempts = 0;
            while (getTerrainHeight(newTarget.x, newTarget.z) > BOAT_WATER_LEVEL && attempts < 20) {
                newTarget = isCoastal ? this.getCoastalPosition() : this.getOpenWaterPosition();
                attempts++;
            }
        }
        
        boat.targetWaypoint = newTarget;
    }
    
    update(delta, time) {
        const allBoats = [
            ...this.sailboats, 
            ...this.speedboats,
            ...this.pirateShips,
            ...this.cruiseShips
        ];
        
        allBoats.forEach(boat => {
            boat.waypointTimer -= delta;
            
            if (!boat.targetWaypoint || boat.waypointTimer <= 0) {
                this.pickNewWaypoint(boat);
                const baseTime = boat instanceof CruiseShip ? 20 : (boat instanceof Speedboat ? 5 : 15);
                boat.waypointTimer = baseTime + Math.random() * 10;
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
            
            boat.mesh.position.y = BOAT_WATER_LEVEL + Math.sin(boat.bobTimer) * 0.3;
            
            boat.mesh.rotation.z = Math.sin(boat.rockTimer) * 0.05;
            boat.mesh.rotation.x = Math.cos(boat.rockTimer * 0.7) * 0.03;
            
            if (boat instanceof CruiseShip) {
                boat.mesh.children.forEach(child => {
                    if (child.userData.walkOffset !== undefined) {
                        child.position.x += Math.sin(time * 2 + child.userData.walkOffset) * 0.01;
                    }
                });
            }
            
            if ((boat instanceof Sailboat || boat instanceof PirateShip) && boat.mesh.children.length > 2) {
                const sailChild = boat.mesh.children.find(c => c.userData && c.userData.isSail);
                if (sailChild) {
                    sailChild.rotation.z = Math.sin(time * 3 + boat.bobTimer) * 0.02;
                }
            }
        });
    }
}

window.Sailboat = Sailboat;
window.Speedboat = Speedboat;
window.PirateShip = PirateShip;
window.CruiseShip = CruiseShip;
window.BoatManager = BoatManager;
