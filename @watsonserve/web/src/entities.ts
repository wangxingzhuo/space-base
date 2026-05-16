import { EnPlayStat } from '@watsonserve/audio-player';

export interface IAudioRes {
  title: string;
  url: string;
}

// export interface IPlayer {
//   costTime: number;
//   totalTime: number;
//   stat: EnPlayStat;
//   stop(): void;
//   play(): void;
//   pause(): void;
//   seek(ms: number): void;
// }

export interface IEq {
  frequency: number;
  gain: number;
}

export enum EnLoop {
  NORMAL,
  LIST,
  ONE
}
export enum EnFileNodeType {
  DIR = 1,
  FILE = 2,
  S_LINK = 4,
  SOCKET = 8,
  PIPE = 16,
}

export enum EnMimeType {
  NULL,
  OCTET,
  PLAIN,
  VIDEO,
  AUDIO,
  IMAGE,
}

export interface IFileNode {
  name: string;
  size: number;
  path: string;
  nodeType: EnFileNodeType;
  contentType: EnMimeType;
  createTime: number;
  updateTime: number;
  accessTime: number;
  mode: number;
  preview?: string;
}

export interface ITreeNode extends IFileNode {
  children?: IFileNode[];
}

export interface IResponse<T> {
  msg: string;
  stat: number;
  data: T;
}

export interface AudioReqEvent {
  getStat: undefined;
  play: undefined;
  frequencies: undefined;
  load: number;
  seek: Record<'seek' | 'now', number>;
  setEq: Record<'f' | 'dB', number>;
}

export interface AudioRespEvent {
  getStat: { stat: EnPlayStat; loop: EnLoop; isRandom: boolean; totalTime: number; costTime: number };
  play: { totalTime: number };
  frequencies: [number, number][];
  load: Error;
  seek: undefined;
  setEq: Error;
}

export type AudioInvoke = keyof AudioReqEvent | keyof AudioRespEvent;

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
