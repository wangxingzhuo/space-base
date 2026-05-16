import { useContext, createContext, useMemo, type ReactNode, useEffect } from 'react';
import { IState, IUsr } from '@/entities';
import { useData } from './helper';

interface IStore {
  state: Partial<IState> & { usr: IUsr };
  initial: () => Promise<void>;
  changeGain: (tSeg: string, currency: string) => Promise<void>;
}

const Storer = createContext<IStore>({
  state: {} as any,
  initial: () => Promise.reject(),
  changeGain: () => Promise.reject(),
});

export function Store(props: { children: ReactNode }) {
  const { children } = props;
  const { state, loadUser, initial, changeGain } = useData();

  useEffect(loadUser, []);

  return useMemo(() => (
    <Storer.Provider value={{ state, initial, changeGain }}>
      {!state.usr ? <div>loading...</div> : children }
    </Storer.Provider>
  ), [Storer.Provider, children, state, initial, changeGain]);
}

export function useStore() {
  return useContext(Storer);
}
