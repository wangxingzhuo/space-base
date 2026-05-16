import { EnPlayStat } from '@watsonserve/audio-player';
import { useRef, useState, useMemo, useEffect } from 'react';
import Audioface from '@/helpers/audioface';
import { EnLoop } from '@/entities';
import { setLoop } from '@/api';

// function useOnce(): [(cb: () => void) => void, () => void, () => void] {
//   const callRef = useRef<any>(null);
//   const done = useRef<boolean>(false);

//   return useMemo(() => [
//     (cb: () => void) => (callRef.current = cb),
//     () => {
//       if (done.current) return;
//       callRef.current && setTimeout(callRef.current, 0);
//       done.current = true;
//     },
//     () => (done.current = false)
//   ], []);
// }

// function useOscilloscope () {
//   const canvasRef = useRef<HTMLCanvasElement>(null);
//   // 当canvas准备好了，初始化示波器
//   const oscilloscope = useMemo(() => {
//     if (!canvasRef.current) return null;

//     // console.log('初始化示波器');
//     const oscilloscope = AudioGenerater.getOscilloscope(canvasRef.current, {
//       fftSize: 32,
//       smoothingTimeConstant: 0
//     });
//     // 示波器链接播放设备
//     oscilloscope.connect(AudioGenerater.destination);
//     return oscilloscope;
//   }, [canvasRef]);

//   // 播放器链接到示波器
//   const bindProcess = useCallback((_player: Player) => {
//     if (!oscilloscope || !_player) return;
//     _player.connect(oscilloscope);
//     oscilloscope.draw();
//   }, [oscilloscope]);
// }

export function useFrequencies() {
  const [frequencies, setFrequencies] = useState<[number, number][]>([]);
  const player = useRef<Audioface>();

  // 加载音频
  useEffect(() => {
    // load channel
    Audioface.getInstance().then(async p => {
      player.current = p;

      const frequencies = await p.loadFrequencies();
      setFrequencies(frequencies);
    }, () => {});

    return () => {
      player.current = undefined;
    };
  }, []);

  return useMemo(() => ({
    frequencies,
    setEqGain: (f: number, dB: number) => {
      player.current?.setGain(f, dB);
      const m = new Map(frequencies)
      m.set(f, dB);
      setFrequencies([...m]);
    },
  }), [frequencies]);
}
