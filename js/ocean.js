// ========== DYNAMIC OCEAN SYSTEM ==========
class WaveSystem {
  constructor() {
    this.time = 0;
    
    // Gerstner wave configuration (3 systems for hybrid realism)
    this.waves = [
      // Swell: Long wavelength base waves
      {
        direction: new THREE.Vector2(1, 0.3).normalize(),
        amplitude: 1.0,
        length: 100,
        steepness: 0.7,
        speed: 2
      },
      // Chop: Medium wind-driven waves
      {
        direction: new THREE.Vector2(0.5, -1).normalize(),
        amplitude: 0.4,
        length: 30,
        steepness: 0.5,
        speed: 4
      },
      // Ripple: Short surface detail
      {
        direction: new THREE.Vector2(-0.7, 0.9).normalize(),
        amplitude: 0.1,
        length: 8,
        steepness: 0.3,
        speed: 6.67
      }
    ];
  }
  
  update(deltaTime) {
    this.time += deltaTime;
  }
  
  displaceVertex(position, output = new THREE.Vector3()) {
    const px = position.x;
    const pz = position.z;
    
    let offsetX = 0;
    let offsetY = 0;
    let offsetZ = 0;
    
    for (const wave of this.waves) {
      const dirX = wave.direction.x;
      const dirZ = wave.direction.y;
      
      // Phase calculation: dot(direction, position) * wavelength + time * speed
      const phase = (dirX * px + dirZ * pz) * (Math.PI * 2 / wave.length) + this.time * wave.speed;
      
      const sinPhase = Math.sin(phase);
      const cosPhase = Math.cos(phase);
      
      // Gerstner displacement formula
      const steepFactor = wave.steepness * wave.amplitude;
      
      offsetX += -dirX * wave.amplitude * cosPhase * wave.steepness;
      offsetY += wave.amplitude * sinPhase;
      offsetZ += -dirZ * wave.amplitude * cosPhase * wave.steepness;
    }
    
    output.set(px + offsetX, offsetY, pz + offsetZ);
    return output;
  }
  
  getHeight(x, z) {
    let height = 0;
    
    for (const wave of this.waves) {
      const dirX = wave.direction.x;
      const dirZ = wave.direction.y;
      
      const phase = (dirX * x + dirZ * z) * (Math.PI * 2 / wave.length) + this.time * wave.speed;
      height += wave.amplitude * Math.sin(phase);
    }
    
    return height;
  }
}

/**
 * Generate annulus geometry for LOD rings
 * @param {number} innerRadius - Inner radius of ring
 * @param {number} outerRadius - Outer radius of ring  
 * @param {number} radialSegments - Segments around circumference
 * @param {number} concentricSegments - Segments from inner to outer
 * @returns {THREE.BufferGeometry} Polar ring geometry
 */
function createRingGeometry(innerRadius, outerRadius, radialSegments = 64, concentricSegments = 16) {
  const vertices = [];
  const indices = [];
  
  // Generate vertices in polar coordinates - create in XY plane like Three.js PlaneGeometry
  // (Z will be the "up" direction before rotation, becomes Y after -90° X rotation)
  for (let j = 0; j <= concentricSegments; j++) {
    const radius = innerRadius + (outerRadius - innerRadius) * (j / concentricSegments);
    
    for (let i = 0; i <= radialSegments; i++) {
      const theta = (i / radialSegments) * Math.PI * 2;
      
      const x = radius * Math.cos(theta);
      const y = radius * Math.sin(theta);
      const z = 0; // Flat in XY plane, Z becomes height after rotation
      
      vertices.push(x, y, z);
    }
  }
  
  // Generate indices for triangle fan between segments
  for (let j = 0; j < concentricSegments; j++) {
    for (let i = 0; i < radialSegments; i++) {
      const a = j * (radialSegments + 1) + i;
      const b = a + radialSegments + 1;
      const c = a + 1;
      const d = b + 1;
      
      // Two triangles per quad
      indices.push(a, b, c);
      indices.push(b, d, c);
    }
  }
  
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  
  return geometry;
}

// SimpleOceanManager removed - was MVP test code, replaced by OceanManager with LOD rings

