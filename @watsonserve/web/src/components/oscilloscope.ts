export default class Oscilloscope extends AnalyserNode {
  private canvasCtx?: CanvasRenderingContext2D;
  private canvasWidth = 0;
  private canvasHeight = 0;
  private animationFrame = NaN;

  public draw = () => {
    const { canvasCtx, canvasWidth, canvasHeight } = this;

    const dataArray = new Uint8Array(this.frequencyBinCount);
    const bufferLength = this.frequencyBinCount;
    this.getByteTimeDomainData(dataArray);
    // this.getByteFrequencyData(dataArray);
    const sliceWidth = canvasWidth / (bufferLength - 1);
    canvasCtx?.clearRect(0, 0, canvasWidth, canvasHeight);

    canvasCtx!.beginPath();
    for (let x = 0, i = 0; i < bufferLength; i++) {
      const y = dataArray[i] * canvasHeight / 256;

      !i ? canvasCtx!.moveTo(x, y) : canvasCtx!.lineTo(x, y);
      x += sliceWidth;
    }
    canvasCtx!.stroke();

    this.animationFrame = requestAnimationFrame(this.draw);
  };

  constructor(ac: AudioContext, canvas: HTMLCanvasElement, options?: AnalyserOptions) {
    super(ac, options);

    if (!canvas) return;
    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;
  
    this.canvasWidth = canvas.width;
    this.canvasHeight = canvas.height;
    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = '#fff';
    this.canvasCtx = canvasCtx;
  }

  public stop() {
    cancelAnimationFrame(this.animationFrame);
  }
}
