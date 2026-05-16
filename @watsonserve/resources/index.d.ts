/// <reference types="node" />
import { IncomingMessage, IncomingHttpHeaders } from 'http';

export interface IResource {
    url: string;
    size: number;
    duration: number;
    randName: string;
    cacheRange: [number, number][] | null;
}
declare class LocationResources {
    private _cacheDir;
    protected _locationMap: Map<string, IResource>;
    get songsFile(): string;
    setCacheDir(dir: string): void;
    save(): Promise<void>;
    find(url: string): {
        randName: string;
        url: string;
        size: number;
        duration: number;
        cacheRange: [number, number][] | null;
    } | null;
    append(song: IResource): Promise<void>;
    /**
     * remove a location song
     * @param urls file path, example: file://xxxx or /xxxx/xxx.wav
     * @param rmFile if true will delete the file, default value is false
     * @returns
     */
    delete(urls: string[], rmFile?: boolean): Promise<void>;
    modify(info: IResource): Promise<void>;
    loadResList(): Promise<void>;
}
export declare class Collections extends LocationResources {
    protected collFile: string;
    private static _collMgr;
    static getInstance(): Collections;
    private constructor();
    private getCached;
    private getFile;
    private loadOrigin;
    loadRes(href: string, range: string): Promise<Response>;
}
interface IHttpResponse {
    statusCode: number;
    statusMessage: string;
    headers: IncomingHttpHeaders;
    body: Buffer;
}
export declare function request(url: string, reqHeaders?: Record<string, string>): Promise<IncomingMessage>;
export declare function httpLoad(url: string, headers?: Record<string, string>): Promise<IHttpResponse>;
export declare function httpLoadPart(url: string, range: [number, number][] | string): Promise<{
    statusCode: number | undefined;
    statusMessage: string | undefined;
    headers: IncomingHttpHeaders;
    body: IncomingMessage;
}>;

export interface IMedia {
    title: string;
    start: number;
    duration: number;
    url: string;
}
export declare function fetchM3U(url: string): Promise<IMedia[]>;
