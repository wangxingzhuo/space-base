import OrderBtn from './OrderBtn';
import LoopBtn from './LoopBtn';
import Progress from '../progress';
import { useCallback } from 'react';
import { EnPlayStat } from '@watsonserve/audio-player';
import { EnLoop } from '@/entities';
import IconPlay from '@/assets/icons/play.svg?react';
import IconPause from '@/assets/icons/pause.svg?react';
import IconLast from '@/assets/icons/last.svg?react';
import IconNext from '@/assets/icons/next.svg?react';
import { useStore } from '@/store/music';

export interface IPlayControllorProps {
  random: boolean;
  loop: EnLoop;
  stat: {
    totalTime: number;
    costTime: number;
    playStat: EnPlayStat;
  };
  play: () => void;
  pause: () => void;
  seek: (ms: number) => void;
  onLast: () => void;
  onNext: () => void;
  onOrderChange: (random: boolean) => void;
  onLoopChange: (loop: EnLoop) => void;
}

// const dictPlayStat = {
//   [EnPlayStat.RUNNING]: 'play',
//   [EnPlayStat.PAUSE]: 'pause',
//   [EnPlayStat.STOP]: 'stop',
// };

export default function PlayControllor() {
  const {
    playStat, costTime, totalTime, isRandom, loop, currIdx,
    play, pause, seek, setOrder, setLoop, setCurrent,
  } = useStore();

  const handleStatChange = useCallback(() => {
    playStat === EnPlayStat.RUNNING ? pause() : play();
  }, [playStat]);

  return (
    <div className="play-controllor">
      <Progress totalTime={totalTime || 0} costTime={costTime || 0} onSeek={seek} />
      <footer className="ctrl-footer">
        <OrderBtn className="order" random={isRandom} onChange={setOrder} />
        <div className="ctrl">
          <button className="last" onClick={() => setCurrent(currIdx - 1)}>
            <IconLast className="icon" />
          </button>
          <button className="play-pause" onClick={handleStatChange}>
            { playStat === EnPlayStat.RUNNING ? <IconPause className="icon" /> : <IconPlay className="icon" /> }
          </button>
          <button className="next" onClick={() => setCurrent(currIdx + 1)}>
            <IconNext className="icon" />
          </button>
        </div>
        <LoopBtn className="loop-btn" loop={loop} onChange={setLoop} />
      </footer>
    </div>
  );
}
