import { Wrapper } from '../base';

function _createNode(ac: AudioContext, freq: number) {
  const biquadFilter = ac.createBiquadFilter();
  biquadFilter.type = 'peaking';
  biquadFilter.Q.setValueAtTime(2, ac.currentTime);
  biquadFilter.frequency.setValueAtTime(freq, ac.currentTime);
  return biquadFilter;
}

export interface IEq {
  readonly frequencyValues: [number, number][];
  setGain(freq: number, dB: number): void;
  setEq(gains: Map<number, number>): void;
}

export class Eq implements IEq {
  static get default_frequencies() {
    return [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
  }

  private readonly acw: Wrapper<AudioContext>;
  private _frequencies!: number[];
  private bfs!: BiquadFilterNode[];
  private dict = new Map<number, number>();

  constructor(acw: Wrapper<AudioContext>, freq = Eq.default_frequencies) {
    this.acw = acw;
    this.setFrequencies(freq);
  }

  destroy() {
    this.dict.clear();
    this.bfs.forEach(nd => nd.disconnect());
    this.bfs = [];
  }

  protected createNodes() {
    this.dict.clear();
    Array.isArray(this.bfs) && this.bfs.forEach(bf => bf.disconnect());

    this.bfs = this._frequencies.reduce<BiquadFilterNode[]>((pre, freq, idx) => {
      const peqNode = _createNode(this.acw.__proto__, freq);
      if (idx) {
        pre[idx - 1].connect(peqNode);
      }
      this.dict.set(freq, idx);
      pre.push(peqNode);
      return pre;
    }, []);
  }

  protected setFrequencies(val: number[]) {
    this._frequencies = [...val];
    this.createNodes();
  }

  public get frequencyValues() {
    return [...this.bfs.map(bfn => [ bfn.frequency.value, bfn.gain.value ] as [number, number])];
  }

  public connectPrev(prev: { connect(an: AudioNode): any }) {
    if (!this.bfs?.length) throw new Error('no biquad filter');
    prev.connect(this.bfs[0]);
  }

  public connectNext(next: AudioNode) {
    if (!this.bfs?.length) throw new Error('no biquad filter');
    this.bfs[this.bfs.length - 1].connect(next);
  }

  public setGain(freq: number, dB: number) {
    const idx = this.dict.get(freq);
    if (undefined === idx) throw new Error(`frequency ${freq}Hz not found`);
    const node = this.bfs[idx];
    node.gain.setValueAtTime(dB, this.acw.__proto__.currentTime);
  }

  public setEq(gains: Map<number, number>) {
    gains.forEach((f, dB) => this.setGain(f, dB));
  }
}
