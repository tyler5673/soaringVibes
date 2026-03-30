// js/performance.js - Performance utilities for flora and fauna

class PerformanceManager {
    constructor(camera) {
        this.camera = camera;
        this.frustum = new THREE.Frustum();
        this.projScreenMatrix = new THREE.Matrix4();
    }
    
    updateFrustum() {
        this.projScreenMatrix.multiplyMatrices(
            this.camera.projectionMatrix,
            this.camera.matrixWorldInverse
        );
        this.frustum.setFromProjectionMatrix(this.projScreenMatrix);
    }
    
    isInView(object) {
        const pos = object.position;
        return this.frustum.containsPoint(pos);
    }
    
    getLODLevel(distance) {
        // Aggressive LOD for performance
        if (distance < 200) return 'high';
        if (distance < 500) return 'medium';
        return 'far';
    }
}

class PerformanceMonitor {
    constructor() {
        this.frameCount = 0;
        this.lastTime = performance.now();
    }
    
    update() {
        this.frameCount++;
        const now = performance.now();
        if (now - this.lastTime >= 1000) {
            this.frameCount = 0;
            this.lastTime = now;
        }
    }
}

window.PerformanceManager = PerformanceManager;
window.PerformanceMonitor = PerformanceMonitor;
