export function fixPosition(el: HTMLElement | Element | null) {
  let x = 0;
  let y = 0;

  for (; el; el = (el as HTMLElement).offsetParent) {
    x += (el as HTMLElement).offsetLeft;
    y += (el as HTMLElement).offsetTop;
  }

  return { x, y };
}

export function numValidate(n: number, max = Infinity, min = -Infinity) {
  return Math.max(Math.min(n, max), min);
}
