import * as Tone from 'tone';
import { OnsetDetector } from '../analysis/OnsetDetector';

export class TransientShaper {
  constructor() {
    this.input = new Tone.Channel();
    this.output = new Tone.Channel();
    
    // Onset detection
    this.onsetDetector = new OnsetDetector();
    
    // Envelope followers
    this.fastEnv = new Tone.Follower(0.005); // 5ms
    this.slowEnv = new Tone.Follower(0.050); // 50ms
    
    // Gain stages
    this.attackGain = new Tone.Gain(1);
    this.sustainGain = new Tone.Gain(1);
    
    // Dynamic processor
    this.compressor = new Tone.Compressor({
      threshold: -24,
      ratio: 4,
      attack: 0.003,
      release: 0.25
    });
    
    // Connect processing chain
    this.input.connect(this.onsetDetector.input);
    this.input.connect(this.fastEnv);
    this.input.connect(this.slowEnv);
    this.input.connect(this.compressor);
    this.compressor.connect(this.output);
    
    // Start onset detection loop
    this.processLoop();
  }

  async processLoop() {
    const onset = this.onsetDetector.detect();
    if (onset) {
      this.processTransient(onset);
    }
    
    // Schedule next detection
    requestAnimationFrame(() => this.processLoop());
  }

  processTransient(onset) {
    const { time, strength, type } = onset;
    
    // Dynamic attack enhancement based on transient type
    switch (type) {
      case 'sharp':
        this.enhanceAttack(strength * 1.5, 0.005);
        break;
      case 'normal':
        this.enhanceAttack(strength, 0.010);
        break;
      case 'soft':
        this.enhanceAttack(strength * 0.8, 0.015);
        break;
    }
  }

  enhanceAttack(amount, time) {
    const now = Tone.now();
    
    // Calculate dynamic gain based on envelope followers
    const fastLevel = this.fastEnv.getValue();
    const slowLevel = this.slowEnv.getValue();
    const transientLevel = fastLevel / slowLevel;
    
    // Apply gain boost with natural decay
    this.attackGain.gain.cancelScheduledValues(now);
    this.attackGain.gain.setValueAtTime(1 + (amount * transientLevel), now);
    this.attackGain.gain.exponentialRampToValueAtTime(1, now + time);
  }

  setParameters(params) {
    const {
      sensitivity = 0.5,
      attack = 1,
      sustain = 1
    } = params;
    
    this.onsetDetector.threshold = 0.2 + (sensitivity * 0.6);
    this.attackGain.gain.value = attack;
    this.sustainGain.gain.value = sustain;
  }
}