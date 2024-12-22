import * as Tone from 'tone';
import { PsychoacousticProcessor } from './processors/PsychoacousticProcessor';

export class AudioEngine {
  constructor() {
    this.context = Tone.context;
    this.stems = new Map();
    this.processors = new Map();
    this.masterBus = new Tone.Channel().toDestination();
  }

  async loadStem(name, url) {
    const player = new Tone.Player(url).sync();
    this.stems.set(name, player);
    
    // Create processing chain for each stem
    const processor = new PsychoacousticProcessor();
    this.processors.set(name, processor);
    
    // Connect player to its processing chain
    player.connect(processor.input);
    processor.output.connect(this.masterBus);
    
    // Align phase with reference (drums for rhythm, bass for harmony)
    if (name !== 'drums' && this.stems.has('drums')) {
      processor.alignPhase(this.stems.get('drums').buffer);
    }
  }

  setStemParameters(name, params) {
    const processor = this.processors.get(name);
    if (!processor) return;

    const {
      width = 1,
      depth = 0.5,
      harmonicAmount = 0.5,
      level = 0
    } = params;
    
    processor.setParameters({
      harmonicAmount,
      subHarmonicAmount: depth,
      azimuth: (width - 1) * 90, // Convert 0-2 range to -90..90 degrees
    });
    
    processor.output.volume.value = level;
  }

  async start() {
    await Tone.start();
    this.stems.forEach(player => player.start());
  }

  stop() {
    this.stems.forEach(player => player.stop());
  }
}