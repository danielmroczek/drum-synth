// Base DrumModule class - provides consistent interface for all drum sound modules
export class DrumModule {
    constructor(audioContext, name, paramDefinitions = {}) {
        this.audioContext = audioContext;
        this.name = name;
        this.paramDefinitions = paramDefinitions;
        
        // Initialize parameters with their default values
        this.params = {};
        Object.keys(paramDefinitions).forEach(paramName => {
            this.params[paramName] = paramDefinitions[paramName].default || 0;
        });
    }

    // Set parameter value (0-100 range from UI)
    setParam(paramName, value) {
        if (paramName in this.params) {
            const paramDef = this.paramDefinitions[paramName];
            const min = paramDef ? paramDef.min : 0;
            const max = paramDef ? paramDef.max : 100;
            this.params[paramName] = Math.max(min, Math.min(max, value));
        }
    }

    // Get parameter value
    getParam(paramName) {
        return this.params[paramName] || 0;
    }

    // Get parameter info for UI
    getParamInfo() {
        return this.paramDefinitions;
    }

    // Trigger the sound - must be implemented by subclasses
    play() {
        throw new Error(`play() method must be implemented by ${this.constructor.name}`);
    }

    // Helper method to normalize parameter from 0-100 to 0-1 range
    normalizeParam(paramName) {
        return this.params[paramName] / 100;
    }

    // Helper method to map parameter to custom range
    mapParam(paramName, min, max) {
        return min + (this.params[paramName] / 100) * (max - min);
    }

    // Ensure audio context is ready
    ensureAudioContext() {
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
}