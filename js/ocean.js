// ========== DYNAMIC OCEAN SYSTEM ==========
class WaveSystem {
  constructor() {
    this.time = 0;
    
    // Multipliers for external control (0-1 range, default 0.5)
    this.heightMultiplier = 0.5;
    this.speedMultiplier = 0.5;
    this.steepnessMultiplier = 0.5;
    
    // Base amplitudes, speeds, steepness, and wavelengths for reference (200ft max swell = ~61m)
    this.baseAmplitudes = [30.5, 12.2, 3.0];
    this.baseSpeeds = [2, 4, 6.67];
    this.baseSteepness = [0.5, 0.4, 0.2];
    this.baseLengths = [100, 30, 8];
    
    // Gerstner wave configuration (3 systems for hybrid realism)
    this.waves = [
      // Swell: Long wavelength base waves
      {
        direction: new THREE.Vector2(1, 0.3).normalize(),
        amplitude: 30.5,
        length: 100,
        steepness: 0.5,
        speed: 2
      },
      // Chop: Medium wind-driven waves
      {
        direction: new THREE.Vector2(0.5, -1).normalize(),
        amplitude: 12.2,
        length: 30,
        steepness: 0.4,
        speed: 4
      },
      // Ripple: Short surface detail
      {
        direction: new THREE.Vector2(-0.7, 0.9).normalize(),
        amplitude: 3.0,
        length: 8,
        steepness: 0.2,
        speed: 6.67
      }
    ];
    
    this.updateWaveParameters();
  }
  
  setHeightMultiplier(multiplier) {
    this.heightMultiplier = Math.max(0, Math.min(1, multiplier));
    this.updateWaveParameters();
  }
  
  setSpeedMultiplier(multiplier) {
    this.speedMultiplier = Math.max(0, Math.min(1, multiplier));
    this.updateWaveParameters();
  }
  
  setSteepnessMultiplier(multiplier) {
    this.steepnessMultiplier = Math.max(0, Math.min(1, multiplier));
    this.updateWaveParameters();
  }
  
