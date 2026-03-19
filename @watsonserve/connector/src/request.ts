export enum Method {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  OPTIONS = 'OPTIONS',
  HEAD = 'HEAD',
}

export enum ContentType {
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

interface IBaseResp {
  ok: boolean;
  status: number;
  statusText: string;
  headers: Headers;
  body: ArrayBuffer;
}

interface IRsp {
  ok: boolean;
  status: number;
  statusText: string;
  data: string | ArrayBuffer | Record<string, any>;
}

const fetch = globalThis.fetch;

function urlEncode(data: any, searchParams = new URLSearchParams()) {
  Object.keys(data).forEach(key => {
    const item = data[key];
    (Array.isArray(item) ? item : [item]).forEach(val => {
      searchParams.append(key, val);
    });
  });
  return searchParams;
}

export async function baseRequest(options: RequestOptions): Promise<IBaseResp> {
  const { api, method, headers, data, timeout } = options;
  const reqNoBody = Method.GET === method || Method.HEAD === method;
  const signal = timeout ? AbortSignal.timeout(timeout) : null;

  const resp = await fetch(api, {
    method,
    headers,
    cache: 'no-cache',
    credentials: 'include',
    mode: 'no-cors',
    referrerPolicy:'same-origin',
    keepalive: true,
    body: (reqNoBody) ? undefined : data,
    signal
  });

  const { ok, status, statusText } = resp;
  const respBody = await resp.arrayBuffer();
  return { ok, status, statusText, headers: resp.headers, body: respBody };
}

function requestParams(options: RequestOptions) {
  let { api: _url, method, timeout, headers: _headers = {}, data: _data = null } = options;

  if ('object' !== typeof _headers || Array.isArray(_headers)) {
    _headers = {}
  }
  let data, headers = { ...(_headers || {}) };
  method = method || Method.GET;
  const reqNoBody = Method.GET === method || Method.HEAD === method;
  const url = new URL(_url.toString() || '');

  // 可以有body，但没有
  if (!data && !reqNoBody)
    headers['Content-Length'] = '0';

  // 不应该有body，但有数据
  if (_data && reqNoBody)
    urlEncode(_data, url.searchParams);

  // 有body数据
  if (_data && !reqNoBody) {
    headers = {
      'Content-Type': `${ContentType.URLENCODE}; charset=utf-8`,
      ...headers
    } as any;
    const contentType = headers['Content-Type'].split(';')[0] || ContentType.PROTOBUF

    switch (contentType) {
      case ContentType.JSON:
        data = JSON.stringify(_data);
        break
      case ContentType.URLENCODE:
        data = urlEncode(_data).toString();
        break
      default:
        data = _data;
    }

    headers = {
      ...headers,
      'Content-Type': `${contentType}; charset=utf-8`
    }
  }

  return {
    api: url.toString(),
    method,
    headers,
    timeout: Number(timeout) && Math.max(0, Number(timeout)) || 0,
    data: (reqNoBody) ? undefined : data
  };
}

function responseParse(rsp: IBaseResp): IRsp {
  const { ok, status, statusText, headers, body } = rsp;
  const contentType = (headers.get('Content-Type') || '').split(';')[0];
  const isTxt = contentType.startsWith('text/');
  let txtBody = '';
  if (isTxt || contentType === ContentType.JSON) {
    txtBody = new TextDecoder('utf-8').decode(body);
  }

  let data: string | ArrayBuffer | Record<string, any>;
  switch (contentType) {
    case ContentType.JSON:
      data = JSON.parse(txtBody);
      break;
    case ContentType.PROTOBUF:
    default:
      data = isTxt ? txtBody : body;
  }

  return { ok, status, statusText, data };
}

export async function request(options: RequestOptions) {
  const rsp = await baseRequest(requestParams(options));
  return responseParse(rsp);
}
