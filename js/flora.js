// js/flora.js - Biome-specific vegetation system with LOD

class TreeGeometryCache {
    constructor() {
        this.cache = new Map();
    }
    
    getGeometry(type, lod) {
        const key = `${type}_${lod}`;
        if (!this.cache.has(key)) {
            this.cache.set(key, this.createGeometry(type, lod));
        }
        return this.cache.get(key);
    }
    
    createGeometry(type, lod) {
        switch(type) {
            case 'palm':
                return this.createPalmGeometry(lod);
            case 'koa':
                return this.createKoaGeometry(lod);
            case 'ohia':
                return this.createOhiaGeometry(lod);
            case 'shrub':
                return this.createShrubGeometry(lod);
            case 'grass':
                return this.createGrassGeometry(lod);
            default:
                return new THREE.BoxGeometry(1, 1, 1);
        }
    }
    
    createPalmGeometry(lod) {
        if (lod === 'far') {
            // Simple crossed planes
            const group = new THREE.Group();
            const geo1 = new THREE.PlaneGeometry(3, 8);
            const geo2 = new THREE.PlaneGeometry(3, 8);
            geo2.rotateY(Math.PI / 2);
            const mat = new THREE.MeshStandardMaterial({ 
                color: 0x4CAF50, 
                side: THREE.DoubleSide 
            });
            group.add(new THREE.Mesh(geo1, mat));
            group.add(new THREE.Mesh(geo2, mat));
            return group;
        }
        
        if (lod === 'medium') {
            // Simple trunk + canopy
            const group = new THREE.Group();
            const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
            const canopyMat = new THREE.MeshStandardMaterial({ color: 0x4CAF50 });
            
            const trunk = new THREE.Mesh(
                new THREE.CylinderGeometry(0.3, 0.4, 8, 6),
                trunkMat
            );
            trunk.position.y = 4;
            trunk.castShadow = true;
            
            const canopy = new THREE.Mesh(
                new THREE.ConeGeometry(2, 3, 6),
                canopyMat
            );
            canopy.position.y = 8;
            canopy.castShadow = true;
            
            group.add(trunk, canopy);
            return group;
        }
        
        // High LOD - full palm tree
        const group = new THREE.Group();
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
        const frondMat = new THREE.MeshStandardMaterial({ color: 0x4CAF50 });
        
        const trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(0.2, 0.35, 10, 8),
            trunkMat
        );
        trunk.position.y = 5;
        trunk.castShadow = true;
        group.add(trunk);
        
        // 7-9 fronds
        const frondCount = 7 + Math.floor(Math.random() * 3);
        for (let i = 0; i < frondCount; i++) {
            const frond = new THREE.Mesh(
                new THREE.ConeGeometry(0.8, 3, 4),
                frondMat
            );
            const angle = (i / frondCount) * Math.PI * 2;
            frond.position.set(
                Math.cos(angle) * 0.5,
                10,
                Math.sin(angle) * 0.5
            );
            frond.rotation.x = 1.2;
            frond.rotation.y = angle;
            frond.castShadow = true;
            group.add(frond);
        }
        
