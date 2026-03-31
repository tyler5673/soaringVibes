class WarehouseGeometry {
    static getGeometry(lod = 'high') {
        const group = new THREE.Group();
        
        const buildingGeo = new THREE.BoxGeometry(40, 8, 25);
        const buildingMat = new THREE.MeshStandardMaterial({ color: 0x708090 });
        const building = new THREE.Mesh(buildingGeo, buildingMat);
        building.position.y = 4;
        building.castShadow = true;
        building.receiveShadow = true;
        group.add(building);
        
        const roofGeo = new THREE.BoxGeometry(42, 1, 27);
        const roofMat = new THREE.MeshStandardMaterial({ color: 0x2F4F4F });
        const roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.y = 8.5;
        roof.castShadow = true;
        group.add(roof);
        
        if (lod === 'high') {
            const doorGeo = new THREE.PlaneGeometry(6, 5);
            const doorMat = new THREE.MeshStandardMaterial({ color: 0x696969 });
            for (let i = 0; i < 2; i++) {
                const door = new THREE.Mesh(doorGeo, doorMat);
                door.position.set(-10 + i * 20, 2.5, 12.6);
                group.add(door);
            }
        }
        
        return group;
    }
}

class FactoryGeometry {
    static getGeometry(lod = 'high') {
        const group = new THREE.Group();
        
        const unit1Geo = new THREE.BoxGeometry(20, 10, 20);
        const unit2Geo = new THREE.BoxGeometry(15, 8, 25);
        
        const buildingMat = new THREE.MeshStandardMaterial({ color: 0xA9A9A9 });
        
        const unit1 = new THREE.Mesh(unit1Geo, buildingMat);
        unit1.position.set(-5, 5, 0);
        unit1.castShadow = true;
        unit1.receiveShadow = true;
        group.add(unit1);
        
        const unit2 = new THREE.Mesh(unit2Geo, buildingMat);
        unit2.position.set(12, 4, 2);
        unit2.castShadow = true;
        unit2.receiveShadow = true;
        group.add(unit2);
        
        if (lod === 'high') {
            const stackGeo = new THREE.CylinderGeometry(1.5, 2, 15, 8);
            const stackMat = new THREE.MeshStandardMaterial({ color: 0x8B0000 });
            const stack = new THREE.Mesh(stackGeo, stackMat);
            stack.position.set(-8, 17, -5);
            stack.castShadow = true;
            group.add(stack);
        }
        
        return group;
    }
}

window.WarehouseGeometry = WarehouseGeometry;
window.FactoryGeometry = FactoryGeometry;