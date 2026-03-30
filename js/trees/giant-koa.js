// js/trees/giant-koa.js - Realistic Giant Koa tree geometry
// Acacia koa: 100+ ft (30m+) tall, massive spreading crown, 3-5+ ft trunk diameter

class GiantKoaGeometry {
    static getGeometry(lod) {
        if (lod === 'far') {
            return GiantKoaGeometry.createFarLOD();
        } else if (lod === 'medium') {
            return GiantKoaGeometry.createMediumLOD();
        }
        return GiantKoaGeometry.createHighLOD();
    }

    static createFarLOD() {
        const group = new THREE.Group();
        // Massive silhouette
        const canopy = new THREE.Mesh(
            new THREE.SphereGeometry(16, 6, 4),
            new THREE.MeshStandardMaterial({ color: 0x1B5E20 })
        );
        canopy.position.y = 30;
        group.add(canopy);
        return group;
    }

    static createMediumLOD() {
        const group = new THREE.Group();
        
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4E342E });
        const canopyMat = new THREE.MeshStandardMaterial({ color: 0x1B5E20 });

        // Massive trunk: 35m tall, 1m+ diameter
        const trunkHeight = 35;
        const trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(0.5, 1.2, trunkHeight, 10),
            trunkMat
        );
        trunk.position.y = trunkHeight / 2;
        trunk.castShadow = true;
        group.add(trunk);

        // Huge crown - 60-80 ft spread
        const canopy = new THREE.Mesh(
            new THREE.SphereGeometry(14, 12, 8),
            canopyMat
        );
        canopy.position.y = 32;
        canopy.scale.y = 0.65;
        canopy.castShadow = true;
        group.add(canopy);

        return group;
    }

    static createHighLOD() {
        const group = new THREE.Group();
        
        // Giant koa - old growth specimens
        const trunkHeight = 30 + Math.random() * 12; // 30-42m (100-140ft)
        const baseRadius = 0.7 + Math.random() * 0.5; // 4-7 ft diameter
        const topRadius = 0.3 + Math.random() * 0.2;
        
        const trunkMat = new THREE.MeshStandardMaterial({ 
            color: 0x4E342E,
            roughness: 0.9
        });
        
        // Silver-green phyllodes
        const leafMat = new THREE.MeshStandardMaterial({ 
            color: 0x8FBC8F,
            roughness: 0.6
        });

        // Massive main trunk
        const trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(topRadius, baseRadius, trunkHeight, 12),
            trunkMat
        );
        trunk.position.y = trunkHeight / 2;
        trunk.rotation.z = (Math.random() - 0.5) * 0.03;
        trunk.castShadow = true;
        group.add(trunk);

        // Major spreading branches - ancient koa trees have massive horizontal branches
        const majorBranchCount = 8 + Math.floor(Math.random() * 4);
        
        for (let i = 0; i < majorBranchCount; i++) {
            const branchLength = 10 + Math.random() * 8; // 10-18m long branches!
            const branchRadius = 0.25 + (majorBranchCount - i) * 0.05;
            
            const branch = new THREE.Mesh(
                new THREE.CylinderGeometry(branchRadius * 0.6, branchRadius, branchLength, 10),
                trunkMat
            );
            
            const angle = (i / majorBranchCount) * Math.PI * 2 + Math.random() * 0.6;
            const height = trunkHeight * (0.5 + (i / majorBranchCount) * 0.25);
            
            // Nearly horizontal branches
            branch.position.set(
                Math.cos(angle) * (baseRadius * 0.9),
                height,
                Math.sin(angle) * (baseRadius * 0.9)
            );
            branch.rotation.z = Math.PI / 2.1 + Math.random() * 0.15;
            branch.rotation.y = angle;
            branch.castShadow = true;
            group.add(branch);

            // Sub-branches with phyllode clusters
            const subBranchCount = 3 + Math.floor(Math.random() * 3);
            for (let j = 0; j < subBranchCount; j++) {
                const subLength = 3 + Math.random() * 3;
                const subBranch = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.1, 0.18, subLength, 8),
                    trunkMat
                );
                
                const subAngle = angle + (Math.random() - 0.5) * 0.4;
                const subHeight = height + (Math.random() - 0.5) * 1.5;
                
                subBranch.position.set(
                    branch.position.x + Math.cos(angle) * (branchLength * 0.5 + j * 3),
                    subHeight,
                    branch.position.z + Math.sin(angle) * (branchLength * 0.5 + j * 3)
                );
                subBranch.rotation.z = Math.PI / 2.5 + (Math.random() - 0.5) * 0.3;
                subBranch.rotation.y = subAngle;
                group.add(subBranch);

                // Large phyllode clusters - characteristic sickle shape
                const clusterCount = 4 + Math.floor(Math.random() * 3);
                for (let k = 0; k < clusterCount; k++) {
                    const clusterSize = 3 + Math.random() * 2;
                    const leaves = new THREE.Mesh(
                        new THREE.SphereGeometry(clusterSize, 8, 6),
                        leafMat
                    );
                    
                    leaves.position.set(
                        subBranch.position.x + Math.cos(subAngle) * (subLength * 0.8 + k * 2),
                        subHeight - 0.5,
                        subBranch.position.z + Math.sin(subAngle) * (subLength * 0.8 + k * 2)
                    );
                    // Sickle-shaped: elongated
                    leaves.scale.set(1, 0.55, 1.6);
                    leaves.rotation.y = subAngle;
                    leaves.castShadow = true;
                    group.add(leaves);
                }
            }
        }

        // Massive central crown
        const crownRadius = 12 + Math.random() * 6;
        const crown = new THREE.Mesh(
            new THREE.SphereGeometry(crownRadius, 12, 8),
            leafMat
        );
        crown.position.y = trunkHeight - 4;
        crown.scale.y = 0.55;
        crown.castShadow = true;
        group.add(crown);

        return group;
    }
}

window.GiantKoaGeometry = GiantKoaGeometry;