// js/trees/coconut-palm.js - Realistic Coconut Palm geometry
// Cocos nucifera: 60-100 ft (18-30m) tall, 12-18 inch trunk, 20-25 ft crown spread

class CoconutPalmGeometry {
    static getGeometry(lod) {
        if (lod === 'far') {
            return CoconutPalmGeometry.createFarLOD();
        } else if (lod === 'medium') {
            return CoconutPalmGeometry.createMediumLOD();
        }
        return CoconutPalmGeometry.createHighLOD();
    }

    static createFarLOD() {
        const group = new THREE.Group();
        // Tall distinctive silhouette
        const canopy = new THREE.Mesh(
            new THREE.SphereGeometry(8, 6, 4),
            new THREE.MeshStandardMaterial({ color: 0x4CAF50 })
        );
        canopy.position.y = 25;
        group.add(canopy);
        return group;
    }

    static createMediumLOD() {
        const group = new THREE.Group();
        
        // Gray-brown trunk
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8D6E63 });
        const frondMat = new THREE.MeshStandardMaterial({ color: 0x4CAF50 });

        // Height: 18-25m
        const trunkHeight = 20;
        const trunkRadius = 0.25; // ~18 inch diameter
        
        // Curved trunk typical of coconut palms
        const trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(trunkRadius * 0.8, trunkRadius, trunkHeight, 8),
            trunkMat
        );
        trunk.position.y = trunkHeight / 2;
        trunk.rotation.z = 0.08;
        trunk.castShadow = true;
        group.add(trunk);

        // Crown at top
        const crown = new THREE.Mesh(
            new THREE.ConeGeometry(6, 4, 8),
            frondMat
        );
        crown.position.set(-1.5, trunkHeight, 0);
        crown.castShadow = true;
        group.add(crown);

        return group;
    }

    static createHighLOD() {
        const group = new THREE.Group();
        
        // Realistic coconut palm dimensions
        const trunkHeight = 18 + Math.random() * 10; // 18-28m (60-90ft)
        const trunkRadius = 0.2 + Math.random() * 0.08; // 12-20 inch diameter
        const curve = 0.04 + Math.random() * 0.06; // Characteristic curve
        
        const trunkMat = new THREE.MeshStandardMaterial({ 
            color: 0x9E9E9E, // Light gray-brown
            roughness: 0.8
        });
        
        const frondMat = new THREE.MeshStandardMaterial({ 
            color: 0x4CAF50,
            roughness: 0.5
        });
        
        const coconutMat = new THREE.MeshStandardMaterial({ 
            color: 0x5D4037,
            roughness: 0.6
        });

        // Trunk with rings and curve
        const trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(trunkRadius * 0.8, trunkRadius, trunkHeight, 10),
            trunkMat
        );
        trunk.position.set(
            -trunkHeight * curve * 0.3,
            trunkHeight / 2,
            0
        );
        trunk.rotation.z = curve;
        trunk.castShadow = true;
        group.add(trunk);

        // Ring scars characteristic of palms
        const ringCount = Math.floor(trunkHeight / 0.6);
        for (let i = 0; i < ringCount; i++) {
            const ring = new THREE.Mesh(
                new THREE.TorusGeometry(trunkRadius + 0.02, 0.015, 3, 10),
                trunkMat
            );
            ring.position.set(
                -trunkHeight * curve * 0.3 - (i * 0.6) * Math.sin(curve),
                0.3 + i * 0.6,
                0
            );
            ring.rotation.x = Math.PI / 2;
            ring.rotation.y = curve;
            group.add(ring);
        }

        // Crown position
        const crownX = -trunkHeight * curve * 0.8;
        const crownY = trunkHeight * 0.95;

        // 30-40 arching fronds
        const frondCount = 28 + Math.floor(Math.random() * 12);
        
        for (let i = 0; i < frondCount; i++) {
            const frondLength = 4 + Math.random() * 2.5; // 4-6.5m fronds
            const segments = 6;
            
            const baseAngle = (i / frondCount) * Math.PI * 2 + Math.random() * 0.5;
            const droop = 0.25 + Math.random() * 0.15; // Arch downward
            
            // Create curved frond with segments
            let lastPos = new THREE.Vector3(crownX, crownY, 0);
            
            for (let s = 0; s < segments; s++) {
                const segLength = frondLength / segments;
                const taper = 1 - (s / segments) * 0.7;
                
                const segment = new THREE.Mesh(
                    new THREE.ConeGeometry(0.15 * taper, segLength, 3),
                    frondMat
                );
                
                const arc = s / segments;
                const segAngle = baseAngle + Math.sin(arc * Math.PI) * 0.1;
                const segDroop = droop + arc * 0.8;
                
                segment.position.set(
                    lastPos.x + Math.cos(segAngle) * (s * 0.8),
                    lastPos.y - segLength * segDroop * 0.4,
                    lastPos.z + Math.sin(segAngle) * (s * 0.8)
                );
                segment.rotation.x = segDroop;
                segment.rotation.y = segAngle;
                segment.rotation.z = (Math.random() - 0.5) * 0.15;
                segment.castShadow = true;
                group.add(segment);
                
                lastPos = segment.position.clone();
            }
        }

        // Coconuts in clusters
        const clusterCount = 2 + Math.floor(Math.random() * 3);
        for (let c = 0; c < clusterCount; c++) {
            const coconutsInCluster = 3 + Math.floor(Math.random() * 5);
            const clusterAngle = (c / clusterCount) * Math.PI * 2 + Math.random() * 0.5;
            
            for (let i = 0; i < coconutsInCluster; i++) {
                const coconut = new THREE.Mesh(
                    new THREE.SphereGeometry(0.22, 7, 6),
                    coconutMat
                );
                
                const angle = clusterAngle + (Math.random() - 0.5) * 0.4;
                const dist = 0.8 + Math.random() * 0.4;
                const height = crownY - 0.5 - Math.random() * 0.6;
                
                coconut.position.set(
                    crownX + Math.cos(angle) * dist,
                    height,
                    Math.sin(angle) * dist
                );
                coconut.scale.set(1, 1.15, 1); // Slight elongation
                coconut.rotation.z = Math.random() * Math.PI;
                coconut.castShadow = true;
                group.add(coconut);
            }
        }

        return group;
    }
}

window.CoconutPalmGeometry = CoconutPalmGeometry;