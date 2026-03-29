# Biome-Specific Flora and Fauna Design

## Overview
Implement biome-appropriate vegetation and animated wildlife for the Hawaiian flight simulator with performance optimizations.

## Current State
- **Flora**: Only palm trees on a 50-unit grid, all islands use same tree type
- **Fauna**: 30 simple black birds (cones), 5 hot air balloons - no biome specificity
- **Performance**: Basic distance culling at 1000 units for trees

## Biome Classification (Existing)
| Biome | Criteria | Color |
|-------|----------|-------|
| Water | y ≤ 2 | - |
| Beach | y < 15, slope < 3 | Sand/beige |
| Grassland | y < 50, slope < 5 | Light green |
| Shrubland | y < 150, slope < 15 | Olive green |
| Forest | y < 300, slope < 25 | Dark green |
| Cliff | slope > 30 | Gray rock |
| Rock | else | Dark gray |

## Proposed Flora System

### Vegetation Types

| Biome | Primary | Secondary | Density |
|-------|---------|-----------|---------|
| **Beach** | Coconut palms (slender, curved) | Beach morning glory vines | Sparse |
| **Grassland** | Pili grass tufts (tall yellow-green) | Scattered ilima shrubs | Low |
| **Shrubland** | Koa shrubs (multi-trunk) | Hibiscus, 'a'ali'i | Medium |
| **Forest** | Koa/Ohia trees (tall, spreading) | Fern understory patches | High |
| **Cliff** | Low wind-scrub, hardy succulents | Lichen-covered rocks | Very sparse |
| **Rock** | Lichens/moss patches | Occasional hardy shrubs | Minimal |

### Tree Specifications

#### Palm Tree (Beach)
- Trunk: 8-12m tall, slight curve, segmented texture
- Fronds: 7-9 feather-like leaves, green-yellow
- Lod: High=detailed fronds, Med=simple cones, Far=crossed planes

#### Koa Tree (Forest)
- Trunk: 15-25m, spreading branches, gray-brown bark
- Canopy: Wide spreading, compound leaves
- Lod: High=branch geometry+leaves, Med=rounded canopy, Far=sphere

#### Ohia Tree (Forest/Shrubland)
- Trunk: 5-15m, gnarled, reddish bark
- Canopy: Rounded, red Lehua flowers
- Lod: High=detailed bark+flowers, Med=simple canopy, Far=sphere

#### Koa Shrub (Shrubland)
- Multiple thin trunks (2-5), 3-5m tall
- Fine leaves, gray-green
- Lod: High=individual branches, Med=bush shape, Far=sphere

#### Grass Tuft (Grassland)
- Clumped tall grass, 0.5-1.5m
- Yellow-green, sways in wind
- Lod: High=individual blades, Med=clump shape, Far=billboard

### Performance Targets
- Max 500 visible trees within 1000-unit radius
- Frustum culling: skip rendering behind camera
- LOD transitions at 300m (high→med), 800m (med→far)
- Occlusion: Skip rendering trees behind terrain cliffs

## Proposed Fauna System

### Marine Life

#### Humpback Whale (Ocean)
- **Appearance**: 12-15m length, black with white markings, visible blowhole spray
- **Behavior**: 
  - Surface swimming with periodic breaching (5-10 min intervals)
  - Tail slap, spy hop, blow spray particle effect
  - Travel in pods of 2-4
- **Animation**: Sinusoidal body undulation, tail fluke movement
- **Render**: 1500 units, LOD reduces to simple shape at distance

#### Spinner Dolphin (Near-shore)
- **Appearance**: 2m length, gray with lighter underside
- **Behavior**: 
  - Fast swimming in pods (10-30 individuals)
  - Occasional spinning jumps out of water
  - Follow coastlines
- **Animation**: Porpoising motion, jump physics when excited
- **Render**: 1200 units

