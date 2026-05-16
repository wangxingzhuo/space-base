import { type ReactNode, type UIEvent, useRef } from 'react';
import classes from './style.module.styl';

interface IProps {
  children?: ReactNode;
  onClose?: () => void;
}

export default function(props: IProps) {
  const selfRef = useRef<HTMLDivElement>(null);

  const hanldeClick = (ev: UIEvent) => {
    ev.stopPropagation();
    ev.preventDefault();
    ev.target === selfRef.current && props.onClose?.();
  };

  return (
    <div className={classes.modal} ref={selfRef} onClick={hanldeClick}>
      {props.children}
    </div>
  );
}
