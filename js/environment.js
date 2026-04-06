// ========== ENVIRONMENT ==========
let hemiLight = null;
let skyMesh = null;
let sunMesh = null;
let sunLight = null;

function createSky(scene) {
    // Create sun mesh (visual representation)
    const sunGeo = new THREE.SphereGeometry(400, 32, 32);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xffffcc });
    sunMesh = new THREE.Mesh(sunGeo, sunMat);
    sunMesh.position.set(8000, 6000, -10000);
    scene.add(sunMesh);
    
    // Create sun light (main directional light)
    sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
    sunLight.position.copy(sunMesh.position);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 100;
    sunLight.shadow.camera.far = 20000;
    sunLight.shadow.camera.left = -2000;
    sunLight.shadow.camera.right = 2000;
    sunLight.shadow.camera.top = 2000;
    sunLight.shadow.camera.bottom = -2000;
    scene.add(sunLight);
    
    hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x006994, 0.8);
    scene.add(hemiLight);
    
    // Create sky dome
    const skyGeo = new THREE.SphereGeometry(40000, 32, 32);
    const skyMat = new THREE.MeshBasicMaterial({
        color: 0x87CEEB,
        side: THREE.BackSide
    });
    skyMesh = new THREE.Mesh(skyGeo, skyMat);
    scene.add(skyMesh);
    
    // Expose to window for external control
    window.hemiLight = hemiLight;
    window.skyMesh = skyMesh;
    window.sunMesh = sunMesh;
    window.sunLight = sunLight;
    
    // Initialize lighting configuration
    initLightingConfig();
}

// Lighting configuration
const DEFAULT_LIGHT_CONFIG = {
    intensity: 1.5,
    color: '#ffffff',
    sunElevation: 45, // degrees above horizon (0 = sunrise/sunset, 90 = noon)
    sunAzimuth: 135   // degrees from north (0 = north, 90 = east, 180 = south, 270 = west)
};

function initLightingConfig() {
    // Load saved config or use defaults
    const savedIntensity = localStorage.getItem('sunIntensity');
    const savedColor = localStorage.getItem('sunColor');
    const savedElevation = localStorage.getItem('sunElevation');
    const savedAzimuth = localStorage.getItem('sunAzimuth');
    
    const config = {
        intensity: savedIntensity ? parseFloat(savedIntensity) : DEFAULT_LIGHT_CONFIG.intensity,
        color: savedColor || DEFAULT_LIGHT_CONFIG.color,
        sunElevation: savedElevation ? parseFloat(savedElevation) : DEFAULT_LIGHT_CONFIG.sunElevation,
        sunAzimuth: savedAzimuth ? parseFloat(savedAzimuth) : DEFAULT_LIGHT_CONFIG.sunAzimuth
    };
    
    applyLightingConfig(config);
}

function applyLightingConfig(config) {
    if (!sunLight || !sunMesh) return;
    
    // Apply intensity
    sunLight.intensity = config.intensity;
    
    // Apply color
    sunLight.color.set(config.color);
    sunMesh.material.color.set(config.color);
    
    // Calculate sun position from elevation and azimuth
    // Distance from origin - fixed far distance
    const distance = 12000;
    
    // Convert to radians
    const elevationRad = (config.sunElevation * Math.PI) / 180;
    const azimuthRad = (config.sunAzimuth * Math.PI) / 180;
    
    // Calculate position
    // Azimuth: 0 = north (negative Z), 90 = east (positive X), etc.
    // Elevation: 0 = horizon, 90 = directly overhead
    const x = distance * Math.cos(elevationRad) * Math.sin(azimuthRad);
    const y = distance * Math.sin(elevationRad);
    const z = -distance * Math.cos(elevationRad) * Math.cos(azimuthRad);
    
    sunMesh.position.set(x, y, z);
    sunLight.position.copy(sunMesh.position);
    
    // Update hemisphere light based on sun elevation (darker ground at low sun)
    if (hemiLight) {
        const groundIntensity = Math.max(0.2, config.intensity * 0.5 * Math.sin(elevationRad));
        hemiLight.intensity = Math.max(0.3, config.intensity * 0.5);
        hemiLight.groundColor.setHSL(0.6, 0.5, Math.max(0.1, 0.2 + groundIntensity * 0.2));
    }
}

