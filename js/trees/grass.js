// js/trees/grass.js - Grass geometry with LOD

class GrassGeometry {
    static getGeometry(lod) {
        if (lod === 'far') {
            return GrassGeometry.createFarLOD();
        }
        return GrassGeometry.createHighLOD();
    }

    static createFarLOD() {
        return new THREE.Mesh(
            new THREE.PlaneGeometry(0.8, 1.2),
            new THREE.MeshStandardMaterial({
                color: 0x9ACD32,
                side: THREE.DoubleSide
            })
        );
    }

    static createHighLOD() {
        const group = new THREE.Group();
        const mat = new THREE.MeshStandardMaterial({
            color: 0x9ACD32,
            side: THREE.DoubleSide
        });

        const bladeCount = 8 + Math.floor(Math.random() * 8);
        for (let i = 0; i < bladeCount; i++) {
            const blade = new THREE.Mesh(
                new THREE.PlaneGeometry(0.1 + Math.random() * 0.1, 0.5 + Math.random() * 0.5),
                mat
            );
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 0.4;
            blade.position.set(
                Math.cos(angle) * radius,
                0.25 + Math.random() * 0.3,
                Math.sin(angle) * radius
            );
            blade.rotation.y = angle;
            blade.rotation.x = (Math.random() - 0.5) * 0.2;
            group.add(blade);
        }

        return group;
    }
}

window.GrassGeometry = GrassGeometry;
