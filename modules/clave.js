// Clave Module - 808-style clave sound generation with inlined code
import { DrumModule } from './DrumModule.js';

export class ClaveModule extends DrumModule {
    constructor(audioContext) {
        const paramDefinitions = {
            freq: { label: 'Pitch', min: 0, max: 100, default: 50, unit: '' },
            decay: { label: 'Decay', min: 0, max: 100, default: 50, unit: '' },
            level: { label: 'Volume', min: 0, max: 100, default: 90, unit: '' }
        };
        super(audioContext, 'clave', paramDefinitions);
    }

    // Generate 808-style clave sound (inlined from clave.js)
    play() {
        this.ensureAudioContext();

        // Map parameters to clave function expectations
        const freq = this.mapParam('freq', 1500, 3500); // 1500-3500 Hz range
        const decay = Math.max(0.008, this.mapParam('decay', 0.008, 0.05)); // 0.008-0.05s range
        const level = this.normalizeParam('level'); // 0-1 range

        const now = this.audioContext.currentTime;

        // --- nodes ---
        const osc = this.audioContext.createOscillator();
        osc.type = 'sine'; // sine/triangle best for clave

        // slight pitch envelope to mimic the short 'ring' characteristic
        osc.frequency.setValueAtTime(freq * 1.08, now); // small initial pitch lift
        osc.frequency.exponentialRampToValueAtTime(freq, now + decay * 0.5);

        // resonant shaping: emulate bridged-T / tank resonance with narrow bandpass
        const bp = this.audioContext.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.setValueAtTime(freq, now);
        bp.Q.setValueAtTime(12, now); // fairly high Q -> narrow resonant peak

        // amplitude envelope
        const g = this.audioContext.createGain();
        // start extremely low (avoid DC->0 in exp ramps), then quick attack, then fast decay
        const tiny = 1e-4;
        g.gain.setValueAtTime(tiny, now);
        // tiny immediate attack to target level
        g.gain.linearRampToValueAtTime(level, now + 0.003);
        // quick exponential decay to silence
        g.gain.exponentialRampToValueAtTime(tiny, now + decay + 0.003);

        // connect graph: osc -> bandpass -> gain -> destination
        osc.connect(bp);
        bp.connect(g);
        g.connect(this.audioContext.destination);

        // start/stop
        osc.start(now);
        // stop shortly after envelope decays; add a margin
        const stopTime = now + decay + 0.06;
        osc.stop(stopTime);

        // Clean up nodes after playback
        this.scheduleNodeCleanup([osc, bp, g], stopTime - now + 0.1);
    }
}