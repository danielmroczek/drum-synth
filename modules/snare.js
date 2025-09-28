// Snare Module - Snare drum sound generation with inlined code
import { DrumModule } from './DrumModule.js';

export class SnareModule extends DrumModule {
    constructor(audioContext) {
        const paramDefinitions = {
            tune: { label: 'Pitch', min: 0, max: 100, default: 50, unit: '' },
            decay: { label: 'Decay', min: 0, max: 100, default: 80, unit: '' },
            snappy: { label: 'Snappy', min: -50, max: 50, default: 0, unit: '' },
            gain: { label: 'Volume', min: 0, max: 100, default: 75, unit: '' }
        };
        super(audioContext, 'snare', paramDefinitions);
    }

    // Generate snare drum sound (inlined from snare606.js)
    play() {
        this.ensureAudioContext();

        // Convert parameters to appropriate ranges
        const tune = this.normalizeParam('tune');
        const decay = this.normalizeParam('decay');
        const snappyRaw = this.getParam('snappy'); // Get raw value (-50 to 50)
        const snappy = snappyRaw / 50; // Normalize to -1 to 1 range
        const gain = this.normalizeParam('gain');

        // Calculate body and noise gains based on snappy parameter
        // snappy = -1: only body (bodyGain = 1, noiseGain = 0)
        // snappy = 0: equal mix (bodyGain = 0.5, noiseGain = 0.5)
        // snappy = 1: only noise (bodyGain = 0, noiseGain = 1)
        const bodyGainAmount = Math.max(0, (1 - snappy) * 0.5);
        const noiseGainAmount = Math.max(0, (1 + snappy) * 0.5);

        const time = this.audioContext.currentTime;
        const masterGain = this.audioContext.createGain();

        // Tonal body (pitched oscillator)
        const bodyOsc = this.audioContext.createOscillator();
        const bodyGain = this.audioContext.createGain();
        const bodyFreq = 150 + (tune * 100);
        bodyOsc.type = 'triangle';
        bodyOsc.frequency.setValueAtTime(bodyFreq, time);
        bodyGain.gain.setValueAtTime(gain * bodyGainAmount, time);
        bodyGain.gain.exponentialRampToValueAtTime(0.001, time + (0.5 * decay));
        bodyOsc.connect(bodyGain);

        // Snappy noise (filtered white noise)
        const bufferSize = 2 * this.audioContext.sampleRate;
        const noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const noiseData = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            noiseData[i] = Math.random() * 2 - 1; // Generates random white noise
        }
        const noiseSource = this.audioContext.createBufferSource();
        const noiseFilter = this.audioContext.createBiquadFilter();
        const noiseGain = this.audioContext.createGain();

        noiseSource.buffer = noiseBuffer;
        noiseSource.loop = true;
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.setValueAtTime(1000, time); // High-pass filter for snappy character

        noiseGain.gain.setValueAtTime(gain * noiseGainAmount, time); // Crossfade based on snappy param
        noiseGain.gain.exponentialRampToValueAtTime(0.001, time + (0.2 * decay));

        // Connect noise nodes
        noiseSource.connect(noiseFilter);
        noiseFilter.connect(noiseGain);

        // Mix body and noise and connect to destination
        bodyGain.connect(masterGain);
        noiseGain.connect(masterGain);
        masterGain.connect(this.audioContext.destination);

        // Start and stop all nodes
        bodyOsc.start(time);
        noiseSource.start(time);
        bodyOsc.stop(time + (0.5 * decay));
        noiseSource.stop(time + (0.2 * decay));
    }
}