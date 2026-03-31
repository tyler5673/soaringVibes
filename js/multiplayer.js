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
        
        let port = window.location.port ? parseInt(window.location.port, 10) : null;
        if (!port) {
            port = protocol === 'wss:' ? 443 : 80;
        }
        
        const portString = (port !== 80 && port !== 443) ? ':' + port : '';
        return `${protocol}//${host}${portString}/ws`;
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
        
        // Check if colors changed
        const newColors = {
            main: data.color || '#ffffff',
            highlight: data.highlightColor || '#0066cc'
        };
        
        if (!mesh) {
            // Create new mesh with the player's colors
            mesh = this.createPlayerMesh(newColors);
            mesh.userData.playerId = playerId;
            mesh.userData.name = data.name || 'Pilot';
            mesh.userData.lastUpdate = Date.now();
            
            // Add name label (3D sprite for close range)
            const label = this.createNameLabel(data.name || 'Pilot');
            label.position.set(0, 2.5, 0); // Above aircraft
            mesh.add(label);
            mesh.userData.label = label;
            
            // Create 2D HTML distance dot for far range
            const dotElement = this.createDistanceDotElement(newColors.main, newColors.highlight, playerId, data.name || 'Pilot');
            mesh.userData.distanceDotElement = dotElement;
            
            this.otherPlayers.set(playerId, mesh);
            if (window.mpScene) window.mpScene.add(mesh);
        } else {
            // Check if colors need to be updated
            const currentColors = mesh.userData.colors;
            if (currentColors && 
                (currentColors.main !== newColors.main || 
                 currentColors.highlight !== newColors.highlight)) {
                this.updatePlayerColors(mesh, newColors);
            }
            
            // Update name if changed
            if (data.name && data.name !== mesh.userData.name) {
                mesh.userData.name = data.name;
                if (mesh.userData.label) {
                    mesh.remove(mesh.userData.label);
                    const newLabel = this.createNameLabel(data.name);
                    newLabel.position.set(0, 2.5, 0);
                    mesh.add(newLabel);
                    mesh.userData.label = newLabel;
                }
                // Update dot tooltip
                if (mesh.userData.distanceDotElement) {
                    mesh.userData.distanceDotElement.title = data.name || 'Unknown Pilot';
                }
            }
            mesh.userData.lastUpdate = Date.now();
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
        
        // Animate propeller based on velocity
        if (mesh.userData.propeller && data.velocity) {
            const speed = Math.sqrt(
                data.velocity.x ** 2 + 
                data.velocity.y ** 2 + 
                data.velocity.z ** 2
            );
            // Spin propeller based on speed (simple animation)
            const throttle = Math.min(speed / 60, 1); // Estimate throttle from speed
            mesh.userData.propeller.rotation.z += throttle * 0.5;
        }
    }

    updatePlayerColors(mesh, colors) {
        mesh.userData.colors = colors;
        
        // Update body material
        if (mesh.userData.bodyMat) {
            mesh.userData.bodyMat.color.set(colors.main);
        }
        
        // Update stripe/highlight material
        if (mesh.userData.stripeMat) {
            mesh.userData.stripeMat.color.set(colors.highlight);
        }
        
        // Update 2D distance dot colors (target style: outer=highlight, inner=main)
        if (mesh.userData.distanceDotElement && mesh.userData.distanceDotElement.userData) {
            const dotData = mesh.userData.distanceDotElement.userData;
            if (dotData.outerDot) {
                dotData.outerDot.style.backgroundColor = colors.highlight;
            }
            if (dotData.innerDot) {
                dotData.innerDot.style.backgroundColor = colors.main;
            }
        }
    }

    createNameLabel(name) {
        // Create canvas for text
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 64;
        
        // Draw background
        context.fillStyle = 'rgba(0, 0, 0, 0.6)';
        context.roundRect(0, 0, 256, 64, 8);
        context.fill();
        
        // Draw text
        context.font = 'bold 32px Arial, sans-serif';
        context.fillStyle = 'white';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(name, 128, 32);
        
        // Create texture and sprite
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ 
            map: texture,
            transparent: true,
            opacity: 0.9
        });
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(3, 0.75, 1);
        
        return sprite;
    }

    updateLabels(camera, renderer) {
        const maxLabelDistance = 1219.2; // 4000ft in meters (4000 * 0.3048)
        const dotThreshold = 1524; // 5000ft in meters (5000 * 0.3048)
        
        // Get CSS pixel dimensions (not internal canvas buffer size)
        const width = renderer.domElement.clientWidth || window.innerWidth;
        const height = renderer.domElement.clientHeight || window.innerHeight;
        
        for (const [playerId, mesh] of this.otherPlayers) {
            if (!mesh) continue;
            
            const cameraPosition = camera.position;
            const distance = mesh.position.distanceTo(cameraPosition);
            const label = mesh.userData.label;
            const dotElement = mesh.userData.distanceDotElement;
            
            // Determine what to show based on distance
            const showDot = distance >= dotThreshold;
            const showLabel = distance <= maxLabelDistance && !showDot;
            const showDetailed = !showDot;
            
            // Update label visibility (3D sprite label)
            if (label) {
                label.visible = showLabel;
                if (label.visible) {
                    const scale = Math.max(1.5, distance / 50);
                    label.scale.set(scale * 3, scale * 0.75, 1);
                }
            }
            
            // Show/hide detailed 3D mesh
            mesh.visible = showDetailed;
            
            // Update 2D distance dot position and visibility
            if (dotElement) {
                if (showDot) {
                    // Convert 3D world position to 2D screen coordinates
                    const screenPos = mesh.position.clone().project(camera);
                    
                    // Check if the point is in front of the camera (z < 1)
                    if (screenPos.z < 1) {
                        // Convert normalized device coordinates (-1 to 1) to CSS pixels
                        // screenPos.x: -1 (left) to 1 (right)
                        // screenPos.y: 1 (top) to -1 (bottom) in NDC, so we flip Y
                        const x = (screenPos.x + 1) / 2 * width;
                        const y = (1 - screenPos.y) / 2 * height;
                        
                        dotElement.style.display = 'block';
                        dotElement.style.left = `${x}px`;
                        dotElement.style.top = `${y}px`;
                    } else {
                        // Behind camera, hide the dot
                        dotElement.style.display = 'none';
                    }
                } else {
                    dotElement.style.display = 'none';
                }
            }
        }
    }

    removePlayer(playerId) {
        const mesh = this.otherPlayers.get(playerId);
        if (mesh) {
            // Remove 3D mesh from scene
            if (window.mpScene) window.mpScene.remove(mesh);
            
            // Remove 2D distance dot element
            if (mesh.userData.distanceDotElement) {
                const dot = mesh.userData.distanceDotElement;
                if (dot.parentNode) {
                    dot.parentNode.removeChild(dot);
                }
            }
            
            this.otherPlayers.delete(playerId);
        }
    }

    createPlayerMesh(colors) {
        const group = new THREE.Group();
        
        const mainColor = colors?.main || '#ffffff';
        const highlightColor = colors?.highlight || '#0066cc';
        
        const bodyMat = new THREE.MeshStandardMaterial({ 
            color: mainColor, 
            roughness: 0.4, 
            metalness: 0.1 
        });
        const stripeMat = new THREE.MeshStandardMaterial({ 
            color: highlightColor, 
            roughness: 0.4 
        });
        const glassMat = new THREE.MeshStandardMaterial({ 
            color: 0x4488cc, 
            transparent: true, 
            opacity: 0.5, 
            roughness: 0.02, 
            metalness: 0.1,
            side: THREE.DoubleSide
        });
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.85 });
        const strutMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.3, metalness: 0.6 });
        const metalMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.7, roughness: 0.4 });
        const silverMat = new THREE.MeshStandardMaterial({ color: 0xc0c0c0, metalness: 0.9, roughness: 0.2 });
        const blackMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.8 });
        const bladeMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.8, roughness: 0.3 });
        
        // Cessna 172 dimensions
        const fuselageLength = 6.8;
        const fuselageRadius = 0.6;
        
        // Main fuselage
        const fuselageGeo = new THREE.CylinderGeometry(fuselageRadius * 0.7, fuselageRadius, fuselageLength, 16);
        fuselageGeo.rotateX(Math.PI / 2);
        const fuselage = new THREE.Mesh(fuselageGeo, bodyMat);
        fuselage.position.z = 0.2;
        fuselage.userData = { isBody: true };
        group.add(fuselage);
        
        // Nose section
        const noseLength = 1.2;
        const noseGeo = new THREE.CylinderGeometry(fuselageRadius * 0.95, fuselageRadius * 0.3, noseLength, 16);
        noseGeo.rotateX(Math.PI / 2);
        const nose = new THREE.Mesh(noseGeo, bodyMat);
        nose.position.z = -3.6;
        nose.userData = { isBody: true };
        group.add(nose);
        
        // Engine cowling (highlight color)
        const cowlingLength = 1.0;
        const cowlingRadius = 0.65;
        const cowlingGeo = new THREE.CylinderGeometry(cowlingRadius, cowlingRadius * 0.9, cowlingLength, 16);
        cowlingGeo.rotateX(Math.PI / 2);
        const cowling = new THREE.Mesh(cowlingGeo, stripeMat);
        cowling.position.z = -2.9;
        cowling.userData = { isStripe: true };
        group.add(cowling);
        
        // Cowling cowl flap
        const cowlFlap = new THREE.Mesh(
            new THREE.TorusGeometry(cowlingRadius, 0.02, 8, 16),
            metalMat
        );
        cowlFlap.position.z = -2.45;
        cowlFlap.rotation.x = Math.PI / 2;
        group.add(cowlFlap);
        
        // Spinner
        const spinnerBody = new THREE.Mesh(
            new THREE.SphereGeometry(0.18, 16, 12),
            silverMat
        );
        spinnerBody.scale.set(1.8, 1, 1);
        spinnerBody.position.z = -3.3;
        spinnerBody.rotation.x = Math.PI / 2;
        group.add(spinnerBody);
        
        // Spinner stripes
        const spinnerStripeTop = new THREE.Mesh(
            new THREE.SphereGeometry(0.17, 16, 12),
            stripeMat
        );
        spinnerStripeTop.scale.set(1.68, 0.95, 0.95);
        spinnerStripeTop.position.z = -3.05;
        spinnerStripeTop.rotation.x = Math.PI * 0.38;
        spinnerStripeTop.userData = { isStripe: true };
        group.add(spinnerStripeTop);
        
        const spinnerStripeBottom = new THREE.Mesh(
            new THREE.SphereGeometry(0.17, 16, 12),
            stripeMat
        );
        spinnerStripeBottom.scale.set(1.68, 0.95, 0.95);
        spinnerStripeBottom.position.z = -3.05;
        spinnerStripeBottom.rotation.x = Math.PI * 0.62;
        spinnerStripeBottom.userData = { isStripe: true };
        group.add(spinnerStripeBottom);
        
        // Cockpit
        const cockpitY = 0.75;
        const cabinWidth = 0.9;
        const cabinHeight = 0.55;
        const cabinLength = 2.2;
        const cockpit = new THREE.Mesh(
            new THREE.BoxGeometry(cabinWidth, cabinHeight, cabinLength),
            glassMat
        );
        cockpit.position.set(0, cockpitY, -0.1);
        group.add(cockpit);
        
        // Propeller (3-bladed)
        const propeller = new THREE.Group();
        for (let i = 0; i < 3; i++) {
            const bladeGroup = new THREE.Group();
            const blade = new THREE.Mesh(new THREE.BoxGeometry(0.09, 1.9, 0.14), bladeMat);
            blade.position.y = 0.95;
            blade.scale.z = 0.85;
            bladeGroup.add(blade);
            const tip = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.22, 0.11), bladeMat);
            tip.position.y = 1.9;
            bladeGroup.add(tip);
            bladeGroup.rotation.z = (i * Math.PI * 2) / 3;
            propeller.add(bladeGroup);
        }
        propeller.position.z = -4.0;
        propeller.userData = { isPropeller: true };
        group.add(propeller);
        group.userData.propeller = propeller; // Store for animation
        
        // High wing
        const wingSpan = 11;
        const wingChord = 1.55;
        const wingThickness = 0.17;
        const wingY = 0.95;
        
        // Wing root fairing
        const wingRootFairing = new THREE.Mesh(
            new THREE.BoxGeometry(1.8, 0.28, wingChord * 1.15),
            bodyMat
        );
        wingRootFairing.position.set(0, wingY, -0.15);
        wingRootFairing.userData = { isBody: true };
        group.add(wingRootFairing);
        
        // Wing struts
        const strutWingX = 1.85;
        const strutFuselageX = 0.35;
        const strutFuselageY = -0.25;
        const strutZ = 0.12;
        const run = strutWingX - strutFuselageX;
        const rise = wingY - strutFuselageY;
        const strutLen = Math.sqrt(run * run + rise * rise);
        const strutAngle = Math.atan2(rise, run);
        
        [-1, 1].forEach(side => {
            const midX = (strutFuselageX + strutWingX) / 2;
            const midY = (strutFuselageY + wingY) / 2;
            const strut = new THREE.Mesh(
                new THREE.CylinderGeometry(0.07, 0.055, strutLen, 10),
                strutMat
            );
            strut.position.set(side * midX, midY, strutZ);
            strut.rotation.z = side * -strutAngle;
            group.add(strut);
        });
        
        // Main wing panels
        const wingPanelWidth = wingSpan / 2 - 0.75;
        const leftWing = new THREE.Mesh(
            new THREE.BoxGeometry(wingPanelWidth, wingThickness, wingChord * 1.1),
            bodyMat
        );
        leftWing.position.set(-(wingPanelWidth / 2 + 0.75), wingY, -0.15);
        leftWing.userData = { isBody: true };
        group.add(leftWing);
        
        const rightWing = new THREE.Mesh(
            new THREE.BoxGeometry(wingPanelWidth, wingThickness, wingChord * 1.1),
            bodyMat
        );
        rightWing.position.set(wingPanelWidth / 2 + 0.75, wingY, -0.15);
        rightWing.userData = { isBody: true };
        group.add(rightWing);
        
        // Wing tip fairings
        const leftWingTip = new THREE.Mesh(
            new THREE.BoxGeometry(0.32, wingThickness * 1.6, wingChord * 0.35),
            bodyMat
        );
        leftWingTip.position.set(-wingSpan / 2 + 0.15, wingY + 0.08, -wingChord * 0.3);
        leftWingTip.rotation.z = -0.22;
        leftWingTip.userData = { isBody: true };
        group.add(leftWingTip);
        
        const rightWingTip = new THREE.Mesh(
            new THREE.BoxGeometry(0.32, wingThickness * 1.6, wingChord * 0.35),
            bodyMat
        );
        rightWingTip.position.set(wingSpan / 2 - 0.15, wingY + 0.08, -wingChord * 0.3);
        rightWingTip.rotation.z = 0.22;
        rightWingTip.userData = { isBody: true };
        group.add(rightWingTip);
        
        // Wing tips with stripes (highlight color)
        const tipGeo = new THREE.BoxGeometry(0.22, wingThickness * 1.8, wingChord * 0.45);
        const leftTip = new THREE.Mesh(tipGeo, stripeMat);
        leftTip.position.set(-wingSpan / 2, wingY + 0.12, -0.25);
        leftTip.rotation.z = -0.25;
        leftTip.userData = { isStripe: true };
        group.add(leftTip);
        
        const rightTip = new THREE.Mesh(tipGeo, stripeMat);
        rightTip.position.set(wingSpan / 2, wingY + 0.12, -0.25);
        rightTip.rotation.z = 0.25;
        rightTip.userData = { isStripe: true };
        group.add(rightTip);
        
        // Navigation lights
        const wingTipX = wingSpan / 2 + 0.15;
        const navLightGeo = new THREE.SphereGeometry(0.065, 10, 8);
        const redNavMat = new THREE.MeshStandardMaterial({ 
            color: 0xff0000, 
            emissive: 0xff0000, 
            emissiveIntensity: 1.2 
        });
        const greenNavMat = new THREE.MeshStandardMaterial({ 
            color: 0x00ff00, 
            emissive: 0x00ff00, 
            emissiveIntensity: 1.2 
        });
        
        const leftNav = new THREE.Mesh(navLightGeo, redNavMat);
        leftNav.position.set(-wingTipX, wingY + 0.06, -0.25);
        group.add(leftNav);
        
        const rightNav = new THREE.Mesh(navLightGeo, greenNavMat);
        rightNav.position.set(wingTipX, wingY + 0.06, -0.25);
        group.add(rightNav);
        
        // Strobe lights
        const strobeGeo = new THREE.SphereGeometry(0.05, 8, 6);
        const strobeMat = new THREE.MeshStandardMaterial({ 
            color: 0xffffff, 
            emissive: 0xffffff, 
            emissiveIntensity: 2.0 
        });
        const leftStrobe = new THREE.Mesh(strobeGeo, strobeMat);
        leftStrobe.position.set(-wingTipX - 0.05, wingY + 0.1, -0.35);
        group.add(leftStrobe);
        
        const rightStrobe = new THREE.Mesh(strobeGeo, strobeMat);
        rightStrobe.position.set(wingTipX + 0.05, wingY + 0.1, -0.35);
        group.add(rightStrobe);
        
        // Tail section
        const tailZ = 3.6;
        const vStabHeight = 1.85;
        const vStabChord = 1.4;
        const vStabY = 0.15;
        
        // Vertical stabilizer
        const vStab = new THREE.Mesh(
            new THREE.BoxGeometry(0.14, vStabHeight, vStabChord),
            bodyMat
        );
        vStab.position.set(0, vStabY + vStabHeight / 2, tailZ);
        vStab.rotation.y = -0.15;
        vStab.userData = { isBody: true };
        group.add(vStab);
        
        // Leading edge fairing
        const vStabLeading = new THREE.Mesh(
            new THREE.CylinderGeometry(0.11, 0.15, vStabHeight, 8),
            bodyMat
        );
        vStabLeading.position.set(0, vStabY + vStabHeight / 2, tailZ - vStabChord * 0.35);
        vStabLeading.rotation.x = -0.08;
        vStabLeading.scale.set(1, 1, 0.3);
        vStabLeading.userData = { isBody: true };
        group.add(vStabLeading);
        
        // Rudder
        const rudderHeight = vStabHeight * 0.7;
        const rudderChord = vStabChord * 0.5;
        const rudder = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, rudderHeight, rudderChord),
            bodyMat
        );
        rudder.position.set(0, vStabY + rudderHeight / 2 - 0.1, tailZ + vStabChord * 0.25);
        rudder.rotation.y = -0.15;
        rudder.userData = { isBody: true };
        group.add(rudder);
        
        // Rudder stripe (highlight color)
        const rudderStripe = new THREE.Mesh(
            new THREE.BoxGeometry(0.08, rudderHeight * 0.5, rudderChord * 0.6),
            stripeMat
        );
        rudderStripe.position.set(0, vStabY + rudderHeight * 0.4, tailZ + vStabChord * 0.22);
        rudderStripe.rotation.y = -0.15;
        rudderStripe.userData = { isStripe: true };
        group.add(rudderStripe);
        
        // Tail beacon
        const tailBeacon = new THREE.Mesh(
            new THREE.SphereGeometry(0.05, 8, 6),
            new THREE.MeshStandardMaterial({ 
                color: 0xffffff, 
                emissive: 0xffffff, 
                emissiveIntensity: 2.0 
            })
        );
        tailBeacon.position.set(0, vStabY + vStabHeight + 0.15, tailZ - vStabChord * 0.2);
        group.add(tailBeacon);
        
        // Horizontal stabilizer
        const hStabSpan = 3.4;
        const hStabChord = 0.95;
        const hStabY = 0.12;
        
        const leftHStab = new THREE.Mesh(
            new THREE.BoxGeometry(hStabSpan / 2 - 0.1, 0.08, hStabChord),
            bodyMat
        );
        leftHStab.position.set(-hStabSpan / 4 - 0.15, hStabY, tailZ);
        leftHStab.userData = { isBody: true };
        group.add(leftHStab);
        
        const rightHStab = new THREE.Mesh(
            new THREE.BoxGeometry(hStabSpan / 2 - 0.1, 0.08, hStabChord),
            bodyMat
        );
        rightHStab.position.set(hStabSpan / 4 + 0.15, hStabY, tailZ);
        rightHStab.userData = { isBody: true };
        group.add(rightHStab);
        
        // Stabilizer tip fairings
        [-1, 1].forEach(side => {
            const tip = new THREE.Mesh(
                new THREE.BoxGeometry(0.2, 0.08, 0.5),
                bodyMat
            );
            tip.position.set(side * (hStabSpan / 2 + 0.08), hStabY + 0.02, tailZ - 0.1);
            tip.rotation.z = side * 0.12;
            tip.userData = { isBody: true };
            group.add(tip);
        });
        
        // Elevator
        const elevatorSpan = hStabSpan * 0.9;
        const elevatorChord = hStabChord * 0.55;
        const elevator = new THREE.Mesh(
            new THREE.BoxGeometry(elevatorSpan, 0.08, elevatorChord),
            bodyMat
        );
        elevator.position.set(0, hStabY + 0.02, tailZ + hStabChord * 0.25);
        elevator.userData = { isBody: true };
        group.add(elevator);
        
        // Landing gear
        const noseWheelY = -0.85;
        const noseWheelZ = -2.3;
        const mainWheelY = -0.9;
        const mainWheelZ = 1.2;
        const mainWheelSpread = 1.25;
        
        const noseAttachY = -0.25;
        const noseAttachZ = -1.8;
        const mainAttachY = -0.3;
        const mainAttachX = 0.65;
        
        // Nose gear strut
        const noseStrutLen = Math.sqrt(
            Math.pow(noseWheelY - noseAttachY, 2) + 
            Math.pow(noseWheelZ - noseAttachZ, 2)
        );
        const noseStrutAngle = Math.atan2(noseWheelY - noseAttachY, noseWheelZ - noseAttachZ);
        
        const noseStrut = new THREE.Mesh(
            new THREE.CylinderGeometry(0.05, 0.04, noseStrutLen, 8),
            strutMat
        );
        noseStrut.position.set(0, (noseAttachY + noseWheelY) / 2, (noseAttachZ + noseWheelZ) / 2);
        noseStrut.rotation.x = noseStrutAngle + Math.PI / 2;
        group.add(noseStrut);
        
        // Nose wheel
        const noseWheel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.16, 0.16, 0.1, 14),
            wheelMat
        );
        noseWheel.rotation.z = Math.PI / 2;
        noseWheel.position.set(0, noseWheelY, noseWheelZ);
        group.add(noseWheel);
        
        // Main gear struts and wheels
        [-1, 1].forEach(side => {
            const strutLen = Math.sqrt(
                Math.pow(mainWheelY - mainAttachY, 2) + 
                Math.pow(mainWheelSpread - mainAttachX, 2)
            );
            const outwardAngle = Math.atan2(mainWheelSpread - mainAttachX, mainAttachY - mainWheelY);
            
            const strut = new THREE.Mesh(
                new THREE.CylinderGeometry(0.06, 0.05, Math.abs(mainAttachY - mainWheelY) + 0.1, 8),
                strutMat
            );
            strut.position.set(
                side * (mainAttachX + mainWheelSpread) / 2,
                (mainAttachY + mainWheelY) / 2,
                mainWheelZ
            );
            strut.rotation.z = side * outwardAngle;
            group.add(strut);
            
            const wheel = new THREE.Mesh(
                new THREE.CylinderGeometry(0.2, 0.2, 0.12, 14),
                wheelMat
            );
            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(side * mainWheelSpread, mainWheelY, mainWheelZ);
            group.add(wheel);
        });
        
        // Antennas
        const vor = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.3, 6), metalMat);
        vor.position.set(-0.05, vStabY + vStabHeight + 0.2, tailZ - vStabChord * 0.2);
        group.add(vor);
        
        const pitot = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.012, 0.22, 6), blackMat);
        pitot.rotation.z = Math.PI / 2;
        pitot.position.set(-3.5, wingY + 0.08, -wingChord * 0.45);
        group.add(pitot);
        
        const stallHorn = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.035, 0.09), blackMat);
        stallHorn.position.set(-3.5, wingY - 0.08, wingChord * 0.1);
        group.add(stallHorn);
        
        // Store materials for color updates
        group.userData.bodyMat = bodyMat;
        group.userData.stripeMat = stripeMat;
        group.userData.colors = { main: mainColor, highlight: highlightColor };
        
        group.castShadow = true;
        return group;
    }

    createDistanceDotElement(mainColor, highlightColor, playerId, name) {
        // Create container for target dot
        const container = document.createElement('div');
        container.className = 'distance-indicator-dot';
        container.id = `distance-dot-${playerId}`;
        container.style.cssText = `
            position: absolute;
            width: 20px;
            height: 20px;
            pointer-events: none;
            z-index: 1000;
            display: none;
            transform: translate(-50%, -50%);
        `;
        
        // Create outer dot (highlight color)
        const outerDot = document.createElement('div');
        outerDot.style.cssText = `
            position: absolute;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background-color: ${highlightColor};
            border: 2px solid rgba(255, 255, 255, 0.9);
            box-shadow: 0 0 8px rgba(0, 0, 0, 0.5);
            top: 0;
            left: 0;
        `;
        
        // Create inner dot (main color)
        const innerDot = document.createElement('div');
        innerDot.style.cssText = `
            position: absolute;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background-color: ${mainColor};
            border: 1px solid rgba(255, 255, 255, 0.8);
            top: 5px;
            left: 5px;
        `;
        
        // Add dots to container
        container.appendChild(outerDot);
        container.appendChild(innerDot);
        
        // Add tooltip with player name
        container.title = name || 'Unknown Pilot';
        
        // Store references to inner/outer dots for color updates
        container.userData = {
            outerDot: outerDot,
            innerDot: innerDot
        };
        
        // Add to container
        const dotsContainer = document.getElementById('distance-dots-container');
        if (dotsContainer) {
            dotsContainer.appendChild(container);
        }
        
        return container;
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
            aircraft.colors?.main || '#ffffff',
            aircraft.colors?.highlight || '#0066cc',
            name
        );
    }
}

function updateMultiplayerLabels(camera, renderer) {
    if (multiplayer && multiplayer.connected) {
        multiplayer.updateLabels(camera, renderer);
    }
}
