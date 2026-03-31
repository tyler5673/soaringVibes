// js/buildings/lighthouse.js
class LighthouseGeometry {
    static getGeometry(lod = 'high') {
        const group = new THREE.Group();
        
        // Base/foundation
        const baseGeo = new THREE.CylinderGeometry(4, 5, 3, 8);
        const baseMat = new THREE.MeshStandardMaterial({ color: 0x808080, roughness: 0.9 });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.y = 1.5;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);
        
        // Tower
        const towerGeo = new THREE.CylinderGeometry(2.5, 4, 25, 8);
        const towerMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
        const tower = new THREE.Mesh(towerGeo, towerMat);
        tower.position.y = 16;
        tower.castShadow = true;
        group.add(tower);
        
        if (lod === 'high') {
            // Lantern room
            const lanternGeo = new THREE.CylinderGeometry(2, 2.5, 4, 8);
            const lanternMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
            const lantern = new THREE.Mesh(lanternGeo, lanternMat);
            lantern.position.y = 30;
            lantern.castShadow = true;
            group.add(lantern);
            
            // Light (glowing)
            const lightGeo = new THREE.SphereGeometry(1.2, 8, 8);
            const lightMat = new THREE.MeshBasicMaterial({ color: 0xFFFF00 });
            const light = new THREE.Mesh(lightGeo, lightMat);
            light.position.y = 32;
            group.add(light);
            
            // Roof
            const roofGeo = new THREE.ConeGeometry(3, 5, 8);
            const roofMat = new THREE.MeshStandardMaterial({ color: 0xCC0000 });
            const roof = new THREE.Mesh(roofGeo, roofMat);
            roof.position.y = 36;
            roof.castShadow = true;
            group.add(roof);
        }
        
        return group;
    }
}

window.LighthouseGeometry = LighthouseGeometry;