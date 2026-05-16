import { A_DAY_S } from './close-time.js';
import { DividendLoader } from './dividend-loader.js';
import { IHoliday } from './stock.js';

export * from './close-time.js';
export * from './stock.js';
export * from './log.js';
export * from './helper.js';

function parseUTCDate(str: string) {
  return ~~(Date.UTC(+str.slice(0, 4), +str.slice(4, 6) - 1, +str.slice(6, 8)) / 1000);
}

const HKDict = Object.entries({
  'The first day of January': 'New Year\'s Day',
  'Lunar New Year’s Day': 'Chinese New Year',
  'Hong Kong Special Administrative Region': 'HK SAR',
  '香港公眾假期 -': '',
  'Hong Kong Public Holidays -': '',
  'The day following': ''
});

function simpleTitle(title = '') {
  return HKDict.reduce((str, [k, v]) => str.replace(k, v), title).trim();
}

export class StockLoader extends DividendLoader {
  async loadHolidaysSG(year: number) {
    const resp = await fetch(`https://www.mom.gov.sg/-/media/mom/documents/employment-practices/public-holidays/public-holidays-sg-${year}.ics`);
    const text = (await resp.text()).replace(/\r\n/g, '\n').replace(/\n\n/g, '\n'); // handle line folding

    return text.split('\nEND:VEVENT\nBEGIN:VEVENT\n').reduce<IHoliday[]>((pre, blk) => {
      const ev = new Map(blk.split('\n').map(line => line.split(':', 2) as [string, string]));
      let start = parseUTCDate(ev.get('DTSTART;VALUE=DATE') || '');
      let end = parseUTCDate(ev.get('DTEND;VALUE=DATE') || '');
      if (start === end) {
        end += A_DAY_S;
      }
      // recording to SG calendar, we will move it to next day(Monday, 1) if holiday is Sunday(0)
      if (!new Date(start * 1000).getUTCDay()) {
        end += A_DAY_S;
      }
      const firstOne = pre[0];
      const title = ev.get('SUMMARY') || '';

      (firstOne && end === firstOne.start) ? Object.assign(firstOne, { title, start }) : pre.unshift({ market: 'SG', title, start, end });
      return pre;
    }, []);
  }

  async loadHolidaysHK() {
    const resp = await fetch('https://www.hkex.com.hk/News/HKEX-Calendar/Subscribe-Calendar?sc_lang=en');
    const text = (await resp.text()).replace(/\r\n/g, '\n').replace(/\n\n/g, '\n'); // handle line folding

    return text.split('\nEND:VEVENT\nBEGIN:VEVENT\n').reduce<IHoliday[]>((pre, blk) => {
      const ev = new Map(blk.split('\n').map(line => line.split(':', 2) as [string, string]));

      if (!['香港市場休市', 'Hong Kong Market is closed'].includes(ev.get('DESCRIPTION') || '')) return pre;

      const start = parseUTCDate(ev.get('DTSTART;VALUE=DATE') || '');
      let end = parseUTCDate(ev.get('DTEND;VALUE=DATE') || '');
      if (start === end) {
        end += A_DAY_S;
      }
      const lastOne = pre[pre.length - 1];
      if (lastOne && start === lastOne.end) {
        lastOne.end = end;
      } else {
        pre.push({ market: 'HK', title: simpleTitle(ev.get('SUMMARY')), start, end });
      }

      return pre;
    }, []);
  }

  async loadHolidays() {
    const [holidaysSG, holidaysHK] = await Promise.all([
      this.loadHolidaysSG(new Date().getUTCFullYear()),
      this.loadHolidaysHK()
    ]);
    return holidaysSG.concat(holidaysHK);
  }
}
