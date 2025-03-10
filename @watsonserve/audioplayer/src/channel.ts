import { EventEmitter } from 'events';
import { EnPlayStat } from './base';


interface AudioReqEvent {
  info: undefined;
  load: string;
  seek: Record<'seek' | 'now', number>;
}

interface AudioRespEvent {
  info: {
    costTime: number;
    totalTime: number;
    stat: EnPlayStat;
    frequencies: number[];
  };
  load: { err: Error };
  seek: undefined;
}

type AudioInvoke = keyof (AudioReqEvent | AudioRespEvent);

export default class Channel extends EventEmitter {
  private static _channel: Channel | null = null;
  private port: any;

  static async getInstance() {
    if (!Channel._channel) {
      const port = await (window as any).getChannel();
      Channel._channel = new Channel(port);
    }
    return Channel._channel;
  }

  constructor(port: any) {
    super();
    this.port = port;
    port.on(({ event, args }: any) => {
      console.log(`bg channel recv: ${JSON.stringify({ event, args })}`);
      super.emit(event, args);
    });
  }

  override emit(event: string, args?: any): boolean {
    this.port.postMessage({ event, args });
    return true;
  }

  async invoke<T extends AudioInvoke>(event: T, payload?: AudioReqEvent[T]): Promise<AudioRespEvent[T]> {
    this.emit(event, payload);
    return new Promise(resolve => this.once(`${event}Resp`, resolve));
  }

  async bridge(api: string, payload?: any) {
    const resp = await this.port.bridge(api, payload);
    return resp.json();
  }
}