#### Green Sea Turtle (Ocean surface)
- **Appearance**: 1m shell, brown-green, flippers visible
- **Behavior**: 
  - Slow surface swimming
  - Occasional dives (disappear for 30-60 seconds)
  - Basking on rocks (rare)
- **Animation**: Flipper paddling, breathing at surface
- **Render**: 600 units

#### Tropical Fish Schools (Shallow reef areas)
- **Appearance**: Small (0.2-0.5m), bright colors, schooling
- **Behavior**: 
  - Move as coordinated school
  - Flash and scatter when aircraft approaches
- **Animation**: Schooling behavior, darting movements
- **Render**: 400 units

### Birds

#### Albatross (Open ocean)
- **Appearance**: Large (wingspan 2-3m), white/black, long narrow wings
- **Behavior**: 
  - Dynamic soaring - ride wind gradients
  - Glide in long circles, rarely flap
  - Scavenge surface for food
- **Animation**: Wing adjustments for soaring, banking turns
- **Render**: 2000 units (highly visible)

#### Frigatebird (Coastal/cliffs)
- **Appearance**: Large (wingspan 1.8m), black with red throat pouch (males)
- **Behavior**: 
  - Soaring near cliffs and coast
  - Harass other birds for food
  - Rarely land on water
- **Animation**: Soaring with tail spread, occasional dives
- **Render**: 2000 units

#### Hawaiian Honeycreepers (Forest)
- **Appearance**: Small (0.1m), colorful (red, yellow, green)
- **Behavior**: 
  - Perch on Ohia trees
  - Feed on nectar from Lehua flowers
  - Quick darting flight between trees
- **Animation**: Perching, hopping, feeding animation
- **Render**: 300 units (only visible up close)

#### Nene (Hawaiian Goose) (Grassland/shoreline)
- **Appearance**: Medium (0.6m), brown, distinctive face pattern
- **Behavior**: 
  - Walk and graze in small flocks (3-8)
  - Honk when disturbed
  - Fly in formation when startled
- **Animation**: Walking gait, head bobbing, wing flaps when flying
- **Render**: 800 units

### Performance Targets
- Max 20 active animals in view
- Update rate: 30fps for nearby, 10fps for distant
- Animation LOD: Skip detailed animations beyond 500 units
- Object pooling: Maintain pools of 50 birds, 20 marine animals

## Implementation Phases

### Phase 1: Flora Variations
1. Create biome-specific tree generation functions
2. Replace grid system with biome-aware placement
3. Add LOD switching for trees
4. Implement frustum culling

### Phase 2: Marine Life
1. Create whale model with breaching animation
2. Add dolphin pod behavior
3. Implement sea turtle swimming
4. Add ocean surface detection for spawning

### Phase 3: Birds
1. Albatross and frigatebird soaring behavior
2. Honeycreeper perching system on trees
3. Nene flocking behavior
4. Bird animation state machine

### Phase 4: Polish
1. Particle effects (whale spray, bird flocks)
2. Sound integration (calls, splashes)
3. Adaptive density based on performance
4. Spawn/despawn management

## Technical Requirements

### New Files
- `js/flora.js` - Tree generation by biome, LOD management
- `js/fauna.js` - Animal classes, behaviors, animation
- `js/performance.js` - Frustum culling, LOD switching, object pooling

### Modified Files
- `js/islands.js` - Integrate biome-aware tree placement
- `js/wildlife.js` - Replace with new fauna system
- `index.html` - Update animation loop for LOD updates

### Performance Metrics
- Target 60fps on mid-range hardware
- Tree draw calls: <200 per frame
- Animal updates: <50 per frame
- Memory: <100MB for all vegetation

## Success Criteria
- [ ] 5+ distinct tree types matching biomes
- [ ] 8+ animal species with unique behaviors
- [ ] Consistent 60fps with all features active
- [ ] Seamless LOD transitions (no popping)
- [ ] Animals feel alive (varied movement, reactions)
