// ========== ISLANDS ==========
function addPalmTrees(island, scale) {
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x228B22 });
    const darkLeafMat = new THREE.MeshStandardMaterial({ color: 0x1B5E20 });
    
    for (let i = 0; i < 8; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 80 * scale * Math.random() + 20 * scale;
        
        const trunkHeight = 5 * scale + Math.random() * 3 * scale;
        const trunkGeo = new THREE.CylinderGeometry(0.2 * scale, 0.5 * scale, trunkHeight, 6);
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.set(Math.cos(angle) * radius, trunkHeight / 2, Math.sin(angle) * radius);
        trunk.rotation.z = (Math.random() - 0.5) * 0.15;
        trunk.castShadow = true;
        island.add(trunk);
        
        const leafCount = 2 + Math.floor(Math.random() * 2);
        for (let j = 0; j < leafCount; j++) {
            const leafGeo = new THREE.ConeGeometry(2.5 * scale + Math.random() * 2 * scale, 2 * scale + Math.random() * 1.5 * scale, 5);
            const leaf = new THREE.Mesh(leafGeo, Math.random() > 0.5 ? leafMat : darkLeafMat);
            leaf.position.set(
                trunk.position.x + (Math.random() - 0.5) * 2 * scale,
                trunkHeight + 1.5 * scale + j * 1.5 * scale,
                trunk.position.z + (Math.random() - 0.5) * 2 * scale
            );
            leaf.rotation.x = -0.3 + Math.random() * 0.6;
            leaf.rotation.z = Math.random() * Math.PI * 2;
            leaf.castShadow = true;
            island.add(leaf);
        }
    }
}

function addBuildings(island, scale) {
    const buildingColors = [0xFFFAF0, 0xE8E8E8, 0xFFF8DC, 0xF5F5DC, 0xFFE4C4];
    const roofColors = [0xFF6B6B, 0x4169E1, 0x228B22, 0x8B4513, 0x696969];
    
    for (let i = 0; i < 4; i++) {
        const width = (8 + Math.random() * 10) * scale;
        const height = (6 + Math.random() * 10) * scale;
        const depth = (8 + Math.random() * 10) * scale;
        
        const buildingGeo = new THREE.BoxGeometry(width, height, depth);
        const buildingMat = new THREE.MeshStandardMaterial({ color: buildingColors[i % buildingColors.length] });
        const building = new THREE.Mesh(buildingGeo, buildingMat);
        
        const angle = Math.random() * Math.PI * 2;
        const dist = 60 * scale + Math.random() * 80 * scale;
        building.position.set(
            Math.cos(angle) * dist,
            height / 2,
            Math.sin(angle) * dist
        );
        building.castShadow = true;
        island.add(building);
        
        const roofGeo = new THREE.BoxGeometry(width * 1.1, 2 * scale, depth * 1.1);
        const roofMat = new THREE.MeshStandardMaterial({ color: roofColors[i % roofColors.length] });
        const roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.set(building.position.x, height + 1 * scale, building.position.z);
        roof.castShadow = true;
        island.add(roof);
    }
}

