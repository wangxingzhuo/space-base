import { EnLogLevel, EnMarket, log, StockLoader } from '@watsonserve/stock-base';
import { getOptions, printHelp } from './helper.js';
import { loadAMarket, loadAStock, loadFxHistory, loadHolidays } from './actions.js';
import { initMongo } from './mongo.js';

async function main(opts: Map<string, string>, payload: string) {
  const isDebug = opts.has('debug');

  if (!payload || opts.has('help')) return printHelp();

  if (isDebug) {
    log.level = EnLogLevel.DEBUG;
  }

  const stockLoader = new StockLoader();
  if ('holiday' === payload) {
    await initMongo();
    await loadHolidays(stockLoader);
    process.exit(0);
  }

  await StockLoader.init(isDebug);
  await stockLoader.mount();
  try {
    if ('fx-history' === payload) {
      await loadFxHistory(stockLoader);
    } else {
      await (EnMarket[payload as EnMarket]
        ? loadAMarket(stockLoader, payload as EnMarket, isDebug)
        : loadAStock(stockLoader, payload, isDebug)
      );
    }
  } catch (err) {
    log.error(err as Error);
  }
  !isDebug && stockLoader.destroy();
}

main(...getOptions([['d', 'debug'], ['h', 'help']]));
