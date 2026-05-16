import { type ReactNode, type UIEvent, useRef } from 'react';
import './style.css';

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
    <div className="some-modal" ref={selfRef} onClick={hanldeClick}>
      {props.children}
    </div>
  );
}