function setSunIntensity(intensity) {
    localStorage.setItem('sunIntensity', intensity);
    if (sunLight) sunLight.intensity = intensity;
}

function setSunColor(color) {
    localStorage.setItem('sunColor', color);
    if (sunLight) sunLight.color.set(color);
    if (sunMesh) sunMesh.material.color.set(color);
}

function setSunPosition(elevation, azimuth) {
    localStorage.setItem('sunElevation', elevation);
    localStorage.setItem('sunAzimuth', azimuth);
    
    if (!sunMesh || !sunLight) return;
    
    const distance = 12000;
    const elevationRad = (elevation * Math.PI) / 180;
    const azimuthRad = (azimuth * Math.PI) / 180;
    
    const x = distance * Math.cos(elevationRad) * Math.sin(azimuthRad);
    const y = distance * Math.sin(elevationRad);
    const z = -distance * Math.cos(elevationRad) * Math.cos(azimuthRad);
    
    sunMesh.position.set(x, y, z);
    sunLight.position.copy(sunMesh.position);
    
    // Update hemisphere light based on elevation
    if (hemiLight && sunLight) {
        const groundIntensity = Math.max(0.2, sunLight.intensity * 0.5 * Math.sin(elevationRad));
        hemiLight.intensity = Math.max(0.3, sunLight.intensity * 0.5);
        hemiLight.groundColor.setHSL(0.6, 0.5, Math.max(0.1, 0.2 + groundIntensity * 0.2));
    }
}

// Export for global access
window.setSunIntensity = setSunIntensity;
window.setSunColor = setSunColor;
window.setSunPosition = setSunPosition;

// ========== DYNAMIC OCEAN ==========
// Dynamic ocean imported from ocean.js - exposed globally for boat integration
let oceanManagerInstance = null;

/**
 * Initialize dynamic ocean with LOD system
 */
function createDynamicOcean(scene, camera) {
  // OceanManager is loaded via script tag, should be globally available
  if (typeof OceanManager === 'undefined') {
    console.error('[Ocean] OceanManager not found - check if ocean.js loaded correctly');
    return;
  }
  
  oceanManagerInstance = new OceanManager(scene, camera);
  window.oceanManager = oceanManagerInstance; // Global for boats/aircraft access
  console.log('[Ocean] Dynamic ocean system initialized');
}

/**
 * Update ocean waves and camera tracking
 */
function updateOcean(deltaTime) {
  if (oceanManagerInstance) {
    oceanManagerInstance.update(deltaTime);
  }
}

// Expose globally for index.html access
window.createDynamicOcean = createDynamicOcean;
window.updateOcean = updateOcean;

// ========== STAR SYSTEM ==========
let starSystemInstance = null;

/**
 * Create star system
 */
function createStarSystem(scene) {
    if (starSystemInstance) {
        starSystemInstance.dispose();
    }
    starSystemInstance = new StarSystem(scene, 2000);
    window.starSystem = starSystemInstance;
    console.log('[Stars] Star system initialized');
}

/**
 * Expose to window
 */
window.createStarSystem = createStarSystem;

/**
 * Get wave height at world coordinates (for boats, collision)
 */
function getOceanHeight(x, z) {
  return oceanManagerInstance ? oceanManagerInstance.getHeight(x, z) : 0;
}

// Expose globally for index.html access
window.getOceanHeight = getOceanHeight;

