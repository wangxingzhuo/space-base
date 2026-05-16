import { useCallback, useMemo, useRef, useState } from 'react';
import { className, randomUUID, sleep } from '@watsonserve/utils';
import './style.styl';
import { IMsg, EnMType, EnContentType, EnSendState } from '@/entities';

class Msg implements IMsg {
  localId = '';
  msgId = '';
  timestamp = 0;
  msgType = EnMType.SEND;
  conType = EnContentType.TEXT;
  content = '';
  avatar = '';
  nickName = 'momo';
  sendStat = EnSendState.SENDING;

  constructor(content: string, msgType = EnMType.SEND) {
    this.localId = randomUUID();
    this.timestamp = Date.now();
    this.content = content;
    this.msgType = msgType;
  }
}

interface IMsgProps {
  value: IMsg;
}

const msgTypeMap = {
  [EnMType.RECV]: 'msg-left',
  [EnMType.SEND]: 'msg-right',
  [EnMType.SYS]: 'msg-center',
};

const msgStateMap = {
  [EnSendState.SENDING]: 'msg-sending',
  [EnSendState.FAILED]: 'msg-failed',
} as Record<EnSendState, string>;

function MsgItem(props: IMsgProps) {
  const data = useMemo(() => props.value, [props.value]);
  const msgTypeName = useMemo(() => msgTypeMap[data.msgType], [data.msgType]);
  const msgState = useMemo<string>(() => msgStateMap[data.sendStat] || '', [data.sendStat]);

  return useMemo(() => (
    <li className={msgTypeName}>
      <img className="avatar" src={data.avatar} alt="" />
      <div className="msg-entry">
        <span className="nick-name">{data.nickName}</span>
        <div className="msg-content">{data.content}</div>
      </div>
      <i className={msgState}></i>
    </li>
  ), [data.avatar, data.nickName, data.content, msgTypeName, msgState]);
}

export default function Chat(props: any) {
  const inputRef = useRef<HTMLInputElement>(null);
  const msgLstRef = useRef<HTMLUListElement>(null);
  const [msgLst, setMsgLst] = useState<IMsg[]>([]);

  const handleSend = useCallback(async () => {
    if (!inputRef.current) return;

    const text = inputRef.current.value || '';
    inputRef.current.value = '';
    setMsgLst(msgLst.concat([new Msg(text, ~~(Math.random() * 3))]));
    await sleep(100);
    const elList = msgLstRef.current;
    if (!elList) return;
    elList.scrollTop = elList.scrollHeight;
  }, [msgLst]);

  return useMemo(() => (
    <div className={className(['chat'])}>
      <header className="header"></header>
      <ul className="msg-list" ref={msgLstRef}>
        {msgLst.map(item => (
          <MsgItem value={item} />
        ))}
      </ul>
      <footer className="footer">
        <input type="text" className="msg-editor" ref={inputRef} />
        <button className="msg-send" onClick={handleSend}>send</button>
      </footer>
    </div>
  ), [msgLst, handleSend]);
}
