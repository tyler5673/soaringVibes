async function loadModelScript(url) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.onload = () => resolve(true);
        script.onerror = () => reject(new Error(`Failed to load ${url}`));
        document.head.appendChild(script);
    });
}

async function discoverModels() {
    try {
        // Load manifest
        const manifestRes = await fetch('model-manifest.json');
        const manifest = await manifestRes.json();
        
        console.log(`Discovering ${manifest.models.length} models...`);
        
        for (const model of manifest.models) {
            try {
                // Load the script
                await loadModelScript(model.script);
                
                // Get the exported class/function
                const exportedClass = window[model.export];
                
                if (!exportedClass) {
                    console.warn(`Export '${model.export}' not found from ${model.script}`);
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
                    animations: [] // Will be populated later
                });
                
                console.log(`✓ Loaded: ${model.name}`);
                
            } catch (error) {
                console.error(`Failed to load model ${model.id}:`, error);
            }
        }
        
        console.log(`Discovery complete: ${window.modelRegistry.getAll().length} models registered`);
        
    } catch (error) {
        console.error('Model discovery failed:', error);
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