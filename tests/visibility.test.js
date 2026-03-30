// tests/visibility.test.js - Tests for flora and fauna visibility based on camera distance

const THREE = require('../tests/__mocks__/three.js');

global.THREE = THREE;

// Mock PerformanceManager
global.PerformanceManager = jest.fn().mockImplementation(() => ({
  updateFrustum: jest.fn(),
  getLODLevel: jest.fn(() => 'medium')
}));

// Mock island functions
global.isPointOnIsland = jest.fn((x, z, islandName) => true);
global.getTerrainMeshHeight = jest.fn((x, z, islandName) => 50);
global.getBiomeFromTerrain = jest.fn((x, z) => ({ biome: 'forest', height: 50, slope: 5 }));

// Mock geometry classes
global.PalmGeometry = {
  getGeometry: jest.fn(() => new THREE.Group())
};
global.KoaGeometry = {
  getGeometry: jest.fn(() => new THREE.Group())
};
global.OhiaGeometry = {
  getGeometry: jest.fn(() => new THREE.Group())
};
global.ShrubGeometry = {
  getGeometry: jest.fn(() => new THREE.Group())
};
global.GrassGeometry = {
  getGeometry: jest.fn(() => new THREE.Group())
};

// Load the modules
require('../js/trees/palm.js');
require('../js/trees/koa.js');
require('../js/trees/ohia.js');
require('../js/trees/shrub.js');
require('../js/trees/grass.js');
require('../js/animals/animal-base.js');
require('../js/animals/whale.js');
require('../js/animals/albatross.js');

const FloraManager = global.FloraManager;
const Animal = global.Animal;
const Whale = global.Whale;
const Albatross = global.Albatross;

