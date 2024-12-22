import * as Tone from 'tone';

export class VBAP {
  constructor(numSpeakers = 2) {
    this.input = new Tone.Channel();
    this.output = new Tone.Channel();
    
    // Create speaker array
    this.speakers = Array(numSpeakers).fill().map(() => new Tone.Channel());
    
    // Gain matrix for vector-based amplitude panning
    this.gainMatrix = this.speakers.map(() => new Tone.Gain(0));
    
    // Connect inputs to gain matrix
    this.gainMatrix.forEach((gain, i) => {
      this.input.connect(gain);
      gain.connect(this.speakers[i]);
      this.speakers[i].connect(this.output);
    });
  }

  setPosition(azimuth, elevation = 0) {
    // Calculate gain factors based on speaker positions
    const gains = this.calculateVBAPGains(azimuth, elevation);
    
    // Apply gains to matrix
    gains.forEach((gain, i) => {
      this.gainMatrix[i].gain.value = gain;
    });
  }

  calculateVBAPGains(azimuth, elevation) {
    // Convert angles to radians
    const az = (azimuth * Math.PI) / 180;
    const el = (elevation * Math.PI) / 180;
    
    // Calculate direction vector
    const x = Math.cos(el) * Math.cos(az);
    const y = Math.cos(el) * Math.sin(az);
    const z = Math.sin(el);
    
    // Calculate gains based on speaker positions
    // For stereo, simplify to basic amplitude panning
    if (this.speakers.length === 2) {
      const pan = (azimuth + 90) / 180; // Convert -90..90 to 0..1
      return [Math.cos(pan * Math.PI/2), Math.sin(pan * Math.PI/2)];
    }
    
    // For more speakers, implement full VBAP algorithm
    return this.speakers.map((_, i) => {
      const speakerAz = (i * 360 / this.speakers.length) * Math.PI / 180;
      const speakerX = Math.cos(speakerAz);
      const speakerY = Math.sin(speakerAz);
      return Math.max(0, x * speakerX + y * speakerY);
    });
  }
}