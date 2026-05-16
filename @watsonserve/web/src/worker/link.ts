import { sleep } from '@watsonserve/utils';
import EventEmitter from 'events';
import path from 'path';

interface IUploadPayload { to: string; file: File }
const million = 1 << 20;
const halfMillion = 1 << 19;

async function genReq(to: string, file: File) {
  const { name, type, lastModified, size } = file;
  const meta = { name: path.join(to, name), type, lastModified, size } as any;
  const header = Object.keys(meta).map(k => `${k}: ${meta[k]}`).join('\r\n') + '\r\n\r\n';
  const body = await file.arrayBuffer();
  return new Blob([header, body]).arrayBuffer();
}

export default class Uploader extends EventEmitter {
  private _queue: IUploadPayload[];
  private ws!: WebSocket;

  constructor(wsAddr: string, queue: IUploadPayload[]) {
    super();
    this._queue = queue;
    this._initws(wsAddr);
  }

  private _initws(wsAddr: string) {
    this.ws = new WebSocket(wsAddr);

    this.ws.onopen = () => {
    };

    this.ws.onmessage = (ev: MessageEvent<any>) => {
      let data = ev.data;
      try {
        data = JSON.parse(data);
      } catch (err) {
        //
      }
      this.emit('message', data);
    }

    this.ws.onclose = () => {
      return this.emit('close');
    };

    this.ws.onerror = () => this.emit('error');
  }

  set queue(q: IUploadPayload[]) {
    this._queue = q;
  }

  /**
   * 
   * @param data will send data
   * @returns Byte/s
   */
  private async _progress(total: number, off = 0): Promise<void> {
    off = Math.min(off, total);
    const bam = this.ws.bufferedAmount;
    this.emit('progress', off - bam);
  }

  // private __send() {
  //   const total = data.byteLength;
  //   const stamp = Date.now();
  //   const ended = total === off;
  //   if (!ended) {
  //     this.ws.send(data.slice(off, million));
  //   }
  //   await sleep(500);
  //   this.emit('speed', 1000 * (bam - this.ws.bufferedAmount) / (Date.now() - stamp));
  //   if (!ended || bam) {
  //     return this.__send(data, off + million);
  //   }
  // }

  async _send() {
    const payload = this._queue.shift();
    if (!payload) return;
    const { to, file } = payload;
    const req = await genReq(to, file);
    for (let i = 0; i < req.byteLength; i += million) {
      if (halfMillion < this.ws.bufferedAmount) {
        const a = Date.now()
        await sleep(1000);
        console.log('delta: %d', Date.now() - a);
        continue;
      }
      this.ws.send(req.slice(i, i + million));
    }
  }

  upload() {
    switch (this.ws.readyState) {
      case WebSocket.OPEN:
        return this._send();
      case WebSocket.CONNECTING:
        return;
      default:
        throw new Error('close link can not send');
    }
  }
}
