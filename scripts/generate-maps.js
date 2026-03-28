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

const MANUAL_AIRPORT_PIXELS = {
    maui: { x: 368, y: 715 },
    oahu: { x: 582, y: 158 },
    'big-island': [
        { x: 32, y: 607, name: 'Kona' }
    ],
    kauai: { x: 920, y: 310 },
    lanai: { x: 445, y: 280 },
    molokai: { x: 388, y: 615 }
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
    
    return { minX, maxX, minY, maxY, width, height };
}

function utmToIslandUv(utmX, utmY, island, width, height) {
    const bbox = island.bbox;
    
    const u = (utmX - bbox.xmin) / (bbox.xmax - bbox.xmin);
    const v = (utmY - bbox.ymin) / (bbox.ymax - bbox.ymin);
    
    return { u: Math.max(0, Math.min(1, u)), v: Math.max(0, Math.min(1, v)) };
}

async function generateMap(islandName) {
    console.log(`Generating map for ${islandName}...`);
    
    const island = loadIslandJson(islandName);
    const heightmapPath = path.join(HEIGHTMAP_DIR, `${islandName}.png`);
    
    const metadata = await sharp(heightmapPath).metadata();
    const width = metadata.width;
    const height = metadata.height;
    console.log(`  Image: ${width}x${height}, channels: ${metadata.channels}`);
    
    let composite = sharp(heightmapPath);
    
    const manualPixels = MANUAL_AIRPORT_PIXELS[islandName];
    if (manualPixels) {
        const airports = Array.isArray(manualPixels) ? manualPixels : [manualPixels];
        
        for (const airport of airports) {
            const px = airport.x;
            const py = airport.y;
            
            console.log(`  ${airport.name || 'Airport'}: pixel (${px}, ${py})`);
            
            const radius = 15;
            const dotBuffer = Buffer.alloc(radius * radius * 4);
            for (let i = 0; i < radius * radius; i++) {
                dotBuffer[i * 4] = 255;
                dotBuffer[i * 4 + 1] = 0;
                dotBuffer[i * 4 + 2] = 0;
                dotBuffer[i * 4 + 3] = 255;
            }
            
            const dotImage = await sharp(dotBuffer, {
                raw: { width: radius, height: radius, channels: 4 }
            }).png().toBuffer();
            
            composite = composite.composite([{
                input: dotImage,
                left: px - Math.floor(radius / 2),
                top: py - Math.floor(radius / 2)
            }]);
        }
    }
    
    const outputPath = path.join(MAPS_DIR, `${islandName}.png`);
    await composite.toFile(outputPath);
    
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
