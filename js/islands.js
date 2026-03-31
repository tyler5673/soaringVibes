// ========== ISLANDS ==========
const heightmapCache = {};
const islandMetadataCache = {};

async function loadIslandData(islandName) {
    if (heightmapCache[islandName] && islandMetadataCache[islandName]) {
        return { data: heightmapCache[islandName], meta: islandMetadataCache[islandName] };
    }

    const loader = new THREE.TextureLoader();
    
    const texture = await new Promise((resolve, reject) => {
        loader.load(
            `assets/heightmaps/${islandName}.png`,
            resolve,
            undefined,
            reject
        );
    });
    
    texture.image.width = 1024;
    texture.image.height = 1024;
    
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(texture.image, 0, 0);
    
    const imageData = ctx.getImageData(0, 0, 1024, 1024);
    const data = new Uint8Array(1024 * 1024);
    
    for (let i = 0; i < imageData.data.length; i += 4) {
        data[i / 4] = imageData.data[i];
    }

    const metaResponse = await fetch(`assets/heightmaps/${islandName}.json`);
    const meta = await metaResponse.json();

    heightmapCache[islandName] = data;
    islandMetadataCache[islandName] = meta;

    return { data, meta };
}

function getHeightFromData(data, width, height, x, y) {
    if (x < 0 || x >= width || y < 0 || y >= height) return 0;
    
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = x - ix;
    const fy = y - iy;
    
    const idx00 = iy * width + ix;
    const idx10 = iy * width + Math.min(ix + 1, width - 1);
    const idx01 = Math.min(iy + 1, height - 1) * width + ix;
    const idx11 = Math.min(iy + 1, height - 1) * width + Math.min(ix + 1, width - 1);
    
    const h00 = data[idx00] || 0;
    const h10 = data[idx10] || 0;
    const h01 = data[idx01] || 0;
    const h11 = data[idx11] || 0;
    
    const h0 = h00 * (1 - fx) + h10 * fx;
    const h1 = h01 * (1 - fx) + h11 * fx;
    
    return h0 * (1 - fy) + h1 * fy;
}

function getTerrainHeight(worldX, worldZ) {
    const terrainScale = 0.15;
    const groupOffsetY = -50;
    const WATER_LEVEL = 2;
    
    for (let i = 0; i < islandPositions.length; i++) {
        const islandInfo = islandPositions[i];
        const data = heightmapCache[islandInfo.name];
        const meta = islandMetadataCache[islandInfo.name];
        
        if (!data || !meta) continue;
        
        const localX = worldX - islandInfo.x;
        const localZ = worldZ - islandInfo.z;
        
        const terrainWidth = meta.worldWidth * islandInfo.worldScale;
        const terrainHeight = meta.worldHeight * islandInfo.worldScale;
        
        const halfWidth = terrainWidth / 2;
        const halfHeight = terrainHeight / 2;
        
        if (Math.abs(localX) > halfWidth || Math.abs(localZ) > halfHeight) continue;
        
        const u = (localX / terrainWidth) + 0.5;
        const v = (localZ / terrainHeight) + 0.5;
        
        const clampedU = Math.max(0, Math.min(1, u));
        const clampedV = Math.max(0, Math.min(1, v));
        
        const imgX = clampedU * (1024 - 1);
        const imgY = (1 - clampedV) * (1024 - 1);
        
        const minElev = meta.minElevation;
        const maxElev = meta.maxElevation;
        const elevRange = maxElev - minElev;
        
        const normalizedHeight = getHeightFromData(data, 1024, 1024, imgX, imgY) / 255;
        let height = minElev + normalizedHeight * elevRange;
        
        height *= terrainScale;
        
        // Edge fade (same as createTerrainMesh and getTerrainMeshHeight)
        const px = localX;
        const pz = localZ;
        const dist = Math.sqrt(px * px + pz * pz);
        const maxDist = Math.min(terrainWidth, terrainHeight) * 0.45;
        
        let edgeFade = 1;
        if (dist > maxDist * 0.7) {
            edgeFade = Math.max(0, 1 - (dist - maxDist * 0.7) / (maxDist * 0.3));
        }
        
        // Airport flattening (same as getTerrainMeshHeight)
        if (islandInfo.hasAirport) {
            const airportRadius = 100 * islandInfo.worldScale;
            const airportTransition = 50 * islandInfo.worldScale;
            const airportDist = Math.sqrt(px * px + pz * pz);
            
            if (airportDist < airportRadius) {
                height = WATER_LEVEL + 0.5;
            } else if (airportDist < airportRadius + airportTransition) {
                const t = (airportDist - airportRadius) / airportTransition;
                const smoothT = t * t * (3 - 2 * t);
                height = height * smoothT + (WATER_LEVEL + 0.5) * (1 - smoothT);
            }
        }
        
        // Apply edge fade and water clamp (same as createTerrainMesh)
        height *= edgeFade;
        height = Math.max(WATER_LEVEL - 5, height);
        
        // Add group offset to get world Y position
        height += groupOffsetY;
        
        return height;
    }
    
    return -50; // Return ocean level when not on any island
}

