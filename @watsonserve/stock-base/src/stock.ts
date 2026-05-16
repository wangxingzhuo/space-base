export enum EnMarket {
  FX = 'FX',
  JPX = 'JPX',
  CHN = 'CHN',
  HKEX = 'HKEX',
  SGX = 'SGX',
  LSE = 'LSE',
  USA = 'USA',
}

export enum EnCurrency {
  SGD = 'SGD',
  USD = 'USD',
  HKD = 'HKD',
  CNY = 'CNY',
}

export interface IFx {
  stamp: number;
  [EnCurrency.SGD]: number;
  [EnCurrency.HKD]: number;
  [EnCurrency.CNY]: number;
}

export interface IStockBase {
  c: number;
  o?: number;
  h?: number;
  l?: number;
  v?: number;
}

export interface IStockNum {
  boll_u: number;
  boll_l: number;
  ma_5: number;
  ma_20: number;
  ma_60: number;
  ma_250: number;
}

export interface IStock extends IStockBase, Partial<IStockNum> {
  nc: string;
  n: string;
}

export interface IStockPoint {
  market: string;
  timestamp: number;
  st: IStock;
}

export interface IDividend {
  currency: string;
  amount?: number;
  ratio?: number;
  annc: Date;
  ex: Date;
  paid: Date;
  announcement_URL?: string;
}


export interface IDiv {
  nc: string;
  annc: number;
  ex: number;
  paid: number;
  currency: string;
  amount: number;
}

export interface IHoliday {
  market: string;
  title: string;
  start: number;
  end: number;
}

export class Stock {
  public nc: string;
  public name: string;
  public currency: EnCurrency;
  public o: number = 0;
  public c: number = 0;
  public h: number = 0;
  public l: number = 0;
  public v: number = 0;

  constructor(code: string, name = '', currency = EnCurrency.USD) {
    this.nc = code;
    this.name = name;
    this.currency = currency;
  }

  setInfo(name: string, close: number, open = 0, height = 0, low = 0, vol = 0) {
    this.name = name;
    this.o = open;
    this.c = close;
    this.h = height;
    this.l = low;
    this.v = vol;
  }
}
