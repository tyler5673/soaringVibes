// js/trees/ti-plant.js - Realistic Ti Plant (Cordyline fruticosa) geometry
// 3-10 ft (1-3m) tall, clumping stems with colorful leaves

class TiPlantGeometry {
    static getGeometry(lod) {
        if (lod === 'far') {
            return TiPlantGeometry.createFarLOD();
        } else if (lod === 'medium') {
            return TiPlantGeometry.createMediumLOD();
        }
        return TiPlantGeometry.createHighLOD();
    }

    static createFarLOD() {
        const group = new THREE.Group();
        const plant = new THREE.Mesh(
            new THREE.ConeGeometry(0.4, 1.5, 6),
            new THREE.MeshStandardMaterial({ color: 0x8B0000 })
        );
        plant.position.y = 0.75;
        group.add(plant);
        return group;
    }

    static createMediumLOD() {
        const group = new THREE.Group();
        const leafMat = new THREE.MeshStandardMaterial({ color: 0x8B0000 });

        const bush = new THREE.Mesh(
            new THREE.DodecahedronGeometry(0.5, 0),
            leafMat
        );
        bush.position.y = 0.8;
        bush.scale.y = 0.9;
        bush.castShadow = true;
        group.add(bush);

        return group;
    }

    static createHighLOD() {
        const group = new THREE.Group();
        
        // Ti plant colors: green, red, purple varieties
        const colors = [
            0x8B0000, // Red
            0x800080, // Purple
            0x228B22, // Green
            0xFF6347, // Orange-red
            0x4B0082  // Indigo
        ];
        const mainColor = colors[Math.floor(Math.random() * colors.length)];
        
        const stemMat = new THREE.MeshStandardMaterial({ color: 0x4E342E });
        const leafMat = new THREE.MeshStandardMaterial({ 
            color: mainColor,
            roughness: 0.4
        });

        // Multiple stems in a clump (ti plants grow in clumps)
        const stemCount = 2 + Math.floor(Math.random() * 4);
        
        for (let s = 0; s < stemCount; s++) {
            const stemHeight = 1.5 + Math.random() * 1.5; // 1.5-3m tall
            const stemRadius = 0.04 + Math.random() * 0.02;
            
            const stem = new THREE.Mesh(
                new THREE.CylinderGeometry(stemRadius, stemRadius * 1.2, stemHeight, 6),
                stemMat
            );
            stem.position.set(
                (Math.random() - 0.5) * 0.5,
                stemHeight / 2,
                (Math.random() - 0.5) * 0.5
            );
            stem.rotation.z = (Math.random() - 0.5) * 0.15;
            stem.castShadow = true;
            group.add(stem);

            // Leaf cluster at top - ti leaves are long, elliptical, 12-24 inches
            const leafCount = 6 + Math.floor(Math.random() * 6);
            for (let i = 0; i < leafCount; i++) {
                const leafLength = 0.6 + Math.random() * 0.5; // 0.6-1.1m
                const leaf = new THREE.Mesh(
                    new THREE.ConeGeometry(0.12, leafLength, 4),
                    leafMat
                );
                
                const angle = (i / leafCount) * Math.PI * 2 + Math.random() * 0.6;
                const tilt = 0.25 + Math.random() * 0.35;
                
                leaf.position.set(
                    stem.position.x + Math.cos(angle) * 0.15,
                    stemHeight - 0.2,
                    stem.position.z + Math.sin(angle) * 0.15
                );
                leaf.rotation.x = tilt;
                leaf.rotation.y = angle;
                leaf.scale.z = 0.25; // Flatten to make leaf-like
                leaf.castShadow = true;
                group.add(leaf);
            }
        }

        return group;
    }
}

window.TiPlantGeometry = TiPlantGeometry;