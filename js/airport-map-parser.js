async function parseAirportMap(islandName) {
    const loader = new THREE.TextureLoader();
    
    const texture = await new Promise((resolve, reject) => {
        loader.load(
            `assets/maps/${islandName}-airport.png`,
            resolve,
            undefined,
            reject
        );
    });
    
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(texture.image, 0, 0);
    
    const imageData = ctx.getImageData(0, 0, 1024, 1024);
    const airports = [];
    
    const redPixels = [];
    for (let y = 0; y < 1024; y++) {
        for (let x = 0; x < 1024; x++) {
            const idx = (y * 1024 + x) * 4;
            const r = imageData.data[idx];
            const g = imageData.data[idx + 1];
            const b = imageData.data[idx + 2];
            
            if (r > 200 && g < 100 && b < 100) {
                redPixels.push({ x, y });
            }
        }
    }
    
    const clusters = [];
    const threshold = 50;
    
    for (const pixel of redPixels) {
        let foundCluster = false;
        for (const cluster of clusters) {
            const dist = Math.sqrt(
                Math.pow(pixel.x - cluster.x, 2) + 
                Math.pow(pixel.y - cluster.y, 2)
            );
            if (dist < threshold) {
                cluster.pixels.push(pixel);
                cluster.x = cluster.pixels.reduce((s, p) => s + p.x, 0) / cluster.pixels.length;
                cluster.y = cluster.pixels.reduce((s, p) => s + p.y, 0) / cluster.pixels.length;
                foundCluster = true;
                break;
            }
        }
        
        if (!foundCluster) {
            clusters.push({ x: pixel.x, y: pixel.y, pixels: [pixel] });
        }
    }
    
    return clusters.map(c => ({ x: c.x, y: c.y }));
}

window.parseAirportMap = parseAirportMap;
