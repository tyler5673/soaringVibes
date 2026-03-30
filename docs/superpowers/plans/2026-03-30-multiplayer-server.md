# Multiplayer Server Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a Python WebSocket server for flight simulator multiplayer and integrate it into the game client.

**Architecture:** FastAPI server with WebSocket handling, broadcasting player positions every 250ms. Separate repository for server, client integration into existing game.

**Tech Stack:** FastAPI, uvicorn, WebSocket (ws://), AWS EC2

---

## Part 1: Server Implementation (New Repository)

### Task 1: Create GitHub Repository

- [ ] Create new repository `soaringvibes-multiplayer` on GitHub via `gh repo create soaringvibes-multiplayer --public` (or private)
- [ ] Clone to local machine: `git clone git@github.com:tylereastman/soaringvibes-multiplayer.git`
- [ ] Navigate into directory

### Task 2: Initialize Python Project

- [ ] Create `requirements.txt`:
```text
fastapi>=0.100.0
uvicorn>=0.23.0
websockets>=11.0.0
python-dotenv>=1.0.0
pydantic>=2.0.0
```

- [ ] Create `pyproject.toml`:
```toml
[project]
name = "soaringvibes-multiplayer"
version = "0.1.0"
description = "Multiplayer server for flight simulator"
requires-python = ">=3.10"

[build-system]
requires = ["setuptools>=61.0"]
build-backend = "setuptools.build_meta"

[tool.uvicorn]
host = "0.0.0.0"
port = 8000
ws = "websockets"
```

- [ ] Install dependencies: `pip install -r requirements.txt`

### Task 3: Implement Server

**Files:**
- Create: `main.py`

```python
import asyncio
import json
import uuid
from datetime import datetime, timedelta
from typing import Any

import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import PlainTextResponse

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    asyncio.create_task(cleanup_stale_players())
    yield

app = FastAPI(lifespan=lifespan)

MAX_PLAYERS = 100
STALE_TIMEOUT = 10  # seconds

players: dict[str, dict[str, Any]] = {}
connections: dict[str, WebSocket] = {}


class ConnectionManager:
    async def connect(self, websocket: WebSocket, player_id: str):
        await websocket.accept()
        connections[player_id] = websocket

    def disconnect(self, player_id: str):
        connections.pop(player_id, None)
        players.pop(player_id, None)

    async def send_personal(self, message: dict, player_id: str):
        if player_id in connections:
            try:
                await connections[player_id].send_json(message)
            except Exception:
                self.disconnect(player_id)

    async def broadcast(self, message: dict, exclude: str | None = None):
        for player_id, websocket in list(connections.items()):
            if player_id != exclude:
                try:
                    await websocket.send_json(message)
                except Exception:
                    self.disconnect(player_id)


manager = ConnectionManager()


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    if len(players) >= MAX_PLAYERS:
        await websocket.accept()
        await websocket.send_json({"type": "error", "message": "Server full"})
        await websocket.close()
        return

    player_id = str(uuid.uuid4())
    players[player_id] = {
        "position": {"x": 0, "y": 0, "z": 0},
        "rotation": {"x": 0, "y": 0, "z": 0},
        "last_seen": datetime.now()
    }

    await manager.connect(websocket, player_id)

    await websocket.send_json({
        "type": "welcome",
        "your_id": player_id
    })

    await manager.broadcast({
        "type": "player_joined",
        "player_id": player_id
    }, exclude=player_id)

    await websocket.send_json({
        "type": "players",
        "players": {pid: {"position": p["position"], "rotation": p["rotation"]} 
                   for pid, p in players.items() if pid != player_id}
    })

    try:
        while True:
            data = await websocket.receive_json()
            
            if data.get("type") == "update":
                players[player_id]["position"] = data.get("position", {})
                players[player_id]["rotation"] = data.get("rotation", {})
                players[player_id]["last_seen"] = datetime.now()

    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(player_id)
        await manager.broadcast({
            "type": "player_left",
            "player_id": player_id
        })


async def cleanup_stale_players():
    while True:
        await asyncio.sleep(5)
        now = datetime.now()
        stale = [
            pid for pid, data in players.items()
            if now - data["last_seen"] > timedelta(seconds=STALE_TIMEOUT)
        ]
        for pid in stale:
            if pid in connections:
                try:
                    await connections[pid].close()
                except Exception:
                    pass
            manager.disconnect(pid)
            await manager.broadcast({"type": "player_left", "player_id": pid})


@app.get("/health")
async def health():
    return {"status": "ok", "players": len(players)}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, ws="websockets")
```

- [ ] Test server starts: `python main.py`
- [ ] Verify in another terminal: `curl http://localhost:8000/health`

### Task 4: Add Production Config

**Files:**
- Create: `Procfile`:
```
web: python main.py
```

- [ ] Test with: `python main.py` (verify it runs on 0.0.0.0:8000)

### Task 5: Push to GitHub

- [ ] Add, commit, push:
```bash
git add .
git commit -m "feat: initial multiplayer server"
git push origin main
```

---

## Part 2: Client Integration

### Task 6: Add WebSocket Client to Game

**Files:**
- Modify: `js/utils.js` or create new `js/multiplayer.js`

- [ ] Create `js/multiplayer.js`:
```javascript
// ========== MULTIPLAYER ==========
let scene = null;

function setMultiplayerScene(s) { scene = s; }

class MultiplayerClient {
    constructor() {
        this.ws = null;
        this.playerId = null;
        this.otherPlayers = new Map();
        this.serverUrl = this.getServerUrl();
        this.connected = false;
    }

    getServerUrl() {
        if (window.MULTIPLAYER_URL) return window.MULTIPLAYER_URL;
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.hostname;
        const port = window.location.port || 8000;
        return `${protocol}//${host}:${port}/ws`;
    }

    connect() {
        this.ws = new WebSocket(this.serverUrl);

        this.ws.onopen = () => {
            console.log('Connected to multiplayer server');
            this.connected = true;
        };

        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
        };

        this.ws.onclose = () => {
            console.log('Disconnected from multiplayer server');
            this.connected = false;
            setTimeout(() => this.connect(), 3000);
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    }

    handleMessage(data) {
        switch (data.type) {
            case 'welcome':
                this.playerId = data.your_id;
                break;
            case 'players':
                this.updateOtherPlayers(data.players);
                break;
            case 'player_joined':
                break;
            case 'player_left':
                this.removePlayer(data.player_id);
                break;
            case 'error':
                console.error('Server error:', data.message);
                break;
        }
    }

    updateOtherPlayers(players) {
        const currentIds = new Set(this.otherPlayers.keys());
        const newIds = new Set(Object.keys(players));

        for (const id of currentIds) {
            if (!newIds.has(id)) {
                this.removePlayer(id);
            }
        }

        for (const [id, data] of Object.entries(players)) {
            this.updatePlayer(id, data);
        }
    }

    updatePlayer(playerId, data) {
        let mesh = this.otherPlayers.get(playerId);
        
        if (!mesh) {
            mesh = this.createPlayerMesh();
            this.otherPlayers.set(playerId, mesh);
            if (scene) scene.add(mesh);
        }

        mesh.position.set(
            data.position.x,
            data.position.y,
            data.position.z
        );
        mesh.rotation.set(
            data.rotation.x,
            data.rotation.y,
            data.rotation.z
        );
    }

    removePlayer(playerId) {
        const mesh = this.otherPlayers.get(playerId);
        if (mesh) {
            scene.remove(mesh);
            this.otherPlayers.delete(playerId);
        }
    }

    createPlayerMesh() {
        const geometry = new THREE.ConeGeometry(0.5, 2, 8);
        geometry.rotateX(Math.PI / 2);
        const material = new THREE.MeshBasicMaterial({ color: 0xff6600 });
        const mesh = new THREE.Mesh(geometry, material);
        
        const cockpitGeom = new THREE.SphereGeometry(0.3, 8, 8);
        const cockpitMat = new THREE.MeshBasicMaterial({ color: 0x88ccff });
        const cockpit = new THREE.Mesh(cockpitGeom, cockpitMat);
        cockpit.position.y = 0.2;
        cockpit.position.z = -0.3;
        mesh.add(cockpit);

        return mesh;
    }

    sendUpdate(position, rotation) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'update',
                position: { x: position.x, y: position.y, z: position.z },
                rotation: { x: rotation.x, y: rotation.y, z: rotation.z }
            }));
        }
    }
}

