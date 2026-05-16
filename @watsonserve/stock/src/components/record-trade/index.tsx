import { useCallback, useRef, useState } from 'react';
import Selector from '@watsonserve/ui/selector';
import Button from '@watsonserve/ui/button';
import { EnTType, type ITade } from '@/entities';
import Modal from '../modal';
import classes from './style.module.styl';

interface IProps {
  onSubmit: (dataSet: ITade) => void;
  onClose?: () => void;
}

export default function (props: IProps) {
  const [nc, setNc] = useState('');
  const [currency, setCurrency] = useState<'USD'|'SGD'|'HKD'>('USD');
  const [tType, setTType] = useState(EnTType.BUY);
  const [count, setCount] = useState(1);
  const [cost, setCost] = useState('');
  const [date, setDate] = useState(new Date().toJSON().substring(0, 10));
  const formRef = useRef<HTMLFormElement|null>(null);

  const handleSubmit = useCallback((ev: any) => {
    ev.stopPropagation();
    ev.preventDefault();

    const { nc, count, cost, date } = Object.fromEntries([...new FormData(formRef.current!).entries()]) as Record<string, string>;
    const arrDate = (date as string).split('-').map(Number) as [number, number, number];
    arrDate[1] -= 1;
    props.onSubmit?.({ nc, count: +count, cost: +cost, ttime: ~~(Date.UTC(...arrDate) / 1000), currency, ttype: tType });
  }, [tType, currency, props.onSubmit]);

  return (
    <Modal onClose={props.onClose}>
      <div className={classes['record-trade']}>
        <h5 className={classes['record-trade__title']}>Record a trade</h5>
        <form className={classes['record-form']} ref={formRef} onSubmit={handleSubmit}>
          <input
            className="some-input" placeholder="stock node" name="nc" autoComplete="off"
            value={nc} onInput={(ev: any) => setNc(ev.target.value)}
          />
          <Selector
            options={[{name: EnTType.BUY, title: 'buy'}, {name: EnTType.SELL, title: 'sell'}]}
            value={tType}
            onInput={setTType}
          />
          <Selector
            options={[{name: 'USD', title: 'USD'}, {name: 'SGD', title: 'SGD'}, {name: 'HKD', title: 'HKD'}] as any[]}
            value={currency}
            onInput={setCurrency}
          />
          <input
            className="some-input" type="number" placeholder="count" name="count" autoComplete="off"
            value={count} onInput={(ev: any) => setCount(ev.target.value)}
          />
          <input
            className="some-input" type="number" placeholder="cost" name="cost" autoComplete="off"
            value={cost} onInput={(ev: any) => setCost(ev.target.value)}
          />
          <input
            className="some-input" type="date" placeholder="date" name="date" autoComplete="off"
            value={date} onInput={(ev: any) => setDate(ev.target.value)}
          />
          <Button type="submit" title="submit" onClick={handleSubmit} />
        </form>
      </div>
    </Modal>
  );
}
