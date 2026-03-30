// js/spatial-grid.js - Spatial data structure for efficient flora/fauna lookups

class SpatialGrid {
    constructor(cellSize = 100) {
        this.cellSize = cellSize;
        this.cells = new Map();
    }

    _getCellKey(x, z) {
        const cx = Math.floor(x / this.cellSize);
        const cz = Math.floor(z / this.cellSize);
        return `${cx},${cz}`;
    }

    insert(x, z, item) {
        const key = this._getCellKey(x, z);
        if (!this.cells.has(key)) {
            this.cells.set(key, []);
        }
        this.cells.get(key).push(item);
    }

    queryRadius(centerX, centerZ, radius) {
        const results = [];
        const minCX = Math.floor((centerX - radius) / this.cellSize);
        const maxCX = Math.floor((centerX + radius) / this.cellSize);
        const minCZ = Math.floor((centerZ - radius) / this.cellSize);
        const maxCZ = Math.floor((centerZ + radius) / this.cellSize);

        for (let cx = minCX; cx <= maxCX; cx++) {
            for (let cz = minCZ; cz <= maxCZ; cz++) {
                const key = `${cx},${cz}`;
                const cell = this.cells.get(key);
                if (cell) {
                    for (const item of cell) {
                        const dx = item.x - centerX;
                        const dz = item.z - centerZ;
                        const distSq = dx * dx + dz * dz;
                        if (distSq <= radius * radius) {
                            results.push({ ...item, dist: Math.sqrt(distSq) });
                        }
                    }
                }
            }
        }

        return results;
    }

    clear() {
        this.cells.clear();
    }

    get size() {
        let count = 0;
        for (const cell of this.cells.values()) {
            count += cell.length;
        }
        return count;
    }
}

class SpatialLookup {
    constructor() {
        this.byType = new Map();
        this.grid = new SpatialGrid(100);
    }

    addItem(x, y, z, type, data) {
        const key = `${type}`;
        if (!this.byType.has(key)) {
            this.byType.set(key, []);
        }
        
        const item = { x, y, z, type, data, dist: 0 };
        this.byType.get(key).push(item);
        this.grid.insert(x, z, item);
    }

    getByType(type) {
        return this.byType.get(type) || [];
    }

    getNearby(centerX, centerZ, radius, options = {}) {
        const { types = null, maxResults = Infinity } = options;
        
        let candidates;
        if (types && types.length > 0) {
            candidates = [];
            for (const type of types) {
                const typeItems = this.byType.get(type) || [];
                candidates.push(...typeItems);
            }
        } else {
            candidates = this.grid.queryRadius(centerX, centerZ, radius * 2);
        }

        const results = [];
        for (const item of candidates) {
            const dx = item.x - centerX;
            const dz = item.z - centerZ;
            const dist = Math.sqrt(dx * dx + dz * dz);
            if (dist <= radius) {
                results.push({ ...item, dist });
            }
        }

        results.sort((a, b) => a.dist - b.dist);
        return results.slice(0, maxResults);
    }

    clear() {
        this.byType.clear();
        this.grid.clear();
    }

    get totalItems() {
        let count = 0;
        for (const items of this.byType.values()) {
            count += items.length;
        }
        return count;
    }
}

window.SpatialGrid = SpatialGrid;
window.SpatialLookup = SpatialLookup;