function createIslandFromHeightmap(scene, islandName, worldX, worldZ, options = {}) {
    const { hasAirport = false, worldScale = 1 } = options;
    
    return loadIslandData(islandName).then(({ data, meta }) => {
        return createTerrainMesh(scene, data, meta, worldX, worldZ, { hasAirport, worldScale, islandName });
    });
}

function createTerrainMesh(scene, heightData, meta, worldX, worldZ, options) {
    const { hasAirport = false, worldScale = 1, islandName } = options;
    
    const imgWidth = 1024;
    const imgHeight = 1024;
    
    const terrainWidth = meta.worldWidth * worldScale;
    const terrainHeight = meta.worldHeight * worldScale;
    
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        || (navigator.maxTouchPoints > 0 && window.innerWidth < 1024);
    const segments = isMobile ? 384 : 768;
    const terrainGeo = new THREE.PlaneGeometry(terrainWidth, terrainHeight, segments, segments);
    terrainGeo.rotateX(-Math.PI / 2);
    
    const posAttr = terrainGeo.attributes.position;
    const colors = [];
    
    const minElev = meta.minElevation;
    const maxElev = meta.maxElevation;
    const elevRange = maxElev - minElev;
    
    const waterLevel = 2;
    
    const beachColor = new THREE.Color(0xE8D4A8);
    const sandColor = new THREE.Color(0xD4C4A0);
    const darkSandColor = new THREE.Color(0xBBAF8C);
    const forestColor = new THREE.Color(0x1B5E20);
    const shrublandColor = new THREE.Color(0x6B8E23);
    const grasslandColor = new THREE.Color(0x8BC34A);
    const grassColor = new THREE.Color(0x4CAF50);
    const lightGrassColor = new THREE.Color(0x66BB6A);
    const rockColor = new THREE.Color(0x6D6D6D);
    const darkRockColor = new THREE.Color(0x424242);
    const deepRainforestColor = new THREE.Color(0x0D3D0D);
    
    const terrainScale = 0.15;
    
    let airportRadius = 100 * worldScale;
    let airportTransition = 50 * worldScale;
    
    for (let i = 0; i < posAttr.count; i++) {
        const px = posAttr.getX(i);
        const pz = posAttr.getZ(i);
        
        const u = (px / terrainWidth) + 0.5;
        const v = (pz / terrainHeight) + 0.5;
        
        const imgX = u * (imgWidth - 1);
        const imgY = (1 - v) * (imgHeight - 1);
        
        let normalizedHeight = getHeightFromData(heightData, imgWidth, imgHeight, imgX, imgY) / 255;
        
        const delta = 5;
        const h1 = getHeightFromData(heightData, imgWidth, imgHeight, imgX - delta, imgY) / 255;
        const h2 = getHeightFromData(heightData, imgWidth, imgHeight, imgX + delta, imgY) / 255;
        const h3 = getHeightFromData(heightData, imgWidth, imgHeight, imgX, imgY - delta) / 255;
        const h4 = getHeightFromData(heightData, imgWidth, imgHeight, imgX, imgY + delta) / 255;
        const slope = Math.max(Math.abs(h1 - h2), Math.abs(h3 - h4)) * elevRange;
        
        let height = minElev + normalizedHeight * elevRange;
        
        const dist = Math.sqrt(px * px + pz * pz);
        const maxDist = Math.min(terrainWidth, terrainHeight) * 0.45;
        
        let edgeFade = 1;
        if (dist > maxDist * 0.7) {
            edgeFade = Math.max(0, 1 - (dist - maxDist * 0.7) / (maxDist * 0.3));
        }
        
        if (normalizedHeight < 0.05 || edgeFade < 0.1) {
            posAttr.setY(i, -50);
            colors.push(0, 0, 0);
            continue;
        }
        
        height *= terrainScale;
        
        if (hasAirport) {
            const airportDist = Math.sqrt(px * px + pz * pz);
            if (airportDist < airportRadius) {
                height = waterLevel + 0.5;
            } else if (airportDist < airportRadius + airportTransition) {
                const t = (airportDist - airportRadius) / airportTransition;
                const smoothT = t * t * (3 - 2 * t);
                height = height * smoothT + (waterLevel + 0.5) * (1 - smoothT);
            }
        }
        
        height *= edgeFade;
        height = Math.max(waterLevel - 5, height);
        
        posAttr.setY(i, height);
        
        const realHeight = height / terrainScale;
        
        let color;
        
        const isUnderwater = height < waterLevel;
        const isFlat = slope < 8;
        const isSteep = slope > 450;
        const isModeratelySteep = slope > 120 && slope <= 400;
        
        const seed = (Math.sin(px * 0.013 + pz * 0.017) * 43758.5453) % 1;
        const variation = Math.abs(seed);
        
        if (isSteep) {
            color = rockColor.clone().lerp(darkRockColor, variation);
        } else if (isModeratelySteep && realHeight > 15) {
            color = deepRainforestColor.clone().lerp(forestColor, variation);
        } else if ((isUnderwater && height > waterLevel - 20) || (!isUnderwater && realHeight < 500)) {
            const t = isUnderwater ? (height - (waterLevel - 20)) / 20 : (realHeight / 500);
            color = darkSandColor.clone().lerp(beachColor, Math.min(1, t));
        } else if (realHeight >= 300) {
            color = forestColor.clone().lerp(new THREE.Color(0x2E7D32), variation);
        } else if (realHeight >= 100) {
            color = shrublandColor.clone().lerp(new THREE.Color(0x558B2F), variation);
        } else {
            color = grasslandColor.clone().lerp(grassColor, variation);
        }
        
        colors.push(color.r, color.g, color.b);
    }
    
    terrainGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    terrainGeo.computeVertexNormals();
    
    const terrainMat = new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.85,
        metalness: 0.05,
        flatShading: false,
        side: THREE.DoubleSide
    });
    
    const terrain = new THREE.Mesh(terrainGeo, terrainMat);
    terrain.receiveShadow = true;
    terrain.castShadow = true;
    
    const group = new THREE.Group();
    group.add(terrain);
    
    group.position.set(worldX, -50, worldZ);
    scene.add(group);
    
    return group;
}

