export const origin = '';
export const prefix = '/file';

const fetch = globalThis.fetch;

const originInfo = {
  cdn: location.origin,
  origin: '',
  prefix: '/api'
};

export function getOriginInfo() {
  return JSON.parse(JSON.stringify(originInfo));
}

export function setOriginInfo(cfg: Record<keyof typeof originInfo, string>) {
  Object.assign(originInfo, cfg);
}

export enum Method {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  OPTIONS = 'OPTIONS',
  HEAD = 'HEAD'
}

enum ContentType {
  URLENCODE = 'application/x-www-form-urlencoded',
  FORMDATA = 'multipart/form-data',
  JSON = 'application/json',
  PROTOBUF = 'application/x-protobuf',
}

export enum EnApi {
  LOAD_DIR = 'loadDir',
  LOAD_MUSIC = 'loadMusic',
  UPLOAD = 'upload',
  SAVE_SETTING = 'saveSetting',
  LOAD_SETTING = 'loadSetting',
  SET_LOOP = "SET_LOOP"
}

const apiDict = new Map<EnApi, string>([
  [EnApi.LOAD_DIR, ''],
  [EnApi.UPLOAD, '']
]);

export interface RequestOptions {
  api: EnApi
  resPath?: string
  method?: Method
  headers?: Record<string, string>
  data?: any
  timeout?: number
}

function web_io(options: RequestOptions): Promise<any> {
  const { api, resPath, method } = options
  const apiPath = api !== EnApi.LOAD_DIR && apiDict.get(api) || resPath;
  let { data } = options
  let headers = options.headers || {} as Record<string, string>;

  // 有数据则设置数据类型，没有则设置内容长度为0
  if (data) {
    const contentType = headers['Content-Type'] || ContentType.PROTOBUF

    switch (contentType) {
      case ContentType.JSON:
        data = JSON.stringify(data)
        break
      case ContentType.URLENCODE:
        data = encodeURIComponent(data)
        break
      default:
    }

    headers = {
      ...headers,
      'Content-Type': `${contentType}; charset=utf-8`
    }
  } else {
    headers['Content-Length'] = '0'
  }

  return fetch(`${originInfo.origin}${originInfo.prefix}${apiPath}`, {
    method,
    headers,
    cache: 'no-cache',
    credentials: 'include',
    body: data
  })
  .then(resp => {
    if (!resp.ok) return Promise.reject(new Error(resp.statusText || String(resp.status)))

    const respHeaders = resp.headers
    const contentType = (respHeaders.get('Content-Type') || '').split(';')[0]
    switch (contentType) {
      case ContentType.JSON:
        return resp.json();
      case ContentType.PROTOBUF:
      default:
    }
    return contentType.startsWith('text/') ? resp.text() : resp.blob()
  })
}

async function client_io(options: RequestOptions): Promise<any> {
  const { api, resPath, method, data } = options
  const resp = await (globalThis as any).bridge(api, { resPath, method, data });
  return resp.json();
}

function cancelableSleep(timeout = 0, fn1?: () => void): (fn?: () => void) => void {
  timeout = Math.max(timeout, 0)
  let timeHandle = -1

  const clearSleep = (fn2?: () => void) => {
    if (!timeHandle) return
    timeout && clearTimeout(timeHandle)
    timeHandle = 0
    fn2?.()
  }

  if (timeout) {
    timeHandle = window.setTimeout(() => clearSleep(fn1), timeout)
  }

  return clearSleep
}

export function io<T = any>(options: RequestOptions): Promise<T> {
  options = {
    method: Method.GET,
    timeout: 3000,
    headers: {},
    ...options
  } as RequestOptions

  const bridge = (globalThis as any).bridge
  const api = bridge ? client_io : web_io;

  return new Promise<any>((resolve, reject) => {
    // 强制超时reject
    const cancel = cancelableSleep(options.timeout, () => reject(new Error('timeout')))

    api(options)
    .then(resp => cancel(() => resolve(resp)))
    .catch(reject)
  })
}
