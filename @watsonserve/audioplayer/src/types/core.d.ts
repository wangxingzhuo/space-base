export declare enum EnLoadMode {
    UNKNOW = 0,
    STOP_AND_LOAD = 1,
    ONLY_PRELOAD,
    STOP_AND_PLAY,
    LOAD_NEXT
}
export declare enum EnPlayStat {
    STOP = 0,
    RUNNING = 1,
    PAUSE = 2
}
type Wrapper<T> = {
    __proto__: T;
} & Readonly<T>;
export declare function genWrapper<T>(p: T): Wrapper<T>;
interface IEq {
    setGain(freq: number, dB: number): void;
    setEq(gains: Map<number, number>): void;
}
declare class Eq implements IEq {
    static get default_frequencies(): number[];
    private readonly acw;
    private _frequencies;
    private bfs;
    private dict;
    constructor(acw: Wrapper<AudioContext>, freq?: number[]);
    protected createNodes(): void;
    protected set frequencies(val: number[]);
    get frequencies(): number[];
    connect(prev: {
        connect(an: AudioNode): any;
    }, next: AudioNode): void;
    setGain(freq: number, dB: number): void;
    setEq(gains: Map<number, number>): void;
}
export declare class Core implements IEq {
    private readonly eventEmitter;
    private readonly acw;
    private readonly _eq;
    private _bufSourceNode?;
    private _nextBufSourceNode?;
    private _stat;
    private startTime;
    private _costTime;
    private handleEnded;
    constructor(acw: Wrapper<AudioContext>);
    private _stop;
    get costTime(): number;
    get totalTime(): number;
    get stat(): EnPlayStat;
    connect(audioNode: AudioNode): AudioNode;
    stop(): void;
    play(): void;
    pause(): void;
    seek(ms: number): void;
    load(url: string, mode: EnLoadMode): Promise<void>;
    get frequencies(): number[];
    setGain(freq: number, dB: number): void;
    setEq(gains: Map<number, number>): void;
    addListener(event: string, listener: (...args: any[]) => void): this;
    on(event: string, listener: (...args: any[]) => void): this;
    once(event: string, listener: (...args: any[]) => void): this;
    removeListener(event: string, listener: (...args: any[]) => void): this;
    off(event: string, listener: (...args: any[]) => void): this;
    removeAllListeners(event?: string): this;
    played?: () => void;
    end?: () => void;
}