function createPalmTree(localX, localZ, terrainY, group) {
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    const leafColors = {
        forest: 0x1B5E20,
        shrubland: 0x6B8E23,
        grassland: 0x8BC34A
    };
    const leafMat = new THREE.MeshStandardMaterial({ color: leafColors.forest });
    
    const palmHeight = 5 + Math.random() * 2;
    
    const trunkGeo = new THREE.CylinderGeometry(0.2, 0.35, palmHeight, 6);
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.set(localX, terrainY + palmHeight / 2, localZ);
    trunk.rotation.z = (Math.random() - 0.5) * 0.15;
    trunk.castShadow = true;
    group.add(trunk);
    
    const frondCount = 5 + Math.floor(Math.random() * 2);
    for (let k = 0; k < frondCount; k++) {
        const frondGeo = new THREE.ConeGeometry(0.8 + Math.random() * 0.4, 3 + Math.random() * 2, 4);
        const frond = new THREE.Mesh(frondGeo, leafMat);
        const frondAngle = (k / frondCount) * Math.PI * 2 + Math.random() * 0.3;
        
        frond.position.set(
            localX + Math.cos(frondAngle) * 0.3,
            terrainY + palmHeight + 0.2,
            localZ + Math.sin(frondAngle) * 0.3
        );
        frond.rotation.x = 1.1 + Math.random() * 0.3;
        frond.rotation.z = frondAngle + Math.PI / 2;
        frond.castShadow = true;
        group.add(frond);
    }
}

