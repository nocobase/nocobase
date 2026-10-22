/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { STATUS_CODES, type IncomingMessage } from 'node:http';
import type { Duplex } from 'node:stream';
import { WebSocketServer, type RawData, type WebSocket as WsSocket } from 'ws';

export type AppWebSocketReadyState = 0 | 1 | 2 | 3;
export type AppWebSocketMessageData = string | ArrayBuffer;

export interface AppWebSocketSendOptions {
  compress?: boolean;
}

export interface AppWebSocket {
  readonly url: URL;
  readonly protocol: string | null;
  readonly readyState: AppWebSocketReadyState;
  readonly bufferedAmount?: number;
  send(
    data: string | ArrayBuffer | Uint8Array,
    options?: AppWebSocketSendOptions,
  ): void;
  close(code?: number, reason?: string): void;
}

export interface AppWebSocketOpenEvent {
  readonly type: 'open';
}

export interface AppWebSocketMessageEvent {
  readonly type: 'message';
  readonly data: AppWebSocketMessageData;
}

export interface AppWebSocketCloseEvent {
  readonly type: 'close';
  readonly code: number;
  readonly reason: string;
  readonly wasClean: boolean;
}

export interface AppWebSocketErrorEvent {
  readonly type: 'error';
  readonly error: unknown;
}

export interface AppWebSocketEvents {
  /** Maximum assembled message size, including fragmented messages. */
  maxMessageBytes?: number;
  /** Native ping/pong interval; zero disables the transport keepalive. */
  heartbeatIntervalMs?: number;
  onOpen?: (
    event: AppWebSocketOpenEvent,
    ws: AppWebSocket,
  ) => void | Promise<void>;
  onMessage?: (
    event: AppWebSocketMessageEvent,
    ws: AppWebSocket,
  ) => void | Promise<void>;
  onClose?: (
    event: AppWebSocketCloseEvent,
    ws: AppWebSocket,
  ) => void | Promise<void>;
  onError?: (
    event: AppWebSocketErrorEvent,
    ws: AppWebSocket,
  ) => void | Promise<void>;
}

export type AppWebSocketAcceptResult =
  AppWebSocketEvents | Response | null | undefined;

export type AppWebSocketHandler = (
  request: Request,
  env?: unknown,
) => AppWebSocketAcceptResult | Promise<AppWebSocketAcceptResult>;

export interface AcceptWebSocketUpgradeOptions {
  request: Request;
  events: AppWebSocketEvents;
  head?: Buffer;
  signal?: AbortSignal;
}

export interface CreateWebSocketUpgradeRequestOptions {
  signal?: AbortSignal;
}

const responseHeadersToSkip = new Set([
  'connection',
  'content-length',
  'keep-alive',
  'transfer-encoding',
  'upgrade',
]);

export function isWebSocketUpgrade(req: IncomingMessage): boolean {
  return firstHeaderValue(req.headers.upgrade)?.toLowerCase() === 'websocket';
}

export function createWebSocketUpgradeRequest(
  req: IncomingMessage,
  options: CreateWebSocketUpgradeRequestOptions = {},
): Request {
  return new Request(createRequestUrl(req), {
    method: req.method ?? 'GET',
    headers: createRequestHeaders(req),
    signal: options.signal,
  });
}

export function rejectWebSocketUpgrade(
  socket: Duplex,
  status: number = 404,
  headers?: Headers,
): void {
  const responseHeaders = ['Connection: close', 'Content-Length: 0'];
  headers?.forEach((value, key) => {
    if (!responseHeadersToSkip.has(key.toLowerCase())) {
      responseHeaders.push(`${key}: ${value}`);
    }
  });

  try {
    socket.end(
      `HTTP/1.1 ${status.toString()} ${STATUS_CODES[status] ?? ''}\r\n${responseHeaders.join('\r\n')}\r\n\r\n`,
    );
  } catch (error) {
    socket.destroy(error instanceof Error ? error : new Error(String(error)));
  }
}

export function acceptWebSocketUpgrade(
  req: IncomingMessage,
  socket: Duplex,
  options: AcceptWebSocketUpgradeOptions,
): AppWebSocket | null {
  const websocketServer = new WebSocketServer({
    clientTracking: false,
    noServer: true,
    maxPayload: options.events.maxMessageBytes ?? 100 * 1024 * 1024,
  });
  let connection: AppWebSocket | null = null;
  websocketServer.handleUpgrade(
    req,
    socket,
    options.head ?? Buffer.alloc(0),
    (ws) => {
      connection = new WsAppWebSocket(
        ws,
        options.request,
        options.events,
        options.signal,
      );
    },
  );
  return connection;
}

