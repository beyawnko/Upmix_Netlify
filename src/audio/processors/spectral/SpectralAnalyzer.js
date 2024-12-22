import * as Tone from 'tone';

export class SpectralAnalyzer {
  constructor(fftSize = 2048) {
    this.analyzer = new Tone.Analyser('fft', fftSize);
    this.smoothing = 0.8;
    this.previousSpectrum = new Float32Array(fftSize);
  }

  analyze() {
    const currentSpectrum = this.analyzer.getValue();
    const smoothedSpectrum = new Float32Array(currentSpectrum.length);
    
    // Apply temporal smoothing
    for (let i = 0; i < currentSpectrum.length; i++) {
      smoothedSpectrum[i] = this.smoothing * this.previousSpectrum[i] + 
                           (1 - this.smoothing) * currentSpectrum[i];
    }
    
    this.previousSpectrum.set(smoothedSpectrum);
    return smoothedSpectrum;
  }

  getFrequencyResponse() {
    const spectrum = this.analyze();
    return {
      magnitude: spectrum,
      frequencies: this.analyzer.getFrequencyBins()
    };
  }
}