// js/trees/ohia.js - Realistic Ohia Lehua tree geometry
// Metrosideros polymorpha: 20-80 ft (6-25m) tall, highly variable forms, red brush flowers

class OhiaGeometry {
    static getGeometry(lod) {
        if (lod === 'far') {
            return OhiaGeometry.createFarLOD();
        } else if (lod === 'medium') {
            return OhiaGeometry.createMediumLOD();
        }
        return OhiaGeometry.createHighLOD();
    }

    static createFarLOD() {
        const group = new THREE.Group();
        // Distinctive red dot from flowers
        const canopy = new THREE.Mesh(
            new THREE.SphereGeometry(6, 6, 4),
            new THREE.MeshStandardMaterial({ color: 0x1B5E20 })
        );
        canopy.position.y = 12;
        group.add(canopy);
        return group;
    }

    static createMediumLOD() {
        const group = new THREE.Group();
        
        // Gray-brown bark typical of ohia
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8D6E63 });
        // Dark green glossy leaves
        const canopyMat = new THREE.MeshStandardMaterial({ color: 0x1B5E20 });

        // Variable height - ohia comes in many forms
        const trunkHeight = 10 + Math.random() * 8;
        const trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(0.25, 0.45, trunkHeight, 8),
            trunkMat
        );
        trunk.position.y = trunkHeight / 2;
        trunk.castShadow = true;

        // Dense rounded crown
        const canopy = new THREE.Mesh(
            new THREE.SphereGeometry(5, 10, 8),
            canopyMat
        );
        canopy.position.y = trunkHeight + 2;
        canopy.castShadow = true;

        group.add(trunk, canopy);
        return group;
    }

    static createHighLOD() {
        const group = new THREE.Group();
        
        // Ohia is highly variable - can be shrub-like or tree-like
        const form = Math.random();
        
        // Height: 6-25m, highly variable
        const trunkHeight = 6 + Math.random() * 12;
        const baseRadius = 0.2 + Math.random() * 0.2; // 0.4-0.8 ft diameter
        
        const trunkMat = new THREE.MeshStandardMaterial({ 
            color: 0x8D6E63, // Gray-brown bark
            roughness: 0.85
        });
        
        // Dark glossy green leaves
        const leafMat = new THREE.MeshStandardMaterial({ 
            color: 0x1B5E20,
            roughness: 0.4,
            metalness: 0.1
        });
        
        // Red-orange brush flowers (lehua)
        const flowerMat = new THREE.MeshStandardMaterial({ 
            color: 0xDC143C, // Crimson
            roughness: 0.3
        });

        // Often multi-trunked or gnarled
        const trunkCount = form > 0.6 ? 1 : 2 + Math.floor(Math.random() * 2);
        
        for (let t = 0; t < trunkCount; t++) {
            const height = trunkHeight * (0.7 + Math.random() * 0.5);
            const trunk = new THREE.Mesh(
                new THREE.CylinderGeometry(baseRadius * 0.5, baseRadius, height, 8),
                trunkMat
            );
            trunk.position.set(
                (Math.random() - 0.5) * (baseRadius * 2),
                height / 2,
                (Math.random() - 0.5) * (baseRadius * 2)
            );
            trunk.rotation.z = (Math.random() - 0.5) * 0.15;
            trunk.castShadow = true;
            group.add(trunk);

            // Ohia has distinctive gnarled branching
            const branchCount = 4 + Math.floor(Math.random() * 5);
            for (let i = 0; i < branchCount; i++) {
                const branchLength = 2 + Math.random() * 3;
                const branch = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.08, 0.18, branchLength, 6),
                    trunkMat
                );
                
                const angle = (i / branchCount) * Math.PI * 2 + Math.random() * 0.6;
                const heightPos = height * (0.5 + Math.random() * 0.4);
                
                // Irregular gnarled branches
                branch.position.set(
                    trunk.position.x + Math.cos(angle) * 0.3,
                    heightPos,
                    trunk.position.z + Math.sin(angle) * 0.3
                );
                branch.rotation.z = Math.PI / 2.5 + (Math.random() - 0.5) * 0.5;
                branch.rotation.y = angle;
                group.add(branch);

                // Dense leaf clusters at branch tips
                const clusterCount = 2 + Math.floor(Math.random() * 3);
                for (let j = 0; j < clusterCount; j++) {
                    const clusterSize = 1 + Math.random() * 0.8;
                    const leaves = new THREE.Mesh(
                        new THREE.SphereGeometry(clusterSize, 7, 6),
                        leafMat
                    );
                    
                    leaves.position.set(
                        branch.position.x + Math.cos(angle) * (branchLength * 0.8 + j),
                        heightPos + j * 0.4,
                        branch.position.z + Math.sin(angle) * (branchLength * 0.8 + j)
                    );
                    leaves.scale.y = 0.7;
                    leaves.castShadow = true;
                    group.add(leaves);

                    // Red lehua flowers - brush-like clusters
                    if (Math.random() > 0.3) {
                        const flowerCluster = new THREE.Mesh(
                            new THREE.SphereGeometry(0.25, 6, 5),
                            flowerMat
                        );
                        flowerCluster.position.copy(leaves.position);
                        flowerCluster.position.y += 0.4;
                        flowerCluster.scale.set(1, 0.6, 1);
                        group.add(flowerCluster);
                        
                        // Individual brush flowers
                        for (let f = 0; f < 8; f++) {
                            const flower = new THREE.Mesh(
                                new THREE.ConeGeometry(0.04, 0.3, 4),
                                flowerMat
                            );
                            const fa = Math.random() * Math.PI * 2;
                            flower.position.set(
                                flowerCluster.position.x + Math.cos(fa) * 0.15,
                                flowerCluster.position.y + Math.random() * 0.1,
                                flowerCluster.position.z + Math.sin(fa) * 0.15
                            );
                            flower.rotation.x = Math.random() * 0.5;
                            flower.rotation.z = Math.random() * 0.5;
                            group.add(flower);
                        }
                    }
                }
            }
        }

        return group;
    }
}

window.OhiaGeometry = OhiaGeometry;