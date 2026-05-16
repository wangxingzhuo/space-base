import { IRedirect, IHandleStock, IUsr, ITade, type IDividend, HandleStock, IGap, INetCash, IROR } from '@/entities';
import { Method, request } from '@watsonserve/connector';

export async function loadUsr() {
  try {
    const { data: body } = await request({
      api: `${globalThis.location?.origin || ''}/api/usr`
    });

    const { location: redirect, ...usr } = (body as { data: Partial<IUsr> & Partial<IRedirect> }).data;

    if (redirect) {
      location.replace(redirect);
      return null;
    }

    return usr as IUsr;
  } catch (err) {
    console.error((err as Error).message);
  }
  return null;
}

interface IHandle {
  stocks: IHandleStock[];
  fxs: Record<string, number>;
}

export async function loadHandles() {
  const { data: body } = await request({
    api: `${globalThis.location?.origin || ''}/api/handles`
  });

  const { stocks: _stocks, fxs } = (body as Record<string, IHandle>).data;

  let totalUSDAsset = 0;
  let totalUSDCost = 0;
  const stocks: HandleStock[] = [];
  for (const _st of _stocks) {
    const st = new HandleStock(_st, fxs[_st.currency]);
    stocks.push(st);
    const { usdMarketValue, usdCost } = st;
    totalUSDAsset += usdMarketValue;
    totalUSDCost += usdCost;
  }

  return { stocks, fxs, totalUSDAsset, totalUSDCost };
}

export async function recordAtrade(payload: ITade): Promise<void> {
  const { data: body } = await request({
    api: `${globalThis.location?.origin || ''}/api/record`,
    method: Method.PUT,
    data: payload,
    mode: 'same-origin',
    credentials: 'include'
  });

  const { status, msg } = body as Record<string, any>;
  return 200 === status ? undefined : Promise.reject(new Error(msg));
}

interface IRR {
  twr: IGap[];
  xir: INetCash[];
}

async function loadRR(start: number, end: number) {
  const { data: body } = await request({
    api: `${globalThis.location?.origin || ''}/api/gain?start=${start}&end=${end}`
  });

  return (body as any).data as IRR;
}

async function loadDividends(start: number, end: number) {
  const { data: body } = await request({
    api: `${globalThis.location?.origin || ''}/api/dividends?start=${start}&end=${end}`
  });

  return (body as Record<string, IDividend[]>).data;
}

export async function loadGain(sTime: number, eTime: number) {
  const [rr, divs] = await Promise.all([loadRR(sTime, eTime), loadDividends(sTime, eTime)]);
  const { twr, xir } = rr;
  return { twr, xir, divs } as IROR;
}

export async function loadRecords(start: number, end: number): Promise<any[]> {
  const { data: body } = await request({
    api: `${globalThis.location?.origin || ''}/api/record`,
    method: Method.GET,
    data: { start, end }
  });

  const { status, msg, data } = body as Record<string, any>;
  return 200 === status ? data : Promise.reject(new Error(msg));
}