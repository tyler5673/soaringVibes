// js/animals/honeycreeper.js - Hawaiian Honeycreeper (Drepanidinae)
// Diverse family with curved nectar-feeding bills, vibrant colors
// Size: 10-20cm, wingspan 15-25cm

class Honeycreeper extends Animal {
    constructor(scene, initialPosition, forestCenter) {
        super(scene, initialPosition, {
            speed: 9,
            turnSpeed: 3.5,
            viewDistance: 300,
            updateDistance: 600
        });

        this.forestCenter = forestCenter;

        // Species variations: Apapane (red), I'iwi (red curved bill), 
        // Akekee (yellow), various green/gray species
        const species = [
            { name: 'Apapane', color: 0xFF1744, beakCurve: 0.2 },
            { name: 'Iiwi', color: 0xFF5722, beakCurve: 0.6 },  // Deeply curved
            { name: 'Akekee', color: 0xFFC107, beakCurve: 0.3 },
            { name: 'Kiwikiu', color: 0x4CAF50, beakCurve: 0.25 }
        ];
        this.species = species[Math.floor(Math.random() * species.length)];
    }

    createMesh() {
        const group = new THREE.Group();

        const bodyMat = new THREE.MeshStandardMaterial({ 
            color: this.species.color,
            roughness: 0.6
        });
        
        const wingMat = new THREE.MeshStandardMaterial({
            color: 0x2E7D32,
            roughness: 0.7
        });
        
        const beakMat = new THREE.MeshStandardMaterial({ 
            color: 0x212121,
            roughness: 0.5
        });

        // Small compact body - 10-20cm
        const bodyGeo = new THREE.SphereGeometry(0.06, 6, 5);
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.scale.set(1.4, 0.85, 0.85);
        group.add(body);

        // Wings - darker than body
        const wingGeo = new THREE.ConeGeometry(0.04, 0.12, 4);
        this.wingL = new THREE.Mesh(wingGeo, wingMat);
        this.wingL.position.set(0.04, 0.01, 0.06);
        this.wingL.rotation.x = 0.3;
        this.wingL.rotation.y = 0.5;
        this.wingL.scale.z = 0.2;
        group.add(this.wingL);

        this.wingR = new THREE.Mesh(wingGeo, wingMat);
        this.wingR.position.set(0.04, 0.01, -0.06);
        this.wingR.rotation.x = 0.3;
        this.wingR.rotation.y = -0.5;
        this.wingR.scale.z = 0.2;
        group.add(this.wingR);

        // Distinctive curved beak - specialized for nectar feeding!
        // Curve varies by species (I'iwi = deep curve, Apapane = slight curve)
        const beakLength = 0.06 + this.species.beakCurve * 0.04;
        const beakSegments = 3;
        let lastPos = new THREE.Vector3(0.09, 0, 0);
        
        for (let i = 0; i < beakSegments; i++) {
            const t = i / beakSegments;
            const segLength = beakLength / beakSegments;
            const curveAmount = this.species.beakCurve * 0.8;
            
            const segment = new THREE.Mesh(
                new THREE.ConeGeometry(0.008 * (1 - t * 0.3), segLength, 5),
                beakMat
            );
            
            const curve = curveAmount * t;
            segment.position.set(
                lastPos.x + t * segLength * 0.8,
                lastPos.y - curve * 0.04,
                lastPos.z
            );
            segment.rotation.z = -curve - 0.2;
            
            group.add(segment);
            lastPos = segment.position.clone();
        }

        // Tail feathers
        const tailGeo = new THREE.ConeGeometry(0.02, 0.08, 4);
        const tail = new THREE.Mesh(tailGeo, bodyMat);
        tail.position.set(-0.07, 0, 0);
        tail.rotation.z = 0.5;
        tail.scale.z = 0.2;
        group.add(tail);

        this.mesh = group;
        this.scene.add(this.mesh);
    }

    chooseNewState() {
        const states = ['perch', 'hop', 'fly'];
        this.state = states[Math.floor(Math.random() * states.length)];

        if (this.state === 'perch') {
            this.stateTimer = 3 + Math.random() * 5;
            this.velocity.set(0, 0, 0);
        } else if (this.state === 'hop') {
            this.stateTimer = 1 + Math.random() * 2;
            this.velocity.set(
                (Math.random() - 0.5) * 3,
                2,
                (Math.random() - 0.5) * 3
            );
        } else {
            this.stateTimer = 2 + Math.random() * 3;
            const angle = Math.random() * Math.PI * 2;
            const dist = 5 + Math.random() * 10;
            this.targetPosition = new THREE.Vector3(
                this.position.x + Math.cos(angle) * dist,
                this.position.y + (Math.random() - 0.5) * 3,
                this.position.z + Math.sin(angle) * dist
            );
        }
    }

    updateAnimation(delta) {
        const time = this.animationTime;

        if (this.state === 'fly') {
            const flap = Math.sin(time * 20) * 0.5;
            this.wingL.rotation.z = flap;
            this.wingR.rotation.z = -flap;
        } else if (this.state === 'hop') {
            const flap = Math.sin(time * 15) * 0.3;
            this.wingL.rotation.z = flap;
            this.wingR.rotation.z = -flap;
        } else {
            this.wingL.rotation.z = 0;
            this.wingR.rotation.z = 0;
        }
    }

    updateMovement(delta) {
        if (this.state === 'fly' && this.targetPosition) {
            this.moveToward(this.targetPosition, this.config.speed);
            this.lookAt(this.targetPosition);

            if (this.position.distanceTo(this.targetPosition) < 1) {
                this.targetPosition = null;
                this.state = 'perch';
            }
        } else if (this.state === 'hop') {
            this.velocity.y -= 9.8 * delta;
            if (this.position.y < this.forestCenter.y + 8) {
                this.position.y = this.forestCenter.y + 8;
                this.velocity.set(0, 0, 0);
                this.state = 'perch';
            }
        }

        super.updateMovement(delta);
    }
}

window.Honeycreeper = Honeycreeper;