function createDeciduousTree(localX, localZ, terrainY, group, scale) {
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5D4037 });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x2E7D32 });
    const darkLeafMat = new THREE.MeshStandardMaterial({ color: 0x1B5E20 });
    
    const trunkHeight = 4 * scale + Math.random() * 4 * scale;
    const trunkGeo = new THREE.CylinderGeometry(0.15 * scale, 0.4 * scale, trunkHeight, 6);
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    // terrainY is the mesh Y position (matches terrain vertices)
    trunk.position.set(localX, terrainY + trunkHeight / 2, localZ);
    trunk.castShadow = true;
    group.add(trunk);
    
    const leafCount = 2 + Math.floor(Math.random() * 3);
    for (let j = 0; j < leafCount; j++) {
        const leafGeo = new THREE.ConeGeometry(2 * scale + Math.random() * 1.5 * scale, 3 * scale + Math.random() * 2 * scale, 6);
        const leaf = new THREE.Mesh(leafGeo, Math.random() > 0.5 ? leafMat : darkLeafMat);
        leaf.position.set(
            localX + (Math.random() - 0.5) * scale,
            terrainY + trunkHeight + 1.5 * scale + j * 1.8 * scale,
            localZ + (Math.random() - 0.5) * scale
        );
        leaf.rotation.x = -0.2 + Math.random() * 0.4;
        leaf.rotation.z = Math.random() * Math.PI * 2;
        leaf.castShadow = true;
        group.add(leaf);
    }
}

function createShrub(localX, localZ, terrainY, group, scale) {
    const darkLeafMat = new THREE.MeshStandardMaterial({ color: 0x1B5E20 });
    
    const bushGeo = new THREE.DodecahedronGeometry(1.5 * scale, 0);
    const bush = new THREE.Mesh(bushGeo, darkLeafMat);
    // terrainY is the mesh Y position (matches terrain vertices)
    bush.position.set(localX, terrainY + 1.5 * scale, localZ);
    bush.scale.set(1 + Math.random() * 5, 0.8 + Math.random() * 0.4, 1 + Math.random() * 0.5);
    bush.castShadow = true;
    group.add(bush);
}

const WATER_LEVEL = 2;
const TREE_RENDER_DISTANCE = 450; // ~1500 feet - balance of visibility and performance
const TERRAIN_SCALE = 0.15;
const GROUP_OFFSET_Y = -50;

// Expose WATER_LEVEL globally for other modules
window.WATER_LEVEL = 2;

function isPointOnIsland(worldX, worldZ, islandName) {
    const data = heightmapCache[islandName];
    const meta = islandMetadataCache[islandName];
    if (!data || !meta) return false;
    
    const islandInfo = islandPositions.find(i => i.name === islandName);
    if (!islandInfo) return false;
    
    const localX = worldX - islandInfo.x;
    const localZ = worldZ - islandInfo.z;
    
    const terrainWidth = meta.worldWidth * islandInfo.worldScale;
    const terrainHeight = meta.worldHeight * islandInfo.worldScale;
    
    const halfWidth = terrainWidth / 2;
    const halfHeight = terrainHeight / 2;
    
    if (Math.abs(localX) > halfWidth || Math.abs(localZ) > halfHeight) return false;
    
        const u = (localX / terrainWidth) + 0.5;
        const v = (localZ / terrainHeight) + 0.5;
        
        // Clamp to valid range
        const clampedU = Math.max(0, Math.min(1, u));
        const clampedV = Math.max(0, Math.min(1, v));
        
        // Match createTerrainMesh sampling exactly
        const imgX = clampedU * (1024 - 1);
        const imgY = (1 - clampedV) * (1024 - 1);
    
    const normalizedHeight = getHeightFromData(data, 1024, 1024, imgX, imgY) / 255;
    
    return normalizedHeight >= 0.05;
}