  updateWaveParameters() {
    for (let i = 0; i < this.waves.length; i++) {
      const wave = this.waves[i];
      const baseAmp = this.baseAmplitudes[i];
      const baseSpeed = this.baseSpeeds[i];
      const baseSteep = this.baseSteepness[i];
      const baseLen = this.baseLengths[i];
      
      // Height affects amplitude (at 0, waves are flat; at 1, full amplitude)
      wave.amplitude = baseAmp * this.heightMultiplier * 2;
      // Speed affects wave movement (at 0, static; at 1, full speed)
      wave.speed = baseSpeed * (0.1 + this.speedMultiplier * 0.9);
      // Steepness controlled by user slider (0 = flat/wide, 1 = peaked/steep)
      wave.steepness = baseSteep * this.steepnessMultiplier * 2;
      // Width: lower steepness = longer wavelength = flatter/wider waves
      // Range from 0.5x to 4x base wavelength
      wave.length = baseLen * (0.5 + (1 - this.steepnessMultiplier) * 3);
    }
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
      { inner: 0, outer: 500, segments: 48, intensity: 1.0, color: 0x40c4ff },   // Center disk
      { inner: 500, outer: 2000, segments: 24, intensity: 1.0, color: 0x40c4ff }, // Middle ring
      { inner: 2000, outer: 5000, segments: 12, intensity: 1.0, color: 0x40c4ff } // Outer ring (fog hides edge)
    ] : [
      { inner: 0, outer: 3000, segments: 96, intensity: 1.0, color: 0x40c4ff },   // Center disk
      { inner: 3000, outer: 4000, segments: 48, intensity: 1.0, color: 0x40c4ff }, // Middle ring
      { inner: 4000, outer: 10000, segments: 24, intensity: 1.0, color: 0x40c4ff } // Outer ring (fog hides edge)
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
    
    // Center rings on camera every frame for seamless coverage
    if (this.camera && this.camera.position) {
      const camX = this.camera.position.x;
      const camZ = this.camera.position.z;
      
      for (const ring of this.rings) {
        ring.mesh.position.x = camX;
        ring.mesh.position.z = camZ;
      }
      
      // Move ocean floor tiles to follow camera
      if (this.oceanFloorTiles && this.oceanFloorTiles.length > 0) {
        const halfGrid = Math.floor(this.oceanFloorGridSize / 2);
        const tileSize = this.oceanFloorTileSize;
        let tileIndex = 0;
        
        for (let gx = -halfGrid; gx < halfGrid; gx++) {
          for (let gz = -halfGrid; gz < halfGrid; gz++) {
            if (tileIndex < this.oceanFloorTiles.length) {
              this.oceanFloorTiles[tileIndex].position.x = camX + gx * tileSize;
              this.oceanFloorTiles[tileIndex].position.z = camZ + gz * tileSize;
              tileIndex++;
            }
          }
        }
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
    
    let changed = false;
    
    for (let i = 0; i < positions.count; i++) {
      // Sample wave in local space so pattern moves with camera seamlessly
      const localX = positions.getX(i);
      const localY = positions.getY(i);
      
      // After -90° X rotation: local Y maps to -Z in world
      let waveHeight = this.waveSystem.getHeight(localX, -localY);
      
      // Apply intensity dampening for LOD
      waveHeight *= intensity;
      
      // Set local Z to wave height
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

// ========== WATER SPLASH EFFECTS ==========
class WaterSplashSystem {
  constructor(scene) {
    this.scene = scene;
    this.splashes = [];
    this.maxSplashes = 200; // Max concurrent splash particles
    
    // Create a simple circular particle texture using canvas
    this.particleTexture = this.createParticleTexture();
    
    // Pre-create a pool of splash sprites
    this.splashPool = [];
    this.createSplashPool();
  }
  
  createParticleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    
    // Draw a soft white circle with radial gradient
    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.4, 'rgba(220, 240, 255, 0.8)');
    gradient.addColorStop(0.7, 'rgba(180, 220, 255, 0.4)');
    gradient.addColorStop(1, 'rgba(150, 200, 255, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }
  
  createSplashPool() {
    const material = new THREE.SpriteMaterial({
      map: this.particleTexture,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    
    for (let i = 0; i < this.maxSplashes; i++) {
      const sprite = new THREE.Sprite(material.clone());
      sprite.visible = false;
      sprite.scale.set(1, 1, 1);
      this.scene.add(sprite);
      this.splashPool.push({
        sprite: sprite,
        active: false,
        life: 0,
        maxLife: 0,
        velocity: new THREE.Vector3(),
        startScale: 1
      });
    }
  }
  
  spawnSplash(position, intensity, type = 'landing') {
    // Find inactive splash from pool
    const splash = this.splashPool.find(s => !s.active);
    if (!splash) return; // Pool exhausted
    
    const { sprite } = splash;
    
    // Configure based on splash type
    let particleCount, size, life, spread;
    
    if (type === 'landing') {
      // Hard landing - big splash
      particleCount = Math.floor(intensity * 8) + 3;
      size = 1.5 + intensity * 2;
      life = 1.0 + intensity * 0.5;
      spread = 2 + intensity * 3;
    } else if (type === 'wake') {
      // Moving on water - wake spray
      particleCount = Math.floor(intensity * 4) + 1;
      size = 0.8 + intensity * 0.5;
      life = 0.6 + intensity * 0.3;
      spread = 1 + intensity * 1.5;
    } else {
      // Light contact
      particleCount = 2;
      size = 0.6;
      life = 0.4;
      spread = 0.8;
    }
    
    // Activate main splash particle
    splash.active = true;
    splash.life = life;
    splash.maxLife = life;
    splash.startScale = size;
    
    sprite.visible = true;
    sprite.position.copy(position);
    sprite.position.y += 0.3; // Slightly above water
    sprite.scale.set(size, size, 1);
    sprite.material.opacity = 0.7;
    
    // Spawn additional particles for bigger splashes
    const spawnedParticles = [splash];
    for (let i = 1; i < particleCount && i < 5; i++) {
      const extraSplash = this.splashPool.find(s => !s.active && !spawnedParticles.includes(s));
      if (!extraSplash) break;
      
      extraSplash.active = true;
      extraSplash.life = life * (0.7 + Math.random() * 0.4);
      extraSplash.maxLife = extraSplash.life;
      extraSplash.startScale = size * (0.5 + Math.random() * 0.5);
      
      extraSplash.sprite.visible = true;
      extraSplash.sprite.position.copy(position);
      // Random offset in splash area
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * spread * 0.5;
      extraSplash.sprite.position.x += Math.cos(angle) * radius;
      extraSplash.sprite.position.z += Math.sin(angle) * radius;
      extraSplash.sprite.position.y += Math.random() * 0.5;
      
      extraSplash.sprite.scale.set(extraSplash.startScale, extraSplash.startScale, 1);
      extraSplash.sprite.material.opacity = 0.5 + Math.random() * 0.3;
      
      // Upward velocity for spray effect
      extraSplash.velocity.set(
        (Math.random() - 0.5) * spread * 0.3,
        1 + Math.random() * 2,
        (Math.random() - 0.5) * spread * 0.3
      );
      
      spawnedParticles.push(extraSplash);
    }
    
    this.splashes.push(...spawnedParticles);
  }
  
  update(deltaTime) {
    // Update all active splashes
    for (let i = this.splashes.length - 1; i >= 0; i--) {
      const splash = this.splashes[i];
      if (!splash.active) continue;
      
      splash.life -= deltaTime;
      
      if (splash.life <= 0) {
        // Deactivate
        splash.active = false;
        splash.sprite.visible = false;
        splash.sprite.material.opacity = 0;
        this.splashes.splice(i, 1);
        continue;
      }
      
      const lifeRatio = splash.life / splash.maxLife;
      
      // Apply velocity to additional particles
      if (splash.velocity && splash.velocity.lengthSq() > 0) {
        splash.sprite.position.addScaledVector(splash.velocity, deltaTime);
        // Gravity
        splash.velocity.y -= 4.0 * deltaTime;
      }
      
      // Scale down and fade out
      const currentScale = splash.startScale * (0.3 + lifeRatio * 0.7);
      splash.sprite.scale.set(currentScale, currentScale, 1);
      splash.sprite.material.opacity = lifeRatio * 0.7;
    }
  }
  
  // Helper method called from physics to create splash at float positions
  createFloatSplashes(aircraft) {
    if (!aircraft.hasFloats || !aircraft.waterPhysics.isOnWater) return;
    
    const speed = aircraft.velocity.length();
    const verticalSpeed = Math.abs(aircraft.velocity.y);
    const waterLevel = aircraft.waterPhysics.waterLevel || 2;
    
    // Calculate float contact positions
    const floatSpread = 1.4;
    const floatZOffset = 0.2;
    const floatY = -0.9;
    
    // Check each float
    [-1, 1].forEach(side => {
      const floatWorldPos = new THREE.Vector3(
        aircraft.position.x + side * floatSpread,
        aircraft.position.y + floatY,
        aircraft.position.z + floatZOffset
      );
      
      // Check if float is touching/submerged in water
      const waterHeightAtPos = this.getWaterHeightAt(floatWorldPos.x, floatWorldPos.z);
      const submersion = waterHeightAtPos - floatWorldPos.y;
      
      if (submersion > 0.1) {
        // Determine splash intensity based on conditions
        let intensity = 0;
        let type = 'contact';
        
        // Hard landing detection (high vertical speed)
        if (verticalSpeed > 3) {
          intensity = Math.min(verticalSpeed / 8, 1.5);
          type = 'landing';
        }
        // Wake from speed
        else if (speed > 10) {
          intensity = Math.min((speed - 10) / 20, 0.8);
          type = 'wake';
        }
        // Light contact
        else if (submersion > 0.2) {
          intensity = 0.3;
          type = 'contact';
        }
        
        // Spawn splash if intensity is sufficient
        if (intensity > 0.1) {
          // Add some randomness to splash position along the float
          const randomOffset = (Math.random() - 0.5) * 2.0;
          const splashPos = new THREE.Vector3(
            floatWorldPos.x,
            waterHeightAtPos,
            floatWorldPos.z + randomOffset
          );
          
          this.spawnSplash(splashPos, intensity, type);
        }
      }
    });
  }
  
  getWaterHeightAt(x, z) {
    // Get base water level plus wave height
    const baseLevel = typeof WATER_LEVEL !== 'undefined' ? WATER_LEVEL : 2;
    if (window.oceanManager) {
      return baseLevel + window.oceanManager.getHeight(x, z) * 0.85;
    }
    return baseLevel;
  }
}

window.WaterSplashSystem = WaterSplashSystem;