// ========== CLOUDS ==========
class CloudSystem {
    constructor(scene, count = 100) {
        this.clouds = [];
        this.scene = scene;
        this.bounds = 12000;
        this.maxDrawDist = 15000;
        this.enabled = true;
        
        const islandPositions = [
            { x: 0, z: 0 },
            { x: 3200, z: -6400 },
            { x: -6400, z: -2800 },
            { x: -12000, z: -4000 },
            { x: -1400, z: -3600 },
            { x: 1400, z: -3200 },
            { x: -9600, z: -4800 },
            { x: 2200, z: -2200 }
        ];
        
        for (let i = 0; i < count; i++) {
            let x, z;
            
            const island = islandPositions[Math.floor(Math.random() * islandPositions.length)];
            const radius = 1000 + Math.random() * 4000;
            const angle = Math.random() * Math.PI * 2;
            x = island.x + Math.cos(angle) * radius;
            z = island.z + Math.sin(angle) * radius;
            
            this.createCloud(x, z);
        }
    }
    
    createCloud(x, z) {
        const cloudGroup = new THREE.Group();
        
        const puffCount = 10 + Math.floor(Math.random() * 20);
        const baseSize = 120 + Math.random() * 100;
        const spread = 80 + Math.random() * 80;
        
        const puffGeo = new THREE.SphereGeometry(1, 12, 12);
        const puffs = [];
        
        for (let i = 0; i < puffCount; i++) {
            const opacity = 0.8 + Math.random() * 0.2;
            const puffMat = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: opacity,
                roughness: 0.5,
                depthWrite: false,
                depthTest: true
            });
            
            const puff = new THREE.Mesh(puffGeo, puffMat);
            puff.renderOrder = 1000;
            
            const theta = Math.random() * Math.PI * 2;
            const r = Math.random() * spread;
            
            puff.position.set(
                Math.cos(theta) * r,
                (Math.random() - 0.5) * spread * 0.6,
                Math.sin(theta) * r
            );
            
            const scale = baseSize * (0.4 + Math.random() * 0.6);
            puff.scale.set(scale, scale * (0.5 + Math.random() * 0.5), scale);
            
            cloudGroup.add(puff);
            puffs.push(puff);
        }
        
        const altitude = 200 + Math.random() * 1200;
        cloudGroup.position.set(x, altitude, z);
        
        const speed = 2 + Math.random() * 8;
        const dir = Math.random() * Math.PI * 2;
        
        cloudGroup.userData = {
            velocity: new THREE.Vector3(Math.cos(dir) * speed, 0, Math.sin(dir) * speed),
            bobPhase: Math.random() * Math.PI * 2,
            bobSpeed: 0.5 + Math.random() * 0.5,
            bobAmount: 3 + Math.random() * 4,
            baseY: altitude,
            puffs: puffs
        };
        
        this.scene.add(cloudGroup);
        this.clouds.push(cloudGroup);
    }
    
    update(delta, time, camera) {
        if (!this.enabled) {
            this.clouds.forEach(cloud => { cloud.visible = false; });
            return;
        }
        
        const camPos = camera ? camera.position : null;
        const maxDist = this.maxDrawDist;
        
        this.clouds.forEach(cloud => {
            cloud.visible = true;
            const ud = cloud.userData;
            
            let lodScale = 1.0;
            if (camPos) {
                const dist = camPos.distanceTo(cloud.position);
                
                // Hide clouds beyond draw distance
                if (dist > maxDist) {
                    cloud.visible = false;
                    return;
                }
                
                if (dist > 8000) {
                    lodScale = 0.5;
                } else if (dist > 4000) {
                    lodScale = 0.75;
                }
            }
            
            const puffs = ud.puffs;
            if (puffs) {
                const puffsToShow = Math.ceil(puffs.length * lodScale);
                for (let i = 0; i < puffs.length; i++) {
                    puffs[i].visible = i < puffsToShow;
                }
            }
            
            cloud.position.x += ud.velocity.x * delta;
            cloud.position.z += ud.velocity.z * delta;
            cloud.position.y = ud.baseY + Math.sin(time * ud.bobSpeed + ud.bobPhase) * ud.bobAmount;
            
            const b = this.bounds;
            if (cloud.position.x > b) cloud.position.x = -b;
            if (cloud.position.x < -b) cloud.position.x = b;
            if (cloud.position.z > b) cloud.position.z = -b;
            if (cloud.position.z < -b) cloud.position.z = b;
        });
    }
    
    rebuild(count) {
        const islandPositions = [
            { x: 0, z: 0 },
            { x: 3200, z: -6400 },
            { x: -6400, z: -2800 },
            { x: -12000, z: -4000 },
            { x: -1400, z: -3600 },
            { x: 1400, z: -3200 },
            { x: -9600, z: -4800 },
            { x: 2200, z: -2200 }
        ];
        
        while (this.clouds.length > count) {
            const cloud = this.clouds.pop();
            this.scene.remove(cloud);
            cloud.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
        }
        
        while (this.clouds.length < count) {
            const island = islandPositions[Math.floor(Math.random() * islandPositions.length)];
            const radius = 1000 + Math.random() * 4000;
            const angle = Math.random() * Math.PI * 2;
            this.createCloud(
                island.x + Math.cos(angle) * radius,
                island.z + Math.sin(angle) * radius
            );
        }
    }
}

