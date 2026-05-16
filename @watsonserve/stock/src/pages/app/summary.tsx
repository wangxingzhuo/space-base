import { useMemo } from 'react';
import { ISumInfo } from '@/entities';
import classes from './summary.module.styl';
import Button from '@watsonserve/ui/button';

interface IProps {
  dateSeg: string;
  currency: string;
  sumInfo: Partial<ISumInfo>;
  changeGain: (tag: string, currency: string) => void;
}

export default function App(props: IProps) {
  const { dateSeg, currency, sumInfo, changeGain } = props;
  const {
    totalDivTTM = 0, totalCost = 0, totalAsset = 0,
    twrr = 0, appreciation = 0, allDivid = 0, twrrForYear = 0, xirr = 0, srrForYear = 0
  } = sumInfo;

  const list = useMemo(() => {
    let curr = currency.substring(0, 2);
    curr = curr + ('CN' === curr ? '¥' : '$');
    return [
      ['Dividend (TTM)', `${curr} ${totalDivTTM.toLocaleString()}`],
      ['Dividend Yield (TTM)', `${(totalDivTTM / totalCost * 100).toFixed(2)}%`],
      ['Assets', `${curr} ${totalAsset.toLocaleString()}`],

      ['Dividend Yield', `${curr} ${allDivid.toLocaleString()}`],
      ['Capital Appreciation', `${curr} ${appreciation.toLocaleString()}`],
      ['TWRR', `${twrr.toFixed(2)}%`],

      ['SRR (FY)', `${srrForYear.toFixed(2)}%`],
      ['XIRR (FY)', `${xirr.toFixed(2)}%`],
      ['TWRR (FY)', `${twrrForYear.toFixed(2)}%`],
    ]
  }, [totalDivTTM, totalCost, totalAsset, twrr, appreciation, allDivid, twrrForYear, xirr, srrForYear]);

  return (
    <>
      <div className={classes['data-row']}>
        <div>
          <Button type="round" active={'LFY' === dateSeg} disabled={'LFY' === dateSeg} onClick={() => changeGain('LFY', currency)}>LFY</Button>
          <Button type="round" active={'TY' === dateSeg} disabled={'TY' === dateSeg} onClick={() => changeGain('TY', currency)}>This Year</Button>
        </div>
        <div>
          <Button type="round" active={'USD' === currency} disabled={'USD' === currency} onClick={() => changeGain(dateSeg, 'USD')}>USD</Button>
          <Button type="round" active={'HKD' === currency} disabled={'HKD' === currency} onClick={() => changeGain(dateSeg, 'HKD')}>HKD</Button>
          <Button type="round" active={'SGD' === currency} disabled={'SGD' === currency} onClick={() => changeGain(dateSeg, 'SGD')}>SGD</Button>
          <Button type="round" active={'CNY' === currency} disabled={'CNY' === currency} onClick={() => changeGain(dateSeg, 'CNY')}>CNY</Button>
        </div>
      </div>
      <ul className={classes['summary']}>
        {list.map((item, idx) => (
          <li className={classes['smy-item']} key={idx}>
            <span className={classes['smy-title']}>{ item[0] }</span>
            <span className={classes['smy-val']}>{ item[1] }</span>
          </li>
        ))}
      </ul>
    </>
  );
}
