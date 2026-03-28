// ========== AIRPORT ==========
function createAirport(scene, x, z, parentGroup = null) {
    const group = new THREE.Group();
    
    const runwayLength = 600;
    const runwayWidth = 30;
    
    group.rotation.y = Math.PI / 2;
    
    const runwayGeo = new THREE.PlaneGeometry(runwayLength, runwayWidth);
    const runwayMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 });
    const runway = new THREE.Mesh(runwayGeo, runwayMat);
    runway.rotation.x = -Math.PI / 2;
    runway.receiveShadow = true;
    group.add(runway);
    
    const markingGeo = new THREE.PlaneGeometry(15, 1.5);
    const markingMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    
    for (let i = -250; i < 250; i += 40) {
        const marking = new THREE.Mesh(markingGeo, markingMat);
        marking.rotation.x = -Math.PI / 2;
        marking.position.set(i, 0.1, 0);
        group.add(marking);
    }
    
    const centerlineGeo = new THREE.PlaneGeometry(runwayLength, 0.4);
    const centerline = new THREE.Mesh(centerlineGeo, markingMat);
    centerline.rotation.x = -Math.PI / 2;
    centerline.position.y = 0.1;
    group.add(centerline);
    
    const thresholdMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    for (let i = -12; i <= 12; i += 3) {
        const thresh = new THREE.Mesh(new THREE.PlaneGeometry(2, 5), thresholdMat);
        thresh.rotation.x = -Math.PI / 2;
        thresh.position.set(-270, 0.1, i * 1.1);
        group.add(thresh);
        
        const thresh2 = thresh.clone();
        thresh2.position.set(270, 0.1, i * 1.1);
        group.add(thresh2);
    }
    
    const taxiwayGeo = new THREE.PlaneGeometry(100, 20);
    const taxiway = new THREE.Mesh(taxiwayGeo, runwayMat);
    taxiway.rotation.x = -Math.PI / 2;
    taxiway.position.set(320, 0.01, 80);
    taxiway.receiveShadow = true;
    group.add(taxiway);
    
    const apronGeo = new THREE.PlaneGeometry(150, 100);
    const apron = new THREE.Mesh(apronGeo, runwayMat);
    apron.rotation.x = -Math.PI / 2;
    apron.position.set(380, 0.01, 150);
    apron.receiveShadow = true;
    group.add(apron);
    
    const terminalGeo = new THREE.BoxGeometry(80, 15, 30);
    const terminalMat = new THREE.MeshStandardMaterial({ color: 0xDDDDDD });
    const terminal = new THREE.Mesh(terminalGeo, terminalMat);
    terminal.position.set(380, 7.5, 200);
    terminal.castShadow = true;
    group.add(terminal);
    
    const terminalRoofGeo = new THREE.BoxGeometry(90, 3, 40);
    const terminalRoofMat = new THREE.MeshStandardMaterial({ color: 0x4169E1 });
    const terminalRoof = new THREE.Mesh(terminalRoofGeo, terminalRoofMat);
    terminalRoof.position.set(380, 20, 200);
    terminalRoof.castShadow = true;
    group.add(terminalRoof);
    
    const towerGeo = new THREE.CylinderGeometry(4, 5, 30, 8);
    const towerMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
    const tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.set(280, 15, 30);
    tower.castShadow = true;
    group.add(tower);
    
    const cabGeo = new THREE.BoxGeometry(10, 10, 10);
    const cab = new THREE.Mesh(cabGeo, towerMat);
    cab.position.set(280, 35, 30);
    cab.castShadow = true;
    group.add(cab);
    
    const hangarGeo = new THREE.BoxGeometry(60, 20, 50);
    const hangarMat = new THREE.MeshStandardMaterial({ color: 0xCC3333 });
    const hangar = new THREE.Mesh(hangarGeo, hangarMat);
    hangar.position.set(420, 10, 100);
    hangar.castShadow = true;
    group.add(hangar);
    
    const hangarRoofGeo = new THREE.BoxGeometry(70, 5, 60);
    const hangarRoofMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const hangarRoof = new THREE.Mesh(hangarRoofGeo, hangarRoofMat);
    hangarRoof.position.set(420, 25, 100);
    group.add(hangarRoof);
    
    const localY = 335;
    group.position.set(x, localY, z);
    
    if (parentGroup) {
        parentGroup.add(group);
    } else {
        scene.add(group);
    }
}
