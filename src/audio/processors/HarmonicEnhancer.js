import * as Tone from 'tone';

export class HarmonicEnhancer {
  constructor() {
    this.input = new Tone.Channel();
    this.output = new Tone.Channel();
    
    // Multiband split for frequency-dependent processing
    this.lowBand = new Tone.Filter(200, 'lowpass');
    this.midBand = new Tone.Filter({
      frequency: 200,
      type: 'bandpass',
      Q: 0.5
    });
    this.highBand = new Tone.Filter(2000, 'highpass');
    
    // Harmonic generators
    this.subHarmonic = new Tone.Multiply(0.5); // Octave down
    this.harmonicExciter = new Tone.WaveShaper(x => {
      return x * x * x; // Cubic distortion for harmonics
    });
    
    // Setup routing
    this.input.fan(this.lowBand, this.midBand, this.highBand);
    this.lowBand.connect(this.subHarmonic);
    this.midBand.connect(this.harmonicExciter);
    
    this.subHarmonic.connect(this.output);
    this.harmonicExciter.connect(this.output);
    this.highBand.connect(this.output);
  }

  setHarmonicAmount(amount) {
    this.harmonicExciter.wet.value = amount;
  }

  setSubHarmonicAmount(amount) {
    this.subHarmonic.value = amount;
  }
}