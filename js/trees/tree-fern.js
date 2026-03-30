// js/trees/tree-fern.js - Realistic Hawaiian Tree Fern (Hāpu'u) geometry
// Cibotium species: Up to 40 ft (12m) tall, 6-12 inch trunk diameter

class TreeFernGeometry {
    static getGeometry(lod) {
        if (lod === 'far') {
            return TreeFernGeometry.createFarLOD();
        } else if (lod === 'medium') {
            return TreeFernGeometry.createMediumLOD();
        }
        return TreeFernGeometry.createHighLOD();
    }

    static createFarLOD() {
        const group = new THREE.Group();
        // Distinctive silhouette - trunk + spreading crown
        const trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(0.25, 0.3, 6, 6),
            new THREE.MeshStandardMaterial({ color: 0x3E2723 })
        );
        trunk.position.y = 3;
        
        const crown = new THREE.Mesh(
            new THREE.ConeGeometry(3, 3, 8),
            new THREE.MeshStandardMaterial({ color: 0x4CAF50 })
        );
        crown.position.y = 6;
        
        group.add(trunk, crown);
        return group;
    }

    static createMediumLOD() {
        const group = new THREE.Group();
        
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3E2723 });
        const frondMat = new THREE.MeshStandardMaterial({ color: 0x4CAF50 });

        // Height: 3-8m typically
        const trunkHeight = 5 + Math.random() * 3;
        const trunkRadius = 0.15 + Math.random() * 0.1; // 6-12 inch diameter
        
        const trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(trunkRadius, trunkRadius * 1.1, trunkHeight, 8),
            trunkMat
        );
        trunk.position.y = trunkHeight / 2;
        trunk.castShadow = true;
        group.add(trunk);

        // Crown of fronds
        const crown = new THREE.Mesh(
            new THREE.SphereGeometry(2.5, 8, 6),
            frondMat
        );
        crown.position.y = trunkHeight + 1;
        crown.castShadow = true;
        group.add(crown);

        return group;
    }

    static createHighLOD() {
        const group = new THREE.Group();
        
        // Realistic Hāpu'u dimensions
        const trunkHeight = 4 + Math.random() * 6; // 4-10m (can reach 12m)
        const trunkRadius = 0.12 + Math.random() * 0.12; // 6-12 inch diameter
        
        // Rough fibrous trunk with leaf scars
        const trunkMat = new THREE.MeshStandardMaterial({ 
            color: 0x3E2723, // Dark brown
            roughness: 0.95
        });
        
        // Fronds - bluish-green with silvery undersides
        const frondMat = new THREE.MeshStandardMaterial({ 
            color: 0x5C8D5C, // Slightly bluish green
            roughness: 0.6
        });
        
        // Pulu (golden fuzzy material on fiddleheads) color
        const puluMat = new THREE.MeshStandardMaterial({ 
            color: 0xD4AF37, // Golden
            roughness: 0.8
        });

        // Main trunk with texture scars
        const trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(trunkRadius, trunkRadius * 1.15, trunkHeight, 10),
            trunkMat
        );
        trunk.position.y = trunkHeight / 2;
        trunk.castShadow = true;
        group.add(trunk);

        // Leaf scar rings
        const scarCount = Math.floor(trunkHeight / 0.4);
        for (let i = 0; i < scarCount; i++) {
            const scar = new THREE.Mesh(
                new THREE.TorusGeometry(trunkRadius + 0.03, 0.02, 4, 12),
                trunkMat
            );
            scar.position.y = 0.3 + i * 0.4;
            scar.rotation.x = Math.PI / 2;
            scar.scale.set(1, 1, 0.5);
            group.add(scar);
        }

        // Crown of arching fronds - 15-25 fronds
        const frondCount = 15 + Math.floor(Math.random() * 12);
        
        for (let i = 0; i < frondCount; i++) {
            const frondLength = 2 + Math.random() * 1.5; // 2-3.5m fronds
            const segments = 5;
            
            const angle = (i / frondCount) * Math.PI * 2 + Math.random() * 0.5;
            const baseTilt = 0.5 + Math.random() * 0.3; // Spread outward
            
            // Create segmented frond for arching effect
            let lastPos = new THREE.Vector3(
                Math.cos(angle) * 0.2,
                trunkHeight,
                Math.sin(angle) * 0.2
            );
            
            for (let s = 0; s < segments; s++) {
                const segLength = frondLength / segments;
                const taper = 1 - (s / segments) * 0.6;
                
                const segment = new THREE.Mesh(
                    new THREE.ConeGeometry(0.1 * taper, segLength, 4),
                    frondMat
                );
                
                const arc = s / segments;
                const segAngle = angle;
                const segTilt = baseTilt + arc * 0.5; // Arch downward
                
                segment.position.set(
                    lastPos.x + Math.cos(segAngle) * (s * 0.3),
                    lastPos.y - segLength * segTilt * 0.2,
                    lastPos.z + Math.sin(segAngle) * (s * 0.3)
                );
                segment.rotation.x = segTilt;
                segment.rotation.y = segAngle;
                segment.rotation.z = (Math.random() - 0.5) * 0.2;
                segment.castShadow = true;
                group.add(segment);
                
                lastPos = segment.position.clone();
            }
        }

        // Fiddleheads (unfurling fronds) - characteristic golden spirals
        const fiddleheadCount = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < fiddleheadCount; i++) {
            // Create spiral shape
            const spiralPoints = [];
            const spiralHeight = 0.4 + Math.random() * 0.3;
            
            for (let j = 0; j < 8; j++) {
                const t = j / 7;
                const spiralAngle = t * Math.PI * 2;
                spiralPoints.push({
                    x: Math.cos(spiralAngle) * (0.05 + t * 0.08),
                    y: trunkHeight + 0.2 + t * spiralHeight,
                    z: Math.sin(spiralAngle) * (0.05 + t * 0.08)
                });
            }
            
            // Create spiral from spheres
            spiralPoints.forEach((point, idx) => {
                const size = 0.08 - (idx / 8) * 0.04;
                const coil = new THREE.Mesh(
                    new THREE.SphereGeometry(size, 6, 5),
                    puluMat
                );
                coil.position.set(point.x, point.y, point.z);
                group.add(coil);
            });
        }

        return group;
    }
}

window.TreeFernGeometry = TreeFernGeometry;