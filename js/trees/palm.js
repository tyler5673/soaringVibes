// js/trees/palm.js - Palm tree geometry with LOD

class PalmGeometry {
    static getGeometry(lod) {
        if (lod === 'far') {
            return PalmGeometry.createFarLOD();
        } else if (lod === 'medium') {
            return PalmGeometry.createMediumLOD();
        }
        return PalmGeometry.createHighLOD();
    }

    static createFarLOD() {
        const group = new THREE.Group();
        const geo1 = new THREE.PlaneGeometry(3, 8);
        const geo2 = new THREE.PlaneGeometry(3, 8);
        geo2.rotateY(Math.PI / 2);
        const mat = new THREE.MeshStandardMaterial({
            color: 0x4CAF50,
            side: THREE.DoubleSide
        });
        group.add(new THREE.Mesh(geo1, mat));
        group.add(new THREE.Mesh(geo2, mat));
        return group;
    }

    static createMediumLOD() {
        const group = new THREE.Group();
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
        const canopyMat = new THREE.MeshStandardMaterial({ color: 0x4CAF50 });

        const trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(0.3, 0.4, 8, 6),
            trunkMat
        );
        trunk.position.y = 4;
        trunk.castShadow = true;

        const canopy = new THREE.Mesh(
            new THREE.ConeGeometry(2, 3, 6),
            canopyMat
        );
        canopy.position.y = 8;
        canopy.castShadow = true;

        group.add(trunk, canopy);
        return group;
    }

    static createHighLOD() {
        const group = new THREE.Group();
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
        const frondMat = new THREE.MeshStandardMaterial({ color: 0x4CAF50 });

        const trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(0.2, 0.35, 10, 8),
            trunkMat
        );
        trunk.position.y = 5;
        trunk.castShadow = true;
        group.add(trunk);

        const frondCount = 7 + Math.floor(Math.random() * 3);
        for (let i = 0; i < frondCount; i++) {
            const frond = new THREE.Mesh(
                new THREE.ConeGeometry(0.8, 3, 4),
                frondMat
            );
            const angle = (i / frondCount) * Math.PI * 2;
            frond.position.set(
                Math.cos(angle) * 0.5,
                10,
                Math.sin(angle) * 0.5
            );
            frond.rotation.x = 1.2;
            frond.rotation.y = angle;
            frond.castShadow = true;
            group.add(frond);
        }

        return group;
    }
}

window.PalmGeometry = PalmGeometry;
