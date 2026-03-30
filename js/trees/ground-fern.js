// js/trees/ground-fern.js - Realistic Hawaiian ground ferns
// Multiple species: 1-3 ft (0.3-1m) tall, spreading fronds

class GroundFernGeometry {
    static getGeometry(lod) {
        if (lod === 'far') {
            return GroundFernGeometry.createFarLOD();
        } else if (lod === 'medium') {
            return GroundFernGeometry.createMediumLOD();
        }
        return GroundFernGeometry.createHighLOD();
    }

    static createFarLOD() {
        const fern = new THREE.Mesh(
            new THREE.ConeGeometry(0.25, 0.6, 5),
            new THREE.MeshStandardMaterial({ color: 0x4CAF50 })
        );
        fern.position.y = 0.3;
        return fern;
    }

    static createMediumLOD() {
        const group = new THREE.Group();
        const frondMat = new THREE.MeshStandardMaterial({ color: 0x4CAF50 });

        // Multiple fronds radiating
        const frondCount = 5 + Math.floor(Math.random() * 4);
        for (let i = 0; i < frondCount; i++) {
            const frond = new THREE.Mesh(
                new THREE.ConeGeometry(0.05, 0.5, 3),
                frondMat
            );
            
            const angle = (i / frondCount) * Math.PI * 2;
            frond.position.set(
                Math.cos(angle) * 0.15,
                0.25,
                Math.sin(angle) * 0.15
            );
            frond.rotation.x = 0.35;
            frond.rotation.y = angle;
            group.add(frond);
        }

        return group;
    }

    static createHighLOD() {
        const group = new THREE.Group();
        
        // Various Hawaiian fern species with different frond shapes
        const fernTypes = [
            { name: 'sword', color: 0x4CAF50, length: 0.5, spread: 0.4, count: 8 },
            { name: 'maidenhair', color: 0x66BB6A, length: 0.35, spread: 0.3, count: 12 },
            { name: 'hapuu', color: 0x388E3C, length: 0.8, spread: 0.6, count: 6 },
            { name: 'palapalai', color: 0x81C784, length: 0.4, spread: 0.35, count: 10 }
        ];
        
        const fernType = fernTypes[Math.floor(Math.random() * fernTypes.length)];
        const frondMat = new THREE.MeshStandardMaterial({ 
            color: fernType.color,
            roughness: 0.5
        });
        
        // Central rhizome
        const center = new THREE.Mesh(
            new THREE.SphereGeometry(0.06, 5, 4),
            new THREE.MeshStandardMaterial({ color: 0x3E2723 })
        );
        center.position.y = 0.04;
        group.add(center);

        // Fronds radiating from center
        for (let i = 0; i < fernType.count; i++) {
            const frondLength = fernType.length * (0.8 + Math.random() * 0.4);
            
            const frond = new THREE.Mesh(
                new THREE.ConeGeometry(0.04, frondLength, 3),
                frondMat
            );
            
            const angle = (i / fernType.count) * Math.PI * 2 + Math.random() * 0.5;
            const spread = fernType.spread;
            
            frond.position.set(
                Math.cos(angle) * 0.06,
                0.08,
                Math.sin(angle) * 0.06
            );
            frond.rotation.x = 0.35 + Math.random() * 0.25;
            frond.rotation.y = angle;
            frond.scale.z = 0.2; // Flatten
            frond.castShadow = true;
            group.add(frond);

            // Leaflets (pinnae) on larger fronds
            if (frondLength > 0.4) {
                const leafletCount = Math.floor(frondLength * 10);
                for (let j = 2; j < leafletCount; j++) {
                    const leaflet = new THREE.Mesh(
                        new THREE.ConeGeometry(0.025, 0.12, 3),
                        frondMat
                    );
                    const t = j / leafletCount;
                    leaflet.position.set(
                        frond.position.x + Math.cos(angle) * (t * spread * 0.7),
                        frond.position.y - t * 0.08,
                        frond.position.z + Math.sin(angle) * (t * spread * 0.7)
                    );
                    leaflet.rotation.x = frond.rotation.x + 0.15;
                    leaflet.rotation.y = angle;
                    leaflet.scale.z = 0.25;
                    group.add(leaflet);
                }
            }
        }

        // Fiddlehead (young coiled frond)
        if (Math.random() > 0.5) {
            const fiddlehead = new THREE.Mesh(
                new THREE.SphereGeometry(0.05, 5, 4),
                new THREE.MeshStandardMaterial({ color: 0x81C784 })
            );
            fiddlehead.position.y = 0.12;
            fiddlehead.scale.y = 1.2;
            group.add(fiddlehead);
        }

        return group;
    }
}

window.GroundFernGeometry = GroundFernGeometry;