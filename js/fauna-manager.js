// js/fauna-manager.js - Manages all animal spawning and updates with camera-relative spawning

class FaunaManager {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.animals = [];
        this.spatialLookup = new SpatialLookup();

        this.whalePool = [];
        this.dolphinPool = [];
        this.turtlePool = [];
        this.albatrossPool = [];
        this.frigatebirdPool = [];
        this.honeycreeperPool = [];
        this.nenePool = [];

        // Dynamic spawning configuration
        this.dynamicSpawnEnabled = true;
        this.spawnCheckInterval = 1.5; // Check every 1.5 seconds
        this.lastSpawnCheck = 0;
        this.spawnRadius = 2500; // Spawn within 2500m of camera
        this.minSpawnDistance = 800; // Don't spawn closer than 800m
        this.maxAnimalsPerType = {
            whale: 12,
            dolphin: 20,
            turtle: 15,
            albatross: 20,
            frigatebird: 25,
            honeycreeper: 30,
            nene: 20
        };
        
        // Configurable draw distance and density
        this.animalMaxDist = 6000;
        this.densityMultiplier = 1.0;
        
        this.spawnedCount = {
            whale: 0,
            dolphin: 0,
            turtle: 0,
            albatross: 0,
            frigatebird: 0,
            honeycreeper: 0,
            nene: 0
        };
    }

    addToSpatialIndex(animal, type) {
        this.spatialLookup.addItem(
            animal.position.x,
            animal.position.y,
            animal.position.z,
            type,
            animal
        );
    }

    init() {
        console.log('FaunaManager: Starting camera-relative initialization...');

        // Spawn initial set of animals around camera
        this.spawnAnimalsAroundCamera();

        console.log(`FaunaManager: Initial spawn complete. Total animals: ${this.animals.length}`);
    }

    getEffectiveMax(type) {
        return Math.max(0, Math.floor(this.maxAnimalsPerType[type] * this.densityMultiplier));
    }

    spawnAnimalsAroundCamera() {
        if (!this.camera) return;
        
        const camPos = this.camera.position;
        
        // Spawn whales in ocean areas
        for (let i = this.spawnedCount.whale; i < this.getEffectiveMax('whale'); i++) {
            const pos = this.getSpawnPositionInFrontOfCamera(5000, 0, 500);
            if (pos) {
                const whale = new Whale(this.scene, pos);
                this.animals.push(whale);
                this.whalePool.push(whale);
                this.addToSpatialIndex(whale, 'whale');
                this.spawnedCount.whale++;
            }
        }

        // Spawn dolphins
        const podCount = 5;
        for (let pod = 0; pod < podCount; pod++) {
            const podCenter = this.getSpawnPositionInFrontOfCamera(3000, 0, 300);
            if (!podCenter) continue;
            
            const dolphinsInPod = 4;
            for (let i = 0; i < dolphinsInPod; i++) {
                if (this.spawnedCount.dolphin >= this.getEffectiveMax('dolphin')) break;
                
                const offset = new THREE.Vector3(
                    (Math.random() - 0.5) * 200,
                    0,
                    (Math.random() - 0.5) * 200
                );
                const pos = podCenter.clone().add(offset);
                const dolphin = new Dolphin(this.scene, pos, pod);
                this.animals.push(dolphin);
                this.dolphinPool.push(dolphin);
                this.addToSpatialIndex(dolphin, 'dolphin');
                this.spawnedCount.dolphin++;
            }
        }

        // Spawn sea turtles
        for (let i = this.spawnedCount.turtle; i < this.getEffectiveMax('turtle'); i++) {
            const pos = this.getSpawnPositionInFrontOfCamera(2500, 0, 200);
            if (pos) {
                const turtle = new SeaTurtle(this.scene, pos);
                this.animals.push(turtle);
                this.turtlePool.push(turtle);
                this.addToSpatialIndex(turtle, 'seaturtle');
                this.spawnedCount.turtle++;
            }
        }

        // Spawn albatross
        for (let i = this.spawnedCount.albatross; i < this.getEffectiveMax('albatross'); i++) {
            const pos = this.getSpawnPositionInFrontOfCamera(6000, 200, 500);
            if (pos) {
                pos.y = 150 + Math.random() * 200;
                const albatross = new Albatross(this.scene, pos);
                this.animals.push(albatross);
                this.albatrossPool.push(albatross);
                this.addToSpatialIndex(albatross, 'albatross');
                this.spawnedCount.albatross++;
            }
        }

        // Spawn frigatebirds
        for (let i = this.spawnedCount.frigatebird; i < this.getEffectiveMax('frigatebird'); i++) {
            const pos = this.getSpawnPositionInFrontOfCamera(4000, 100, 300);
            if (pos) {
                pos.y = 100 + Math.random() * 150;
                const frigatebird = new Frigatebird(this.scene, pos);
                this.animals.push(frigatebird);
                this.frigatebirdPool.push(frigatebird);
                this.addToSpatialIndex(frigatebird, 'frigatebird');
                this.spawnedCount.frigatebird++;
            }
        }

        // Spawn honeycreepers in forest areas
        for (let i = this.spawnedCount.honeycreeper; i < this.getEffectiveMax('honeycreeper'); i++) {
            // Try to spawn near forest biomes
            const islandInfo = this.getRandomNearbyIsland(2000);
            if (!islandInfo) continue;
            
            const pos = new THREE.Vector3(
                islandInfo.x + (Math.random() - 0.5) * 1500,
                50 + Math.random() * 100,
                islandInfo.z + (Math.random() - 0.5) * 1500
            );
            
            // Verify it's actually forest biome
            const biomeInfo = getBiomeFromTerrain(pos.x, pos.z);
            if (!biomeInfo || biomeInfo.biome !== 'forest') continue;
            
            const center = new THREE.Vector3(islandInfo.x, 50, islandInfo.z);
            const bird = new Honeycreeper(this.scene, pos, center);
            this.animals.push(bird);
            this.honeycreeperPool.push(bird);
            this.addToSpatialIndex(bird, 'honeycreeper');
            this.spawnedCount.honeycreeper++;
        }

        // Spawn nene in grassland areas
        for (let i = this.spawnedCount.nene; i < this.getEffectiveMax('nene'); i++) {
            const islandInfo = this.getRandomNearbyIsland(2500);
            if (!islandInfo) continue;
            
            const pos = new THREE.Vector3(
                islandInfo.x + (Math.random() - 0.5) * 2000,
                20 + Math.random() * 30,
                islandInfo.z + (Math.random() - 0.5) * 2000
            );
            
            // Verify grassland biome
            const biomeInfo = getBiomeFromTerrain(pos.x, pos.z);
            if (!biomeInfo || biomeInfo.biome !== 'grassland') continue;
            
            const nene = new Nene(this.scene, pos);
            this.animals.push(nene);
            this.nenePool.push(nene);
            this.addToSpatialIndex(nene, 'nene');
            this.spawnedCount.nene++;
        }
    }

    getSpawnPositionInFrontOfCamera(maxDist, yOffset, angleSpread) {
        if (!this.camera) return null;
        
        const camPos = this.camera.position;
        const camDirection = new THREE.Vector3();
        this.camera.getWorldDirection(camDirection);
        
        // Random angle within spread
        const angle = (Math.random() - 0.5) * (angleSpread * Math.PI / 180);
        const distance = this.minSpawnDistance + Math.random() * (maxDist - this.minSpawnDistance);
        
        // Calculate position in front of camera
        const forward = camDirection.clone();
        forward.y = 0;
        forward.normalize();
        
        // Rotate by angle
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const rotatedX = forward.x * cos - forward.z * sin;
        const rotatedZ = forward.x * sin + forward.z * cos;
        
        const pos = new THREE.Vector3(
            camPos.x + rotatedX * distance,
            yOffset,
            camPos.z + rotatedZ * distance
        );
        
        return pos;
    }

    getRandomNearbyIsland(maxDist) {
        if (!this.camera || typeof islandPositions === 'undefined') return null;
        
        const camPos = this.camera.position;
        
        // Find islands within range
        const nearbyIslands = islandPositions.filter(island => {
            const dist = Math.sqrt(
                Math.pow(island.x - camPos.x, 2) + 
                Math.pow(island.z - camPos.z, 2)
            );
            return dist < maxDist;
        });
        
        if (nearbyIslands.length === 0) {
            // Return a random island if none nearby
            return islandPositions[Math.floor(Math.random() * islandPositions.length)];
        }
        
        return nearbyIslands[Math.floor(Math.random() * nearbyIslands.length)];
    }

    update(delta) {
        if (!this.camera || !this.camera.position) return;
        
        const camPos = this.camera.position;

        // Update dolphin pod cohesion
        const leadDolphins = this.dolphinPool.filter((_, i) => i < 5);
        this.dolphinPool.forEach((dolphin, i) => {
            const podIndex = i % 5;
            if (leadDolphins[podIndex]) {
                dolphin.updatePodCenter(leadDolphins[podIndex].position);
            }
        });

        // Update all animals
        this.animals.forEach(animal => {
            animal.update(delta, camPos);
        });

        // Dynamic spawning
        if (this.dynamicSpawnEnabled) {
            this.lastSpawnCheck += delta;
            if (this.lastSpawnCheck >= this.spawnCheckInterval) {
                this.lastSpawnCheck = 0;
                this.spawnAnimalsAroundCamera();
            }
        }

        // Check for animals that are too far and remove/reposition them
        this.checkAnimalDistances();
    }

    checkAnimalDistances() {
        const camPos = this.camera.position;
        const maxDist = this.animalMaxDist;
        
        this.animals.forEach(animal => {
            const dist = animal.position.distanceTo(camPos);
            
            if (dist > maxDist && !animal.isVisible) {
                // Reposition near camera but at spawn distance
                const angle = Math.random() * Math.PI * 2;
                const newDist = this.minSpawnDistance + Math.random() * 1000;
                
                const isMarine = animal instanceof Whale || animal instanceof Dolphin || animal instanceof SeaTurtle;
                const isBird = animal instanceof Albatross || animal instanceof Frigatebird || animal instanceof Honeycreeper;
                
                animal.position.set(
                    camPos.x + Math.cos(angle) * newDist,
                    isMarine ? 0 : (isBird ? camPos.y + (Math.random() - 0.5) * 100 : 20 + Math.random() * 30),
                    camPos.z + Math.sin(angle) * newDist
                );
                
                // Reset velocity
                if (animal.velocity) {
                    animal.velocity.set(0, 0, 0);
                }
            }
        });
    }

    getAnimalsByType(type) {
        return this.spatialLookup.getByType(type);
    }

    getAnimalsNearby(centerX, centerZ, radius, options = {}) {
        return this.spatialLookup.getNearby(centerX, centerZ, radius, options);
    }

    getStats() {
        return {
            total: this.animals.length,
            byType: this.spawnedCount,
            visible: this.animals.filter(a => a.isVisible).length
        };
    }

    dispose() {
        this.animals.forEach(animal => animal.dispose());
        this.animals = [];
        this.spatialLookup.clear();
    }
}

window.FaunaManager = FaunaManager;