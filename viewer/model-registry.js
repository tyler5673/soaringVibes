class ModelRegistry {
    constructor() {
        this.models = new Map();
        this.categories = new Map();
    }
    
    register(model) {
        const id = model.id;
        this.models.set(id, model);
        
        const category = model.category || 'other';
        if (!this.categories.has(category)) {
            this.categories.set(category, []);
        }
        this.categories.get(category).push(id);
        
        console.log(`Registered model: ${id} (${category})`);
    }
    
    get(id) {
        return this.models.get(id);
    }
    
    getAll() {
        return Array.from(this.models.values());
    }
    
    getCategories() {
        return Array.from(this.categories.entries()).map(([name, ids]) => ({
            name,
            models: ids
        }));
    }
    
    search(query) {
        const lowerQuery = query.toLowerCase();
        return this.getAll().filter(model => {
            return model.name.toLowerCase().includes(lowerQuery) ||
                   model.description?.toLowerCase().includes(lowerQuery) ||
                   model.category?.toLowerCase().includes(lowerQuery);
        });
    }
}

// Global registry instance
window.modelRegistry = new ModelRegistry();

// Test registry initialization
console.log('ModelRegistry initialized');