        return group;
    }
    
    createKoaGeometry(lod) {
        if (lod === 'far') {
            return new THREE.Mesh(
                new THREE.SphereGeometry(3, 8, 6),
                new THREE.MeshStandardMaterial({ color: 0x2E7D32 })
            );
        }
        
        if (lod === 'medium') {
            const group = new THREE.Group();
            const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5D4037 });
            const canopyMat = new THREE.MeshStandardMaterial({ color: 0x2E7D32 });
            
            const trunk = new THREE.Mesh(
                new THREE.CylinderGeometry(0.5, 0.8, 15, 8),
                trunkMat
            );
            trunk.position.y = 7.5;
            trunk.castShadow = true;
            
            const canopy = new THREE.Mesh(
                new THREE.SphereGeometry(6, 12, 8),
                canopyMat
            );
            canopy.position.y = 15;
            canopy.castShadow = true;
            
            group.add(trunk, canopy);
            return group;
        }
        
        // High LOD
        const group = new THREE.Group();
        const trunkHeight = 12 + Math.random() * 8;
        const trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(0.4, 0.7, trunkHeight, 8),
            new THREE.MeshStandardMaterial({ color: 0x5D4037 })
        );
        trunk.position.y = trunkHeight / 2;
        trunk.castShadow = true;
        group.add(trunk);
        
        // Spreading branches
        const branchCount = 5 + Math.floor(Math.random() * 4);
        for (let i = 0; i < branchCount; i++) {
            const branch = new THREE.Mesh(
                new THREE.CylinderGeometry(0.15, 0.3, 4, 6),
                new THREE.MeshStandardMaterial({ color: 0x5D4037 })
            );
            const angle = (i / branchCount) * Math.PI * 2 + Math.random() * 0.5;
            const height = trunkHeight * (0.7 + Math.random() * 0.3);
            branch.position.set(
                Math.cos(angle) * 2,
                height,
                Math.sin(angle) * 2
            );
            branch.rotation.z = Math.PI / 2 - 0.3;
            branch.rotation.y = angle;
            group.add(branch);
            
            // Leaf clusters
            const leaves = new THREE.Mesh(
                new THREE.SphereGeometry(1.5, 6, 4),
                new THREE.MeshStandardMaterial({ color: 0x2E7D32 })
            );
            leaves.position.set(
                Math.cos(angle) * 3.5,
                height - 0.5,
                Math.sin(angle) * 3.5
            );
            leaves.castShadow = true;
            group.add(leaves);
        }
        
        return group;
    }
    
    createOhiaGeometry(lod) {
        if (lod === 'far') {
            return new THREE.Mesh(
                new THREE.SphereGeometry(2, 8, 6),
                new THREE.MeshStandardMaterial({ color: 0x1B5E20 })
            );
        }
        
        if (lod === 'medium') {
            const group = new THREE.Group();
            const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8D6E63 });
            const canopyMat = new THREE.MeshStandardMaterial({ color: 0x2E7D32 });
            
            const trunk = new THREE.Mesh(
                new THREE.CylinderGeometry(0.3, 0.5, 8, 8),
                trunkMat
            );
            trunk.position.y = 4;
            trunk.castShadow = true;
            
            const canopy = new THREE.Mesh(
                new THREE.SphereGeometry(3.5, 10, 8),
                canopyMat
            );
            canopy.position.y = 9;
            canopy.castShadow = true;
            
            group.add(trunk, canopy);
            return group;
        }
        
        // High LOD with flowers
        const group = new THREE.Group();
        const trunkHeight = 6 + Math.random() * 6;
        const trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(0.25, 0.4, trunkHeight, 8),
            new THREE.MeshStandardMaterial({ color: 0x8D6E63 })
        );
        trunk.position.y = trunkHeight / 2;
        trunk.castShadow = true;
        group.add(trunk);
        
        // Multiple canopy layers with red flowers
        const canopyMat = new THREE.MeshStandardMaterial({ color: 0x2E7D32 });
        const flowerMat = new THREE.MeshStandardMaterial({ color: 0xD32F2F });
        
        for (let i = 0; i < 3; i++) {
            const canopy = new THREE.Mesh(
                new THREE.SphereGeometry(2 - i * 0.3, 8, 6),
                canopyMat
            );
            canopy.position.y = trunkHeight + 1 + i * 1.5;
            canopy.castShadow = true;
            group.add(canopy);
            
            // Red lehua flowers scattered
            for (let j = 0; j < 5; j++) {
                const flower = new THREE.Mesh(
                    new THREE.SphereGeometry(0.15, 4, 4),
                    flowerMat
                );
                const angle = Math.random() * Math.PI * 2;
                const radius = (2 - i * 0.3) * Math.random();
                flower.position.set(
                    Math.cos(angle) * radius,
                    trunkHeight + 1 + i * 1.5,
                    Math.sin(angle) * radius
                );
                group.add(flower);
            }
        }
        
        return group;
    }
    
    createShrubGeometry(lod) {
        if (lod === 'far') {
            return new THREE.Mesh(
                new THREE.SphereGeometry(1.2, 6, 4),
                new THREE.MeshStandardMaterial({ color: 0x6B8E23 })
            );
        }
        
        if (lod === 'medium') {
            return new THREE.Mesh(
                new THREE.SphereGeometry(1.5, 8, 6),
                new THREE.MeshStandardMaterial({ color: 0x6B8E23 })
            );
        }
        
        // High LOD
        const group = new THREE.Group();
        const trunkCount = 2 + Math.floor(Math.random() * 4);
        const mat = new THREE.MeshStandardMaterial({ color: 0x6B8E23 });
        
        for (let i = 0; i < trunkCount; i++) {
            const trunk = new THREE.Mesh(
                new THREE.CylinderGeometry(0.05, 0.1, 3, 5),
                mat
            );
            const angle = (i / trunkCount) * Math.PI * 2;
            trunk.position.set(
                Math.cos(angle) * 0.3,
                1.5,
                Math.sin(angle) * 0.3
            );
            trunk.rotation.z = (Math.random() - 0.5) * 0.3;
            trunk.castShadow = true;
            group.add(trunk);
            
            const bush = new THREE.Mesh(
                new THREE.SphereGeometry(0.8, 6, 5),
                mat
            );
            bush.position.set(
                Math.cos(angle) * 0.3,
                2.8,
                Math.sin(angle) * 0.3
            );
            bush.castShadow = true;
            group.add(bush);
        }
        
        return group;
    }
    
    createGrassGeometry(lod) {
        if (lod === 'far') {
            return new THREE.Mesh(
                new THREE.PlaneGeometry(0.8, 1.2),
                new THREE.MeshStandardMaterial({ 
                    color: 0x9ACD32,
                    side: THREE.DoubleSide
                })
            );
        }
        
        // Medium and high - same for grass
        const group = new THREE.Group();
        const mat = new THREE.MeshStandardMaterial({ 
            color: 0x9ACD32,
            side: THREE.DoubleSide
        });
        
        const bladeCount = 8 + Math.floor(Math.random() * 8);
        for (let i = 0; i < bladeCount; i++) {
            const blade = new THREE.Mesh(
                new THREE.PlaneGeometry(0.1 + Math.random() * 0.1, 0.5 + Math.random() * 0.5),
                mat
            );
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 0.4;
            blade.position.set(
                Math.cos(angle) * radius,
                0.25 + Math.random() * 0.3,
                Math.sin(angle) * radius
            );
            blade.rotation.y = angle;
            blade.rotation.x = (Math.random() - 0.5) * 0.2;
            group.add(blade);
        }
        
        return group;
    }
}

