// tests/aircraft-spawn.test.js - Tests for aircraft spawn rotation/velocity alignment

const THREE = require('../tests/__mocks__/three.js');

global.THREE = THREE;

require('../js/utils.js');

class Aircraft {
    constructor() {
        this.position = new THREE.Vector3(0, 760, -100);
        this.velocity = new THREE.Vector3(0, 0, 60);
        this.rotation = new THREE.Euler(0, Math.PI, 0, 'YXZ');
        this.controlInput = { pitch: 0, roll: 0, yaw: 0 };
        this.throttle = 0.5;
        
        this.mesh = null;
    }
    
    setRandomStartPosition() {
        const islandPositions = [
            { name: 'maui', x: 0, z: 0 },
            { name: 'big-island', x: 3200, z: -6400 },
            { name: 'oahu', x: -6400, z: -2800 },
            { name: 'kauai', x: -12000, z: -4000 },
            { name: 'molokai', x: -1400, z: -3600 },
            { name: 'lanai', x: 1400, z: -3200 },
            { name: 'niihau', x: -9600, z: -4800 },
            { name: 'kahoolawe', x: 2200, z: -2200 }
        ];
        
        const island = islandPositions[0]; // Use maui for predictable tests
        
        const offsetDistance = 1000;
        const offsetAngle = Math.PI / 4; // 45 degrees for predictable direction
        
        const startX = island.x + Math.cos(offsetAngle) * offsetDistance;
        const startZ = island.z + Math.sin(offsetAngle) * offsetDistance;
        
        let terrainHeight = 0;
        
        const altitudeAboveTerrain = 500;
        const finalAltitude = Math.max(terrainHeight + altitudeAboveTerrain, 152);
        
        this.position.set(startX, finalAltitude, startZ);
        
        const dirToIsland = new THREE.Vector3(island.x - startX, 0, island.z - startZ).normalize();
        
        const angleVariation = 0;
        const angleToIsland = Math.atan2(dirToIsland.z, dirToIsland.x);
        const finalAngle = angleToIsland + angleVariation;
        
        const speed = 60;
        
        // Set velocity based on angle - use cos for X, sin for Z
        this.velocity.set(
            Math.cos(finalAngle) * speed,
            0,
            Math.sin(finalAngle) * speed
        );
        
        // Set rotation to face velocity direction
        // Simply compute angle from velocity components
        // Initial spawn works: v=(0,60), rotY=PI, forward=(0,1)=velocity
        // So: rotation.y = Math.atan2(vx, vz) + PI
        const vx = this.velocity.x;
        const vz = this.velocity.z;
        this.rotation.x = 0;
        this.rotation.y = Math.atan2(vx, vz) + Math.PI;
        this.rotation.z = 0;
        
        // Return debug info for testing
        return {
            position: this.position.clone(),
            velocity: this.velocity.clone(),
            rotation: { x: this.rotation.x, y: this.rotation.y, z: this.rotation.z },
            forward: this.getForwardVector(),
            velocityDir: this.velocity.clone().normalize()
        };
    }
    
    getForwardVector() {
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyEuler(this.rotation);
        return forward;
    }
}

describe('Aircraft Spawn Rotation', () => {
    let aircraft;
    
    beforeEach(() => {
        aircraft = new Aircraft();
    });
    
    test('forward vector should point in velocity direction (dot product = 1)', () => {
        const result = aircraft.setRandomStartPosition();
        
        const dot = result.forward.dot(result.velocityDir);
        
        console.log('=== AIRCRAFT SPAWN TEST ===');
        console.log('Velocity direction:', `(${result.velocityDir.x.toFixed(3)}, ${result.velocityDir.z.toFixed(3)})`);
        console.log('Forward vector:', `(${result.forward.x.toFixed(3)}, ${result.forward.z.toFixed(3)})`);
        console.log('Dot product:', dot.toFixed(4));
        console.log('===========================');
        
        // The forward direction should align with velocity direction
        expect(dot).toBeCloseTo(1, 2);
    });
    
    test('should face toward island center', () => {
        const result = aircraft.setRandomStartPosition();
        
        // Maui is at (0, 0), spawn is at (707, 707) - northeast of island
        // Direction to island should be southwest
        const dirToIsland = new THREE.Vector3(-707, 0, -707).normalize();
        
        const dot = result.forward.dot(dirToIsland);
        
        console.log('Dir to island:', `(${dirToIsland.x.toFixed(3)}, ${dirToIsland.z.toFixed(3)})`);
        console.log('Forward:', `(${result.forward.x.toFixed(3)}, ${result.forward.z.toFixed(3)})`);
        console.log('Dot with dir to island:', dot.toFixed(4));
        
        // Should be flying toward island (dot > 0 means same general direction)
        expect(dot).toBeGreaterThan(0.5);
    });
});

describe('THREE.js Euler rotation behavior', () => {
    test('rotation.y = 0 should face -Z (north)', () => {
        const rotation = new THREE.Euler(0, 0, 0, 'YXZ');
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyEuler(rotation);
        
        console.log('Rotation 0,0,0 => forward:', `(${forward.x.toFixed(3)}, ${forward.z.toFixed(3)})`);
        
        expect(forward.z).toBeCloseTo(-1, 2);
    });
    
    test('rotation.y = PI/2 should face -X (west)', () => {
        const rotation = new THREE.Euler(0, Math.PI / 2, 0, 'YXZ');
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyEuler(rotation);
        
        console.log('Rotation 0,PI/2,0 => forward:', `(${forward.x.toFixed(3)}, ${forward.z.toFixed(3)})`);
        
        expect(forward.x).toBeCloseTo(-1, 2);
    });
    
    test('rotation.y = PI should face +Z (south)', () => {
        const rotation = new THREE.Euler(0, Math.PI, 0, 'YXZ');
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyEuler(rotation);
        
        console.log('Rotation 0,PI,0 => forward:', `(${forward.x.toFixed(3)}, ${forward.z.toFixed(3)})`);
        
        expect(forward.z).toBeCloseTo(1, 2);
    });
    
    test('rotation.y = -PI/2 should face +X (east)', () => {
        const rotation = new THREE.Euler(0, -Math.PI / 2, 0, 'YXZ');
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyEuler(rotation);
        
        console.log('Rotation 0,-PI/2,0 => forward:', `(${forward.x.toFixed(3)}, ${forward.z.toFixed(3)})`);
        
        expect(forward.x).toBeCloseTo(1, 2);
    });
});

describe('Math.atan2 behavior', () => {
    test('atan2(0, 1) = 0 when velocity is in +Z direction', () => {
        const vx = 0;
        const vz = 1;
        const angle = Math.atan2(vx, vz);
        
        console.log('atan2(0, 1) =', (angle * 180 / Math.PI).toFixed(1), 'degrees');
        
        expect(angle).toBeCloseTo(0, 2);
    });
    
    test('atan2(1, 0) = 90 degrees when velocity is in +X direction', () => {
        const vx = 1;
        const vz = 0;
        const angle = Math.atan2(vx, vz);
        
        console.log('atan2(1, 0) =', (angle * 180 / Math.PI).toFixed(1), 'degrees');
        
        expect(angle).toBeCloseTo(Math.PI / 2, 2);
    });
    
    test('atan2(-1, 0) = -90 degrees when velocity is in -X direction', () => {
        const vx = -1;
        const vz = 0;
        const angle = Math.atan2(vx, vz);
        
        console.log('atan2(-1, 0) =', (angle * 180 / Math.PI).toFixed(1), 'degrees');
        
        expect(angle).toBeCloseTo(-Math.PI / 2, 2);
    });
});
