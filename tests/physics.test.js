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
            return this;
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
        sub(v) {
            this.x -= v.x;
            this.y -= v.y;
            this.z -= v.z;
            return this;
        }
        add(v) {
            this.x += v.x;
            this.y += v.y;
            this.z += v.z;
            return this;
        }
        sub(v) {
            this.x -= v.x;
            this.y -= v.y;
            this.z -= v.z;
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
        applyMatrix4(m) {
            // Simple transformation - assumes matrix is primarily rotation
            const x = this.x, y = this.y, z = this.z;
            const e = m.elements;
            this.x = e[0] * x + e[4] * y + e[8] * z + e[12];
            this.y = e[1] * x + e[5] * y + e[9] * z + e[13];
            this.z = e[2] * x + e[6] * y + e[10] * z + e[14];
            return this;
        }
        negate() {
            this.x = -this.x;
            this.y = -this.y;
            this.z = -this.z;
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
            this.order = order || 'YXZ';
        }
        copy(e) {
            this.x = e.x;
            this.y = e.y;
            this.z = e.z;
            this.order = e.order || 'YXZ';
            return this;
        }
        setFromQuaternion(q, order) {
            // Simplified conversion - extracts basic rotation
            // This is a rough approximation for testing
            const sinr_cosp = 2 * (q.w * q.x + q.y * q.z);
            const cosr_cosp = 1 - 2 * (q.x * q.x + q.y * q.y);
            this.x = Math.atan2(sinr_cosp, cosr_cosp);
            
            const sinp = 2 * (q.w * q.y - q.z * q.x);
            this.y = Math.asin(Math.min(1, Math.max(-1, sinp)));
            
            const siny_cosp = 2 * (q.w * q.z + q.x * q.y);
            const cosy_cosp = 1 - 2 * (q.y * q.y + q.z * q.z);
            this.z = Math.atan2(siny_cosp, cosy_cosp);
            
            this.order = order || 'YXZ';
            return this;
        }
    },
    Matrix4: class Matrix4 {
        constructor() {
            this.elements = [
                1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 1, 0,
                0, 0, 0, 1
            ];
        }
        makeRotationFromEuler(euler) {
            const te = this.elements;
            const x = euler.x, y = euler.y, z = euler.z;
            const a = Math.cos(x), b = Math.sin(x);
            const c = Math.cos(y), d = Math.sin(y);
            const e = Math.cos(z), f = Math.sin(z);
            
            // Simplified rotation matrix for YXZ order (common in flight sims)
            te[0] = c * e - d * f * b;
            te[4] = -d * e * b - c * f;
            te[8] = -d * a;
            te[1] = a * f;
            te[5] = a * e;
            te[9] = b;
            te[2] = d * e + c * f * b;
            te[6] = d * f - c * e * b;
            te[10] = c * a;
            
            return this;
        }
        transpose() {
            const te = this.elements;
            const tmp = [...te];
            te[1] = tmp[4]; te[4] = tmp[1];
            te[2] = tmp[8]; te[8] = tmp[2];
            te[6] = tmp[9]; te[9] = tmp[6];
            return this;
        }
        clone() {
            const m = new THREE.Matrix4();
            m.elements = [...this.elements];
            return m;
        }
    },
    Quaternion: class Quaternion {
        constructor(x = 0, y = 0, z = 0, w = 1) {
            this.x = x;
            this.y = y;
            this.z = z;
            this.w = w;
        }
        setFromAxisAngle(axis, angle) {
            const halfAngle = angle / 2;
            const s = Math.sin(halfAngle);
            this.x = axis.x * s;
            this.y = axis.y * s;
            this.z = axis.z * s;
            this.w = Math.cos(halfAngle);
            return this;
        }
        setFromEuler(euler) {
            const c1 = Math.cos(euler.x / 2);
            const c2 = Math.cos(euler.y / 2);
            const c3 = Math.cos(euler.z / 2);
            const s1 = Math.sin(euler.x / 2);
            const s2 = Math.sin(euler.y / 2);
            const s3 = Math.sin(euler.z / 2);
            
            this.x = s1 * c2 * c3 - c1 * s2 * s3;
            this.y = c1 * s2 * c3 + s1 * c2 * s3;
            this.z = c1 * c2 * s3 - s1 * s2 * c3;
            this.w = c1 * c2 * c3 + s1 * s2 * s3;
            
            return this;
        }
        multiply(q) {
            const a = this, b = q;
            const qax = a.x, qay = a.y, qaz = a.z, qaw = a.w;
            const qbx = b.x, qby = b.y, qbz = b.z, qbw = b.w;
            
            this.x = qax * qbw + qaw * qbx + qay * qbz - qaz * qby;
            this.y = qay * qbw + qaw * qby + qaz * qbx - qax * qbz;
            this.z = qaz * qbw + qaw * qbz + qax * qby - qay * qbx;
            this.w = qaw * qbw - qax * qbx - qay * qby - qaz * qbz;
            
            return this;
        }
        multiplyQuaternions(a, b) {
            const qax = a.x, qay = a.y, qaz = a.z, qaw = a.w;
            const qbx = b.x, qby = b.y, qbz = b.z, qbw = b.w;
            
            this.x = qax * qbw + qaw * qbx + qay * qbz - qaz * qby;
            this.y = qay * qbw + qaw * qby + qaz * qbx - qax * qbz;
            this.z = qaz * qbw + qaw * qbz + qax * qby - qay * qbx;
            this.w = qaw * qbw - qax * qbx - qay * qby - qaz * qbz;
            
            return this;
        }
        multiplyScalar(s) {
            this.x *= s;
            this.y *= s;
            this.z *= s;
            this.w *= s;
            return this;
        }
        normalize() {
            let l = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
            if (l === 0) {
                this.x = 0; this.y = 0; this.z = 0; this.w = 1;
            } else {
                l = 1 / l;
                this.x *= l; this.y *= l; this.z *= l; this.w *= l;
            }
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
        traverse(callback) {
            // Simple traverse - call on self then on children
            callback(this);
            this.children.forEach(child => {
                if (child.traverse) {
                    child.traverse(callback);
                } else {
                    callback(child);
                }
            });
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
    CapsuleGeometry: class CapsuleGeometry {
        constructor(radius, length, capSegments, radialSegments) {
            this.parameters = { radius, length, capSegments, radialSegments };
        }
        rotateX() { return this; }
        rotateY() { return this; }
        rotateZ() { return this; }
    },
    ArrowHelper: class ArrowHelper {
        constructor(dir, origin, length, color, headLength, headWidth) {
            this.dir = dir;
            this.origin = origin;
            this.length = length;
            this.color = color;
            this.visible = true;
            this.position = new THREE.Vector3();
        }
        setDirection(dir) { this.dir = dir; }
        setLength(length, headLength, headWidth) { this.length = length; }
        add(child) {}
    },
    CanvasTexture: class CanvasTexture {
        constructor(canvas) { this.canvas = canvas; }
    },
    SpriteMaterial: class SpriteMaterial {
        constructor(params) { this.map = params.map; this.transparent = params.transparent; }
    },
    Sprite: class Sprite {
        constructor(material) { this.material = material; this.scale = new THREE.Vector3(1, 1, 1); this.position = new THREE.Vector3(); }
        add(child) {}
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
