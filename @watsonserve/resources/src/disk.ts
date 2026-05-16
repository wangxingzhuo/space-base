import fs from 'fs/promises';
import _fs from 'fs';
import path from 'path';
import os from 'os';
import mimeDict from './mime';
import { request } from './fetch';

export interface IResource {
  url: string;
  size: number;
  duration: number;
  randName: string;
  cacheRange: [number, number][] | null;
}

function mkTempFile(filename: string): [_fs.WriteStream, _fs.ReadStream] {
  const fd = _fs.openSync(filename, 'w+');
  _fs.closeSync(fd);
  const wr = _fs.createWriteStream(filename, { encoding: 'binary', autoClose: true });
  const rd = _fs.createReadStream(filename, { encoding: 'binary', autoClose: true });
  return [wr, rd];
}

class LocationResources {
  private _cacheDir = os.homedir();
  protected _locationMap = new Map<string, IResource>();

  get songsFile() {
    return path.resolve(this._cacheDir, '.space-location.json');
  }

  setCacheDir(dir: string) {
    this._cacheDir = dir;
  }

  save() {
    let str = JSON.stringify([...this._locationMap.values()]);
    str = str.substring(1, str.length - 1) + ',';
    return fs.writeFile(this.songsFile, str, { encoding: 'utf-8' });
  }

  // find by name or singer
  find(url: string) {
    const info = this._locationMap.get(url);
    return info ? { ...info, randName: path.resolve(this._cacheDir, info.randName) } : null;
  }

  async append(song: IResource) {
    const str = JSON.stringify(song);
    this._locationMap.set(song.url, JSON.parse(str));
    return fs.appendFile(this.songsFile, str + ',', { encoding: 'utf-8' });
  }

  /**
   * remove a location song
   * @param urls file path, example: file://xxxx or /xxxx/xxx.wav
   * @param rmFile if true will delete the file, default value is false
   * @returns
   */
  async delete(urls: string[], rmFile = false) {
    const willRemove = new Set<string>();

    urls.forEach(url => {
      const { randName = '' } = this._locationMap.get(url) || {};
      this._locationMap.delete(url);
      willRemove.add(randName);
    });
    await this.save();

    if (!rmFile) return;

    willRemove.delete('');
    await Promise.all([...willRemove].map(name => fs.rm(name).catch(err => err.message)));
  }

  async modify(info: IResource) {
    const { url } = info;
    const item = this._locationMap.get(url);
    if (!item) return;

    Object.assign(item, info);
    return this.save();
  }

  async loadResList(): Promise<void> {
    try {
      const content = await fs.readFile(this.songsFile, 'utf-8');
      const list = JSON.parse(`[${content}]`) as IResource[];
      this._locationMap = new Map(list.map(item => [item.url, item]));
    } catch (err) {
      console.error(err);
    }
  }
}

export class Collections extends LocationResources {
  protected collFile = '.space-collections.json';
  private static _collMgr: Collections | null = null;

  static getInstance() {
    if (!Collections._collMgr) {
      Collections._collMgr = new Collections();
    }
    return Collections._collMgr;
  }

  private constructor() {
    super();
  }

  // all cached
  private getCached(randName: string, size: number, mime: string) {
    return new Response(_fs.createReadStream(randName) as any, {
      status: 200,
      statusText: 'OK',
      headers: { 'Content-Type': mime, 'Content-Length': `${size}` }
    });
  }

  private async getFile(href: string, mime: string) {
    let errMsg = '';
    try {
      href = href.substring(6);
      if (href.startsWith('//')) {
        href = href.substring(1);
      }
      const stat = await fs.stat(href);

      return this.getCached(href, stat.size, mime);
    } catch (err) {
      errMsg = (err as Error).message;
    }

    return new Response(null, { status: 404, statusText: 'Not Found' });
  }

  private async loadOrigin(href: string, filename: string, strRange: string) {
    // const strRange = req.headers.get('Range') || req.headers.get('range') || 'bytes=0-65536';
    const resp = await request(href, strRange ? { Range: strRange } : undefined);
    const { statusCode, statusMessage, headers: respHeaders } = resp;
    const [w, r] = mkTempFile(filename);
    resp.pipe(w);
    const retHeaders = ['content-type', 'content-length', 'content-range'].reduce<Record<string, string>>((pre, key) => {
      const val = respHeaders[key] as string;
      if (val) pre[key] = val;
      return pre;
    }, {});

    return new Response(r as any, { status: statusCode, statusText: statusMessage, headers: retHeaders });
  }

  async loadRes(href: string, range: string) {
    const { protocol, host, pathname, search, hash } = new URL(href);
    const extNamePos = pathname.lastIndexOf('.');
    const mime = mimeDict(pathname.substring(extNamePos));

    if (protocol === 'file:') return this.getFile(href, mime);

    const cacheInfo = this.find(href);
    // all cached
    if (cacheInfo && cacheInfo.cacheRange === null) return this.getCached(cacheInfo.randName, cacheInfo.size, mime);

    const filename = path.resolve('.', (~~(Math.random() * 100000000)).toString() + extNamePos);
    return this.loadOrigin(href, filename, range);
  }
}
