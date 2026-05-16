'use strict';

var electron = require('electron');

const path = require('path');
const os = require('os');
let homeDir = os.homedir();
let portPromise;
function getPath(p = '') {
    return path.join(homeDir, path.normalize(p));
}
function waitPort() {
    if (!portPromise) {
        portPromise = new Promise((resolve) => electron.ipcRenderer.once('provide-worker-channel', (event) => {
            resolve(event.ports[0]);
        }));
    }
    return portPromise;
}
function createWindow(params) {
    const { url, preload, show = false, noWebSecurity = false } = params;
    // 创建浏览器窗口
    const win = new electron.BrowserWindow({
        show,
        width: 800,
        height: 600,
        webPreferences: {
            webSecurity: !noWebSecurity,
            nodeIntegration: true,
            preload: path.join(__dirname, preload)
        }
    });
    // 加载 index.html
    win.loadURL(url);
    return win;
}

exports.createWindow = createWindow;
exports.getPath = getPath;
exports.waitPort = waitPort;
