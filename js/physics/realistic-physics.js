// ========== REALISTIC PHYSICS ==========
// Complete 6-DOF aerodynamic model for Cessna 182 Skylane
// Uses angular momentum-based rotation for realistic feel

class RealisticPhysics {
    constructor(aircraft) {
        this.aircraft = aircraft;
        
        // ========== CESSNA 182 SKYLANE SPECIFICATIONS ==========
        // Mass properties (kg, m)
        this.mass = 1157;           // Max ramp weight (2550 lbs / 2.205)
        this.wingArea = 16.165;     // m² (174 sq ft)
        this.wingspan = 10.9728;    // m (36 ft)
        this.meanChord = 1.473;     // m (4.83 ft)
        this.aspectRatio = this.wingspan ** 2 / this.wingArea; // 7.45
        
        // Moments of inertia (kg·m²) - Cessna 182 estimates
        this.ixx = 1280;   // Roll inertia
        this.iyy = 1825;   // Pitch inertia  
        this.izz = 3200;    // Yaw inertia (higher - long nose + tail moment arm)
        this.ixz = 50;     // Product of inertia (reduced)
        
        // Center of gravity (relative to aircraft origin, meters)
        // C182 CG is typically around 35-40% MAC
        this.cgPosition = new THREE.Vector3(0, 0, 0.3);
        
        // ========== AERODYNAMIC COEFFICIENTS ==========
        // Cessna 182 with NACA 2412 airfoil characteristics
        
        // Lift curve (linear + stall) - realistic coefficients from references
        this.CL0 = 0.1;            // Zero-alpha lift
        this.CL_alpha = 4.5;       // Lift curve slope (per radian) ~4.5-5.0 for typical wing
        this.CLmax = 1.4;          // Maximum lift coefficient
        this.alphaStall = degreesToRadians(15);
        this.alphaZeroLift = degreesToRadians(-2);
        
        // Drag coefficients
        this.CD0 = 0.03;            // Parasitic drag
        this.e = 0.78;            // Oswald efficiency factor
        
// Pitching moment
        this.CM0 = 0.0;
        this.trimAlpha = degreesToRadians(2.5);
        this.CM_alpha = -0.2;     // Static pitch stability
        this.CM_q = -15;           // Pitch damping (per rad, normalized by V)
        this.CM_de = -0.05;       // Elevator control power (5x increase for responsive controls)
        
        // Roll derivatives
        this.Cl_beta = -0.08;         // Dihedral effect (roll from sideslip)
        this.Cl_p = -0.4;           // Roll damping
        this.Cl_dr = 0.008;         // Aileron control power (2.5x increase for responsive roll)
        
        // Yaw derivatives - weathervaning aligns velocity with heading
        this.Cn_beta = 0.03;        // Directional stability (weathervaning)
        this.Cn_r = -0.1;            // Yaw damping
        this.Cn_dr = 0.008;          // Rudder control power (4x increase for responsive yaw)
        this.Cn_da = -0.001;         // Minimal adverse yaw
        
        // Side force - makes the tail swing realistically
        this.CY_beta = -0.3;         // Side force from sideslip
        this.CY_dr = 0.1;            // Rudder side force
        
        // ========== PROPULSION (Lycoming IO-540) ==========
        this.maxThrust = 4000;    // N (approx 900 lbs at max throttle)
        this.propDiameter = 1.93; // m (76 inches)
        this.propRPM = 2700;      // Max RPM
        this.propellerDiskArea = Math.PI * (this.propDiameter / 2) ** 2;
        
        // ========== CONTROL SURFACE LIMITS ==========
        this.maxElevatorDeflection = degreesToRadians(25);
        this.maxAileronDeflection = degreesToRadians(20);
        this.maxRudderDeflection = degreesToRadians(25);
        
        // Differential aileron travel (up more than down)
        this.aileronUpFactor = 1.0;   // Full up travel
        this.aileronDownFactor = 0.75; // 75% of up travel
        
        // ========== STATE VARIABLES ==========
        // Angular velocity (rad/s) - in body frame
        this.angularVelocity = new THREE.Vector3(0, 0, 0);
        
        // Aerodynamic angles
        this.alpha = 0;    // Angle of attack (rad)
        this.beta = 0;     // Sideslip angle (rad)
        this.qBar = 0;     // Dynamic pressure (Pa)
        this.tas = 0;      // True airspeed (m/s)
        
        // Control surface deflections (rad)
        this.elevatorDeflection = 0;
        this.aileronDeflection = 0;
        this.rudderDeflection = 0;
        
        // Control surface rates (rad/s) - for calculating hinge moments
        this.elevatorRate = 0;
        this.aileronRate = 0;
        this.rudderRate = 0;
        
        // Stall state
        this.stallProgress = 0;     // 0 to 1, where 1 is fully stalled
        this.stallAsymmetry = 0;    // Left/right asymmetry (-1 to 1)
        this.buffetIntensity = 0;   // Current buffet vibration level
        
        // Previous state for damping calculations
        this.prevAlpha = 0;
        this.prevBeta = 0;
        
        // Atmospheric properties
        this.seaLevelDensity = 1.225; // kg/m³
        this.temperatureLapseRate = 0.0065; // K/m
        this.seaLevelTemp = 288.15;   // K (15°C)
        
        // Ground effect
        this.groundEffectHeight = this.wingspan; // Significant within 1 wingspan
        
        // Turbulence
        this.turbulenceTime = 0;
        this.turbulenceVector = new THREE.Vector3(0, 0, 0);
        
        // Debug visualization
        this.debugForces = {
            enabled: true,
            root: null,
            arrows: {},
            arrowVisibility: {
                lift: true,
                drag: true,
                thrust: true,
                weight: true,
                sideForce: true,
                roll: true,
                pitch: true,
                yaw: true
            },
            forces: {
                lift: new THREE.Vector3(),
                drag: new THREE.Vector3(),
                thrust: new THREE.Vector3(),
                weight: new THREE.Vector3(),
                sideForce: new THREE.Vector3(),
                rollMoment: 0,
                pitchMoment: 0,
                yawMoment: 0
            }
        };
        this.initDebugArrows();
    }
    
