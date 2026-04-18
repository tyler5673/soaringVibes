# Flight Simulator Project - Agent Guidelines

## Project Overview
Browser-based flight simulator using Three.js featuring the Hawaiian islands. Run with a local server (e.g., `npx serve` or VS Code Live Server).

## Current Features
- **Terrain**: Real heightmap data from USGS 10m DEM for Hawaiian islands (8 islands: Big Island, Maui, Oahu, Kauai, Molokai, Lanai, Niihau, Kahoolawe)
- **Ocean**: Dynamic Gerstner wave system with 3 LOD levels, follows camera with grid snapping, mobile-optimized segment counts
- **Aircraft**: Detailed Cessna 182 Skylane with animated propeller and control surfaces
- **Ecosystem**: Palm trees, native Hawaiian flora (koa, ohia, banyan, etc.), marine animals (whales, dolphins, sea turtles), birds (albatross, frigatebirds, nene)
- **Aircraft customization**: Custom name and color selection at spawn
- **Multiplayer**: WebSocket-based multiplayer at `wss://multiplayer.soaringvibes.com/ws`
- **Mobile support**: Touch controls with throttle slider and virtual joystick
- **Physics modes**: Arcade (default) and realistic flight physics with toggle in settings

## Technology Stack
- **Rendering**: Three.js (CDN: `https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js`)
- **Physics**: Custom aircraft physics (mass: 1100kg, wing area: 16m², max thrust: 3500N, max speed: 80m/s)
- **Testing**: Jest with jsdom environment

## File Structure
```
soaringVibes/
├── index.html                 # Main entry point
├── package.json               # Dependencies (jest, jsdom for testing)
├── AGENTS.md                  # This file
├── css/style.css              # Styling including loading screen
├── js/
│   ├── utils.js               # Utility functions (lerp, clamp, deg/rad conversion)
│   ├── controls.js            # Input handling (keyboard, touch, mouse)
│   ├── aircraft.js            # Cessna 182 with physics and animations
│   ├── camera.js              # Orbit camera with mouse/scroll controls
│   ├── environment.js         # Sky, ocean, clouds
│   ├── islands.js             # Heightmap terrain generation, getTerrainHeight()
│   ├── ocean.js               # Dynamic ocean system (Gerstner waves, LOD rings)
│   ├── airport.js             # Runway generation for Hawaiian airports
│   ├── airport-map-parser.js  # Parses airport map files for detailed layouts
│   ├── boats.js               # Boat manager (cruise ships, fishing boats)
│   ├── gauges.js              # SVG cockpit gauges (airspeed, altimeter)
│   ├── performance.js         # Performance monitor
│   ├── spatial-grid.js        # Spatial partitioning for culling
│   ├── multiplayer.js         # WebSocket multiplayer
│   ├── flora-manager.js       # Flora LOD and culling system
│   ├── fauna-manager.js       # Animal manager (marine, aerial, ground)
│   ├── building-manager.js    # Building placement and LOD system
│   └── hot-air-balloons.js    # Hot air balloon system
├── js/trees/                  # Tree species classes (17 types)
│   ├── palm.js, coconut-palm.js, koa.js, giant-koa.js
│   ├── ohia.js, banyan.js, tree-fern.js, ti-plant.js
│   ├── bamboo.js, wiliwili.js, shrub.js, grass.js
│   ├── ground-fern.js, naupaka.js, beach-morning-glory.js
│   └── driftwood.js, lava-rock.js
├── js/animals/                # Animal species classes (7 types)
│   ├── animal-base.js         # Base class for all animals
│   ├── whale.js, dolphin.js, seaturtle.js  # Marine animals
│   └── albatross.js, frigatebird.js, honeycreeper.js, nene.js  # Birds
├── js/buildings/              # Building geometry classes
│   ├── residential.js         # Small, medium, large homes
│   ├── commercial.js          # Shops, hotels, restaurants
│   └── lighthouse.js          # Lighthouse structures
├── viewer/                    # Asset viewer
├── tests/                     # Jest tests (aircraft-spawn.test.js, visibility.test.js)
├── docs/                      # Design documents
└── assets/
    ├── heightmaps/            # Heightmap PNGs + metadata JSONs
    ├── images/                # Logo and icon
    └── maps/                  # Airport maps (MAUI_airports_10m.txt)
```

