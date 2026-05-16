import fs from 'fs/promises';
import _fs from 'fs';
import path from 'path';
import os from 'os';
import { request as request$2 } from 'http';
import { request as request$1 } from 'https';

const dict = {
    '.m3u': 'audio/x-mpegurl',
    '.ram': 'audio/x-pn-realaudio',
    '.au': 'audio/basic',
    '.snd': 'audio/basic',
    '.mp3': 'audio/mpeg',
    '.mp2': 'audio/mpeg',
    '.aif': 'audio/x-aiff',
    '.aifc': 'audio/x-aiff',
    '.aiff': 'audio/x-aiff',
    '.ra': 'audio/x-pn-realaudio',
    '.wav': 'audio/x-wav',
    '.adp': 'audio/adpcm',
    '.mid': 'audio/midi',
    '.midi': 'audio/midi',
    '.kar': 'audio/midi',
    '.rmi': 'audio/midi',
    '.m4a': 'audio/mp4a-latm',
    '.mp4a': 'audio/mp4',
    '.m4p': 'audio/mp4a-latm',
    '.mpga': 'audio/mpeg',
    '.mp2a': 'audio/mpeg',
    '.m2a': 'audio/mpeg',
    '.m3a': 'audio/mpeg',
    '.oga': 'audio/ogg',
    '.ogg': 'audio/ogg',
    '.spx': 'audio/ogg',
    '.opus': 'audio/ogg',
    '.s3m': 'audio/s3m',
    '.sil': 'audio/silk',
    '.uva': 'audio/vnd.dece.audio',
    '.uvva': 'audio/vnd.dece.audio',
    '.eol': 'audio/vnd.digital-winds',
    '.dra': 'audio/vnd.dra',
    '.dts': 'audio/vnd.dts',
    '.dtshd': 'audio/vnd.dts.hd',
    '.lvp': 'audio/vnd.lucent.voice',
    '.pya': 'audio/vnd.ms-playready.media.pya',
    '.ecelp4800': 'audio/vnd.nuera.ecelp4800',
    '.ecelp7470': 'audio/vnd.nuera.ecelp7470',
    '.ecelp9600': 'audio/vnd.nuera.ecelp9600',
    '.rip': 'audio/vnd.rip',
    '.weba': 'audio/webm',
    '.aac': 'audio/x-aac',
    '.caf': 'audio/x-caf',
    '.flac': 'audio/x-flac',
    '.mka': 'audio/x-matroska',
    '.wax': 'audio/x-ms-wax',
    '.wma': 'audio/x-ms-wma',
    '.rmp': 'audio/x-pn-realaudio-plugin',
    '.xm': 'audio/xm',
};
function mimeDict (extName) { return dict[extName] || 'application/octet-stream'; }

function _request(url, headers) {
    const __request = url.startsWith('https') ? request$1 : request$2;
    return new Promise((resolve, reject) => {
        __request(url, { headers, rejectUnauthorized: false }, resolve)
            .on('error', reject)
            .end();
    });
}
async function request(url, reqHeaders) {
    let redirect = true;
    let resp;
    while (redirect) {
        resp = await _request(url, reqHeaders);
        const { statusCode, headers: respHeaders } = resp;
        redirect = (301 === statusCode || 302 === statusCode);
        if (!redirect)
            return resp;
        url = respHeaders.location || '';
        resp.destroy();
    }
    return resp;
}
async function httpLoad(url, headers) {
    let body = Buffer.alloc(0);
    const resp = await request(url, headers);
    return new Promise((resolve, reject) => {
        resp
            .on('error', reject)
            .on('data', data => {
            body = Buffer.concat([body, data]);
        })
            .on('end', () => resolve({
            statusCode: resp.statusCode || 0,
            statusMessage: resp.statusMessage || '',
            headers: resp.headers,
            body
        }));
    });
}
async function httpLoadPart(url, range) {
    const strRange = (!range?.length)
        ? ''
        : typeof range === 'string'
            ? range
            : ('bytes=' + range.map(item => `${item[0]}-${item[1]}`).join(', '));
    const resp = await request(url, strRange ? { 'Range': strRange } : undefined);
    const { statusCode, statusMessage, headers } = resp;
    return { statusCode, statusMessage, headers, body: resp };
}

