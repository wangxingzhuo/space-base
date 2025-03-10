import { EventEmitter } from 'events';
import { EnLoadMode, EnPlayStat } from './base';
import { Core, Resource } from './core';
import ResMgr, { EnLoop } from './res_mgr';

export { EnLoop, EnLoadMode, EnPlayStat };

// event: error, costed, ended, stateChange, played, listChanged
export class Player extends Core {
  private readonly resMgr: ResMgr;
  private prendTime = 5000;
  private currentResourceIndex = 0;

  private autoPlayRes: Promise<Resource> & { abort(): void } | null = null;

  protected override _evError(): void {
    this.eventEmitter.emit('error');
  }

  protected override _evTimeupdate(): void {
    const { totalTime, costTime } = this;
    this.eventEmitter.emit('costed', costTime);
    const timeDelta = totalTime - costTime;

    // 播放即将结束，预加载
    timeDelta < this.prendTime && this.preEnd();
  }

  private async waitLoad() {
    if (!this.autoPlayRes) return;
    console.warn('wait load');

    let res: Resource;
    try {
      res = await this.autoPlayRes;
      this.autoPlayRes = null;
    } catch(err) {
      console.warn(err);
      this.autoPlayRes = null;
      return err;
    }

    return super.loadRes(res, EnLoadMode.STOP_AND_PLAY);
  }

  protected override handleEnded() {
    this.eventEmitter.emit('ended');

    if (EnLoop.ONE === this.resMgr.loop) return super.play();

    if (!this.autoPlayRes) return;
    this.resMgr.getRes((this.autoPlayRes as any).resNo);
    this.waitLoad();
  }

  private preEnd() {
    const resMgr = this.resMgr;
    if (resMgr.offset === this.currentResourceIndex) return;

    this.currentResourceIndex = resMgr.offset;
    const [addr, idx] = resMgr.getNextRes();
    this.autoPlayRes = Resource.init(addr);
    (this.autoPlayRes as any).resNo = idx;
  }

  protected override handleStatChange(s: EnPlayStat) {
    if (s !== EnPlayStat.RUNNING) return this.eventEmitter.emit('stateChange', s);
    this.eventEmitter.emit('played', { totalTime: this.totalTime, resIndex: this.resMgr.offset });
  }

  constructor(resMgr: ResMgr) {
    super();
    this.resMgr = resMgr;
  }

  // public

  togglePlay() {
    EnPlayStat.RUNNING === this.stat ? super.pause() : super.play();
  }

  override seek(stmp: number) {
    super.seek(stmp);
    EnPlayStat.PAUSE === this.stat && this.eventEmitter.emit('costed', stmp);
  }


  // resource manager

  async setRandom(random = false) {
    const { resMgr } = this;
    resMgr.resetRandom(random);
    this.eventEmitter.emit('listChanged', { listAddr: resMgr.listName, offset: resMgr.offset, list: resMgr.list });
  }

  async loadList(resPath = '') {
    try {
      const { resMgr } = this;
      // dir path
      await resMgr.setList(resPath);
      this.eventEmitter.emit('listChanged', { listAddr: resMgr.listName, offset: resMgr.offset, list: resMgr.list });
    } catch (err) {
      this.eventEmitter.emit('error', { ifn: 'loadList', err });
    }
  }

  async setLoop(loop: EnLoop) {
    this.resMgr.loop = loop;
  }

  setDb({f, dB}: { f: number; dB: number }) {
    let _err: undefined | Error = undefined;

    try {
      this.setGain(f, dB);
    } catch(err: any) {
      _err = err;
    }
    return _err;
  }

  getStat() {
    const { listName, loop, isRandom, offset, list } = this.resMgr;

    if (!list?.length) this.loadList();
    else this.eventEmitter.emit('listChanged', { listAddr: listName, offset, list });

    const { stat, totalTime, costTime } = this;
    return { stat, loop, isRandom, totalTime, costTime };
  }

  loadNext(delta: 1 | -1, mode = EnLoadMode.STOP_AND_PLAY) {
    const len = this.resMgr.list?.length || 1;
    const idx = (this.resMgr.offset + delta + len) % len;
    this.load(idx, mode);
  }

  async load(idx: number, mode = EnLoadMode.STOP_AND_PLAY) {
    if (EnLoadMode.STOP_AND_PLAY === mode) this.stop();

    const addr = this.resMgr.getRes(idx);
    if (!addr) {
      console.error('no resource', this.resMgr.list, idx);
      return;
    }
    this.autoPlayRes = Resource.init(`res://${encodeURIComponent(addr)}`);

    return this.waitLoad();
  }

  // event listener
  private readonly eventEmitter = new EventEmitter();
  
  addListener(event: string, listener: (...args: any[]) => void) {
    this.eventEmitter.addListener(event, listener);
    return this;
  }
  on(event: string, listener: (...args: any[]) => void) {
    this.eventEmitter.on(event, listener);
    return this;
  }
  once(event: string, listener: (...args: any[]) => void) {
    this.eventEmitter.once(event, listener);
    return this;
  }
  removeListener(event: string, listener: (...args: any[]) => void) {
    this.eventEmitter.removeListener(event, listener);
    return this;
  }
  off(event: string, listener: (...args: any[]) => void) {
    this.eventEmitter.off(event, listener);
    return this;
  }
  removeAllListeners(event?: string) {
    this.eventEmitter.removeAllListeners(event);
    return this;
  }
}
