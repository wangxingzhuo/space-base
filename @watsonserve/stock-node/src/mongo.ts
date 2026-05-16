import { connect, Schema, model } from 'mongoose';
import { MONGO_ADDR } from './entities.js';
import { IDiv, IHoliday } from '@watsonserve/stock-base';

export function initMongo() {
  return connect(MONGO_ADDR);
}

const dividendSchema = new Schema({
  nc: String,
  currency: String,
  annc: Number,
  ex: Number,
  paid: Number,
  amount: Number,
});

dividendSchema.index({ nc: 1, ex: -1, paid: -1 }, { unique: true });

const holidaySchema = new Schema({
  market: String,
  title: String,
  start: Number,
  end: Number,
});

holidaySchema.index({ market: 1, title: 1, start: 1, end: 1 }, { unique: true });

export const Dividend = model<IDiv>('dividends', dividendSchema);

export const Holiday = model<IHoliday>('holidays', holidaySchema);
