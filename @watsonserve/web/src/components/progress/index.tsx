import { useMemo, useRef } from 'react';
import './progress.styl';

function formatTime(time = 0) {
  time = ~~(time / 1000);
  const secs = time % 60;
  time = (time - secs) / 60;
  const mins = time % 60;
  const hours = (time - mins) / 60;
  const ret = `${mins}:${secs < 10 ? '0' : ''}${secs.toFixed(0)}`;
  return (!hours ? '' : `${hours}:${mins < 10 ? '0' : ''}`) + ret;
}

interface IProgressProps {
  totalTime: number;
  costTime: number;
  loaded?: number;
  onSeek: (p: number) => void;
}

export default function Progress(props: IProgressProps) {
  const track = useRef<HTMLDivElement | null>(null);
  const { totalTime, loaded = 0, costTime, onSeek } = props;
  const played = (costTime / totalTime * 100) || 0;
  const seek = useMemo(() => played, [played]);

  const handleClick = (ev: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const clientLeft = track.current?.offsetLeft || 0;
    const seekVal = Math.max(0, (ev.clientX - clientLeft) / track.current!.clientWidth);
    onSeek(seekVal * totalTime);
  };

  return (
    <div className="progress">
      <div className="track" ref={track} onClick={handleClick}>
        <div className="pointer loaded" style={{ width: `${loaded}%` }}></div>
        <div className="pointer played" style={{ width: `${seek}%` }}></div>
        <div className="track__inner">
          <span className="current" style={{ left: `${seek}%` }}></span>
        </div>
      </div>
      <div className="info">
        <span className="done">{ formatTime(costTime) }</span>
        <span className="total">{ formatTime(totalTime) }</span>
      </div>
    </div>
  );
}
