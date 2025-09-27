// Kick Module - Bass drum sound generation with inlined code
import { DrumModule } from './DrumModule.js';

export class KickModule extends DrumModule {
    constructor(audioContext) {
        const paramDefinitions = {
            tune: { label: 'Pitch', min: 0, max: 100, default: 50, unit: '' },
            decay: { label: 'Decay', min: 0, max: 100, default: 50, unit: '' },
            gain: { label: 'Volume', min: 0, max: 100, default: 85, unit: '' }
        };
        super(audioContext, 'kick', paramDefinitions);
    }

    // Generate bass drum sound (inlined from kick606.js)
    play() {
        this.ensureAudioContext();

        // Convert 0-100 parameters to 0-1 range for audio generation
        const tune = this.normalizeParam('tune');
        const decay = this.normalizeParam('decay'); 
        const gain = this.normalizeParam('gain');

        const time = this.audioContext.currentTime;
        const osc = this.audioContext.createOscillator();
        const gainOsc = this.audioContext.createGain();
        const masterGain = this.audioContext.createGain();

        // Set oscillator properties
        osc.type = 'triangle';
        const startFreq = 60 + (tune * 100); // Maps tune parameter to a frequency range
        const endFreq = 20;
        osc.frequency.setValueAtTime(startFreq, time);
        osc.frequency.exponentialRampToValueAtTime(endFreq, time + (0.5 * decay));

        // Set amplitude envelope
        gainOsc.gain.setValueAtTime(gain, time);
        gainOsc.gain.exponentialRampToValueAtTime(0.001, time + (0.8 * decay)); // 0.8 ensures a longer tail

        // Connect nodes
        osc.connect(gainOsc);
        gainOsc.connect(masterGain);
        masterGain.connect(this.audioContext.destination);

        // Start and stop oscillator
        osc.start(time);
        osc.stop(time + (0.8 * decay));
    }

}