import React, { useCallback, useState, useRef } from 'react';
import { pathToList, useJmpPath } from '@/helpers/pathHelper';
import './toolbar.styl';

interface IToolBarProps {
  value: string;
}

interface IInputerProps extends IToolBarProps {
  placeholder?: string;
  onInput: (val: string) => void;
}

/* 可点击地址栏 */
function AddrList(props: IInputerProps) {
  const addrList = pathToList(props.value);

  const handleClick = useCallback((ev: React.MouseEvent<HTMLAnchorElement, MouseEvent>, idx: number) => {
    ev.stopPropagation();
    let ret = '/';
    if (idx) {
      ret += addrList.slice(1, idx + 1).join('/');
    }
    props.onInput(ret);
  }, [props, addrList]);

  const addrClickabled = addrList.map((item, idx) => (
    <li className="address-list__item" key={idx}>
      <a className="address-list__clickabled" onClick={ev => handleClick(ev, idx)}>{ item }</a>
    </li>
  ))
  return (
    <ul className="inline address-list">
      {addrClickabled}
    </ul>
  );
}

function Inputer(props: IInputerProps) {
  const inputer = useRef<HTMLInputElement>(null);

  const handleInput = useCallback((ev: React.FormEvent<HTMLFormElement>) => {
    ev.stopPropagation();
    ev.preventDefault();
    const val = inputer.current?.value || props.value || '';
    props.onInput(val);
  }, [props]);

  const handleBlur = () => {
    props.onInput(props.value || '');
  }

  return (
    <form className="addr-form" onSubmit={handleInput}>
      <input
        className="addr-input"
        autoFocus
        placeholder={props.placeholder}
        defaultValue={props.value}
        ref={inputer}
        onBlur={handleBlur}
      />
    </form>
  );
}

export default function ToolBar(props: IToolBarProps) {
  const jmp = useJmpPath();
  const [inoputMode, setInputMode] = useState(false);
  const Address = inoputMode ? Inputer : AddrList;

  const handleChange = (nxtVal: string) => {
    setInputMode(false);
    jmp(nxtVal);
  }

  return (
    <header className="tool-bar">
      <h1 className="app-name">file-web</h1>
      <div className="btn-group">
        <button className="btn">&lt;</button>
        <button className="btn">&gt;</button>
      </div>
      <div className="address-bar" onClick={() => setInputMode(true)}>
        <Address value={props.value} onInput={handleChange} />
      </div>
    </header>
  );
}
