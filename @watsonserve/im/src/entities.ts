export enum EnMType {
  SYS,
  SEND,
  RECV,
}

export enum EnContentType {
  TEXT,
  MARKDOWN,
  IMAGE,
  AUDIO,
  VIDEO,
  LINK,
}

export enum EnSendState {
  SENDING = 0,
  FAILED = 1,
  SUCCESS = 2,
  REJECT = 3,
  READED = 6,

}

export interface IMsg {
  localId: string;
  msgId: string;
  timestamp: number;
  msgType: EnMType;
  conType: EnContentType;
  content: string;
  avatar: string;
  nickName: string;
  sendStat: EnSendState;
}
