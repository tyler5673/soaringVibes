// js/trees/wiliwili.js - Wiliwili dry forest tree

class WiliwiliGeometry {
    static getGeometry(lod) {
        if (lod === 'far') {
            return WiliwiliGeometry.createFarLOD();
        } else if (lod === 'medium') {
            return WiliwiliGeometry.createMediumLOD();
        }
        return WiliwiliGeometry.createHighLOD();
    }

    static createFarLOD() {
        const group = new THREE.Group();
        const canopy = new THREE.Mesh(
            new THREE.SphereGeometry(3, 6, 4),
            new THREE.MeshStandardMaterial({ color: 0x8BC34A })
        );
        canopy.position.y = 6;
        group.add(canopy);
        return group;
    }

    static createMediumLOD() {
        const group = new THREE.Group();
        
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0xE57373 }); // Coral bark
        const canopyMat = new THREE.MeshStandardMaterial({ color: 0x8BC34A });

        const trunkHeight = 5 + Math.random() * 3;
        const trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(0.3, 0.6, trunkHeight, 6),
            trunkMat
        );
        trunk.position.y = trunkHeight / 2;
        trunk.castShadow = true;
        group.add(trunk);

        const canopy = new THREE.Mesh(
            new THREE.SphereGeometry(3, 8, 6),
            canopyMat
        );
        canopy.position.y = trunkHeight + 1;
        canopy.castShadow = true;
        group.add(canopy);

        return group;
    }

    static createHighLOD() {
        const group = new THREE.Group();
        
        // Coral/orange colored bark - characteristic of wiliwili
        const barkColors = [0xE57373, 0xFF8A65, 0xFFAB91];
        const barkColor = barkColors[Math.floor(Math.random() * barkColors.length)];
        
        const trunkMat = new THREE.MeshStandardMaterial({ color: barkColor });
        const leafMat = new THREE.MeshStandardMaterial({ 
            color: 0x8BC34A,
            transparent: true,
            opacity: 0.9
        });

        // Often multi-trunked
        const trunkCount = 1 + Math.floor(Math.random() * 3);
        const trunkHeight = 4 + Math.random() * 4;
        
        for (let t = 0; t < trunkCount; t++) {
            const height = trunkHeight * (0.8 + Math.random() * 0.4);
            const trunk = new THREE.Mesh(
                new THREE.CylinderGeometry(0.25, 0.45, height, 6),
                trunkMat
            );
            trunk.position.set(
                (Math.random() - 0.5) * 0.8,
                height / 2,
                (Math.random() - 0.5) * 0.8
            );
            trunk.rotation.z = (Math.random() - 0.5) * 0.15;
            trunk.castShadow = true;
            group.add(trunk);

            // Sparse branches (drought adaptation)
            const branchCount = 3 + Math.floor(Math.random() * 3);
            for (let i = 0; i < branchCount; i++) {
                const branch = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.1, 0.2, 2 + Math.random() * 2, 5),
                    trunkMat
                );
                
                const angle = (i / branchCount) * Math.PI * 2 + Math.random() * 0.6;
                const heightPos = height * (0.6 + Math.random() * 0.3);
                
                branch.position.set(
                    trunk.position.x + Math.cos(angle) * 0.5,
                    heightPos,
                    trunk.position.z + Math.sin(angle) * 0.5
                );
                branch.rotation.z = Math.PI / 3;
                branch.rotation.y = angle;
                group.add(branch);

                // Sparse leaf clusters
                const leafCluster = new THREE.Mesh(
                    new THREE.SphereGeometry(1 + Math.random() * 0.8, 6, 4),
                    leafMat
                );
                leafCluster.position.set(
                    branch.position.x + Math.cos(angle) * 1.5,
                    heightPos - 0.3,
                    branch.position.z + Math.sin(angle) * 1.5
                );
                leafCluster.scale.y = 0.6;
                leafCluster.castShadow = true;
                group.add(leafCluster);
            }
        }

        return group;
    }
}

window.WiliwiliGeometry = WiliwiliGeometry;