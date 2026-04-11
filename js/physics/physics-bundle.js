// Physics bundle - loads all physics modules and exposes to window
// This bridges ES modules to script tag loading

import * as CANNON from 'cannon-es';

// Wait for CANNON to be available via window
window.CANNON = CANNON;

// Import and expose physics classes
import('./physics-bridge.js')
    .then(module => {
        window.PhysicsBridge = module.default;
    })
    .catch(e => console.error('Failed to load physics-bridge:', e));

import('./aerodynamics.js')
    .then(module => {
        window.AERODYNAMICS = module.AERODYNAMICS;
    })
    .catch(e => console.error('Failed to load aerodynamics:', e));

import('./realistic-physics.js')
    .then(module => {
        window.RealisticPhysics = module.default;
    })
    .catch(e => console.error('Failed to load realistic-physics:', e));

console.log('Physics bundle loaded');