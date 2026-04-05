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
        
        this.currentPosition = new THREE.Vector3();
        
        this.followHeading = true;
        this.headingSmoothing = 2;
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
        
        if (this.followHeading) {
            const targetHeading = this.target.rotation.y;
            
            let diff = targetHeading - this.azimuth;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            
            if (Math.abs(diff) > 0.001) {
                const t = 1 - Math.exp(-this.headingSmoothing * delta);
                this.azimuth += diff * t;
            }
        }
        
        const offset = new THREE.Vector3(
            Math.sin(this.azimuth) * Math.cos(this.elevation) * this.distance,
            Math.sin(this.elevation) * this.distance,
            Math.cos(this.azimuth) * Math.cos(this.elevation) * this.distance
        );
        
        offset.y += this.heightOffset;
        
        const desiredPosition = targetPos.clone().add(offset);
        
        const t = 1 - Math.exp(-this.smoothness * delta);
        this.currentPosition.lerp(desiredPosition, t);
        
        this.camera.position.copy(this.currentPosition);
        this.camera.lookAt(targetPos);
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
