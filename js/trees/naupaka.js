// js/trees/naupaka.js - Naupaka coastal shrub

class NaupakaGeometry {
    static getGeometry(lod) {
        if (lod === 'far') {
            return NaupakaGeometry.createFarLOD();
        } else if (lod === 'medium') {
            return NaupakaGeometry.createMediumLOD();
        }
        return NaupakaGeometry.createHighLOD();
    }

    static createFarLOD() {
        const bush = new THREE.Mesh(
            new THREE.SphereGeometry(0.4, 6, 4),
            new THREE.MeshStandardMaterial({ color: 0x4CAF50 })
        );
        bush.position.y = 0.4;
        return bush;
    }

    static createMediumLOD() {
        const group = new THREE.Group();
        const leafMat = new THREE.MeshStandardMaterial({ color: 0x4CAF50 });

        const bush = new THREE.Mesh(
            new THREE.DodecahedronGeometry(0.5, 0),
            leafMat
        );
        bush.position.y = 0.5;
        bush.scale.y = 0.8;
        bush.castShadow = true;
        group.add(bush);

        return group;
    }

    static createHighLOD() {
        const group = new THREE.Group();
        
        const stemMat = new THREE.MeshStandardMaterial({ color: 0x5D4037 });
        const leafMat = new THREE.MeshStandardMaterial({ color: 0x558B2F });
        const flowerMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });

        // Multiple branching stems
        const stemCount = 3 + Math.floor(Math.random() * 3);
        
        for (let s = 0; s < stemCount; s++) {
            const stemHeight = 0.8 + Math.random() * 0.6;
            const stem = new THREE.Mesh(
                new THREE.CylinderGeometry(0.03, 0.05, stemHeight, 5),
                stemMat
            );
            stem.position.set(
                (Math.random() - 0.5) * 0.4,
                stemHeight / 2,
                (Math.random() - 0.5) * 0.4
            );
            stem.rotation.z = (Math.random() - 0.5) * 0.3;
            stem.castShadow = true;
            group.add(stem);

            // Leaves along stem
            const leafCount = 4 + Math.floor(Math.random() * 4);
            for (let i = 0; i < leafCount; i++) {
                const leaf = new THREE.Mesh(
                    new THREE.ConeGeometry(0.04, 0.25, 3),
                    leafMat
                );
                
                const t = i / leafCount;
                const angle = Math.random() * Math.PI * 2;
                const height = 0.2 + t * stemHeight * 0.8;
                
                leaf.position.set(
                    stem.position.x + Math.cos(angle) * 0.1,
                    height,
                    stem.position.z + Math.sin(angle) * 0.1
                );
                leaf.rotation.x = 0.5 + Math.random() * 0.3;
                leaf.rotation.y = angle;
                leaf.scale.z = 0.25;
                leaf.castShadow = true;
                group.add(leaf);
            }

            // Naupaka flowers (white, half-flower shape - characteristic!)
            const flowerCount = 2 + Math.floor(Math.random() * 3);
            for (let f = 0; f < flowerCount; f++) {
                const flower = new THREE.Mesh(
                    new THREE.SphereGeometry(0.06, 5, 4),
                    flowerMat
                );
                
                const height = 0.4 + Math.random() * (stemHeight * 0.6);
                const angle = Math.random() * Math.PI * 2;
                
                flower.position.set(
                    stem.position.x + Math.cos(angle) * 0.12,
                    height,
                    stem.position.z + Math.sin(angle) * 0.12
                );
                
                // Half-flower shape by scaling
                flower.scale.x = 0.7;
                flower.scale.z = 0.5;
                group.add(flower);

                // Small white petals
                for (let p = 0; p < 3; p++) {
                    const petal = new THREE.Mesh(
                        new THREE.ConeGeometry(0.03, 0.1, 3),
                        flowerMat
                    );
                    petal.position.copy(flower.position);
                    petal.position.y += 0.03;
                    petal.rotation.x = 0.3;
                    petal.rotation.y = angle + p * 0.8;
                    petal.scale.z = 0.2;
                    group.add(petal);
                }
            }
        }

        return group;
    }
}

window.NaupakaGeometry = NaupakaGeometry;