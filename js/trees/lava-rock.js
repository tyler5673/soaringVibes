// js/trees/lava-rock.js - Lava rocks and boulders

class LavaRockGeometry {
    static getGeometry(lod) {
        if (lod === 'far') {
            return LavaRockGeometry.createFarLOD();
        } else if (lod === 'medium') {
            return LavaRockGeometry.createMediumLOD();
        }
        return LavaRockGeometry.createHighLOD();
    }

    static createFarLOD() {
        const rock = new THREE.Mesh(
            new THREE.DodecahedronGeometry(0.6, 0),
            new THREE.MeshStandardMaterial({ color: 0x3E2723 })
        );
        rock.position.y = 0.3;
        return rock;
    }

    static createMediumLOD() {
        const group = new THREE.Group();
        
        const rockMat = new THREE.MeshStandardMaterial({ 
            color: 0x3E2723,
            roughness: 0.95,
            flatShading: true
        });
        
        const size = 0.5 + Math.random() * 0.8;
        const rock = new THREE.Mesh(
            new THREE.DodecahedronGeometry(size, 0),
            rockMat
        );
        rock.position.y = size * 0.6;
        rock.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
        );
        rock.castShadow = true;
        group.add(rock);

        return group;
    }

    static createHighLOD() {
        const group = new THREE.Group();
        
        // Pāhoehoe (smooth) or A'a (rough jagged) lava
        const isAa = Math.random() > 0.5;
        
        const pahoehoeColor = 0x212121 + Math.floor(Math.random() * 0x202020);
        const aaColor = 0x1a1a1a + Math.floor(Math.random() * 0x151515);
        
        const rockMat = new THREE.MeshStandardMaterial({ 
            color: isAa ? aaColor : pahoehoeColor,
            roughness: 0.95,
            metalness: 0.1,
            flatShading: true
        });
        
        const baseSize = 0.4 + Math.random() * 1.0;
        
        if (isAa) {
            // A'a - rough, jagged, spiny lava
            const clumpCount = 3 + Math.floor(Math.random() * 5);
            
            for (let i = 0; i < clumpCount; i++) {
                const size = baseSize * (0.5 + Math.random() * 0.8);
                const rock = new THREE.Mesh(
                    new THREE.DodecahedronGeometry(size, 0),
                    rockMat
                );
                
                // Irregular jagged positioning
                const angle = Math.random() * Math.PI * 2;
                const dist = Math.random() * baseSize * 0.8;
                
                rock.position.set(
                    Math.cos(angle) * dist,
                    size * 0.4 + Math.random() * 0.3,
                    Math.sin(angle) * dist
                );
                
                rock.rotation.set(
                    Math.random() * Math.PI,
                    Math.random() * Math.PI,
                    Math.random() * Math.PI
                );
                
                rock.scale.set(
                    1 + Math.random() * 0.4,
                    0.6 + Math.random() * 0.5,
                    1 + Math.random() * 0.4
                );
                
                rock.castShadow = true;
                group.add(rock);
            }
        } else {
            // Pāhoehoe - smooth, ropey, billowy lava
            const mainSize = baseSize * (0.8 + Math.random() * 0.6);
            const mainRock = new THREE.Mesh(
                new THREE.IcosahedronGeometry(mainSize, 1),
                rockMat
            );
            
            mainRock.position.y = mainSize * 0.5;
            mainRock.scale.y = 0.6 + Math.random() * 0.3;
            mainRock.castShadow = true;
            group.add(mainRock);
            
            // Add smaller satellite lumps (pāhoehoe characteristic)
            const lumpCount = 2 + Math.floor(Math.random() * 4);
            for (let i = 0; i < lumpCount; i++) {
                const lumpSize = mainSize * (0.3 + Math.random() * 0.4);
                const lump = new THREE.Mesh(
                    new THREE.IcosahedronGeometry(lumpSize, 0),
                    rockMat
                );
                
                const angle = Math.random() * Math.PI * 2;
                const dist = mainSize * 0.7;
                
                lump.position.set(
                    Math.cos(angle) * dist,
                    lumpSize * 0.4,
                    Math.sin(angle) * dist
                );
                lump.scale.y = 0.5 + Math.random() * 0.3;
                lump.castShadow = true;
                group.add(lump);
            }
        }

        return group;
    }
}

window.LavaRockGeometry = LavaRockGeometry;