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
        this.fps = 60;
        this.visibleTrees = 0;
        this.visibleAnimals = 0;
        this.frameTime = 0;
        
        this.createDisplay();
    }
    
    createDisplay() {
        this.element = document.createElement('div');
        this.element.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            background: rgba(0,0,0,0.7);
            color: #0f0;
            font-family: monospace;
            font-size: 12px;
            padding: 10px;
            border-radius: 5px;
            z-index: 1000;
            pointer-events: none;
        `;
        document.body.appendChild(this.element);
    }
    
    update() {
        this.frameCount++;
        const now = performance.now();
        
        if (now - this.lastTime >= 1000) {
            this.fps = Math.round((this.frameCount * 1000) / (now - this.lastTime));
            this.frameTime = ((now - this.lastTime) / this.frameCount).toFixed(1);
            this.frameCount = 0;
            this.lastTime = now;
            
            // Count visible objects
            if (window.floraManager) {
                this.visibleTrees = window.floraManager.allTrees.filter(t => t.mesh.visible).length;
            }
            if (window.faunaManager) {
                this.visibleAnimals = window.faunaManager.animals.filter(a => a.isVisible).length;
            }
            
            this.render();
        }
    }
    
    render() {
        this.element.innerHTML = `
            FPS: ${this.fps} | Frame: ${this.frameTime}ms<br>
            Trees: ${this.visibleTrees} | Animals: ${this.visibleAnimals}
        `;
    }
}

window.PerformanceManager = PerformanceManager;
window.PerformanceMonitor = PerformanceMonitor;
