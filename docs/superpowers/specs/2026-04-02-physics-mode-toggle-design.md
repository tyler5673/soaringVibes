# Physics Mode Toggle Design

**Date:** 2026-04-02  
**Status:** Draft  
**Author:** AI Agent

## Overview

Add a configuration setting allowing users to toggle between arcade physics (current implementation) and realistic flight physics. Default mode is arcade. Switching takes effect immediately without resetting aircraft state.

## Architecture

### Strategy Pattern

Two physics classes implementing a common interface:

- **`ArcadePhysics`** - Current simplified physics (extracted from Aircraft class)
- **`RealisticPhysics`** - New realistic flight model
- **`Aircraft`** - Delegates physics calculations to active strategy

### File Structure

```
js/
├── physics/
│   ├── arcade-physics.js      # Extracted current physics
│   └── realistic-physics.js   # New realistic model
├── aircraft.js                # Modified to use physics strategy
├── config.js                  # Add physics mode setting
└── index.html                 # Add physics toggle to settings
```

## Realistic Physics Model

### Aerodynamic Forces

**Lift:**
```
L = 0.5 * ρ * V² * S * Cl
```
- ρ = air density (1.225 kg/m³)
- V = airspeed (m/s)
- S = wing area (16 m²)
- Cl = lift coefficient (varies with angle of attack)

**Lift Coefficient Curve:**
- Linear region: `Cl = Clα * α` (up to ~15°)
- Stall region: Sharp drop in Cl beyond critical angle
- Deep stall: Reduced Cl, high Cd

**Drag:**
```
Cd = Cd0 + Cl² / (π * e * AR)
D = 0.5 * ρ * V² * S * Cd
```
- Cd0 = zero-lift drag coefficient (~0.025)
- e = Oswald efficiency factor (~0.8)
- AR = aspect ratio (wingspan²/area)

**Side Force:**
- From sideslip angle (β)
- Rudder creates side force for coordination

### Control Surfaces

**Elevator (pitch control):**
- Deflection creates pitching moment
- `M_pitch = 0.5 * ρ * V² * S * Cm_elevator * δe`
- δe = elevator deflection angle

**Ailerons (roll control):**
- Deflection creates rolling moment
- **Adverse yaw:** Down-going aileron creates more drag, causing yaw opposite to roll
- Requires rudder coordination for coordinated turns

**Rudder (yaw control):**
- Deflection creates yawing moment
- Used to coordinate turns and counteract adverse yaw

### Propeller Effects

**Thrust:**
- Varies with airspeed (decreases at high speed)
- `T = T_max * (V0 / V)` where V0 is design speed

**P-Factor:**
- Asymmetric thrust in climbs (descending blade sees higher angle of attack)
- Creates left-turning tendency in climbs

**Torque:**
- Rolling moment from propeller rotation
- Requires right aileron to counteract

**Gyroscopic Precession:**
- Pitching creates yawing moment (and vice versa)
- 90° phase lag from applied force

### Moments & Rotations

**Angular Dynamics:**
```
I * dω/dt = M_applied - M_damping
```
- I = moment of inertia (pitch, roll, yaw)
- ω = angular velocity
- M = applied moment

**Damping:**
- All axes have aerodynamic damping
- `M_damping = -k * ω` where k scales with speed²

**Control Effectiveness:**
- Scales with dynamic pressure (½ρV²)
- Sluggish at low speeds, responsive at high speeds

## Control Mapping

### Input Processing

**Both modes use same inputs:**
- Keyboard: WASD (pitch/roll), QE (yaw/rudder), Shift/Ctrl (throttle)
- Touch: Right stick (pitch/roll), left zone (throttle/yaw)

### Arcade Mode

**Direct rotation rates:**
```
rotation.pitch += input.pitch * pitchRate * delta
rotation.roll -= input.roll * rollRate * delta
rotation.yaw += input.yaw * yawRate * delta
```

**Characteristics:**
- Instant response
- Forgiving, no coordination required
- Yaw directly turns aircraft

### Realistic Mode

**Input → Deflection → Moment → Angular Accel → Angular Velocity → Rotation:**

1. **Deflection:**
   - `δe = input.pitch * maxElevatorDeflection`
   - `δa = input.roll * maxAileronDeflection`
   - `δr = input.yaw * maxRudderDeflection`

2. **Moments:**
   - `M_pitch = q * S * c * Cm_e * δe`
   - `M_roll = q * S * b * Cl_a * δa`
   - `M_yaw = q * S * b * Cn_r * δr + adverse_yaw`

3. **Angular Acceleration:**
   - `α_pitch = M_pitch / I_pitch`
   - `α_roll = M_roll / I_roll`
   - `α_yaw = M_yaw / I_yaw`

4. **Angular Velocity:**
   - `ω += α * delta`
   - Apply damping: `ω *= (1 - dampingCoeff * delta)`

5. **Rotation:**
   - `rotation += ω * delta`

**Characteristics:**
- Delayed response (inertia)
- Requires coordination (rudder with aileron)
- Speed-dependent effectiveness
- Realistic stall behavior

