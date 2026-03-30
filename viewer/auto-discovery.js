async function loadModelScript(url) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.async = true;
        script.onload = () => resolve(true);
        script.onerror = () => reject(new Error(`Failed to load ${url}`));
        document.head.appendChild(script);
    });
}

async function loadDependencyScript(url) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.async = false; // Load synchronously to ensure order
        script.onload = () => resolve(true);
        script.onerror = () => reject(new Error(`Failed to load ${url}`));
        document.head.appendChild(script);
    });
}

async function discoverModels() {
    let loaded = 0;
    let failed = 0;
    
    try {
        // Load manifest
        const manifestRes = await fetch('model-manifest.json');
        if (!manifestRes.ok) {
            throw new Error(`Failed to fetch manifest: ${manifestRes.status} ${manifestRes.statusText}`);
        }
        const manifest = await manifestRes.json();
        
        console.log(`Discovering ${manifest.models.length} models...`);
        
        // First load critical dependencies
        console.log('Loading dependencies...');
        const dependencies = [
            '../js/animals/animal-base.js'
        ];
        
        for (const dep of dependencies) {
            try {
                await loadDependencyScript(dep);
                console.log(`✓ Dependency loaded: ${dep}`);
            } catch (e) {
                console.warn(`Dependency not loaded (may not be needed): ${dep}`);
            }
        }
        
        // Then load all models
        for (const model of manifest.models) {
            try {
                // Load the script
                await loadModelScript(model.script);
                
                // Small delay to let script execute
                await new Promise(r => setTimeout(r, 50));
                
                // Get the exported class/function
                let exportedClass = window[model.export];
                
                // Handle models that don't export to window
                if (!exportedClass && model.export === 'Aircraft') {
                    // The aircraft class is defined but not exported
                    // Manually assign it
                    window.Aircraft = Aircraft;
                    exportedClass = Aircraft;
                }
                
                if (!exportedClass) {
                    console.warn(`Export '${model.export}' not found from ${model.script}`);
                    failed++;
                    continue;
                }
                
                // Register with registry
                window.modelRegistry.register({
                    id: model.id,
                    name: model.name,
                    category: model.category,
                    description: model.description,
                    create: async function() {
                        return createModelInstance(exportedClass, model);
                    },
                    animations: []
                });
                
                loaded++;
                console.log(`✓ Loaded: ${model.name}`);
                
            } catch (error) {
                failed++;
                console.error(`✗ Failed to load model ${model.id}:`, error.message);
            }
        }
        
        console.log(`Discovery complete: ${loaded} models loaded, ${failed} failed`);
        
    } catch (error) {
        console.error('Model discovery failed:', error);
        console.error('Make sure you are running via a web server (not file://)');
    }
}

async function createModelInstance(ClassOrFunction, modelConfig) {
    let instance, mesh;
    
    // Pattern 1: Class with constructor (e.g., Aircraft())
    if (ClassOrFunction.prototype) {
        instance = new ClassOrFunction();
        mesh = instance.mesh || instance;
    }
    
    // Pattern 2: Static getGeometry method (e.g., PalmGeometry.getGeometry())
    else if (typeof ClassOrFunction.getGeometry === 'function') {
        mesh = ClassOrFunction.getGeometry();
    }
    
    // Pattern 3: Function that returns mesh (e.g., createAirport())
    else if (typeof ClassOrFunction === 'function') {
        mesh = ClassOrFunction();
    }
    
    else {
        throw new Error(`Unknown model pattern for ${modelConfig.id}`);
    }
    
    return {
        mesh,
        instance,
        config: modelConfig
    };
}

// Auto-run on load
window.addEventListener('load', discoverModels);

console.log('Auto-discovery module loaded');