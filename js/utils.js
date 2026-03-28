// ========== UTILITIES ==========
function degreesToRadians(degrees) {
    return degrees * (Math.PI / 180);
}

function radiansToDegrees(radians) {
    return radians * (180 / Math.PI);
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function lerp(start, end, t) {
    return start + (end - start) * t;
}

// Simple noise function for terrain
function noise(x, z, seed = 0) {
    const n = Math.sin(x * 0.01 + seed) * Math.cos(z * 0.01 + seed) +
              Math.sin(x * 0.02 + z * 0.015 + seed) * 0.5 +
              Math.sin(x * 0.005 + seed) * Math.cos(z * 0.008 + seed) * 0.3;
    return n;
}

function createTerrainColors(grassColor, darkGrassColor, sandColor, darkSandColor, rockColor, snowColor, height, waterLevel, beachLevel, snowLevel) {
    let color;
    if (height < waterLevel + 1) {
        color = darkSandColor;
    } else if (height < beachLevel) {
        const t = (height - waterLevel) / (beachLevel - waterLevel);
        color = sandColor.clone().lerp(grassColor, t * t);
    } else if (height < snowLevel - 15) {
        const t = Math.min(1, (height - beachLevel) / 50);
        color = grassColor.clone().lerp(darkGrassColor, t);
    } else {
        const t = Math.min(1, (height - snowLevel + 15) / 30);
        color = rockColor.clone().lerp(snowColor, t * t);
    }
    return color;
}
