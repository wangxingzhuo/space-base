export enum EnTType {
  BUY=1,
  SELL=2,
  XR=4,
  XD=3,
  BALANCE=-1
}

export interface ITade {
  nc: string;
  cost: number;
  count: number;
  currency: 'USD'|'SGD'|'HKD';
  ttype: number;
  ttime: number;
}

export interface IRedirect {
  location: string;
}

export interface IUsr {
  name: string;
  avatar: string;
}

export interface IViewData {
  nc: string;
  percent: number;
  glStyl: string;
  unrealizedGainRate: number;
  currency: string;
  count: number;
  dividendRate: number;
  price: number;
  cost: number;
}

export interface ISumInfo {
  totalDivTTM: number;
  totalCost: number;
  totalAsset: number;
  twrr: number;
  appreciation: number;
  allDivid: number;
  twrrForYear: number;
  xirr: number;
  srrForYear: number;
}

export interface IState {
  usr: IUsr;
  currency: string;
  dateSeg: string;
  handles: IViewData[];
  comingDivs: never[];
  sumInfo: Partial<ISumInfo>;
}

export interface IDiv {
  ex: number;
  paid: number;
  currency: string;
  amount: number;
}

export interface IDividend {
  date: number;
  fxs: Record<string, number>;
  amount: number;
}

export interface IHandleStock {
  nc: string;
  currency: string;
  price: number;
  count: number;
  cost: number;
  recognizedGain: number;
  openingMarketValue: number;
  dividend: IDiv[];
}

export interface IGap {
  date: number;
  fxs: Record<string, number>;
  gap: {
    prev_close: number;
    next_open: number;
  }
}

export interface INetCash {
  t: number;
  fxs: Record<string, number>;
  net_cash: number;
}


export interface IROR {
  twr: IGap[];
  xir: INetCash[];
  divs: IDividend[];
}

export class HandleStock implements IHandleStock {
  nc = '';
  currency = 'USD';
  price = 0;
  count = 0;
  cost = 0;
  recognizedGain = 0;
  openingMarketValue = 0;
  fx: number;
  dividend: IDiv[] = [];

  constructor(st: IHandleStock, fx = 1) {
    this.nc = st.nc;
    this.currency = st.currency;
    this.price = st.price;
    this.count = st.count;
    this.cost = st.cost;
    this.openingMarketValue = st.openingMarketValue;
    this.dividend = st.dividend;
    this.fx = fx;
  }

  get marketValue() {
    return this.price * this.count;
  }

  get periodGainRate() {
    return (this.marketValue - this.openingMarketValue) * 100 / this.openingMarketValue;
  }

  get unrealizedGain() {
    return this.marketValue - this.cost;
  }

  get unrealizedGainRate() {
    return this.unrealizedGain * 100 / this.cost;
  }

  get usdMarketValue() {
    return this.marketValue / this.fx;
  }

  get usdDividendTTM() {
    return this.dividendTTM / this.fx;
  }

  get usdCost() {
    return this.cost / this.fx;
  }

  get dividendTTM() {
    const divd =this.dividend.reduce((sum, dd) => {
      let { amount, currency } = dd;
      if (this.currency !== currency) {
        amount *= this.fx;
      }
      return sum + amount;
    }, 0);
    return divd * this.count;
  }

  get dividendRate() {
    return this.dividendTTM * 100 / this.cost;
  }
}