    initDebugArrows() {
        // Check if THREE.ArrowHelper exists (it might not in test environment)
        if (!THREE.ArrowHelper) {
            return;
        }
        
        if (this.aircraft.mesh) {
            const debugRootsToRemove = [];
            const parentsToScan = [this.aircraft.mesh, this.aircraft.mesh.parent].filter(Boolean);
            parentsToScan.forEach(parent => {
                if (!parent.children) return;
                parent.children.forEach(child => {
                    if (child.userData && child.userData.isPhysicsDebugRoot) {
                        debugRootsToRemove.push(child);
                    }
                });
            });

            debugRootsToRemove.forEach(root => {
                if (root.parent && typeof root.parent.remove === 'function') {
                    root.parent.remove(root);
                }
            });
        }

        this.debugForces.root = null;
        this.debugForces.arrows = {};
        this.ensureDebugArrows();
    }

    ensureDebugArrows() {
        if (!THREE.ArrowHelper || !THREE.Group || !this.aircraft.mesh || !this.aircraft.mesh.parent) {
            return;
        }

        const parent = this.aircraft.mesh.parent;
        if (this.debugForces.root && this.debugForces.root.parent === parent) {
            return;
        }

        if (this.debugForces.root && this.debugForces.root.parent && typeof this.debugForces.root.parent.remove === 'function') {
            this.debugForces.root.parent.remove(this.debugForces.root);
        }

        const root = new THREE.Group();
        root.userData = { ...(root.userData || {}), isPhysicsDebugRoot: true };
        parent.add(root);
        this.debugForces.root = root;
        this.debugForces.arrows = {};

        // Create arrow helpers for force visualization
        const arrowColors = {
            lift: 0x00ff00,      // Green - up
            drag: 0xff0000,      // Red - back
            thrust: 0x0000ff,     // Blue - forward
            weight: 0xff8800,     // Orange - down
            sideForce: 0xff00ff,  // Magenta - side
            roll: 0x00ffff,       // Cyan - roll moment
            pitch: 0xffff00,      // Yellow - pitch moment
            yaw: 0xffffff         // White - yaw moment
        };
        
        for (const [name, color] of Object.entries(arrowColors)) {
            const dir = new THREE.Vector3(0, 1, 0);
            const origin = new THREE.Vector3(0, 0, 0);
            const length = 5;
            const arrow = new THREE.ArrowHelper(dir, origin, length, color, 2, 1);
            arrow.visible = false;
            
            // Add label (skip if canvas not available - e.g., test environment)
            try {
                const canvas = document.createElement('canvas');
                canvas.width = 128;
                canvas.height = 64;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.fillStyle = '#' + color.toString(16).padStart(6, '0');
                    ctx.font = 'bold 24px Arial';
                    ctx.fillText(name.toUpperCase(), 10, 40);
                    
                    const texture = new THREE.CanvasTexture(canvas);
                    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
                    const sprite = new THREE.Sprite(spriteMat);
                    sprite.scale.set(3, 1.5, 1);
                    sprite.position.y = length + 1;
                    arrow.add(sprite);
                }
            } catch (e) {
                // Canvas not available in test environment, skip label
            }
            
            this.debugForces.arrows[name] = arrow;
            root.add(arrow);
        }
    }
    
    updateDebugArrows() {
        this.ensureDebugArrows();

        // Skip if ArrowHelper not available (test environment) or no arrows initialized
        if (!THREE.ArrowHelper || Object.keys(this.debugForces.arrows).length === 0) {
            return;
        }
        
        if (!this.debugForces.enabled) {
            for (const arrow of Object.values(this.debugForces.arrows)) {
                if (arrow) arrow.visible = false;
            }
            return;
        }
        
        const f = this.debugForces.forces;
        const bodyToWorld = new THREE.Matrix4().makeRotationFromEuler(this.aircraft.rotation);
        const forceScale = 0.0012;
        const momentScale = 0.000012;

        const localOffsets = {
            lift: new THREE.Vector3(0, 0.5, 0),        // Wing center
            drag: new THREE.Vector3(0, 0, 0),         // CG
            thrust: new THREE.Vector3(0, 0, -2),      // Propeller
            weight: new THREE.Vector3(0, 0, 0),       // CG
            sideForce: new THREE.Vector3(0, 0.3, 0),  // Slightly above CG
            roll: new THREE.Vector3(3, 0, 0),         // Right wing
            pitch: new THREE.Vector3(0, 0, 3),        // Tail
            yaw: new THREE.Vector3(0, 1.5, 3)         // Top of tail
        };
        
        const toWorldPosition = (localOffset) => localOffset.clone().applyMatrix4(bodyToWorld).add(this.aircraft.position);

        // Update force arrows using the actual resolved world-space vectors
        for (const [name, force] of Object.entries({
            lift: f.lift,
            drag: f.drag,
            thrust: f.thrust,
            weight: f.weight,
            sideForce: f.sideForce
        })) {
            const arrow = this.debugForces.arrows[name];
            if (arrow) {
                // Check if user has disabled this arrow
                if (!this.debugForces.arrowVisibility[name]) {
                    arrow.visible = false;
                    continue;
                }

                const magnitude = force.length();
                const length = magnitude * forceScale;
                if (length > 0.75) {
                    arrow.visible = true;

                    arrow.position.copy(toWorldPosition(localOffsets[name]));
                    
                    // Use local space directions that make physical sense
                    let localDir;
                    switch(name) {
                        case 'lift':
                            localDir = new THREE.Vector3(0, 1, 0); // Local up
                            break;
                        case 'drag':
                            localDir = new THREE.Vector3(0, 0, 1); // Local backward
                            break;
                        case 'thrust':
                            localDir = new THREE.Vector3(0, 0, -1); // Local forward
                            break;
                        case 'weight':
                            localDir = new THREE.Vector3(0, -1, 0); // World down
                            break;
                        case 'sideForce':
                            localDir = new THREE.Vector3(1, 0, 0); // Local right
                            break;
                        default:
                            localDir = new THREE.Vector3(0, 1, 0);
                    }
                    
                    // Transform local direction to world for display, but weight stays world-down
                    const worldDir = name === 'weight' 
                        ? localDir.clone() 
                        : localDir.clone().applyMatrix4(bodyToWorld).normalize();
                    
                    arrow.setDirection(worldDir);
                    arrow.setLength(Math.max(0.5, length), Math.max(0.2, length * 0.2), Math.max(0.1, length * 0.1));
                } else {
                    arrow.visible = false;
                }
            }
        }
        
        // Update moment indicators as axis arrows in world space
        const moments = {
            roll: f.rollMoment,
            pitch: f.pitchMoment,
            yaw: f.yawMoment
        };

        // Local body axes for moments
        const momentAxes = {
            roll: new THREE.Vector3(1, 0, 0),    // Local +X = roll axis
            pitch: new THREE.Vector3(0, 1, 0),   // Local +Y = pitch axis  
            yaw: new THREE.Vector3(0, 0, 1)      // Local +Z = yaw axis
        };
        
        for (const [name, moment] of Object.entries(moments)) {
            const arrow = this.debugForces.arrows[name];
            if (arrow) {
                // Check if user has disabled this arrow
                if (!this.debugForces.arrowVisibility[name]) {
                    arrow.visible = false;
                    continue;
                }

                const length = Math.abs(moment) * momentScale;
                if (length > 0.75) {
                    arrow.visible = true;

                    const axis = momentAxes[name].clone().applyMatrix4(bodyToWorld).normalize();
                    arrow.position.copy(toWorldPosition(localOffsets[name]));
                    arrow.setDirection(axis.multiplyScalar(Math.sign(moment) || 1));
                    arrow.setLength(Math.min(Math.max(0.5, length), 5), 0.5, 0.25);
                } else {
                    arrow.visible = false;
                }
            }
        }
    }
    
    // ========== UTILITY FUNCTIONS ==========
    
    getAirDensity(altitude) {
        // Standard atmosphere model (simplified, valid up to ~11km)
        const temp = this.seaLevelTemp - this.temperatureLapseRate * Math.max(0, altitude);
        const pressureRatio = Math.pow(1 - (this.temperatureLapseRate * Math.max(0, altitude)) / this.seaLevelTemp, 5.2561);
        const density = this.seaLevelDensity * pressureRatio * (288.15 / temp);
        return density;
    }
    
    getGroundEffectMultiplier(height) {
        if (height >= this.groundEffectHeight) return 1.0;
        if (height <= 0) return 0.5; // Maximum ground effect
        
        // Ground effect formula: induced drag reduction
        // h/b ratio: 0 = 0.5x induced drag, 1 = 1.0x induced drag
        const hOverB = Math.max(0.1, height / this.wingspan);
        const reduction = (0.516 + 0.144 * hOverB) / (hOverB * (1 + 0.4 * hOverB));
        return Math.max(0.5, Math.min(1.0, reduction));
    }
    
    // ========== MAIN UPDATE LOOP ==========
    
    update(delta) {
        const aircraft = this.aircraft;
        
        // Clamp delta to prevent physics explosion on lag spikes
        const safeDelta = Math.min(delta, 0.05); // Max 50ms per frame (~20fps minimum)
        
        // Single physics step per frame for smoothness
        // Fixed timestep causes choppy feel - use adaptive with safety clamp
        this.updatePhysics(safeDelta);
        
        // Visual updates (can run at display rate)
        this.updateVisuals(delta);
    }
    
    updatePhysics(delta) {
        const aircraft = this.aircraft;
        const controlInput = aircraft.controlInput;
        
        // Get transformation matrices
        const bodyToWorld = new THREE.Matrix4().makeRotationFromEuler(aircraft.rotation);
        const worldToBody = bodyToWorld.clone().transpose();
        
        // Body frame unit vectors in world space
        const forward = new THREE.Vector3(0, 0, -1).applyMatrix4(bodyToWorld).normalize();
        const right = new THREE.Vector3(1, 0, 0).applyMatrix4(bodyToWorld).normalize();
        const up = new THREE.Vector3(0, 1, 0).applyMatrix4(bodyToWorld).normalize();
        
        // ========== AIRSPEED & DYNAMIC PRESSURE ==========
        const velocity = aircraft.velocity.clone();
        this.tas = velocity.length();
        
        const airDensity = this.getAirDensity(aircraft.position.y);
        this.qBar = 0.5 * airDensity * this.tas * this.tas;
        
        // ========== AERODYNAMIC ANGLES ==========
        // Resolve aircraft velocity into body axes. The mesh uses -Z as nose-forward,
        // so forward speed is the negative local Z component.
        const velocityBody = velocity.clone().applyMatrix4(worldToBody);
        const forwardSpeed = -velocityBody.z;
        const lateralSpeed = velocityBody.x;
        const verticalSpeed = velocityBody.y;

        // Calculate angle of attack and sideslip from body-axis air-relative velocity.
        if (this.tas > 1.0) {
            const planarSpeed = Math.max(0.1, Math.sqrt(forwardSpeed * forwardSpeed + verticalSpeed * verticalSpeed));

            // Positive alpha means the relative wind is below the nose.
            this.alpha = Math.atan2(-verticalSpeed, Math.max(0.1, forwardSpeed));
            this.beta = Math.atan2(lateralSpeed, planarSpeed);
        } else {
            this.alpha = 0;
            this.beta = 0;
        }
        
        // ========== CONTROL SURFACE PROCESSING ==========
        // Apply control inputs with differential aileron travel
        const rollInput = controlInput.roll;
        const pitchInput = controlInput.pitch;
        const yawInput = controlInput.yaw;
        
        // Control effectiveness varies with airspeed (realistic feel)
        // Controls are ineffective at very low speeds, full effectiveness by 30 m/s
        // Use a more gradual curve for better feel: factor = (V / 30)^0.7
        const speedRatio = Math.min(1.0, this.tas / 30);
        const controlSpeedFactor = Math.pow(speedRatio, 0.7);
        
        // Calculate target deflections based on inputs
        // Note: pitch input -1 = pull back (W) = want nose up, +1 = push forward (S) = want nose down
        // Negative elevator = trailing edge up = less lift on tail = nose DOWN
        // So for pull back (-1), we need POSITIVE elevator to raise nose
        const targetElevator = -pitchInput * this.maxElevatorDeflection * controlSpeedFactor;
        
        // Ailerons: roll input +1 = roll right
        // Aileron deflection convention: positive = trailing edge down = more lift
        // To roll right, left aileron goes down (positive deflection), right aileron goes up (negative)
        // So positive roll input should give NEGATIVE aileron deflection ratio (roll coefficient)
        const targetAileron = -rollInput * this.maxAileronDeflection * controlSpeedFactor;
        
        // Rudder: yaw input +1 = yaw right (D key / E key)
        // Rudder deflection: positive = trailing edge left = nose yaws right
        // So positive yaw input = positive rudder deflection
        const targetRudder = yawInput * this.maxRudderDeflection * controlSpeedFactor;
        
        // Smooth control surface movement (servo/actuator delay)
        // Real control surfaces don't move instantly
        const smoothingRate = 8.0; // Surface can move full range in ~1/8 second
        const smoothingFactor = 1.0 - Math.exp(-smoothingRate * delta);
        
        this.elevatorDeflection += (targetElevator - this.elevatorDeflection) * smoothingFactor;
        this.aileronDeflection += (targetAileron - this.aileronDeflection) * smoothingFactor;
        this.rudderDeflection += (targetRudder - this.rudderDeflection) * smoothingFactor;
        
        // ========== LIFT CALCULATION ==========
        const CL = this.calculateLiftCoefficient();
        const liftMagnitude = this.qBar * this.wingArea * CL;

        const velocityDirBody = this.tas > 1 ? velocityBody.clone().normalize() : new THREE.Vector3(0, 0, -1);
        let liftDirBody = new THREE.Vector3().crossVectors(new THREE.Vector3(1, 0, 0), velocityDirBody);
        if (liftDirBody.length() < 0.001) {
            liftDirBody = new THREE.Vector3(0, 1, 0);
        }
        liftDirBody.normalize();
        const lift = liftDirBody.multiplyScalar(liftMagnitude).applyMatrix4(bodyToWorld);
        
        // ========== DRAG CALCULATION ==========
        const CD = this.calculateDragCoefficient(CL);
        
        // Ground effect reduces induced drag
        const groundEffectMult = this.getGroundEffectMultiplier(aircraft.position.y);
        const adjustedCD = this.CD0 + (CD - this.CD0) * groundEffectMult;
        
        const dragMagnitude = this.qBar * this.wingArea * adjustedCD;
        let dragBody = velocityDirBody.clone().negate();
        if (dragBody.length() < 0.001) dragBody = new THREE.Vector3(0, 0, 1);

        const drag = dragBody.multiplyScalar(dragMagnitude).applyMatrix4(bodyToWorld);
        
        // ========== SIDE FORCE ==========
        const CY = this.calculateSideForceCoefficient();
        const sideForceBody = new THREE.Vector3(1, 0, 0).multiplyScalar(this.qBar * this.wingArea * CY);
        const sideForce = sideForceBody.applyMatrix4(bodyToWorld);
        
        // ========== THRUST CALCULATION ==========
        // Thrust is along the engine/propeller axis (body -Z direction for this aircraft)
        // This means thrust direction changes with aircraft attitude, not velocity
        const thrustMagnitude = this.calculateThrustMagnitude(airDensity);
        const thrustBody = new THREE.Vector3(0, 0, -thrustMagnitude); // Forward in body space
        const thrust = thrustBody.applyMatrix4(bodyToWorld);
        
        // ========== WEIGHT ==========
        const weight = new THREE.Vector3(0, -this.mass * 9.81, 0);
        
        // ========== TOTAL FORCE ==========
        const totalForceWorld = new THREE.Vector3()
            .add(thrust)
            .add(lift)
            .add(drag)
            .add(sideForce)
            .add(weight);
        
        // Update debug forces
        if (this.debugForces.enabled) {
            this.debugForces.forces.lift.copy(lift);
            this.debugForces.forces.drag.copy(drag);
            this.debugForces.forces.thrust.copy(thrust);
            this.debugForces.forces.weight.copy(weight);
            this.debugForces.forces.sideForce.copy(sideForce);
        }
        
        // Convert force to body frame for moment calculations
        const totalForceBody = totalForceWorld.clone().applyMatrix4(worldToBody);
        
        // ========== MOMENT CALCULATION ==========
        // Calculate all aerodynamic moments in body frame
        const moments = this.calculateMoments(bodyToWorld, worldToBody, delta);
        
        // Update debug moments
        if (this.debugForces.enabled) {
            this.debugForces.forces.rollMoment = moments.x;
            this.debugForces.forces.pitchMoment = moments.y;
            this.debugForces.forces.yawMoment = moments.z;
        }
        
        // ========== EQUATIONS OF MOTION ==========
        // Linear acceleration: F = ma
        const acceleration = totalForceWorld.divideScalar(this.mass);
        
        // Update velocity (with speed limits)
        aircraft.velocity.add(acceleration.multiplyScalar(delta));
        
        // Limit maximum speed (C182 Vne ~ 302 km/h = 84 m/s)
        const maxSpeed = 84;
        if (this.tas > maxSpeed) {
            const overspeedFactor = maxSpeed / this.tas;
            aircraft.velocity.multiplyScalar(overspeedFactor * 0.995);
        }
        
        // Update position
        aircraft.position.add(aircraft.velocity.clone().multiplyScalar(delta));
        
        // ========== ROTATIONAL DYNAMICS ==========
        // Euler's equations for rigid body rotation
        // I * dω/dt = M - ω × (I * ω)
        
        const p = this.angularVelocity.x;  // Roll rate
        const q = this.angularVelocity.y;  // Pitch rate  
        const r = this.angularVelocity.z;  // Yaw rate
        
        // Gyroscopic coupling terms
        const gyroX = q * r * (this.izz - this.iyy) - this.ixz * p * q;
        const gyroY = p * r * (this.ixx - this.izz) + this.ixz * (p * p - r * r);
        const gyroZ = p * q * (this.iyy - this.ixx) + this.ixz * q * r;
        
        // Calculate angular accelerations
        const alphaX = (moments.x + gyroX) / this.ixx;
        const alphaY = (moments.y + gyroY) / this.iyy;
        const alphaZ = (moments.z + gyroZ) / this.izz;
        
        // Update angular velocity
        this.angularVelocity.x += alphaX * delta;
        this.angularVelocity.y += alphaY * delta;
        this.angularVelocity.z += alphaZ * delta;
        
        // Light numerical damping (~5% per second) for stability
        // Aerodynamic moments (CM_q, Cl_p, Cn_r) provide the real damping
        // Previous per-frame damping of 0.97 removed 84%/sec and made controls unresponsive
        const numericalDamping = Math.max(0, 1 - 3.0 * delta);
        this.angularVelocity.multiplyScalar(numericalDamping);
        
        // Update aircraft rotation from angular velocity
        this.updateRotation(delta, bodyToWorld);
        
        // ========== GROUND/WATER CONSTRAINTS ==========
        this.applyGroundConstraints(aircraft);
        
        // ========== UPDATE TELEMETRY ==========
        this.updateTelemetry(aircraft);
        
        // Store previous values
        this.prevAlpha = this.alpha;
        this.prevBeta = this.beta;
    }
    
    // ========== AERODYNAMIC CALCULATIONS ==========
    
    calculateLiftCoefficient() {
        // Base lift from angle of attack
        let CL = this.CL0 + this.CL_alpha * (this.alpha - this.alphaZeroLift);
        
        // Stall behavior
        const stallThreshold = this.alphaStall - degreesToRadians(3);
        
        if (this.alpha > stallThreshold) {
            // Approaching stall
            const stallProgress = (this.alpha - stallThreshold) / degreesToRadians(3);
            this.stallProgress = clamp(stallProgress, 0, 1);
            
            // Lift drops off after stall, but doesn't go to zero immediately
            const stallLiftLoss = this.stallProgress * 0.5; // Lose 50% lift at full stall
            CL = CL * (1 - stallLiftLoss) + this.CLmax * stallLiftLoss * 0.6;
            
            // Add buffet
            this.buffetIntensity = this.stallProgress * 0.3;
            
            // Wing drop asymmetry based on sideslip
            // If sideslipping right (beta > 0), left wing stalls first
            if (this.stallProgress > 0.5) {
                const asymmetry = Math.sin(this.beta * 3) * this.stallProgress * 0.2;
                CL += asymmetry;
                this.stallAsymmetry = asymmetry;
            }
        } else if (this.alpha < -this.alphaStall * 0.7) {
            // Negative stall (inverted flight)
            CL = -this.CLmax * 0.5;
            this.stallProgress = clamp(Math.abs(this.alpha) / this.alphaStall - 0.7, 0, 1);
            this.buffetIntensity = this.stallProgress * 0.2;
        } else {
            // Normal flight
            this.stallProgress = 0;
            this.buffetIntensity = 0;
            this.stallAsymmetry = 0;
        }
        
        // Apply elevator contribution to CL (small effect)
        CL += this.elevatorDeflection * 0.15;
        
        return clamp(CL, -1.5, this.CLmax * 1.1);
    }
    
    calculateDragCoefficient(CL) {
        // Parasitic + induced drag
        const inducedCD = (CL * CL) / (Math.PI * this.aspectRatio * this.e);
        return this.CD0 + inducedCD;
    }
    
    calculateSideForceCoefficient() {
        // Base side force from sideslip
        let CY = this.CY_beta * this.beta;
        
        // Rudder contribution
        CY += this.CY_dr * (this.rudderDeflection / this.maxRudderDeflection);
        
        return CY;
    }
    
    // ========== MOMENT CALCULATIONS ==========
    
    calculateMoments(bodyToWorld, worldToBody, delta) {
        const moments = new THREE.Vector3(0, 0, 0);
        
        const p = this.angularVelocity.x;
        const q = this.angularVelocity.y;
        const r = this.angularVelocity.z;
        
        // Wing span and chord for normalization
        const b = this.wingspan;
        const cBar = this.meanChord;
        
        // ========== ROLLING MOMENT ==========
        let Cl = 0;
        
        // Dihedral effect: sideslip causes roll
        // Disable at very low speeds where it's not physically meaningful
        if (this.tas > 5) {
            Cl += this.Cl_beta * this.beta;
        }
        
        // Roll damping: rolling motion creates differential lift that opposes roll
        Cl += this.Cl_p * (p * b / (2 * Math.max(this.tas, 10)));
        
        // Aileron effectiveness - use actual smoothed deflection
        // The deflection is already scaled by controlSpeedFactor in the processing step
        const aileronDeflectionRatio = this.aileronDeflection / this.maxAileronDeflection;
        Cl += this.Cl_dr * aileronDeflectionRatio;
        
        // Stall asymmetry causes roll
        if (this.stallProgress > 0.5) {
            Cl += this.stallAsymmetry * 0.3;
        }
        
        // P-factor, slipstream, and propeller gyroscopic precession disabled
        // These created persistent yaw moments that overwhelmed controls
        
        const rollMoment = Cl * this.qBar * this.wingArea * b;
        moments.x += rollMoment;
        
        // ========== PITCHING MOMENT ==========
        let Cm = 0;
        
        // Pitch stability is trimmed around a trainer-like glide AoA rather than zero alpha.
        Cm += this.CM0 + this.CM_alpha * (this.alpha - this.trimAlpha);
        
        // Pitch damping (from pitch rate)
        Cm += this.CM_q * (q * cBar / (2 * Math.max(this.tas, 10)));
        
        // Elevator effectiveness
        Cm += this.CM_de * (this.elevatorDeflection / this.maxElevatorDeflection);
        
        // Gyroscopic precession from propeller disabled until basic flight is stable
        
        const pitchMoment = Cm * this.qBar * this.wingArea * cBar;
        moments.y += pitchMoment;
        
        // ========== YAWING MOMENT ==========
        let Cn = 0;
        
        // Weathercock stability (yaw due to sideslip)
        // Disable at very low speeds to prevent unwanted yaw during reset
        if (this.tas > 5) {
            Cn += this.Cn_beta * this.beta;
        }
        
        // Yaw damping
        Cn += this.Cn_r * (r * b / (2 * Math.max(this.tas, 10)));
        
        // Rudder effectiveness
        Cn += this.Cn_dr * (this.rudderDeflection / this.maxRudderDeflection);
        
        // Adverse yaw from ailerons (yaw opposite to turn direction)
        // When rolling right (positive deflection), ailerons cause left yaw (negative)
        // Reuse the aileron deflection ratio calculated above
        Cn += this.Cn_da * aileronDeflectionRatio;
        
        // P-factor, slipstream, and gyroscopic precession disabled
        // - They created persistent yaw moments that overwhelmed control authority
        // - P-factor at -0.04 * throttle produced ~35 deg/s² yaw acceleration
        // - Slipstream added similar persistent yaw at low speeds
        // - Combined they caused the aircraft to continuously rotate right
        // - Re-enable with much smaller values once basic flight feel is solid
        
        // Stall-induced yaw (wing drop causes yaw)
        if (this.stallProgress > 0.5) {
            Cn += this.stallAsymmetry * 0.4;
        }
        
        const yawMoment = Cn * this.qBar * this.wingArea * b;
        moments.z += yawMoment;
        
        return moments;
    }
    
    // ========== PROPULSION CALCULATIONS ==========
    
    calculateThrustMagnitude(airDensity) {
        const throttle = this.aircraft.throttle;
        
        // Max static thrust scaled by throttle
        const maxStaticThrust = throttle * this.maxThrust;
        
        // Propeller advance ratio effect (thrust decreases with speed)
        const propTipSpeed = this.propRPM * (2 * Math.PI / 60) * (this.propDiameter / 2);
        const advanceRatio = this.tas / Math.max(propTipSpeed, 0.1);
        
        // Thrust coefficient decreases with advance ratio
        const thrustCoefficient = Math.max(0.1, 1.0 - advanceRatio * 0.8);
        
        // Density effect (less thrust at altitude)
        const densityRatio = airDensity / this.seaLevelDensity;
        
        return maxStaticThrust * thrustCoefficient * Math.sqrt(densityRatio);
    }
    
    calculateThrust(forward, airDensity) {
        const throttle = this.aircraft.throttle;
        
        // Thrust decreases with speed (momentum theory approximation)
        // T = T_static * (1 - V / (2 * V_jet)) for propellers
        const maxStaticThrust = throttle * this.maxThrust;
        
        // Propeller advance ratio effect
        const propTipSpeed = this.propRPM * (2 * Math.PI / 60) * (this.propDiameter / 2);
        const advanceRatio = this.tas / Math.max(propTipSpeed, 0.1);
        
        // Thrust coefficient decreases with advance ratio
        const thrustCoefficient = Math.max(0.1, 1.0 - advanceRatio * 0.8);
        
        // Density effect (less thrust at altitude)
        const densityRatio = airDensity / this.seaLevelDensity;
        
        const thrustMagnitude = maxStaticThrust * thrustCoefficient * Math.sqrt(densityRatio);
        
        return forward.clone().multiplyScalar(Math.max(0, thrustMagnitude));
    }
    
    calculatePropellerTorque() {
        // Torque from propeller creates roll tendency
        // Newton's 3rd law: prop spins clockwise (from behind), aircraft rolls counter-clockwise (left)
        
        const throttle = this.aircraft.throttle;
        
        // Real C182 torque effect: noticeable but manageable
        // At full power and low speed, creates slight left roll tendency
        const airDensity = this.getAirDensity(this.aircraft.position.y);
        const densityFactor = airDensity / this.seaLevelDensity;
        
        // Speed factor: effect is stronger at low speeds (more torque for same thrust)
        // But shouldn't be excessive - reduces as speed increases
        const speedFactor = Math.max(0, 1 - this.tas / 50); // Fades out by 50 m/s
        
        // Torque coefficient: small but noticeable
        // At full throttle at rest, produces about 0.02-0.03 roll coefficient
        const torqueCoefficient = -0.015 * throttle * densityFactor * speedFactor;
        
        return torqueCoefficient;
    }
    
    calculatePFactor() {
        // P-factor: At high angle of attack, the descending blade
        // has higher angle of attack than ascending blade
        // Creates asymmetric thrust → yaw moment
        
        const throttle = this.aircraft.throttle;
        
        // Real C182 P-factor: significant at high alpha, minimal at cruise
        // Only active at positive alpha (climbing or slow flight)
        // Effect is roughly proportional to alpha at low speeds
        
        // Limit alpha effect to reasonable range (up to ~20 degrees)
        const alphaFactor = Math.max(0, Math.min(1, this.alpha / 0.35)); // 0.35 rad ≈ 20°
        
        // P-factor coefficient: creates left yaw at high power/alpha
        // At full throttle and high alpha, produces about -0.03 to -0.04 yaw coefficient
        const pFactorCoefficient = -0.04 * alphaFactor * throttle;
        
        return pFactorCoefficient;
    }
    
    calculateSlipstreamEffect() {
        // Propeller creates spiral slipstream that hits vertical tail
        // Creates left yaw at high power (from right-to-left airflow over tail)
        
        const throttle = this.aircraft.throttle;
        
        // Real C182 slipstream effect:
        // - Strongest at low speeds and high power (takeoff/climb)
        // - Creates left yaw tendency
        // - Effect fades as speed increases
        
        // Speed factor: 1 at low speed, 0 at high speed
        const speedFactor = Math.max(0, 1 - this.tas / 35);
        
        // Slipstream yaw coefficient
        // At full throttle and low speed, produces about -0.03 to -0.05 yaw coefficient
        const slipstreamCoefficient = -0.035 * throttle * speedFactor;
        
        return slipstreamCoefficient;
    }
    
    calculatePropellerGyroscopicEffect() {
        // Gyroscopic precession from the spinning propeller
        // For a clockwise-rotating propeller (from behind):
        // - Pitching up → left yaw
        // - Yawing left → pitch up  
        // - Rolling right → pitch down
        
        const p = this.angularVelocity.x;  // Roll rate (rad/s)
        const q = this.angularVelocity.y;  // Pitch rate (rad/s)
        const r = this.angularVelocity.z;  // Yaw rate (rad/s)
        
        // Real C182 gyroscopic effects are relatively small
        // The propeller is not that massive compared to the aircraft
        // Effects are only noticeable during rapid maneuvers
        
        // Gyroscopic coupling coefficients (small values)
        const gyroFactor = 0.005; // Base gyroscopic coupling
        
        // Precession effects (scaled down for realistic feel)
        // Pitch rate creates yaw moment
        const gyroscopicYaw = q * gyroFactor;      // Pitch up → left yaw (positive pitch → negative yaw)
        // Yaw rate creates pitch moment  
        const gyroscopicPitch = -r * gyroFactor;   // Left yaw → pitch up (negative yaw → positive pitch)
        // Roll rate is relatively unaffected
        const gyroscopicRoll = 0;                    // Minimal roll coupling
        
        return new THREE.Vector3(gyroscopicRoll, gyroscopicPitch, gyroscopicYaw);
    }
    
    // ========== ROTATION UPDATE ==========
    
    updateRotation(delta, bodyToWorld) {
        const aircraft = this.aircraft;
        
        // Add buffet vibration when near stall
        if (this.buffetIntensity > 0 && this.tas > 20) {
            const buffetX = (Math.random() - 0.5) * this.buffetIntensity * 0.03;
            const buffetY = (Math.random() - 0.5) * this.buffetIntensity * 0.02;
            const buffetZ = (Math.random() - 0.5) * this.buffetIntensity * 0.02;
            
            this.angularVelocity.x += buffetX;
            this.angularVelocity.y += buffetY;
            this.angularVelocity.z += buffetZ;
        }
        
        // Quaternion-based rotation update to avoid gimbal lock
        // Convert body-frame angular velocity to world-frame rotation
        const p = this.angularVelocity.x;
        const q = this.angularVelocity.y;
        const r = this.angularVelocity.z;
        
        // Transform body angular velocity to world space
        const worldAngVel = new THREE.Vector3(p, q, r).applyMatrix4(bodyToWorld);
        const angle = worldAngVel.length() * delta;
        
        if (angle > 1e-10) {
            const axis = worldAngVel.clone().normalize();
            const dq = new THREE.Quaternion().setFromAxisAngle(axis, angle);
            
            const currentQuat = new THREE.Quaternion().setFromEuler(aircraft.rotation);
            currentQuat.multiply(dq);
            currentQuat.normalize();
            
            aircraft.rotation.setFromQuaternion(currentQuat, 'YXZ');
        }
    }
    
    // ========== CONSTRAINTS & TELEMETRY ==========
    
    applyGroundConstraints(aircraft) {
        const isOnWater = aircraft.hasFloats && aircraft.waterPhysics.isOnWater;
        const waterLevel = typeof WATER_LEVEL !== 'undefined' ? WATER_LEVEL : 2;
        
        if (isOnWater) {
            // Water constraints for float plane
            const floatBottom = waterLevel + 0.5; // Floats sit ~0.5m above water
            
            if (aircraft.position.y < floatBottom) {
                aircraft.position.y = floatBottom;
                if (aircraft.velocity.y < 0) {
                    aircraft.velocity.y = 0;
                }
                
                // Water drag on floats
                const speed = aircraft.velocity.length();
                if (speed > 0.1) {
                    const waterDragFactor = 0.95; // Strong drag on water
                    aircraft.velocity.multiplyScalar(waterDragFactor);
                }
            }
        } else {
            // Ground collision
            let terrainHeight = -50;
            if (typeof getTerrainHeight === 'function') {
                terrainHeight = getTerrainHeight(aircraft.position.x, aircraft.position.z);
            }
            
            const groundClearance = 1.8; // Fuselage clearance
            const minAltitude = terrainHeight + groundClearance;
            
            if (aircraft.position.y < minAltitude) {
                aircraft.position.y = minAltitude;
                if (aircraft.velocity.y < 0) {
                    aircraft.velocity.y = 0;
                }
                
                // Ground friction
                const speed = aircraft.velocity.length();
                if (speed > 0.1 && aircraft.throttle < 0.1) {
                    aircraft.velocity.multiplyScalar(0.98);
                }
            }
            
            // Water crash check (without floats)
            if (aircraft.position.y < waterLevel + 1 && !aircraft.hasFloats) {
                const speed = aircraft.velocity.length();
                if (speed > 10) {
                    aircraft.crashed = true;
                }
            }
        }
    }
    
    updateTelemetry(aircraft) {
        // Update standard aircraft telemetry
        aircraft.altitude = aircraft.position.y;
        aircraft.groundSpeed = this.tas;
        aircraft.ias = this.tas * 1.944; // m/s to knots
        
        // Store additional data for UI/gauges
        aircraft.physicsData = {
            alpha: this.alpha,
            beta: this.beta,
            tas: this.tas,
            stallProgress: this.stallProgress,
            buffetIntensity: this.buffetIntensity,
            qBar: this.qBar,
            elevatorDeflection: this.elevatorDeflection,
            aileronDeflection: this.aileronDeflection,
            rudderDeflection: this.rudderDeflection
        };
    }
    
    // ========== VISUAL UPDATES ==========
    
    updateVisuals(delta) {
        const aircraft = this.aircraft;
        const controlInput = aircraft.controlInput;
        
        // Update debug force arrows
        this.updateDebugArrows();
        
        // Animate propeller
        if (aircraft.propeller) {
            const propSpeed = 25 + aircraft.throttle * 35; // 25-60 rad/s (idle to max)
            aircraft.propeller.rotation.z += propSpeed * delta;
        }
        
        // Animate control surfaces
        // Deflection convention: negative = trailing edge up, positive = trailing edge down
        const aileronAngle = this.aileronDeflection; // Now negative for right roll, positive for left roll
        
        if (aircraft.aileronL) {
            // Left aileron: for right roll, it goes DOWN (positive deflection)
            // Since aileronAngle is negative for right roll, we negate it for left aileron
            aircraft.aileronL.rotation.x = -aileronAngle;
        }
        if (aircraft.aileronR) {
            // Right aileron: for right roll, it goes UP (negative deflection)
            // Since aileronAngle is negative for right roll, this works directly
            aircraft.aileronR.rotation.x = aileronAngle;
        }
        
        const elevatorAngle = this.elevatorDeflection;
        if (aircraft.elevator) {
            aircraft.elevator.rotation.x = -elevatorAngle;
        }
        
        const rudderAngle = this.rudderDeflection;
        if (aircraft.rudder) {
            aircraft.rudder.rotation.y = rudderAngle;
        }
        
        // Apply buffet shake to aircraft mesh when stalling
        if (this.buffetIntensity > 0 && aircraft.mesh) {
            const shakeX = (Math.random() - 0.5) * this.buffetIntensity * 0.05;
            const shakeY = (Math.random() - 0.5) * this.buffetIntensity * 0.03;
            const shakeZ = (Math.random() - 0.5) * this.buffetIntensity * 0.03;
            
            aircraft.mesh.position.x = aircraft.position.x + shakeX;
            aircraft.mesh.position.y = aircraft.position.y + shakeY;
            aircraft.mesh.position.z = aircraft.position.z + shakeZ;
        } else if (aircraft.mesh) {
            aircraft.mesh.position.copy(aircraft.position);
        }
    }
}

window.RealisticPhysics = RealisticPhysics;
console.log('RealisticPhysics v2.0 loaded - Cessna 182 Skylane');
