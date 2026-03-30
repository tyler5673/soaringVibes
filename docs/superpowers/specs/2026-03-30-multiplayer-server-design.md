# Multiplayer Server Design

## Overview
WebSocket-based multiplayer server for the flight simulator game. Allows players to see each other's aircraft in real-time.

## Architecture

### Server
- **Framework:** FastAPI with uvicorn
- **Communication:** WebSocket (ws://)
- **Protocol:** JSON messages over WebSocket
- **Max Players:** 100 concurrent connections

### Hosting
- **Platform:** AWS EC2 t3.micro (free tier)
- **Domain:** tylereastman.net
- **Port:** 8000 (HTTP/WebSocket)
- **Connection:** New players can join mid-flight

## Data Format

### Client → Server
```json
{
  "type": "update",
  "position": {"x": 100.5, "y": 250.0, "z": -50.2},
  "rotation": {"x": 0.1, "y": 1.57, "z": 0.0}
}
```

### Server → Client
```json
{
  "type": "players",
  "players": {
    "uuid-1": {"position": {"x": 0, "y": 760, "z": -100}, "rotation": {...}},
    "uuid-2": {"position": {...}, "rotation": {...}}
  }
}
```

### Events
```json
{"type": "welcome", "your_id": "uuid"}
{"type": "player_joined", "player_id": "uuid"}
{"type": "player_left", "player_id": "uuid"}
{"type": "error", "message": "Server full"}
```

## Behavior

1. **On Connect:** Client receives `welcome` with their UUID
2. **On Join:** New player receives current `players` state; others receive `player_joined`
3. **Every 250ms:** Client sends position/rotation; server broadcasts all players
4. **On Disconnect:** Server removes player, broadcasts `player_left`
5. **Stale Detection:** Remove player if no update for 10 seconds

## Repository

**Separate repo:** `soaringvibes-multiplayer` (or similar)
- FastAPI application
- Deployment config (Docker or direct uvicorn)
- EC2 setup instructions

## Security
- No authentication (anonymous connections)
- Random UUID assigned on connect
- Basic input validation (ignore malformed messages)

## Next Steps
1. Create separate repository
2. Implement FastAPI server with WebSocket
3. Add WebSocket client to game
4. Render other players as aircraft
5. Deploy to EC2
6. Configure DNS