class WsAppWebSocket implements AppWebSocket {
  readonly url: URL;
  private heartbeat: ReturnType<typeof setInterval> | undefined;
  private alive = true;

  constructor(
    private readonly socket: WsSocket,
    request: Request,
    private readonly events: AppWebSocketEvents,
    private readonly signal?: AbortSignal,
  ) {
    this.url = new URL(request.url);
    this.socket.on('message', this.handleMessage);
    this.socket.once('close', this.handleClose);
    this.socket.once('error', this.handleError);
    this.socket.on('pong', () => {
      this.alive = true;
    });
    const interval = events.heartbeatIntervalMs ?? 30_000;
    if (interval > 0) {
      this.heartbeat = setInterval(() => {
        if (!this.alive) {
          this.socket.terminate();
          return;
        }
        this.alive = false;
        if (this.socket.readyState === this.socket.OPEN) this.socket.ping();
      }, interval);
      this.heartbeat.unref();
    }
    this.signal?.addEventListener('abort', this.handleAbort, { once: true });
    this.invoke(this.events.onOpen, { type: 'open' });
  }

  get protocol(): string | null {
    return this.socket.protocol || null;
  }

  get bufferedAmount(): number {
    return this.socket.bufferedAmount;
  }

  get readyState(): AppWebSocketReadyState {
    return this.socket.readyState;
  }

  send(
    data: string | ArrayBuffer | Uint8Array,
    options: AppWebSocketSendOptions = {},
  ): void {
    if (this.socket.readyState !== this.socket.OPEN) {
      return;
    }
    this.socket.send(data, { compress: options.compress });
  }

  close(code?: number, reason?: string): void {
    this.socket.close(code, reason);
  }

  private readonly handleMessage = (data: RawData, isBinary: boolean): void => {
    this.invoke(this.events.onMessage, {
      type: 'message',
      data: isBinary
        ? rawDataToArrayBuffer(data)
        : rawDataToBuffer(data).toString(),
    });
  };

  private readonly handleClose = (code: number, reason: Buffer): void => {
    clearInterval(this.heartbeat);
    this.heartbeat = undefined;
    this.signal?.removeEventListener('abort', this.handleAbort);
    this.invoke(this.events.onClose, {
      type: 'close',
      code,
      reason: reason.toString(),
      wasClean: code !== 1006,
    });
  };

  private readonly handleError = (error: Error): void => {
    this.invoke(this.events.onError, { type: 'error', error }, false);
  };

  private readonly handleAbort = (): void => {
    this.close(1001, 'app runtime closed');
  };

  private invoke<TEvent>(
    handler:
      ((event: TEvent, ws: AppWebSocket) => void | Promise<void>) | undefined,
    event: TEvent,
    reportError: boolean = true,
  ): void {
    if (!handler) {
      return;
    }

    try {
      Promise.resolve(handler(event, this)).catch((error: unknown) => {
        if (reportError) {
          this.handleError(asError(error));
        }
      });
    } catch (error) {
      if (reportError) {
        this.handleError(asError(error));
      }
    }
  }
}

function createRequestHeaders(req: IncomingMessage): Headers {
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        headers.append(key, item);
      }
    } else if (value !== undefined) {
      headers.set(key, value);
    }
  }
  return headers;
}

function createRequestUrl(req: IncomingMessage): URL {
  const host = firstHeaderValue(req.headers.host) ?? 'localhost';
  const forwarded = firstHeaderValue(req.headers['x-forwarded-proto']);
  const encrypted = (req.socket as typeof req.socket & { encrypted?: boolean })
    .encrypted;
  const protocol =
    forwarded?.split(',')[0]?.trim() || (encrypted ? 'https' : 'http');
  return new URL(req.url ?? '/', `${protocol}://${host}`);
}

function firstHeaderValue(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function rawDataToBuffer(data: RawData): Buffer {
  if (Array.isArray(data)) {
    return Buffer.concat(data);
  }
  if (data instanceof ArrayBuffer) {
    return Buffer.from(new Uint8Array(data));
  }
  return Buffer.from(data);
}

function rawDataToArrayBuffer(data: RawData): ArrayBuffer {
  const buffer = rawDataToBuffer(data);
  return buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength,
  ) as ArrayBuffer;
}

function asError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}
