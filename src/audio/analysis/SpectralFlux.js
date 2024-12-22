import * as Tone from 'tone';

export class SpectralFlux {
  constructor(fftSize = 2048) {
    this.fftSize = fftSize;
    this.analyzer = new Tone.Analyser('fft', fftSize);
    this.previousSpectrum = new Float32Array(fftSize);
  }

  analyze(signal) {
    const currentSpectrum = this.analyzer.getValue();
    let flux = 0;
    
    // Calculate spectral flux using half-wave rectification
    for (let i = 0; i < this.fftSize; i++) {
      const diff = currentSpectrum[i] - this.previousSpectrum[i];
      flux += diff > 0 ? diff : 0;
    }
    
    this.previousSpectrum.set(currentSpectrum);
    return flux;
  }
}