export const _PRELOAD = 2;
export const _AUTOPLAY = 4;

export enum EnLoadMode {
  UNKNOW = 0,
  STOP_AND_LOAD = 1,
  ONLY_PRELOAD = _PRELOAD,
  STOP_AND_PLAY = _AUTOPLAY,
  LOAD_NEXT = _PRELOAD | _AUTOPLAY
}

export const HAVE_ENOUGH_DATA = 4;

export enum EnPlayStat {
  STOP,
  LOADING,
  RUNNING,
  PAUSE
}

export type Wrapper<T> = { __proto__: T } & Readonly<T>;

export function genWrapper<T>(p: T): Wrapper<T> {
  const foo: any = {};
  foo.__proto__ = p;
  return foo;
}
