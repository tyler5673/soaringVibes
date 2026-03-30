// js/trees/beach-morning-glory.js - Pohuehue beach morning glory

class BeachMorningGloryGeometry {
    static getGeometry(lod) {
        if (lod === 'far') {
            return BeachMorningGloryGeometry.createFarLOD();
        } else if (lod === 'medium') {
            return BeachMorningGloryGeometry.createMediumLOD();
        }
        return BeachMorningGloryGeometry.createHighLOD();
    }

    static createFarLOD() {
        const vine = new THREE.Mesh(
            new THREE.SphereGeometry(0.25, 5, 4),
            new THREE.MeshStandardMaterial({ color: 0x4CAF50 })
        );
        vine.position.y = 0.15;
        return vine;
    }

    static createMediumLOD() {
        const group = new THREE.Group();
        const mat = new THREE.MeshStandardMaterial({ color: 0x4CAF50 });

        const mound = new THREE.Mesh(
            new THREE.SphereGeometry(0.3, 6, 4),
            mat
        );
        mound.position.y = 0.2;
        mound.scale.y = 0.5;
        mound.castShadow = true;
        group.add(mound);

        return group;
    }

    static createHighLOD() {
        const group = new THREE.Group();
        
        const vineMat = new THREE.MeshStandardMaterial({ color: 0x66BB6A });
        const flowerMat = new THREE.MeshStandardMaterial({ color: 0x9C27B0 }); // Purple morning glory

        // Vining stems spreading on sand
        const vineCount = 4 + Math.floor(Math.random() * 4);
        
        for (let v = 0; v < vineCount; v++) {
            const length = 1 + Math.random() * 1.5;
            const segments = 5 + Math.floor(Math.random() * 4);
            
            let lastPos = new THREE.Vector3(
                (Math.random() - 0.5) * 0.3,
                0.05,
                (Math.random() - 0.5) * 0.3
            );
            
            const baseAngle = Math.random() * Math.PI * 2;
            
            for (let s = 0; s < segments; s++) {
                const t = s / segments;
                const segLength = length / segments;
                
                const segment = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.015, 0.02, segLength, 4),
                    vineMat
                );
                
                const angle = baseAngle + Math.sin(s * 0.8) * 0.5;
                segment.position.set(
                    lastPos.x + Math.cos(angle) * segLength * 0.5,
                    0.05 + Math.sin(s * 0.5) * 0.03,
                    lastPos.z + Math.sin(angle) * segLength * 0.5
                );
                segment.rotation.y = angle;
                segment.rotation.z = Math.PI / 2;
                group.add(segment);
                
                // Heart-shaped leaves along vine
                const leafCount = 2;
                for (let l = 0; l < leafCount; l++) {
                    const leaf = new THREE.Mesh(
                        new THREE.ConeGeometry(0.06, 0.15, 3),
                        vineMat
                    );
                    
                    const leafAngle = angle + (Math.random() - 0.5) * 0.5;
                    leaf.position.set(
                        segment.position.x + Math.cos(leafAngle) * 0.1,
                        0.08,
                        segment.position.z + Math.sin(leafAngle) * 0.1
                    );
                    leaf.rotation.x = 0.2;
                    leaf.rotation.y = leafAngle;
                    leaf.scale.z = 0.4;
                    leaf.castShadow = true;
                    group.add(leaf);
                }
                
                lastPos = segment.position.clone();
                
                // Morning glory flowers
                if (s > segments * 0.4 && Math.random() > 0.6) {
                    const flower = new THREE.Mesh(
                        new THREE.SphereGeometry(0.08, 6, 4),
                        flowerMat
                    );
                    flower.position.copy(lastPos);
                    flower.position.y = 0.12;
                    flower.scale.set(1, 0.6, 1);
                    group.add(flower);
                    
                    // Trumpet shape
                    const trumpet = new THREE.Mesh(
                        new THREE.ConeGeometry(0.05, 0.15, 5),
                        new THREE.MeshStandardMaterial({ color: 0xE1BEE7 }) // Lighter center
                    );
                    trumpet.position.copy(lastPos);
                    trumpet.position.y = 0.18;
                    trumpet.rotation.x = -0.3;
                    group.add(trumpet);
                }
            }
        }

        return group;
    }
}

window.BeachMorningGloryGeometry = BeachMorningGloryGeometry;