// ========== UTILITIES ==========
const degreesToRadians = deg => deg * (Math.PI / 180);
const radiansToDegrees = rad => rad * (180 / Math.PI);
const clamp = (val, min, max) => Math.max(min, Math.min(max, val));
const lerp = (start, end, t) => start + (end - start) * t;
