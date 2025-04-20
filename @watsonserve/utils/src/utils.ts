interface INameSet {
  [name: string]: boolean;
}

function classSet2str(classNames: string | INameSet): string {
  if ('string' === typeof classNames) return classNames;
  return Object.keys(classNames).filter(name => classNames[name]).join(' ');
}

export function className(classNames: string | INameSet | (INameSet | string)[]): string {
  if (Array.isArray(classNames)) {
    return classNames.map(classSet2str).join(' ');
  }
  return classSet2str(classNames);
}

export function sleep(timeout = 0) {
  return new Promise<void>(resolve => {
    const handle = setTimeout(() => {
      clearTimeout(handle);
      resolve();
    }, timeout);
  });
}

export function findIndexFrom<T>(ar: T[], start: number = 0, cb: (t: T) => boolean): number {
  if (ar.length < start) start = ar.length;

  let i = start;
  for (; i < ar.length && !cb(ar[i]); i++);
  if (i < ar.length) return i;
  for (i = 0; i < start && !cb(ar[i]); i++);
  return start <= i ? -1 : i;
}

export function randomUUID() {
  const sp = [4, 6, 8, 10, 0];
  let i = 0;
  return [...crypto.getRandomValues(new Uint8Array(16))].reduce((pre, n, idx) => {
    if (idx === sp[i]) {
      pre += '-';
      i++;
    }
    pre += n.toString(16);
    return pre;
  }, '');
}
