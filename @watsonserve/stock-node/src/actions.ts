import { type IDiv,  type IStockPoint, EnMarket, sleep, log, StockLoader, A_DAY_S, A_DAY_MS } from '@watsonserve/stock-base';
import { DAO } from './db.js';
import { IPriceQuery } from './entities.js';

export async function srvCalendar() {
  const start = ~~(Date.now() / A_DAY_MS);
  const end = start + 30;
  return new DAO().readHolidays(start * A_DAY_S, end * A_DAY_S);
}

export async function loadAMarket(stockLoader: StockLoader, market: EnMarket, isDebug = false) {
  if (!EnMarket[market]) throw new Error(`unsupported market ${market}`);
  log.info(`start loading ${market} data...`);

  isDebug && sleep(5000);
  const dao = new DAO();
  if (EnMarket.FX === market) {
    const fx = await stockLoader.loadFx();
    await dao.writeFx(fx);
  } else {
    const { stamp, sts } = await stockLoader.loadPrice(market);
    await dao.writePrices(market, sts, stamp);
  }

  log.info(`finished loading ${market} data`);
}

export async function loadAStock(stockLoader: StockLoader, fullNc: string, isDebug = false) {
  if (isDebug) await sleep(2000);
  const sts = await stockLoader.loadHistory(fullNc);
  await new DAO().writeHistory(sts as IStockPoint[]);
  console.log(`finished loading ${fullNc} history`);
}

export async function loadHolidays(stockLoader: StockLoader) {
  const holidays = await stockLoader.loadHolidays();
  return new DAO().writeHolidays(holidays);
}

export async function loadFxHistory(stockLoader: StockLoader) {
  const { result, remain } = await stockLoader.loadFxHistory();
  log.warn(`loadFxHistory remain: ${JSON.stringify(remain)}`);
  await new DAO().writeFxHistory(result);
}

// async function actionRm(table: string) {
//   const dao = new InfluxDAO(dbConf);
//   await dao.rm(table, '1970-01-01', '2026-12-31');
// }

export function srvDatePrices(deCompressNcs: IPriceQuery[]) {
  return new DAO().readDateStock(deCompressNcs);
}

export async function srvDateFx(sTime: number, eTime: number) {
  const gte = new Date(sTime * 1000 - 30 * A_DAY_MS).toJSON().substring(0, 10);
  const lt = new Date((~~(eTime / A_DAY_S) + 1) * A_DAY_MS).toJSON().substring(0, 10);
  let result = await new DAO().readDateFx(gte, lt);
  result.forEach(item => {
    item.time = ~~(item.time / A_DAY_S) * A_DAY_S;
  });
  const idx = result.findIndex(item => sTime < item.time) - 1;
  return result.slice(Math.max(0, idx));
}

export function srvLatestPrices(ncs: string[], endTime: Date) {
  return new DAO().readLatestStock(ncs, endTime);
}

export async function srvDividend(ncs: string[], foce = false) {
  const stockLoader = new StockLoader();
  let divPool: Record<string, IDiv[]> = {};
  let err: Error | undefined = undefined;
  try {
    const divSrv = new DAO();
    if (!foce) {
      divPool = await divSrv.loadDividend(ncs);
    }
    if (ncs.length) {
      await StockLoader.init();
      await stockLoader.mount();
      const { ign, points, divPool: newDivPool } = await stockLoader.loadDividends(ncs);
      divSrv.addIgnore(ign);
      await divSrv.writeDividend(points);
      Object.assign(divPool, newDivPool);
    }
  } catch (_err) {
    err = _err as Error
  }
  stockLoader.destroy();
  if (err) throw err;

  return divPool;
}
