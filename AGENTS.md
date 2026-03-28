# Flight Simulator Project

## Overview
Browser-based flight simulator using Three.js. Run with local server (e.g., `npx serve` or VS Code Live Server).

## Current State
- Islands use real heightmap data from USGS 10m DEM for Hawaiian islands
- Heightmap-based terrain generation with proper elevation scaling via metadata JSON files
- All islands green with vertex coloring based on elevation (beach, grass, forest, cliffs, snow peaks)
- Islands positioned based on real Hawaiian geography (scaled to ~1/12)
- Detailed Cessna 182 Skylane aircraft with animated propeller and control surfaces
- Palm trees scattered across islands using terrain height lookup
- Loading screen with progress indicator
- Clouds cluster around islands

## Assets
Downloaded from USGS 10m DEM ArcGIS service for Hawaiian islands:
- big-island.png + .json (max elevation ~4200m)
- maui.png + .json (max elevation ~3055m)
- oahu.png + .json (max elevation ~1227m)
- kauai.png + .json (max elevation ~1598m)
- molokai.png + .json (max elevation ~1570m)
- lanai.png + .json (max elevation ~1026m)
- niihau.png + .json (max elevation ~381m)
- kahoolawe.png + .json (max elevation ~450m)

## Files
| File | Purpose |
|------|---------|
| index.html | Entry point with fog and loading screen |
| js/utils.js | Utility functions |
| js/controls.js | Input handling |
| js/aircraft.js | Cessna 182 with animations and physics |
| js/camera.js | Orbit camera |
| js/environment.js | Sky, ocean, clouds |
| js/islands.js | Heightmap terrain, getTerrainHeight, palm trees |
| js/airport.js | Runway and buildings on Maui |
| js/wildlife.js | Birds and balloons |
| css/style.css | Styling including loading screen |
| assets/heightmaps/ | Heightmap PNGs + metadata JSONs |

## Aircraft Physics (Cessna 182 Skylane)
- Mass: 1100 kg
- Wing area: 16 m²
- Max thrust: 3500 N
- Max speed: 80 m/s
- Spawns at ~2500 feet above Maui airport

## Known Issues
- Heightmaps are 8-bit (limited precision) - server didn't support float32 export
