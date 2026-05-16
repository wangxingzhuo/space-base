import { EnCurrency, EnMarket, type IFx, IStock } from './stock.js';
import { getMarketCloseTime } from './close-time.js';
import HistoryLoader from './history-loader.js';

export default class PriceLoader extends HistoryLoader {
  // 匯率
  private async __loadFx(ncs: EnCurrency[]) {
    try {
      const data = new Map<EnCurrency, number>();
      for (const nc of ncs) {
        const body = await this.get('https://finance.pae.baidu.com/selfselect/sug', {wd: `USD${nc}`, skip_login: 1, finClientType: 'pc'});
        const fx = body.Result.stock[0];
        data.set(nc, +fx.price);
      }
      return Object.fromEntries(data.entries());
    } catch (err) {
      throw new Error(`failed to load fx ${(err as Error).message}`); 
    }
  }

  async loadFx() {
    const fxs = await this.__loadFx([EnCurrency.SGD, EnCurrency.HKD, EnCurrency.CNY]);
    const stamp = getMarketCloseTime(EnMarket.FX);
    return { ...fxs, stamp } as IFx;
  }

  // 新加坡交易所全量股票
  protected async sgx() {
    try {
      const body = await this.get('https://api.sgx.com/securities/v1.1/stocks', { params: 'nc,lt,ptd,n,o,h,l,vl,trading_time' });
      const stockList = body.data.prices as any[];
      return stockList.map(({ trading_time:t,nc,lt:c,n,o,h,l,vl:v }) => ({ t, nc,n,o,c,h,l,v } as IStock));
    } catch (err) {
      throw new Error(`failed to load sgx ${(err as Error).message}`);
    }
  }

  // 香港交易所主板股票
  protected async hkex() {
    try {
      const token = await this._loadHkexToken();
      const qid = Date.now();
      const callback = `jsonp_${qid}`;
      const params = {
        lang: 'chi',
        token,
        sort: 5,
        order: 0,
        all: 1,
        subcat: 1,
        market: 'MAIN',
        qid,
        callback,
      };
      const resp = await this.get('https://www1.hkex.com.hk/hkexwidget/data/getequityfilter', params);
      const strJson = resp.substring(callback.length + 1, resp.length - 1);
      const body = JSON.parse(strJson);
      const { stocklist } = body.data;
      return (stocklist as any[]).map(item => {
        const { sym, nm: n, ls } = item;
        return { nc: sym.padStart(5, '0'), n, c: +ls } as IStock;
      });
    } catch (err) {
      throw new Error(`failed to load hkex ${(err as Error).message}`);
    }
  }

  // 标普500成份股
  private async __sp500(pn = 0, rn = 100) {
    const params = {
      financeType: 'index',
      market: 'us',
      code: 'SPX',
      sortKey: 'marketValue',
      sortType: 'desc',
      style: 'tablelist',
      finClientType: 'pc',
      pn, rn,
    };

    try {
      const resp = await this.get('https://finance.pae.baidu.com/sapi/v1/constituents', params);
      const stocklist = resp.Result.list.body as any[];
      return stocklist.map(item => {
        const { code: nc, name: n, rawData } = item;
        const { lastPx: c, volume: v, marketValue: mv } = rawData;
        return { nc, n, c, v, mv } as IStock;
      });
    } catch (err) {
      throw new Error(`failed to load s&p ${(err as Error).message}`);
    }
  }

  protected async sp500() {
    let pn = 0, rn = 100;
    let sts: IStock[] = [];
    while (true) {
      const _sts = await this.__sp500(pn, rn);
      const _len = _sts.length;
      sts = sts.concat(_sts);
      if (_len < rn) break;
      pn += _len;
    }
    return sts;
  }

  async loadPrice(market: EnMarket) {
    const stamp = getMarketCloseTime(market);
    let sts = Promise.resolve<IStock[]>([]);
    switch (market) {
      case EnMarket.HKEX:
        sts = this.hkex();
        break;
      case EnMarket.SGX:
        sts = this.sgx();
        break;
      case EnMarket.USA:
        sts = this.sp500();
        break;
      default:
        throw new Error(`unsupported market ${market}`);
    }
    return { sts: await sts, stamp };
  }
}
