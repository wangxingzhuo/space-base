import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './equalizer.styl';
import { IEq } from '@/entities';
import { loadEq, saveEq } from '@/api';

interface ITrackProps extends IEq {
  max: number;
  onChange: (val: number) => void;
}

function Track(props: ITrackProps) {
  const track = useRef<HTMLDivElement | null>(null);
  const { frequency, gain, max, onChange } = props;

  const [clientHeight, setClientHeight] = useState(0);
  const seek = useMemo(() => -gain * clientHeight / (max << 1), [clientHeight, gain, max]);

  useEffect(() => {
    setClientHeight(track.current?.clientHeight || 0);
  }, []);

  const handleClick = useCallback((ev: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const offsetTop = track.current?.offsetTop || 0;
    const oY = offsetTop + clientHeight / 2;
    console.log(`(${oY} - ${ev.clientY}) * ${max} / ${clientHeight}`);
    const seekVal = Math.round(( oY - ev.clientY ) * 4 * max / clientHeight) / 2;
    onChange(seekVal);
  }, [clientHeight, max, onChange]);

  return useMemo(() => {
    const name = frequency >= 1000 ? `${frequency / 1000}k` : frequency + '';

    return (
      <div className="track-wrapper">
        <span className="track-vol">{gain}</span>
        <div className="track" ref={track} onClick={handleClick}>
          <div className="track__inner">
            <span className="current" style={{ transform: `translateY(${seek}px)` }}></span>
          </div>
        </div>
        <span className="track-name">{`${name}Hz`}</span>
      </div>
    )
  }, [frequency, gain, seek, handleClick]);
}

interface IProgressProps {
  frequencies: [number, number][];
  max: number;
  onChange: (frequency: number, gain: number) => void;
}

export default function Equalizer(props: IProgressProps) {
  const { frequencies, max, onChange } = props;

  return (
    <div className="equalizer">
      {
        frequencies.map(([f, dB]) =>
          <Track
            key={f}
            frequency={f}
            gain={dB}
            max={max}
            onChange={nxtVal => onChange(f, nxtVal)}
          />
        )
      }
    </div>
  );
}
