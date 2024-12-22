import * as Tone from 'tone';
import { PhaseAligner } from './PhaseAligner';
import { HarmonicEnhancer } from './HarmonicEnhancer';
import { TransientShaper } from './TransientShaper';
import { AdaptiveEQ } from './spectral/AdaptiveEQ';
import { VBAP } from './VBAP';

export class PsychoacousticProcessor {
  constructor() {
    this.input = new Tone.Channel();
    this.output = new Tone.Channel();
    
    // Create processing modules
    this.phaseAligner = new PhaseAligner();
    this.transientShaper = new TransientShaper();
    this.adaptiveEQ = new AdaptiveEQ();
    this.harmonicEnhancer = new HarmonicEnhancer();
    this.vbap = new VBAP();
    
    // Connect processing chain
    this.input
      .connect(this.phaseAligner.input);
    this.phaseAligner.output
      .connect(this.transientShaper.input);
    this.transientShaper.output
      .connect(this.adaptiveEQ.input);
    this.adaptiveEQ.output
      .connect(this.harmonicEnhancer.input);
    this.harmonicEnhancer.output
      .connect(this.vbap.input);
    this.vbap.output
      .connect(this.output);
  }

  setParameters(params) {
    const {
      harmonicAmount = 0.5,
      subHarmonicAmount = 0.3,
      azimuth = 0,
      elevation = 0,
      transientSensitivity = 0.5,
      attackEnhancement = 1,
      sustainLevel = 1,
      eqAdaptation = 0.5,
      eqEmphasis = 0.5,
      eqTightness = 0.5
    } = params;

    this.harmonicEnhancer.setHarmonicAmount(harmonicAmount);
    this.harmonicEnhancer.setSubHarmonicAmount(subHarmonicAmount);
    this.vbap.setPosition(azimuth, elevation);
    this.transientShaper.setParameters({
      sensitivity: transientSensitivity,
      attack: attackEnhancement,
      sustain: sustainLevel
    });
    this.adaptiveEQ.setParameters({
      adaptation: eqAdaptation,
      emphasis: eqEmphasis,
      tightness: eqTightness
    });
  }

  alignPhase(referenceSignal) {
    this.phaseAligner.align(referenceSignal);
  }
}