function mkTempFile(filename) {
    const fd = _fs.openSync(filename, 'w+');
    _fs.closeSync(fd);
    const wr = _fs.createWriteStream(filename, { encoding: 'binary', autoClose: true });
    const rd = _fs.createReadStream(filename, { encoding: 'binary', autoClose: true });
    return [wr, rd];
}
class LocationResources {
    _cacheDir = os.homedir();
    _locationMap = new Map();
    get songsFile() {
        return path.resolve(this._cacheDir, '.space-location.json');
    }
    setCacheDir(dir) {
        this._cacheDir = dir;
    }
    save() {
        let str = JSON.stringify([...this._locationMap.values()]);
        str = str.substring(1, str.length - 1) + ',';
        return fs.writeFile(this.songsFile, str, { encoding: 'utf-8' });
    }
    // find by name or singer
    find(url) {
        const info = this._locationMap.get(url);
        return info ? { ...info, randName: path.resolve(this._cacheDir, info.randName) } : null;
    }
    async append(song) {
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
    async delete(urls, rmFile = false) {
        const willRemove = new Set();
        urls.forEach(url => {
            const { randName = '' } = this._locationMap.get(url) || {};
            this._locationMap.delete(url);
            willRemove.add(randName);
        });
        await this.save();
        if (!rmFile)
            return;
        willRemove.delete('');
        await Promise.all([...willRemove].map(name => fs.rm(name).catch(err => err.message)));
    }
    async modify(info) {
        const { url } = info;
        const item = this._locationMap.get(url);
        if (!item)
            return;
        Object.assign(item, info);
        return this.save();
    }
    async loadResList() {
        try {
            const content = await fs.readFile(this.songsFile, 'utf-8');
            const list = JSON.parse(`[${content}]`);
            this._locationMap = new Map(list.map(item => [item.url, item]));
        }
        catch (err) {
            console.error(err);
        }
    }
}
class Collections extends LocationResources {
    collFile = '.space-collections.json';
    static _collMgr = null;
    static getInstance() {
        if (!Collections._collMgr) {
            Collections._collMgr = new Collections();
        }
        return Collections._collMgr;
    }
    constructor() {
        super();
    }
    // all cached
    getCached(randName, size, mime) {
        return new Response(_fs.createReadStream(randName), {
            status: 200,
            statusText: 'OK',
            headers: { 'Content-Type': mime, 'Content-Length': `${size}` }
        });
    }
    async getFile(href, mime) {
        try {
            href = href.substring(6);
            if (href.startsWith('//')) {
                href = href.substring(1);
            }
            const stat = await fs.stat(href);
            return this.getCached(href, stat.size, mime);
        }
        catch (err) {
            err.message;
        }
        return new Response(null, { status: 404, statusText: 'Not Found' });
    }
    async loadOrigin(href, filename, strRange) {
        // const strRange = req.headers.get('Range') || req.headers.get('range') || 'bytes=0-65536';
        const resp = await request(href, strRange ? { Range: strRange } : undefined);
        const { statusCode, statusMessage, headers: respHeaders } = resp;
        const [w, r] = mkTempFile(filename);
        resp.pipe(w);
        const retHeaders = ['content-type', 'content-length', 'content-range'].reduce((pre, key) => {
            const val = respHeaders[key];
            if (val)
                pre[key] = val;
            return pre;
        }, {});
        return new Response(r, { status: statusCode, statusText: statusMessage, headers: retHeaders });
    }
    async loadRes(href, range) {
        const { protocol, host, pathname, search, hash } = new URL(href);
        const extNamePos = pathname.lastIndexOf('.');
        const mime = mimeDict(pathname.substring(extNamePos));
        if (protocol === 'file:')
            return this.getFile(href, mime);
        const cacheInfo = this.find(href);
        // all cached
        if (cacheInfo && cacheInfo.cacheRange === null)
            return this.getCached(cacheInfo.randName, cacheInfo.size, mime);
        const filename = path.resolve('.', (~~(Math.random() * 100000000)).toString() + extNamePos);
        return this.loadOrigin(href, filename, range);
    }
}

class Media {
    title;
    duration;
    start;
    url;
    constructor(s, d, t, u) {
        this.duration = d;
        this.start = s;
        this.url = u;
        this.title = t;
    }
}
function coll(resList, line) {
    const isShap = '#' === line.at(0);
    // whitespace or comments
    if (!line || isShap && 'EXT' !== line.substring(1, 4))
        return;
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
function parseM3U(m3u) {
    if (!m3u.startsWith('#EXTM3U'))
        throw new Error('parse m3u failed');
    if (-1 !== m3u.indexOf('EXT-X-MEDIA'))
        throw new Error('it is a  MasterPlaylist');
    // m3u8
    const playlist = m3u.replaceAll('\r', '').split('\n');
    const resList = [];
    for (let i = 0; i < playlist.length; i++) {
        coll(resList, playlist[i]);
    }
    for (let len = resList.length, i = 1; i < len; i++) {
        const item = resList[i - 1];
        resList[i].start = item.start + item.duration;
    }
    return resList;
}
async function loadRemoteFile(url) {
    const { body } = await httpLoad(url);
    return body.toString('utf-8');
}
const MUSIC_EXTNAMES = new Set(['mp3', 'flac', 'wav']);
async function _loadDir(resPath, filter) {
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
    }
    catch (err) {
        console.error(err);
    }
    return [];
}
function fetchM3U(url) {
    // http(s)://xxxx.m3u
    if (url.startsWith('http://') || url.startsWith('https://'))
        return loadRemoteFile(url).then(parseM3U);
    // file://xxxx.m3u
    if (url.startsWith('file://')) {
        url = decodeURIComponent(url.substring(7));
    }
    if (url[0] !== '/')
        url = `/${url}`;
    if (url.endsWith('.m3u'))
        return fs.readFile(url, 'utf-8').then(parseM3U);
    // file://xxxx/
    if (!url.endsWith('/'))
        url += '/';
    return _loadDir(url, (item) => MUSIC_EXTNAMES.has(path.extname(item.title).substring(1)));
}

export { Collections, fetchM3U, httpLoad, httpLoadPart, request };
