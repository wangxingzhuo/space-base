'use strict';

var electron = require('electron');
var fs = require('fs/promises');
var _fs = require('fs');
var path = require('path');
var os = require('os');
var http = require('http');
var https = require('https');
var utils = require('./utils-50d1bd59.js');

const dict$1 = {
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
function mimeDict$1 (extName) { return dict$1[extName] || 'application/octet-stream'; }

function _request(url, headers) {
    const __request = url.startsWith('https') ? https.request : http.request;
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
        const mime = mimeDict$1(pathname.substring(extNamePos));
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

const SETTING_FILE = utils.getPath('.space-setting.json');
var EnApi;
(function (EnApi) {
    EnApi["LOAD_DIR"] = "loadDir";
    EnApi["LOAD_MUSIC"] = "loadMusic";
    EnApi["UPLOAD"] = "upload";
    EnApi["SAVE_SETTING"] = "saveSetting";
    EnApi["LOAD_SETTING"] = "loadSetting";
})(EnApi || (EnApi = {}));
function openBgDevTool(bgId) {
    const bgWindow = electron.BrowserWindow.getAllWindows().find(win => win.id === bgId);
    if (!bgWindow)
        return;
    bgWindow.webContents.openDevTools({ mode: 'undocked' });
}
class Srv {
    _setting;
    bgId = NaN;
    workerPort = undefined;
    viewPort = undefined;
    locationStore = Collections.getInstance();
    shortFn = {
        togglePlay: () => this.workerPort?.postMessage({ event: 'togglePlay', args: undefined }),
        nextTrack: () => this.workerPort?.postMessage({ event: 'loadNext', args: 1 }),
        lastTrack: () => this.workerPort?.postMessage({ event: 'loadNext', args: -1 })
    };
    get setting() {
        return JSON.parse(this._setting);
    }
    get shortcuts() {
        const { hotKey = 'Alt', useMediaKey = false } = this.setting;
        return [
            ['togglePlay', [`${hotKey}+Space`, useMediaKey && 'MediaPlayPause'].filter(Boolean)],
            ['nextTrack', [`${hotKey}+Right`, useMediaKey && 'MediaNextTrack'].filter(Boolean)],
            ['lastTrack', [`${hotKey}+Left`, useMediaKey && 'MediaPreviousTrack'].filter(Boolean)],
        ];
    }
    async saveSetting(setting) {
        // diff current hotkey and register
        setting.hotKey !== this.setting.hotKey && this.registerShortcuts();
        this._setting = JSON.stringify(setting);
        await fs.writeFile(SETTING_FILE, this._setting);
    }
    static async init() {
        electron.protocol.registerSchemesAsPrivileged([{ scheme: 'res', privileges: {
                    // standard: true,
                    bypassCSP: true,
                    supportFetchAPI: true,
                    corsEnabled: true,
                    stream: true,
                    // codeCache: true
                } }]);
        const setting = await fs.readFile(SETTING_FILE, { encoding: 'utf-8' });
        const srv = new Srv(setting);
        // await srv.locationStore.loadMusicList(`file://${encodeURIComponent(srv.setting.cacheDir)}`);
        return srv;
    }
    constructor(setting) {
        this._setting = setting;
    }
    handleMainWindowMsg = (_, params) => {
        const { _api, ...opts } = params;
        switch (_api) {
            case 'devTools':
                openBgDevTool(this.bgId);
                return;
            case EnApi.LOAD_DIR:
                return this.locationStore.find('');
            case EnApi.SAVE_SETTING:
                return this.saveSetting(opts.data);
            case EnApi.LOAD_SETTING:
                return this.setting;
        }
    };
    handleMusicBgMsg = (_, params) => {
        const { _api, ...opts } = params;
        switch (_api) {
            case 'LOAD_SETTING':
                return this.setting;
            case 'LOAD_LIST':
                return fetchM3U(('' === opts.resPath || 'location' === opts.resPath)
                    ? `file://${encodeURIComponent(this.setting.cacheDir)}`
                    : opts.resPath);
        }
    };
    workerInit = (event) => {
        if (this.workerPort)
            this.workerPort.close();
        const { port1, port2 } = new electron.MessageChannelMain();
        this.workerPort = port2;
        port2.on('message', (ev) => this.viewPort?.postMessage(ev.data));
        event.senderFrame.postMessage('provide-worker-channel', null, [port1]);
        port2.start();
    };
    workerChannel = (event) => {
        if (this.viewPort)
            this.viewPort.close();
        const { port1, port2 } = new electron.MessageChannelMain();
        this.viewPort = port2;
        port2.on('message', (ev) => this.workerPort?.postMessage(ev.data));
        event.senderFrame.postMessage('provide-worker-channel', null, [port1]);
        port2.start();
    };
    registerShortcuts() {
        electron.globalShortcut.unregisterAll();
        const results = this.shortcuts.flatMap(([id, keys]) => {
            const fn = this.shortFn[id];
            return keys.map(k => {
                let ret = false;
                try {
                    ret = electron.globalShortcut.register(k, fn);
                }
                catch (err) {
                    console.warn('global media shortcut register failed', err);
                }
                return [k, ret];
            });
        });
        console.log(Object.fromEntries(results));
    }
    listen(_bgId) {
        this.bgId = _bgId;
        // ipcMain.on('drag-start', (event, file: string) => {
        //   console.log('drag-start', file);
        //   event.sender.startDrag({ file, icon: nativeImage.createEmpty() })
        // });
        electron.ipcMain.handle('mainWindowMsg', this.handleMainWindowMsg);
        electron.ipcMain.handle('musicBgMsg', this.handleMusicBgMsg);
        electron.ipcMain.on('worker-init', this.workerInit);
        electron.ipcMain.on('request-worker-channel', this.workerChannel);
    }
    reqFilter() {
        electron.protocol.handle('res', async (req) => {
            let errMsg = '';
            try {
                const { url, headers } = req;
                let [_, href] = url.split('://');
                href = decodeURIComponent(href);
                const { protocol, pathname } = new URL(href);
                const extNamePos = pathname.lastIndexOf('.');
                const mime = mimeDict(pathname.substring(extNamePos));
                switch (protocol) {
                    case 'file:':
                        href = href.substring(6);
                        if (href.startsWith('//')) {
                            href = href.substring(1);
                        }
                        const stat = await fs.stat(href);
                        return new Response(_fs.createReadStream(href), {
                            headers: {
                                'Content-Type': mime,
                                'Content-Length': `${stat.size}`,
                            }
                        });
                    default:
                }
                const strRange = req.headers.get('Range') || req.headers.get('range') || '';
                const { statusCode, statusMessage, headers: respHeaders, body } = await httpLoadPart(href, strRange);
                const retHeaders = ['content-type', 'content-length', 'content-range'].reduce((pre, key) => {
                    const val = respHeaders[key];
                    if (val)
                        pre[key] = val;
                    return pre;
                }, {});
                return new Response(body, {
                    status: statusCode,
                    statusText: statusMessage,
                    headers: retHeaders
                });
            }
            catch (err) {
                console.error(`read music file ${req.url}`, err);
                errMsg = err.message;
            }
            return new Response(null, { status: 404, statusText: errMsg });
        });
        this.registerShortcuts();
    }
}

const origin = `file://${__dirname}` ;
const mainWindowAttrs = {
    url: `${origin}/views/index.html#/music/`,
    preload: './preload.js',
    show: true
};
const bgWindowAttrs = {
    url: `${origin}/bg/index.html`,
    preload: './bg-preload.js',
    show: false,
    noWebSecurity: true
};
function createMainWindow() {
    if (electron.BrowserWindow.getAllWindows().length === 1)
        utils.createWindow(mainWindowAttrs);
}
// 这段程序将会在 Electron 结束初始化
// 和创建浏览器窗口的时候调用
// 部分 API 在 ready 事件触发后才能使用。
(async () => {
    electron.app.on('will-quit', () => {
        // 注销所有快捷键
        electron.globalShortcut.unregisterAll();
    });
    const [service] = await Promise.all([Srv.init(), electron.app.whenReady()]);
    service.reqFilter();
    // 系统托盘图标
    const ctxMenu = electron.Menu.buildFromTemplate([{ label: 'quit', click: () => electron.app.quit() }]);
    const tray = new electron.Tray(path.resolve(__dirname, `ico${process.platform === 'win32' ? '.ico' : 'Template.png'}`));
    tray.on('click', createMainWindow);
    tray.on('right-click', () => tray.popUpContextMenu(ctxMenu));
    // 通常在 macOS 上，当点击 dock 中的应用程序图标时，如果没有其他打开的窗口，那么程序会重新创建一个窗口。
    electron.app.on('activate', createMainWindow);
    // 除了 macOS 外，当所有窗口都被关闭的时候退出程序。 因此，通常对程序和它们在
    // 任务栏上的图标来说，应当保持活跃状态，直到用户使用 Cmd + Q 退出。
    electron.app.on('window-all-closed', () => {
        if (process.platform !== 'darwin')
            electron.app.quit();
    });
    service.listen(utils.createWindow(bgWindowAttrs).on('closed', () => process.platform !== 'darwin' && electron.app.quit()).id);
    createMainWindow();
})();
