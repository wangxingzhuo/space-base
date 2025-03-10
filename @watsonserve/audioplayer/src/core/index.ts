import { EnPlayStat, EnLoadMode, _PRELOAD, _AUTOPLAY } from '../base';
import Resource from './resource';
import Kernel from './kernel';

export { Resource };

export abstract class Core extends Kernel {
  private _au?: Resource;
  private currentIndex = 0;
  private segTime = 0;
  private waitingFor?: [number, number] = undefined;
  protected _shouldPlay = false;

  protected abstract handleEnded(): void;
  protected abstract handleStatChange(s: EnPlayStat): void;

  public constructor() {
    super();
  }

  private async _play(url: string, ms = 0) {
    await super._setTrack(url);
    ms && super.seek(ms);

    // remove state loading
    if (!this._shouldPlay) return this.handleStatChange(this.stat);

    super.play();
    this._shouldPlay = false;
  }

  private _setup(idx: number, ms = 0, ap = false) {
    if (!this._au) return;

    const { canplay, url } = this._au.getRes(idx);

    this._shouldPlay = ap;
    if (canplay) return this._play(url, ms);

    this.waitingFor = [idx, ms];
    this._au.load(idx);
    // into state pending
    this.handleStatChange(this.stat);
  }

  protected override _evStChange(s: EnPlayStat): void {
    if (EnPlayStat.LOADING === s) return console.warn('kernel pending');

    if (this.waitingFor && EnPlayStat.STOP !== s)
      this._shouldPlay = EnPlayStat.RUNNING === this.stat;

    this.handleStatChange(this.stat);
  }

  protected _evEnded() {
    const len = this._au?.length || 0;
    this.currentIndex++;
    if (len <= this.currentIndex) return this.handleEnded();

    const costTime = this.costTime;
    this._setup(this.currentIndex, 0, true);
    this.segTime = costTime;
  };

  public override get stat(): EnPlayStat {
    if (this.waitingFor) return EnPlayStat.LOADING;
    return super.stat;
  }

  public override get totalTime() {
    if (!this._au) return 0;

    const { totalTime, length } = this._au;
    return length < 2 ? super.totalTime : totalTime;
  }

  public override get costTime() {
    return this.segTime + super.costTime;
  }

  public override seek(ms: number) {
    if (!this._au) return;

    const [idx, _ms] = this._au.position(ms);
    // console.log(`seek: ${ms} ${_ms}`)
    this._setup(idx, _ms, this.stat === EnPlayStat.RUNNING);

    this.segTime = ms - _ms;
    _ms && super.seek(_ms);
  }

  public loadRes(au: Resource, mode: EnLoadMode) {
    if (!mode) return;

    this._au?.destroy();
    this._au = au;

    au.canplay = (idx: number, url: string) => {
      if (!this.waitingFor) return;

      const [seg, ms] = this.waitingFor;
      if (idx !== seg) return;

      this.waitingFor = undefined;
      this._play(url, ms);
    };

    au.canplaythrough = () => console.info(`playcanthrough ${au.src}`);

    this.currentIndex = 0;
    this._setup(0, 0, !!(mode & _AUTOPLAY));
  }
}
