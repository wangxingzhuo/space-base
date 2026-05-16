import { EventEmitter } from 'events';

export default class WorkerChannel extends EventEmitter {
  private static _channel: WorkerChannel | null = null;
  private readonly port = new Worker(new URL('@/worker', import.meta.url));

  static getInstance() {
    if (!WorkerChannel._channel) {
      WorkerChannel._channel = new WorkerChannel();
    }
    return WorkerChannel._channel;
  }

  private constructor() {
    super();
    const handleMsg = (ev: any) => {
      const { event, args } = ev.data;
      super.emit(event, args);
    };
    this.port.addEventListener('message', handleMsg);
  }

  emit(event: string | symbol, args: any): boolean {
    this.port.postMessage({ event, args });
    return true;
  }

  async invoke<T extends string>(event: T, payload: any): Promise<any> {
    this.emit(event, payload);
    return new Promise(resolve => this.once(`${event}Resp`, payload => resolve(payload)));
  }  
}
