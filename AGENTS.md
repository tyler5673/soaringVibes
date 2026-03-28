# Flight Simulator Project

## Overview
Browser-based flight simulator using Three.js. Run with local server (e.g., `npx serve` or VS Code Live Server).

## Current State
- Islands now use real heightmap data from USGS 10m DEM for Hawaiian islands
- Heightmap-based terrain generation with proper elevation scaling
- Beautiful vertex coloring: beach at water level, lush green grass, forests, rocky cliffs, snow peaks
- Islands positioned based on real Hawaiian geography (scaled to ~1/8)
- Code split into modular files in `js/` directory

## Assets Downloaded
Downloaded from USGS 10m DEM ArcGIS service for Hawaiian islands:
- big-island.png (1024x1024) - Hawaii (Big Island) - max elevation ~4200m
- maui.png (1024x1024) - Maui - max elevation ~3055m
- oahu.png (1024x1024) - Oahu - max elevation ~1227m
- kauai.png (1024x1024) - Kauai - max elevation ~1598m
- molokai.png (1024x1024) - Molokai - max elevation ~1570m
- lanai.png (1024x1024) - Lanai - max elevation ~1026m
- niihau.png (1024x1024) - Niihau - max elevation ~381m
- kahoolawe.png (1024x1024) - Kahoolawe - max elevation ~450m

Metadata stored in corresponding `.json` files.

## Files
| File | Purpose |
|------|---------|
| index.html | Entry point |
| js/utils.js | Utility functions |
| js/controls.js | Input handling |
| js/aircraft.js | Aircraft class |
| js/camera.js | Orbit camera |
| js/environment.js | Sky, ocean, clouds |
| js/islands.js | Heightmap-based terrain generation |
| js/airport.js | Runway and buildings |
| js/wildlife.js | Birds and balloons |
| css/style.css | Styling |
| assets/heightmaps/ | Heightmap PNGs and metadata |

## Known Issues
- Heightmaps are 8-bit (limited precision) - server didn't support float32 export

## Next Steps
- Test with local server
- Verify island positions and terrain rendering
- Adjust terrain scale if needed
