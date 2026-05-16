import { ipcMain, nativeImage, BrowserWindow, globalShortcut, MessageChannelMain, MessagePortMain, protocol } from 'electron';
import fs from 'fs/promises';
import _fs from 'fs';
import { Collections, fetchM3U, httpLoadPart } from '@watsonserve/resources';
import { getPath } from '../utils';
import mimeDict from '../mime';

const SETTING_FILE = getPath('.space-setting.json');

interface ISetting {
  origin: string;
  cacheDir: string;
  listName: string;
  hotKey: string;
  useMediaKey: boolean;
}

enum EnApi {
  LOAD_DIR = 'loadDir',
  LOAD_MUSIC = 'loadMusic',
  UPLOAD = 'upload',
  SAVE_SETTING = 'saveSetting',
  LOAD_SETTING = 'loadSetting'
}

function openBgDevTool(bgId: number) {
  const bgWindow = BrowserWindow.getAllWindows().find(win => win.id === bgId);
  if (!bgWindow) return;

  bgWindow.webContents.openDevTools({ mode: 'undocked' });
}

export default class Srv {
  private _setting: string;
  private bgId = NaN;
  private workerPort?: MessagePortMain = undefined;
  private viewPort?: MessagePortMain = undefined;
  private readonly locationStore = Collections.getInstance();

  private readonly shortFn = {
    togglePlay: () => this.workerPort?.postMessage({ event: 'togglePlay', args: undefined }),
    nextTrack: () => this.workerPort?.postMessage({ event: 'loadNext', args: 1 }),
    lastTrack: () => this.workerPort?.postMessage({ event: 'loadNext', args: -1 })
  };

  get setting(): ISetting {
    return JSON.parse(this._setting);
  }

  get shortcuts(): ['togglePlay' | 'nextTrack' | 'lastTrack', string[]][] {
    const { hotKey = 'Alt', useMediaKey = false } = this.setting;

    return [
      ['togglePlay', [`${hotKey}+Space`, useMediaKey && 'MediaPlayPause'].filter(Boolean) as string[]],
      ['nextTrack', [`${hotKey}+Right`, useMediaKey && 'MediaNextTrack'].filter(Boolean) as string[]],
      ['lastTrack', [`${hotKey}+Left`, useMediaKey && 'MediaPreviousTrack'].filter(Boolean) as string[]],
    ];
  }

  async saveSetting(setting: ISetting) {
    // diff current hotkey and register
    setting.hotKey !== this.setting.hotKey && this.registerShortcuts();

    this._setting = JSON.stringify(setting);
    await fs.writeFile(SETTING_FILE, this._setting);
  }

  static async init() {
    protocol.registerSchemesAsPrivileged([{ scheme: 'res', privileges: {
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

  private constructor(setting: string) {
    this._setting = setting;
  }
  
  private handleMainWindowMsg = (_: any, params: any) => {
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
      default:
    }
  };

  private handleMusicBgMsg = (_: any, params: any) => {
    const { _api, ...opts } = params;

    switch (_api) {
      case 'LOAD_SETTING':
        return this.setting;
      case 'LOAD_LIST':
        return fetchM3U(
          ('' === opts.resPath || 'location' === opts.resPath)
            ? `file://${encodeURIComponent(this.setting.cacheDir)}`
            : opts.resPath
        );
      default:
    }
  };

  private workerInit = (event: { senderFrame: any }) => {
    if (this.workerPort) this.workerPort.close();

    const { port1, port2 } = new MessageChannelMain();
    this.workerPort = port2;

    port2.on('message', (ev) => this.viewPort?.postMessage(ev.data));

    event.senderFrame.postMessage('provide-worker-channel', null, [port1]);
    port2.start();
  };

  private workerChannel = (event: { senderFrame: any }) => {
    if (this.viewPort) this.viewPort.close();

    const { port1, port2 } = new MessageChannelMain();
    this.viewPort = port2;

    port2.on('message', (ev) => this.workerPort?.postMessage(ev.data));

    event.senderFrame.postMessage('provide-worker-channel', null, [port1]);
    port2.start();
  };

  private registerShortcuts() {
    globalShortcut.unregisterAll();

    const results = this.shortcuts.flatMap(([id, keys]) => {
      const fn = this.shortFn[id];

      return keys.map(k => {
        let ret = false;
        try {
          ret = globalShortcut.register(k, fn);
        } catch (err) {
          console.warn('global media shortcut register failed', err);
        }
        return [k, ret] as [string, boolean];
      });
    });
    console.log(Object.fromEntries(results));
  }
  

  listen(_bgId: number) {
    this.bgId = _bgId;
  
    // ipcMain.on('drag-start', (event, file: string) => {
    //   console.log('drag-start', file);
    //   event.sender.startDrag({ file, icon: nativeImage.createEmpty() })
    // });
  
    ipcMain.handle('mainWindowMsg', this.handleMainWindowMsg);
    ipcMain.handle('musicBgMsg', this.handleMusicBgMsg);
    ipcMain.on('worker-init', this.workerInit);
    ipcMain.on('request-worker-channel', this.workerChannel);
  }

  reqFilter() {
    protocol.handle('res', async (req) => {
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

            return new Response(_fs.createReadStream(href) as any, {
              headers: {
                'Content-Type': mime,
                'Content-Length': `${stat.size}`,
              }
            });
          default:
        }
        
        const strRange = req.headers.get('Range') || req.headers.get('range') || '';
        const { statusCode, statusMessage, headers: respHeaders, body } = await httpLoadPart(href, strRange);
        const retHeaders = ['content-type', 'content-length', 'content-range'].reduce<Record<string, string>>((pre, key) => {
          const val = respHeaders[key] as string;
          if (val) pre[key] = val;
          return pre;
        }, {});

        return new Response(body as any, {
          status: statusCode,
          statusText: statusMessage,
          headers: retHeaders
        });
      } catch (err: any) {
        console.error(`read music file ${req.url}`, err);
        errMsg = err.message;
      }
      return new Response(null, { status: 404, statusText: errMsg });
    });

    this.registerShortcuts();
  }
}
