// js/flora-manager.js - Manages all vegetation with dense biome-aware organic placement

class FloraManager {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.allTrees = [];
        this.spatialLookup = new SpatialLookup();
        
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
            || (navigator.maxTouchPoints > 0 && window.innerWidth < 1024);
        this.maxVisibleTrees = 600; // Enable on mobile too
        
        this.updateInterval = 0.1;
        this.lastUpdate = 0;
        this.perfManager = new PerformanceManager(camera);
        
        // Dynamic spawning configuration
        this.dynamicSpawnEnabled = true;
        this.spawnCheckInterval = 0.5; // Check more frequently
        this.lastSpawnCheck = 0;
        this.spawnRadius = 600; // Spawn within 600m of camera
        this.minSpawnDistance = 150; // Don't spawn closer than 150m
        this.cellSize = 15; // Smaller cells for denser placement
        this.populatedCells = new Set();
        
        // Configurable draw distance and density
        this.treeMaxDist = 1300;
        this.densityMultiplier = 1.0;
        this.enabled = true;
        
        // Island groups reference for adding new trees
        this.islandGroups = new Map();
        
        // Track spawn counts per island
        this.islandSpawnCounts = new Map();
    }

    registerIslandGroup(islandName, islandGroup, islandWorldX, islandWorldZ) {
        this.islandGroups.set(islandName, {
            group: islandGroup,
            worldX: islandWorldX,
            worldZ: islandWorldZ
        });
        this.islandSpawnCounts.set(islandName, 0);
    }

    getTreeTypesForBiome(biome) {
        // Returns array of possible tree types with weights for each biome
        switch(biome) {
            case 'forest': // JUNGLE - Large impressive trees, reasonable count
                return [
                    { type: 'giant-koa', scale: 0.58 + Math.random() * 0.2, weight: 0.30 },
                    { type: 'banyan', scale: 0.5 + Math.random() * 0.17, weight: 0.25 },
                    { type: 'koa', scale: 0.46 + Math.random() * 0.17, weight: 0.20 },
                    { type: 'tree-fern', scale: 0.42 + Math.random() * 0.17, weight: 0.20 },
                    { type: 'bamboo', scale: 0.75 + Math.random() * 0.25, weight: 0.15 },
                    { type: 'ohia', scale: 0.75 + Math.random() * 0.25, weight: 0.15 },
                    { type: 'ti-plant', scale: 0.58 + Math.random() * 0.25, weight: 0.20 },
                    { type: 'ground-fern', scale: 0.5 + Math.random() * 0.33, weight: 0.30 }
                ];
                
            case 'dry-forest': // DRY FOREST - Sparse, drought-adapted
                return [
                    { type: 'wiliwili', scale: 0.9 + Math.random() * 0.4, weight: 0.30 },
                    { type: 'koa', scale: 0.7 + Math.random() * 0.3, weight: 0.20 },
                    { type: 'shrub', scale: 0.6 + Math.random() * 0.3, weight: 0.25 },
                    { type: 'ti-plant', scale: 0.5 + Math.random() * 0.3, weight: 0.15 },
                    { type: 'lava-rock', scale: 0.8 + Math.random() * 0.6, weight: 0.40 },
                    { type: 'grass', scale: 0.5 + Math.random() * 0.4, weight: 0.20 }
                ];
                
            case 'beach': // BEACH - Palms and coastal vegetation
                return [
                    { type: 'coconut-palm', scale: 0.5 + Math.random() * 0.25, weight: 0.35 },
                    { type: 'palm', scale: 0.9 + Math.random() * 0.4, weight: 0.25 },
                    { type: 'naupaka', scale: 0.7 + Math.random() * 0.3, weight: 0.30 },
                    { type: 'beach-morning-glory', scale: 0.5 + Math.random() * 0.3, weight: 0.25 },
                    { type: 'driftwood', scale: 0.8 + Math.random() * 0.6, weight: 0.20 },
                    { type: 'ground-fern', scale: 0.4 + Math.random() * 0.3, weight: 0.15 },
                    { type: 'shrub', scale: 0.5 + Math.random() * 0.3, weight: 0.15 }
                ];
                
            case 'shrubland':
                return [
                    { type: 'shrub', scale: 0.7 + Math.random() * 0.4, weight: 0.40 },
                    { type: 'ohia', scale: 0.6 + Math.random() * 0.3, weight: 0.20 },
                    { type: 'ti-plant', scale: 0.6 + Math.random() * 0.3, weight: 0.25 },
                    { type: 'ground-fern', scale: 0.5 + Math.random() * 0.4, weight: 0.30 },
                    { type: 'lava-rock', scale: 0.6 + Math.random() * 0.5, weight: 0.15 }
                ];
                
            case 'grassland':
                return [
                    { type: 'grass', scale: 0.8 + Math.random() * 0.5, weight: 0.60 },
                    { type: 'shrub', scale: 0.5 + Math.random() * 0.3, weight: 0.25 },
                    { type: 'ground-fern', scale: 0.4 + Math.random() * 0.3, weight: 0.20 },
                    { type: 'lava-rock', scale: 0.5 + Math.random() * 0.4, weight: 0.10 }
                ];
                
            case 'cliff':
                return [
                    { type: 'shrub', scale: 0.4 + Math.random() * 0.3, weight: 0.30 },
                    { type: 'ground-fern', scale: 0.3 + Math.random() * 0.3, weight: 0.25 },
                    { type: 'lava-rock', scale: 0.8 + Math.random() * 0.7, weight: 0.50 }
                ];
                
            case 'rock':
                return [
                    { type: 'lava-rock', scale: 0.7 + Math.random() * 0.8, weight: 0.80 },
                    { type: 'shrub', scale: 0.3 + Math.random() * 0.3, weight: 0.15 }
                ];
                
            default:
                return [
                    { type: 'shrub', scale: 0.6 + Math.random() * 0.4, weight: 0.40 },
                    { type: 'grass', scale: 0.6 + Math.random() * 0.4, weight: 0.30 }
                ];
        }
    }

    getDensityForBiome(biome) {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
            || (navigator.maxTouchPoints > 0 && window.innerWidth < 1024);
        const mobileMultiplier = isMobile ? 0 : 1.0;
        
        switch(biome) {
            case 'forest': return 0.26 * mobileMultiplier * this.densityMultiplier;
            case 'dry-forest': return 0.15 * mobileMultiplier * this.densityMultiplier;
            case 'beach': return 0.15 * mobileMultiplier * this.densityMultiplier;
            case 'shrubland': return 0.22 * mobileMultiplier * this.densityMultiplier;
            case 'grassland': return 0.15 * mobileMultiplier * this.densityMultiplier;
            case 'cliff': return 0.08 * mobileMultiplier * this.densityMultiplier;
            case 'rock': return 0.06 * mobileMultiplier * this.densityMultiplier;
            default: return 0.11 * mobileMultiplier * this.densityMultiplier;
        }
    }

    selectTreeType(treeTypes) {
        const totalWeight = treeTypes.reduce((sum, t) => sum + t.weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const treeType of treeTypes) {
            random -= treeType.weight;
            if (random <= 0) {
                return treeType;
            }
        }
        
        return treeTypes[0];
    }

    placeTreesForIsland(islandGroup, islandName, islandWorldX, islandWorldZ) {
        console.log(`FloraManager: Starting dense placement for ${islandName}`);
        
        this.registerIslandGroup(islandName, islandGroup, islandWorldX, islandWorldZ);

        const meta = islandMetadataCache[islandName];
        if (!meta) {
            console.warn(`FloraManager: No metadata for ${islandName}, skipping`);
            return;
        }

        const islandInfo = islandPositions.find(i => i.name === islandName);
        if (!islandInfo) {
            console.warn(`FloraManager: No island info for ${islandName}`);
            return;
        }

        const worldScale = islandInfo.worldScale || 0.08;
        const terrainWidth = meta.worldWidth * worldScale;
        const terrainHeight = meta.worldHeight * worldScale;
        const halfWidth = terrainWidth / 2;
        const halfHeight = terrainHeight / 2;

        // SMART DENSITY: Good coverage without killing performance
        // 15m grid provides visual density while keeping object count sane
        const baseGridSize = 15;
        const jitterAmount = baseGridSize * 0.85;

        let placed = 0;
        let skipped = 0;
        let biomeCounts = {};

        for (let x = islandWorldX - halfWidth; x <= islandWorldX + halfWidth; x += baseGridSize) {
            for (let z = islandWorldZ - halfHeight; z <= islandWorldZ + halfHeight; z += baseGridSize) {
                const jitterX = (Math.random() - 0.5) * 2 * jitterAmount;
                const jitterZ = (Math.random() - 0.5) * 2 * jitterAmount;
                const worldX = x + jitterX;
                const worldZ = z + jitterZ;

                if (!isPointOnIsland(worldX, worldZ, islandName)) {
                    skipped++;
                    continue;
                }

                const terrainY = getTerrainMeshHeight(worldX, worldZ, islandName);
                if (terrainY <= WATER_LEVEL + 0.5) {
                    skipped++;
                    continue;
                }

                const biomeInfo = getBiomeFromTerrain(worldX, worldZ);
                if (!biomeInfo || biomeInfo.biome === 'water' || biomeInfo.biome === 'unknown') {
                    skipped++;
                    continue;
                }

                // Handle dry forest biome type
                let effectiveBiome = biomeInfo.biome;
                if (biomeInfo.biome === 'forest' && terrainY < 50) {
                    effectiveBiome = 'dry-forest';
                }

                biomeCounts[effectiveBiome] = (biomeCounts[effectiveBiome] || 0) + 1;

                const density = this.getDensityForBiome(effectiveBiome);
                const clustering = Math.sin(worldX * 0.008) * Math.cos(worldZ * 0.008) * 0.3 + 0.7;
                const finalDensity = density * clustering;
                
                if (Math.random() > finalDensity) {
                    skipped++;
                    continue;
                }

                // BALANCED: Fewer trees per cell but larger ones
                const treesPerCell = effectiveBiome === 'forest' ? 
                    2 + Math.floor(Math.random() * 2) : // 2-3 trees, but BIG
                    effectiveBiome === 'beach' ? 1 + Math.floor(Math.random() * 2) : 1;

                for (let t = 0; t < treesPerCell; t++) {
                    const offsetX = t > 0 ? (Math.random() - 0.5) * 8 : 0;
                    const offsetZ = t > 0 ? (Math.random() - 0.5) * 8 : 0;
                    
                    const finalX = worldX + offsetX;
                    const finalZ = worldZ + offsetZ;
                    const finalY = getTerrainMeshHeight(finalX, finalZ, islandName);
                    
                    if (finalY <= WATER_LEVEL + 0.5) continue;

                    const treeTypes = this.getTreeTypesForBiome(effectiveBiome);
                    const treeConfig = this.selectTreeType(treeTypes);
                    
                    if (!treeConfig) continue;

                    const localX = finalX - islandWorldX;
                    const localZ = finalZ - islandWorldZ;
                    const tree = this.createTree(treeConfig.type, 'medium', localX, finalY, localZ, treeConfig.scale);

                    if (tree) {
                        islandGroup.add(tree);
                        const treeData = {
                            mesh: tree,
                            type: treeConfig.type,
                            worldPos: new THREE.Vector3(finalX, finalY, finalZ),
                            currentLOD: 'medium',
                            scale: treeConfig.scale,
                            biome: effectiveBiome,
                            islandName: islandName
                        };
                        this.allTrees.push(treeData);
                        this.spatialLookup.addItem(finalX, finalY, finalZ, treeConfig.type, treeData);
                        placed++;
                    }
                }
            }
        }

        const currentCount = this.islandSpawnCounts.get(islandName) || 0;
        this.islandSpawnCounts.set(islandName, currentCount + placed);
        
        console.log(`FloraManager: Placed ${placed} trees on ${islandName} (${skipped} skipped). Biomes:`, biomeCounts);
    }

    getCellKey(x, z) {
        const cellX = Math.floor(x / this.cellSize);
        const cellZ = Math.floor(z / this.cellSize);
        return `${cellX},${cellZ}`;
    }

    createTree(type, lod, x, y, z, scale) {
        let geometry;
        switch(type) {
            case 'giant-koa':
                geometry = GiantKoaGeometry.getGeometry(lod);
                break;
            case 'koa':
                geometry = KoaGeometry.getGeometry(lod);
                break;
            case 'ohia':
                geometry = OhiaGeometry.getGeometry(lod);
                break;
            case 'banyan':
                geometry = BanyanGeometry.getGeometry(lod);
                break;
            case 'tree-fern':
                geometry = TreeFernGeometry.getGeometry(lod);
                break;
            case 'ti-plant':
                geometry = TiPlantGeometry.getGeometry(lod);
                break;
            case 'bamboo':
                geometry = BambooGeometry.getGeometry(lod);
                break;
            case 'coconut-palm':
                geometry = CoconutPalmGeometry.getGeometry(lod);
                break;
            case 'palm':
                geometry = PalmGeometry.getGeometry(lod);
                break;
            case 'driftwood':
                geometry = DriftwoodGeometry.getGeometry(lod);
                break;
            case 'naupaka':
                geometry = NaupakaGeometry.getGeometry(lod);
                break;
            case 'beach-morning-glory':
                geometry = BeachMorningGloryGeometry.getGeometry(lod);
                break;
            case 'wiliwili':
                geometry = WiliwiliGeometry.getGeometry(lod);
                break;
            case 'lava-rock':
                geometry = LavaRockGeometry.getGeometry(lod);
                break;
            case 'ground-fern':
                geometry = GroundFernGeometry.getGeometry(lod);
                break;
            case 'shrub':
                geometry = ShrubGeometry.getGeometry(lod);
                break;
            case 'grass':
                geometry = GrassGeometry.getGeometry(lod);
                break;
            default:
                console.warn(`Unknown tree type: ${type}`);
                return null;
        }

        if (!geometry) return null;

        const tree = geometry.clone();
        tree.position.set(x, y, z);
        tree.scale.setScalar(scale);
        tree.rotation.y = Math.random() * Math.PI * 2;
        tree.visible = true;

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

        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
            || (navigator.maxTouchPoints > 0 && window.innerWidth < 1024);
        const treeMaxDist = this.treeMaxDist;

        this.allTrees.forEach(treeData => {
            const dist = camPos.distanceTo(treeData.worldPos);

            if (!this.enabled || dist > treeMaxDist) {
                treeData.mesh.visible = false;
            } else {
                treeData.mesh.visible = true;
            }
        });
    }

    getTreesByBiome(biome) {
        return this.allTrees.filter(t => t.biome === biome);
    }

    getStats() {
        const stats = {
            total: this.allTrees.length,
            byBiome: {},
            byType: {},
            byIsland: {}
        };
        
        this.allTrees.forEach(t => {
            stats.byBiome[t.biome] = (stats.byBiome[t.biome] || 0) + 1;
            stats.byType[t.type] = (stats.byType[t.type] || 0) + 1;
            stats.byIsland[t.islandName] = (stats.byIsland[t.islandName] || 0) + 1;
        });
        
        return stats;
    }
}

window.FloraManager = FloraManager;