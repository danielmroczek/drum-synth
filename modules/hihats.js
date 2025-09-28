// HiHats Module - Hi-hat sound generation with inlined code
import { DrumModule } from './DrumModule.js';

export class HiHatsModule extends DrumModule {
    constructor(audioContext) {
        const paramDefinitions = {
            tune: { label: 'Pitch', min: 0, max: 100, default: 50, unit: '' },
            decay: { label: 'Decay', min: 0, max: 100, default: 50, unit: '' },
            brightness: { label: 'Bright', min: 0, max: 100, default: 50, unit: '' },
            gain: { label: 'Volume', min: 0, max: 100, default: 60, unit: '' }
        };
        super(audioContext, 'hihats', paramDefinitions);
    }

    // Generate hi-hat sound (inlined from hihats.js)
    play() {
        this.ensureAudioContext();

        // Convert 0-100 parameters to 0-1 range for audio generation
        const tune = this.normalizeParam('tune');
        const decay = this.normalizeParam('decay');
        const brightness = this.normalizeParam('brightness');
        const gain = this.normalizeParam('gain');

        const fundamental = 40 + (tune * 60); // Maps tune parameter to fundamental frequency range
        const ratios = [2, 3, 4.16, 5.43, 6.79, 8.21];
        
        const time = this.audioContext.currentTime;
        const masterGain = this.audioContext.createGain();

        // Bandpass filter - frequency controlled by brightness parameter
        const bandpass = this.audioContext.createBiquadFilter();
        bandpass.type = "bandpass";
        bandpass.frequency.value = 8000 + (brightness * 4000); // 8kHz to 12kHz range

        // Highpass filter - frequency also controlled by brightness
        const highpass = this.audioContext.createBiquadFilter();
        highpass.type = "highpass";
        highpass.frequency.value = 5000 + (brightness * 4000); // 5kHz to 9kHz range

        // Connect the filter chain
        bandpass.connect(highpass);
        highpass.connect(masterGain);
        masterGain.connect(this.audioContext.destination);

        // Create the oscillators with harmonic ratios
        ratios.forEach(function(ratio) {
            const osc = this.audioContext.createOscillator();
            osc.type = "square";
            // Frequency is the fundamental * this oscillator's ratio
            osc.frequency.value = fundamental * ratio;
            osc.connect(bandpass);
            osc.start(time);
            osc.stop(time + (0.3 * decay));
        }.bind(this));

        // Define the volume envelope
        const attackTime = 0.02;
        const holdTime = 0.03;
        const releaseTime = 0.3 * decay;
        
        masterGain.gain.setValueAtTime(0.00001, time);
        masterGain.gain.exponentialRampToValueAtTime(gain, time + attackTime);
        masterGain.gain.exponentialRampToValueAtTime(0.3 * gain, time + holdTime);
        masterGain.gain.exponentialRampToValueAtTime(0.00001, time + releaseTime);
    }
}