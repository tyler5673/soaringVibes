# Flight Simulator Design

## Project Overview
Build a full-simulation flight simulator as an HTML5 web application using Three.js. The simulator features realistic flight physics, a lush tropical archipelago environment, and a third-person camera system.

## Technical Stack
- **Rendering Engine:** Three.js (WebGL)
- **Platform:** HTML5 (browser-based)
- **No frameworks** — vanilla JavaScript with Three.js

## Core Features

### Flight Physics (Full Simulation)
The flight physics model implements real aerodynamic principles:

- **Four forces:** Lift (perpendicular to airflow), Drag (opposes motion), Thrust (forward), Weight (downward)
- **Lift calculation:** L = 0.5 * ρ * v² * S * Cl where ρ is air density, v is velocity, S is wing area, Cl is lift coefficient
- **Drag calculation:** D = 0.5 * ρ * v² * S * Cd where Cd is drag coefficient
- **Angle of attack (AOA):** Angle between wing chord line and relative airflow — affects lift coefficient
- **Stall behavior:** When AOA exceeds critical angle (~15-20°), lift drops dramatically while drag increases
- **Control surfaces:**
  - Ailerons: Roll the aircraft (bank left/right)
  - Elevator: Pitch the aircraft (nose up/down)
  - Rudder: Yaw the aircraft (turn left/right)
- **Throttle:** Controls thrust output with realistic acceleration/deceleration
- **Ground effect:** Increased lift and reduced drag when near ground (within ~20m)

### Aircraft
- Single, well-detailed aircraft model
- Starting position: taxiing on runway at the airport
- Aircraft has proper landing gear, wings, tail, cockpit

### Camera System
- **Third-person view** positioned behind and slightly above the aircraft
- **Orbit control:** Mouse movement rotates camera around the aircraft (azimuth and elevation)
- **Zoom control:** Scroll wheel adjusts camera distance from aircraft
- **Smooth follow:** Camera position and orientation smoothly interpolates to follow aircraft
- Default camera distance: 15-20 units, adjustable range: 5-50 units

### Controls (Keyboard)
| Key | Action |
|-----|--------|
| W / Up Arrow | Pitch down (nose down) |
| S / Down Arrow | Pitch up (nose up) |
| A / Left Arrow | Roll left (bank left) |
| D / Right Arrow | Roll right (bank right) |
| Q | Yaw left (rudder left) |
| E | Yaw right (rudder right) |
| Shift | Increase throttle |
| Ctrl | Decrease throttle |
| Space | Brakes (only effective on ground) |
| R | Reset aircraft to starting position |

### Environment

#### Archipelago Setting
- Multiple tropical islands scattered in ocean
- Each island has varied terrain: beaches, mountains, forests
- Realistic water shader for ocean with waves and reflections
- Atmospheric fog for distance and depth
- Daytime lighting with sun and sky

#### Airport
- Located on the main island
- Concrete runway with markings
- Taxiways and apron areas
- Control tower and terminal buildings
- Starting position at runway threshold

#### Animated Elements
- **Clouds:** Volumetric-style cloud meshes that drift across the sky
- **Birds:** Small bird models flying in patterns around islands
- **Hot air balloons:** Colorful balloons floating at various altitudes
- **Wildlife:** Simple animal models on islands (optional, adds atmosphere)
- **Vegetation:** Palm trees, jungle foliage on islands

#### Buildings
- Tropical-themed buildings: resorts, houses, shops
- Airport structures: terminal, hangar, control tower
- Beach structures: restaurants, beach bars

## Architecture

### File Structure
```
project/
├── index.html          # Main HTML file
├── css/
│   └── style.css       # UI styles (instruments, HUD)
├── js/
│   ├── main.js        # Entry point, scene setup
│   ├── aircraft.js    # Aircraft class, physics
│   ├── camera.js      # Orbit camera controller
│   ├── controls.js   # Keyboard input handling
│   ├── environment.js # Islands, ocean, sky
│   ├── assets.js      # Asset loading utilities
│   └── utils.js       # Helper functions
├── assets/
│   └── models/        # 3D model files (GLTF/GLB)
└── docs/
    └── specs/         # Design documents
```

### Key Classes

**Aircraft**
- Properties: position, rotation, velocity, throttle, control surfaces
- Methods: update(dt), applyControl(input), getPhysicsState()
- Handles all flight physics calculations

**OrbitCamera**
- Properties: target (aircraft), distance, azimuth, elevation
- Methods: update(dt), handleMouseMove(delta), handleScroll(delta)
- Smooth interpolation for following aircraft

**Environment**
- Methods: createOcean(), createSky(), createIslands(), createAirport()
- Manages all environment objects and animations

**InputManager**
- Methods: isKeyDown(key), getControlInput()
- Provides unified input state to aircraft

## Implementation Phases

### Phase 1: Core Setup
- Set up Three.js scene, camera, renderer
- Create basic aircraft placeholder
- Implement keyboard controls
- Basic flight physics (simplified)

### Phase 2: Flight Physics
- Implement full aerodynamic model
- Add stall behavior
- Add ground effect
- Tune physics parameters

### Phase 3: Camera System
- Implement orbit camera
- Add mouse orbit controls
- Add scroll zoom
- Smooth camera following

### Phase 4: Environment
- Create ocean with shader
- Create sky with lighting
- Create islands with terrain
- Create airport with runway

### Phase 5: Animated Elements
- Add clouds
- Add birds
- Add hot air balloons
- Add wildlife/buildings

### Phase 6: Polish
- Add HUD (speed, altitude, throttle)
- Add aircraft model (detailed)
- Optimize performance
- Add sound (optional)

## Acceptance Criteria

1. ✅ Aircraft responds to all keyboard controls
2. ✅ Flight physics exhibits realistic behavior: lift, drag, stalls at high AOA
3. ✅ Camera orbits around aircraft with mouse movement
4. ✅ Scroll wheel zooms camera in/out
5. ✅ Environment shows tropical archipelago with multiple islands
6. ✅ Airport with runway visible at starting location
7. ✅ Animated clouds, birds, and balloons present
8. ✅ Performance: maintains 30+ FPS on modern hardware
9. ✅ Aircraft starts on runway, ready to take off

## Future Considerations (Out of Scope)
- Missions or objectives
- Multiple aircraft
- Multiplayer
- VR support
- Complex instrument panel
- Fuel/consumables management
