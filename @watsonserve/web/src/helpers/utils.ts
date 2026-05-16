import { useMemo, useRef } from 'react';

interface IClickHandler {
  onClick: (ev: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => void;
  onDoubleClick: (ev: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => void;
}

export function useNClick(onClick: (count: number, ev?: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => void, deps: any[] = []): IClickHandler {
    const timer = useRef(NaN);
  
    return useMemo(() => {
      return {
        onClick: (ev: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
          timer.current = window.setTimeout(() => {
            clearTimeout(timer.current);
            timer.current = NaN;
            onClick(0, ev);
          }, 200);
        },
        onDoubleClick: (ev: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
          clearTimeout(timer.current);
          timer.current = NaN;
          onClick(1, ev);
        }
      };
    }, [timer, onClick, ...deps]);
  }
  