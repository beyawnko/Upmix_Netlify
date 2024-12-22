import * as Tone from 'tone';

export class Spatializer {
  constructor() {
    this.input = new Tone.Channel();
    this.output = new Tone.Channel();

    // Mid/Side processing
    this.midSideEncoder = new MidSideEncoder();
    this.midSideDecoder = new MidSideDecoder();
    
    // Mid and Side processing chains
    this.midChain = new Tone.Channel();
    this.sideChain = new Tone.Channel();
    
    // Connect the network
    this.input
      .connect(this.midSideEncoder.input);
    
    this.midSideEncoder.mid.connect(this.midChain);
    this.midSideEncoder.side.connect(this.sideChain);
    
    this.midChain.connect(this.midSideDecoder.mid);
    this.sideChain.connect(this.midSideDecoder.side);
    
    this.midSideDecoder.output.connect(this.output);
  }

  setWidth(width) {
    // Width control (0-2, where 1 is normal stereo)
    this.sideChain.volume.value = Tone.gainToDb(width);
  }

  setDepth(depth) {
    // Depth control using psychoacoustic bass enhancement
    this.midChain.volume.value = Tone.gainToDb(1 - depth * 0.5);
    this.sideChain.volume.value = Tone.gainToDb(depth);
  }
}