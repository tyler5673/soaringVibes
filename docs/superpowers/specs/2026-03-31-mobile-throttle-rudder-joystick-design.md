# Mobile Throttle+Rudder Joystick Design

## Overview

Replace the separate throttle slider and rudder slider widgets with a unified square joystick control on the left side of mobile screens. This consolidates two controls into one intuitive dual-axis interface similar to game controller thumbsticks.

## Motivation

- Current implementation has separate vertical throttle slider and horizontal rudder slider
- Rudder slider positioning issues (centering calculations, responsive behavior)
- Consolidating controls improves screen real estate and user experience
- Dual-axis joystick is familiar pattern from gaming controllers

## Requirements

### Visual Design
- Square zone container (not circular like pitch/roll joystick)
- Same dimensions as existing touch zones: 140x140px portrait, 180x180px landscape  
- Positioned on left side of screen (replaces current throttle slider location)
- Match existing aesthetic: semi-transparent background, border styling, glow effects

### Input Behavior
- **Vertical axis (Y)**: Throttle control
  - Up = increase throttle
  - Down = decrease throttle
  - Center position = 50% throttle
  - Full up = max throttle (1.0), full down = min throttle (0.0)
  - Value persists when user releases touch
  - Range: 0 to 1 (normalized)
  
- **Horizontal axis (X)**: Rudder/Yaw control
  - Left = left rudder input (-1)
  - Right = right rudder input (+1)
  - Center = no rudder (0)
  - Auto-centers with smooth animation on touch release
  - Range: -1 to 1 (normalized)

- **Diagonal movement**: Fully supported for simultaneous throttle + rudder adjustment

### Technical Constraints
- Mobile-only (touch screens only, hidden on desktop)
- Must work within existing `#touch-controls` container
- Integrate with existing `touchInput` state object in controls.js
- No breaking changes to aircraft physics or input processing

## Implementation Plan

### 1. HTML Structure
Add new widget inside `<div id="touch-controls">`:
```html
<div id="throttle-rudder-zone" class="throttle-rudder-container">
    <div class="throttle-rudder-zone-bg">
        <div id="throttle-rudder-stick" class="throttle-rudder-stick"></div>
    </div>
</div>
```

Remove existing:
- `<div id="throttle-zone">` and all children
- `<div id="rudder-zone">` and all children

### 2. CSS Styling

#### Container (`.throttle-rudder-container`)
- Position: `absolute`, left side, bottom-aligned
- Portrait: `left: 20px; bottom: 20px`
- Landscape: `left: 20px; bottom: 40px`
- Dimensions: 140x140px portrait, 180x180px landscape
- Pointer events enabled
- Touch-action: none

#### Zone Background (`.throttle-rudder-zone-bg`)
- Square with rounded corners (`border-radius: 15px`)
- Semi-transparent surface background
- Border styling matching existing touch zones
- Centered within container

#### Stick (`.throttle-rudder-stick`)
- Smaller square/circle centered in zone
- Primary color glow effect
- Absolute positioning for X/Y movement
- CSS transition on `left` property only (for rudder reset)
- No transition on `top` property (for throttle persistence)
- Visual feedback when at boundaries: subtle border highlight or glow intensification

### 3. JavaScript Logic

#### State Management
Update `touchInput` object in controls.js:
```javascript
const touchInput = {
    pitch: 0,      // existing from right joystick
    roll: 0,       // existing from right joystick  
    yaw: 0,        // rudder input (-1 to 1)
    throttle: 0.5, // throttle value (0 to 1), default = center position
};
```

#### Touch Event Handlers

**touchstart**: 
- Capture touch ID
- On touch anywhere within zone boundary, stick snaps to touch position (clamped to bounds)
- Calculate initial stick position from touch point
- Update both yaw and throttle immediately

**touchmove**:
- Track only the captured touch ID
- Multi-touch fully supported; each joystick tracks independent touch ID
- Normalize X position → `touchInput.yaw` (-1 to 1)
- Normalize Y position (inverted) → `touchInput.throttle` (0 to 1)
- Clamp values to valid ranges
- Update stick visual position

**touchend/touchcancel**:
- Reset yaw to 0 with CSS transition animation
- Keep throttle at last value (no change)
- Center stick horizontally, maintain vertical position
- Clear touch ID

#### Position Calculations
```javascript
// Get zone dimensions and center
const zoneRect = zoneBg.getBoundingClientRect();
const maxDistance = zoneRect.width / 2 - stickWidth / 2;

// Normalize touch position relative to center
const dx = clientX - centerX;
const dy = clientY - centerY; // positive = down

// Clamp to square boundary (not circle)
const normalizedX = clamp(dx / maxDistance, -1, 1);
const normalizedY = clamp(dy / maxDistance, -1, 1);

// Apply to input state
touchInput.yaw = normalizedX; // left negative, right positive
touchInput.throttle = Math.max(0, Math.min(1, 0.5 - (normalizedY * 0.5))); // inverted Y
```

### 4. Integration Points

#### Aircraft Input Processing

##### Throttle Mapping Formula
```javascript
// normalizedY: -1 (top) to +1 (bottom), 0 = center
// throttle: 1.0 (full up) to 0.0 (full down), 0.5 = center
touchInput.throttle = 0.5 - (normalizedY * 0.5);
```

In `aircraft.js` or wherever throttle is consumed:
- Read from `touchInput.throttle` instead of previous throttle slider value
- Full up = max throttle (1.0), center = cruise throttle (0.5), full down = min throttle (0.0)

#### Yaw Processing
Existing yaw processing should continue to work with `touchInput.yaw`
- No changes needed if already using this state object

### 5. Cleanup Tasks

Remove from codebase:
- `.throttle-container`, `.throttle-track`, `.throttle-handle` CSS classes and HTML elements
- `.rudder-container`, `.rudder-track`, `.rudder-handle` CSS classes and HTML elements  
- Throttle slider touch event handlers in controls.js (search for `throttle-zone`)
- Rudder slider touch event handlers in controls.js (search for `rudder-zone`, `resetRudderToCenter()`)
- References to `throttleHandle`, `rudderHandle` DOM elements

## Success Criteria

- [ ] Joystick appears on left side of mobile screens only
- [ ] Square zone with rounded corners, matching existing visual style
- [ ] Vertical movement adjusts throttle (persists when released)
- [ ] Horizontal movement adjusts rudder (auto-centers when released)
- [ ] Diagonal movement works for combined inputs
- [ ] Smooth CSS animation on horizontal reset
- [ ] No throttle/rudder sliders visible or functional
- [ ] Responsive sizing in landscape orientation
- [ ] No console errors or warnings

## Future Considerations

- Could add haptic feedback on boundary contact (if device supports)
- Optional visual indicator for current throttle percentage within zone
- Calibration option if users report center point drift
