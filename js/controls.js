// ========== CONTROLS ==========
const keys = {};
const mouse = { x: 0, y: 0, deltaX: 0, deltaY: 0 };
let scrollDelta = 0;

// Touch input state
const touchInput = {
    rightStick: { x: 0, y: 0, active: false },
    throttle: 0.5, // 0 to 1, set by slider position (default matches aircraft idle)
    yaw: 0, // -1 to 1 for rudder slider (center = 0)
    reset: false
};

const GAME_KEYS = new Set([
    'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ', 'KeyE', 'KeyR',
    'Space', 'ShiftLeft', 'ShiftRight', 'ControlLeft', 'ControlRight',
    'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'
]);

// Check if device is touch-capable
function isTouchDevice() {
    return window.matchMedia('(hover: none) and (pointer: coarse)').matches ||
           'ontouchstart' in window || 
           navigator.maxTouchPoints > 0;
}

// Initialize touch controls
function initTouchControls() {
    if (!isTouchDevice()) return;
    
    // Show touch controls
    const touchControls = document.getElementById('touch-controls');
    if (touchControls) {
        touchControls.style.display = 'block';
        touchControls.classList.add('visible');
    }
    
    // Throttle slider
    const throttleZone = document.getElementById('throttle-zone');
    const throttleHandle = document.getElementById('throttle-handle');
    let throttleTouchId = null;
    let throttleTrackRect = null;
    
    // Initialize throttle handle position to match default throttle (0.5 = 50% = middle)
    if (throttleZone && throttleHandle) {
        const track = throttleZone.querySelector('.throttle-track');
        if (track) {
            const trackRect = track.getBoundingClientRect();
            const trackHeight = trackRect.height - 60;
            const handlePos = touchInput.throttle * trackHeight;
            throttleHandle.style.bottom = handlePos + 'px';
        }
    }
    
    // Right stick: Pitch (Y) + Roll (X)
    const rightZone = document.getElementById('right-stick-zone');
    const rightStick = document.getElementById('right-stick');
    let rightTouchId = null;
    let rightStartPos = { x: 0, y: 0 };
    
    if (rightZone) {
        rightZone.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.changedTouches[0];
            rightTouchId = touch.identifier;
            const rect = rightZone.getBoundingClientRect();
            rightStartPos = {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2
            };
            touchInput.rightStick.active = true;
            updateStick(rightStick, touch, rightStartPos, touchInput.rightStick);
        }, { passive: false });
        
        rightZone.addEventListener('touchmove', (e) => {
            e.preventDefault();
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === rightTouchId) {
                    updateStick(rightStick, e.changedTouches[i], rightStartPos, touchInput.rightStick);
                    break;
                }
            }
        }, { passive: false });
        
        rightZone.addEventListener('touchend', (e) => {
            e.preventDefault();
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === rightTouchId) {
                    rightTouchId = null;
                    touchInput.rightStick.active = false;
                    touchInput.rightStick.x = 0;
                    touchInput.rightStick.y = 0;
                    rightStick.style.transform = 'translate(-50%, -50%)';
                    break;
                }
            }
        }, { passive: false });
        
        rightZone.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            rightTouchId = null;
            touchInput.rightStick.active = false;
            touchInput.rightStick.x = 0;
            touchInput.rightStick.y = 0;
            rightStick.style.transform = 'translate(-50%, -50%)';
        }, { passive: false });
    }
    
    if (throttleZone && throttleHandle) {
        const updateThrottleFromPosition = (clientY) => {
            if (!throttleTrackRect) {
                const track = throttleZone.querySelector('.throttle-track');
                if (track) throttleTrackRect = track.getBoundingClientRect();
            }
            if (!throttleTrackRect) return;
            
            const trackHeight = throttleTrackRect.height - 60; // minus handle height
            const relativeY = throttleTrackRect.bottom - clientY - 30; // offset for handle center
            const percentage = Math.max(0, Math.min(1, relativeY / trackHeight));
            
            touchInput.throttle = percentage;
            const handlePos = percentage * trackHeight;
            throttleHandle.style.bottom = handlePos + 'px';
        };
        
        throttleZone.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const track = throttleZone.querySelector('.throttle-track');
            if (track) throttleTrackRect = track.getBoundingClientRect();
            
            const touch = e.changedTouches[0];
            throttleTouchId = touch.identifier;
            updateThrottleFromPosition(touch.clientY);
        }, { passive: false });
        
        throttleZone.addEventListener('touchmove', (e) => {
            e.preventDefault();
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === throttleTouchId) {
                    updateThrottleFromPosition(e.changedTouches[i].clientY);
                    break;
                }
            }
        }, { passive: false });
        
        throttleZone.addEventListener('touchend', (e) => {
            e.preventDefault();
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === throttleTouchId) {
                    throttleTouchId = null;
                    break;
                }
            }
        }, { passive: false });
        
        throttleZone.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            throttleTouchId = null;
        }, { passive: false });
    }
    
    // Rudder slider (horizontal, below joystick)
    const rudderZone = document.getElementById('rudder-zone');
    const rudderHandle = document.getElementById('rudder-handle');
    let rudderTouchId = null;
    let rudderTrackRect = null;
    
    if (rudderZone && rudderHandle) {
        const updateRudderFromPosition = (clientX) => {
            if (!rudderTrackRect) {
                const track = rudderZone.querySelector('.rudder-track');
                if (track) rudderTrackRect = track.getBoundingClientRect();
            }
            if (!rudderTrackRect) return;
            
            const trackWidth = rudderTrackRect.width - 60; // minus handle width
            const relativeX = clientX - rudderTrackRect.left - 30; // offset for handle center
            const percentage = Math.max(0, Math.min(1, relativeX / trackWidth));
            
            touchInput.yaw = (percentage - 0.5) * 2; // Range: -1 to 1
            const handlePos = percentage * trackWidth;
            rudderHandle.style.left = handlePos + 'px';
        };
        
        rudderZone.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const track = rudderZone.querySelector('.rudder-track');
            if (track) rudderTrackRect = track.getBoundingClientRect();
            
            const touch = e.changedTouches[0];
            rudderTouchId = touch.identifier;
            updateRudderFromPosition(touch.clientX);
        }, { passive: false });
        
        rudderZone.addEventListener('touchmove', (e) => {
            e.preventDefault();
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === rudderTouchId) {
                    updateRudderFromPosition(e.changedTouches[i].clientX);
                    break;
                }
            }
        }, { passive: false });
        
        rudderZone.addEventListener('touchend', (e) => {
            e.preventDefault();
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === rudderTouchId) {
                    rudderTouchId = null;
                    touchInput.yaw = 0; // Reset to center (no rudder)
                    rudderHandle.style.left = '50%';
                    break;
                }
            }
        }, { passive: false });
        
        rudderZone.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            rudderTouchId = null;
            touchInput.yaw = 0; // Reset to center (no rudder)
            rudderHandle.style.left = '50%';
        }, { passive: false });
    }
    
    // Reset button
    const resetBtnTouch = document.getElementById('reset-btn-touch');
    if (resetBtnTouch) {
        resetBtnTouch.addEventListener('touchstart', (e) => {
            e.preventDefault();
            touchInput.reset = true;
            resetBtnTouch.style.background = 'rgba(255, 0, 0, 0.4)';
        }, { passive: false });
        
        resetBtnTouch.addEventListener('touchend', (e) => {
            e.preventDefault();
            touchInput.reset = false;
            resetBtnTouch.style.background = '';
        }, { passive: false });
    }
}

