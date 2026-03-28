// ========== ORBIT CAMERA ==========
class OrbitCamera {
    constructor(camera, target) {
        this.camera = camera;
        this.target = target;
        this.distance = 25;
        this.minDistance = 8;
        this.maxDistance = 80;
        this.azimuth = 0;
        this.elevation = 0.3;
        this.orbitSensitivity = 0.005;
        this.zoomSensitivity = 0.05;
        this.smoothness = 5;
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
        
        offset.y += 3;
        
        const desiredPosition = targetPos.clone().add(offset);
        
        const t = 1 - Math.exp(-this.smoothness * delta);
        this.currentPosition.lerp(desiredPosition, t);
        
        const lookAhead = new THREE.Vector3(0, 0, -5);
        lookAhead.applyEuler(this.target.rotation);
        this.currentLookAt.lerp(targetPos.clone().add(lookAhead), t);
        
        this.camera.position.copy(this.currentPosition);
        this.camera.lookAt(this.currentLookAt);
    }
}
