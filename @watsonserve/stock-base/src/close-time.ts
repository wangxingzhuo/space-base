import { EnMarket } from './stock.js';

export const A_MIN_MS = 60000;
export const A_HOUR_MS = 3600000;
export const A_DAY_MS = 86400000;
export const A_DAY_S = 86400;

// 夏令时：3月最后一个周日凌晨1AM开始夏令时，10月最后一个周日凌晨2AM结束夏令时
function isDST_ByUK(timestamp: number): boolean {
  const date = new Date(timestamp);
  const year = date.getUTCFullYear();

  // 英国夏令时：3月最后一个周日开始，10月最后一个周日结束
  const march = new Date(Date.UTC(year, 2, 31));
  const october = new Date(Date.UTC(year, 9, 31));

  // 夏令时开始和结束的日期
  const dstStart = new Date(Date.UTC(year, 2, 31 - march.getUTCDay(), 1)); // 3月最后一个周日凌晨1点
  const dstEnd = new Date(Date.UTC(year, 9, 31 - october.getUTCDay(), 1)); // 10月最后一个周日凌晨2点 = UTC时间凌晨1点

  return timestamp >= dstStart.getTime() && timestamp < dstEnd.getTime();
}

/**
 * 判断给定时间戳（毫秒）是否处于美国东部夏令时（EDT）
 * 夏令时：3月第二个周日 02:00 开始（时钟拨快至 03:00），11月第一个周日 02:00 结束（时钟拨回至 01:00）
 */
function isDST_ByEST(timestamp: number): boolean {
  const date = new Date(timestamp);
  const year = date.getUTCFullYear();

  // 计算3月1日是星期几（UTC）
  const march = new Date(Date.UTC(year, 2, 1)); // UTC 时间：3月1日 00:00
  const november = new Date(Date.UTC(year, 10, 1));

  const marchDay = (7 - march.getUTCDay()) % 7 + 8; // 第二个周日（1~7是第一个周日，8~14是第二个）
  const novemberDay = (7 - november.getUTCDay()) % 7 + 1; // 第一个周日

  const dstStart = Date.UTC(year, 2, marchDay, 7); // UTC 时间 7点
  const dstEnd = Date.UTC(year, 10, novemberDay, 6); // UTC 时间 6点

  // 处于夏令时：在开始之后，结束之前
  return timestamp >= dstStart && timestamp < dstEnd;
}

/**
 * 获取市场 正式开盘时区偏移，单位分钟
 * @param dst 是否夏令时
 * @returns 分钟数
 */
function getOpenTimeByUTC(market: EnMarket, time: number): number {
  switch (market) {
    case EnMarket.JPX:
      return 0; // 9:00
    case EnMarket.CHN:
      return 90; // 9:30
    case EnMarket.HKEX:
      return 90; // 9:30
    case EnMarket.SGX:
      return 60; // 9:00
    case EnMarket.LSE:
      return isDST_ByUK(time) ? 420 : 480; // 7:00 or 8:00
    case EnMarket.USA:
      return isDST_ByEST(time) ? 810 : 870; // 13:30 or 14:30
    default:
  }
  throw new Error(`Unsupported market: ${market}`);
}

/**
 * 获取市场时区偏移，单位分钟
 * @param dst 是否夏令时
 * @returns 分钟数
 */
function getCloseTimeByUTC(market: EnMarket, time: number): number {
  switch (market) {
    case EnMarket.JPX:
      return 390; // 6:30
    case EnMarket.CHN:
      return 420; // 7:00
    case EnMarket.HKEX:
      return 490; // 8:10
    case EnMarket.SGX:
      return 556; // 9:16
    case EnMarket.LSE:
      return isDST_ByUK(time) ? 930 : 990; // 15:30 or 16:30
    case EnMarket.USA:
      return isDST_ByEST(time) ? 1200 : 1260; // 20:00 or 21:00
    case EnMarket.FX:
      return isDST_ByEST(time) ? 1260 : 1320; // 21:00 or 22:00
    default:
  }
  throw new Error(`Unsupported market: ${market}`);
}

/**
 * 获取市场收盘时间戳，单位秒
 * @param market 市场
 * @param time 可选时间戳（毫秒），默认为当前时间，用于确定日期和夏令时状态
 * @returns 市场收盘秒级时间戳
 */
export function getMarketCloseTime(market: EnMarket, time = Date.now()): number {
  const d = new Date(time); // 确保 time 是有效的时间戳
  switch (d.getUTCDay()) {
    case 6:
      time -= 86400000;
      break;
    case 0:
      time -= 172800000;
      break;
    default:
  }
  const dayStart = (~~(time / A_DAY_MS)) * A_DAY_MS;
  const closeTimestamp = dayStart + getCloseTimeByUTC(market, time) * A_MIN_MS;
  let openTimestamp = 0;
  if (EnMarket.FX !== market) {
    openTimestamp = dayStart + getOpenTimeByUTC(market, time) * A_MIN_MS;
  }

  // after market open time, return close time of the day
  if (openTimestamp < time) return ~~(closeTimestamp / 1000);
  // return close time of the previous day
  return getMarketCloseTime(market, closeTimestamp - A_DAY_MS);
}
