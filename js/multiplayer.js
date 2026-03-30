// ========== MULTIPLAYER ==========
// Scene reference set via setMultiplayerScene() from main code
// Do NOT declare scene here - let main code declare it

function setMultiplayerScene(s) { window.mpScene = s; }

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
        const isHttps = window.location.protocol === 'https:' || 
                        window.location.hostname.endsWith('.soaringvibes.com');
        const protocol = isHttps ? 'wss:' : 'ws:';
        const host = window.location.hostname;
        const port = window.location.port || (protocol === 'wss:' ? 443 : 80);
        return `${protocol}//${host}:${port !== 80 && port !== 443 ? ':' + port : ''}/ws`;
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
            if (window.mpScene) window.mpScene.add(mesh);
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
            if (window.mpScene) window.mpScene.remove(mesh);
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

    sendUpdate(position, rotation, velocity, color, highlightColor, name) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'update',
                position: { x: position.x, y: position.y, z: position.z },
                rotation: { x: rotation.x, y: rotation.y, z: rotation.z },
                velocity: { x: velocity.x, y: velocity.y, z: velocity.z },
                color: color,
                highlightColor: highlightColor,
                name: name
            }));
        }
    }
}

let multiplayer = null;

function initMultiplayer(gameScene) {
    if (gameScene) setMultiplayerScene(gameScene);
    multiplayer = new MultiplayerClient();
    multiplayer.connect();
    
    setInterval(() => {
        if (typeof aircraft !== 'undefined' && multiplayer && multiplayer.connected) {
            const nameInput = document.getElementById('plane-name');
            const name = nameInput ? nameInput.value || 'Pilot' : 'Pilot';
            multiplayer.sendUpdate(
                aircraft.position,
                aircraft.rotation,
                aircraft.velocity,
                aircraft.colors?.main || '#ffffff',
                aircraft.colors?.highlight || '#0066cc',
                name
            );
        }
    }, 250);
}

function updateMultiplayer(aircraft) {
    if (multiplayer && multiplayer.connected) {
        const nameInput = document.getElementById('plane-name');
        const name = nameInput ? nameInput.value || 'Pilot' : 'Pilot';
        multiplayer.sendUpdate(
            aircraft.position,
            aircraft.rotation,
            aircraft.velocity,
            aircraft.mainColor,
            aircraft.highlightColor,
            name
        );
    }
}
