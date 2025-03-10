import { sleep, limitArea, findIndex, findIndexFrom, parseM3U } from '@watsonserve/utils';

export interface IMedia {
  start: number;
  duration: number;
  url: string;
}

interface Task extends IMedia { blobUrl?: string }

const request = (url: string, errs: [Error?], time = 1000) => fetch(url)
    .then(resp => resp.ok ? resp.blob() : Promise.reject())
    .then(blob => URL.createObjectURL(blob))
    .catch((err) => (errs[0] = err, sleep(time)));

async function loadToBlob(url: string, errs: [Error?], retry = 3, time = 1000): Promise<string> {
  let blobUrl = '';
  for (; 0 < retry && !blobUrl; retry--) {
    blobUrl = (await request(url, errs, time) || '');
  }
  return blobUrl;
}

function getDuration(url: string) {
  return new Promise<number>(resolve => {
    const a = new Audio();
    a.ondurationchange = () => resolve(a.duration);
    a.src = url;
  });
}

async function fetchAudio(url: string, signal?: AbortSignal) {
  console.log('fetchAudio', url);
  const resp = await fetch(url, { signal });
  console.log('fetchAudio ok', url);

  while(!signal?.aborted) {
    // error
    if (!resp.ok) return Promise.reject(new Error('response is not ok'));

    const ct = resp.headers.get('Content-Type') || '';

    // audio
    if (!ct.match(/mpegurl/i)) {
      const url = URL.createObjectURL(await resp.blob());
      if (signal?.aborted) break;

      const duration = await getDuration(url);
      if (signal?.aborted) break;

      return [{ start: 0, duration, url }];
    }

    const m3u = await resp.text();
    if (signal?.aborted) break;

    return parseM3U(m3u) as IMedia[];
  }

  return Promise.reject(new DOMException(signal.reason, 'AbortError'));
}

export default class Resource {
  private accessToken?: Symbol = undefined;
  private ar: Task[] = [];
  private _totalTime = 0;
  private _statMap = new Map<number, [() => void, (e: Error) => void][]>();
  private _canthrough = false;
  public readonly src: string;

  public canplaythrough?: () => void;
  public canplay?: (idx: number, url: string) => void;

  private _next(start: number) {
    return findIndexFrom(this.ar, start, ({ blobUrl }) => !blobUrl);
  }

  public static init(url: string): Promise<Resource> & { abort(): void } {
    const controller = new AbortController();
    const signal = controller.signal;
    
    const ret = fetchAudio(url, signal).then(l => new Resource(url, l));
    (ret as any).abort = () => controller.abort();

    return ret as any;
  }

  private constructor(url: string, list: IMedia[]) {
    this.src = url;
    this.ar = list;
    this._totalTime = this.ar.reduce((pre, { duration }) => pre + duration, 0);
  }

  public destroy() {
    this.canplay = undefined;
    this.canplaythrough = undefined;
    this.accessToken = undefined;
    this.ar = [];
    this._totalTime = 0;
    this._statMap.clear();
  }

  public get length() {
    return this.ar.length;
  }

  public get totalTime() {
    return this._totalTime;
  }

  public getRes(idx: number) {
    const { url, blobUrl = '' } = this.ar[idx];
    const canplay = +(this._canthrough || blobUrl && blobUrl !== url);
    return { canplay, url: blobUrl };
  }

  public position(ms: number) {
    let idx = 0;
    if (1 < this.ar.length) {
      idx = limitArea(findIndex(this.ar, ms), 0, this.ar.length - 1);
      const { start, duration } = this.ar[idx];
      ms = limitArea(ms - start, 0, duration);
    }

    return [idx, ms];
  }

  private async _load(idx: number, retry = 3): Promise<void> {
    const errs: [Error?] = [];
    const syb = this.accessToken = Symbol();

    for (idx = this._next(idx); syb === this.accessToken && 0 <= idx; idx = this._next(idx)) {
      // set loading
      const { url } = this.ar[idx];
      this.ar[idx].blobUrl = url;
      // set result when load resource success
      const blobUrl = this.ar[idx].blobUrl = await loadToBlob(url, errs, retry);
      const evs = this._statMap.get(idx) || [];
      this._statMap.delete(idx);
      evs.forEach(([resolve, reject]) => blobUrl ? resolve() : reject(errs[0]!));
      this.canplay?.(idx, blobUrl);
    }

    if (syb !== this.accessToken) return;

    this._canthrough = true;
    this.canplaythrough?.();
  }

  public load(idx: number, retry = 3): Promise<void> {
    if (this._canthrough) return Promise.resolve();

    const { url, blobUrl } = this.ar[idx];
    // loaded
    if (blobUrl && url !== blobUrl) return Promise.resolve();

    // not load or loading
    const ret = new Promise<void>((resolve, reject) => {
      const evs = this._statMap.get(idx) || [];
      evs.push([resolve, reject]);
      this._statMap.set(idx, evs);
    });

    // skip loading
    blobUrl || this._load(idx, retry);

    return ret;
  }
}
