/**
 * Aerodynamics module for lift/drag calculations
 * Used by the cannon-es physics system
 */

const AERODYNAMICS = {
    rho: 1.225,  // sea level air density (kg/m³)
    
    /**
     * Calculate lift coefficient based on angle of attack
     * @param {number} alpha - Angle of attack in radians
     * @param {Object} options - Optional parameters
     * @param {number} options.Cl_alpha - Lift curve slope (default: 6.0)
     * @param {number} options.CLmax - Maximum lift coefficient (default: 1.6)
     * @param {number} options.stallAngle - Stall angle in radians (default: 15°)
     * @returns {number} Lift coefficient
     */
    liftCoefficient(alpha, options = {}) {
        const { Cl_alpha = 6.0, CLmax = 1.6, stallAngle = 15 * Math.PI / 180 } = options;
        const absAlpha = Math.abs(alpha);
        
        if (absAlpha < stallAngle) {
            return Cl_alpha * alpha;
        } else {
            const sign = Math.sign(alpha);
            const postStall = CLmax * (1 - (absAlpha - stallAngle) / stallAngle * 0.5);
            return sign * Math.max(0, postStall);
        }
    },
    
    /**
     * Calculate drag coefficient based on lift coefficient
     * Uses induced drag formula: CD = CD0 + k * CL²
     * @param {number} CL - Lift coefficient
     * @param {Object} options - Optional parameters
     * @param {number} options.CD0 - Zero-lift drag coefficient (default: 0.022)
     * @param {number} options.AR - Aspect ratio (default: 7.6)
     * @param {number} options.e - Oswald efficiency factor (default: 0.8)
     * @returns {number} Drag coefficient
     */
    dragCoefficient(CL, options = {}) {
        const { CD0 = 0.022, AR = 7.6, e = 0.8 } = options;
        const k = 1 / (Math.PI * AR * e);
        return CD0 + k * CL * CL;
    },
    
    /**
     * Calculate thrust from throttle setting
     * @param {number} throttle - Throttle value (0 to 1)
     * @param {number} maxThrust - Maximum thrust in Newtons (default: 3500)
     * @returns {number} Thrust in Newtons
     */
    thrust(throttle, maxThrust = 3500) {
        return throttle * maxThrust;
    },
    
    /**
     * Calculate aerodynamic force magnitude
     * F = 0.5 * rho * V² * S * C
     * @param {number} q - Dynamic pressure (velocity squared)
     * @param {number} S - Wing area in m²
     * @param {number} C - Lift or drag coefficient
     * @returns {number} Force magnitude in Newtons
     */
    forceMagnitude(q, S, C) {
        return 0.5 * this.rho * q * q * S * C;
    }
};

window.AERODYNAMICS = AERODYNAMICS;
