import { useReducer, useContext, createContext, useMemo, useRef, useEffect } from 'react';
import { IAudioRes, EnLoop } from '@/entities';
import { EnPlayStat } from '@watsonserve/audio-player';
import Audioface, { IListChangedEvent } from '@/helpers/audioface';
import { sleep } from '@watsonserve/utils';

interface IState {
  list: IAudioRes[];
  currIdx: number;
  isRandom: boolean;
  loop: EnLoop;
  playStat: EnPlayStat;
  totalTime: number;
  costTime: number;
  cachedSize: number;
  lrc: string;
}

interface IStore extends IState {
  play: () => void;
  pause: () => void;
  seek: (ms: number) => void;
  setCurrent: (idx: number) => Promise<void>;
  setOrder: (isRandom: boolean) => void;
  setLoop: (loop: EnLoop) => void;
  search: (key: string) => void;
}

const Storer = createContext<IStore>({
  list: [],
  currIdx: -1,
  isRandom: false,
  loop: EnLoop.NORMAL,
  playStat: EnPlayStat.STOP,
  lrc: '',
  totalTime: 0,
  costTime: 0,
  cachedSize: 0,
  play: () => undefined,
  pause: () => undefined,
  seek: (ms: number) => undefined,
  setCurrent: (idx: number) => Promise.reject(new Error('not init')),
  setOrder: (isRandom: boolean) => undefined,
  setLoop: (loop: EnLoop) => undefined,
  search: (key: string) => undefined,
});

export function Store(props: any) {
  const { children } = props;

  const player = useRef<Audioface>();
  const [state, setState] = useReducer((foo: IState, bar: Partial<IState>) => Object.assign({}, foo, bar) as IState, {
    list: [],
    currIdx: -1,
    isRandom: false,
    loop: EnLoop.NORMAL,
    playStat: EnPlayStat.STOP,
    lrc: '',
    totalTime: 0,
    costTime: 0,
    cachedSize: 0,
  });

  const play = () => player.current?.play();
  // 暂停
  const pause = () => {
    player.current?.pause();
    setState({ playStat: EnPlayStat.PAUSE });
  };
  // 重定位
  const seek = (ms: number) => player.current?.seek(ms);

  const setLoop = (loop: EnLoop) => {
    player.current?.setLoop(loop);
    setState({ loop });
  };
  const setOrder = (isRandom: boolean) => {
    player.current?.setRandom(isRandom);
    setState({ isRandom });
  };
  const setCurrent = async (idx: number): Promise<void> => player.current?.loadIndex(idx).then(() => setState({ currIdx: idx }));

  const search = (key: string) => player.current?.loadList(key);

  const onListChanged = ({ offset, list }: IListChangedEvent) => setState({ list, currIdx: offset });
  const onCosted = (costTime: number) => setState({ costTime });
  const onStateChange = (playStat: EnPlayStat) => setState({ playStat });
  const onEnd = () => onStateChange(EnPlayStat.STOP);
  const onPlayed = (resp: any) => setState({ totalTime: resp.totalTime, playStat: EnPlayStat.RUNNING });

  const bind = () => {
    const p = player.current;
    if (!p) return;

    p.on('ended', onEnd);
    p.on('played', onPlayed);
    p.on('costed', onCosted);
    p.on('stateChange', onStateChange);
    p.on('listChanged', onListChanged);
  };

  const unbind = () => {
    const p = player.current;
    if (!p) return;

    p.off('ended', onEnd);
    p.off('played', onPlayed);
    p.off('costed', onCosted);
    p.off('stateChange', onStateChange);
    p.off('listChanged', onListChanged);
    player.current = undefined;
  };

  const init = async () => {
    try {
      // load channel
      const p = await Audioface.getInstance();
      player.current = p;
      bind();

      await sleep(200);
      const { isRandom, stat: playStat, loop, costTime, totalTime } = await p.init();
      setState({
        isRandom,
        loop,
        totalTime,
        costTime,
        cachedSize: 0,
        playStat,
        lrc: '',
      });
    } catch (err) {
      console.error('MusicStore.init failed', err);
    }
  };

  const Provider = Storer.Provider;

  useEffect(() => {
    init();
    return unbind;
  }, []);

  return useMemo(() => (
    <Provider value={{
      ...state,
      play,
      pause,
      seek,
      setLoop,
      setOrder,
      setCurrent,
      search
    }}>
        { children }
      </Provider>
    ),
    [children, state]
  );
}

export function useStore() {
  return useContext(Storer);
}
