// ========== UTILITIES ==========
// Use var instead of const to allow re-declaration if file loads multiple times
var degreesToRadians = window.degreesToRadians || function(deg) { return deg * (Math.PI / 180); };
var radiansToDegrees = window.radiansToDegrees || function(rad) { return rad * (180 / Math.PI); };
var clamp = window.clamp || function(val, min, max) { return Math.max(min, Math.min(max, val)); };
var lerp = window.lerp || function(start, end, t) { return start + (end - start) * t; };