function getTerrainMeshHeight(worldX, worldZ, islandName) {
    const data = heightmapCache[islandName];
    const meta = islandMetadataCache[islandName];
    const islandInfo = islandPositions.find(i => i.name === islandName);
    
    if (!data || !meta || !islandInfo) return GROUP_OFFSET_Y;
    
    const localX = worldX - islandInfo.x;
    const localZ = worldZ - islandInfo.z;
    
    const terrainWidth = meta.worldWidth * islandInfo.worldScale;
    const terrainHeight = meta.worldHeight * islandInfo.worldScale;
    
    // Sample heightmap (match createTerrainMesh exactly)
    const u = (localX / terrainWidth) + 0.5;
    const v = (localZ / terrainHeight) + 0.5;
    const clampedU = Math.max(0, Math.min(1, u));
    const clampedV = Math.max(0, Math.min(1, v));
    const imgX = clampedU * (1024 - 1);
    const imgY = (1 - clampedV) * (1024 - 1);
    
    const normalizedHeight = getHeightFromData(data, 1024, 1024, imgX, imgY) / 255;
    
    // Convert to real elevation
    const minElev = meta.minElevation;
    const maxElev = meta.maxElevation;
    const elevRange = maxElev - minElev;
    let height = minElev + normalizedHeight * elevRange;
    
    // Apply terrain scale
    height *= TERRAIN_SCALE;
    
    // Calculate edge fade (same as createTerrainMesh)
    const px = localX;
    const pz = localZ;
    const dist = Math.sqrt(px * px + pz * pz);
    const maxDist = Math.min(terrainWidth, terrainHeight) * 0.45;
    
    let edgeFade = 1;
    if (dist > maxDist * 0.7) {
        edgeFade = Math.max(0, 1 - (dist - maxDist * 0.7) / (maxDist * 0.3));
    }
    
    // If below threshold, return low value (won't place trees here anyway)
    if (normalizedHeight < 0.05 || edgeFade < 0.1) {
        return GROUP_OFFSET_Y - 50;
    }
    
    // Airport flattening (Maui)
    if (islandInfo.hasAirport) {
        const airportRadius = 100 * islandInfo.worldScale;
        const airportTransition = 50 * islandInfo.worldScale;
        const airportDist = Math.sqrt(px * px + pz * pz);
        const waterLevel = 2;
        
        if (airportDist < airportRadius) {
            height = waterLevel + 0.5;
        } else if (airportDist < airportRadius + airportTransition) {
            const t = (airportDist - airportRadius) / airportTransition;
            const smoothT = t * t * (3 - 2 * t);
            height = height * smoothT + (waterLevel + 0.5) * (1 - smoothT);
        }
    }
    
    // Apply edge fade and water clamp
    height *= edgeFade;
    height = Math.max(WATER_LEVEL - 5, height);
    
    // Return mesh Y position (this is what gets added to group.position.y)
    return height;
}

function getBiomeFromTerrain(worldX, worldZ) {
    const terrainScale = 0.15;
    const groupOffsetY = -50;
    
    for (let i = 0; i < islandPositions.length; i++) {
        const islandInfo = islandPositions[i];
        const data = heightmapCache[islandInfo.name];
        const meta = islandMetadataCache[islandInfo.name];
        
        if (!data || !meta) continue;
        
        const localX = worldX - islandInfo.x;
        const localZ = worldZ - islandInfo.z;
        
        const terrainWidth = meta.worldWidth * islandInfo.worldScale;
        const terrainHeight = meta.worldHeight * islandInfo.worldScale;
        
        const halfWidth = terrainWidth / 2;
        const halfHeight = terrainHeight / 2;
        
        if (Math.abs(localX) > halfWidth || Math.abs(localZ) > halfHeight) continue;
        
        const u = (localX / terrainWidth) + 0.5;
        const v = (localZ / terrainHeight) + 0.5;
        
        // Clamp to valid range and match createTerrainMesh sampling exactly
        const clampedU = Math.max(0, Math.min(1, u));
        const clampedV = Math.max(0, Math.min(1, v));
        
        const imgX = clampedU * (1024 - 1);
        const imgY = (1 - clampedV) * (1024 - 1);
        
        const height = getHeightFromData(data, 1024, 1024, imgX, imgY) / 255;
        const realHeight = meta.minElevation + height * (meta.maxElevation - meta.minElevation);
        
        // Calculate slope by sampling nearby points
        const delta = 5;
        const h1 = getHeightFromData(data, 1024, 1024, imgX - delta, imgY) / 255;
        const h2 = getHeightFromData(data, 1024, 1024, imgX + delta, imgY) / 255;
        const h3 = getHeightFromData(data, 1024, 1024, imgX, imgY - delta) / 255;
        const h4 = getHeightFromData(data, 1024, 1024, imgX, imgY + delta) / 255;
        
        const slope = Math.max(
            Math.abs(h1 - h2),
            Math.abs(h3 - h4)
        ) * (meta.maxElevation - meta.minElevation);
        
        const worldHeight = realHeight * terrainScale + groupOffsetY;
        
        // Classification based on height and slope
        if (worldHeight <= 2) {
            return { biome: 'water', height: worldHeight, slope: slope };
        }
        
        if (worldHeight < 15 && slope < 3) {
            return { biome: 'beach', height: worldHeight, slope: slope };
        }
        
        if (worldHeight < 50 && slope < 5) {
            return { biome: 'grassland', height: worldHeight, slope: slope };
        }
        
        if (worldHeight < 150 && slope < 15) {
            return { biome: 'shrubland', height: worldHeight, slope: slope };
        }
        
        if (worldHeight < 300 && slope < 25) {
            return { biome: 'forest', height: worldHeight, slope: slope };
        }
        
        if (slope > 30) {
            return { biome: 'cliff', height: worldHeight, slope: slope };
        }
        
        return { biome: 'rock', height: worldHeight, slope: slope };
    }
    
    return { biome: 'unknown', height: 0, slope: 0 };
}

