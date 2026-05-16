import { InfluxDB, QueryApi, Point } from '@influxdata/influxdb-client';
import { EnCurrency, EnMarket, type IStock, A_DAY_MS, A_DAY_S } from '@watsonserve/stock-base';
import { IDBConf, IFxData, IPriceQuery, IStData } from './entities.js';

export function toFxPoint(sgd: number, hkd: number, cny: number, timestamp: number): Point {
  return new Point(EnMarket.FX)
    .floatField('SGD', sgd)
    .floatField('HKD', hkd)
    .floatField('CNY', cny)
    .timestamp(timestamp);
}

export function toStockPoint(market: EnMarket, st: IStock, timestamp: number): Point {
  return new Point(market)
    .tag('nc', st.nc)
    .floatField('o', st.o || 0)
    .floatField('h', st.h || 0)
    .floatField('l', st.l || 0)
    .floatField('c', st.c || 0)
    .intField('v', st.v || 0)
    .floatField('boll_u', st.boll_u || 0)
    .floatField('boll_l', st.boll_l || 0)
    .floatField('ma_5', st.ma_5 || 0)
    .floatField('ma_20', st.ma_20 || 0)
    .floatField('ma_60', st.ma_60 || 0)
    .floatField('ma_250', st.ma_250 || 0)
    .timestamp(timestamp);
}

export class InfluxDAO {
  private origin = '';
  private org = '';
  private bucket = '';
  private token = '';

  constructor(dbConf: IDBConf) {
    const { origin, org, bucket, token } = dbConf;
    this.origin = origin;
    this.org = org;
    this.bucket = bucket;
    this.token = token;
  }

  protected async rm(measurement: string, start: string, stop: string) {
    const rsp = await fetch(`${this.origin}/api/v2/delete?org=${this.org}&bucket=${this.bucket}`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ start, stop, predicate: `_measurement="${measurement}"` })
    });
    if (!rsp.ok) throw new Error(`http status: ${rsp.status}`);
  }

  protected async _writeToInfluxDB(points: Point[]) {
    const { origin: url, token, org, bucket } = this;
    const client = new InfluxDB({ url, token });

    const writeClient = client.getWriteApi(org, bucket, 's');

    for (let i = 0; i < points.length; i += 100) {
      const foo = points.slice(i, i+100);
      foo.length && writeClient.writePoints(foo);
    }
    await writeClient.flush();
    await writeClient.close();
  }

  private async __query<T = any>(queryClient: QueryApi, fileds: string[], gte: string, lt: string, markets: string[], ncs: string[], last = false) {
    const { bucket } = this;

    const mkQuery = markets.map(mk => `r["_measurement"] == "${mk}"`).join(' or ');
    const ncQuery = ncs.map(nc => `r["nc"] == "${nc}"`).join(' or ');
    const fdQuery = fileds.map(fd => `r["_field"] == "${fd}"`).join(' or ');

    const filters = [mkQuery, ncQuery, fdQuery].filter(Boolean).map(str => `|> filter(fn: (r) => ${str})`).join('\n  ');

    const fluxQuery = `from(bucket: "${bucket}")
  |> range(start: ${gte}, stop: ${lt})
  ${filters}${last ? '\n  |> last()' : ''}
  |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")`;
    // console.debug(fluxQuery);

    return new Promise<T[]>((resolve, reject) => {
      const list: any[] = [];
      queryClient.queryRows(fluxQuery, {
        next: (row, tableMeta) => {
          const item = tableMeta.toObject(row);
          const { result, table, _start, _stop, _measurement, _time, nc, ...content } = item;
          list.push({ time: ~~(new Date(_time).getTime() / 1000), nc, ...content });
        },
        error: reject,
        complete: () => resolve(list),
      });
    });
  }

  async readDateFx(gte: string, lt: string) {
    const { origin: url, token, org } = this;
    const client = new InfluxDB({ url, token });
    const queryClient = client.getQueryApi(org);

    return this.__query<IFxData>(queryClient, [EnCurrency.SGD, EnCurrency.HKD, EnCurrency.CNY], gte, lt, [EnMarket.FX], []);
  }

  private async __readDateStock(queryClient: QueryApi, ncs: string[], ltTime: Date) {
    const lt = ltTime.toJSON();
    const gte = new Date(ltTime.getTime() - 15 * A_DAY_MS).toJSON().substring(0, 10);

    const [fxs, stocks] = await Promise.all([
      this.__query(queryClient, [EnCurrency.SGD, EnCurrency.HKD, EnCurrency.CNY], gte, lt, [EnMarket.FX], [], true),
      ncs.length
        ? this.__query(queryClient, ['c', 'v'], gte, lt, [EnMarket.SGX, EnMarket.USA, EnMarket.HKEX], ncs, true)
        : Promise.resolve([])
    ]);

    const prices = Object.fromEntries(stocks.map(item => [item.nc as string, item.c as number]));

    return { fxs: fxs[0] as IFxData, prices };
  }

  async readLatestStock(ncs: string[], lt: Date) {
    const { origin: url, token, org } = this;
    const client = new InfluxDB({ url, token });
    const queryClient = client.getQueryApi(org);

    return this.__readDateStock(queryClient, ncs, lt);
  }

  async readDateStock(deCompressNcs: IPriceQuery[]) {
    const { origin: url, token, org } = this;
    const client = new InfluxDB({ url, token });
    const queryClient = client.getQueryApi(org);

    return Promise.all(deCompressNcs.map(async ({ date, ncs }) => {
      const lt = new Date((~~(date / A_DAY_S) + 1) * A_DAY_MS);
      const { fxs, prices } = await this.__readDateStock(queryClient, ncs, lt);
      const { time, ..._fxs } = fxs;
      return { date, fxs: _fxs, prices };
    }));
  }
}
