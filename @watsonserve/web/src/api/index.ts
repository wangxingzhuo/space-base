import _debounce from 'lodash/debounce';
import { sha256 } from '@watsonserve/utils';
import { IEq, EnLoop } from '@/entities';
import { EnFileNodeType, EnMimeType, ITreeNode, IResponse } from '@/entities';
import { request, Method } from '@watsonserve/connector';

enum EnApi {
  LOAD_DIR = 'loadDir',
  LOAD_MUSIC = 'loadMusic',
  UPLOAD = 'upload',
  SAVE_SETTING = 'saveSetting',
  LOAD_SETTING = 'loadSetting',
  SET_LOOP = 'setLoop'
}

export interface ISetting {
  origin: string;
  cacheDir: string;
  listName: string;
  hotKey: string;
  useMediaKey: boolean;
}

const EQ = 'EQ_GAIN_VALUES';

export function setLoop(loop: EnLoop) {
  request({ api: EnApi.SET_LOOP, data: { loop } }).catch(() => {});
}

export async function loadSetting() {
  return request<ISetting>({ api: EnApi.LOAD_SETTING });
}

export async function saveSetting(setting: ISetting) {
  return request<void>({ api: EnApi.SAVE_SETTING, data: setting });
}

interface IEqTable {
  [freq: number]: number;
}

export function loadEq(): Promise<IEqTable> {
  return new Promise(resolve => {
    const strEq = localStorage.getItem(EQ);
    const eq = strEq ? JSON.parse(strEq) : {
      31: 0, 62: 0, 125: 0, 250: 0, 500: 0, 1000: 0, 2000: 0, 4000: 0, 8000: 0, 16000: 0
    };
    resolve(eq);
  });
}

export const saveEq = _debounce((eq: IEq[]) => {
  const eqTable = eq.reduce((pre, item) => { pre[item.frequency] = item.gain; return pre; }, {} as IEqTable);
  localStorage.setItem(EQ, JSON.stringify(eqTable));
}, 2000);

export async function loadDir(path: string): Promise<IResponse<ITreeNode | null> | null> {
  let resp = [];
  let _path = path;

  // dir path
  if ('/' !== path[path.length - 1]) _path += '/';

  // load data
  try {
    const { data } = await request({ api: EnApi.LOAD_DIR, data: _path });
    resp = data;
  } catch (err) {
    return null;
  }

  // is dir
  const children = resp.map((item: any) => {
    const lstChar = item.name[item.name.length - 1];
    const nodeType = '/' === lstChar ? EnFileNodeType.DIR : EnFileNodeType.FILE;
    return {
      ...item,
      path: `${_path}${item.url}`,
      nodeType,
      contentType: EnMimeType.NULL,
      mode: item.perm
    };
  });

  // return render data model
  return {
    msg: '',
    stat: 0,
    data: {
      path,
      name: path.split('/').reverse()[0],
      size: 0,
      nodeType: EnFileNodeType.DIR,
      contentType: EnMimeType.NULL,
      createTime: 0,
      updateTime: 0,
      accessTime: 0,
      mode: 0o666,
      children
    }
  };
};

export interface IUploadPayload { dirPath: string, file: File };

export function upload({ dirPath, file }: IUploadPayload) {
  const { name, type, lastModified, size } = file;
  const resPath = encodeURIComponent(`${dirPath}${name}`);

  return request({
    api: `${EnApi.UPLOAD}?res_path=${resPath}`,
    method: Method.PUT,
    timeout: 0,
    headers: {
      'Content-Type': type,
      'Content-Length': size.toString(),
      'Date': new Date(lastModified).toUTCString(),
      'Content-Disposition': `filename=${encodeURIComponent(name)}`
    },
    data: file
  });
}

export async function loadGalleryIndex() {
  const resp = await fetch('/api/Pictures/');
  if (200 !== resp.status) throw new Error(resp.statusText);
  const buf = await resp.arrayBuffer();
  const raw = new Uint32Array(buf.slice(0, 4));
  const cTime = new Date(raw[0] * 1000);
  const etag = new Uint8Array(buf.slice(8, 24)).toHex();
  const hash = new Uint8Array(buf.slice(24, 56)).toHex();
  const filenameLen = new Uint32Array(buf.slice(56, 60))[0];
  const fileName = String.fromCharCode(...(new Uint8Array(buf.slice(60, 60+filenameLen))));
  return [
    {cTime, etag, hash, fileName}
  ];
}

function compression(fp: Blob) {
  if (!CompressionStream || 'application/gzip' === fp.type) return Promise.resolve(fp);

  return new Response(fp.stream().pipeThrough(new CompressionStream('gzip')), {
    headers: {
      'Content-Type': 'application/gzip'
    }
  }).blob();
}

export async function uploadFile(api: string, fp: File) {
  const [hash, body] = await Promise.all([
    sha256(fp),
    compression(fp)
  ]);
  const resp = await fetch(api, {
    method: 'put',
    headers: {
      'Content-Length': body.size.toString(),
      'Content-Type': fp.type,
      'Content-Encoding': 'gzip',
      'Digest': `sha256=${hash}`,
    },
    body
  });
  if (!resp.ok) throw new Error(resp.statusText);
  const { headers } = resp;
  const etag = headers.get('etag') ?? '';
  const fileName = headers.get('location') ?? '';
  return { etag, hash, fileName, cTime: new Date(fp.lastModified) };
}