let multiplayer = null;

function initMultiplayer(gameScene) {
    if (gameScene) setMultiplayerScene(gameScene);
    multiplayer = new MultiplayerClient();
    multiplayer.connect();
}

function updateMultiplayer(aircraft) {
    if (multiplayer && multiplayer.connected) {
        multiplayer.sendUpdate(aircraft.position, aircraft.rotation);
    }
}
```

- [ ] Modify `index.html` to load the script: Add `<script src="js/multiplayer.js"></script>` before other scripts

- [ ] Find where aircraft update loop runs in `js/aircraft.js` or main game loop, add:
```javascript
if (typeof updateMultiplayer === 'function') {
    updateMultiplayer(aircraft);
}
```

Set interval ~250ms for sending updates:
- In `initMultiplayer()`, add:
```javascript
setInterval(() => {
    if (typeof aircraft !== 'undefined' && multiplayer && multiplayer.connected) {
        updateMultiplayer(aircraft);
    }
}, 250);
```

---

## Part 3: Deployment

### Task 7: Deploy to EC2

- [ ] Launch EC2 t3.micro instance (Amazon Linux 2023)
- [ ] Security group: allow ports 8000 (TCP), 80, 443
- [ ] SSH into instance:
```bash
sudo yum update -y
sudo yum install python3 git -y
git clone <repo-url>
cd soaringvibes-multiplayer
pip3 install -r requirements.txt
python3 main.py &
```

- [ ] Test: `curl http://localhost:8000/health`

### Task 8: Configure DNS

- [ ] In Route 53 or domain registrar, create A record:
  - `tylereastman.net` → EC2 public IP
- [ ] Or CNAME: `multiplayer.tylereastman.net` → EC2 IP

### Task 9: Update Client Server URL

- [ ] Modify `js/multiplayer.js` to use correct URL for production
- [ ] Deploy updated game to hosting (wherever index.html is served from)

---

## Verification

- [ ] Multiple browser tabs connect to server
- [ ] Each tab sees other players as orange aircraft
- [ ] Disconnecting removes player
- [ ] Server health endpoint returns player count
- [ ] Deploy to EC2 and verify external connections work
