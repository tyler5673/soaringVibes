// Mock for THREE.js - provides essential classes for testing
class Vector3 {
  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
  
  clone() {
    return new Vector3(this.x, this.y, this.z);
  }
  
  copy(v) {
    this.x = v.x;
    this.y = v.y;
    this.z = v.z;
    return this;
  }
  
  set(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
  }
  
  add(v) {
    return new Vector3(this.x + v.x, this.y + v.y, this.z + v.z);
  }
  
  subtract(v) {
    return new Vector3(this.x - v.x, this.y - v.y, this.z - v.z);
  }
  
  sub(v) {
    return new Vector3(this.x - v.x, this.y - v.y, this.z - v.z);
  }
  
  multiplyScalar(s) {
    return new Vector3(this.x * s, this.y * s, this.z * s);
  }
  
  distanceTo(v) {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    const dz = this.z - v.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
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
}

class Group {
  constructor() {
    this.children = [];
    this.position = new Vector3();
    this.rotation = { 
      x: 0, y: 0, z: 0,
      set: function(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
      }
    };
    this.scale = { 
      setScalar: function(s) {},
      set: function(x, y, z) {}
    };
  }
  
  add(obj) {
    this.children.push(obj);
  }
  
  remove(obj) {
    const idx = this.children.indexOf(obj);
    if (idx !== -1) this.children.splice(idx, 1);
  }
  
  traverse(fn) {
    this.children.forEach(fn);
  }
  
  lookAt(target) {
    // Simple lookAt implementation
  }
  
  getWorldDirection(vector) {
    vector.set(0, 0, 1);
    return vector;
  }
}

class Mesh extends Group {
  constructor(geometry, material) {
    super();
    this.geometry = geometry || {};
    this.material = material || {};
    this.visible = true;
    this.castShadow = false;
  }
}

class SphereGeometry {
  constructor(radius, widthSegments, heightSegments) {
    this.radius = radius;
    this.widthSegments = widthSegments;
    this.heightSegments = heightSegments;
    this._scale = { x: 1, y: 1, z: 1 };
  }
  
  scale(x, y, z) {
    this._scale = { x, y, z };
    return this;
  }
}

class CylinderGeometry {
  constructor(radiusTop, radiusBottom, height, radialSegments) {
    this.radiusTop = radiusTop;
    this.radiusBottom = radiusBottom;
    this.height = height;
    this.radialSegments = radialSegments;
    this._scale = { x: 1, y: 1, z: 1 };
  }
  
  scale(x, y, z) {
    this._scale = { x, y, z };
    return this;
  }
}

class ConeGeometry {
  constructor(radius, height, radialSegments) {
    this.radius = radius;
    this.height = height;
    this.radialSegments = radialSegments;
    this._scale = { x: 1, y: 1, z: 1 };
  }
  
  scale(x, y, z) {
    this._scale = { x, y, z };
    return this;
  }
}

class BoxGeometry {
  constructor(width, height, depth) {
    this.width = width;
    this.height = height;
    this.depth = depth;
    this._scale = { x: 1, y: 1, z: 1 };
  }
  
  scale(x, y, z) {
    this._scale = { x, y, z };
    return this;
  }
}

class PlaneGeometry {
  constructor(width, height) {
    this.width = width;
    this.height = height;
  }
  
  rotateY(angle) {
    return this;
  }
}

class MeshStandardMaterial {
  constructor(options = {}) {
    this.color = options.color || 0xffffff;
    this.side = options.side;
    this.transparent = options.transparent || false;
    this.opacity = options.opacity !== undefined ? options.opacity : 1;
    this.roughness = options.roughness !== undefined ? options.roughness : 0.5;
    this.metalness = options.metalness !== undefined ? options.metalness : 0.5;
  }
}

class MeshBasicMaterial {
  constructor(options = {}) {
    this.color = options.color || 0xffffff;
    this.side = options.side;
    this.transparent = options.transparent || false;
    this.opacity = options.opacity !== undefined ? options.opacity : 1;
  }
}

class Scene extends Group {
  constructor() {
    super();
    this.background = null;
  }
}

const THREE = {
  Vector3,
  Group,
  Mesh,
  SphereGeometry,
  CylinderGeometry,
  ConeGeometry,
  BoxGeometry,
  PlaneGeometry,
  MeshStandardMaterial,
  MeshBasicMaterial,
  Scene,
  DoubleSide: 2
};

module.exports = THREE;
