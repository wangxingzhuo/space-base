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

export interface RequestOptions {
  api: string;
  method?: Method;
  headers?: Record<string, string>;
  data?: any;
  timeout?: number;
}

function web_io(options: RequestOptions): Promise<any> {
  const { api, method, timeout } = options;
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
  const signal = timeout ? AbortSignal.timeout(timeout) : null;
  return fetch(`${originInfo.origin}${originInfo.prefix}${api}`, {
    method,
    headers,
    cache: 'no-cache',
    credentials: 'include',
    body: data,
    signal,
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
  const { api, method, data, timeout } = options;
  const signal = timeout ? AbortSignal.timeout(timeout) : null;
  return new Promise((resolve, reject) => {
    if (signal) {
      signal.onabort = () => reject(new Error('Timeout abort'));
    }
    try {
      (globalThis as any).bridge(api, { method, data })
        .then(
          (resp: any) => resolve(resp.json()),
          reject
        );
    } catch (err) {
      reject(err);
    }
  });
}

export function io<T = any>(options: RequestOptions): Promise<T> {
  options = {
    method: Method.GET,
    timeout: 3000,
    headers: {},
    ...options
  } as RequestOptions;

  if (options.timeout) {
    options.timeout = Math.max(0, options.timeout);
  }

  const bridge = (globalThis as any).bridge
  const api = bridge ? client_io : web_io;

  return api(options);
}
