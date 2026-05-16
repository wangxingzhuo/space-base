import { appendFile } from 'fs/promises';

export enum EnLogLevel {
  DEBUG = 7,
  INFO = 6,
  WARN = 4,
  ERROR = 3,
}

function findAppName() {
  const __dirPath = process.argv.find(arg => arg.endsWith('.js'))?.split('/').reverse().slice(1) || [];
  if (['release', 'src', 'dist'].includes(__dirPath[0])) {
    __dirPath.shift();
  }
  return __dirPath[0];
}

export class Log {
  private _logDir = `/var/log/${process.env.APP_NAME || findAppName()}`;
  public level = EnLogLevel.INFO;

  constructor(logDir = '') {
    if (!logDir) return;
    this._logDir = logDir;
  }

  log(lev: EnLogLevel, msg: string) {
    if (lev > this.level) return Promise.resolve();
    return appendFile(`${this._logDir}/${EnLogLevel[lev].toLowerCase()}.log`, `[${new Date().toISOString()}] ${msg}\n`);
  }

  debug(msg: string) {
    return this.log(EnLogLevel.DEBUG, msg);
  }

  info(msg: string) {
    return this.log(EnLogLevel.INFO, msg);
  }

  warn(msg: string) {
    return this.log(EnLogLevel.WARN, msg);
  }

  error(msg: string | Error) {
    return this.log(EnLogLevel.ERROR, msg.toString());
  }
}

export const log = new Log();