## Key Systems

### Aircraft Physics
- Pitch, roll, yaw control with realistic flight dynamics
- Throttle affects thrust; drag reduces speed
- Lift proportional to speed² and angle of attack
- Stall at low speed; gravity always pulls down
- Collision detection via terrain heightmap (`getTerrainHeight()`)
- Spawns at ~2500 feet above Maui airport

### Physics Modes

**Arcade Mode (default):**
- Direct rotation rates for instant response
- Simplified lift/drag model
- Forgiving, no coordination required

**Realistic Mode:**
- Full aerodynamic model with lift/drag curves
- Control surface deflections create moments
- Adverse yaw requires rudder coordination
- Stall behavior at high angle of attack
- Control effectiveness varies with speed

### Flora System
- LOD system: 3 detail levels based on distance
- Spatial grid for efficient frustum culling
- Species-specific placement rules (elevation, biome)
- Beach species: palm, coconut-palm, naupaka, beach-morning-glory, driftwood
- Lowland: wiliwili, koa, ohia
- Mid-elevation: koa, giant-koa, banyan, tree-fern, ti-plant
- High elevation: ohia, tree-fern

### Fauna System
- Marine: whales, dolphins, sea turtles (follow waypoints)
- Aerial: albatross (soaring), frigatebird (thermal circling), honeycreeper (perching)
- Ground: nene (geese wandering)

### Multiplayer
- WebSocket connection to `wss://multiplayer.soaringvibes.com/ws`
- Position/name/color sync with interpolation
- Distance-based label rendering

### Performance
- Spatial grid for flora/fauna culling
- LOD system for vegetation
- Instanced rendering where applicable
- PerformanceMonitor class for FPS tracking

## Controls

### Desktop
- **W/S**: Pitch down/up
- **A/D**: Roll left/right
- **Q/E**: Yaw left/right
- **Shift/Ctrl**: Throttle up/down
- **Space**: Brake
- **R**: Reset aircraft
- **Mouse drag**: Orbit camera
- **Scroll**: Zoom

### Mobile
- Left side: Throttle slider
- Right side: Virtual joystick for pitch/roll
- Yaw buttons below joystick

## Known Issues
- Heightmaps are 8-bit (limited precision) - server didn't support float32 export
- Ocean waves use CPU-based vertex displacement (may impact very low-end devices)
- Foam effect not yet implemented (planned for future enhancement)
- No dynamic wave generation from aircraft/boat wakes (cosmetic only)
- Propeller effects (P-factor, slipstream, gyroscopic precession) disabled - caused uncontrolled yaw
- Realistic mode rotation uses quaternion integration (avoids gimbal lock at high pitch angles)

## Realistic Physics Coefficient Values (Current)

```
// Mass
mass = 1157 kg, wingArea = 16.165 m², wingspan = 10.9728 m, meanChord = 1.473 m

// Inertia
ixx = 1280, iyy = 1825, izz = 3200, ixz = 50

// Lift
CL0 = 0.1, CL_alpha = 4.5, CLmax = 1.4, alphaStall = 15°, alphaZeroLift = -2°

// Drag
CD0 = 0.03, e = 0.78

// Pitch
CM0 = 0.0, trimAlpha = 2.5°, CM_alpha = -0.2, CM_q = -15, CM_de = -0.05

// Roll
Cl_beta = -0.08, Cl_p = -0.4, Cl_dr = 0.008

// Yaw
Cn_beta = 0.03, Cn_r = -0.1, Cn_dr = 0.008, Cn_da = -0.001

// Side force
CY_beta = -0.3, CY_dr = 0.1

// Numerical angular damping: 3.0 per second (very light, aerodynamics provide real damping)
```

## Development Commands
```bash
npm test              # Run Jest tests
npm run test:watch   # Watch mode
npx serve            # Start local server
```

## External Resources
- Three.js CDN: `https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js`
- Multiplayer server: `wss://multiplayer.soaringvibes.com/ws`
- Ko-fi: `https://ko-fi.com/tylereastman`