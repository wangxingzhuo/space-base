import { type IDiv, type IStock, type IHoliday, type IStockPoint, EnMarket, groupBy, ttm, A_DAY_S, IFx } from '@watsonserve/stock-base';
import { InfluxDAO, toFxPoint, toStockPoint } from './influx.js';
import { dbConf } from './entities.js';
import { Dividend, Holiday } from './mongo.js';

// const { user, password, host, db } = psqlConf;
// const sql = postgres(`postgres://${user}:${password}@${host}/${db}`);

// async function queryHandles(uid = '') {
//   const list = await sql`SELECT * FROM handle_stocks WHERE uid=${uid}`;
// }
export class DAO extends InfluxDAO {
  private static ignore = new Set<string>(['BRK.B.US']);

  constructor() {
    super(dbConf);
  }

  writeFxHistory(history: IFx[]) {
    return super._writeToInfluxDB(history.map(({ SGD, HKD, CNY, stamp }) => toFxPoint(SGD, HKD, CNY, stamp)));
  }

  writeFx(fx: IFx) {
    return this.writeFxHistory([fx]);
  }

  writeHistory(sts: IStockPoint[]) {
    return super._writeToInfluxDB(sts.map(({ market, st, timestamp }) => toStockPoint(market as EnMarket, st, timestamp)));
  }

  writePrices(market: EnMarket, sts: IStock[], stamp: number) {
    return super._writeToInfluxDB(sts.map(st => toStockPoint(market, st, stamp)));
  }

  addIgnore(fullNcs: string[]) {
    fullNcs.map(fullNc => DAO.ignore.add(fullNc));
  }

  async loadDividend(ncs: string[]) {
    const now = new Date();
    const lastYear = Date.UTC(now.getUTCFullYear()-1, now.getUTCMonth(), now.getUTCDate()) / 1000;

    const result = await Dividend.find({ nc: { $in: ncs }, ex: { $gt: ~~lastYear } }).exec();

    const divs = groupBy('nc', result, true);
    const remain = new Set<string>();

    const collection: Record<string, IDiv[]> = {};
    for (const fullNc of ncs) {
      const nc = fullNc.substring(0, fullNc.length - 3);
      const list = divs[fullNc];

      if (!list && !DAO.ignore.has(fullNc)) {
        remain.add(fullNc);
        continue;
      }

      collection[nc] = ttm('ex', list);
    }

    ncs.splice(0, ncs.length, ...remain);
    return collection;
  }

  async writeDividend(divPoints: IDiv[]) {
    await Dividend.bulkWrite(divPoints.map(doc => ({ updateOne: { filter: doc, update: { $set: doc }, upsert: true } })));
  }

  async readHolidays(s: number, e: number) {
    const list = await Holiday.find({ end: { $gt: s, $lt: e } }).sort({ time: -1 });
    return list.map(item => {
      const { market, title, start, end } = item;
      return { market, title, start, end };
    });
  }

  async writeHolidays(holidays: IHoliday[]) {
    await Holiday.bulkWrite(holidays.map(doc => ({ updateOne: { filter: doc, update: { $set: doc }, upsert: true } })));
  }

  private async _fun(t: number): Promise<number> {
    const wd = new Date(t * 1000).getUTCDay(); // validate startTime
    switch (wd) {
      case 0: // Sunday
        t -= A_DAY_S;
      case 6: // Saturday
        t -= A_DAY_S;
      default:
    }
    const aHoliday = await Holiday.findOne({ start: { $lte: t }, end: { $gt: t } }).exec();
  
    return !aHoliday ? t : this._fun(aHoliday.start - A_DAY_S);
  };
  
  async confirmADay(t: number) {
  
    let err: Error | null = null;
    try {
      t = await this._fun(t);
    } catch (_err) {
      err = _err as Error;
    }
  
    if (err) throw err;
  
    return t;
  }
}
