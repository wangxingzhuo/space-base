'use strict';

var electron = require('electron');
var utils = require('./utils-50d1bd59.js');

let port = null;
electron.contextBridge.exposeInMainWorld('getChannel', async () => {
    if (!port) {
        electron.ipcRenderer.postMessage('worker-init', null);
        port = await utils.waitPort();
    }
    console.log(port);
    return {
        bridge: async (_api, opts = {}) => {
            const resp = await electron.ipcRenderer.invoke('musicBgMsg', { ...opts, _api });
            return {
                ok: true,
                headers: { 'Content-Type': 'application/json; charset=utf-8' },
                json: () => Promise.resolve(resp)
            };
        },
        on(fn) {
            port.onmessage = (ev) => fn(ev.data);
        },
        postMessage(...args) {
            port.postMessage(...args);
        }
    };
});
