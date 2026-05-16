import { useEffect, useMemo, useState } from 'react';
import Toolbar from '@/components/toolbar';
import Dir from '@/components/dir';
import Meta from '@/components/meta';
import { pathToList } from '@/helpers/pathHelper';
import { resolve } from 'path';
import { Store } from '@/store/dir';
import { className } from '@watsonserve/utils';
// import { dirOrigin } from '@/constant';
import './home.styl';

interface IHomeProps {
  path: string;
}

function useViewWidth() {
  const [pcLayout, setWidth] = useState(414 < document.body.clientWidth);

  useEffect(() => {
    window.addEventListener('resize', () => {
      const pcLayout = 414 < document.body.clientWidth;
      setWidth(pcLayout);
    });
  }, []);

  return pcLayout;
}

export default function Home(props: IHomeProps) {
  let curPath = (props.path || '').trim();
  if (!curPath.startsWith('/')) {
    curPath = `/${curPath}`;
  }

  const pcLayout = useViewWidth();

  const dirList = useMemo(() => {
    let abs = '';
    let list = pathToList(curPath);
    abs = resolve(...list);
    console.log({list, abs, curPath})

    if (!pcLayout) {
      const dir = list[list.length - 1];
      console.log(abs, dir, list);

      return (
        <Dir abs={abs} value={dir} unfolded={''} />
      )
    }

    return <ol className="every-lev">
    {
      list.map((dir, idx) => {
        // abs += `${1 < idx ? '/' : ''}${dir}`;
        abs = resolve(abs, dir);
        const unfolded = list[idx + 1] || '';
        return (
          <li className="dir-detail" key={dir}>
            <Dir abs={abs} value={dir} unfolded={unfolded} />
          </li>
        );
      }).reverse()
    }
    </ol>
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [curPath]);

  return (
    <div className={className(['home', pcLayout ? 'pc' : 'mobile'])}>
      <Toolbar value={curPath} />
      <Store>
        <div className="dir-wrapper">
          { dirList }
          { pcLayout && <Meta /> }
        </div>
      </Store>
    </div>
  );
}
