// 计时器
export default class Timer {
  private time = 500;
  private timeHandler = 0;
  private fn: any = null;

  constructor(time: number, fn: () => void) {
    this.fn = fn;
  }

  start() {
    this.timeHandler && clearInterval(this.timeHandler);

    // 每500ms更新一次进度条和耗时
    this.timeHandler = window.setInterval(() => {
      this.fn();
    }, this.time);
  }

  stop() {
    this.timeHandler && clearInterval(this.timeHandler);
    this.timeHandler = 0;
  }
}
