import express, { type Request, type Response } from 'express';
import bodyParser from 'body-parser';
import { log } from '@watsonserve/stock-base';
import { IFxData, type IPriceQuery } from './entities.js';
import { initMongo } from './mongo.js';
import { srvCalendar, srvDateFx, srvDatePrices, srvDividend, srvLatestPrices } from './actions.js';

initMongo();

const listenPort = parseInt(process.argv[2]) || 3000;

const app = express();
app.use(bodyParser.urlencoded());
app.use(bodyParser.json());
app.use((req, rsp, next) => {
  if ('QUERY' === req.method) {
    req.method = 'GET';
  }
  rsp.setHeader('Content-Type', 'application/json; charset=utf-8');
  const startAt = Date.now(); // 记录请求开始时间
  log.info(`received request ${req.path} with query ${JSON.stringify(req.query)}`);

  // 监听响应结束事件
  rsp.on('finish', () => {
    log.info(`${req.path} spend ${Date.now() - startAt}ms`);
  });

  next(); // 继续处理请求
});
app.use((err: Error, req: Request, rsp: Response, next: Function) => {
  rsp.status(err ? 500 : 404);
  rsp.json({ status: err?.message || 'not found', stack: err.stack });
  log.error(err?.message || `unsupported path ${req.path}`);
});

app.get('/calendar', async (req, rsp) => {
  const result = await srvCalendar();
  rsp.json(result);
});

app.get('/dividend', async (req, rsp) => {
  let { ncs: _ncs, f } = req.query;
  const ncs = (_ncs as string)?.split(',') || [];
  const foce = '1' === f;

  const result = await srvDividend(ncs, foce);
  rsp.json(result);
});

app.get('/prices/latest', async (req, rsp) => {
  const { ncs: _ncs, lt } = req.query;
  const ncs = (_ncs as string)?.split(',') || [];
  const endTime = +(lt || NaN) * 1000;

  const result = await srvLatestPrices(ncs, isNaN(endTime) ? new Date() : new Date(endTime));
  rsp.json(result);
});

app.get('/prices', async (req, rsp) => {
  const delta = req.body as IPriceQuery[];
  const baseNcs = new Set<string>();
  const deCompressNcs: IPriceQuery[] = [];

  for (const item of delta) {
    const { date, ncs } = item;
    ncs.forEach(optNc => {
      const fullNc = optNc.substring(1);
      switch (optNc[0]) {
        case '+':
          baseNcs.add(fullNc);
          break;
        case '-':
          baseNcs.delete(fullNc);
          break;
        default:
      }
    });
    deCompressNcs.push({ date, ncs: [...baseNcs] });
  }

  const result = await srvDatePrices(deCompressNcs);
  rsp.json(result);
});

function find(list: IFxData[], d: number) {
  let s = 0;
  let e = list.length - 1;

  while (s+1 < e) {
    const c = (e + s) >> 1;
    const item = list[c];

    switch (Math.sign(item.time - d)) {
      case 1:
        e = c;
        break;
      case -1:
        s = c;
        break;
      default:
        return item;
    }
  }
  const item = { ...(list[e].time <= d ? list[e] : list[s]) };
  if (item.time !== d) {
    (item as any)._t = item.time;
    item.time = d;
  }
  return item;
}

app.get('/fx', async (req, rsp) => {
  let { start, end, dates } = req.query;
  let sTime = +(start as string);
  let eTime = +(end as string);
  let dList: number[] = [];
  if (dates) {
    dList = (dates as string).split(',').map(d => +d).sort((a, b) => a - b);
    sTime = dList[0];
    eTime = dList[dList.length - 1];
  }

  let result = await srvDateFx(sTime, eTime);
  if (dList.length) {
    result = dList.map(d => find(result, d));
  }
  rsp.json(result);
});

app.listen(listenPort, () => console.info(`listening on *:${listenPort}`));
