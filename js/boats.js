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
        
        // Hull profile (side view) - teardrop cross-section, pointed bow forward (+X), wider stern at origin
        const hullProfile = new THREE.Shape();
        hullProfile.moveTo(0, 1);
        hullProfile.lineTo(4, 2.5);
        hullProfile.quadraticCurveTo(12, 3, 16, 1);
        hullProfile.lineTo(16, -1);
        hullProfile.quadraticCurveTo(12, -2, 4, -2.5);
        hullProfile.lineTo(0, -1);
        hullProfile.closePath();
        
        // Extrude along Z axis (depth = beam/width), then rotate to lay flat
        const hullGeo = new THREE.ExtrudeGeometry(hullProfile, { 
            depth: 5,           // Beam (width) of boat
            bevelEnabled: false 
        });
        hullGeo.rotateX(-Math.PI / 2);       // Lay flat
        hullGeo.translate(0, 1.8, -2.5);     // Center and position (lift to water level)
        
        const hullMat = new THREE.MeshStandardMaterial({ 
            color: 0xFFFFFF,
            roughness: 0.4,
            metalness: 0.1
        });
        const hull = new THREE.Mesh(hullGeo, hullMat);
        hull.castShadow = true;
        group.add(hull);
        
        // Keel - weighted fin for stability (missing from original)
        const keelShape = new THREE.Shape();
        keelShape.moveTo(0, 0);
        keelShape.lineTo(1.5, -3.5);
        keelShape.lineTo(2, -10);
        keelShape.lineTo(-2, -10);
        keelShape.lineTo(-1.5, -3.5);
        keelShape.closePath();
        
        const keelGeo = new THREE.ExtrudeGeometry(keelShape, { 
            depth: 0.6, 
            bevelEnabled: false 
        });
        keelGeo.rotateX(-Math.PI / 2);
        keelGeo.translate(-1, -1.7, 0);
        
        const keelMat = new THREE.MeshStandardMaterial({ 
            color: 0x333333,
            roughness: 0.6,
            metalness: 0.5
        });
        const keel = new THREE.Mesh(keelGeo, keelMat);
        keel.castShadow = true;
        group.add(keel);
        
        // Deck line stripe - runs along centerline from stern to bow
        const deckStripeGeo = new THREE.BoxGeometry(16, 0.15, 4.8);
        const deckStripeMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
        const deckStripe = new THREE.Mesh(deckStripeGeo, deckStripeMat);
        deckStripe.position.set(7, 6.2, 0);
        group.add(deckStripe);
        
        // Cabin structure (simplified) - sits on deck near stern
        const cabinTopGeo = new THREE.BoxGeometry(5, 0.3, 3.8);
        const cabinTopMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
        const cabinTop = new THREE.Mesh(cabinTopGeo, cabinTopMat);
        cabinTop.position.set(1.5, 6.5, 0);
        group.add(cabinTop);
        
        // Mast - single central mast with slight aft rake (correct for sloop)
        // Positioned ~2 units from stern, slightly forward of center
        const mastHeight = 22;
        const mastRadius = 0.18;
        const mainMastGeo = new THREE.CylinderGeometry(mastRadius * 0.7, mastRadius, mastHeight, 10);
        const mastMat = new THREE.MeshStandardMaterial({ color: 0xEEEEEE, roughness: 0.5 });
        const mainMast = new THREE.Mesh(mainMastGeo, mastMat);
        // Mast base at deck level (y=6.2), centered on hull width, ~2 units from stern
        mainMast.position.set(2, mastHeight / 2 + 6.2 - 1, 0);
        group.add(mainMast);
        
        // Standing rigging - shrouds (side support) and stays (fore/aft support)
        const riggingMat = new THREE.MeshStandardMaterial({ 
            color: 0x888888, 
            metalness: 0.9, 
            roughness: 0.3 
        });
        
        // Mast top position (where shrouds attach)
        const mastTopY = mainMast.position.y;
        const mastBaseY = mainMast.position.y - mastHeight + 1;
        
        // Port side shroud - from mast top to deck edge on port side
        const portShroudGeo = new THREE.CylinderGeometry(0.02, 0.02, Math.sqrt(mastHeight * mastHeight + 3 * 3), 4);
        const portShroud = new THREE.Mesh(portShroudGeo, riggingMat);
        // Center the shroud between deck edge and mast top
        portShroud.position.set(2, mastTopY - (mastHeight - 5) / 2, 2.5);
        portShroud.rotation.z = Math.atan2(mastHeight - 5, 2.5);
        group.add(portShroud);
        
        // Starboard side shroud - mirror of port
        const starboardShroudGeo = new THREE.CylinderGeometry(0.02, 0.02, Math.sqrt(mastHeight * mastHeight + 3 * 3), 4);
        const starboardShroud = new THREE.Mesh(starboardShroudGeo, riggingMat);
        starboardShroud.position.set(2, mastTopY - (mastHeight - 5) / 2, -2.5);
        starboardShroud.rotation.z = -Math.atan2(mastHeight - 5, 2.5);
        group.add(starboardShroud);
        
        // Forestay - from mast top to bow
        const forestayGeo = new THREE.CylinderGeometry(0.025, 0.02, Math.sqrt((mastHeight + 3) * (mastHeight + 3) + 14 * 14), 4);
        const forestay = new THREE.Mesh(forestayGeo, riggingMat);
        forestay.position.set(2 - 7, mastTopY - (mastHeight + 3) / 2, 0.5);
        forestay.rotation.z = Math.atan2(mastHeight + 3, 14);
        group.add(forestay);
        
        // Backstay - from mast top to stern
        const backstayGeo = new THREE.CylinderGeometry(0.03, 0.02, Math.sqrt((mastHeight + 2) * (mastHeight + 2) + 10 * 10), 4);
        const backstay = new THREE.Mesh(backstayGeo, riggingMat);
        backstay.position.set(2 + 5, mastTopY - (mastHeight + 2) / 2, 0.5);
        backstay.rotation.z = -Math.atan2(mastHeight + 2, 10);
        group.add(backstay);
        
        // Bermuda mainsail - triangular sail attached to mast and boom
        const sailMat = new THREE.MeshStandardMaterial({ 
            color: 0xFFF8E7,  // Warm white canvas
            side: THREE.DoubleSide,
            roughness: 0.95
        });
        
        // Mainsail shape (in local coordinates relative to mast position)
        const mainSailShape = new THREE.Shape();
        mainSailShape.moveTo(0, 1);           // Boom attachment at deck level (+y from mast base)
        mainSailShape.lineTo(0.3, mastHeight - 4); // Peak near top of mast (with aft rake offset)
        mainSailShape.quadraticCurveTo(-2, mastHeight / 2, -10, 1); // Leech curves to boom end
        mainSailShape.closePath();
        
        const mainSailGeo = new THREE.ShapeGeometry(mainSailShape);
        const mainSail = new THREE.Mesh(mainSailGeo, sailMat);
        // Position relative to mast: centered on mast with correct Y offset
        mainSail.position.set(2.15, 3 + (mastHeight - 4) / 2, 0);
        mainSail.userData.isSail = true;
        group.add(mainSail);
        
        // Main boom - horizontal spar at base of mainsail
        const boomLength = 9;
        const boomGeo = new THREE.CylinderGeometry(0.06, 0.04, boomLength + 1, 8);
        const boomMat = new THREE.MeshStandardMaterial({ color: 0x3D2817 });
        const boom = new THREE.Mesh(boomGeo, boomMat);
        // Boom extends from gooseneck (near mast) to sail clew
        boom.position.set(-3.5, 7.6, 0.3);
        boom.rotation.z = -Math.PI / 12; // Slight down angle
        group.add(boom);
        
        // Gooseneck - connection point of boom to mast
        const gooseneckGeo = new THREE.BoxGeometry(0.3, 0.4, 0.3);
        const gooseneck = new THREE.Mesh(gooseneckGeo, mastMat);
        gooseneck.position.set(-1, 7.6, 0.3);
        group.add(gooseneck);
        
        // Headsail/Jib - triangular sail forward of mast (cutter rig adds versatility)
        const jibShape = new THREE.Shape();
        jibShape.moveTo(0, 1);              // Tack at deck level
        jibShape.lineTo(-0.5, mastHeight - 8); // Head near top of mast
        jibShape.lineTo(-14, 2);             // Clew forward (bow area)
        jibShape.closePath();
        
        const jibGeo = new THREE.ShapeGeometry(jibShape);
        const jib = new THREE.Mesh(jibGeo, sailMat.clone());
        jib.position.set(2 - 7, 3 + (mastHeight - 8) / 2, 0.5);
        jib.userData.isSail = true;
        group.add(jib);
        
        // Staysail - inner forestay sail for added versatility (cutter configuration)
        const staysailShape = new THREE.Shape();
        staysailShape.moveTo(0, 1);
        staysailShape.lineTo(-0.2, mastHeight - 12);
        staysailShape.lineTo(-6, 1.5);
        staysailShape.closePath();
        
        const staysailGeo = new THREE.ShapeGeometry(staysailShape);
        const staysail = new THREE.Mesh(staysailGeo, sailMat.clone());
        staysail.position.set(2 - 3.5, 3 + (mastHeight - 12) / 2, 0.3);
        staysail.userData.isSail = true;
        group.add(staysail);
        
        // Hiking rails - side rails for crew to sit on along the hull sides
        const railMat = new THREE.MeshStandardMaterial({ color: 0x4A4A4A });
        
        for (let i = 0; i < 6; i++) {
            const railX = 3 + i * 2.5;  // Along the hull from stern to bow area
            const railHeight = 4 + i * 0.08;  // Slight upward curve following deck
            
            // Port side hiking stick
            const portStickGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.2, 6);
            const portStick = new THREE.Mesh(portStickGeo, railMat);
            portStick.position.set(railX, railHeight, 2.5);
            group.add(portStick);
            
            // Starboard side hiking stick
            const starboardStick = new THREE.Mesh(portStickGeo, railMat.clone());
            starboardStick.position.set(railX, railHeight, -2.5);
            group.add(starboardStick);
        }
        
        // Stern railing - at the back of the boat
        for (let side = -1; side <= 1; side += 2) {
            const sternPostGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.8, 6);
            for (let i = 0; i < 3; i++) {
                const post = new THREE.Mesh(sternPostGeo, railMat);
                // Stern is at x=16 (bow), so posts go from x=15 to x=9
                const sternX = 16 - 1.2 * i;  
                post.position.set(sternX, 4 + i * 0.05, side * 2);
                group.add(post);
            }
        }
        
        // Bow pulpit (front railing)
        for (let side = -1; side <= 1; side += 2) {
            const bowPostGeo = new THREE.CylinderGeometry(0.04, 0.04, 1, 6);
            for (let i = 0; i < 2; i++) {
                const post = new THREE.Mesh(bowPostGeo, railMat);
                // Bow area at x=0-3
                const bowX = 1 + i * 1.5;
                post.position.set(bowX, 4.2 + i * 0.1, side * 2.1);
                group.add(post);
            }
        }
        
        // Winches - two primary winches near cockpit (aft of mast)
        const winchGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.25, 16);
        const winchMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
        
        for (let side = -1; side <= 1; side += 2) {
            const winch = new THREE.Mesh(winchGeo, winchMat.clone());
            // Winches positioned near mast but slightly aft
            winch.position.set(1.5, 3.8, side * 2);
            group.add(winch);
        }
        
        // Portholes - circular windows on hull sides (properly sized and spaced)
        const portholeMat = new THREE.MeshStandardMaterial({ 
            color: 0x1a3a5c, 
            metalness: 0.6, 
            roughness: 0.2,
            transparent: true,
            opacity: 0.9
        });
        
        // Place portholes along the hull sides at waterline level
        for (let i = 0; i < 5; i++) {
            const portholeX = 4 + i * 2.6;  // Spread from mid-hull toward bow
            const portholeGeo = new THREE.CircleGeometry(0.18, 16);
            
            const porthole = new THREE.Mesh(portholeGeo, portholeMat);
            porthole.position.set(portholeX, 3.2, 2.45);  // Port side
            group.add(porthole);
            
            const porthole2 = porthole.clone();
            porthole2.position.z = -2.45;  // Starboard side
            group.add(porthole2);
        }
        
        // Rudder - visible at stern for steering control (attached to transom)
        const rudderGeo = new THREE.BoxGeometry(0.8, 2.5, 0.15);
        const rudderMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
        const rudder = new THREE.Mesh(rudderGeo, rudderMat);
        // Stern is at x=16 (bow end), rudder hangs below hull
        rudder.position.set(15.5, -3, 0);
        group.add(rudder);
        
        // Stern cleats - for securing lines (at transom)
        const cleatShape = new THREE.Shape();
        cleatShape.moveTo(0, 0);
        cleatShape.lineTo(0.4, 0);
        cleatShape.lineTo(0.5, 0.3);
        cleatShape.lineTo(0.2, 0.3);
        cleatShape.lineTo(0, 0.6);
        cleatShape.lineTo(-0.2, 0.3);
        cleatShape.lineTo(0.1, 0.3);
        cleatShape.lineTo(0.2, 0);
        cleatShape.closePath();
        
        const cleatGeo = new THREE.ExtrudeGeometry(cleatShape, { depth: 0.15 });
        const cleatMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
        
        for (let side = -1; side <= 1; side += 2) {
            const cleat = new THREE.Mesh(cleatGeo, cleatMat.clone());
            // Cleats at stern transom area
            cleat.position.set(15.5, 3.2, side * 2);
            group.add(cleat);
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
        this.speed = 3 + Math.random() * 5;
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
        
        const hullGeo = new THREE.BoxGeometry(300, 20, 45);
        const hullMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.3 });
        const hull = new THREE.Mesh(hullGeo, hullMat);
        hull.position.y = 12;
        hull.castShadow = true;
        group.add(hull);
        
        const stripeGeo = new THREE.BoxGeometry(280, 4, 45.1);
        const stripeMat = new THREE.MeshStandardMaterial({ color: 0xCC0000 });
        const stripe = new THREE.Mesh(stripeGeo, stripeMat);
        stripe.position.y = 15;
        group.add(stripe);
        
        for (let i = 0; i < 7; i++) {
            const deckWidth = 42 - i * 1.5;
            const deckHeight = 6;
            const deckGeo = new THREE.BoxGeometry(280, deckHeight, deckWidth);
            const deckMat = new THREE.MeshStandardMaterial({ color: 0xDDDDDD });
            const deck = new THREE.Mesh(deckGeo, deckMat);
            deck.position.set(0, 23 + i * 6.5, 0);
            deck.castShadow = true;
            group.add(deck);
            
            for (let side = -1; side <= 1; side += 2) {
                for (let w = 0; w < 24; w++) {
                    const windowGeo = new THREE.BoxGeometry(6, 3, 0.5);
                    const windowMat = new THREE.MeshStandardMaterial({ 
                        color: 0xFFFFAA, 
                        emissive: 0xFFFFAA,
                        emissiveIntensity: this.windowLightsOn ? 0.5 : 0
                    });
                    const windowMesh = new THREE.Mesh(windowGeo, windowMat);
                    windowMesh.position.set(-120 + w * 10, 26 + i * 6.5, side * (deckWidth / 2 - 0.3));
                    group.add(windowMesh);
                }
            }
        }
        
        const bridgeGeo = new THREE.BoxGeometry(40, 18, 35);
        const bridgeMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
        const bridge = new THREE.Mesh(bridgeGeo, bridgeMat);
        bridge.position.set(-90, 76, 0);
        bridge.castShadow = true;
        group.add(bridge);
        
        for (let i = 0; i < 3; i++) {
            const stackHeight = 15 + i * 3;
            const stackGeo = new THREE.CylinderGeometry(6, 8, stackHeight, 12);
            const stackMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
            const stack = new THREE.Mesh(stackGeo, stackMat);
            stack.position.set(70 + i * 15, 61 + stackHeight / 2, 0);
            group.add(stack);
        }
        
        for (let side = -1; side <= 1; side += 2) {
            for (let i = 0; i < 6; i++) {
                const boatGeo = new THREE.BoxGeometry(12, 3, 5);
                const boatMat = new THREE.MeshStandardMaterial({ color: 0xFF6600 });
                const boat = new THREE.Mesh(boatGeo, boatMat);
                boat.position.set(-80 + i * 40, 34.5, side * 18);
                group.add(boat);
            }
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
        
        this.boatMaxDist = 8000;
        this.densityMultiplier = 1.0;
        this.enabled = true;
        
        console.log('BoatManager: Creating boats, islandPositions available:', typeof islandPositions !== 'undefined');
        
        if (typeof islandPositions === 'undefined') {
            console.warn('BoatManager: islandPositions not defined yet, boats will use default positions');
        }
        
        this.createSailboats(105);
        this.createSpeedboats(45);
        this.createPirateShips(15);
        
        const oahuShip = new CruiseShip(this.scene, new THREE.Vector3(-6400, BOAT_WATER_LEVEL + 15, -2800));
        this.cruiseShips.push(oahuShip);
        console.log('Cruise ship created at:', oahuShip.mesh.position.clone());
        
        console.log('BoatManager: Created', 
            this.sailboats.length, 'sailboats,', 
            this.speedboats.length, 'speedboats,',
            this.pirateShips.length, 'pirate ships');
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
        for (let i = 0; i < count; i++) {
            const pos = this.getCruiseShipPosition();
            const ship = new CruiseShip(this.scene, pos);
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
    
    getCruiseShipPosition() {
        const island = islandPositions[Math.floor(Math.random() * islandPositions.length)];
        const angle = Math.random() * Math.PI * 2;
        const distance = 500 + Math.random() * 1500;
        
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
        if (boat instanceof CruiseShip) {
            newTarget = this.getCruiseShipPosition();
        } else if (boat instanceof PirateShip) {
            newTarget = this.getCoastalPosition();
        } else if (isCoastal) {
            newTarget = this.getCoastalPosition();
        } else {
            newTarget = this.getOpenWaterPosition();
        }
        
        if (typeof getTerrainHeight === 'function' && typeof islandPositions !== 'undefined') {
            let attempts = 0;
            while (getTerrainHeight(newTarget.x, newTarget.z) > BOAT_WATER_LEVEL && attempts < 20) {
                if (boat instanceof CruiseShip) {
                    newTarget = this.getCruiseShipPosition();
                } else if (boat instanceof PirateShip) {
                    newTarget = this.getCoastalPosition();
                } else {
                    newTarget = isCoastal ? this.getCoastalPosition() : this.getOpenWaterPosition();
                }
                attempts++;
            }
        }
        
        boat.targetWaypoint = newTarget;
    }
    
    update(delta, time, camera) {
        const allBoats = [
            ...this.sailboats, 
            ...this.speedboats,
            ...this.pirateShips,
            ...this.cruiseShips
        ];
        
        const camPos = camera ? camera.position : new THREE.Vector3();
        const effectiveCount = Math.floor(allBoats.length * this.densityMultiplier);
        
        allBoats.forEach((boat, index) => {
            if (!this.enabled || index >= effectiveCount) {
                boat.mesh.visible = false;
                return;
            }
            
            const dist = camPos.distanceTo(boat.mesh.position);
            if (dist > this.boatMaxDist) {
                boat.mesh.visible = false;
                return;
            }
            
            boat.mesh.visible = true;
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
