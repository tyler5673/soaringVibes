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
    
    const segments = 768;
    const terrainGeo = new THREE.PlaneGeometry(terrainWidth, terrainHeight, segments, segments);
    terrainGeo.rotateX(-Math.PI / 2);
    
    const posAttr = terrainGeo.attributes.position;
    const colors = [];
    
    const minElev = meta.minElevation;
    const maxElev = meta.maxElevation;
    const elevRange = maxElev - minElev;
    
    const waterLevel = 2;
    const beachLevel = 10;
    const grassLevel = 40;
    const forestLevel = 120;
    const cliffLevel = Math.max(200, maxElev * 0.5);
    const snowLevel = Math.max(200, maxElev * 0.7);
    
    const sandColor = new THREE.Color(0x228B22);
    const darkSandColor = new THREE.Color(0x1B5E20);
    const lightGrassColor = new THREE.Color(0x228B22);
    const grassColor = new THREE.Color(0x228B22);
    const darkGrassColor = new THREE.Color(0x1B5E20);
    const forestColor = new THREE.Color(0x1B5E20);
    const rockColor = new THREE.Color(0x228B22);
    const darkRockColor = new THREE.Color(0x1B5E20);
    const snowColor = new THREE.Color(0x228B22);
    
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
        
        if (realHeight < waterLevel + 2) {
            color = darkSandColor;
        } else if (realHeight < beachLevel) {
            const t = (realHeight - waterLevel) / (beachLevel - waterLevel);
            const t2 = t * t;
            color = darkSandColor.clone().lerp(sandColor, t2);
        } else if (realHeight < grassLevel) {
            const t = (realHeight - beachLevel) / (grassLevel - beachLevel);
            const t2 = Math.sqrt(t);
            const variation = (Math.sin(px * 0.1) * Math.cos(pz * 0.1) * 0.5 + 0.5) * 0.15;
            color = sandColor.clone().lerp(grassColor, t2 + variation);
            if (t > 0.7) {
                color.lerp(lightGrassColor, (t - 0.7) / 0.3 * 0.5);
            }
        } else if (realHeight < forestLevel) {
            const t = (realHeight - grassLevel) / (forestLevel - grassLevel);
            const t2 = Math.sqrt(t);
            const variation = (Math.sin(px * 0.05 + pz * 0.07) * 0.5 + 0.5) * 0.2;
            color = grassColor.clone().lerp(darkGrassColor, t2);
            color.lerp(forestColor, variation);
        } else if (realHeight < cliffLevel) {
            const t = (realHeight - forestLevel) / (cliffLevel - forestLevel);
            const t2 = Math.sqrt(t);
            const slopeFactor = Math.min(1, (realHeight - grassLevel) / 100);
            color = darkGrassColor.clone().lerp(forestColor, 1 - t2);
            color.lerp(rockColor, slopeFactor * 0.7);
        } else if (realHeight < snowLevel) {
            const t = (realHeight - cliffLevel) / (snowLevel - cliffLevel);
            const t2 = t * t;
            const variation = (Math.sin(px * 0.2) * Math.cos(pz * 0.2) * 0.5 + 0.5) * 0.2;
            color = rockColor.clone().lerp(darkRockColor, variation);
            color.lerp(snowColor, t2 * 0.5);
        } else {
            const t = Math.min(1, (realHeight - snowLevel) / 50);
            color = darkRockColor.clone().lerp(snowColor, t);
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
    
    group.position.set(worldX, -25, worldZ);
    scene.add(group);
    
    return group;
}