// ========== STAR SYSTEM ==========
class StarSystem {
    constructor(scene, count = 2000) {
        this.scene = scene;
        this.starCount = count;
        this.visible = false;
        this.starColors = [
            new THREE.Color(0xE8F4FF),
            new THREE.Color(0xFFF8E8),
            new THREE.Color(0xF0F8FF)
        ];
        
        this.createStarTexture();
        this.createStars();
    }
    
    createStarTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 64);
        
        this.starTexture = new THREE.CanvasTexture(canvas);
    }
    
    createStars() {
        const positions = new Float32Array(this.starCount * 3);
        const colors = new Float32Array(this.starCount * 3);
        const sizes = new Float32Array(this.starCount);
        
        const radius = 40000;
        const minAltitude = 8000;
        const maxAltitude = 25000;
        
        for (let i = 0; i < this.starCount; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            
            const r = radius;
            const x = r * Math.sin(phi) * Math.cos(theta);
            const y = minAltitude + Math.random() * (maxAltitude - minAltitude);
            const z = r * Math.sin(phi) * Math.sin(theta);
            
            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;
            
            const colorIndex = Math.floor(Math.random() * 3);
            const color = this.starColors[colorIndex];
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
            
            sizes[i] = 20 + Math.random() * 30;
        }
        
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        const material = new THREE.PointsMaterial({
            size: 40,
            map: this.starTexture,
            vertexColors: true,
            transparent: true,
            opacity: 1.0,
            sizeAttenuation: true,
            depthWrite: false,
            fog: false
        });
        
        this.stars = new THREE.Points(geometry, material);
        this.stars.visible = false;
        this.stars.renderOrder = -100;
        this.scene.add(this.stars);
        console.log('[Stars] Created', this.starCount, 'stars');
    }
    
    setVisible(visible) {
        this.visible = visible;
        this.stars.visible = visible;
    }
    
    updateColors(colors) {
        if (colors && colors.length === 3) {
            this.starColors = colors;
        }
        
        const colorAttr = this.stars.geometry.getAttribute('color');
        
        for (let i = 0; i < this.starCount; i++) {
            const colorIndex = Math.floor(Math.random() * 3);
            const color = this.starColors[colorIndex];
            colorAttr.array[i * 3] = color.r;
            colorAttr.array[i * 3 + 1] = color.g;
            colorAttr.array[i * 3 + 2] = color.b;
        }
        
        colorAttr.needsUpdate = true;
    }
    
    dispose() {
        this.stars.geometry.dispose();
        this.stars.material.dispose();
        this.starTexture.dispose();
        this.scene.remove(this.stars);
    }
}
