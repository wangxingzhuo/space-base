import { useState, useEffect, useMemo, useCallback } from 'react';
import { useStore } from '@/store';
import { viewRow } from '@/helpers/view-data';
import Summary from './summary';
import DataTable from '@/components/data-table';
import viewTableClasses from '@/components/data-table/index.module.styl';

export default function App() {
  const [headerOrder, setHeaderOrder] = useState<string[]>(['nc', 'percent', 'unrealizedGainRate', 'dividendRate', 'price', 'count', 'cost']);
  const [sortBy, setSortBy] = useState('percent');
  const { state, initial, changeGain } = useStore();
  const { currency = '', handles = [], dateSeg = '', comingDivs, sumInfo = {} } = state;

  const viewData = useMemo(() => (handles as any[])?.sort((a, b) => b[sortBy] - a[sortBy]).map(r => viewRow(viewTableClasses, headerOrder, r)), [sortBy, handles]);

  const handleDataClick = useCallback((y: number, nc: string) => {
    console.log(comingDivs?.map(item => JSON.stringify(item)));
  }, [comingDivs]);

  useEffect(() => {
    initial();
  }, []);

  return (
    <>
      <Summary dateSeg={dateSeg} currency={currency} sumInfo={sumInfo} changeGain={changeGain} />
      <DataTable headerFileds={headerOrder} viewData={viewData} sortBy={sortBy} setSortBy={setSortBy} onClick={handleDataClick} />
    </>
  )
}
