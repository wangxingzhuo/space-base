import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';
import { A_DAY_MS } from './close-time.js';

export default class WebRequest {
  private static HKEX_TOKEN = { token: '', t: 0 };
  private static browser?: Browser;
  private static context?: BrowserContext;
  private static pageCnt = 0;
  private static __promise?: Promise<void>;
  protected static isDebug: boolean = false;
  protected page?: Page;

  private static async __getInstance(debug = false) {
    if (WebRequest.context) return;
    // 1. 启动 Chromium，禁用 web security（解除 CORS）
    WebRequest.browser = await chromium.launch({
      headless: !debug,
      channel: 'msedge',
      args: [
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ]
    });
    WebRequest.context = await WebRequest.browser.newContext({});
  }

  get isDebug() {
    return WebRequest.isDebug;
  }

  static async init(isDebug = false) {
    WebRequest.isDebug = isDebug;
    if (!WebRequest.__promise)
      WebRequest.__promise = WebRequest.__getInstance(isDebug);
  }

  constructor() {}

  async mount() {
    await WebRequest.__promise;

    this.page = await WebRequest.context!.newPage();
    WebRequest.pageCnt++;
    await this.page.goto('about:blank');
  }

  private static async destroy() {
    WebRequest.pageCnt--;
    if (0 < WebRequest.pageCnt) return;

    await WebRequest.context?.close();
    await WebRequest.browser?.close();
    WebRequest.context = undefined;
    WebRequest.browser = undefined;
    WebRequest.pageCnt = 0;
    WebRequest.__promise = undefined;
  }

  async destroy() {
    if (!this.page) return;

    await this.page.close();
    this.page = undefined;
    return WebRequest.destroy();
  }

  protected fetch(url: string, method: string = 'GET', params?: Record<string, any>, headers?: Record<string, any>) {
    method = method.toUpperCase();
    let data = '';
    if (params) {
      if (['HEAD', 'GET'].includes(method)) {
        const uri = new URL(url);
        const urlParams = Object.fromEntries(uri.searchParams);
        
        uri.search = new URLSearchParams(Object.assign(urlParams, params)).toString();
        url = uri.toString();
      } else {
        const ct = (headers?.['Content-Type'] || '').split(';')[0];
        switch (ct) {
          case 'application/json':
            data = JSON.stringify(params);
            break;
          default:
            data = new URLSearchParams(params).toString();
        }
        
      }
    }

    return this.page!.evaluate(async (conf: any) => {
      const resp = await fetch(conf.url, {
        method: conf.method,
        credentials: 'include', // 如果需要 Cookie
        headers: conf.headers,
        body: conf.data || undefined,
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const ct = resp.headers.get('Content-Type')?.split(';')[0] || '';
      if ('application/json' === ct) return resp.json();
      if (ct.startsWith('text/')) return resp.text();
      return resp.arrayBuffer();
    }, { method, url, headers, data });
  }

  protected get(url: string, params?: Record<string, any>, headers?: Record<string, any>) {
    return this.fetch(url, 'GET', params, headers);
  }

  protected goto(pageUrl: string) {
    return this.page!.goto(pageUrl);
  }

  protected read<T>(key: string) : Promise<T> {
    return this.page!.evaluate(async (conf: any) => {
      return (window as any)[conf.key];
    }, { key });
  }

  protected async _loadHkexToken() {
    const expiry = Date.now() - A_DAY_MS;
    if (WebRequest.HKEX_TOKEN?.t > expiry) return WebRequest.HKEX_TOKEN.token;

    const doc = await this.get('https://www.hkex.com.hk/Market-Data/Securities-Prices/Equities?sc_lang=zh-HK');
    const token = doc.split('//return "Base64-AES-Encrypted-Token";')[1].split('";')[0].split('"')[1];
    const decodedToken = decodeURIComponent(token);
    WebRequest.HKEX_TOKEN = { token: decodedToken, t: Date.now() };
    return decodedToken;
  }
}
