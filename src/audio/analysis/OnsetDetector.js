import * as Tone from 'tone';
import { SpectralFlux } from './SpectralFlux';

export class OnsetDetector {
  constructor() {
    this.input = new Tone.Channel();
    this.spectralFlux = new SpectralFlux();
    this.highFreqContent = new Tone.Analyser('fft', 2048);
    
    // Connect analyzers
    this.input.connect(this.spectralFlux.analyzer);
    this.input.connect(this.highFreqContent);
    
    // Detection parameters
    this.threshold = 0.5;
    this.windowSize = 5;
    this.minInterOnsetInterval = 0.05; // 50ms
    this.lastOnsetTime = 0;
  }

  detect() {
    const now = Tone.now();
    if (now - this.lastOnsetTime < this.minInterOnsetInterval) {
      return false;
    }

    const flux = this.spectralFlux.analyze();
    const hfc = this.calculateHFC();
    
    // Combine multiple onset detection functions
    const onsetStrength = (flux * 0.6 + hfc * 0.4);
    
    if (onsetStrength > this.threshold) {
      this.lastOnsetTime = now;
      return {
        time: now,
        strength: onsetStrength,
        type: this.classifyTransientType(hfc, flux)
      };
    }
    
    return false;
  }

  calculateHFC() {
    const spectrum = this.highFreqContent.getValue();
    let hfc = 0;
    
    for (let i = 0; i < spectrum.length; i++) {
      hfc += Math.abs(spectrum[i]) * i;
    }
    
    return hfc / spectrum.length;
  }

  classifyTransientType(hfc, flux) {
    const ratio = hfc / flux;
    if (ratio > 2) return 'sharp';
    if (ratio > 1) return 'normal';
    return 'soft';
  }
}