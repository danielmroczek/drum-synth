import * as SoundModules from './modules/index.js';

document.addEventListener('alpine:init', () => {
    Alpine.data('drumApp', () => ({
        // Initialize AudioContext
        audioContext: null,
        soundModules: {},
        
        // Module configuration - defines which modules are available to user at start
        moduleConfig: [
            SoundModules.KickModule,
            SoundModules.SnareModule,
            SoundModules.HiHatsModule,
            SoundModules.ClaveModule
        ],
        
        // Dynamic modules array for UI rendering
        modules: [],
        
        // Parameter values for each sound module (will be initialized dynamically)
        params: {},
        
        // Cache of module IDs to avoid recreating instances
        moduleIds: [],

        init() {
            // Initialize AudioContext
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Initialize modules dynamically from configuration
            this.initializeModules();

            // Set initial parameter values
            this.updateAllParams();

            // Watch for parameter changes dynamically
            this.setupParameterWatchers();
        },

        // Initialize modules dynamically from configuration
        initializeModules() {
            this.moduleConfig.forEach((ModuleClass, index) => {
                // Create sound module instance
                const moduleInstance = new ModuleClass(this.audioContext);
                
                // Generate automatic ID from module name (lowercase)
                const moduleId = moduleInstance.name.toLowerCase();
                
                // Cache the module ID
                this.moduleIds.push(moduleId);
                
                this.soundModules[moduleId] = moduleInstance;

                // Get parameter definitions
                const paramInfo = moduleInstance.getParamInfo();
                
                // Initialize parameter values with defaults
                this.params[moduleId] = {};
                Object.keys(paramInfo).forEach(paramName => {
                    this.params[moduleId][paramName] = paramInfo[paramName].default;
                });

                // Create module UI data
                const moduleUI = {
                    id: moduleId,
                    title: moduleInstance.name, // Get title from module's name property (user will be able to edit this later)
                    parameters: Object.keys(paramInfo).map(paramName => ({
                        name: paramName,
                        ...paramInfo[paramName]
                    }))
                };
                
                this.modules.push(moduleUI);
            });
        },

        // Setup parameter watchers dynamically
        setupParameterWatchers() {
            this.moduleIds.forEach(moduleId => {
                this.$watch(`params.${moduleId}`, () => this.updateSoundParams(moduleId), { deep: true });
            });
        },

        // Update all parameters in sound modules
        updateAllParams() {
            this.moduleIds.forEach(moduleId => {
                if (this.params[moduleId]) {
                    Object.keys(this.params[moduleId]).forEach(param => {
                        this.soundModules[moduleId].setParam(param, this.params[moduleId][param]);
                    });
                }
            });
        },

        // Play a specific sound
        playSound(soundType) {
            if (this.soundModules[soundType]) {
                // Update parameters before playing
                this.updateSoundParams(soundType);
                this.soundModules[soundType].play();
            }
        },

        // Update parameters for a specific sound module
        updateSoundParams(soundType) {
            if (this.soundModules[soundType] && this.params[soundType]) {
                Object.keys(this.params[soundType]).forEach(param => {
                    this.soundModules[soundType].setParam(param, this.params[soundType][param]);
                });
            }
        },

        // Get volume parameter for volume bar display
        getVolumeParam(moduleId) {
            if (!this.params[moduleId]) return 0;
            
            // Look for common volume parameter names
            const volumeParams = ['gain', 'level', 'volume'];
            for (const param of volumeParams) {
                if (this.params[moduleId][param] !== undefined) {
                    return this.params[moduleId][param];
                }
            }
            return 0;
        }
    }));
});

// Provide a simple fallback for x-knob event shapes: mirror change to input
window.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('x-knob').forEach(k => {
        const mirror = () => {
            k.dispatchEvent(new Event('input', { bubbles: true }));
        };
        k.addEventListener('change', mirror);
        k.addEventListener('adjust', mirror);
    });
});
