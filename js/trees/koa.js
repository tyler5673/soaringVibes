// js/trees/koa.js - Realistic Koa tree geometry
// Acacia koa: 100+ ft (30m) tall, 3+ ft (1m) trunk diameter, massive crown

class KoaGeometry {
    static getGeometry(lod) {
        if (lod === 'far') {
            return KoaGeometry.createFarLOD();
        } else if (lod === 'medium') {
            return KoaGeometry.createMediumLOD();
        }
        return KoaGeometry.createHighLOD();
    }

    static createFarLOD() {
        // Simple billboard for far distances
        const group = new THREE.Group();
        const canopy = new THREE.Mesh(
            new THREE.SphereGeometry(12, 6, 4),
            new THREE.MeshStandardMaterial({ color: 0x1B5E20 })
        );
        canopy.position.y = 25;
        group.add(canopy);
        return group;
    }

    static createMediumLOD() {
        const group = new THREE.Group();
        
        // Bark color - gray-brown typical of mature koa
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5D4037 });
        // Silver-green phyllodes (flattened leaf stems)
        const canopyMat = new THREE.MeshStandardMaterial({ 
            color: 0x8FBC8F,
            roughness: 0.7
        });

        // Trunk: 3-4 feet diameter at base, tapering to top
        // Height: 25-35 meters (80-115 feet)
        const trunkHeight = 28;
        const baseRadius = 0.6; // ~4 feet diameter
        const topRadius = 0.25;
        
        const trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(topRadius, baseRadius, trunkHeight, 10),
            trunkMat
        );
        trunk.position.y = trunkHeight / 2;
        trunk.castShadow = true;
        group.add(trunk);

        // Massive spreading crown - 40-60 feet spread
        const crownY = trunkHeight - 2;
        const crownRadius = 10 + Math.random() * 5;
        
        const canopy = new THREE.Mesh(
            new THREE.SphereGeometry(crownRadius, 10, 8),
            canopyMat
        );
        canopy.position.y = crownY;
        canopy.scale.y = 0.7; // Flattened crown
        canopy.castShadow = true;
        group.add(canopy);

        return group;
    }

    static createHighLOD() {
        const group = new THREE.Group();
        
        // Realistic mature koa dimensions
        const trunkHeight = 25 + Math.random() * 10; // 25-35m (80-115ft)
        const baseRadius = 0.5 + Math.random() * 0.2; // 3-4.5 ft diameter
        const topRadius = 0.2 + Math.random() * 0.1;
        
        const trunkMat = new THREE.MeshStandardMaterial({ 
            color: 0x5D4037,
            roughness: 0.9
        });
        
        // Silver-green phyllodes - characteristic of koa
        const leafMat = new THREE.MeshStandardMaterial({ 
            color: 0x8FBC8F, // Dark sea green/silver
            roughness: 0.6
        });

        // Main trunk with slight curve
        const trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(topRadius, baseRadius, trunkHeight, 12),
            trunkMat
        );
        trunk.position.y = trunkHeight / 2;
        trunk.rotation.z = (Math.random() - 0.5) * 0.05;
        trunk.castShadow = true;
        group.add(trunk);

        // Major branches - koa has distinctive spreading horizontal branches
        const branchCount = 6 + Math.floor(Math.random() * 4);
        
        for (let i = 0; i < branchCount; i++) {
            const branchLength = 6 + Math.random() * 5;
            const branchRadius = 0.15 + (branchCount - i) * 0.03;
            
            const branch = new THREE.Mesh(
                new THREE.CylinderGeometry(branchRadius * 0.6, branchRadius, branchLength, 8),
                trunkMat
            );
            
            const angle = (i / branchCount) * Math.PI * 2 + Math.random() * 0.4;
            const height = trunkHeight * (0.55 + (i / branchCount) * 0.3);
            
            // Horizontal to slightly drooping branches
            branch.position.set(
                Math.cos(angle) * (baseRadius * 0.8),
                height,
                Math.sin(angle) * (baseRadius * 0.8)
            );
            branch.rotation.z = Math.PI / 2.2 + Math.random() * 0.2;
            branch.rotation.y = angle;
            branch.castShadow = true;
            group.add(branch);

            // Sickle-shaped phyllode clusters at branch ends
            const leafClusterCount = 3 + Math.floor(Math.random() * 3);
            for (let j = 0; j < leafClusterCount; j++) {
                const clusterSize = 1.5 + Math.random() * 1;
                const leaves = new THREE.Mesh(
                    new THREE.SphereGeometry(clusterSize, 8, 6),
                    leafMat
                );
                
                const t = j / leafClusterCount;
                leaves.position.set(
                    branch.position.x + Math.cos(angle) * (branchLength * 0.7 + j * 1.5),
                    height - 0.5 - j * 0.3,
                    branch.position.z + Math.sin(angle) * (branchLength * 0.7 + j * 1.5)
                );
                leaves.scale.set(1, 0.6, 1.5); // Elongated like sickle leaves
                leaves.rotation.y = angle + Math.random() * 0.5;
                leaves.castShadow = true;
                group.add(leaves);
            }
        }

        // Central crown mass
        const crownRadius = 8 + Math.random() * 4;
        const crown = new THREE.Mesh(
            new THREE.SphereGeometry(crownRadius, 10, 8),
            leafMat
        );
        crown.position.y = trunkHeight - 3;
        crown.scale.y = 0.6;
        crown.castShadow = true;
        group.add(crown);

        return group;
    }
}

window.KoaGeometry = KoaGeometry;