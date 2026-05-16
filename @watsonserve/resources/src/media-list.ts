import fs from 'fs/promises';
import path from 'path';
import { httpLoad } from './fetch';

export interface IMedia {
  title: string;
  start: number;
  duration: number;
  url: string;
}

class Media implements IMedia {
  title: string;
  duration: number;
  start: number;
  url: string;

  constructor(s: number, d: number, t: string, u: string) {
    this.duration = d;
    this.start = s;
    this.url = u;
    this.title = t;
  }
}

function coll(resList: IMedia[], line: string): void {
  const isShap = '#' === line.at(0);
  // whitespace or comments
  if (!line || isShap && 'EXT' !== line.substring(1, 4)) return;

  // is URL
  if (!isShap) {
    resList[resList.length - 1].url = line;
    return;
  }

  // info
  if (line.startsWith('#EXTINF')) {
    const lineArr = line.substring(8).trim().split(',');
    const duration = lineArr[0];
    const title = lineArr[1] || '';
    resList.push(new Media(0, Number.parseFloat(duration), title, ''));
    return;
  }
}

function parseM3U(m3u: string): IMedia[] {
  if (!m3u.startsWith('#EXTM3U')) throw new Error('parse m3u failed');
  if (-1 !== m3u.indexOf('EXT-X-MEDIA')) throw new Error('it is a  MasterPlaylist');

  // m3u8
  const playlist = m3u.replaceAll('\r', '').split('\n');

  const resList: IMedia[] = [];
  for (let i = 0; i < playlist.length; i++) {
    coll(resList, playlist[i]);
  }

  for (let len = resList.length, i = 1; i < len; i++) {
    const item = resList[i - 1];
    resList[i].start = item.start + item.duration;
  }
  return resList;
}

async function loadRemoteFile(url: string) {
  const { body } = await httpLoad(url);
  return body.toString('utf-8');
}

const MUSIC_EXTNAMES = new Set(['mp3', 'flac', 'wav']);

async function _loadDir(resPath: string, filter?: (d: IMedia) => boolean): Promise<IMedia[]> {
  try {
    resPath = path.normalize(resPath);
    const files = await fs.readdir(resPath, { encoding: 'utf-8', withFileTypes: true });
    let data = files.map(file => {
      const name = file.name + (file.isDirectory() ? '/' : '');
      return new Media(0, 0, name, `file://${path.resolve(resPath, name)}`);
    });
    if (filter) {
      data = data.filter(filter);
    }
    return data;
  } catch (err) {
    console.error(err);
  }
  return [];
}

export function fetchM3U(url: string) {
  // http(s)://xxxx.m3u
  if (url.startsWith('http://') || url.startsWith('https://')) return loadRemoteFile(url).then(parseM3U);

  // file://xxxx.m3u
  if (url.startsWith('file://')) {
    url = decodeURIComponent(url.substring(7));
  }

  if (url[0] !== '/') url = `/${url}`;
  if (url.endsWith('.m3u')) return fs.readFile(url, 'utf-8').then(parseM3U);

  // file://xxxx/
  if (!url.endsWith('/')) url += '/';
  return _loadDir(url, (item) => MUSIC_EXTNAMES.has(path.extname(item.title).substring(1)));
}
