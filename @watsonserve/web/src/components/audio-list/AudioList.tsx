import './audio-list.styl';
import { useCallback, useMemo, useState, useRef } from 'react';
import { IAudioRes } from '@/entities';
import { useStore } from '@/store/music';

export interface IAudioListProps {
  value: IAudioRes[];
  active: number;
  onSelect: (idx: number) => void;
}

function AudioListItem(props: any) {
  const { active, name, onDoubleClick } = props;
  const handleClick = useRef<(() => void) | null>(null);
  handleClick.current = useCallback(onDoubleClick, [onDoubleClick]);

  return useMemo(() => (
    <li className={`audio-list__item${active ? ' active' : ''}`}>
      <span
        className="audio-list__item__content"
        title={name}
        onDoubleClick={() => handleClick.current && handleClick.current()}
      >{ name }</span>
    </li>
  ), [active, name]);
}

export default function AudioList() {
  const { currIdx, list, setCurrent } = useStore();
  const [ showList, setShowList ] = useState(false);

  const handleSelect = useCallback((idx: number) => {
    idx = (idx + list.length) % list.length;
    idx !== currIdx && setCurrent(idx);
  }, [currIdx, list.length]);

  const compList = useMemo(() => list.map((item, idx) => (
    <AudioListItem active={currIdx === idx} key={idx} name={item.title} onDoubleClick={() => handleSelect(idx)} />
  )), [list, currIdx]);

  return (
    <aside className={['panel', showList ? 'show' : ''].join(' ')}>
      <div className="toggler" onClick={() => setShowList(!showList)}></div>
      <ul className="audio-list">{ compList }</ul>
    </aside>
  );
}
