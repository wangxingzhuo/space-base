import { useCallback, useState } from 'react';
import Button from '@watsonserve/ui/button';
import Avatar from '@watsonserve/ui/avatar';
import { useStore } from '@/store';
import { ITade } from '@/entities';
import { recordAtrade } from '@/api';
import RecordTrade from '@/components/record-trade';
import classes from './index.module.styl';

export default function Header() {
  const { state } = useStore();
  const { usr } = state;
  const [recordFormHasShow, showRecordForm] = useState(false);

  const handleRecord = useCallback(() => showRecordForm(true), []);

  const handleSubmit = useCallback(async (dataSet: ITade) => {
    try {
      await recordAtrade(dataSet);
      showRecordForm(false);
    } catch (err) {
      console.error(err);
    }
  }, []);

  return (
    <>
      <header className={classes['header']}>
        <div className={classes['user']}>
          <Avatar src={usr.avatar} alt={usr.name[0]} />
          <div className={classes['nick-name']}>{ usr.name }</div>
        </div>
        <Button type="round" className="default" title="+" onClick={handleRecord} />
        <Button type="round" className={classes['btn-add']} title="+" onClick={handleRecord} />
      </header>
      {recordFormHasShow && <RecordTrade onSubmit={handleSubmit} onClose={() => showRecordForm(false)} />}
    </>
  );
}
