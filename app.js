import { KickModule } from './modules/kick.js';
import { SnareModule } from './modules/snare.js';
import { ClaveModule } from './modules/clave.js';
import { HiHatsModule } from './modules/hihats.js';

document.addEventListener('alpine:init', () => {
    Alpine.data('drumApp', () => ({
        // Initialize AudioContext
        audioContext: null,
        soundModules: {},
        
        // Module configuration - defines which modules to use
        moduleConfig: [
            { id: 'kick', title: 'Kick', class: KickModule },
            { id: 'snare', title: 'Snare', class: SnareModule },
            { id: 'hihats', title: 'Hat', class: HiHatsModule },
            { id: 'clave', title: 'Clave', class: ClaveModule }
        ],
        
        // Dynamic modules array for UI rendering
        modules: [],
        
        // Parameter values for each sound module (will be initialized dynamically)
        params: {},

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
            this.moduleConfig.forEach(config => {
                // Create sound module instance
                const moduleInstance = new config.class(this.audioContext);
                this.soundModules[config.id] = moduleInstance;

                // Get parameter definitions
                const paramInfo = moduleInstance.getParamInfo();
                
                // Initialize parameter values with defaults
                this.params[config.id] = {};
                Object.keys(paramInfo).forEach(paramName => {
                    this.params[config.id][paramName] = paramInfo[paramName].default;
                });

                // Create module UI data
                const moduleUI = {
                    id: config.id,
                    title: config.title,
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
            this.moduleConfig.forEach(config => {
                this.$watch(`params.${config.id}`, () => this.updateSoundParams(config.id), { deep: true });
            });
        },

        // Update all parameters in sound modules
        updateAllParams() {
            this.moduleConfig.forEach(config => {
                if (this.params[config.id]) {
                    Object.keys(this.params[config.id]).forEach(param => {
                        this.soundModules[config.id].setParam(param, this.params[config.id][param]);
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