function addRocks(group, scale, islandRadius, islandName) {
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x5D5D5D, roughness: 0.9, flatShading: true });
    const darkRockMat = new THREE.MeshStandardMaterial({ color: 0x3D3D3D, roughness: 0.95, flatShading: true });
    
    const rockCount = Math.floor(8 * scale);
    
    for (let i = 0; i < rockCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 20 * scale + Math.random() * islandRadius * 0.35;
        
        const localX = Math.cos(angle) * radius;
        const localZ = Math.sin(angle) * radius;
        
        const worldX = group.position.x + localX;
        const worldZ = group.position.z + localZ;
        
        // Use getTerrainMeshHeight to get the actual mesh Y position
        const terrainY = getTerrainMeshHeight(worldX, worldZ, islandName);
        
        if (terrainY <= WATER_LEVEL) continue;
        
        const rockSize = (1 + Math.random() * 2) * scale;
        const rockGeo = new THREE.DodecahedronGeometry(rockSize, 0);
        const rock = new THREE.Mesh(rockGeo, Math.random() > 0.5 ? rockMat : darkRockMat);
        
        // terrainY is now the mesh Y position (matches terrain vertices)
        rock.position.set(
            localX,
            terrainY + rockSize * 0.3,
            localZ
        );
        rock.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
        );
        rock.scale.set(
            0.8 + Math.random() * 0.4,
            0.5 + Math.random() * 0.5,
            0.8 + Math.random() * 0.4
        );
        rock.castShadow = true;
        group.add(rock);
    }
}

async function loadAirportPositions() {
    const airportMap = {};
    
    for (const island of islandPositions) {
        try {
            const airports = await parseAirportMap(island.name);
            airportMap[island.name] = airports;
            console.log(`Loaded ${airports.length} airports for ${island.name}`);
        } catch (e) {
            console.warn(`No airport map for ${island.name}:`, e.message);
            airportMap[island.name] = [];
        }
    }
    
    return airportMap;
}