window.TreeGeometryCache = TreeGeometryCache;

class FloraManager {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.geometryCache = new TreeGeometryCache();
        this.allTrees = [];
        this.maxVisibleTrees = 800; // Increased from 500
        this.updateInterval = 0.1; // Faster updates (was 0.5)
        this.lastUpdate = 0;
        this.perfManager = new PerformanceManager(camera);
    }
    
    getTreeTypeForBiome(biome) {
        switch(biome) {
            case 'beach':
                return { type: 'palm', scale: 0.8 + Math.random() * 0.4 };
            case 'forest':
                const forestTypes = ['koa', 'ohia', 'ohia'];
                return { 
                    type: forestTypes[Math.floor(Math.random() * forestTypes.length)],
                    scale: 0.9 + Math.random() * 0.3
                };
            case 'shrubland':
                const shrubTypes = ['shrub', 'shrub', 'ohia'];
                return {
                    type: shrubTypes[Math.floor(Math.random() * shrubTypes.length)],
                    scale: 0.7 + Math.random() * 0.4
                };
            case 'grassland':
                return { type: 'grass', scale: 0.6 + Math.random() * 0.5 };
            case 'cliff':
            case 'rock':
                return null;
            default:
                return { type: 'shrub', scale: 0.5 + Math.random() * 0.3 };
        }
    }
    
    getDensityForBiome(biome) {
        switch(biome) {
            case 'forest': return 1.0;
            case 'shrubland': return 0.6;
            case 'grassland': return 0.3;
            case 'beach': return 0.15;
            case 'cliff': return 0.02;
            case 'rock': return 0.05;
            default: return 0.1;
        }
    }
    
    placeTreesForIsland(islandGroup, islandName, islandWorldX, islandWorldZ) {
        console.log(`FloraManager: Starting tree placement for ${islandName}`);
        
        const spacing = 50;
        const meta = islandMetadataCache[islandName];
        if (!meta) {
            console.warn(`FloraManager: No metadata for ${islandName}, skipping tree placement`);
            return;
        }
        
        const terrainWidth = meta.worldWidth * 0.08;
        const terrainHeight = meta.worldHeight * 0.08;
        const halfWidth = terrainWidth / 2;
        const halfHeight = terrainHeight / 2;
        
        const startX = islandWorldX - halfWidth;
        const startZ = islandWorldZ - halfHeight;
        const endX = islandWorldX + halfWidth;
        const endZ = islandWorldZ + halfHeight;
        
        let placed = 0;
        
        for (let x = startX; x <= endX; x += spacing) {
            for (let z = startZ; z <= endZ; z += spacing) {
                if (!isPointOnIsland(x, z, islandName)) continue;
                
                const terrainY = getTerrainMeshHeight(x, z, islandName);
                if (terrainY <= WATER_LEVEL + 0.5) continue;
                
                const biomeInfo = getBiomeFromTerrain(x, z);
                if (!biomeInfo || biomeInfo.biome === 'water' || biomeInfo.biome === 'unknown') continue;
                
                const density = this.getDensityForBiome(biomeInfo.biome);
                if (Math.random() > density) continue;
                
                const treeConfig = this.getTreeTypeForBiome(biomeInfo.biome);
                if (!treeConfig) continue;
                
                const localX = x - islandWorldX;
                const localZ = z - islandWorldZ;
                const tree = this.createTree(treeConfig.type, 'medium', localX, terrainY, localZ, treeConfig.scale);
                
                if (tree) {
                    islandGroup.add(tree);
                    this.allTrees.push({
                        mesh: tree,
                        type: treeConfig.type,
                        worldPos: new THREE.Vector3(x, terrainY, z),
                        currentLOD: 'medium',
                        scale: treeConfig.scale
                    });
                    placed++;
                }
            }
        }
        
        console.log(`FloraManager: Placed ${placed} trees on ${islandName}`);
    }
    
    createTree(type, lod, x, y, z, scale) {
        const geometry = this.geometryCache.getGeometry(type, lod);
        if (!geometry) return null;
        
        const tree = geometry.clone();
        tree.position.set(x, y, z);
        tree.scale.setScalar(scale);
        tree.rotation.y = Math.random() * Math.PI * 2;
        tree.visible = true; // Ensure visible by default
        
        return tree;
    }
    
    switchLOD(treeData, newLOD) {
        if (treeData.currentLOD === newLOD) return;
        
        const parent = treeData.mesh.parent;
        const oldMesh = treeData.mesh;
        
        const newMesh = this.createTree(treeData.type, newLOD, 
            oldMesh.position.x, oldMesh.position.y, oldMesh.position.z,
            treeData.scale);
        
        if (newMesh && parent) {
            parent.remove(oldMesh);
            parent.add(newMesh);
            treeData.mesh = newMesh;
            treeData.currentLOD = newLOD;
        }
    }
    
    update(delta) {
        this.lastUpdate += delta;
        if (this.lastUpdate < this.updateInterval) return;
        this.lastUpdate = 0;
        
        this.perfManager.updateFrustum();
        const camPos = this.camera.position;
        let visibleCount = 0;
        
        this.allTrees.forEach(treeData => {
            const dist = camPos.distanceTo(treeData.worldPos);
            
            // Distance culling only for now (simpler than frustum)
            if (dist > TREE_RENDER_DISTANCE) {
                treeData.mesh.visible = false;
                return;
            }
            
            treeData.mesh.visible = true;
            visibleCount++;
            
            // LOD switching (optional - can be disabled for performance)
            const targetLOD = this.perfManager.getLODLevel(dist);
            if (treeData.currentLOD !== targetLOD) {
                this.switchLOD(treeData, targetLOD);
            }
        });
        
        // Limit max visible trees
        if (visibleCount > this.maxVisibleTrees) {
            const sorted = this.allTrees
                .filter(t => t.mesh.visible)
                .sort((a, b) => {
                    const da = camPos.distanceTo(a.worldPos);
                    const db = camPos.distanceTo(b.worldPos);
                    return db - da;
                });
            
            for (let i = this.maxVisibleTrees; i < sorted.length; i++) {
                sorted[i].mesh.visible = false;
            }
        }
    }
}

window.FloraManager = FloraManager;
