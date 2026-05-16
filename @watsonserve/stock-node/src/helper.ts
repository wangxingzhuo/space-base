
export function getOptions(conf: [string, string][]): [Map<string, string>, string] {
  const dict = new Map<string, string>(conf);
  let cmd = '';
  const opts = new Map<string, string>();

  const args = process.argv.slice(2);
  args.forEach(arg => {
    if (arg.startsWith('--')) {
      const [opt, payload] = arg.split('=');
      opts.set(opt.substring(2), payload);
      return;
    }

    if (arg.startsWith('-')) {
      arg.substring(1).split('').forEach(o => {
        const _option = dict.get(o);
        _option && opts.set(_option, '');
      });
      return;
    }

    cmd = arg;
  });

  return [opts, cmd];
}

export function printHelp() {
  console.log('useage: load [-d] MARKET');
  console.log('-h  --help     show help');
  console.log('-d  --debug');
  console.log('MARKET is enum of: FX, HKEX, SGX, USA');
}