function createIsland(scene, x, z, scale = 1, hasAirport = false) {
    const group = new THREE.Group();
    const baseRadius = 300 * scale;
    const seed = x * 0.1 + z * 0.1;
    
    // Organic island shape using noise
    function getIslandShape(px, pz) {
        const angle = Math.atan2(pz, px);
        const baseR = baseRadius * (0.7 + 0.3 * Math.sin(angle * 3 + seed) * Math.cos(angle * 2 + seed * 0.5));
        const noiseR = noise(px * 0.02, pz * 0.02, seed) * baseRadius * 0.3;
        return baseR + noiseR;
    }
    
    // Terrain mesh - high poly with Maui-like gentle slopes
    const terrainSize = baseRadius * 3;
    const segments = 120;
    const terrainGeo = new THREE.PlaneGeometry(terrainSize, terrainSize, segments, segments);
    terrainGeo.rotateX(-Math.PI / 2);
    
    // Maui-style mountains: gentle shield volcanoes
    const mountainCount = hasAirport ? 1 : 3;
    const mountains = [];
    for (let i = 0; i < mountainCount; i++) {
        const angle = (i / mountainCount) * Math.PI * 2 + 0.5;
        const dist = baseRadius * (0.25 + Math.random() * 0.2);
        mountains.push({
            x: Math.cos(angle) * dist,
            z: Math.sin(angle) * dist,
            h: (120 + Math.random() * 80) * scale,
            r: (150 + Math.random() * 100) * scale
        });
    }
    
    const posAttr = terrainGeo.attributes.position;
    const colors = [];
    const grassColor = new THREE.Color(0x228B22);
    const darkGrassColor = new THREE.Color(0x1B5E20);
    const sandColor = new THREE.Color(0xF4D03F);
    const darkSandColor = new THREE.Color(0xC9A020);
    const rockColor = new THREE.Color(0x666666);
    const snowColor = new THREE.Color(0xFFFFFF);
    
    const airportCenter = hasAirport ? { x: 0, z: 0 } : null;
    const airportRadius = 120 * scale;
    const airportTransition = 80 * scale;
    
    for (let i = 0; i < posAttr.count; i++) {
        const px = posAttr.getX(i);
        const pz = posAttr.getZ(i);
        const dist = Math.sqrt(px * px + pz * pz);
        const shapeRadius = getIslandShape(px, pz);
        
        if (dist > shapeRadius * 1.05) {
            posAttr.setY(i, -20);
            colors.push(0, 0, 0);
            continue;
        }
        
        // Base terrain from noise
        const n = noise(px * 0.3, pz * 0.3, seed);
        let height = 5 + n * 20 * scale;
        
        // Add gentle coastal rise
        const edgeFactor = Math.max(0, 1 - dist / shapeRadius);
        height += edgeFactor * edgeFactor * 30 * scale;
        
        // Add Maui-style gentle mountains
        for (const m of mountains) {
            const dx = px - m.x;
            const dz = pz - m.z;
            const mDist = Math.sqrt(dx * dx + dz * dz);
            if (mDist < m.r) {
                const t = 1 - (mDist / m.r);
                const smoothT = t * t * (3 - 2 * t);
                height += smoothT * m.h;
            }
        }
        
        // Flat area for airport
        if (hasAirport) {
            const airportDist = Math.sqrt(Math.pow(px - airportCenter.x, 2) + Math.pow(pz - airportCenter.z, 2));
            if (airportDist < airportRadius) {
                height = 2;
            } else if (airportDist < airportRadius + airportTransition) {
                const t = (airportDist - airportRadius) / airportTransition;
                const smoothT = t * t * (3 - 2 * t);
                height = height * smoothT + 2 * (1 - smoothT);
            }
        }
        
        posAttr.setY(i, Math.max(0.5, height));
        
        // Color based on elevation
        const waterLevel = 2;
        const beachLevel = 8;
        const cliffLevel = height * 0.6;
        const snowLevel = Math.max(100 * scale, height * 0.75);
        
        let color;
        if (height < waterLevel + 1) {
            color = darkSandColor;
        } else if (height < beachLevel) {
            const t = (height - waterLevel) / (beachLevel - waterLevel);
            color = sandColor.clone().lerp(grassColor, t * t);
        } else if (height < cliffLevel) {
            const t = (height - beachLevel) / (cliffLevel - beachLevel);
            color = grassColor.clone().lerp(darkGrassColor, t);
        } else if (height > snowLevel - 15) {
            const t = Math.min(1, (height - snowLevel + 15) / 30);
            color = rockColor.clone().lerp(snowColor, t * t);
        } else {
            color = darkGrassColor;
        }
        
        colors.push(color.r, color.g, color.b);
    }
    
    terrainGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    terrainGeo.computeVertexNormals();
    
    const terrainMat = new THREE.MeshStandardMaterial({ 
        vertexColors: true,
        roughness: 0.9,
        flatShading: true,
        side: THREE.DoubleSide
    });
    const terrain = new THREE.Mesh(terrainGeo, terrainMat);
    terrain.position.y = 0;
    terrain.receiveShadow = true;
    group.add(terrain);
    
    // Small rocky outcrops
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.9, flatShading: true });
    for (let i = 0; i < 5; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = baseRadius * 0.2 + Math.random() * baseRadius * 0.5;
        const rockGeo = new THREE.DodecahedronGeometry(1.5 * scale * (0.3 + Math.random() * 0.4), 0);
        const rock = new THREE.Mesh(rockGeo, rockMat);
        rock.position.set(
            Math.cos(angle) * dist,
            2 * scale,
            Math.sin(angle) * dist
        );
        rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        rock.scale.y = 0.5 + Math.random() * 0.5;
        rock.castShadow = true;
        group.add(rock);
    }
    
    if (!hasAirport) {
        addPalmTrees(group, scale);
        addBuildings(group, scale);
    }
    
    group.position.set(x, 0, z);
    scene.add(group);
    return group;
}
