import { useRef, useCallback } from 'react';
import Equalizer from '@/components/equalizer';
import { useFrequencies } from '@/hook/frequencies';
import { useStore } from '@/store/music';

export function EqHoc() {
  const { frequencies, setEqGain } = useFrequencies();
  return (
    <Equalizer max={8} frequencies={frequencies} onChange={setEqGain} />
  );
}

export function AddrBar() {
  const { search } = useStore();
  const inputer = useRef<HTMLInputElement>(null);

  const handleInput = useCallback((ev: React.FormEvent<HTMLFormElement>) => {
    ev.stopPropagation();
    ev.preventDefault();

    const key = inputer.current?.value || '';
    search(key);
  }, []);

  return (
    <form className="addr-form" onSubmit={handleInput}>
      <input
        className="addr-input"
        autoFocus
        placeholder="Enter server address"
        ref={inputer}
      />
    </form>
  );
}
