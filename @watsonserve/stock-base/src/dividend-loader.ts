import { log } from './log.js';
import PriceLoader from './price-loader.js';
import { ttm } from './helper.js';
import { type IDiv, type IDividend } from './stock.js';

function toDivPoint(fullNc: string, div: IDividend) {
  const { annc, ex, paid, ...another } = div;
  return {
    ...another,
    nc: fullNc,
    annc: ~~(annc.getTime() / 1000),
    ex: ~~(ex.getTime() / 1000),
    paid: ~~(paid.getTime() / 1000)
  } as IDiv;
}

const rxDate = /\d+/g;

function dateCNtoDate(str: string) {
  const ymd = (str as string).match(rxDate)?.slice(0, 3).map(i => +i);
  if (!ymd) return null;
  if ('number' === typeof ymd?.[1]) {
    ymd[1] -= 1;
  }
  return new Date(Date.UTC.apply(null, ymd as any));
}

export class DividendLoader extends PriceLoader {
  private async __laodIbmCode(nc: string) {
    const resp = await super.get(`https://api.sgx.com/marketmetadata/v2?stock-code=${nc}`);
    return resp.data?.[0]?.ibmCode || '';
  }

  private async __loadHKDividend(nc: string) {
    const token = await super._loadHkexToken();
    const qid = Date.now();
    const callback = `jsonp_${qid}`;
    const params = { sym: +nc, token, lang: 'chi', recperpage: 5, page: 1, qid, callback };

    const resp: string = await super.get('https://www1.hkex.com.hk/hkexwidget/data/getequityentitlement', params);
    const strJson = resp.substring(callback.length + 1, resp.length - 1);
    const { entitlementlist } = JSON.parse(strJson).data;

    const list: IDividend[] = [];
    for (const item of entitlementlist) {
      const { detail, announcement_date, ex_date, payment_date, announcement_URL } = item;

      const annc = dateCNtoDate(announcement_date);
      const ex = dateCNtoDate(ex_date);
      const paid = dateCNtoDate(payment_date);

      const divid = Array.from<string>(detail.match(/(USD|HKD|GBP) (\d+\.\d+)/g) || [])
        .reduce<Record<string, any>>((pre, item) => {
          const [currency, amount] = item.split(' ');
          pre[currency] = { currency, amount: +amount };
          return pre;
        }, {});

      list.push({ ...(divid['HKD'] || divid['USD'] || divid['GBP']), annc, ex, paid, announcement_URL });
    }

    return [ttm<IDividend>('ex', list), []];
  }

  private async __loadSGDividend(nc: string) {
    const ibmcode = await this.__laodIbmCode(nc);
    const params = {
      pagesize: 15,
      pagestart: 0,
      ibmcode,
      params: 'id,anncType,dateAnnc,exDate,name,particulars,recDate,datePaid',
      order: 'desc',
      orderBy: 'dateAnnc'
    };

    const { data } = await super.get('https://api.sgx.com/corporateactions/v1.0', params);

    const bonus: IDividend[] = [];
    const dividend: IDividend[] = [];

    for (const item of data as any[]) {
      const { anncType, particulars, dateAnnc, exDate, recDate, datePaid } = item;
      const annc = new Date(dateAnnc);
      const ex = new Date(exDate);
      const rec = new Date(recDate); // 登记日
      const paid = new Date(datePaid);

      if ('DIVIDEND' === anncType) {
        const amount = +particulars.match(/SGD (\d+\.\d+)/)?.[1] || 0;
        const lstIdx = dividend.length - 1;
        if (dividend[lstIdx]?.ex.getTime() === ex.getTime() && amount) {
          dividend[lstIdx].amount! += amount;
        } else {
          dividend.push({ currency: 'SGD', amount, annc, ex, rec, paid } as IDividend);
        }
        continue;
      }
      if ('BONUS' === anncType) { // particulars: 'Ratio: 10:1'
        const ratio = particulars.match(/Ratio: (\d+:\d+)/);
        const [foo, bar] = ratio[1].split(':');

        bonus.push({ currency: 'SGD', ratio: 1+(+bar)/(+foo), annc, ex, rec, paid } as IDividend);
        continue;
      }
    }

    return [ttm<IDividend>('ex', dividend), bonus];
  }

  private async __loadUSDividend(nc: string) {
    const params = {
      reportName: 'RPT_USF10_INFO_DIVIDEND',
      columns: 'SECUCODE,SECURITY_CODE,SECURITY_NAME_ABBR,SECURITY_INNER_CODE,NOTICE_DATE,ASSIGN_TYPE,PLAN_EXPLAIN,EQUITY_RECORD_DATE,BONUS_PAY_DATE,EX_DIVIDEND_DATE,ASSIGN_PERIOD',
      // filter: `(SECUCODE="${nc}.N")`,
      filter: `(SECURITY_CODE="${nc.replace('.', '_')}")`,
      pageNumber: 1,
      pageSize: 200,
      sortTypes: -1,
      sortColumns: 'EX_DIVIDEND_DATE',
      source: 'SECURITIES',
      client: 'PC',
      v: Math.random().toString().substring(2).padStart(17, '0')
    };

    const strResp = await super.get('https://datacenter.eastmoney.com/securities/api/data/v1/get', params);
    const data = (JSON.parse(strResp).result?.data || [])as any[];

    const dividend: IDividend[] = [];

    for (const item of data) {
      const { ASSIGN_TYPE, PLAN_EXPLAIN, NOTICE_DATE, EX_DIVIDEND_DATE, BONUS_PAY_DATE } = item;

      if ('Cash' === ASSIGN_TYPE || 'Special cash' === ASSIGN_TYPE) {
        const amount = +PLAN_EXPLAIN.match(/(\d*\.?\d+)美元/)[1]; // 每1股派0.82美元股息
        if (!amount) console.warn(item);
        dividend.push({
          currency: 'USD',
          amount,
          annc: new Date(NOTICE_DATE),
          ex: new Date(EX_DIVIDEND_DATE),
          paid: new Date(BONUS_PAY_DATE),
        });
        continue;
      }
    }

    return [ttm<IDividend>('ex', dividend), []];
  }

  async loadDividend(fullNc: string) {
    const nc = fullNc.substring(0, fullNc.length - 3);
    const market = fullNc.substring(fullNc.length - 2);
    let data: IDividend[][];
    log.info(`start loading ${fullNc} dividend...`);

    switch (market) {
      case 'SG':
        data = await this.__loadSGDividend(nc);
        break;
      case 'HK':
        data = await this.__loadHKDividend(nc);
        break;
      case 'US':
        data = await this.__loadUSDividend(nc);
        break;
      default:
        throw new Error(`Unsupported market: ${market}`);
    }
    const [div, bonus] = data;
    const dps = div.map(item => toDivPoint(fullNc, item));
    const bps = bonus.map(item => toDivPoint(fullNc, item));

    log.info(`finished loading ${fullNc} dividend`);

    return { fullNc, nc, dps, bps };
  }

  async loadDividends(ncs: string[]) {
    const ign: string[] = [];
    let points: IDiv[] = [];
    const divPool: Record<string, IDiv[]> = {};

    const divs = await Promise.all(ncs.map(fullNc => this.loadDividend(fullNc)));
    for (const { fullNc, nc, dps, bps } of divs) {
      if (!dps.length && !bps.length) {
        ign.push(fullNc);
      } else {
        points = points.concat(dps, bps);
      }
      divPool[nc] = ttm('ex', dps);
    }

    return { ign, points, divPool };
  }
}
