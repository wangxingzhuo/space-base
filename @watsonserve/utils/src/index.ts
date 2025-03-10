export * from './utils';
export * from './io';
export * from './indexdb';
export * from '@watsonserve/asm';

interface IMedia {
  start: number;
  duration: number;
  url: string;
}

// const { mimeDict } = await async function() {
//   const url = new URL("../../asm/dist/index.wasm", import.meta.url);
//   return instantiate(globalThis.WebAssembly.compileStreaming(globalThis.fetch(url)))
// }

export function isInApp() {
  return !!navigator.userAgent.match(/Electron/);
}

// interface Foo {
//   id: string
//   external?: boolean | "relative" | "absolute"
//   moduleSideEffects?: boolean | "no-treeshake" | null
//   syntheticNamedExports?: boolean | string | null
//   meta?: {[plugin: string]: any} | null
// }

// type resolveId = (
//   source: string,
//   importer: string | undefined,
//   options: {isEntry: boolean, custom?: {[plugin: string]: any}}
// ) =>
// string | false | null | Foo


export function findIndex(ar: {start: number; duration: number}[], x: number) {
  let e = ar.length - 1;
  // lt ar
  if (x < ar[0].start) return -1;
  const { start: _start, duration: _duration } = ar[e];
  // gt ar
  if (_start + _duration <= x) return e + 1;

  let s = 0;
  do {
    let i = (s + e) >> 1;
    const { start, duration } = ar[i];
    const end = start + duration;
    if (start <= x && x < end) return i;
    if (end === x) return i + 1;

    if (x < start) e = i - 1;
    if (end < x) s = i + 1;
  } while(s < e);

  return s;
}

export function limitArea(x: number, min = -Infinity, max = Infinity) {
  if (x < min) return min;
  if (max < x) return max;
  return x;
}

export function findIndexFrom<T>(ar: T[], start = 0, cb: (t: T) => boolean) {
  if (ar.length < start) start = ar.length;

  let i = start;
  for (; i < ar.length && !cb(ar[i]); i++);
  if (i < ar.length) return i;
  for (i = 0; i < start && !cb(ar[i]); i++);
  return start <= i ? -1 : i;
}

export function parseM3U(m3u: string) {
  if (!m3u.startsWith('#EXTM3U')) throw new Error('parse m3u failed');
  if (-1 !== m3u.search('EXT-X-MEDIA')) throw new Error('it is a  MasterPlaylist');

  // m3u8
  const playlist = m3u.replace(/\r/g, '').split('\n');

  const resList: IMedia[] = [];
  playlist.forEach(line => {
    const isShap = '#' === line[0];
    // whitespace or comments
    if (!line || isShap && 'EXT' !== line.substring(1, 4)) return;

    // is URL
    if (!isShap) {
      resList[resList.length - 1].url = line;
      return;
    }

    // info
    if (line.startsWith('#EXTINF')) {
      const [ duration, title = '' ] = line.substring(8).trim().split(',');
      resList.push({ start: 0, duration: +duration, title, url: '' } as IMedia);
      return;
    }
  });

  for (let len = resList.length, i = 1; i < len; i++) {
    const { start, duration } = resList[i - 1];
    resList[i].start = start + duration;
  }
  return resList;
}
