import { IUploadPayload } from '@/api'; 
import { dirOrigin } from '@/constant';                                                          

const million = 1 << 20;

async function uploadFile(payload: IUploadPayload) {
  try {
    const origin = (dirOrigin.origin || globalThis.location?.origin).replace(/^http/, 'ws');
    const wsAddr = `${origin}/ws-api/`;
    const ws = new WebSocket(wsAddr);
    ws.addEventListener('open', async (ev) => {
      const { name, type, lastModified, size } = payload.file;
      const meta = { name: `${dirOrigin.prefix}/${name}`, type, lastModified, size } as any;
      ws.send(Object.keys(meta).map(k => `${k}: ${meta[k]}`).join('\r\n') + '\r\n\r\n');
      const data = await payload.file.arrayBuffer();
      for (let i = 0; i < size; i += million) {
        ws.send(data.slice(i, i + million));
        console.log('sent', Date.now());
      }
    });
    ws.addEventListener('message', (ev) => {
      setTimeout(() => {
        if (ws.readyState !== ws.CLOSED && ws.readyState !== ws.CLOSING) {
          ws.close();
        }
        globalThis.postMessage({ event: 'uploadResp', args: JSON.parse(ev.data) });
      }, 500)
    })
    ws.addEventListener('error', (ev) => console.error(ev))
  } catch(err) {
    console.error(err)
    globalThis.postMessage({ event: 'uploadResp', args: { status: 0, msg: (err as Error).message } });
  }
}

globalThis.addEventListener('message', async (ev) => {
  const { event, args } = ev.data;
  switch (event) {
    case 'upload':
      uploadFile(args);
  }
});
