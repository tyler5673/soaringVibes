const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { fromLatLon } = require('utm');

const HEIGHTMAP_DIR = path.join(__dirname, '..', 'assets', 'heightmaps');
const MAPS_DIR = path.join(__dirname, '..', 'assets', 'maps');

const COLOR_BEACH = { r: 0, g: 255, b: 255 };
const COLOR_GRASS = { r: 0, g: 255, b: 0 };
const COLOR_FOREST = { r: 0, g: 100, b: 0 };
const COLOR_CLIFF = { r: 139, g: 69, b: 19 };
const COLOR_SNOW = { r: 255, g: 255, b: 255 };
const COLOR_AIRPORT = { r: 255, g: 0, b: 0 };
const COLOR_TREE = { r: 50, g: 205, b: 50 };
const COLOR_BUILDING = { r: 255, g: 255, b: 0 };
const COLOR_WATER = { r: 0, g: 0, b: 100 };

const AIRPORTS = {
    maui: { lat: 20.8922, lon: -156.4381 },
    oahu: { lat: 21.3258, lon: -157.9217 },
    'big-island': [
        { lat: 19.7367, lon: -156.0407, name: 'Kona' },
        { lat: 19.7203, lon: -155.0481, name: 'Hilo' }
    ],
    kauai: { lat: 21.9786, lon: -159.3422 },
    lanai: { lat: 20.7856, lon: -156.9514 },
    molokai: { lat: 21.1529, lon: -157.0825 },
    niihau: null,
    kahoolawe: null
};

function loadIslandJson(name) {
    const jsonPath = path.join(HEIGHTMAP_DIR, `${name}.json`);
    return JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
}

function latLonToUtm(lat, lon) {
    return fromLatLon(lat, lon);
}

function findIslandBounds(heightData, width, height) {
    let minX = width, maxX = 0, minY = height, maxY = 0;
    let found = false;
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = y * width + x;
            const val = heightData[idx];
            const isTerrain = val > 1 && val < 253;
            if (isTerrain) {
                found = true;
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
            }
        }
    }
    
    if (!found) {
        return { minX: 0, maxX: width - 1, minY: 0, maxY: height - 1, width, height };
    }
    
    const padding = 10;
    minX = Math.max(0, minX - padding);
    maxX = Math.min(width - 1, maxX + padding);
    minY = Math.max(0, minY - padding);
    maxY = Math.min(height - 1, maxY + padding);
    
    return { minX, maxX, minY, maxY, width: maxX - minX, height: maxY - minY };
}

function utmToIslandUv(utmX, utmY, island, bounds) {
    const bbox = island.bbox;
    
    const bboxWidth = bbox.xmax - bbox.xmin;
    const bboxHeight = bbox.ymax - bbox.ymin;
    
    const scaleX = bboxWidth / bounds.width;
    const scaleY = bboxHeight / bounds.height;
    
    const offsetX = utmX - (bbox.xmin + bounds.minX * scaleX);
    const offsetY = utmY - (bbox.ymax - bounds.maxY * scaleY);
    
    const u = offsetX / (bounds.width * scaleX);
    const v = offsetY / (bounds.height * scaleY);
    
    return { u: Math.max(0, Math.min(1, u)), v: Math.max(0, Math.min(1, v)) };
}

