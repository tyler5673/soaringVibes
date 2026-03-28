// ========== CONTROLS ==========
const keys = {};
const mouse = { x: 0, y: 0, deltaX: 0, deltaY: 0 };
let scrollDelta = 0;

const GAME_KEYS = new Set([
    'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ', 'KeyE', 'KeyR',
    'Space', 'ShiftLeft', 'ShiftRight', 'ControlLeft', 'ControlRight',
    'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'
]);

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
}

function getKeyboardInput() {
    return {
        pitchUp: keys['KeyW'] || keys['ArrowUp'],
        pitchDown: keys['KeyS'] || keys['ArrowDown'],
        rollLeft: keys['KeyA'] || keys['ArrowLeft'],
        rollRight: keys['KeyD'] || keys['ArrowRight'],
        yawLeft: keys['KeyQ'],
        yawRight: keys['KeyE'],
        throttleUp: keys['ShiftLeft'] || keys['ShiftRight'],
        throttleDown: keys['ControlLeft'] || keys['ControlRight'],
        brake: keys['Space'],
        reset: keys['KeyR']
    };
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
