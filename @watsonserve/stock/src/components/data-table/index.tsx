import { useCallback } from 'react';
import { type IDataFiled, dict } from '@/helpers/view-data';
import { classify } from '@watsonserve/utils';
import classes from './index.module.styl';

interface IProps {
  headerFileds: string[];
  viewData: IDataFiled[][];
  sortBy?: string;
  setSortBy?: (by: string) => void;
  onClick?: (y: number, nc: string) => void;
}

function Empty () {
  return <div className={classes['empty']}>暂无数据</div>
}

export default function (props: IProps) {
  const { sortBy = '', headerFileds, viewData, onClick, setSortBy } = props;

  const handleClick = useCallback((ev: any, nc: string) => {
    ev.stopPropagation();
    ev.preventDefault();

    onClick?.(ev.offsetTop, nc);
  }, [onClick]);

  if (!viewData.length) return <Empty />;

  return (
    <div className={classes['st-view-box']}>
      <table className={classes['st-view']}>
      <thead className={classes['st-view-header']}>
        <tr>
          {headerFileds.map(filed => {
            const { vType, title } = dict[filed];
            const className = classify({ [classes[`st-${vType}`]]: true, [classes['desc']]: filed === sortBy });
            return (
              <th className={className} key={filed} onClick={() => setSortBy?.(filed)}>{ title }</th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {viewData.map((row, idx) => (
          <tr key={idx} onClick={ev => handleClick(ev, row[0].viewVal)}>
            {row.map(({ filed, className, viewVal }) => (<td className={className} key={`${idx}_${filed}`}>{ viewVal }</td>))}
          </tr>
        ))}
      </tbody>
      </table>
    </div>
  )
}