/**
 * Generate annulus (ring) geometry for LOD layers
 * @param {number} innerRadius - Inner radius of ring
 * @param {number} outerRadius - Outer radius of ring  
 * @param {number} segments - Number of segments around circumference
 * @returns {THREE.BufferGeometry} Polar ring geometry
 */
function createRingGeometry(innerRadius, outerRadius, segments) {
  const vertices = [];
  const indices = [];
  
  // Create grid in polar coordinates (annulus shape) - XY plane like PlaneGeometry
  const radialSegments = Math.ceil(segments / 2); // Segments from inner to outer
  
  for (let j = 0; j <= radialSegments; j++) {
    const radius = innerRadius + (outerRadius - innerRadius) * (j / radialSegments);
    
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      
      const x = radius * Math.cos(theta);
      const y = radius * Math.sin(theta);
      
      vertices.push(x, y, 0); // z=0 for flat ring, becomes height after rotation
    }
  }
  
  // Generate triangle indices
  for (let j = 0; j < radialSegments; j++) {
    for (let i = 0; i < segments; i++) {
      const a = j * (segments + 1) + i;
      const b = a + segments + 1;
      const c = a + 1;
      const d = b + 1;
      
      indices.push(a, b, c);
      indices.push(b, d, c);
    }
  }
  
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  
  return geometry;
}

class OceanManager {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.waveSystem = new WaveSystem();
    
    this.rings = [];
    this.gridSize = 200;
    this.lastCameraPos = new THREE.Vector3();
    
    // Get water level from global or use default (must match islands.js)
    const waterLevel = window.WATER_LEVEL || typeof WATER_LEVEL !== 'undefined' ? WATER_LEVEL : 2;
    this.waterLevel = waterLevel;
    
    // Create infinite opaque yellow floor 50 feet below ocean
    this.createOceanFloor(waterLevel);
    
