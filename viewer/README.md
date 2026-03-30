# 3D Asset Viewer

Interactive viewer for all 3D models in the Soaring Vibes flight simulator.

## Running

```bash
npx serve
# Then open http://localhost:3000/viewer/index.html
```

Or use any static file server:
```bash
python3 -m http.server 3000
```

## Features

- **Auto-discovery**: Automatically loads all models from `model-manifest.json`
- **Model browsing**: Browse 26 models across 4 categories (Aircraft, Trees, Animals, Effects)
- **Interactive 3D view**: Orbit, zoom, and pan around models
- **Search and filter**: Search by name or filter by category
- **Animation playback**: Play/pause with speed control for animated models
- **Model statistics**: View bounding box dimensions, vertex and face counts
- **Animation detection**: Automatically detects and plays propeller rotation and wing flapping animations

## Adding New Models

To add a new model to the viewer:

1. Create your model script in the appropriate folder:
   - Aircraft: `js/aircraft.js` (or create new aircraft file)
   - Trees: `js/trees/your-tree.js`
   - Animals: `js/animals/your-animal.js`
   - Effects: `js/effects/your-effect.js`

2. Export your model class/function globally:
   ```javascript
   class YourModel {
     constructor() {
       this.mesh = this.createMesh();
     }
     createMesh() {
       // Create and return THREE.Group or THREE.Mesh
       return new THREE.Mesh(geometry, material);
     }
   }
   window.YourModel = YourModel;
   ```

3. Add an entry to `viewer/model-manifest.json`:
   ```json
   {
     "id": "your-model",
     "name": "Your Model Name",
     "category": "trees",
     "script": "../js/trees/your-tree.js",
     "export": "YourModel",
     "description": "Brief description of your model"
   }
   ```

4. The model will automatically appear in the viewer on next load

## Controls

- **Left drag**: Rotate view
- **Right drag**: Pan
- **Scroll**: Zoom in/out
- **Play/Pause**: Toggle animation playback
- **Speed slider**: Adjust animation speed (0x to 3x)

## Architecture

The viewer consists of:

- `index.html` - Entry point with UI layout
- `viewer.css` - Dark theme styling
- `viewer.js` - Main scene, camera, renderer, and model loading
- `model-registry.js` - Central registry for discovered models
- `auto-discovery.js` - Dynamic script loading and model detection
- `controls.js` - Animation controller and UI bindings
- `model-manifest.json` - List of all available models

## Browser Requirements

- Modern browser with WebGL support
- Chrome, Firefox, Safari, or Edge (2020+)

## Known Limitations

- The manifest requires manual updating (browsers cannot scan directories due to security)
- Some models may not have animations (static geometry only)
- Hot air balloon and terrain elements are not included (discrete models only)