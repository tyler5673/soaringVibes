// Mock window object
global.window = {};

// Mock utility functions
global.degreesToRadians = (deg) => deg * Math.PI / 180;
global.radiansToDegrees = (rad) => rad * 180 / Math.PI;
global.clamp = (val, min, max) => Math.max(min, Math.min(max, val));
global.lerp = (a, b, t) => a + (b - a) * t;

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
        applyEuler(euler) {
            const x = this.x, y = this.y, z = this.z;
            const c1 = Math.cos(euler.x / 2);
            const c2 = Math.cos(euler.y / 2);
            const c3 = Math.cos(euler.z / 2);
            const s1 = Math.sin(euler.x / 2);
            const s2 = Math.sin(euler.y / 2);
            const s3 = Math.sin(euler.z / 2);
            
            const ax = c1 * c2 * c3 + s1 * s2 * s3;
            const ay = s1 * c2 * c3 - c1 * s2 * s3;
            const az = c1 * s2 * c3 + s1 * c2 * s3;
            const aw = c1 * c2 * s3 - s1 * s2 * c3;
            
            const q = { x: ay, y: az, z: ax, w: aw };
            const qx = q.x, qy = q.y, qz = q.z, qw = q.w;
            
            const ix = qw * x + qy * z - qz * y;
            const iy = qw * y + qz * x - qx * z;
            const iz = qw * z + qx * y - qy * x;
            const iw = -qx * x - qy * y - qz * z;
            
            this.x = ix * qw + iw * -qx + iy * -qz - iz * -qy;
            this.y = iy * qw + iw * -qy + iz * -qx - ix * -qz;
            this.z = iz * qw + iw * -qz + ix * -qy - iy * -qx;
            
            return this;
        }
        dot(v) {
            return this.x * v.x + this.y * v.y + this.z * v.z;
        }
        angleTo(v) {
            const dot = this.dot(v);
            const len1 = this.length();
            const len2 = v.length();
            const cos = dot / (len1 * len2);
            return Math.acos(Math.max(-1, Math.min(1, cos)));
        }
        crossVectors(a, b) {
            const ax = a.x, ay = a.y, az = a.z;
            const bx = b.x, by = b.y, bz = b.z;
            this.x = ay * bz - az * by;
            this.y = az * bx - ax * bz;
            this.z = ax * by - ay * bx;
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
            this.children = [];
        }
        add(child) {
            this.children.push(child);
        }
    },
    Mesh: class Mesh {
        constructor(geometry, material) {
            this.geometry = geometry;
            this.material = material;
            this.position = new THREE.Vector3();
            this.rotation = new THREE.Euler();
            this.scale = new THREE.Vector3(1, 1, 1);
            this.userData = {};
        }
    },
    MeshStandardMaterial: class MeshStandardMaterial {
        constructor(params) {
            Object.assign(this, params);
        }
    },
    BoxGeometry: class BoxGeometry {
        constructor(width, height, depth) {
            this.parameters = { width, height, depth };
        }
        rotateX() { return this; }
        rotateY() { return this; }
        rotateZ() { return this; }
    },
    CylinderGeometry: class CylinderGeometry {
        constructor(radiusTop, radiusBottom, height, segments) {
            this.parameters = { radiusTop, radiusBottom, height, segments };
        }
        rotateX() { return this; }
        rotateY() { return this; }
        rotateZ() { return this; }
    },
    SphereGeometry: class SphereGeometry {
        constructor(radius, widthSegments, heightSegments) {
            this.parameters = { radius, widthSegments, heightSegments };
        }
        rotateX() { return this; }
        rotateY() { return this; }
        rotateZ() { return this; }
    },
    TorusGeometry: class TorusGeometry {
        constructor(radius, tube, radialSegments, tubularSegments) {
            this.parameters = { radius, tube, radialSegments, tubularSegments };
        }
        rotateX() { return this; }
        rotateY() { return this; }
        rotateZ() { return this; }
    },
    DoubleSide: 'double'
};

// Load physics classes
require('../js/physics/arcade-physics.js');
require('../js/physics/realistic-physics.js');
require('../js/aircraft.js');

describe('Physics Mode Toggle', () => {
    let aircraft;
    
    beforeEach(() => {
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
