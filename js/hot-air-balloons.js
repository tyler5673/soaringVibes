// js/hot-air-balloons.js - Realistic hot air balloon system

class HotAirBalloon {
    constructor(scene, position, options = {}) {
        this.scene = scene;
        this.position = position.clone();
        this.velocity = new THREE.Vector3();
        
        // Balloon properties
        this.burnerActive = false;
        this.burnerTimer = 0;
        this.burnerInterval = 3 + Math.random() * 4; // 3-7 seconds between burns
        this.burnerDuration = 0.5 + Math.random() * 1; // 0.5-1.5 second burn
        this.altitude = position.y;
        this.targetAltitude = position.y + (Math.random() - 0.5) * 50;
        this.driftSpeed = 5 + Math.random() * 8; // 5-13 m/s drift
        this.bobTimer = Math.random() * Math.PI * 2;
        
        // Color scheme options
        this.colorSchemes = [
            { // Rainbow stripes
                colors: [0xFF0000, 0xFF7F00, 0xFFFF00, 0x00FF00, 0x0000FF, 0x8B00FF],
                pattern: 'stripes'
            },
            { // Tropical sunset
                colors: [0xFF6B35, 0xF7931E, 0xFFD23F, 0xFF8C42, 0xFF6B6B],
                pattern: 'gradient'
            },
            { // Ocean waves
                colors: [0x0077BE, 0x0099CC, 0xFFFFFF, 0x4ECDC4, 0x0077BE],
                pattern: 'waves'
            },
            { // Hawaiian quilt pattern
                colors: [0xFF1744, 0x00E676, 0xFFEA00, 0x2979FF, 0xD500F9],
                pattern: 'geometric'
            },
            { // Floral
                colors: [0xFF1493, 0xFFB6C1, 0xFF69B4, 0xFFC0CB, 0xFF1493],
                pattern: 'floral'
            }
        ];
        
        this.colorScheme = options.colorScheme || 
            this.colorSchemes[Math.floor(Math.random() * this.colorSchemes.length)];
        
        this.scale = options.scale || (0.8 + Math.random() * 0.6);
        this.basketType = options.basketType || (Math.random() > 0.7 ? 'sport' : 'standard');
        
        this.mesh = null;
        this.flameMesh = null;
        this.flameLight = null;
        
        this.createBalloon();
    }
    
    createBalloon() {
        const group = new THREE.Group();
        
        // Create envelope (main balloon shape)
        this.createEnvelope(group);
        
        // Create basket
        this.createBasket(group);
        
        // Create ropes
        this.createRopes(group);
        
        // Add burner flame (initially hidden)
        this.createBurnerEffect(group);
        
        this.mesh = group;
        this.mesh.position.copy(this.position);
        this.mesh.scale.setScalar(this.scale);
        this.scene.add(this.mesh);
    }
    
    createEnvelope(group) {
        const envelopeHeight = 25;
        const maxRadius = 12;
        
        // Main balloon shape - classic teardrop
        const envelopeGeo = new THREE.SphereGeometry(maxRadius, 24, 24);
        envelopeGeo.scale(1, 1.4, 1); // Elongate vertically
        
        // Create multi-colored envelope with pattern
        const envelope = new THREE.Mesh(
            envelopeGeo,
            this.createEnvelopeMaterial()
        );
        envelope.position.y = envelopeHeight;
        envelope.castShadow = true;
        group.add(envelope);
        
        // Add envelope details - parachute valve at top
        const valveGeo = new THREE.CircleGeometry(2, 16);
        const valve = new THREE.Mesh(
            valveGeo,
            new THREE.MeshStandardMaterial({ color: 0x333333 })
        );
        valve.position.y = envelopeHeight + maxRadius * 1.4 - 0.5;
        valve.rotation.x = -Math.PI / 2;
        group.add(valve);
    }
    
    createEnvelopeMaterial() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        
        const { colors, pattern } = this.colorScheme;
        
