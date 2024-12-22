import * as Tone from 'tone';

export class MidSideEncoder {
  constructor() {
    this.input = new Tone.Channel();
    this.mid = new Tone.Channel();
    this.side = new Tone.Channel();

    // Create mid/side matrix
    this.splitter = new Tone.Split();
    this.midSum = new Tone.Add();
    this.sideDiff = new Tone.Subtract();
    
    // Connect the network
    this.input
      .connect(this.splitter);
    
    this.splitter.connect(this.midSum, 0, 0);
    this.splitter.connect(this.midSum, 1, 1);
    this.splitter.connect(this.sideDiff, 0, 0);
    this.splitter.connect(this.sideDiff, 1, 1);
    
    this.midSum.connect(this.mid);
    this.sideDiff.connect(this.side);
  }
}

export class MidSideDecoder {
  constructor() {
    this.mid = new Tone.Channel();
    this.side = new Tone.Channel();
    this.output = new Tone.Channel();

    // Create decoder matrix
    this.merger = new Tone.Merge();
    this.leftSum = new Tone.Add();
    this.rightDiff = new Tone.Subtract();
    
    // Connect the network
    this.mid.connect(this.leftSum, 0, 0);
    this.side.connect(this.leftSum, 0, 1);
    
    this.mid.connect(this.rightDiff, 0, 0);
    this.side.connect(this.rightDiff, 0, 1);
    
    this.leftSum.connect(this.merger, 0, 0);
    this.rightDiff.connect(this.merger, 0, 1);
    
    this.merger.connect(this.output);
  }
}