const islandPositions = [
    { name: 'maui', x: 0, z: 0, hasAirport: true, airports: [], worldScale: 0.08, bounds: { north: 21.031, south: 20.574, east: -155.979, west: -156.697 } },
    { name: 'big-island', x: 3200, z: -6400, hasAirport: false, airports: [], worldScale: 0.08, bounds: { north: 20.310, south: 18.861, east: -154.756, west: -156.124 } },
    { name: 'oahu', x: -6400, z: -2800, hasAirport: false, airports: [], worldScale: 0.08, bounds: { north: 21.712, south: 21.254, east: -157.648, west: -158.280 } },
    { name: 'kauai', x: -12000, z: -4000, hasAirport: false, airports: [], worldScale: 0.08, bounds: { north: 22.238, south: 21.855, east: -159.281, west: -159.798 } },
    { name: 'molokai', x: -1400, z: -3600, hasAirport: false, airports: [], worldScale: 0.08, bounds: { north: 21.224, south: 21.046, east: -156.709, west: -157.310 } },
    { name: 'lanai', x: 1400, z: -3200, hasAirport: false, airports: [], worldScale: 0.08, bounds: { north: 20.929, south: 20.731, east: -156.805, west: -157.062 } },
    { name: 'niihau', x: -9600, z: -4800, hasAirport: false, airports: [], worldScale: 0.08, bounds: { north: 22.028, south: 21.778, east: -160.049, west: -160.247 } },
    { name: 'kahoolawe', x: 2200, z: -2200, hasAirport: false, airports: [], worldScale: 0.08, bounds: { north: 20.637, south: 20.496, east: -156.490, west: -156.704 } }
];

async function createAllIslands(scene, onProgress) {
    console.log('Loading airport positions...');
    const airportPositions = await loadAirportPositions();
    
    for (const island of islandPositions) {
        island.airports = airportPositions[island.name] || [];
    }
    
    const total = islandPositions.length;
    let loaded = 0;
    
    const loadPromises = islandPositions.map(island => {
        return createIslandFromHeightmap(
            scene,
            island.name,
            island.x,
            island.z,
            { hasAirport: island.hasAirport, worldScale: island.worldScale }
        ).then(islandGroup => {
            loaded++;
            if (onProgress) onProgress(Math.round((loaded / total) * 100));
            return { island: islandGroup, info: island };
        });
    });

    const results = await Promise.all(loadPromises);
    
    // Initialize FloraManager with global camera reference (skip on mobile)
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        || (navigator.maxTouchPoints > 0 && window.innerWidth < 1024);
    
    console.log('createAllIslands: window.camera =', window.camera);
    if (window.camera && !isMobile) {
        console.log('Creating FloraManager...');
        const floraManager = new FloraManager(scene, window.camera);
        window.floraManager = floraManager;
        
        for (const { island: islandGroup, info } of results) {
            floraManager.placeTreesForIsland(islandGroup, info.name, info.x, info.z);
        }
        
        console.log(`FloraManager created with ${floraManager.allTrees.length} total trees`);
    } else if (isMobile) {
        console.log('Skipping FloraManager on mobile');
    } else {
        console.warn('No window.camera available, FloraManager not created');
    }

    // Create airports for all islands
    console.log('Creating airports...');
    for (const { island: islandGroup, info } of results) {
        if (!info.airports || info.airports.length === 0) {
            console.log(`No airports found for ${info.name}`);
            continue;
        }
        
        for (const airport of info.airports) {
            const meta = islandMetadataCache[info.name];
            if (!meta) {
                console.warn(`No metadata for ${info.name}, skipping airport`);
                continue;
            }
            
            const terrainWidth = meta.worldWidth * info.worldScale;
            const terrainHeight = meta.worldHeight * info.worldScale;
            
            const u = airport.x / 1023;
            const v = airport.y / 1023;
            
            const localX = (u - 0.5) * terrainWidth;
            const localZ = (v - 0.5) * terrainHeight;
            
            const worldX = info.x + localX;
            const worldZ = info.z + localZ;
            
            const isLarge = ['maui', 'oahu', 'kauai', 'big-island'].includes(info.name);
            
            const terrainY = getTerrainHeight(worldX, worldZ);
            
            createAirport(scene, worldX, worldZ, islandGroup, { isLarge });
            console.log(`Created ${isLarge ? 'large' : 'small'} airport on ${info.name} at`, { worldX, worldZ, terrainY });
        }
    }

    // Create BuildingManager and place buildings (skip on mobile)
    if (window.camera && !isMobile) {
        console.log('Creating BuildingManager...');
        const buildingManager = new BuildingManager(scene, window.camera);
        window.buildingManager = buildingManager;
        
        for (const { island: islandGroup, info } of results) {
            buildingManager.placeBuildingsForIsland(islandGroup, info.name, info.x, info.z);
        }
        
        console.log(`BuildingManager created with ${buildingManager.allBuildings.length} total buildings`);
    }

    return results.map(r => r.island);
}
