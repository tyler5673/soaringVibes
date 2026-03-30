<img src="assets/images/logo.png" alt="Soaring Vibes" width="400">

# Soaring Vibes

A browser-based flight simulator featuring the Hawaiian islands, built with Three.js.

## Free Forever & Open Source

This project is **free forever** and **open source**. No paywalls, no premium features, no strings attached. Enjoy!

If you found this project compelling or useful and want to fuel the experiment, you can [buy me a coffee](https://ko-fi.com/tylereastman) ☕

## The Vibe-Coating Experiment

> *This entire project has been vibe coated.*

This flight simulator is an **agentic engineering experiment** to see just how complete a casual flight simulator can be created **without writing a single line of code manually** — only using prompts to steer the project.

Every line of code, every 3D model, the Cessna 182 aircraft, all palm trees and vegetation, every animation (propeller spin, control surfaces), the terrain, clouds, wildlife, airport buildings, and even this README — all of it was generated through AI prompts. Zero manual coding.

The models used were all locally hosted, primarily **Qwen3.5-27B** (with various smaller models) running on a home lab setup. All models are **open source**.

## Features

- **Real Hawaiian Islands**: All major Hawaiian islands with accurate heightmap data from USGS 10m DEM
- **Cessna 182 Skylane**: Detailed aircraft with animated propeller and control surfaces
- **Flight Physics**: Mass-based physics with thrust, lift, drag, and gravity
- **Procedural Vegetation**: Palm trees scattered across islands using terrain height lookup
- **Wildlife**: Birds and hot air balloons
- **Atmospheric Effects**: Dynamic clouds, fog, and ocean
- **Loading Screen**: Progress indicator while assets load

## Running

Start a local server in the project root:

```bash
npx serve
```

Then open http://localhost:3000 in your browser.

## Controls

| Key | Action |
|-----|--------|
| W/S | Pitch down/up |
| A/D | Roll left/right |
| Q/E | Rudder left/right |
| Shift | Increase thrust |
| Ctrl | Decrease thrust |
| Space | Toggle brakes |
| C | Change camera view |
| R | Reset aircraft |

## Architecture

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

## Technical Notes

- Islands use real heightmap data from USGS 10m DEM for Hawaiian islands (Big Island, Maui, Oahu, Kauai, Molokai, Lanai, Niihau, Kahoolawe)
- Heightmaps are 8-bit (limited precision) - the DEM server didn't support float32 export
- Islands positioned based on real Hawaiian geography (scaled to ~1/12)
- Vertex coloring based on elevation: beach, grass, forest, cliffs, snow peaks
- Clouds cluster around islands

## License

MIT — do whatever you want. This is free forever.

---

*Built with prompts. Fueled by vibes. Powered by open source.*
