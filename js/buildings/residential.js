// js/buildings/residential.js
class SmallHouseGeometry {
    static getGeometry(lod = 'high') {
        const group = new THREE.Group();
        
        // Base
        const baseGeo = new THREE.BoxGeometry(8, 4, 6);
        const baseMat = new THREE.MeshStandardMaterial({ color: 0xF5F5DC }); // beige
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.y = 2;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);
        
        // Roof (only for high LOD)
        if (lod === 'high') {
            const roofGeo = new THREE.ConeGeometry(6, 3, 4);
            const roofMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 }); // brown
            const roof = new THREE.Mesh(roofGeo, roofMat);
            roof.position.y = 5.5;
            roof.rotation.y = Math.PI / 4;
            roof.castShadow = true;
            group.add(roof);
        }
        
        return group;
    }
}

class MediumHomeGeometry {
    static getGeometry(lod = 'high') {
        const group = new THREE.Group();
        
        // Main building
        const mainGeo = new THREE.BoxGeometry(12, 6, 8);
        const mainMat = new THREE.MeshStandardMaterial({ color: 0xFFFAF0 }); // floral white
        const main = new THREE.Mesh(mainGeo, mainMat);
        main.position.y = 3;
        main.castShadow = true;
        main.receiveShadow = true;
        group.add(main);
        
        // Garage
        const garageGeo = new THREE.BoxGeometry(5, 3, 6);
        const garage = new THREE.Mesh(garageGeo, mainMat);
        garage.position.set(5, 1.5, 0);
        garage.castShadow = true;
        group.add(garage);
        
        if (lod === 'high') {
            // Roof
            const roofGeo = new THREE.BoxGeometry(14, 1, 10);
            const roofMat = new THREE.MeshStandardMaterial({ color: 0x696969 }); // dim gray
            const roof = new THREE.Mesh(roofGeo, roofMat);
            roof.position.y = 6.5;
            roof.castShadow = true;
            group.add(roof);
        }
        
        return group;
    }
}

class LargeEstateGeometry {
    static getGeometry(lod = 'high') {
        const group = new THREE.Group();
        
        // Main building - two story
        const mainGeo = new THREE.BoxGeometry(18, 8, 12);
        const mainMat = new THREE.MeshStandardMaterial({ color: 0xFFFFF0 }); // ivory
        const main = new THREE.Mesh(mainGeo, mainMat);
        main.position.y = 4;
        main.castShadow = true;
        main.receiveShadow = true;
        group.add(main);
        
        if (lod === 'high') {
            // Pool (simple plane)
            const poolGeo = new THREE.PlaneGeometry(8, 5);
            const poolMat = new THREE.MeshStandardMaterial({ color: 0x4169E1, transparent: true, opacity: 0.8 });
            const pool = new THREE.Mesh(poolGeo, poolMat);
            pool.rotation.x = -Math.PI / 2;
            pool.position.set(-8, 0.1, 8);
            group.add(pool);
            
            // Windows
            const windowGeo = new THREE.PlaneGeometry(2, 2);
            const windowMat = new THREE.MeshBasicMaterial({ color: 0x87CEEB });
            for (let i = 0; i < 4; i++) {
                const windowMesh = new THREE.Mesh(windowGeo, windowMat);
                windowMesh.position.set(-5 + i * 4, 5, 6.1);
                group.add(windowMesh);
            }
        }
        
        return group;
    }
}

window.SmallHouseGeometry = SmallHouseGeometry;
window.MediumHomeGeometry = MediumHomeGeometry;
window.LargeEstateGeometry = LargeEstateGeometry;