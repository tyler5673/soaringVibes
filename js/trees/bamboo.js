// js/trees/bamboo.js - Realistic Bamboo grove geometry
// Bambusa vulgaris or similar: 30-50 ft (9-15m) tall, clumping growth habit

class BambooGeometry {
    static getGeometry(lod) {
        if (lod === 'far') {
            return BambooGeometry.createFarLOD();
        } else if (lod === 'medium') {
            return BambooGeometry.createMediumLOD();
        }
        return BambooGeometry.createHighLOD();
    }

    static createFarLOD() {
        const group = new THREE.Group();
        // Vertical green columns
        const culm = new THREE.Mesh(
            new THREE.CylinderGeometry(0.2, 0.25, 12, 6),
            new THREE.MeshStandardMaterial({ color: 0x7CB342 })
        );
        culm.position.y = 6;
        group.add(culm);
        return group;
    }

    static createMediumLOD() {
        const group = new THREE.Group();
        
        const culmMat = new THREE.MeshStandardMaterial({ color: 0x7CB342 });

        // Clump of 3-5 culms
        const culmCount = 3 + Math.floor(Math.random() * 3);
        for (let i = 0; i < culmCount; i++) {
            const height = 10 + Math.random() * 5; // 10-15m
            const culm = new THREE.Mesh(
                new THREE.CylinderGeometry(0.12, 0.15, height, 8),
                culmMat
            );
            culm.position.set(
                (Math.random() - 0.5) * 2,
                height / 2,
                (Math.random() - 0.5) * 2
            );
            culm.castShadow = true;
            group.add(culm);
        }

        return group;
    }

    static createHighLOD() {
        const group = new THREE.Group();
        
        // Bamboo dimensions
        const culmHeight = 9 + Math.random() * 6; // 9-15m (30-50ft)
        const culmRadius = 0.08 + Math.random() * 0.08; // 2-6 inch diameter
        
        const culmMat = new THREE.MeshStandardMaterial({ 
            color: 0x7CB342, // Bright green
            roughness: 0.3
        });
        
        const jointMat = new THREE.MeshStandardMaterial({ 
            color: 0x558B2F, // Darker green for joints
            roughness: 0.4
        });
        
        const leafMat = new THREE.MeshStandardMaterial({ 
            color: 0x8BC34A,
            roughness: 0.5
        });

        // Clumping bamboo - multiple culms from same base
        const culmCount = 5 + Math.floor(Math.random() * 8); // 5-12 culms per clump
        
        for (let c = 0; c < culmCount; c++) {
            const height = culmHeight * (0.7 + Math.random() * 0.4);
            const radius = culmRadius * (0.8 + Math.random() * 0.5);
            
            // Segmented culm with nodes/joints
            const segments = Math.floor(height / 1.5); // ~1.5m segments
            let currentY = 0;
            
            for (let s = 0; s < segments; s++) {
                const segHeight = 1.2 + Math.random() * 0.4;
                const segRadius = radius * (1 - (s / segments) * 0.15); // Slight taper
                
                const segment = new THREE.Mesh(
                    new THREE.CylinderGeometry(segRadius * 0.95, segRadius, segHeight, 10),
                    culmMat
                );
                segment.position.set(
                    (Math.random() - 0.5) * 1.5,
                    currentY + segHeight / 2,
                    (Math.random() - 0.5) * 1.5
                );
                segment.castShadow = true;
                group.add(segment);
                
                // Node/joint ring
                const joint = new THREE.Mesh(
                    new THREE.TorusGeometry(segRadius * 1.05, 0.02, 4, 12),
                    jointMat
                );
                joint.position.copy(segment.position);
                joint.position.y += segHeight / 2;
                joint.rotation.x = Math.PI / 2;
                group.add(joint);
                
                // Leaves on upper segments
                if (s > segments - 4) {
                    const leafCount = 4 + Math.floor(Math.random() * 4);
                    for (let l = 0; l < leafCount; l++) {
                        const leaf = new THREE.Mesh(
                            new THREE.ConeGeometry(0.08, 1.5, 4),
                            leafMat
                        );
                        
                        const angle = (l / leafCount) * Math.PI * 2 + Math.random() * 0.5;
                        leaf.position.set(
                            segment.position.x + Math.cos(angle) * (segRadius + 0.15),
                            segment.position.y + segHeight * 0.7,
                            segment.position.z + Math.sin(angle) * (segRadius + 0.15)
                        );
                        leaf.rotation.x = 0.3 + Math.random() * 0.4;
                        leaf.rotation.y = angle;
                        leaf.scale.z = 0.15;
                        leaf.castShadow = true;
                        group.add(leaf);
                    }
                }
                
                currentY += segHeight;
            }
        }

        return group;
    }
}

window.BambooGeometry = BambooGeometry;