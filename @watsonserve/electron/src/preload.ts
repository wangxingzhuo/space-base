import { contextBridge, ipcRenderer } from 'electron';
import { spawn } from 'child_process';
import { getPath, waitPort } from './utils';

let port: any = null;

contextBridge.exposeInMainWorld('devTools', () => {
  ipcRenderer.invoke('mainWindowMsg', { _api: 'devTools' });

  return null
});

contextBridge.exposeInMainWorld('getChannel', async () => {
  if (!port) {
    ipcRenderer.postMessage('request-worker-channel', null);
    port = await waitPort();
  }

  return {
    on(fn: any) {
      port.onmessage = (ev: any) => {
        // console.log('recv msg', ev);
        fn?.(ev.data);
      };
    },
    postMessage(...args: any[]) {
      port.postMessage(...args);
    }
  };
});

contextBridge.exposeInMainWorld('bridge', async (opts: any) => {
  const resp = await ipcRenderer.invoke('mainWindowMsg', opts);

  return {
    ok: true,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    json: () => Promise.resolve(resp)
  }
});

contextBridge.exposeInMainWorld('openFile', (url: string) => {
  url = getPath(url);
  console.log('open', url);
  const child = spawn('open', [url], {detached: true, shell: true, windowsHide: true});
  child.unref();
});
