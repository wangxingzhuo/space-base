import { useCallback, FunctionComponent, SVGProps } from 'react';
import IconNormal from '@/assets/icons/list.svg?react';
import IconOnly from '@/assets/icons/only.svg?react';
import IconLoop from '@/assets/icons/loop.svg?react';
import { EnLoop } from '@/entities';

const orderNameDict = new Map<EnLoop, undefined | FunctionComponent<SVGProps<SVGSVGElement>>>([
  [EnLoop.NORMAL, IconNormal],
  [EnLoop.LIST, IconLoop],
  [EnLoop.ONE, IconOnly]
]);

const loopList = [EnLoop.NORMAL, EnLoop.LIST, EnLoop.ONE];

export interface ILoopBtnProps {
  className: string;
  loop: EnLoop;
  onChange: (loop: EnLoop) => void;
}

export default function LoopBtn(props: ILoopBtnProps) {
  const { className, loop, onChange } = props;

  const handleChange = useCallback(() => {
    onChange(loopList[(loop + 1) % loopList.length]);
  }, [loop, onChange]);

  const Icon = orderNameDict.get(loop);

  return (
    <button className={className} onClick={handleChange}>
      { Icon ? <Icon className="icon" /> : '' }
    </button>
  );
}
