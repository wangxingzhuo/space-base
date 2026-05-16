import { EnCurrency } from '@watsonserve/stock-base';

export interface IDBConf {
  origin: string;
  org: string;
  bucket: string;
  token: string;
}

export interface IFxData {
  time: number;
  [EnCurrency.SGD]: number;
  [EnCurrency.HKD]: number;
  [EnCurrency.CNY]: number;
}

export interface IStData {
  time: number;
  c: number;
  v: number;
}

export interface IPriceQuery {
  date: number; // 17xxxxx
  ncs: string[]; // ['C.US', 'BRK.B.US']
}

export const dbConf = {
  origin: 'http://172.24.0.16:8086',
  org: 'my-org',
  bucket: 'my-bucket',
  token: 'ryX1K8Y3ND_AwgoEX6Wc0rqhJ1zJ5FY62bhZvfDylZJfr7sgfP51BbsozQ1Mdt6IVlIM-R3m9ZdplnYmvGGICQ==',
};

export const MONGO_ADDR = 'mongodb://172.24.0.4:27017/stock';

export const psqlConf = {
  host: '172.24.0.2',
  db: 'stocks',
  user: 'stocker',
  password: '7a12ea2ff1c341228cc65371d7b1fb58',
};
