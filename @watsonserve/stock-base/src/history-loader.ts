import fs from 'fs/promises';
import { EnMarket, IFx, type IStockPoint } from './stock.js';
import { getMarketCloseTime } from './close-time.js';
import WebRequest from './web-request.js';
import { sleep, splitFullNc } from './helper.js';

// 历史数据
export default class HistoryLoader extends WebRequest {
  private async __getHKOrUSAHistory(market: EnMarket, nc: string): Promise<IStockPoint[]> {
    let cntry = EnMarket.USA === market ? 'us' : 'hk';
    await this.goto(`https://quote.eastmoney.com/${cntry}/${nc}.html`);

    let secid = `116.${nc}`;
    if (EnMarket.USA === market) {
      await sleep(500);
      // secid = await this.get_em_code(nc);
      secid = await this.read('quotecode');
    }

    const params = {
      fields1: 'f1,f2,f3,f4,f5,f6',
      fields2: 'f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61',
      klt: 101, // 60 hour, 101 day, 102 week, 103 month
      fqt: 0,
      secid,
      beg: 0,
      end: 20500000,
      // ut: 'bd1d9ddb04089700cf9c27f6f7426281',
      // lmt: 1000000,
    };
    if (this.isDebug) {
      await sleep(5000);
    }
    const resp = await super.get('https://push2his.eastmoney.com/api/qt/stock/kline/get', params);
    // const resp = JSON.parse(await fs.readFile(path.join(import.meta.dirname, 'hsbc.json'), 'utf-8'));
    const { klines } = resp.data;
    return (klines as string[]).map(line => {
      const [date, open, close, hight, low, vol] = line.split(',');
      return {
        market,
        timestamp: getMarketCloseTime(market, new Date(`${date}T15:00:00Z`).getTime()),
        st: { nc, n: '', o:+open, c:+close, h:+hight, l:+low, v:+vol }
      };
    });
  }

  private async __getSGXHistory(nc: string): Promise<IStockPoint[]> {
    const rsp = await super.get(`https://api.sgx.com/securities/v1.1/charts/historic/stocks/code/${nc}/5y`, { params: 'trading_time,vl,lt' });
    const { historic } = rsp.data;
    return (historic as any[]).map(st => {
      const { trading_time, vl: v, lt: c } = st;
      const fullYear = trading_time.substring(0, 4);
      const month = trading_time.substring(4, 6);
      const date = trading_time.substring(6, 8);
      const timestamp = ~~(new Date(`${fullYear}-${month}-${date}T09:16:00Z`).getTime() / 1000);
      return { market: EnMarket.SGX, timestamp, st: { nc, n: '', o: 0, c, h: 0, l: 0, v } };
    });
  }

  async loadFxHistory() {
    const fxs = await Promise.all(['USDHKD', 'USDSGD', 'USDCNY'].map(
      code => this.get(
        'https://finance.pae.baidu.com/vapi/v1/getquotation',
        { group: 'huilv_kline', ktype: 'day', code, finClientType: 'pc' }
      )
    ));
    const [hk, sg, cn] = fxs.map(body => (body.Result.newMarketData.marketData as string).split(';'));
    const base = new Map(hk.map(line => {
      const [_0, date, _1, c] = line.split(',');
      const stamp = getMarketCloseTime(EnMarket.FX, new Date(`${date}T15:00:00Z`).getTime());
      return [stamp, { date, HKD: +c } as Partial<IFx>];
    }));
    sg.forEach(line => {
      const [_0, date, _1, c] = line.split(',');
      const stamp = getMarketCloseTime(EnMarket.FX, new Date(`${date}T15:00:00Z`).getTime());
      const fx = base.get(stamp) || { date } as Partial<IFx>;
      fx.SGD = +c;
      base.set(stamp, fx);
    });
    cn.map(line => {
      const [_0, date, _1, c] = line.split(',');
      const stamp = getMarketCloseTime(EnMarket.FX, new Date(`${date}T15:00:00Z`).getTime());
      const fx = base.get(stamp) || { date } as Partial<IFx>;
      fx.CNY = +c;
      base.set(stamp, fx);
    });
    const result: IFx[] = [];
    const remain: IFx[] = [];
    [...base.entries()].forEach(([stamp, fx]) => {
      const _fx = { stamp, ...fx } as IFx;
      if (!fx.HKD || !fx.SGD || !fx.CNY) {
        remain.push(_fx);
        return;
      }
      result.push(_fx);
    });

    return { result, remain };
  }

  loadHistory(fullNc: string) {
    const { nc, market } = splitFullNc(fullNc);

    switch (market) {
      case EnMarket.SGX:
        return this.__getSGXHistory(nc);
      case EnMarket.HKEX:
      case EnMarket.USA:
        return this.__getHKOrUSAHistory(market, nc);
      default:
    }
    throw new Error(`Unsupported market: ${market}`);
  }
}
