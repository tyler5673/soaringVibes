// js/trees/wiliwili.js - Wiliwili (Erythrina sandwicensis)
// Hawaii's state tree: coral red flowers, 30-40 ft, distinctive seed pods
// Bloom: spectacular canopy coverage in red flowers

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
        // Coral red canopy signature
        const canopy = new THREE.Mesh(
            new THREE.SphereGeometry(4, 8, 6),
            new THREE.MeshStandardMaterial({ color: 0xFF6347 })
        );
        canopy.position.y = 8;
        group.add(canopy);
        return group;
    }

    static createMediumLOD() {
        const group = new THREE.Group();
        
        // Wiliwili has distinctive coral/orange-red bark
        const barkMat = new THREE.MeshStandardMaterial({ color: 0xFF7043 });
        const canopyMat = new THREE.MeshStandardMaterial({ color: 0x66BB6A });
        const flowerMat = new THREE.MeshStandardMaterial({ color: 0xFF5252 });

        const trunkHeight = 6 + Math.random() * 4;
        const trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(0.4, 0.7, trunkHeight, 8),
            barkMat
        );
        trunk.position.y = trunkHeight / 2;
        trunk.castShadow = true;
        group.add(trunk);

        // Dense canopy covered in red flowers
        const canopy = new THREE.Mesh(
            new THREE.SphereGeometry(4, 10, 8),
            canopyMat
        );
        canopy.position.y = trunkHeight + 1.5;
        canopy.castShadow = true;
        group.add(canopy);

        // Cover with flower clusters
        const flowerCount = 15 + Math.floor(Math.random() * 10);
        for (let i = 0; i < flowerCount; i++) {
            const flowerCluster = new THREE.Mesh(
                new THREE.DodecahedronGeometry(0.4, 0),
                flowerMat
            );
            const angle = Math.random() * Math.PI * 2;
            const lat = Math.random() * Math.PI - Math.PI / 2;
            const radius = 3.8;
            flowerCluster.position.set(
                Math.cos(lat) * Math.cos(angle) * radius,
                trunkHeight + 1.5 + Math.sin(lat) * radius,
                Math.cos(lat) * Math.sin(angle) * radius
            );
            group.add(flowerCluster);
        }

        return group;
    }

    static createHighLOD() {
        const group = new THREE.Group();
        
        // Coral/orange-red bark - characteristic feature
        const barkColors = [0xFF7043, 0xF4511E, 0xFF5722];
        const barkColor = barkColors[Math.floor(Math.random() * barkColors.length)];
        
        const trunkMat = new THREE.MeshStandardMaterial({ 
            color: barkColor,
            roughness: 0.6
        });
        
        const leafMat = new THREE.MeshStandardMaterial({ 
            color: 0x66BB6A,
            roughness: 0.5
        });
        
        // Spectacular coral red flowers
        const flowerMat = new THREE.MeshStandardMaterial({ 
            color: 0xFF5252,
            roughness: 0.4
        });

        // Often multi-trunked
        const trunkCount = 1 + Math.floor(Math.random() * 2);
        const trunkHeight = 8 + Math.random() * 8; // 20-35ft
        
        for (let t = 0; t < trunkCount; t++) {
            const height = trunkHeight * (0.7 + Math.random() * 0.5);
            const trunk = new THREE.Mesh(
                new THREE.CylinderGeometry(0.3, 0.6, height, 8),
                trunkMat
            );
            trunk.position.set(
                (Math.random() - 0.5) * 1,
                height / 2,
                (Math.random() - 0.5) * 1
            );
            trunk.rotation.z = (Math.random() - 0.5) * 0.1;
            trunk.castShadow = true;
            group.add(trunk);

            // Branching structure
            const branchCount = 5 + Math.floor(Math.random() * 4);
            for (let i = 0; i < branchCount; i++) {
                const branchLength = 3 + Math.random() * 3;
                const branch = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.15, 0.3, branchLength, 6),
                    trunkMat
                );
                
                const angle = (i / branchCount) * Math.PI * 2 + Math.random() * 0.4;
                const heightPos = height * (0.5 + Math.random() * 0.4);
                
                branch.position.set(
                    trunk.position.x + Math.cos(angle) * 0.5,
                    heightPos,
                    trunk.position.z + Math.sin(angle) * 0.5
                );
                branch.rotation.z = Math.PI / 3 + (Math.random() - 0.5) * 0.3;
                branch.rotation.y = angle;
                branch.castShadow = true;
                group.add(branch);

                // Compound leaves (tri-foliate)
                const leafClusters = 3 + Math.floor(Math.random() * 4);
                for (let l = 0; l < leafClusters; l++) {
                    const clusterSize = 0.8 + Math.random() * 0.6;
                    const leaves = new THREE.Mesh(
                        new THREE.SphereGeometry(clusterSize, 7, 5),
                        leafMat
                    );
                    
                    const t = l / leafClusters;
                    leaves.position.set(
                        branch.position.x + Math.cos(angle) * (branchLength * 0.3 + t * branchLength * 0.6),
                        heightPos - 0.3 - t * 0.4,
                        branch.position.z + Math.sin(angle) * (branchLength * 0.3 + t * branchLength * 0.6)
                    );
                    leaves.scale.y = 0.7;
                    leaves.castShadow = true;
                    group.add(leaves);
                }

                // Red flower clusters - large showy blooms
                const flowerClusters = 4 + Math.floor(Math.random() * 5);
                for (let f = 0; f < flowerClusters; f++) {
                    const clusterSize = 0.5 + Math.random() * 0.4;
                    const flowers = new THREE.Mesh(
                        new THREE.DodecahedronGeometry(clusterSize, 0),
                        flowerMat
                    );
                    
                    const t = Math.random();
                    flowers.position.set(
                        branch.position.x + Math.cos(angle) * (branchLength * 0.4 + t * branchLength * 0.5),
                        heightPos + Math.random() * 0.5,
                        branch.position.z + Math.sin(angle) * (branchLength * 0.4 + t * branchLength * 0.5)
                    );
                    flowers.castShadow = true;
                    group.add(flowers);

                    // Individual flowers in cluster
                    for (let fl = 0; fl < 5; fl++) {
                        const flower = new THREE.Mesh(
                            new THREE.ConeGeometry(0.15, 0.4, 5),
                            flowerMat
                        );
                        const fa = Math.random() * Math.PI * 2;
                        const fr = 0.3;
                        flower.position.set(
                            flowers.position.x + Math.cos(fa) * fr,
                            flowers.position.y + (Math.random() - 0.5) * 0.3,
                            flowers.position.z + Math.sin(fa) * fr
                        );
                        flower.rotation.x = Math.random() * Math.PI;
                        flower.rotation.y = Math.random() * Math.PI;
                        group.add(flower);
                    }
                }
            }
        }

        return group;
    }
}

window.WiliwiliGeometry = WiliwiliGeometry;