// js/animals/animal-base.js - Base class for all animals

class Animal {
    constructor(scene, initialPosition, config = {}) {
        this.scene = scene;
        this.position = initialPosition.clone();
        this.velocity = new THREE.Vector3();
        this.config = {
            speed: 10,
            turnSpeed: 1,
            animationSpeed: 1,
            viewDistance: 2000,
            updateDistance: 4000,
            ...config
        };

        this.mesh = null;
        this.state = 'idle';
        this.stateTimer = 0;
        this.animationTime = 0;
        this.isVisible = true;

        this.createMesh();

        if (this.mesh) {
            this.mesh.visible = true;
        }
    }

    createMesh() {
        this.mesh = new THREE.Group();
        this.scene.add(this.mesh);
    }

    update(delta, cameraPosition) {
        const distToCamera = this.position.distanceTo(cameraPosition);

        if (distToCamera > this.config.updateDistance) {
            this.mesh.visible = false;
            this.isVisible = false;
            return;
        }

        this.isVisible = distToCamera < this.config.viewDistance;
        this.mesh.visible = this.isVisible;

        if (this.isVisible) {
            this.animationTime += delta * this.config.animationSpeed;
            this.updateState(delta);
            this.updateAnimation(delta);
        }

        this.updateMovement(delta);
        this.mesh.position.copy(this.position);
    }

    updateState(delta) {
        this.stateTimer -= delta;
        if (this.stateTimer <= 0) {
            this.chooseNewState();
        }
    }

    chooseNewState() {
        this.state = 'idle';
        this.stateTimer = 2 + Math.random() * 3;
    }

    updateAnimation(delta) {
        // Override in subclasses
    }

    updateMovement(delta) {
        this.position.add(this.velocity.clone().multiplyScalar(delta));
    }

    lookAt(target) {
        const direction = target.clone().sub(this.position).normalize();
        const angle = Math.atan2(direction.x, direction.z);
        this.mesh.rotation.y = angle;
    }

    moveToward(target, speed) {
        const direction = target.clone().sub(this.position).normalize();
        this.velocity.copy(direction.multiplyScalar(speed));
    }

    getRandomPoint(center, radius) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * radius;
        return new THREE.Vector3(
            center.x + Math.cos(angle) * dist,
            center.y,
            center.z + Math.sin(angle) * dist
        );
    }

    dispose() {
        if (this.mesh) {
            this.scene.remove(this.mesh);
            this.mesh.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
        }
    }
}

window.Animal = Animal;
