# Island Maps

## Sources

### Heightmaps (assets/heightmaps/)
Data downloaded from USGS 10m DEM via PacIOOS ERDDAP service:
- https://pae-paha.pacioos.hawaii.edu/erddap/
- Original data from USGS 1/3 arc-second DEM quadrangles
- Coordinate system: EPSG:4326 (WGS84)

### Land Cover (this directory)
Data downloaded from Hawaii State GIS Program:
- Source: Carbon Assessment of Hawaii - Biome Unit
- Service: ArcGIS REST API via geodata.hawaii.gov
- URL: https://geodata.hawaii.gov/arcgis/rest/services/LandUseLandCover_Raster/MapServer/export
- Layer: 2 (Biome Unit)

## Bounding Coordinates (lat/lng)

All values from USGS PacIOOS metadata (exact):

### Hawaii (Big Island)
- North: 20.310696845612735
- South: 18.861803665309147
- East: -154.75671076144639
- West: -156.12486296186597

### Maui
- North: 21.031363703651188
- South: 20.574418740849925
- East: -155.9790147408373
- West: -156.6971637036512

### Oahu
- North: 21.712412752206696
- South: 21.254794138987258
- East: -157.6486640799658
- West: -158.28092225298528

### Kauai
- North: 22.238843653393445
- South: 21.8551371481648
- East: -159.28180443330066
- West: -159.79838227902235

### Molokai
- North: 21.224127027458906
- South: 21.046067348013413
- East: -156.70987086760655
- West: -157.31081071139295

### Lanai
- North: 20.92936330044028
- South: 20.73178950730314
- East: -156.80536990808585
- West: -157.0621973224075

### Niihau
- North: 22.02845014502927
- South: 21.778478902016587
- East: -160.04946654636794
- West: -160.24703641028984

### Kahoolawe
- North: 20.637269737328893
- South: 20.49699071402145
- East: -156.49069436182018
- West: -156.7041221827599

## Airports

Real airport locations (lat/lng):

| Island | Airport | Latitude | Longitude |
|--------|---------|----------|-----------|
| Maui | Kahului (OGG) | 20.8922 | -156.4381 |
| Oahu | Honolulu (HNL) | 21.3258 | -157.9217 |
| Big Island | Kona (KOA) | 19.7367 | -156.0407 |
| Big Island | Hilo (ITO) | 19.7203 | -155.0481 |
| Kauai | Lihue (LIH) | 21.9786 | -159.3422 |
| Molokai | Molokai (MKK) | 21.1517 | -157.0912 |
| Lanai | Lanai (LNY) | 20.7856 | -156.9514 |

## Map Files

### `{island}-airport.png` (1024x1024)
Airport location markers overlaid on terrain:
- Black = no data / ocean
- Grayscale = elevation data
- Red dots = airport locations

### `{island}-landcover.png` (1024x1024)
Land cover / vegetation data from Carbon Assessment of Hawaii:

| Color | Biome Type | Description |
|-------|------------|-------------|
| Dark Green | Wet Forest | Tropical wet forests (ohia, koa) |
| Medium Green | Wet Shrubland | Wet shrubland and brush |
| Light Green | Wet Grassland | Wet grasslands and meadows |
| Dark Teal | Mesic Forest | Mesic (moderately moist) forests |
| Teal | Mesic Shrubland | Mesic shrubland |
| Light Teal | Mesic Grassland | Mesic grasslands |
| Brown | Dry Forest | Dry forest (kiawe, alien species) |
| Tan | Dry Shrubland | Dry shrubland |
| Yellow-Tan | Dry Grassland | Dry grasslands |
| Pink | Agriculture | Cultivated agricultural areas |
| Gray | Developed | Urban/developed areas |
| White | Not Vegetated | Bare rock, lava, sand |

## Coordinate Transformation

To convert lat/lng to pixel position in the map:
1. Normalize lat/lng to 0-1 range using bounding coordinates
2. Scale to 0-1023 for pixel position

Note: The heightmaps were exported with specific bounds that may not cover the full lat/lng range. The actual island position in each image may be offset from (0,0).
