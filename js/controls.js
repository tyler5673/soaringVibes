// ========== CONTROLS ==========
const keys = {};
const mouse = { x: 0, y: 0, deltaX: 0, deltaY: 0 };
let scrollDelta = 0;

// Touch input state
const touchInput = {
    rightStick: { x: 0, y: 0, active: false },
    yaw: 0, // -1 to 1 for rudder (center = 0)
    throttle: 0.5, // 0 to 1, default = center position (50%)
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
    
    // Right stick: Pitch + Roll
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
    
    // Throttle+Rudder Joystick (square zone on left)
    const throttleRudderZone = document.getElementById('throttle-rudder-zone');
    const throttleRudderStick = document.getElementById('throttle-rudder-stick');
    const throttleRudderZoneBg = throttleRudderZone?.querySelector('.throttle-rudder-zone-bg');
    let trTouchId = null;

    if (throttleRudderStick) {
        throttleRudderStick.style.left = '50%';
        throttleRudderStick.style.top = '50%';
        throttleRudderStick.style.transform = 'translate(-50%, -50%)';
    }

    if (throttleRudderZone && throttleRudderStick && throttleRudderZoneBg) {
        const updateFromPosition = (clientX, clientY) => {
            const zoneRect = throttleRudderZoneBg.getBoundingClientRect();
            const centerX = zoneRect.left + zoneRect.width / 2;
            const centerY = zoneRect.top + zoneRect.height / 2;

            const dx = clientX - centerX;
            const dy = clientY - centerY;

            const stickWidth = throttleRudderStick.offsetWidth;
            const maxDistance = (zoneRect.width - stickWidth) / 2;

            const normalizedX = clamp(dx / maxDistance, -1, 1);
            const normalizedY = clamp(dy / maxDistance, -1, 1);

            touchInput.yaw = -normalizedX;
            touchInput.throttle = clamp(0.5 - (normalizedY * 0.5), 0, 1);

            // Use percentage-based positioning with centering transform preserved
            const stickLeftPct = 50 + (normalizedX * 50);
            const stickTopPct = 50 + (normalizedY * 50);

            throttleRudderStick.style.left = stickLeftPct + '%';
            throttleRudderStick.style.top = stickTopPct + '%';
            throttleRudderStick.style.transform = 'translate(-50%, -50%)'; // Keep centering transform!

            if (Math.abs(normalizedX) >= 0.95 || Math.abs(normalizedY) >= 0.95) {
                throttleRudderStick.classList.add('at-boundary');
            } else {
                throttleRudderStick.classList.remove('at-boundary');
            }
        };

        const resetYawToCenter = () => {
            touchInput.yaw = 0;
            throttleRudderStick.style.transition = 'left 0.3s ease-out'; // Enable transition for smooth reset
            throttleRudderStick.style.left = '50%';
            // Don't modify top - preserve current vertical position
            throttleRudderStick.style.transform = 'translate(-50%, -50%)';
            throttleRudderStick.classList.remove('at-boundary');
        };

        throttleRudderZone.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.changedTouches[0];
            trTouchId = touch.identifier;
            throttleRudderStick.style.transition = 'none'; // Disable transition during active drag
            updateFromPosition(touch.clientX, touch.clientY);
        }, { passive: false });

        throttleRudderZone.addEventListener('touchmove', (e) => {
            e.preventDefault();
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === trTouchId) {
                    updateFromPosition(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
                    break;
                }
            }
        }, { passive: false });

        throttleRudderZone.addEventListener('touchend', resetYawToCenter);
        throttleRudderZone.addEventListener('touchcancel', resetYawToCenter);
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

function applySoftCurve(value) {
    const absVal = Math.abs(value);
    if (absVal <= 0.5) {
        return value * 0.3;
    } else {
        const t = (absVal - 0.5) / 0.5;
        const curved = 0.3 + t * 0.7;
        return value < 0 ? -curved : curved;
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
    let normalizedX = moveX / maxDistance;
    let normalizedY = -moveY / maxDistance;
    
    stickData.x = applySoftCurve(normalizedX);
    stickData.y = applySoftCurve(normalizedY);
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
        '#throttle-rudder-zone',
        '#right-stick-zone', 
        '#reset-btn-touch',
        '.touch-zone',
        '.touch-button',
        '.yaw-button'
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
        const activeEl = document.activeElement;
        const isInputFocused = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');
        
        if (!isInputFocused) {
            keys[e.code] = true;
            if (GAME_KEYS.has(e.code)) e.preventDefault();
        }
    });
    
    window.addEventListener('keyup', (e) => {
        const activeEl = document.activeElement;
        const isInputFocused = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');
        
        if (!isInputFocused) {
            keys[e.code] = false;
        }
    });
    
    window.addEventListener('mousemove', (e) => {
        mouse.deltaX = e.movementX || 0;
        mouse.deltaY = e.movementY || 0;
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });
    
    window.addEventListener('wheel', (e) => {
        // Allow scrolling in settings modal
        if (e.target.closest('.settings-container')) {
            return;
        }
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
