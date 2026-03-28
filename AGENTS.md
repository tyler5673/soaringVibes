# Flight Simulator Project

## Overview
Browser-based flight simulator using Three.js. Run with local server (e.g., `npx serve` or VS Code Live Server).

## Current State
- Islands use noise-based organic terrain with vertex colors (beach/grass/rock/snow)
- Beach at water level (~2 units), Maui-style gentle mountains
- Flat airport area on main island
- Code split into modular files in `js/` directory

## Files
| File | Purpose |
|------|---------|
| index.html | Entry point |
| js/utils.js | Utility functions |
| js/controls.js | Input handling |
| js/aircraft.js | Aircraft class |
| js/camera.js | Orbit camera |
| js/environment.js | Sky, ocean, clouds |
| js/islands.js | Terrain generation |
| js/airport.js | Runway and buildings |
| js/wildlife.js | Birds and balloons |
| css/style.css | Styling |

## Known Issues
- None currently identified

## Next Steps
- Test modular code works with local server
- Continue refining island terrain if needed
- Add more complexity to islands
