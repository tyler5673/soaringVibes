# Flight Simulator Project - Agent Guidelines

## Project Overview
Browser-based flight simulator using Three.js featuring the Hawaiian islands. Run with a local server (e.g., `npx serve` or VS Code Live Server).

## Current Features
- **Terrain**: Real heightmap data from USGS 10m DEM for Hawaiian islands (8 islands: Big Island, Maui, Oahu, Kauai, Molokai, Lanai, Niihau, Kahoolawe)
- **Aircraft**: Detailed Cessna 182 Skylane with animated propeller and control surfaces
- **Ecosystem**: Palm trees, native Hawaiian flora (koa, ohia, banyan, etc.), marine animals (whales, dolphins, sea turtles), birds (albatross, frigatebirds, nene)
- **Aircraft customization**: Custom name and color selection at spawn
- **Multiplayer**: WebSocket-based multiplayer at `wss://multiplayer.soaringvibes.com/ws`
- **Mobile support**: Touch controls with throttle slider and virtual joystick

## Technology Stack
- **Rendering**: Three.js (CDN: `https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js`)
- **Physics**: Custom aircraft physics (mass: 1100kg, wing area: 16m², max thrust: 3500N, max speed: 80m/s)
- **Testing**: Jest with jsdom environment

## File Structure
```
soaringVibes/
├── index.html              # Main entry point
├── package.json            # Dependencies (sharp, utm)
├── AGENTS.md               # This file
├── css/style.css           # Styling including loading screen
├── js/
│   ├── utils.js            # Utility functions
│   ├── controls.js         # Input handling (keyboard, touch, mouse)
│   ├── aircraft.js         # Cessna 182 with physics and animations
│   ├── camera.js          # Orbit camera with mouse/scroll controls
│   ├── environment.js      # Sky, ocean, clouds
│   ├── islands.js          # Heightmap terrain generation, getTerrainHeight()
│   ├── airport.js         # Runway and buildings on Maui
│   ├── wildlife.js        # Birds and balloons (legacy)
│   ├── boats.js           # Boat manager
│   ├── gauges.js          # SVG cockpit gauges (airspeed, altimeter)
│   ├── performance.js     # Performance monitor
│   ├── spatial-grid.js    # Spatial partitioning for culling
│   ├── multiplayer.js     # WebSocket multiplayer
│   ├── flora-manager.js   # Flora LOD and culling system
│   ├── fauna-manager.js   # Animal manager
│   ├── hot-air-balloons.js# Hot air balloon system
│   ├── trees/             # Tree species classes
│   │   ├── palm.js, coconut-palm.js, koa.js, giant-koa.js
│   │   ├── ohia.js, banyan.js, tree-fern.js, ti-plant.js
│   │   ├── bamboo.js, wiliwili.js, shrub.js, grass.js
│   │   ├── ground-fern.js, naupaka.js, beach-morning-glory.js
│   │   ├── driftwood.js, lava-rock.js
│   └── animals/           # Animal species classes
│       ├── animal-base.js, whale.js, dolphin.js
│       ├── seaturtle.js, albatross.js, frigatebird.js
│       ├── honeycreeper.js, nene.js
├── viewer/                # Asset viewer
├── tests/                 # Jest tests
├── docs/                  # Design documents
└── assets/
    ├── heightmaps/        # Heightmap PNGs + metadata JSONs
    ├── images/            # Logo and icon
    └── maps/              # Airport maps
```

## Key Systems

### Aircraft Physics
- Pitch, roll, yaw control with realistic flight dynamics
- Throttle affects thrust; drag reduces speed
- Lift proportional to speed² and angle of attack
- Stall at low speed; gravity always pulls down
- Collision detection via terrain heightmap (`getTerrainHeight()`)
- Spawns at ~2500 feet above Maui airport

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