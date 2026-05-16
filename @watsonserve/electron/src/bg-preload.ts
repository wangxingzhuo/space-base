import { contextBridge, ipcRenderer } from 'electron';
import { waitPort } from './utils';

let port: any = null;

contextBridge.exposeInMainWorld('getChannel', async () => {
  if (!port) {
    ipcRenderer.postMessage('worker-init', null);
    port = await waitPort();
  }

  console.log(port)

  return {
    bridge: async (_api: string, opts: any = {}) => {
      const resp = await ipcRenderer.invoke('musicBgMsg', { ...opts, _api });
    
      return {
        ok: true,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        json: () => Promise.resolve(resp)
      }
    },
    on(fn: any) {
      port.onmessage = (ev: any) => fn(ev.data);
    },
    postMessage(...args: any[]) {
      port.postMessage(...args);
    }
  };
});