function updateStick(stickElement, touch, startPos, stickData) {
    const maxDistance = 40;
    const dx = touch.clientX - startPos.x;
    const dy = touch.clientY - startPos.y;
    const distance = Math.min(Math.sqrt(dx * dx + dy * dy), maxDistance);
    const angle = Math.atan2(dy, dx);
    
    const moveX = Math.cos(angle) * distance;
    const moveY = Math.sin(angle) * distance;
    
    stickElement.style.transform = `translate(calc(-50% + ${moveX}px), calc(-50% + ${moveY}px))`;
    
    // Normalize to -1 to 1 range
    stickData.x = moveX / maxDistance;
    // Reverse Y: push up (negative screen Y) = positive output (nose down), pull down = negative (nose up)
    stickData.y = -moveY / maxDistance;
}

// Touch camera state
const touchCamera = {
    active: false,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    pinchActive: false,
    pinchStartDistance: 0,
    lastPinchDistance: 0
};

// Track orbit camera reference for touch controls
let orbitCameraRef = null;

// Initialize touch camera controls
function initTouchCameraControls(cameraInstance) {
    orbitCameraRef = cameraInstance;
    
    const canvas = document.querySelector('canvas') || document.body;
    const touchControls = document.getElementById('touch-controls');
    
    canvas.addEventListener('touchstart', (e) => {
        // Check if touch is on a control element
        if (isTouchOnControlElement(e.target)) {
            return; // Let the control handle it
        }
        
        if (e.touches.length === 1) {
            // Single touch - start camera rotation
            e.preventDefault();
            touchCamera.active = true;
            touchCamera.startX = e.touches[0].clientX;
            touchCamera.startY = e.touches[0].clientY;
            touchCamera.lastX = touchCamera.startX;
            touchCamera.lastY = touchCamera.startY;
        } else if (e.touches.length === 2) {
            // Two touches - start pinch zoom
            e.preventDefault();
            touchCamera.pinchActive = true;
            touchCamera.pinchStartDistance = getPinchDistance(e.touches);
            touchCamera.lastPinchDistance = touchCamera.pinchStartDistance;
        }
    }, { passive: false });
    
    canvas.addEventListener('touchmove', (e) => {
        if (!touchCamera.active && !touchCamera.pinchActive) return;
        
        // Check if touch is on a control element
        if (isTouchOnControlElement(e.target)) {
            return;
        }
        
        e.preventDefault();
        
        if (touchCamera.pinchActive && e.touches.length === 2) {
            // Handle pinch zoom
            const currentDistance = getPinchDistance(e.touches);
            const delta = touchCamera.lastPinchDistance - currentDistance; // Inverted: pinch out = zoom in
            
            if (orbitCameraRef) {
                orbitCameraRef.handleScroll(delta * 0.5); // Scale factor for touch
            }
            
            touchCamera.lastPinchDistance = currentDistance;
        } else if (touchCamera.active && e.touches.length === 1) {
            // Handle camera rotation
            const currentX = e.touches[0].clientX;
            const currentY = e.touches[0].clientY;
            const deltaX = currentX - touchCamera.lastX;
            const deltaY = currentY - touchCamera.lastY;
            
            if (orbitCameraRef) {
                orbitCameraRef.handleMouseInput(deltaX, deltaY);
            }
            
            touchCamera.lastX = currentX;
            touchCamera.lastY = currentY;
        }
    }, { passive: false });
    
    canvas.addEventListener('touchend', (e) => {
        if (touchCamera.active || touchCamera.pinchActive) {
            e.preventDefault();
        }
        
        // Reset states based on remaining touches
        if (e.touches.length === 0) {
            touchCamera.active = false;
            touchCamera.pinchActive = false;
        } else if (e.touches.length === 1 && touchCamera.pinchActive) {
            // Switch from pinch to single touch (camera rotation)
            touchCamera.pinchActive = false;
            touchCamera.active = true;
            touchCamera.lastX = e.touches[0].clientX;
            touchCamera.lastY = e.touches[0].clientY;
        }
    }, { passive: false });
    
    canvas.addEventListener('touchcancel', (e) => {
        touchCamera.active = false;
        touchCamera.pinchActive = false;
    }, { passive: false });
}

