class ShopGeometry {
    static getGeometry(lod = 'high') {
        const group = new THREE.Group();
        
        const buildingGeo = new THREE.BoxGeometry(15, 5, 10);
        const buildingMat = new THREE.MeshStandardMaterial({ color: 0xDEB887 });
        const building = new THREE.Mesh(buildingGeo, buildingMat);
        building.position.y = 2.5;
        building.castShadow = true;
        building.receiveShadow = true;
        group.add(building);
        
        const roofGeo = new THREE.BoxGeometry(16, 0.5, 11);
        const roofMat = new THREE.MeshStandardMaterial({ color: 0x2F4F4F });
        const roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.y = 5.25;
        roof.castShadow = true;
        group.add(roof);
        
        if (lod === 'high') {
            const awningGeo = new THREE.BoxGeometry(8, 0.3, 2);
            const awningMat = new THREE.MeshStandardMaterial({ color: 0xDC143C });
            const awning = new THREE.Mesh(awningGeo, awningMat);
            awning.position.set(0, 3, 6);
            awning.castShadow = true;
            group.add(awning);
            
            const signGeo = new THREE.BoxGeometry(6, 1.5, 0.3);
            const sign = new THREE.Mesh(signGeo, new THREE.MeshStandardMaterial({ color: 0xFFD700 }));
            sign.position.set(0, 4.5, 5.2);
            group.add(sign);
        }
        
        return group;
    }
}

class HotelGeometry {
    static getGeometry(lod = 'high') {
        const group = new THREE.Group();
        
        const floors = lod === 'high' ? 4 : 3;
        const buildingGeo = new THREE.BoxGeometry(30, floors * 4, 20);
        const buildingMat = new THREE.MeshStandardMaterial({ color: 0xF0F8FF });
        const building = new THREE.Mesh(buildingGeo, buildingMat);
        building.position.y = floors * 2;
        building.castShadow = true;
        building.receiveShadow = true;
        group.add(building);
        
        if (lod === 'high') {
            const windowGeo = new THREE.PlaneGeometry(2, 2.5);
            const windowMat = new THREE.MeshBasicMaterial({ color: 0x87CEEB });
            
            for (let floor = 0; floor < floors; floor++) {
                for (let col = 0; col < 6; col++) {
                    const windowMesh = new THREE.Mesh(windowGeo, windowMat);
                    windowMesh.position.set(-12 + col * 5, 2 + floor * 4, 10.1);
                    group.add(windowMesh);
                }
            }
        }
        
        return group;
    }
}

class RestaurantGeometry {
    static getGeometry(lod = 'high') {
        const group = new THREE.Group();
        
        const diningGeo = new THREE.BoxGeometry(20, 4, 15);
        const diningMat = new THREE.MeshStandardMaterial({ color: 0xFFE4C4 });
        const dining = new THREE.Mesh(diningGeo, diningMat);
        dining.position.y = 2;
        dining.castShadow = true;
        dining.receiveShadow = true;
        group.add(dining);
        
        const roofGeo = new THREE.BoxGeometry(22, 0.5, 17);
        const roofMat = new THREE.MeshStandardMaterial({ color: 0x556B2F });
        const roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.y = 4.25;
        roof.castShadow = true;
        group.add(roof);
        
        if (lod === 'high') {
            const patioGeo = new THREE.BoxGeometry(10, 0.2, 8);
            const patioMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
            const patio = new THREE.Mesh(patioGeo, patioMat);
            patio.position.set(12, 0.1, 0);
            group.add(patio);
        }
        
        return group;
    }
}

window.ShopGeometry = ShopGeometry;
window.HotelGeometry = HotelGeometry;
window.RestaurantGeometry = RestaurantGeometry;