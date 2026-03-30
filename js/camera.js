// ========== ORBIT CAMERA ==========
class OrbitCamera {
    constructor(camera, target) {
        this.camera = camera;
        this.target = target;
        
        this.distance = 30;
        this.minDistance = 10;
        this.maxDistance = 120;
        
        this.azimuth = Math.PI;
        this.elevation = 0.35;
        
        this.orbitSensitivity = 0.004;
        this.zoomSensitivity = 0.08;
        this.smoothness = 6;
        
        this.heightOffset = 4;
        this.lookAheadDistance = 8;
        
        this.currentPosition = new THREE.Vector3();
        this.currentLookAt = new THREE.Vector3();
    }
    
    handleMouseInput(deltaX, deltaY) {
        this.azimuth -= deltaX * this.orbitSensitivity;
        this.elevation += deltaY * this.orbitSensitivity;
        this.elevation = clamp(this.elevation, -Math.PI / 3, Math.PI / 2.5);
    }
    
    handleScroll(scrollDelta) {
        this.distance += scrollDelta * this.zoomSensitivity;
        this.distance = clamp(this.distance, this.minDistance, this.maxDistance);
    }
    
    update(delta) {
        if (!this.target) return;
        
        const targetPos = this.target.position.clone();
        
        const offset = new THREE.Vector3(
            Math.sin(this.azimuth) * Math.cos(this.elevation) * this.distance,
            Math.sin(this.elevation) * this.distance,
            Math.cos(this.azimuth) * Math.cos(this.elevation) * this.distance
        );
        
        offset.y += this.heightOffset;
        
        const desiredPosition = targetPos.clone().add(offset);
        
        const t = 1 - Math.exp(-this.smoothness * delta);
        this.currentPosition.lerp(desiredPosition, t);
        
        const lookAhead = new THREE.Vector3(0, 0, -this.lookAheadDistance);
        lookAhead.applyEuler(this.target.rotation);
        this.currentLookAt.lerp(targetPos.clone().add(lookAhead), t);
        
        this.camera.position.copy(this.currentPosition);
        this.camera.lookAt(this.currentLookAt);
    }
    
    resetBehindTarget() {
        if (!this.target) return;
        
        const targetRotation = this.target.rotation.y || 0;
        this.azimuth = targetRotation;
        this.elevation = 0.35;
        
        const targetPos = this.target.position.clone();
        const offset = new THREE.Vector3(
            Math.sin(this.azimuth) * Math.cos(this.elevation) * this.distance,
            Math.sin(this.elevation) * this.distance,
            Math.cos(this.azimuth) * Math.cos(this.elevation) * this.distance
        );
        offset.y += this.heightOffset;
        
        this.currentPosition.copy(targetPos.clone().add(offset));
        this.currentLookAt.copy(targetPos);
        
        this.camera.position.copy(this.currentPosition);
        this.camera.lookAt(this.currentLookAt);
    }
}