// Check if a touch target is a control element
function isTouchOnControlElement(target) {
    const controlSelectors = [
        '#throttle-zone',
        '#right-stick-zone', 
        '#rudder-zone',
        '#reset-btn-touch',
        '.touch-zone',
        '.touch-button',
        '.yaw-button',
        '.throttle-container',
        '.rudder-container'
    ];
    
    return controlSelectors.some(selector => target.closest(selector) !== null);
}

// Calculate distance between two touch points
function getPinchDistance(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
}

function initControls() {
    window.addEventListener('keydown', (e) => {
        keys[e.code] = true;
        if (GAME_KEYS.has(e.code)) e.preventDefault();
    });
    
    window.addEventListener('keyup', (e) => {
        keys[e.code] = false;
    });
    
    window.addEventListener('mousemove', (e) => {
        mouse.deltaX = e.movementX || 0;
        mouse.deltaY = e.movementY || 0;
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });
    
    window.addEventListener('wheel', (e) => {
        scrollDelta += e.deltaY;
        if (Math.abs(scrollDelta) > 10000) scrollDelta = 0;
        e.preventDefault();
    }, { passive: false });
    
    // Initialize touch controls for mobile
    initTouchControls();
}

function getKeyboardInput() {
    return {
        pitchUp: keys['KeyW'] || keys['ArrowUp'],
        pitchDown: keys['KeyS'] || keys['ArrowDown'],
        rollLeft: keys['KeyA'] || keys['ArrowLeft'],
        rollRight: keys['KeyD'] || keys['ArrowRight'],
        yawLeft: keys['KeyE'],
        yawRight: keys['KeyQ'],
        throttleUp: keys['ShiftLeft'] || keys['ShiftRight'],
        throttleDown: keys['ControlLeft'] || keys['ControlRight'],
        brake: keys['Space'],
        reset: keys['KeyR']
    };
}

function getTouchInput() {
    const result = {
        // Right stick Y controls pitch (inverted: up = pitch up = negative)
        pitch: touchInput.rightStick.active ? -touchInput.rightStick.y : 0,
        // Right stick X controls roll
        roll: touchInput.rightStick.active ? touchInput.rightStick.x : 0,
        // Rudder slider value (-1 to 1)
        yaw: touchInput.yaw || 0,
        // Throttle slider value (0 to 1)
        throttle: touchInput.throttle,
        reset: touchInput.reset
    };
    
    // Reset one-shot inputs
    if (touchInput.reset) {
        touchInput.reset = false;
    }
    
    return result;
}

function getMouseInput() {
    const result = {
        deltaX: mouse.deltaX,
        deltaY: mouse.deltaY,
        scrollDelta: scrollDelta
    };
    mouse.deltaX = 0;
    mouse.deltaY = 0;
    scrollDelta = 0;
    return result;
}

function isMobile() {
    return isTouchDevice();
}
