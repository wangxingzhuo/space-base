interface IRes {
  path: string;
}

export enum EnLoop {
  NORMAL,
  LIST,
  ONE
}

export default class ResMgr {
  private _listName = '';
  private _normalList: IRes[] = [];
  private _list: IRes[] = [];
  private _offset = 0;
  private _random = false;
  private _loop = EnLoop.NORMAL;
  private _loader: (name: string) => Promise<IRes[]>;

  constructor(loader: (name: string) => Promise<IRes[]>) {
    this._loader = loader;
  }

  get listName() {
    return this._listName;
  }

  get list() {
    return [...this._list];
  }

  get isRandom() {
    return this._random;
  }

  get offset() {
    return this._offset;
  }

  get loop() {
    return this._loop;
  }

  set loop(l: EnLoop) {
    this._loop = l;
  }

  getRes(off: number) {
    const res = this._list[off];
    if (!res) return '';

    this._offset = off;
    return res.path;
  }

  getNextRes(): [string, number] {
    const len = this._list?.length || 1;

    const nextOff = (this._offset + len + 1) % len;
    return [(EnLoop.NORMAL !== this._loop || nextOff) && this._list[nextOff]?.path || '', nextOff];
  }

  async setList(name: string) {
    const data = await this._loader(name);
    this._listName = name;
    this._normalList = data.slice(0);
    this._offset = 0;
    this._list = !this._random ? data : data.sort(() => Math.sign(Math.random() - 0.5));
  }

  resetRandom(rand = false) {
    const { path: _path } = this._list[this._offset];

    this._list = !rand
      ? this._normalList.slice(0)
      : this._list.sort(() => Math.sign(Math.random() - 0.5));

    this._random = rand;
    this._offset = this._list.findIndex(item => item.path === _path);
  }
}
