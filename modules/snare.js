// Snare Module - Snare drum sound generation with inlined code
import { DrumModule } from './DrumModule.js';

export class SnareModule extends DrumModule {
    constructor(audioContext) {
        const paramDefinitions = {
            tune: { label: 'Pitch', min: 0, max: 100, default: 50, unit: '' },
            decay: { label: 'Decay', min: 0, max: 100, default: 80, unit: '' },
            snappy: { label: 'Snappy', min: 0, max: 100, default: 80, unit: '' },
            gain: { label: 'Volume', min: 0, max: 100, default: 75, unit: '' }
        };
        super(audioContext, 'snare', paramDefinitions);
    }

    // Generate snare drum sound (inlined from snare606.js)
    play() {
        this.ensureAudioContext();

        // Convert 0-100 parameters to 0-1 range for audio generation
        const tune = this.normalizeParam('tune');
        const decay = this.normalizeParam('decay');
        const snappy = this.normalizeParam('snappy');
        const gain = this.normalizeParam('gain');

        const time = this.audioContext.currentTime;
        const masterGain = this.audioContext.createGain();

        // Tonal body (pitched oscillator)
        const bodyOsc = this.audioContext.createOscillator();
        const bodyGain = this.audioContext.createGain();
        const bodyFreq = 150 + (tune * 100);
        bodyOsc.type = 'triangle';
        bodyOsc.frequency.setValueAtTime(bodyFreq, time);
        bodyGain.gain.setValueAtTime(gain, time);
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

        noiseGain.gain.setValueAtTime(snappy * 0.5, time); // Adjusts noise mix with snappy param
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