import { useEffect, useState } from 'react';
import { loadRecords } from '@/api';
import { type IDataFiled, viewRow } from '@/helpers/view-data';
import DataTable from '@/components/data-table';
import classes from '@/components/data-table/index.module.styl';

export default function Records() {
  const headerFileds = ['ttime', 'nc', 'count', 'cost'];
  const [data, setData] = useState<IDataFiled[][]>([]);

  const loadData = async () => {
    const now = new Date();
    const start = ~~(Date.UTC(now.getFullYear()) / 1000);
    const end = ~~(now.getTime() / 1000);
    const list = await loadRecords(start, end);
    const tableData = list.map(item => viewRow(classes, headerFileds, item));
    setData(tableData);
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="app">
      <DataTable headerFileds={headerFileds} viewData={data} />
    </div>
  );
}
