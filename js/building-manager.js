// js/building-manager.js
class BuildingManager {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.allBuildings = [];
        
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
            || (navigator.maxTouchPoints > 0 && window.innerWidth < 1024);
        this.maxVisibleBuildings = 400; // Enable on mobile too
        
        this.updateInterval = 0.1;
        this.lastUpdate = 0;
        this.perfManager = new PerformanceManager(camera);
        
        // Configurable draw distance and density
        this.buildingMaxDist = 3500;
        this.densityMultiplier = 1.0;
        this.enabled = true;
        
        this.islandGroups = new Map();
    }
    
    registerIslandGroup(islandName, islandGroup, islandWorldX, islandWorldZ) {
        this.islandGroups.set(islandName, {
            group: islandGroup,
            worldX: islandWorldX,
            worldZ: islandWorldZ
        });
    }
    
    getBuildingTypesForZone(zone) {
        switch(zone) {
            case 'airport':
                return [
                    { type: 'commercial-shop', weight: 0.5 },
                    { type: 'commercial-hotel', weight: 0.3 },
                    { type: 'residential-medium', weight: 0.2 }
                ];
            case 'inland':
                return [
                    { type: 'residential-small', weight: 0.5 },
                    { type: 'residential-medium', weight: 0.35 },
                    { type: 'residential-large', weight: 0.15 }
                ];
            case 'beach':
                return []; // No buildings on beaches
            default:
                return [{ type: 'residential-small', weight: 1.0 }];
        }
    }
    
    getDensityForZone(zone) {
        const base = {
            airport: 0.15,
            inland: 0.05,
            beach: 0,
        }[zone] || 0.02;
        return base * this.densityMultiplier;
    }
    
    selectBuildingType(buildingTypes) {
        const totalWeight = buildingTypes.reduce((sum, t) => sum + t.weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const bt of buildingTypes) {
            random -= bt.weight;
            if (random <= 0) return bt;
        }
        
        return buildingTypes[0];
    }
    
    getBuildingZone(worldX, worldZ, islandName) {
        const islandInfo = islandPositions.find(i => i.name === islandName);
        if (!islandInfo || !islandInfo.airports || islandInfo.airports.length === 0) {
            return 'inland';
        }
        
        const meta = islandMetadataCache[islandName];
        if (!meta) return 'inland';
        
        const terrainWidth = meta.worldWidth * islandInfo.worldScale;
        const terrainHeight = meta.worldHeight * islandInfo.worldScale;
        
        for (const airport of islandInfo.airports) {
            const localX = (airport.x / 1023 - 0.5) * terrainWidth;
            const localZ = (airport.y / 1023 - 0.5) * terrainHeight;
            
            const airportWorldX = islandInfo.x + localX;
            const airportWorldZ = islandInfo.z + localZ;
            
            const dist = Math.sqrt(
                Math.pow(worldX - airportWorldX, 2) + 
                Math.pow(worldZ - airportWorldZ, 2)
            );
            
            if (dist < 500) return 'airport';
        }
        
        // Only allow buildings near airports or inland (not coastal/beaches)
        for (const airport of islandInfo.airports) {
            const localX = (airport.x / 1023 - 0.5) * terrainWidth;
            const localZ = (airport.y / 1023 - 0.5) * terrainHeight;
            
            const airportWorldX = islandInfo.x + localX;
            const airportWorldZ = islandInfo.z + localZ;
            
            const dist = Math.sqrt(
                Math.pow(worldX - airportWorldX, 2) + 
                Math.pow(worldZ - airportWorldZ, 2)
            );
            
            if (dist < 500) return 'airport';
        }
        
        // Not near airport - check if it's too close to water (beach/coastal)
        const terrainY = getTerrainHeight(worldX, worldZ);
        if (terrainY < 25) return 'beach'; // Too close to water, skip
        
        return 'inland';
    }
    
    createBuilding(type, lod, x, y, z) {
        let geometry;
        
        switch(type) {
            case 'residential-small':
                geometry = SmallHouseGeometry.getGeometry(lod);
                break;
            case 'residential-medium':
                geometry = MediumHomeGeometry.getGeometry(lod);
                break;
            case 'residential-large':
                geometry = LargeEstateGeometry.getGeometry(lod);
                break;
            case 'commercial-shop':
                geometry = ShopGeometry.getGeometry(lod);
                break;
            case 'commercial-hotel':
                geometry = HotelGeometry.getGeometry(lod);
                break;
            case 'commercial-restaurant':
                geometry = RestaurantGeometry.getGeometry(lod);
                break;
            default:
                console.warn(`Unknown building type: ${type}`);
                return null;
        }
        
        if (!geometry) return null;
        
        const building = geometry.clone();
        building.position.set(x, y, z);
        building.rotation.y = Math.random() * Math.PI * 2;
        building.visible = true;
        
        return building;
    }
    
    placeBuildingsForIsland(islandGroup, islandName, islandWorldX, islandWorldZ) {
        console.log(`BuildingManager: Placing buildings on ${islandName}`);
        
        const meta = islandMetadataCache[islandName];
        if (!meta) {
            console.warn(`BuildingManager: No metadata for ${islandName}`);
            return;
        }
        
        const islandInfo = islandPositions.find(i => i.name === islandName);
        if (!islandInfo) return;
        
        const worldScale = islandInfo.worldScale || 0.08;
        const terrainWidth = meta.worldWidth * worldScale;
        const terrainHeight = meta.worldHeight * worldScale;
        const halfWidth = terrainWidth / 2;
        const halfHeight = terrainHeight / 2;
        
        const gridSize = 15;
        let placed = 0;
        let skipped = { terrain: 0, water: 0, slope: 0, elevation: 0, notOnIsland: 0, density: 0 };
        
        for (let x = islandWorldX - halfWidth; x <= islandWorldX + halfWidth; x += gridSize) {
            for (let z = islandWorldZ - halfHeight; z <= islandWorldZ + halfHeight; z += gridSize) {
                const jitterX = (Math.random() - 0.5) * gridSize * 0.8;
                const jitterZ = (Math.random() - 0.5) * gridSize * 0.8;
                const worldX = x + jitterX;
                const worldZ = z + jitterZ;
                
                if (!isPointOnIsland(worldX, worldZ, islandName)) {
                    skipped.notOnIsland++;
                    continue;
                }
                
                const terrainY = getTerrainMeshHeight(worldX, worldZ, islandName);
                if (terrainY === null || isNaN(terrainY)) {
                    skipped.terrain++;
                    continue;
                }
                if (terrainY <= 2 + 5) {
                    skipped.water++;
                    continue;
                }
                
                // Check slope
                const slope = this.getTerrainSlope(worldX, worldZ, islandName);
                if (slope > 25) {
                    skipped.slope++;
                    continue;
                }
                
                if (terrainY > 500) {
                    skipped.elevation++;
                    continue;
                }
                
                const zone = this.getBuildingZone(worldX, worldZ, islandName);
                if (zone === 'beach') {
                    skipped.density++;
                    continue;
                }
                
                const density = this.getDensityForZone(zone);
                const clustering = Math.sin(worldX * 0.008) * Math.cos(worldZ * 0.008) * 0.3 + 0.7;
                const finalDensity = density * clustering;
                
                if (Math.random() > finalDensity) continue;
                
                const buildingTypes = this.getBuildingTypesForZone(zone);
                const buildingConfig = this.selectBuildingType(buildingTypes);
                
                const localX = worldX - islandWorldX;
                const localZ = worldZ - islandWorldZ;
                const building = this.createBuilding(buildingConfig.type, 'high', localX, terrainY, localZ);
                
                if (building) {
                    islandGroup.add(building);
                    this.allBuildings.push({
                        mesh: building,
                        type: buildingConfig.type,
                        worldPos: new THREE.Vector3(worldX, terrainY, worldZ),
                        currentLOD: 'high',
                        islandName
                    });
                    placed++;
                }
            }
        }
        
        console.log(`BuildingManager: Placed ${placed} buildings on ${islandName}. Skipped:`, skipped);
    }
    
    getTerrainSlope(worldX, worldZ, islandName) {
        const delta = 5;
        const h1 = getTerrainMeshHeight(worldX - delta, worldZ, islandName);
        const h2 = getTerrainMeshHeight(worldX + delta, worldZ, islandName);
        const h3 = getTerrainMeshHeight(worldX, worldZ - delta, islandName);
        const h4 = getTerrainMeshHeight(worldX, worldZ + delta, islandName);
        
        if (h1 === null || h2 === null || h3 === null || h4 === null) return 90;
        
        const dx = (h2 - h1) / (delta * 2);
        const dz = (h4 - h3) / (delta * 2);
        
        return Math.atan(Math.sqrt(dx * dx + dz * dz)) * (180 / Math.PI);
    }
    
    update(delta) {
        this.lastUpdate += delta;
        if (this.lastUpdate < this.updateInterval) return;
        this.lastUpdate = 0;
        
        this.perfManager.updateFrustum();
        const camPos = this.camera.position;
        
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
            || (navigator.maxTouchPoints > 0 && window.innerWidth < 1024);
        const maxDist = this.buildingMaxDist;
        
        this.allBuildings.forEach(buildingData => {
            const dist = camPos.distanceTo(buildingData.worldPos);
            
            if (!this.enabled || dist > maxDist) {
                buildingData.mesh.visible = false;
            } else {
                buildingData.mesh.visible = true;
            }
        });
    }
}

window.BuildingManager = BuildingManager;
