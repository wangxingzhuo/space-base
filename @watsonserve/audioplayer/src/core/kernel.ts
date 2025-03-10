import { genWrapper, Wrapper, EnPlayStat, HAVE_ENOUGH_DATA, _PRELOAD, _AUTOPLAY } from '../base';
import { IEq, Eq } from './eq';

/**
 * stuts:  costTime, totalTime, stat
 * method: destroy, load, play, pause, stop, seek
 * event:  played, paused, ended
 */
export default abstract class Kernel implements IEq {
  private readonly acw: Wrapper<AudioContext>;
  private readonly _eq: Eq;
  private _sourceNode: MediaElementAudioSourceNode;
  private _prevent = 0;
  private _seekCnt = 0;

  protected abstract _evStChange(s: EnPlayStat): void;
  protected abstract _evEnded(): void;
  protected abstract _evError(): void;
  protected abstract _evTimeupdate(): void;


  private __handleTimeupdate = () => this._evTimeupdate();
  private __handleError = () => this._evError();
  private __handlePendding = () => this._evStChange(EnPlayStat.LOADING);

  private __handleEnded = () => {
    this._sourceNode.mediaElement.removeAttribute('src');
    this._evEnded();
  };

  private __handlePlay = () => {
    this._prevent < 1 ? this._evStChange(EnPlayStat.RUNNING) : this._prevent--;
  }

  private __handlePause = () => {
    this._prevent < 1 ? this._evStChange(EnPlayStat.PAUSE) : this._prevent--;
  }

  private __handleSeeked = () => {
    if (0 < this._seekCnt) {
      this._seekCnt--;
      return;
    }

    console.warn('seeked from outside');
  }

  private __play() {
    const audio = this._sourceNode.mediaElement;
    this._prevent++;

    audio.play().then(() => this._evStChange(EnPlayStat.RUNNING), err => {
      this._prevent = Math.max(0, this._prevent - 1);
      console.error(err);
    });
  }

  constructor(acw: Wrapper<AudioContext> = genWrapper(new AudioContext())) {
    this.acw = acw;
    this._sourceNode = acw.__proto__.createMediaElementSource(new Audio());

    this._sourceNode.mediaElement.volume = 0.5;
    this._eq = new Eq(acw);
    this._eq.connectPrev(this._sourceNode);
    this._eq.connectNext(acw.__proto__.destination);
    this._sourceNode.mediaElement.addEventListener('ended', this.__handleEnded);
    this._sourceNode.mediaElement.addEventListener('play', this.__handlePlay);
    this._sourceNode.mediaElement.addEventListener('pause', this.__handlePause);
    this._sourceNode.mediaElement.addEventListener('error', this.__handleError);
    this._sourceNode.mediaElement.addEventListener('stalled', this.__handleError);
    this._sourceNode.mediaElement.addEventListener('suspend', this.__handlePendding);
    this._sourceNode.mediaElement.addEventListener('waiting', this.__handlePendding);
    this._sourceNode.mediaElement.addEventListener('timeupdate', this.__handleTimeupdate);
    this._sourceNode.mediaElement.addEventListener('seeked', this.__handleSeeked);

    // emptied // The media has become empty; for example, this event is sent if the media has already been loaded (or partially loaded), and the HTMLMediaElement.load method is called to reload it.
    // playing // Playback is ready to start after having been paused or delayed due to lack of data.
    // seeked //	A seek operation completed.
  }

  protected _setTrack(blobUrl: string) {
    return new Promise<number>((resolve, reject) => {
      const el = this._sourceNode.mediaElement;

      const fn = () => {
        el.removeEventListener('canplaythrough', fn);
        el.removeEventListener('error', handleErr);

        resolve(this.totalTime);
      };

      const handleErr = (err: ErrorEvent) => {
        el.removeEventListener('canplaythrough', fn);
        el.removeEventListener('error', handleErr);

        reject(err.error);
      };

      el.addEventListener('canplaythrough', fn);
      el.addEventListener('error', handleErr);

      el.src = blobUrl;
      el.load();
    });
  }

  public destroy() {
    this._sourceNode.mediaElement.removeEventListener('error', this.__handleError);
    this._sourceNode.mediaElement.removeEventListener('stalled', this.__handleError);
    this._sourceNode.mediaElement.removeEventListener('suspend', this.__handlePendding);
    this._sourceNode.mediaElement.removeEventListener('waiting', this.__handlePendding);
    this._sourceNode.mediaElement.removeEventListener('ended', this.__handleEnded);
    this._sourceNode.mediaElement.removeEventListener('play', this.__handlePlay);
    this._sourceNode.mediaElement.removeEventListener('pause', this.__handlePause);
    this._sourceNode.mediaElement.removeEventListener('timeupdate', this.__handleTimeupdate);
    this._sourceNode.mediaElement.removeEventListener('seeked', this.__handleSeeked);
    this._sourceNode.disconnect();
    this._eq.destroy();
    this.acw.__proto__.close();
  }

  public get costTime() {
    return this._sourceNode.mediaElement.currentTime * 1000;
  }

  public get totalTime() {
    return this._sourceNode.mediaElement.duration * 1000;
  }

  public get stat() {
    const audio = this._sourceNode.mediaElement;
    if (!audio.src) return EnPlayStat.STOP;
    if (audio.readyState < HAVE_ENOUGH_DATA) return EnPlayStat.LOADING;
    return audio.paused ? EnPlayStat.PAUSE : EnPlayStat.RUNNING;
  }

  public get volume() {
    return this._sourceNode.mediaElement.volume;
  }

  public set volume(v: number) {
    this._sourceNode.mediaElement.volume = v;
  }

  public pause() {
    const audio = this._sourceNode.mediaElement;
    if (!audio.src || EnPlayStat.RUNNING !== this.stat) return;

    this._prevent++;
    audio.pause();
  }

  public stop() {
    this.pause();
    this._sourceNode.mediaElement.removeAttribute('src');
  }

  public play() {
    EnPlayStat.RUNNING !== this.stat && this.__play();
  }

  public seek(ms: number) {
    const audio = this._sourceNode.mediaElement;
    const { paused, src } = audio;
    if (!src) return;

    if (!paused) {
      this._prevent++;
      audio.pause();
    }

    this._seekCnt++;
    audio.currentTime = ~~(ms / 1000);
    !paused && this.__play();
  }
  
  // EQ

  public get frequencyValues() {
    return this._eq.frequencyValues;
  }

  public setGain(freq: number, dB: number): void {
    this._eq.setGain(freq, dB);
  }

  public setEq(gains: Map<number, number>): void {
    this._eq.setEq(gains);
  }

  // Audio Node

  public connect(audioNode: AudioNode) {
    // this._sourceNode?.connect(audioNode);
    return audioNode;
  }
}
