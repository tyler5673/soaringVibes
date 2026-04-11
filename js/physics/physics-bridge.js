// ========== PHYSICS BRIDGE ==========
// Wraps cannon-es physics and syncs with Three.js aircraft
import * as CANNON from 'cannon-es';

export default class PhysicsBridge {
    constructor(aircraft) {
        this.aircraft = aircraft;
        
        // Create cannon-es world
        this.world = new CANNON.World();
        this.world.gravity.set(0, -9.81, 0);
        this.world.broadphase = new CANNON.NaiveBroadphase();
        
        // Default material with some friction
        const material = new CANNON.Material('aircraft');
        const contactMaterial = new CANNON.ContactMaterial(material, material, {
            friction: 0.3,
            restitution: 0.1
        });
        this.world.addContactMaterial(contactMaterial);
        this.material = material;
        
        // Aircraft body - approximate box shape (half-extents)
        this.body = new CANNON.Body({
            mass: 1100,
            shape: new CANNON.Box(new CANNON.Vec3(2, 1, 5)),
            material: material,
            linearDamping: 0.01,
            angularDamping: 0.05,
            position: new CANNON.Vec3(
                aircraft.position.x,
                aircraft.position.y,
                aircraft.position.z
            )
        });
        
        // Set rotation from Three.js Euler (YXZ order)
        this.body.quaternion.setFromEuler(
            aircraft.rotation.x,
            aircraft.rotation.y,
            aircraft.rotation.z,
            'YXZ'
        );
        
        this.world.addBody(this.body);
    }
    
    syncFromThree(aircraft) {
        // Copy Three.js position to cannon body
        this.body.position.set(
            aircraft.position.x,
            aircraft.position.y,
            aircraft.position.z
        );
        
        // Copy Three.js rotation to cannon body
        this.body.quaternion.setFromEuler(
            aircraft.rotation.x,
            aircraft.rotation.y,
            aircraft.rotation.z,
            'YXZ'
        );
    }
    
    syncToThree(aircraft) {
        // Get Euler from cannon quaternion
        const euler = new CANNON.Vec3();
        this.body.quaternion.toEuler(euler);
        
        // Copy cannon position to Three.js
        aircraft.position.x = this.body.position.x;
        aircraft.position.y = this.body.position.y;
        aircraft.position.z = this.body.position.z;
        
        // Copy cannon rotation to Three.js
        aircraft.rotation.x = euler.x;
        aircraft.rotation.y = euler.y;
        aircraft.rotation.z = euler.z;
    }
    
    getVelocity() {
        // Returns speed in m/s
        return Math.sqrt(
            this.body.velocity.x ** 2 +
            this.body.velocity.y ** 2 +
            this.body.velocity.z ** 2
        );
    }
    
    getAngularVelocity() {
        // Returns rad/s for each axis
        return {
            pitch: this.body.angularVelocity.x,
            roll: this.body.angularVelocity.z,
            yaw: this.body.angularVelocity.y
        };
    }
    
    update(delta, substeps = 3) {
        const dt = delta / substeps;
        for (let i = 0; i < substeps; i++) {
            this.world.step(dt);
        }
    }
}
