import { useCallback } from 'react';
import IconRandom from '@/assets/icons/random.svg?react';

export interface IOrderBtnProps {
  className: string;
  random: boolean;
  onChange: (random: boolean) => void;
}

export default function OrderBtn(props: IOrderBtnProps) {
  const { random, onChange } = props;

  const changeOrder = useCallback(() => onChange(!random), [random, onChange]);

  return (
    <button className={props.className} onClick={changeOrder}>
      <IconRandom className={`icon${ random ? ' active' : '' }`} />
    </button>
  );
}
