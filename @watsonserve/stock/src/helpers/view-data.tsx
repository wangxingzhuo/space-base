import { classify } from '@watsonserve/utils';

const ginsColor = ['st-loss', 'st-gray', 'st-gins'];

interface IViewData {
  nc: string;
  percent: number;
  glStyl: string;
  unrealizedGainRate: number;
  currency: string;
  count: number;
  dividendRate: number;
  price: number;
  cost: number;
  date: number;
}

export interface IDataFiled {
  filed: string;
  className: string;
  viewVal: any;
  isImp: boolean;
}

export const dict: Record<string, { title: string; vType: string; impLine?: number; }> = {
  nc:                 { title: 'code',     vType: 'str' },
  percent:            { title: 'percent',  vType: 'rate', impLine: 5 },
  unrealizedGainRate: { title: 'gain',     vType: 'rate', impLine: 20 },
  price:              { title: 'price',    vType: 'money' },
  count:              { title: 'count',    vType: 'num' },
  cost:               { title: 'cost',     vType: 'money' },
  dividendRate:       { title: 'dividend', vType: 'rate', impLine: 5 },
  ttime:              { title: 'date',     vType: 'date' },
};

const dataRender: Record<string, (n: number) => string> = {
  date: (n: number) => new Date(n * 1000).toJSON().substring(0, 10),
  rate: (n: number) => `${n.toFixed(2)}%`,
  num: (n: number) => n.toLocaleString()
};

export function viewRow(classes: Record<string, string>, headerOrder: string[], row: Partial<IViewData>): IDataFiled[] {
  const { unrealizedGainRate = 0, currency } = row;
  const curr = `${currency?.substring(0, 2)}$`;
  const glStyl = ginsColor[Math.sign(unrealizedGainRate) + 1];

  const vRow = headerOrder.map(filed => {
    let { vType, impLine = 0 } = dict[filed];
    const val = (row as any)[filed];
    const isImp = 'rate' === vType && impLine < val;
    const className = classify({
      [classes[`st-${vType}`]]: true,
      [classes[glStyl]]: 'unrealizedGainRate' === filed,
      [classes['st-imp']]: isImp
    });
    const viewVal = 'money' === vType ? `${curr} ${dataRender.num(val)}` : dataRender[vType]?.(val) || val;
    return { filed, className, viewVal, isImp };
  });

  if (1 < vRow.filter(cell => cell.isImp).length) {
    vRow[0].className += ` ${classes['st-imp']}`;
  }

  return vRow;
}
