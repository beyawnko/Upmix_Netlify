import * as Tone from 'tone';

export class EQBand {
  constructor(frequency, Q = 1, gain = 0) {
    this.filter = new Tone.Filter({
      frequency,
      Q,
      gain,
      type: 'peaking'
    });
  }

  setParameters({ frequency, Q, gain }) {
    if (frequency !== undefined) this.filter.frequency.value = frequency;
    if (Q !== undefined) this.filter.Q.value = Q;
    if (gain !== undefined) this.filter.gain.value = gain;
  }

  connect(destination) {
    this.filter.connect(destination);
    return this;
  }

  getFrequencyResponse(frequencies) {
    return frequencies.map(f => {
      const response = this.filter.getFrequencyResponse(f);
      return response.magnitude;
    });
  }
}