import { BrowserWindow, ipcRenderer } from 'electron';

const path = require('path');
const os = require('os');
let homeDir = os.homedir();
let portPromise: Promise<MessagePort>;

export function setPath(p = '') {
  homeDir = p;
}

export function getPath(p = '') {
  return path.join(homeDir, path.normalize(p));
}

export function waitPort() {
  if (!portPromise) {
    portPromise = new Promise((resolve) => ipcRenderer.once('provide-worker-channel', (event) => {
      resolve(event.ports[0] as MessagePort);
    }));
  }
  return portPromise;
}

interface IWindowProps {
  url: string;
  preload: string;
  show?: boolean;
  noWebSecurity?: boolean;
}

export function createWindow(params: IWindowProps) {
  const { url, preload, show = false, noWebSecurity = false } = params;
  // 创建浏览器窗口
  const win = new BrowserWindow({
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
