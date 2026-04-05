// Device detection (single source of truth)
function detectDeviceType() {
    const isTouch = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    return isTouch ? 'mobile' : 'desktop';
}

// Preset configurations
const DEVICE_PRESETS = {
    desktop: {
        name: 'Default',
        vegetation: { distance: 1300, density: 100 },
        buildings: { distance: 3500, density: 100 },
        fauna: { distance: 6000, count: 100 },
        clouds: { count: 100, distance: 15000 },
        boats: { distance: 8000, count: 100 },
        balloons: { distance: 6000, count: 100 }
    },
    mobile: {
        name: 'Mobile Optimized',
        vegetation: { distance: 800, density: 80 },
        buildings: { distance: 2000, density: 70 },
        fauna: { distance: 4000, count: 70 },
        clouds: { count: 80, distance: 12000 },
        boats: { distance: 6000, count: 70 },
        balloons: { distance: 4500, count: 60 }
    },
    highPerformance: {
        name: 'High Performance',
        vegetation: { distance: 400, density: 50 },
        buildings: { distance: 1000, density: 35 },
        fauna: { distance: 2000, count: 35 },
        clouds: { count: 40, distance: 6000 },
        boats: { distance: 3000, count: 35 },
        balloons: { distance: 2250, count: 30 }
    },
    ultra: {
        name: 'Ultra',
        vegetation: { distance: 5000, density: 200 },
        buildings: { distance: 10000, density: 200 },
        fauna: { distance: 20000, count: 200 },
        clouds: { count: 300, distance: 30000 },
        boats: { distance: 20000, count: 200 },
        balloons: { distance: 20000, count: 200 }
    }
};

// Apply preset to settings sliders
function applyPreset(presetKey) {
    const preset = DEVICE_PRESETS[presetKey];
    if (!preset) return;

    // Vegetation
    const vegDistSlider = document.getElementById('veg-distance-slider');
    const vegDensitySlider = document.getElementById('veg-density-slider');
    if (vegDistSlider) vegDistSlider.value = preset.vegetation.distance;
    if (vegDensitySlider) vegDensitySlider.value = preset.vegetation.density;

    // Buildings
    const bldDistSlider = document.getElementById('building-distance-slider');
    const bldDensitySlider = document.getElementById('building-density-slider');
    if (bldDistSlider) bldDistSlider.value = preset.buildings.distance;
    if (bldDensitySlider) bldDensitySlider.value = preset.buildings.density;

    // Fauna
    const faunaDistSlider = document.getElementById('fauna-distance-slider');
    const faunaDensitySlider = document.getElementById('fauna-density-slider');
    if (faunaDistSlider) faunaDistSlider.value = preset.fauna.distance;
    if (faunaDensitySlider) faunaDensitySlider.value = preset.fauna.count;

    // Clouds
    const cloudCountSlider = document.getElementById('cloud-count-slider');
    const cloudDistSlider = document.getElementById('cloud-distance-slider');
    if (cloudCountSlider) cloudCountSlider.value = preset.clouds.count;
    if (cloudDistSlider) cloudDistSlider.value = preset.clouds.distance;

    // Boats
    const boatsDistSlider = document.getElementById('boats-distance-slider');
    const boatsDensitySlider = document.getElementById('boats-density-slider');
    if (boatsDistSlider) boatsDistSlider.value = preset.boats.distance;
    if (boatsDensitySlider) boatsDensitySlider.value = preset.boats.count;

    // Balloons
    const balloonsDistSlider = document.getElementById('balloons-distance-slider');
    const balloonsDensitySlider = document.getElementById('balloons-density-slider');
    if (balloonsDistSlider) balloonsDistSlider.value = preset.balloons.distance;
    if (balloonsDensitySlider) balloonsDensitySlider.value = preset.balloons.count;

    // Update display values by triggering input events
    [vegDistSlider, vegDensitySlider, bldDistSlider, bldDensitySlider, 
     faunaDistSlider, faunaDensitySlider, cloudCountSlider, cloudDistSlider,
     boatsDistSlider, boatsDensitySlider, balloonsDistSlider, balloonsDensitySlider]
        .forEach(slider => {
            if (slider) {
                slider.dispatchEvent(new Event('input'));
            }
        });
}

// Get device default preset key
function getDeviceDefaultPreset() {
    const deviceType = detectDeviceType();
    return deviceType === 'mobile' ? 'mobile' : 'desktop';
}

// Physics mode configuration
let physicsMode = localStorage.getItem('physicsMode') || 'arcade';

// Float plane configuration
let hasFloats = localStorage.getItem('hasFloats') === 'true';

// Elevator reverse for mobile widget and keyboard
let reverseElevator = localStorage.getItem('reverseElevator') === 'true';

function getPhysicsMode() {
    return physicsMode;
}

function setPhysicsMode(mode) {
    physicsMode = mode;
    localStorage.setItem('physicsMode', mode);
    
    // Update aircraft if exists
    if (window.aircraft) {
        window.aircraft.setPhysicsMode(mode);
    }
    
    // Update controls hint
    updateControlsHint(mode);
}

function getHasFloats() {
    return hasFloats;
}

function setHasFloats(enabled) {
    hasFloats = enabled;
    localStorage.setItem('hasFloats', enabled);
    
    // Update aircraft if exists
    if (window.aircraft) {
        window.aircraft.setHasFloats(enabled);
    }
}

function getReverseElevator() {
    return reverseElevator;
}

function setReverseElevator(reverse) {
    reverseElevator = reverse;
    localStorage.setItem('reverseElevator', reverse);
}

function updateControlsHint(mode) {
    const hint = document.getElementById('controls-hint');
    if (!hint) return;
    
    if (mode === 'realistic') {
        hint.textContent = 'WASD: Pitch/Roll | QE: Rudder (coordinate turns) | Shift/Ctrl: Throttle | Space: Brake | R: Reset | C: Config';
    } else {
        hint.textContent = 'WASD: Pitch/Roll | QE: Yaw | Shift/Ctrl: Throttle | Space: Brake | R: Reset | C: Config';
    }
}

// Export for global access
window.getPhysicsMode = getPhysicsMode;
window.setPhysicsMode = setPhysicsMode;
window.getHasFloats = getHasFloats;
window.setHasFloats = setHasFloats;
window.updateControlsHint = updateControlsHint;
window.getReverseElevator = getReverseElevator;
window.setReverseElevator = setReverseElevator;
