'use strict';

var electron = require('electron');
var child_process = require('child_process');
var utils = require('./utils-50d1bd59.js');

let port = null;
electron.contextBridge.exposeInMainWorld('devTools', () => {
    electron.ipcRenderer.invoke('mainWindowMsg', { _api: 'devTools' });
    return null;
});
electron.contextBridge.exposeInMainWorld('getChannel', async () => {
    if (!port) {
        electron.ipcRenderer.postMessage('request-worker-channel', null);
        port = await utils.waitPort();
    }
    return {
        on(fn) {
            port.onmessage = (ev) => {
                // console.log('recv msg', ev);
                fn?.(ev.data);
            };
        },
        postMessage(...args) {
            port.postMessage(...args);
        }
    };
});
electron.contextBridge.exposeInMainWorld('bridge', async (opts) => {
    const resp = await electron.ipcRenderer.invoke('mainWindowMsg', opts);
    return {
        ok: true,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        json: () => Promise.resolve(resp)
    };
});
electron.contextBridge.exposeInMainWorld('openFile', (url) => {
    url = utils.getPath(url);
    console.log('open', url);
    const child = child_process.spawn('open', [url], { detached: true, shell: true, windowsHide: true });
    child.unref();
});
