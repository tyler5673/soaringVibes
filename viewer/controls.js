class AnimationController {
    constructor() {
        this.isPlaying = false;
        this.speed = 1;
        this.currentTime = 0;
        this.handlers = [];
    }
    
    play() {
        this.isPlaying = true;
        console.log('Animation: playing');
    }
    
    pause() {
        this.isPlaying = false;
        console.log('Animation: paused');
    }
    
    setSpeed(value) {
        this.speed = parseFloat(value);
    }
    
    update(delta) {
        if (!this.isPlaying) return;
        
        this.currentTime += delta * this.speed;
        
        // Call registered animation handlers
        this.handlers.forEach(handler => {
            if (typeof handler === 'function') {
                handler(this.currentTime, delta);
            }
        });
    }
    
    registerHandler(handler) {
        this.handlers.push(handler);
    }
    
    clearHandlers() {
        this.handlers = [];
        this.currentTime = 0;
    }
}

// Global instance
window.animationController = new AnimationController();

// Setup UI bindings
function setupAnimationControls() {
    const playBtn = document.getElementById('play-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const speedSlider = document.getElementById('speed-slider');
    
    if (!playBtn || !pauseBtn || !speedSlider) return;
    
    playBtn.addEventListener('click', () => {
        window.animationController.play();
    });
    
    pauseBtn.addEventListener('click', () => {
        window.animationController.pause();
    });
    
    speedSlider.addEventListener('input', (e) => {
        window.animationController.setSpeed(e.target.value);
    });
}

// Auto-setup on load
window.addEventListener('load', setupAnimationControls);

console.log('AnimationController loaded');