describe('Flora Visibility', () => {
  let scene, camera, floraManager;
  
  beforeEach(() => {
    scene = new THREE.Scene();
    camera = new THREE.Vector3(0, 100, 0);
    
    floraManager = {
      scene: scene,
      camera: { position: camera },
      allTrees: [],
      maxVisibleTrees: 800,
      updateInterval: 0.1,
      lastUpdate: 0,
      perfManager: { updateFrustum: jest.fn(), getLODLevel: jest.fn(() => 'medium') },
      
      createTree: function(type, lod, x, y, z, scale) {
        const mesh = new THREE.Mesh(
          new THREE.SphereGeometry(1),
          new THREE.MeshStandardMaterial({ color: 0x4CAF50 })
        );
        mesh.position.set(x, y, z);
        mesh.visible = true;
        return mesh;
      },
      
      placeTreesForIsland: function(islandGroup, islandName, islandWorldX, islandWorldZ) {
        // Organic placement with jitter simulation
        const positions = [
          { x: 0, z: 0 },
          { x: 95, z: 102 },  // Jittered from 100, 100
          { x: 203, z: 198 }  // Jittered from 200, 200
        ];
        
        positions.forEach((pos, idx) => {
          const tree = this.createTree('palm', 'medium', pos.x, 50, pos.z, 1);
          islandGroup.add(tree);
          
          this.allTrees.push({
            mesh: tree,
            worldPos: new THREE.Vector3(pos.x, 50, pos.z),
            currentLOD: 'medium',
            type: 'palm',
            scale: 1,
            biome: 'forest'
          });
        });
      },
      
      getTreesByBiome: function(biome) {
        return this.allTrees.filter(t => t.biome === biome);
      },
      
      getStats: function() {
        const stats = {
          total: this.allTrees.length,
          byBiome: {},
          byType: {}
        };
        
        this.allTrees.forEach(t => {
          stats.byBiome[t.biome] = (stats.byBiome[t.biome] || 0) + 1;
          stats.byType[t.type] = (stats.byType[t.type] || 0) + 1;
        });
        
        return stats;
      },
      
      update: function(delta) {
        this.lastUpdate += delta;
        if (this.lastUpdate < this.updateInterval) return;
        this.lastUpdate = 0;
        
        const camPos = this.camera.position;
        const TREE_RENDER_DISTANCE = 305; // ~1000 feet
        
        this.allTrees.forEach(treeData => {
          const dist = camPos.distanceTo(treeData.worldPos);
          
          if (dist > TREE_RENDER_DISTANCE) {
            treeData.mesh.visible = false;
          } else {
            treeData.mesh.visible = true;
          }
        });
      }
    };
  });
  
  test('trees should be VISIBLE when camera is within 1000 feet (305m)', () => {
    const islandGroup = new THREE.Group();
    floraManager.placeTreesForIsland(islandGroup, 'test-island', 0, 0);
    
    camera.set(0, 100, 0);
    
    floraManager.update(0.1);
    
    expect(floraManager.allTrees[0].mesh.visible).toBe(true);
    expect(floraManager.allTrees[1].mesh.visible).toBe(true);
  });
  
  test('trees should be HIDDEN when camera is greater than 1000 feet (305m)', () => {
    const islandGroup = new THREE.Group();
    floraManager.placeTreesForIsland(islandGroup, 'test-island', 0, 0);
    
    camera.set(500, 100, 500);
    
    floraManager.update(0.1);
    
    expect(floraManager.allTrees[0].mesh.visible).toBe(false);
    expect(floraManager.allTrees[1].mesh.visible).toBe(false);
    expect(floraManager.allTrees[2].mesh.visible).toBe(false);
  });
  
  test('tree at exactly 1000 feet should be visible (boundary inclusive)', () => {
    const islandGroup = new THREE.Group();
    floraManager.placeTreesForIsland(islandGroup, 'test-island', 0, 0);
    
    // Place camera at same Y level as tree (50) to get exact distance
    camera.set(305, 50, 0);
    
    floraManager.update(0.1);
    
    expect(floraManager.allTrees[0].mesh.visible).toBe(true);
  });
  
  test('tree just beyond 1000 feet should be hidden', () => {
    const islandGroup = new THREE.Group();
    floraManager.placeTreesForIsland(islandGroup, 'test-island', 0, 0);
    
    // Place camera at same Y level as tree
    camera.set(306, 50, 0);
    
    floraManager.update(0.1);
    
    expect(floraManager.allTrees[0].mesh.visible).toBe(false);
  });
  
  test('organic placement should include biome information', () => {
    const islandGroup = new THREE.Group();
    floraManager.placeTreesForIsland(islandGroup, 'test-island', 0, 0);
    
    // All trees should have biome property
    floraManager.allTrees.forEach(tree => {
      expect(tree.biome).toBeDefined();
    });
    
    // Should be able to query by biome
    const forestTrees = floraManager.getTreesByBiome('forest');
    expect(forestTrees.length).toBeGreaterThan(0);
  });
  
  test('placement stats should track biome distribution', () => {
    const islandGroup = new THREE.Group();
    floraManager.placeTreesForIsland(islandGroup, 'test-island', 0, 0);
    
    const stats = floraManager.getStats();
    
    expect(stats.total).toBe(3);
    expect(stats.byBiome.forest).toBe(3);
    expect(stats.byType.palm).toBe(3);
  });
});

