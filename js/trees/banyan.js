// js/trees/banyan.js - Realistic Banyan tree geometry
// Ficus benghalensis: 60-100 ft tall, spreads 200+ ft via aerial roots

class BanyanGeometry {
    static getGeometry(lod) {
        if (lod === 'far') {
            return BanyanGeometry.createFarLOD();
        } else if (lod === 'medium') {
            return BanyanGeometry.createMediumLOD();
        }
        return BanyanGeometry.createHighLOD();
    }

    static createFarLOD() {
        const group = new THREE.Group();
        // Massive spreading shape
        const canopy = new THREE.Mesh(
            new THREE.SphereGeometry(15, 8, 6),
            new THREE.MeshStandardMaterial({ color: 0x2E7D32 })
        );
        canopy.position.y = 18;
        canopy.scale.set(1.5, 0.5, 1.5);
        group.add(canopy);
        return group;
    }

    static createMediumLOD() {
        const group = new THREE.Group();
        
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5D4037 });
        const canopyMat = new THREE.MeshStandardMaterial({ color: 0x2E7D32 });

        // Main trunk
        const trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(1.2, 1.8, 12, 8),
            trunkMat
        );
        trunk.position.y = 6;
        trunk.castShadow = true;
        group.add(trunk);

        // Massive spreading canopy - 40-50 ft spread
        const canopy = new THREE.Mesh(
            new THREE.SphereGeometry(12, 10, 8),
            canopyMat
        );
        canopy.position.y = 14;
        canopy.scale.set(1.6, 0.4, 1.6);
        canopy.castShadow = true;
        group.add(canopy);

        return group;
    }

    static createHighLOD() {
        const group = new THREE.Group();
        
        // Banyan dimensions - massive!
        const trunkHeight = 10 + Math.random() * 6; // 10-16m tall
        const trunkRadius = 1.0 + Math.random() * 0.5; // 6-10 ft diameter at base
        
        const trunkMat = new THREE.MeshStandardMaterial({ 
            color: 0x5D4037, // Gray-brown
            roughness: 0.9
        });
        
        // Smooth elliptical leaves
        const leafMat = new THREE.MeshStandardMaterial({ 
            color: 0x2E7D32,
            roughness: 0.5
        });
        
        // Aerial roots - lighter gray
        const rootMat = new THREE.MeshStandardMaterial({ 
            color: 0x8D6E63,
            roughness: 0.85
        });

        // Main trunk with buttressing
        const trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(trunkRadius * 0.8, trunkRadius, trunkHeight, 10),
            trunkMat
        );
        trunk.position.y = trunkHeight / 2;
        trunk.castShadow = true;
        group.add(trunk);

        // Buttress roots at base
        const buttressCount = 4 + Math.floor(Math.random() * 3);
        for (let i = 0; i < buttressCount; i++) {
            const buttress = new THREE.Mesh(
                new THREE.ConeGeometry(trunkRadius * 0.5, trunkHeight * 0.3, 3),
                trunkMat
            );
            const angle = (i / buttressCount) * Math.PI * 2;
            buttress.position.set(
                Math.cos(angle) * trunkRadius * 0.6,
                trunkHeight * 0.15,
                Math.sin(angle) * trunkRadius * 0.6
            );
            buttress.rotation.z = 0.4;
            buttress.rotation.y = angle;
            buttress.scale.z = 0.3;
            group.add(buttress);
        }

        // Aerial roots - characteristic of banyan, can become secondary trunks
        const aerialRootCount = 8 + Math.floor(Math.random() * 8);
        
        for (let i = 0; i < aerialRootCount; i++) {
            const rootHeight = 4 + Math.random() * 8; // Roots can be 4-12m long
            const rootRadius = 0.1 + Math.random() * 0.15; // Thickness varies
            
            // Create curved aerial root
            const segments = 6;
            const startAngle = Math.random() * Math.PI * 2;
            const startHeight = trunkHeight * (0.4 + Math.random() * 0.4);
            const startDist = trunkRadius * (0.5 + Math.random() * 0.5);
            
            let lastPos = new THREE.Vector3(
                Math.cos(startAngle) * startDist,
                startHeight,
                Math.sin(startAngle) * startDist
            );
            
            for (let s = 0; s < segments; s++) {
                const segLength = rootHeight / segments;
                const taper = 1 - (s / segments) * 0.3;
                
                const segment = new THREE.Mesh(
                    new THREE.CylinderGeometry(
                        rootRadius * taper * 0.7, 
                        rootRadius * taper, 
                        segLength, 
                        5
                    ),
                    rootMat
                );
                
                const arc = s / segments;
                const curve = Math.sin(arc * Math.PI * 0.5) * 0.3;
                
                segment.position.set(
                    lastPos.x + Math.cos(startAngle) * (s * 0.5),
                    lastPos.y - segLength * 0.8,
                    lastPos.z + Math.sin(startAngle) * (s * 0.5)
                );
                segment.rotation.x = curve + 0.2;
                segment.rotation.y = startAngle;
                segment.castShadow = true;
                group.add(segment);
                
                lastPos = segment.position.clone();
            }
        }

        // Massive spreading canopy with multiple levels
        const canopyLevels = 3 + Math.floor(Math.random() * 2);
        
        for (let c = 0; c < canopyLevels; c++) {
            const levelY = trunkHeight + c * 2 + Math.random() * 2;
            const spread = 15 + c * 5 + Math.random() * 8; // 15-35m spread
            
            // Main canopy mass
            const canopy = new THREE.Mesh(
                new THREE.SphereGeometry(spread * 0.4, 10, 8),
                leafMat
            );
            canopy.position.y = levelY;
            canopy.scale.set(1.8, 0.35, 1.8);
            canopy.castShadow = true;
            group.add(canopy);

            // Horizontal branches extending outward
            const branchCount = 6 + Math.floor(Math.random() * 4);
            for (let i = 0; i < branchCount; i++) {
                const branchLength = 5 + Math.random() * 6;
                const branch = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.2, 0.4, branchLength, 6),
                    trunkMat
                );
                
                const angle = (i / branchCount) * Math.PI * 2 + Math.random() * 0.5;
                branch.position.set(
                    Math.cos(angle) * spread * 0.3,
                    levelY - 1,
                    Math.sin(angle) * spread * 0.3
                );
                branch.rotation.z = Math.PI / 2.5;
                branch.rotation.y = angle;
                group.add(branch);

                // Leaf clusters at branch ends
                const clusterCount = 2 + Math.floor(Math.random() * 2);
                for (let j = 0; j < clusterCount; j++) {
                    const cluster = new THREE.Mesh(
                        new THREE.SphereGeometry(2 + Math.random() * 1.5, 7, 6),
                        leafMat
                    );
                    cluster.position.set(
                        branch.position.x + Math.cos(angle) * (branchLength * 0.8 + j * 2),
                        levelY - 0.5,
                        branch.position.z + Math.sin(angle) * (branchLength * 0.8 + j * 2)
                    );
                    cluster.scale.y = 0.6;
                    cluster.castShadow = true;
                    group.add(cluster);
                }
            }
        }

        return group;
    }
}

window.BanyanGeometry = BanyanGeometry;