async function generateMap(islandName) {
    console.log(`Generating map for ${islandName}...`);
    
    const island = loadIslandJson(islandName);
    const heightmapPath = path.join(HEIGHTMAP_DIR, `${islandName}.png`);
    
    const heightmap = await sharp(heightmapPath).raw().toBuffer({ resolveWithObject: true });
    const { data, info } = heightmap;
    
    const width = info.width;
    const height = info.height;
    
    const bounds = findIslandBounds(data, width, height);
    console.log(`  Island bounds: x=${bounds.minX}-${bounds.maxX}, y=${bounds.minY}-${bounds.maxY}`);
    console.log(`  Island size: ${bounds.width}x${bounds.height}`);
    
    const minElev = island.minElevation;
    const maxElev = island.maxElevation;
    const elevRange = maxElev - minElev;
    
    const waterLevel = 2;
    const beachLevel = 10;
    const grassLevel = 40;
    const forestLevel = 120;
    const cliffLevel = Math.max(200, maxElev * 0.5);
    const snowLevel = Math.max(200, maxElev * 0.7);
    
    const outputBuffer = Buffer.alloc(width * height * 3);
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x);
            const heightVal = data[idx];
            
            if (heightVal >= 253) {
                const outIdx = idx * 3;
                outputBuffer[outIdx] = 0;
                outputBuffer[outIdx + 1] = 0;
                outputBuffer[outIdx + 2] = 0;
                continue;
            }
            
            const normalizedHeight = heightVal / 255;
            const realHeight = minElev + normalizedHeight * elevRange;
            
            let color;
            
            if (heightVal <= 1) {
                color = COLOR_WATER;
            } else if (realHeight < waterLevel + 2) {
                color = COLOR_BEACH;
            } else if (realHeight < beachLevel) {
                color = COLOR_BEACH;
            } else if (realHeight < grassLevel) {
                color = COLOR_GRASS;
            } else if (realHeight < forestLevel) {
                color = COLOR_FOREST;
            } else if (realHeight < cliffLevel) {
                color = COLOR_CLIFF;
            } else if (realHeight < snowLevel) {
                color = COLOR_CLIFF;
            } else {
                color = COLOR_SNOW;
            }
            
            const outIdx = idx * 3;
            outputBuffer[outIdx] = color.r;
            outputBuffer[outIdx + 1] = color.g;
            outputBuffer[outIdx + 2] = color.b;
        }
    }
    
    const airportData = AIRPORTS[islandName];
    if (airportData) {
        const airports = Array.isArray(airportData) ? airportData : [airportData];
        
        for (const airport of airports) {
            const utm = latLonToUtm(airport.lat, airport.lon);
            const uv = utmToIslandUv(utm.easting, utm.northing, island, bounds);
            
            const px = Math.floor(uv.u * (bounds.maxX - bounds.minX) + bounds.minX);
            const py = Math.floor((1 - uv.v) * (bounds.maxY - bounds.minY) + bounds.minY);
            
            console.log(`  ${airport.name || 'Airport'} at UTM (${utm.easting}, ${utm.northing}) -> UV (${uv.u.toFixed(4)}, ${uv.v.toFixed(4)}) -> pixel (${px}, ${py})`);
            
            const radius = 20;
            for (let dy = -radius; dy <= radius; dy++) {
                for (let dx = -radius; dx <= radius; dx++) {
                    if (dx * dx + dy * dy <= radius * radius) {
                        const x = px + dx;
                        const y = py + dy;
                        if (x >= 0 && x < width && y >= 0 && y < height) {
                            const idx = (y * width + x) * 3;
                            outputBuffer[idx] = COLOR_AIRPORT.r;
                            outputBuffer[idx + 1] = COLOR_AIRPORT.g;
                            outputBuffer[idx + 2] = COLOR_AIRPORT.b;
                        }
                    }
                }
            }
        }
    }
    
    const outputPath = path.join(MAPS_DIR, `${islandName}.png`);
    await sharp(outputBuffer, {
        raw: {
            width: width,
            height: height,
            channels: 3
        }
    }).png().toFile(outputPath);
    
    console.log(`  Saved to ${outputPath}`);
}

async function main() {
    if (!fs.existsSync(MAPS_DIR)) {
        fs.mkdirSync(MAPS_DIR, { recursive: true });
    }
    
    const islands = ['maui', 'oahu', 'big-island', 'kauai', 'molokai', 'lanai', 'niihau', 'kahoolawe'];
    
    for (const island of islands) {
        await generateMap(island);
    }
    
    console.log('All maps generated!');
}

main().catch(console.error);
