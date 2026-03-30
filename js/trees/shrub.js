// js/trees/shrub.js - Shrub geometry with LOD

class ShrubGeometry {
    static getGeometry(lod) {
        if (lod === 'far') {
            return ShrubGeometry.createFarLOD();
        } else if (lod === 'medium') {
            return ShrubGeometry.createMediumLOD();
        }
        return ShrubGeometry.createHighLOD();
    }

    static createFarLOD() {
        return new THREE.Mesh(
            new THREE.SphereGeometry(1.2, 6, 4),
            new THREE.MeshStandardMaterial({ color: 0x6B8E23 })
        );
    }

    static createMediumLOD() {
        return new THREE.Mesh(
            new THREE.SphereGeometry(1.5, 8, 6),
            new THREE.MeshStandardMaterial({ color: 0x6B8E23 })
        );
    }

    static createHighLOD() {
        const group = new THREE.Group();
        const trunkCount = 2 + Math.floor(Math.random() * 4);
        const mat = new THREE.MeshStandardMaterial({ color: 0x6B8E23 });

        for (let i = 0; i < trunkCount; i++) {
            const trunk = new THREE.Mesh(
                new THREE.CylinderGeometry(0.05, 0.1, 3, 5),
                mat
            );
            const angle = (i / trunkCount) * Math.PI * 2;
            trunk.position.set(
                Math.cos(angle) * 0.3,
                1.5,
                Math.sin(angle) * 0.3
            );
            trunk.rotation.z = (Math.random() - 0.5) * 0.3;
            trunk.castShadow = true;
            group.add(trunk);

            const bush = new THREE.Mesh(
                new THREE.SphereGeometry(0.8, 6, 5),
                mat
            );
            bush.position.set(
                Math.cos(angle) * 0.3,
                2.8,
                Math.sin(angle) * 0.3
            );
            bush.castShadow = true;
            group.add(bush);
        }

        return group;
    }
}

window.ShrubGeometry = ShrubGeometry;