function addVegetation(group, scale, islandRadius) {
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5D4037 });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x2E7D32 });
    const darkLeafMat = new THREE.MeshStandardMaterial({ color: 0x1B5E20 });
    
    const treeCount = Math.floor(20 * scale);
    
    for (let i = 0; i < treeCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 30 * scale + Math.random() * (islandRadius * 0.4);
        
        const treeType = Math.random();
        
        if (treeType < 0.6) {
            const trunkHeight = 4 * scale + Math.random() * 4 * scale;
            const trunkGeo = new THREE.CylinderGeometry(0.15 * scale, 0.4 * scale, trunkHeight, 6);
            const trunk = new THREE.Mesh(trunkGeo, trunkMat);
            trunk.position.set(Math.cos(angle) * radius, trunkHeight / 2 + 2, Math.sin(angle) * radius);
            trunk.castShadow = true;
            group.add(trunk);
            
            const leafCount = 2 + Math.floor(Math.random() * 3);
            for (let j = 0; j < leafCount; j++) {
                const leafGeo = new THREE.ConeGeometry(2 * scale + Math.random() * 1.5 * scale, 3 * scale + Math.random() * 2 * scale, 6);
                const leaf = new THREE.Mesh(leafGeo, Math.random() > 0.5 ? leafMat : darkLeafMat);
                leaf.position.set(
                    trunk.position.x + (Math.random() - 0.5) * scale,
                    trunkHeight + 1.5 * scale + j * 1.8 * scale,
                    trunk.position.z + (Math.random() - 0.5) * scale
                );
                leaf.rotation.x = -0.2 + Math.random() * 0.4;
                leaf.rotation.z = Math.random() * Math.PI * 2;
                leaf.castShadow = true;
                group.add(leaf);
            }
        } else if (treeType < 0.85) {
            const palmHeight = 6 * scale + Math.random() * 4 * scale;
            const trunkGeo = new THREE.CylinderGeometry(0.2 * scale, 0.35 * scale, palmHeight, 6);
            const trunk = new THREE.Mesh(trunkGeo, trunkMat);
            trunk.position.set(Math.cos(angle) * radius, palmHeight / 2 + 2, Math.sin(angle) * radius);
            trunk.rotation.z = (Math.random() - 0.5) * 0.1;
            trunk.castShadow = true;
            group.add(trunk);
            
            for (let j = 0; j < 5; j++) {
                const leafGeo = new THREE.ConeGeometry(1.5 * scale, 4 * scale, 4);
                const leaf = new THREE.Mesh(leafGeo, darkLeafMat);
                leaf.position.set(
                    trunk.position.x + Math.cos(j * Math.PI * 2 / 5) * 0.5 * scale,
                    palmHeight + 1 * scale,
                    trunk.position.z + Math.sin(j * Math.PI * 2 / 5) * 0.5 * scale
                );
                leaf.rotation.x = 0.8;
                leaf.rotation.z = j * Math.PI * 2 / 5;
                leaf.castShadow = true;
                group.add(leaf);
            }
        } else {
            const bushGeo = new THREE.DodecahedronGeometry(1.5 * scale, 0);
            const bush = new THREE.Mesh(bushGeo, darkLeafMat);
            bush.position.set(
                Math.cos(angle) * radius,
                2 * scale,
                Math.sin(angle) * radius
            );
            bush.scale.set(1 + Math.random() * 0.5, 0.8 + Math.random() * 0.4, 1 + Math.random() * 0.5);
            bush.castShadow = true;
            group.add(bush);
        }
    }
}

function addRocks(group, scale, islandRadius) {
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x5D5D5D, roughness: 0.9, flatShading: true });
    const darkRockMat = new THREE.MeshStandardMaterial({ color: 0x3D3D3D, roughness: 0.95, flatShading: true });
    
    const rockCount = Math.floor(8 * scale);
    
    for (let i = 0; i < rockCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 20 * scale + Math.random() * islandRadius * 0.35;
        
        const rockSize = (1 + Math.random() * 2) * scale;
        const rockGeo = new THREE.DodecahedronGeometry(rockSize, 0);
        const rock = new THREE.Mesh(rockGeo, Math.random() > 0.5 ? rockMat : darkRockMat);
        
        rock.position.set(
            Math.cos(angle) * radius,
            rockSize * 0.3 + 2,
            Math.sin(angle) * radius
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

const islandPositions = [
    { name: 'maui', x: 0, z: 0, hasAirport: true, worldScale: 0.08 },
    { name: 'big-island', x: 3200, z: -6400, hasAirport: false, worldScale: 0.08 },
    { name: 'oahu', x: -6400, z: -2800, hasAirport: false, worldScale: 0.08 },
    { name: 'kauai', x: -12000, z: -4000, hasAirport: false, worldScale: 0.08 },
    { name: 'molokai', x: -1400, z: -3600, hasAirport: false, worldScale: 0.08 },
    { name: 'lanai', x: 1400, z: -3200, hasAirport: false, worldScale: 0.08 },
    { name: 'niihau', x: -9600, z: -4800, hasAirport: false, worldScale: 0.08 },
    { name: 'kahoolawe', x: 2200, z: -2200, hasAirport: false, worldScale: 0.08 }
];

async function createAllIslands(scene, onProgress) {
    const total = islandPositions.length;
    let loaded = 0;
    
    const loadPromises = islandPositions.map(island => {
        return createIslandFromHeightmap(
            scene,
            island.name,
            island.x,
            island.z,
            { hasAirport: island.hasAirport, worldScale: island.worldScale }
        ).then(island => {
            loaded++;
            if (onProgress) onProgress(Math.round((loaded / total) * 100));
            return island;
        });
    });

    const islands = await Promise.all(loadPromises);

    islands.forEach((islandGroup, index) => {
        const info = islandPositions[index];
        const radius = 500 * info.worldScale;
        
        addVegetation(islandGroup, info.worldScale, radius);
        addRocks(islandGroup, info.worldScale, radius);
        
        if (info.hasAirport) {
            createAirport(scene, info.x, info.z, islandGroup);
        }
    });

    return islands;
}
