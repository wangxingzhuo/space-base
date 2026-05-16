import { Decimal } from 'decimal.js';
import { IDividend, INetCash, IROR } from '@/entities';

function sliceByDate(divs: IDividend[], s: number, e: number) {
  const sIdx = divs.findIndex(item => s < item.date);
  if (sIdx < 0) return [];

  divs = divs.slice(sIdx);
  const eIdx = divs.findIndex(item => item.date <= e);
  if (eIdx < 0) return [];

  return divs.slice(0, eIdx+1);
}

function compXIRR(xir: INetCash[], xirr: Decimal) {
  const _compXIRR = (r: Decimal) => {
    return +xir.reduce((pre, item) => {
      const { t, net_cash: netCash } = item;

      const _t = new Decimal(t.toFixed(3));
      const _netCash = new Decimal(netCash.toFixed(3));

      return pre.add(_netCash.div(r.pow(_t)));
    }, new Decimal(0)).toFixed(3);
  };

  let s = new Decimal(0.1);
  let e = new Decimal(2);

  for (let n = 20; 0 <= n && e.sub(s).gt(0.00005); n--) {
    switch (Math.sign(_compXIRR(xirr))) {
      case 1:
        s = xirr;
        break;
      case -1:
        e = xirr;
        break;
      default:
        return xirr;
    }
    xirr = s.add(e).div(2);
  }

  return xirr;
}

export function comput(sTime: number, eTime: number, curr = 'USD', ror: IROR) {
  let { twr, xir, divs } = ror;
  twr = twr.map(item => {
    const { fxs, gap, ..._item } = item;
    const fx = fxs[curr] || 1;
    return Object.assign(_item, {
        fxs,
        gap: { next_open: fx * gap.next_open, prev_close: fx * gap.prev_close }
    });
  });
  xir = xir.map(item => {
    const { fxs, net_cash } = item;
    return { ...item, net_cash: (fxs[curr] || 1) * net_cash };
  });
  divs = divs.map(item => {
    const { fxs, amount } = item;
    return { ...item, amount: (fxs[curr] || 1) * amount };
  });

  let simCost = 0;
  let simYield = 0;
  xir.forEach(item => {
    const { net_cash: netCash } = item;
    if (netCash < 0) {
      simCost += -netCash;
    } else {
      simYield += netCash;
    }
  });

  const sDay = ~~(sTime / 86400) - 1;
  const allDivid = +divs.reduce((sum, item) => {
    const { date, fxs, amount } = item;
    xir.push({ t: ~~(date / 86400 - sDay) / 365, fxs, net_cash: amount });
    return sum + amount;
  }, 0).toFixed(2);
  const delta = simYield + allDivid - simCost;
  const srr = +new Decimal(delta).div(new Decimal(simCost)).mul(100).toFixed(2);

  let gain = new Decimal(1);
  let floatAmount = new Decimal(0);
  for (let i = 1; i < twr.length; i++) {
    const { date: prevDate, fxs: prevFxs, gap: prevGap } = twr[i - 1];
    const { date: nextDate, fxs: nextFxs, gap } = twr[i];
    const dl = sliceByDate(divs, prevDate, nextDate);
    const divi = dl.reduce((sum, item) => sum + item.amount, 0);

    const close = new Decimal(gap.prev_close);
    const closeWithDivi = new Decimal(divi.toFixed(3)).add(close);
    const open = new Decimal(prevGap.next_open);
    // debugFoo.push(
    //   `${new Date(prevDate*1000).toJSON().substring(0, 10)}~${new Date(nextDate*1000).toJSON().substring(0, 10)} ${close.sub(open).toFixed(3)}`
    // );
    floatAmount = floatAmount.add(close).sub(open);
    gain = gain.mul(closeWithDivi).div(open);
  }

  // console.log(debugFoo.join('\n'));
  const progressOfYear = 365 / (~~(eTime / 86400) - sDay - 1);
  const srrForYear = srr * progressOfYear;
  const twrr = +gain.sub(1).mul(100).toFixed(2);
  const twrrForYear = twrr * progressOfYear;
  const appreciation = +floatAmount.toFixed(2);
  const xirr = +compXIRR(xir, new Decimal(1 + twrrForYear / 100)).sub(1).mul(100).toFixed(2);

  return { xirr, srrForYear, twrr, twrrForYear, appreciation, allDivid, lastDivDate: divs[divs.length-1]?.date || 0 };
}
