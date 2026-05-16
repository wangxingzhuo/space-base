import { IncomingMessage, IncomingHttpHeaders, request as httpRequest } from 'http';
import { request as httpsRequest } from 'https';

interface IHttpResponse {
  statusCode: number;
  statusMessage: string;
  headers: IncomingHttpHeaders;
  body: Buffer;
}

function _request(url: string, headers?: Record<string, string>) {
  const __request = url.startsWith('https') ? httpsRequest : httpRequest;

  return new Promise<IncomingMessage>((resolve, reject) => {
    __request(url, { headers, rejectUnauthorized: false }, resolve)
      .on('error', reject)
      .end();
  });
}

export async function request(url: string, reqHeaders?: Record<string, string>): Promise<IncomingMessage> {
  let redirect = true;
  let resp: IncomingMessage | undefined;

  while (redirect) {
    resp = await _request(url, reqHeaders);
    const { statusCode, headers: respHeaders } = resp;
    redirect = (301 === statusCode || 302 === statusCode);
    if (!redirect) return resp;

    url = respHeaders.location || '';
    resp.destroy();
  }

  return resp!;
}

export async function httpLoad(url: string, headers?: Record<string, string>) {
  let body = Buffer.alloc(0);
  const resp = await request(url, headers);

  return new Promise<IHttpResponse>((resolve, reject) => {
    resp
      .on('error', reject)
      .on('data', data => {
        body = Buffer.concat([body, data]);
      })
      .on('end', () => resolve({
        statusCode: resp.statusCode || 0,
        statusMessage: resp.statusMessage || '',
        headers: resp.headers,
        body
      }));
  });
}

export async function httpLoadPart(url: string, range: [number, number][] | string) {
  const strRange = (!range?.length)
    ? ''
    : typeof range === 'string'
    ? range
    : ('bytes=' + range.map(item => `${item[0]}-${item[1]}`).join(', '));
  const resp = await request(url, strRange ? { 'Range': strRange } : undefined);
  const { statusCode, statusMessage, headers } = resp;
  return { statusCode, statusMessage, headers, body: resp };
}
