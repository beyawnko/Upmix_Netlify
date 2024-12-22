import * as Tone from 'tone';
import { SpectralAnalyzer } from './SpectralAnalyzer';
import { EQBand } from './EQBand';
import { FREQUENCY_BANDS } from './constants';
import { eqCurves } from './EQCurves';
import { smoothParameter } from './utils';

export class AdaptiveEQ {
  constructor() {
    this.input = new Tone.Channel();
    this.output = new Tone.Channel();
    this.analyzer = new SpectralAnalyzer();
    
    // Create frequency bands
    this.bands = FREQUENCY_BANDS.map(({ frequency }) => new EQBand(frequency));
    
    this.setupRoutingChain();
    this.startAdaptationLoop();
  }

  setupRoutingChain() {
    this.input.connect(this.analyzer.analyzer);
    this.input.connect(this.bands[0].filter);
    
    // Chain EQ bands
    this.bands.reduce((prev, curr) => {
      prev.connect(curr.filter);
      return curr;
    });
    
    this.bands[this.bands.length - 1].connect(this.output);
  }

  startAdaptationLoop() {
    const update = () => {
      const { magnitude, frequencies } = this.analyzer.getFrequencyResponse();
      this.adaptBands(magnitude, frequencies);
      requestAnimationFrame(update);
    };
    
    update();
  }

  adaptBands(magnitude, frequencies) {
    this.bands.forEach((band, i) => {
      const bandFreq = band.filter.frequency.value;
      const bandIndex = frequencies.findIndex(f => f >= bandFreq);
      const bandMagnitude = magnitude[bandIndex];
      
      const targetGain = eqCurves[FREQUENCY_BANDS[i].name](bandMagnitude);
      
      band.setParameters({
        gain: smoothParameter(band.filter.gain.value, targetGain, 0.1)
      });
    });
  }

  setParameters(params) {
    const {
      adaptation = 0.5,
      emphasis = 0.5,
      tightness = 0.5
    } = params;
    
    this.analyzer.smoothing = 0.5 + adaptation * 0.4;
    this.bands.forEach(band => {
      band.setParameters({
        Q: 0.5 + tightness * 2,
        gain: band.filter.gain.value * emphasis
      });
    });
  }
}