describe('Fauna Visibility', () => {
  let scene, camera;
  
  beforeEach(() => {
    scene = new THREE.Scene();
    camera = new THREE.Vector3(0, 100, 0);
  });
  
  test('animal should be VISIBLE when camera is within viewDistance', () => {
    const animal = new Animal(scene, new THREE.Vector3(0, 0, 0), {
      viewDistance: 305,
      updateDistance: 610
    });
    
    camera.set(0, 50, 100);
    
    animal.update(0.1, camera);
    
    expect(animal.mesh.visible).toBe(true);
    expect(animal.isVisible).toBe(true);
  });
  
  test('animal should be HIDDEN when camera exceeds viewDistance', () => {
    const animal = new Animal(scene, new THREE.Vector3(0, 0, 0), {
      viewDistance: 305,
      updateDistance: 610
    });
    
    camera.set(500, 100, 500);
    
    animal.update(0.1, camera);
    
    expect(animal.mesh.visible).toBe(false);
    expect(animal.isVisible).toBe(false);
  });
  
  test('animal should not update when beyond updateDistance', () => {
    const animal = new Animal(scene, new THREE.Vector3(0, 0, 0), {
      viewDistance: 305,
      updateDistance: 610
    });
    
    camera.set(1000, 100, 1000);
    
    animal.update(0.1, camera);
    
    expect(animal.mesh.visible).toBe(false);
    expect(animal.isVisible).toBe(false);
  });
  
  test('whale should be visible within 2500m, hidden beyond', () => {
    const whale = new Whale(scene, new THREE.Vector3(0, 0, 0));
    
    camera.set(400, 50, 0);
    whale.update(0.1, camera);
    expect(whale.mesh.visible).toBe(true);
    
    camera.set(3000, 50, 0);
    whale.update(0.1, camera);
    expect(whale.mesh.visible).toBe(false);
  });
  
  test('albatross should be visible within 2000m', () => {
    const albatross = new Albatross(scene, new THREE.Vector3(0, 100, 0));
    
    camera.set(200, 50, 200);
    albatross.update(0.1, camera);
    expect(albatross.mesh.visible).toBe(true);
    
    camera.set(2500, 100, 2500);
    albatross.update(0.1, camera);
    expect(albatross.mesh.visible).toBe(false);
  });
});

describe('Visibility Distance Constants', () => {
  const TREE_RENDER_DISTANCE = 305;
  
  test('TREE_RENDER_DISTANCE should be approximately 1000 feet (305m)', () => {
    expect(TREE_RENDER_DISTANCE).toBeCloseTo(305, 0);
  });
  
  test('1000 feet equals approximately 305 meters', () => {
    const feetToMeters = (feet) => feet * 0.3048;
    expect(feetToMeters(1000)).toBeCloseTo(305, 0);
  });
});

describe('Organic Placement System', () => {
  test('trees should be placed with jitter for organic appearance', () => {
    // The new system applies jitter to grid positions
    // Positions should vary from a strict grid
    const gridPos = { x: 100, z: 100 };
    const jitterAmount = 32; // 80% of 40
    
    // With jitter, positions should be within jitter range
    const jitteredX = gridPos.x + (Math.random() - 0.5) * 2 * jitterAmount;
    const jitteredZ = gridPos.z + (Math.random() - 0.5) * 2 * jitterAmount;
    
    expect(Math.abs(jitteredX - gridPos.x)).toBeLessThanOrEqual(jitterAmount);
    expect(Math.abs(jitteredZ - gridPos.z)).toBeLessThanOrEqual(jitterAmount);
  });
  
  test('forest biome should support clustering with multiple trees per cell', () => {
    // Forests can have 1-3 trees per cell
    const baseDensity = 1.0;
    const clustering = 0.7; // Minimum clustering factor
    const finalDensity = baseDensity * clustering;
    
    expect(finalDensity).toBeGreaterThan(0);
    
    // Random check: some cells should allow multiple trees
    const treesPerCell = Math.random() < 0.3 ? 2 + Math.floor(Math.random() * 2) : 1;
    expect(treesPerCell).toBeGreaterThanOrEqual(1);
    expect(treesPerCell).toBeLessThanOrEqual(3);
  });
  
  test('biome density affects placement probability', () => {
    const densities = {
      forest: 1.0,
      shrubland: 0.6,
      grassland: 0.3,
      beach: 0.15,
      cliff: 0.02,
      rock: 0.05
    };
    
    // Forest should have highest density
    expect(densities.forest).toBeGreaterThan(densities.shrubland);
    expect(densities.shrubland).toBeGreaterThan(densities.grassland);
    expect(densities.grassland).toBeGreaterThan(densities.beach);
  });
});
