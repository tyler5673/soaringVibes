// js/trees/driftwood.js - Driftwood logs on beaches

class DriftwoodGeometry {
    static getGeometry(lod) {
        if (lod === 'far') {
            return DriftwoodGeometry.createFarLOD();
        } else if (lod === 'medium') {
            return DriftwoodGeometry.createMediumLOD();
        }
        return DriftwoodGeometry.createHighLOD();
    }

    static createFarLOD() {
        const log = new THREE.Mesh(
            new THREE.CylinderGeometry(0.3, 0.35, 3, 5),
            new THREE.MeshStandardMaterial({ color: 0x8D6E63 })
        );
        log.rotation.z = Math.PI / 2;
        return log;
    }

    static createMediumLOD() {
        const group = new THREE.Group();
        
        const logMat = new THREE.MeshStandardMaterial({ 
            color: 0x8D6E63,
            roughness: 0.9
        });
        
        const length = 2.5 + Math.random() * 3;
        const log = new THREE.Mesh(
            new THREE.CylinderGeometry(0.25, 0.3, length, 6),
            logMat
        );
        log.rotation.z = Math.PI / 2;
        log.rotation.y = Math.random() * Math.PI;
        log.castShadow = true;
        group.add(log);

        return group;
    }

    static createHighLOD() {
        const group = new THREE.Group();
        
        const logMat = new THREE.MeshStandardMaterial({ 
            color: 0x8D6E63,
            roughness: 0.95
        });
        
        // Weathered gray driftwood
        const driftwoodColor = 0x9E9E9E + (Math.random() - 0.5) * 0x202020;
        const driftwoodMat = new THREE.MeshStandardMaterial({ 
            color: driftwoodColor,
            roughness: 1.0
        });
        
        const length = 2 + Math.random() * 4;
        const radius = 0.2 + Math.random() * 0.2;
        
        // Main log with irregular shape
        const segments = 4 + Math.floor(Math.random() * 3);
        let currentPos = new THREE.Vector3(0, 0, 0);
        const baseRotation = Math.random() * Math.PI * 2;
        
        for (let i = 0; i < segments; i++) {
            const segLength = length / segments;
            const segRadius = radius * (1 - (i / segments) * 0.3); // Taper slightly
            
            const segment = new THREE.Mesh(
                new THREE.CylinderGeometry(segRadius * 0.8, segRadius, segLength, 6),
                driftwoodMat
            );
            
            const angle = baseRotation + (Math.random() - 0.5) * 0.3;
            segment.rotation.z = Math.PI / 2;
            segment.rotation.y = angle;
            
            // Add some waviness to the log
            const waviness = Math.sin(i * 0.8) * 0.3;
            segment.position.set(
                currentPos.x + Math.cos(angle) * (i * segLength * 0.7),
                currentPos.y + waviness * 0.1,
                currentPos.z + Math.sin(angle) * (i * segLength * 0.7)
            );
            
            segment.castShadow = true;
            group.add(segment);
            currentPos = segment.position.clone();
        }

        // Add knots/branch stubs
        const knotCount = Math.floor(Math.random() * 4);
        for (let k = 0; k < knotCount; k++) {
            const knot = new THREE.Mesh(
                new THREE.SphereGeometry(radius * 0.6, 5, 4),
                driftwoodMat
            );
            knot.position.set(
                (Math.random() - 0.5) * length * 0.7,
                radius * 0.5,
                (Math.random() - 0.5) * length * 0.7
            );
            knot.scale.y = 0.6;
            knot.castShadow = true;
            group.add(knot);
        }

        // Partially buried in sand
        group.position.y = radius * 0.4;
        
        return group;
    }
}

window.DriftwoodGeometry = DriftwoodGeometry;