        if (pattern === 'stripes') {
            // Vertical rainbow stripes
            const stripeWidth = canvas.width / colors.length;
            colors.forEach((color, i) => {
                ctx.fillStyle = '#' + color.toString(16).padStart(6, '0');
                ctx.fillRect(i * stripeWidth, 0, stripeWidth, canvas.height);
            });
        } else if (pattern === 'gradient') {
            // Horizontal gradient bands
            const bandHeight = canvas.height / colors.length;
            colors.forEach((color, i) => {
                ctx.fillStyle = '#' + color.toString(16).padStart(6, '0');
                ctx.fillRect(0, i * bandHeight, canvas.width, bandHeight);
            });
        } else if (pattern === 'waves') {
            // Wavy ocean pattern
            ctx.fillStyle = '#' + colors[0].toString(16).padStart(6, '0');
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            colors.slice(1).forEach((color, i) => {
                ctx.fillStyle = '#' + color.toString(16).padStart(6, '0');
                ctx.beginPath();
                for (let x = 0; x <= canvas.width; x += 10) {
                    const y = (i + 1) * (canvas.height / colors.length) + 
                             Math.sin(x * 0.02 + i) * 20;
                    if (x === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.lineTo(canvas.width, canvas.height);
                ctx.lineTo(0, canvas.height);
                ctx.fill();
            });
        } else if (pattern === 'geometric') {
            // Hawaiian quilt-inspired diamonds
            const diamondSize = 64;
            for (let y = 0; y < canvas.height; y += diamondSize) {
                for (let x = 0; x < canvas.width; x += diamondSize) {
                    const color = colors[Math.floor((x + y) / diamondSize) % colors.length];
                    ctx.fillStyle = '#' + color.toString(16).padStart(6, '0');
                    ctx.beginPath();
                    ctx.moveTo(x + diamondSize/2, y);
                    ctx.lineTo(x + diamondSize, y + diamondSize/2);
                    ctx.lineTo(x + diamondSize/2, y + diamondSize);
                    ctx.lineTo(x, y + diamondSize/2);
                    ctx.fill();
                }
            }
        } else {
            // Floral pattern - simple circles
            ctx.fillStyle = '#' + colors[0].toString(16).padStart(6, '0');
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            colors.slice(1).forEach((color, i) => {
                ctx.fillStyle = '#' + color.toString(16).padStart(6, '0');
                for (let j = 0; j < 8; j++) {
                    const x = Math.random() * canvas.width;
                    const y = Math.random() * canvas.height;
                    const r = 30 + Math.random() * 40;
                    ctx.beginPath();
                    ctx.arc(x, y, r, 0, Math.PI * 2);
                    ctx.fill();
                }
            });
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        
        return new THREE.MeshStandardMaterial({
            map: texture,
            side: THREE.DoubleSide,
            roughness: 0.8,
            metalness: 0.1
        });
    }
    
    createBasket(group) {
        const basketHeight = 3;
        const basketWidth = this.basketType === 'sport' ? 2.5 : 4;
        
        // Wicker texture simulation
        const basketGeo = new THREE.BoxGeometry(basketWidth, basketHeight, basketWidth);
        const basketMat = new THREE.MeshStandardMaterial({
            color: 0x8D6E63,
            roughness: 0.9
        });
        
        const basket = new THREE.Mesh(basketGeo, basketMat);
        basket.position.y = basketHeight / 2;
        basket.castShadow = true;
        group.add(basket);
        
        // Basket rim
        const rimGeo = new THREE.BoxGeometry(basketWidth + 0.2, 0.3, basketWidth + 0.2);
        const rim = new THREE.Mesh(rimGeo, new THREE.MeshStandardMaterial({ color: 0x5D4037 }));
        rim.position.y = basketHeight;
        group.add(rim);
        
        // Add simulated passengers (simple shapes visible from above)
        if (this.basketType !== 'sport') {
            for (let i = 0; i < 3; i++) {
                const passenger = new THREE.Mesh(
                    new THREE.SphereGeometry(0.4, 8, 8),
                    new THREE.MeshStandardMaterial({ color: 0xFFCC80 })
                );
                passenger.position.set(
                    (Math.random() - 0.5) * basketWidth * 0.6,
                    basketHeight + 0.4,
                    (Math.random() - 0.5) * basketWidth * 0.6
                );
                group.add(passenger);
            }
        }
    }
    
    createRopes(group) {
        // Rope geometry
        const ropeGeo = new THREE.CylinderGeometry(0.03, 0.03, 1, 4);
        const ropeMat = new THREE.MeshStandardMaterial({ color: 0x5D4037 });
        
        // Connect basket corners to envelope
        const basketWidth = this.basketType === 'sport' ? 2.5 : 4;
        const corners = [
            { x: -basketWidth/2, z: -basketWidth/2 },
            { x: basketWidth/2, z: -basketWidth/2 },
            { x: basketWidth/2, z: basketWidth/2 },
            { x: -basketWidth/2, z: basketWidth/2 }
        ];
        
        corners.forEach((corner, i) => {
            const rope = new THREE.Mesh(ropeGeo, ropeMat);
            // Calculate length and position
            const ropeLength = 20;
            rope.geometry = new THREE.CylinderGeometry(0.03, 0.03, ropeLength, 4);
            rope.position.set(
                corner.x * 0.8,
                3 + ropeLength / 2,
                corner.z * 0.8
            );
            // Slight angle toward center
            rope.rotation.x = corner.z * 0.02;
            rope.rotation.z = -corner.x * 0.02;
            group.add(rope);
        });
    }
    
    createBurnerEffect(group) {
        // Flame mesh (initially hidden)
        const flameGeo = new THREE.ConeGeometry(0.5, 3, 8);
        const flameMat = new THREE.MeshBasicMaterial({
            color: 0xFF4500,
            transparent: true,
            opacity: 0
        });
        this.flameMesh = new THREE.Mesh(flameGeo, flameMat);
        this.flameMesh.position.y = 4;
        group.add(this.flameMesh);
        
        // Point light for flame glow
        this.flameLight = new THREE.PointLight(0xFF4500, 0, 15);
        this.flameLight.position.y = 5;
        group.add(this.flameLight);
    }
    
    update(delta, windDirection, windSpeed) {
        // Burner logic
        this.burnerTimer += delta;
        
        if (!this.burnerActive && this.burnerTimer >= this.burnerInterval) {
            // Start burn
            this.burnerActive = true;
            this.burnerTimer = 0;
        } else if (this.burnerActive && this.burnerTimer >= this.burnerDuration) {
            // Stop burn
            this.burnerActive = false;
            this.burnerTimer = 0;
            this.burnerInterval = 2 + Math.random() * 4; // New interval
        }
        
        // Update flame visual
        if (this.burnerActive) {
            if (this.flameMesh && this.flameMesh.material) {
                this.flameMesh.material.opacity = 0.6 + Math.random() * 0.3;
                this.flameMesh.scale.setScalar(0.8 + Math.random() * 0.4);
            }
            if (this.flameLight) {
                this.flameLight.intensity = 2 + Math.random();
            }
        } else {
            if (this.flameMesh && this.flameMesh.material) {
                this.flameMesh.material.opacity *= 0.9;
            }
            if (this.flameLight) {
                this.flameLight.intensity *= 0.9;
            }
        }
        
        // Bobbing motion
        this.bobTimer += delta * 0.5;
        this.mesh.position.y = this.position.y + Math.sin(this.bobTimer) * 2;
        
        // Wind drift
        this.mesh.position.x += windDirection.x * windSpeed * delta;
        this.mesh.position.z += windDirection.z * windSpeed * delta;
        
        // Slight rotation with drift
        this.mesh.rotation.y = Math.atan2(windDirection.x, windDirection.z) + 
                               Math.sin(this.bobTimer * 0.5) * 0.1;
        
        // Altitude control - slowly move toward target
        const altitudeDiff = this.targetAltitude - this.position.y;
        this.position.y += altitudeDiff * 0.1 * delta;
        
        // Occasionally change target altitude
        if (Math.random() < 0.01) {
            this.targetAltitude = this.altitude + (Math.random() - 0.5) * 100;
        }
    }
}

class HotAirBalloonSystem {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.balloons = [];
        
        // Spawning configuration
        this.maxBalloons = 15;
        this.spawnRadius = 8000;
        this.altitudeMin = 400;
        this.altitudeMax = 1200;
        
        // Draw distance and density (defaults to ~50% of cloud bounds which is 12000)
        this.maxDrawDist = 6000;
        this.densityMultiplier = 1.0;
        this.enabled = true;
        
        // Wind pattern (trade winds)
        this.windDirection = new THREE.Vector3(-0.8, 0, -0.2).normalize();
        this.windSpeed = 8; // m/s
        
        // Morning/evening flight times
        this.activeHours = { start: 6, end: 10, eveningStart: 17, eveningEnd: 20 };
        
        this.init();
    }
    
    init() {
        // Spawn initial balloons scattered around
        for (let i = 0; i < this.maxBalloons; i++) {
            this.spawnBalloon();
        }
    }
    
    spawnBalloon(nearCamera = false) {
        let position;
        
        if (nearCamera && this.camera) {
            // Spawn in front of camera
            const camPos = this.camera.position;
            const camDir = new THREE.Vector3();
            this.camera.getWorldDirection(camDir);
            
            const angle = (Math.random() - 0.5) * Math.PI * 0.8;
            const dist = 2000 + Math.random() * 3000;
            
            position = new THREE.Vector3(
                camPos.x + Math.cos(angle) * dist,
                this.altitudeMin + Math.random() * (this.altitudeMax - this.altitudeMin),
                camPos.z + Math.sin(angle) * dist
            );
        } else {
            // Random position
            const angle = Math.random() * Math.PI * 2;
            const dist = 2000 + Math.random() * this.spawnRadius;
            
            position = new THREE.Vector3(
                Math.cos(angle) * dist,
                this.altitudeMin + Math.random() * (this.altitudeMax - this.altitudeMin),
                Math.sin(angle) * dist
            );
        }
        
        const balloon = new HotAirBalloon(this.scene, position);
        this.balloons.push(balloon);
    }
    
    update(delta) {
        if (!this.enabled) {
            this.balloons.forEach(b => {
                if (b.mesh) b.mesh.visible = false;
            });
            return;
        }
        
        const effectiveMaxDist = this.maxDrawDist;
        
        // Update all balloons
        this.balloons.forEach((balloon, index) => {
            // Apply density multiplier - hide some balloons based on index
            if (this.densityMultiplier < 1.0) {
                const shouldShow = (index + 1) / this.balloons.length <= this.densityMultiplier;
                balloon.mesh.visible = shouldShow;
            } else {
                balloon.mesh.visible = true;
            }
            
            if (!balloon.mesh.visible) return;
            
            balloon.update(delta, this.windDirection, this.windSpeed);
            
            // Check if balloon is too far from camera
            if (this.camera) {
                const dist = balloon.mesh.position.distanceTo(this.camera.position);
                if (dist > effectiveMaxDist) {
                    // Reposition near camera
                    balloon.mesh.position.copy(this.getRespawnPosition());
                }
            }
        });
        
        // Maintain balloon count based on density multiplier
        const targetCount = Math.floor(this.maxBalloons * this.densityMultiplier);
        if (this.balloons.length < targetCount && Math.random() < 0.02) {
            this.spawnBalloon(true);
        }
    }
    
    getRespawnPosition() {
        if (!this.camera) {
            return new THREE.Vector3(0, 600, 0);
        }
        
        const camPos = this.camera.position;
        const angle = Math.random() * Math.PI * 2;
        const dist = 2000 + Math.random() * 2000;
        
        return new THREE.Vector3(
            camPos.x + Math.cos(angle) * dist,
            this.altitudeMin + Math.random() * (this.altitudeMax - this.altitudeMin),
            camPos.z + Math.sin(angle) * dist
        );
    }
    
    getStats() {
        const activeBurners = this.balloons.filter(b => b.burnerActive).length;
        return {
            total: this.balloons.length,
            activeBurners: activeBurners,
            averageAltitude: this.balloons.reduce((sum, b) => sum + b.position.y, 0) / this.balloons.length
        };
    }
}

window.HotAirBalloon = HotAirBalloon;
window.HotAirBalloonSystem = HotAirBalloonSystem;