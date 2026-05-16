import { EventEmitter } from 'events';
import { AudioInvoke, AudioReqEvent, AudioRespEvent } from '../entities';
import { EnPlayStat } from '@watsonserve/audio-player';

class Channel extends EventEmitter {
  private static _channel: Channel | null = null;
  private static _wait?: Promise<any>;
  private port: any;

  static async getInstance() {
    if (!Channel._channel) {
      if (!Channel._wait) Channel._wait = (window as any).getChannel();
      const port = await Channel._wait;
      Channel._wait = undefined;
      Channel._channel = new Channel(port);
    }
    return Channel._channel;
  }

  constructor(port: any) {
    super();
    this.port = port;
    port.on(({ event, args }: any) => super.emit(event, args));
  }

  emit(event: string | symbol, args?: any): boolean {
    this.port.postMessage({ event, args });
    return true;
  }

  async invoke<T extends AudioInvoke>(event: T, payload?: AudioReqEvent[T]): Promise<AudioRespEvent[T]> {
    this.emit(event, payload);
    return new Promise(resolve => this.once(`${event}Resp`, payload => resolve(payload)));
  }  
}

export interface IListChangedEvent {
  listAddr: string;
  offset: number;
  list: any[];
}

export default class Audioface {
  private static ins: Audioface;
  private static wait?: Promise<Channel>;
  private port: Channel;

  static async getInstance() {
    if (!Audioface.ins) {
      if (!Audioface.wait) Audioface.wait = Channel.getInstance();

      const port = await Audioface.wait;
      Audioface.wait = undefined;
      Audioface.ins = new Audioface(port);
    }

    return Audioface.ins;
  }

  constructor(port: Channel) {
    this.port = port;
  }

  on(eventName: 'stateChange', fn: (playStat: EnPlayStat) => void): void;
  on(eventName: 'ended', fn: () => void): void;
  on(eventName: 'played', fn: (resp: any) => void): void;
  on(eventName: 'costed', fn: (costTime: number) => void): void;
  on(eventName: 'listChanged', fn: (resp: IListChangedEvent) => void): void;
  on(eventName: string, fn: (...args: any[]) => void) {
    this.port.on(eventName, fn);
  }

  off(eventName: 'stateChange', fn: (playStat: EnPlayStat) => void): void;
  off(eventName: 'ended', fn: () => void): void;
  off(eventName: 'played', fn: (resp: any) => void): void;
  off(eventName: 'costed', fn: (costTime: number) => void): void;
  off(eventName: 'listChanged', fn: (resp: IListChangedEvent) => void): void;
  off(eventName: string, fn: (...args: any[]) => void) {
    this.port.off(eventName, fn);
  }

  async loadFrequencies() {
    return this.port.invoke('frequencies');
  }

  async setGain(f: number, dB: number) {
    const err = await this.port.invoke('setEq', { f, dB });
    if (err) return Promise.reject(err);
  }

  setLoop(l: number) {
    this.port.emit('setLoop', l);
  }

  async loadIndex(idx: number): Promise<void> {
    const err = await this.port.invoke('load', idx);
    if (err) return Promise.reject(err);
  }

  loadNext(delta: 1 | -1) {
    this.port.emit('loadNext', delta);
    return;
  }

  loadList(name: string) {
    this.port.emit('loadList', name);
    return;
  }

  setRandom(random = false) {
    this.port.emit('setRandom', random);
    return;
  }

  play() {
    this.port.emit('play');
  }

  // 暂停
  pause() {
    this.port.emit('pause');
  }

  // 重定位
  seek(_seek: number) {
    this.port.emit('seek', { seek: _seek, now: Date.now() });
  }

  init() {
    return this.port.invoke('getStat');
  }
}
