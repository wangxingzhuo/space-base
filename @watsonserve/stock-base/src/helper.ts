import { EnMarket } from './stock.js';

export function sleep(t = 0) {
  return new Promise(resolve => setTimeout(resolve, t));
}

export function splitFullNc(fullNc: string) {
  const nc = fullNc.substring(0, fullNc.length - 3);
  const market = {
    US: EnMarket.USA,
    SG: EnMarket.SGX,
    HK: EnMarket.HKEX
  }[fullNc.substring(fullNc.length - 2)];
  return { nc, market };
}

export function groupBy<T extends Record<string, any>>(key: string, list: T[], delKey = false) {
  return list.reduce<Record<string, T[]>>((pre, item) => {
    const foo = item[key];
    const fooList = pre[foo] || [];
    pre[foo] = fooList;
    if (delKey) delete item[key];
    fooList.push(item);
    return pre;
  }, {});
}

export function ttm<T>(by: string, list: any[]): T[] {
  if (!Array.isArray(list) || !list.length) return [];

  const latest = new Date(list[0][by]);
  const sinceTime = Date.UTC(latest.getUTCFullYear()-1, latest.getUTCMonth());
  return list.filter(item => {
    const val = new Date(item[by]);
    return sinceTime < Date.UTC(val.getUTCFullYear(), val.getUTCMonth());
  });
}
