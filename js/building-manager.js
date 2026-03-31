// js/building-manager.js
class BuildingManager {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.allBuildings = [];
        
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
            || (navigator.maxTouchPoints > 0 && window.innerWidth < 1024);
        this.maxVisibleBuildings = isMobile ? 0 : 400;
        
        this.updateInterval = 0.1;
        this.lastUpdate = 0;
        this.perfManager = new PerformanceManager(camera);
        
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
                    { type: 'commercial-shop', weight: 0.4 },
                    { type: 'commercial-hotel', weight: 0.2 },
                    { type: 'industrial-warehouse', weight: 0.3 },
                    { type: 'residential-medium', weight: 0.1 }
                ];
            case 'coastal':
                return [
                    { type: 'residential-small', weight: 0.3 },
                    { type: 'residential-medium', weight: 0.25 },
                    { type: 'commercial-hotel', weight: 0.25 },
                    { type: 'commercial-restaurant', weight: 0.2 }
                ];
            case 'inland':
                return [
                    { type: 'residential-small', weight: 0.3 },
                    { type: 'residential-medium', weight: 0.35 },
                    { type: 'residential-large', weight: 0.15 },
                    { type: 'industrial-warehouse', weight: 0.2 }
                ];
            default:
                return [{ type: 'residential-small', weight: 1.0 }];
        }
    }
    
    getDensityForZone(zone) {
        switch(zone) {
            case 'airport': return 0.6;
            case 'coastal': return 0.4;
            case 'inland': return 0.2;
            default: return 0.1;
        }
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
        
        // Check if coastal (within 200m of water - terrain height < 20)
        const terrainY = getTerrainHeight(worldX, worldZ);
        if (terrainY < 20) return 'coastal';
        
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
            case 'industrial-warehouse':
                geometry = WarehouseGeometry.getGeometry(lod);
                break;
            case 'industrial-factory':
                geometry = FactoryGeometry.getGeometry(lod);
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
        
        const gridSize = 25;
        let placed = 0;
        
        for (let x = islandWorldX - halfWidth; x <= islandWorldX + halfWidth; x += gridSize) {
            for (let z = islandWorldZ - halfHeight; z <= islandWorldZ + halfHeight; z += gridSize) {
                const jitterX = (Math.random() - 0.5) * gridSize * 0.8;
                const jitterZ = (Math.random() - 0.5) * gridSize * 0.8;
                const worldX = x + jitterX;
                const worldZ = z + jitterZ;
                
                if (!isPointOnIsland(worldX, worldZ, islandName)) continue;
                
                const terrainY = getTerrainMeshHeight(worldX, worldZ, islandName);
                if (terrainY <= 2 + 5) continue; // WATER_LEVEL = 2
                
                // Check slope
                const slope = this.getTerrainSlope(worldX, worldZ, islandName);
                if (slope > 15) continue;
                
                if (terrainY > 400) continue;
                
                const zone = this.getBuildingZone(worldX, worldZ, islandName);
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
        
        console.log(`BuildingManager: Placed ${placed} buildings on ${islandName}`);
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
        
        this.allBuildings.forEach(buildingData => {
            const dist = camPos.distanceTo(buildingData.worldPos);
            
            if (dist > 800) {
                buildingData.mesh.visible = false;
                return;
            }
            
            buildingData.mesh.visible = true;
        });
    }
}

window.BuildingManager = BuildingManager;
