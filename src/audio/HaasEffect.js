import * as Tone from 'tone';

export class HaasEffect {
  constructor() {
    this.input = new Tone.Channel();
    this.output = new Tone.Channel();
    
    // Create stereo delay network
    this.leftDelay = new Tone.Delay(0);
    this.rightDelay = new Tone.Delay(0);
    
    // Create stereo split and merge
    this.splitter = new Tone.Split();
    this.merger = new Tone.Merge();

    // Connect the network
    this.input
      .connect(this.splitter);
    
    this.splitter.connect(this.leftDelay, 0);
    this.splitter.connect(this.rightDelay, 1);
    
    this.leftDelay.connect(this.merger, 0, 0);
    this.rightDelay.connect(this.merger, 0, 1);
    
    this.merger.connect(this.output);
  }

  setDelay(delayMs) {
    // Convert ms to seconds for Tone.js
    const delayTime = delayMs / 1000;
    this.rightDelay.delayTime.value = delayTime;
  }
}