## Config & UI

### Settings Modal

**New Section:** "Flight Physics" (positioned before Abby Mode)

**Toggle Switch:**
- Label: "Realistic Physics"
- Default: OFF (arcade mode)
- Immediate effect on toggle

**Visual Feedback:**
- Current mode displayed: "Arcade" or "Realistic"
- Controls hint updates based on mode

### Config Storage

```javascript
{
  physicsMode: 'arcade' | 'realistic',
  // ... other settings
}
```

- Persist to localStorage
- Load on startup
- Apply immediately on change

### Controls Hint

**Arcade Mode:**
```
"WASD: Pitch/Roll | QE: Yaw | Shift/Ctrl: Throttle | Space: Brake | R: Reset | C: Config"
```

**Realistic Mode:**
```
"WASD: Pitch/Roll | QE: Rudder (coordinate turns) | Shift/Ctrl: Throttle | Space: Brake | R: Reset | C: Config"
```

## Implementation Details

### Aircraft Class Modifications

```javascript
class Aircraft {
  constructor(colors) {
    // ... existing properties
    
    this.physicsMode = 'arcade'; // Default
    this.physics = new ArcadePhysics(this);
  }
  
  setPhysicsMode(mode) {
    this.physicsMode = mode;
    if (mode === 'arcade') {
      this.physics = new ArcadePhysics(this);
    } else {
      this.physics = new RealisticPhysics(this);
    }
  }
  
  update(delta) {
    // Delegate to physics strategy
    this.physics.update(delta);
    
    // Update mesh position/rotation
    this.mesh.position.copy(this.position);
    this.mesh.rotation.copy(this.rotation);
    
    // Apply auto-brake
    this.applyAutoBrake(delta);
  }
}
```

### Physics Interface

Both physics classes implement:

```javascript
class PhysicsStrategy {
  constructor(aircraft) {
    this.aircraft = aircraft;
  }
  
  update(delta) {
    // Calculate forces
    // Update velocity
    // Update position
    // Update rotation
  }
}
```

### Realistic Physics Constants

```javascript
// Cessna 182 Skylane
const PHYSICS = {
  mass: 1100,              // kg
  wingArea: 16,            // m²
  wingspan: 11,            // m
  aspectRatio: 7.56,       // b²/S
  
  // Moments of inertia (approximate)
  I_pitch: 1200,           // kg·m²
  I_roll: 800,            // kg·m²
  I_yaw: 1800,             // kg·m²
  
  // Aerodynamic coefficients
  Cl_alpha: 5.7,          // per radian (≈0.1 per degree)
  Cl_max: 1.5,
  Cd0: 0.025,
  e: 0.8,                 // Oswald efficiency
  
  // Control effectiveness
  Cm_elevator: -1.2,
  Cl_aileron: 0.15,
  Cn_rudder: 0.1,
  
  // Control limits
  maxElevatorDeflection: 25,  // degrees
  maxAileronDeflection: 20,
  maxRudderDeflection: 25,
  
  // Damping
  pitchDamping: 0.5,
  rollDamping: 0.8,
  yawDamping: 0.3,
  
  // Propeller
  maxThrust: 3500,        // N
  propDiameter: 2.0,      // m
};
```

## Testing

### Manual Testing Checklist

**Arcade Mode (Regression):**
- [ ] Controls feel identical to current implementation
- [ ] No changes to existing behavior
- [ ] All current features work (reset, crash detection, etc.)

**Realistic Mode:**
- [ ] Takeoff requires runway, gradual rotation
- [ ] Stall at high angle of attack, recovery with nose down
- [ ] Adverse yaw visible during rolls
- [ ] Coordinated turns require rudder
- [ ] Ground handling with steering
- [ ] Control effectiveness varies with speed

**Mode Switching:**
- [ ] Switch mid-flight (immediate, no crash)
- [ ] Switch at low altitude (maintain state)
- [ ] Switch while stalled (recoverable)
- [ ] Touch controls work in both modes
- [ ] Setting persists across sessions

**Performance:**
- [ ] No FPS impact
- [ ] Same delta time handling

### Edge Cases

- Switching modes during extreme attitudes
- Switching while in ground effect
- Switching with zero airspeed
- Touch vs keyboard input consistency

## Success Criteria

1. **Arcade mode unchanged:** Current players experience no difference
2. **Realistic mode feels authentic:** Flight sim enthusiasts recognize realistic behavior
3. **Easy to switch:** One toggle, immediate effect
4. **No performance impact:** Both modes run at same FPS
5. **Touch-friendly:** Both modes work on mobile

## Future Enhancements

- Add flap system (separate from physics toggle)
- Add trim controls for realistic mode
- Add ground steering physics
- Add propeller feathering
- Add mixture control
- Add weight & balance effects

## References

- Cessna 182 Skylane POH (Pilot's Operating Handbook)
- NASA Technical Report: "General Aviation Aircraft Aerodynamics"
- X-Plane flight model documentation
- FlightGear physics implementation
