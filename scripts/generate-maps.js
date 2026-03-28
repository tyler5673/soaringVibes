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
        { lat: 19.7367, lon: -156.0407, name: 'Kona' }
    ],
    kauai: { lat: 21.9786, lon: -159.3422 },
    lanai: { lat: 20.7856, lon: -156.9514 },
    molokai: { lat: 21.1517, lon: -157.0912 },
    niihau: null,
    kahoolawe: null
};

const ISLAND_BOUNDS = {
    maui: { north: 21.031363703651188, south: 20.574418740849925, east: -155.9790147408373, west: -156.6971637036512 },
    oahu: { north: 21.712412752206696, south: 21.254794138987258, east: -157.6486640799658, west: -158.28092225298528 },
    'big-island': { north: 20.310696845612735, south: 18.861803665309147, east: -154.75671076144639, west: -156.12486296186597 },
    kauai: { north: 22.238843653393445, south: 21.8551371481648, east: -159.28180443330066, west: -159.79838227902235 },
    molokai: { north: 21.224127027458906, south: 21.046067348013413, east: -156.70987086760655, west: -157.31081071139295 },
    lanai: { north: 20.92936330044028, south: 20.73178950730314, east: -156.80536990808585, west: -157.0621973224075 },
    niihau: { north: 22.02845014502927, south: 21.778478902016587, east: -160.04946654636794, west: -160.24703641028984 },
    kahoolawe: { north: 20.637269737328893, south: 20.49699071402145, east: -156.49069436182018, west: -156.7041221827599 }
};

const IMAGE_ISLAND_BOUNDS = {
    maui: { minX: 12, maxX: 1022, minY: 170, maxY: 969 },
    oahu: { minX: 11, maxX: 1023, minY: 151, maxY: 904 },
    'big-island': { minX: 93, maxX: 939, minY: 28, maxY: 1007 },
    kauai: { minX: 62, maxX: 1017, minY: 111, maxY: 891 },
    molokai: { minX: 10, maxX: 1022, minY: 355, maxY: 1023 },
    lanai: { minX: 14, maxX: 1006, minY: 112, maxY: 910 },
    niihau: { minX: 0, maxX: 1023, minY: 0, maxY: 1023 },
    kahoolawe: { minX: 0, maxX: 1023, minY: 0, maxY: 1023 }
};

function latLngToPixel(lat, lon, bounds, imgBounds) {
    const u = (lon - bounds.west) / (bounds.east - bounds.west);
    const v = (lat - bounds.south) / (bounds.north - bounds.south);
    
    // Map to image bounds: 
    // - u=0 (west) -> imgBounds.minX (left)
    // - u=1 (east) -> imgBounds.maxX (right)
    // - v=0 (south) -> imgBounds.maxY (bottom of image, higher y value)
    // - v=1 (north) -> imgBounds.minY (top of image, lower y value)
    const px = Math.round(imgBounds.minX + u * (imgBounds.maxX - imgBounds.minX));
    const py = Math.round(imgBounds.minY + (1 - v) * (imgBounds.maxY - imgBounds.minY));
    
    return { x: px, y: py };
}

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
    
    const airportData = AIRPORTS[islandName];
    const bounds = ISLAND_BOUNDS[islandName];
    const imgBounds = IMAGE_ISLAND_BOUNDS[islandName];
    
    if (airportData && bounds && imgBounds) {
        const airports = Array.isArray(airportData) ? airportData : [airportData];
        
        for (const airport of airports) {
            const pos = latLngToPixel(airport.lat, airport.lon, bounds, imgBounds);
            const px = pos.x;
            const py = pos.y;
            
            console.log(`  ${airport.name || 'Airport'}: lat=${airport.lat}, lng=${airport.lon} -> pixel (${px}, ${py})`);
            
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