    // Detect mobile devices and use lighter LOD settings
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile || navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) {
      console.log('[Ocean] Mobile/low-CPU detected, reducing segment counts');
      // Reduce all ring segments by ~50% in createRings
      this.mobileMode = true;
    }
    
    // Create 3 LOD rings
    this.createRings(waterLevel);
  }
  
  createRings(waterY) {
    // Create concentric rings (edge to edge, no overlap)
    const configs = this.mobileMode ? [
      { inner: 0, outer: 2000, segments: 64, intensity: 1.0, color: 0x40c4ff },   // Center disk
      { inner: 2000, outer: 7000, segments: 32, intensity: 0.5, color: 0x5ecfff }, // Middle ring
      { inner: 7000, outer: 14000, segments: 16, intensity: 0.2, color: 0x7dd8ff } // Outer ring (fog hides edge)
    ] : [
      { inner: 0, outer: 3000, segments: 96, intensity: 1.0, color: 0x40c4ff },   // Center disk
      { inner: 3000, outer: 9000, segments: 48, intensity: 0.5, color: 0x5ecfff }, // Middle ring
      { inner: 9000, outer: 18000, segments: 24, intensity: 0.2, color: 0x7dd8ff } // Outer ring (fog hides edge)
    ];
    
    const baseMaterial = new THREE.MeshStandardMaterial({
      roughness: 0.15,
      metalness: 0.1,
      flatShading: false,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75,
      depthWrite: true,
      depthTest: true
    });
    
    for (const config of configs) {
      const geometry = createRingGeometry(config.inner, config.outer, config.segments);
      
      console.log(`[Ocean] Creating ring ${config.inner}-${config.outer}m, vertices:`, geometry.attributes.position.count);
      
      const originalPositions = new Float32Array(geometry.attributes.position.array.length);
      originalPositions.set(geometry.attributes.position.array);
      geometry.userData.originalPositions = originalPositions;
      
      const material = baseMaterial.clone();
      material.color.setHex(config.color);
      
      const mesh = new THREE.Mesh(geometry, material);
      mesh.rotation.x = -Math.PI / 2; // Lay flat on XZ plane
      mesh.position.y = waterY;
      mesh.receiveShadow = true;
      mesh.userData.waveIntensity = config.intensity;
      mesh.renderOrder = -10;
      
      this.scene.add(mesh);
      this.rings.push({ mesh, geometry, original: originalPositions });
    }
    
    console.log('[Ocean] Total rings created:', this.rings.length);
  }
  
  createOceanFloor(waterY) {
    const floorY = waterY - 50 * 0.3048; // 50 feet below ocean in meters
    
    this.oceanFloorTiles = [];
    this.oceanFloorTileSize = 2000;
    this.oceanFloorGridSize = 10; // 10x10 grid = 20,000m coverage
    
    const geometry = new THREE.PlaneGeometry(this.oceanFloorTileSize, this.oceanFloorTileSize);
    const material = new THREE.MeshStandardMaterial({
      color: 0x40c4ff,
      transparent: false,
      side: THREE.DoubleSide,
      depthWrite: true,
      roughness: 1,
      metalness: 0
    });
    
    for (let x = 0; x < this.oceanFloorGridSize; x++) {
      for (let z = 0; z < this.oceanFloorGridSize; z++) {
        const tile = new THREE.Mesh(geometry, material.clone());
        tile.rotation.x = -Math.PI / 2;
        tile.position.y = floorY;
        tile.renderOrder = -1;
        this.scene.add(tile);
        this.oceanFloorTiles.push(tile);
      }
    }
  }
  
  update(deltaTime) {
    // Update wave time
    this.waveSystem.update(deltaTime);
    
    // Reposition rings if camera moved significantly
    if (this.camera && this.camera.position) {
      const camX = this.camera.position.x;
      const camZ = this.camera.position.z;
      
      const dist = Math.sqrt(
        Math.pow(camX - this.lastCameraPos.x, 2) + 
        Math.pow(camZ - this.lastCameraPos.z, 2)
      );
      
      if (dist > 50) { // Reposition threshold
        const snapX = Math.floor(camX / this.gridSize) * this.gridSize;
        const snapZ = Math.floor(camZ / this.gridSize) * this.gridSize;
        
        for (const ring of this.rings) {
          ring.mesh.position.x = snapX;
          ring.mesh.position.z = snapZ;
        }
        
        // Move ocean floor tiles to follow camera
        if (this.oceanFloorTiles && this.oceanFloorTiles.length > 0) {
          const halfGrid = Math.floor(this.oceanFloorGridSize / 2);
          const tileSize = this.oceanFloorTileSize;
          let tileIndex = 0;
          
          for (let gx = -halfGrid; gx < halfGrid; gx++) {
            for (let gz = -halfGrid; gz < halfGrid; gz++) {
              if (tileIndex < this.oceanFloorTiles.length) {
                this.oceanFloorTiles[tileIndex].position.x = snapX + gx * tileSize;
                this.oceanFloorTiles[tileIndex].position.z = snapZ + gz * tileSize;
                tileIndex++;
              }
            }
          }
        }
        
        this.lastCameraPos.set(camX, this.camera.position.y, camZ);
      }
    }
    
    // Update wave displacements on all rings
    for (const ring of this.rings) {
      this.updateRingWaves(ring);
    }
  }
  
  updateRingWaves(ring) {
    const positions = ring.geometry.attributes.position;
    const intensity = ring.mesh.userData.waveIntensity;
    const oceanPos = ring.mesh.position;
    
    let changed = false;
    
    for (let i = 0; i < positions.count; i++) {
      // Ring geometry has vertices in XY plane with Z=0 initially
      const localX = positions.getX(i);
      const localY = positions.getY(i);
      
      // After -90° X rotation: local (x, y, z) → world (x, z, -y) + mesh position
      const worldX = oceanPos.x + localX;
      const worldZ = oceanPos.z - localY; // Local Y becomes negative Z after rotation
      
      // Sample wave height at this world X,Z position
      let waveHeight = this.waveSystem.getHeight(worldX, worldZ);
      
      // Apply intensity dampening for LOD
      waveHeight *= intensity;
      
      // Set local Z to wave height (becomes -Y in world space after rotation)
      if (Math.abs(waveHeight - positions.getZ(i)) > 0.01) {
        positions.setZ(i, waveHeight);
        changed = true;
      }
    }
    
    if (changed) {
      positions.needsUpdate = true;
      ring.geometry.computeVertexNormals();
    }
  }
  
  getHeight(x, z) {
    return this.waveSystem.getHeight(x, z);
  }
}
