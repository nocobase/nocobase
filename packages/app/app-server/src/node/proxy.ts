import {
  request as httpRequest,
  type ClientRequest,
  type IncomingMessage,
  type RequestOptions,
} from 'node:http';
import { request as httpsRequest } from 'node:https';
import { Duplex, Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import type { ReadableStream as NodeReadableStream } from 'node:stream/web';

import {
  createWebSocketUpgradeRequest,
  rejectWebSocketUpgrade,
} from '@nocobase/app-websocket';
import { removeHopByHopHeaders } from '../proxy/http-proxy.js';

export interface NodeServerProxyOptions {
  readonly match: (pathname: string) => boolean;
  /** Resolve the current upstream origin without starting it. Null means unavailable. */
  readonly target: () => URL | null | Promise<URL | null>;
}

/** A standalone listener's proxy; application routes never pass through this layer. */
export class NodeServerProxy {
  private readonly requests = new Set<ClientRequest>();
  private readonly webSockets = new Set<Duplex>();
  private closed = false;
  private upgradesClosed = false;

  public constructor(private readonly options: NodeServerProxyOptions) {}

  public matches(pathname: string): boolean {
    return this.options.match(pathname);
  }

  public async fetch(request: Request): Promise<Response> {
    try {
      const target = await this.resolveTarget(request);
      if (!target || this.closed) return unavailableResponse();
      const headers = forwardedHeaders(request);
      return await new Promise<Response>((resolve, reject) => {
        const outgoing = this.request(target, {
          method: request.method,
          headers: Object.fromEntries(headers),
          signal: request.signal,
        });
        outgoing.once('error', reject);
        outgoing.once('upgrade', (_incoming, socket) => {
          // HTTP fetch cannot represent 101, and Node skips the response event.
          socket.destroy();
          outgoing.destroy();
          reject(
            new Error('Upstream returned an unexpected protocol upgrade.'),
          );
        });
        outgoing.once('response', (incoming) => {
          try {
            const responseHeaders = readHeaders(incoming);
            removeHopByHopHeaders(responseHeaders);
            const status = incoming.statusCode ?? 502;
            if (status < 200 || status > 599) {
              throw new Error('Upstream returned an invalid response status.');
            }
            const hasBody =
              request.method !== 'HEAD' && ![204, 205, 304].includes(status);
            if (!hasBody) incoming.resume();
            const response = new Response(
              hasBody
                ? (Readable.toWeb(incoming) as ReadableStream<Uint8Array>)
                : null,
              {
                status,
                statusText: incoming.statusMessage,
                headers: responseHeaders,
              },
            );
            // Cancelling the downstream response also stops an unfinished upload.
            incoming.once('close', () => outgoing.destroy());
            resolve(response);
          } catch (error) {
            incoming.destroy();
            outgoing.destroy();
            reject(toError(error));
          }
        });
        if (request.body) {
          const input = request.body;
          // DOM consumers resolve a different BYOB reader type for the same runtime stream.
          const stream = input as unknown as NodeReadableStream<Uint8Array>;
          const body = Readable.fromWeb(stream);
          void pipeline(body, outgoing).catch((error: unknown) => {
            outgoing.destroy(toError(error));
            reject(toError(error));
          });
        } else {
          outgoing.end();
        }
      });
    } catch (error) {
      if (isConnectionFailure(error)) return unavailableResponse();
      return Response.json(
        { error: 'Upstream server is unavailable.' },
        { status: 502 },
      );
    }
  }

  public async upgrade(
    req: IncomingMessage,
    socket: Duplex,
    head: Buffer,
  ): Promise<void> {
    if (this.closed || this.upgradesClosed) {
      rejectWebSocketUpgrade(socket, 503, retryHeaders());
      return;
    }
    this.webSockets.add(socket);
    const controller = new AbortController();
    socket.once('close', () => {
      this.webSockets.delete(socket);
      controller.abort();
    });
    socket.once('error', () => socket.destroy());

    try {
      const request = createWebSocketUpgradeRequest(req);
      const target = await this.resolveTarget(request);
      if (socket.destroyed) return;
      if (!target || this.closed || this.upgradesClosed) {
        rejectWebSocketUpgrade(socket, 503, retryHeaders());
        return;
      }
      const headers = forwardedHeaders(request);
      headers.set('connection', 'Upgrade');
      headers.set('upgrade', 'websocket');
      await new Promise<void>((resolve) => {
        const outgoing = this.request(target, {
          method: req.method ?? 'GET',
          headers: Object.fromEntries(headers),
          signal: controller.signal,
        });
        const timer = setTimeout(
          () =>
            outgoing.destroy(
              new Error('Upstream WebSocket handshake timed out.'),
            ),
          30_000,
        );
        timer.unref();
        const finish = (): void => {
          clearTimeout(timer);
          resolve();
        };
        outgoing.once('error', () => {
          if (!socket.destroyed)
            rejectWebSocketUpgrade(socket, 503, retryHeaders());
          finish();
        });
        outgoing.once('response', (incoming) => {
          rejectWebSocketUpgrade(
            socket,
            incoming.statusCode ?? 502,
            readHeaders(incoming),
          );
          incoming.resume();
          finish();
        });
        outgoing.once('upgrade', (incoming, upstream, upstreamHead) => {
          finish();
          if (socket.destroyed || this.closed || this.upgradesClosed) {
            upstream.destroy();
            socket.destroy();
            return;
          }
          this.webSockets.add(upstream);
          upstream.once('close', () => {
            this.webSockets.delete(upstream);
            socket.destroy();
          });
          socket.once('close', () => upstream.destroy());
          upstream.once('error', () => upstream.destroy());

          // Tunnel the upstream handshake, including negotiated protocols and extensions.
          const responseHeaders = [
            `HTTP/1.1 ${incoming.statusCode ?? 101} ${incoming.statusMessage ?? 'Switching Protocols'}`,
          ];
          for (let index = 0; index < incoming.rawHeaders.length; index += 2) {
            responseHeaders.push(
              `${incoming.rawHeaders[index]}: ${incoming.rawHeaders[index + 1]}`,
            );
          }
          socket.write(`${responseHeaders.join('\r\n')}\r\n\r\n`);
          if (upstreamHead.length) socket.write(upstreamHead);
          if (head.length) upstream.write(head);
          upstream.pipe(socket);
          socket.pipe(upstream);
        });
        outgoing.end();
      });
    } catch {
      if (!socket.destroyed)
        rejectWebSocketUpgrade(socket, 503, retryHeaders());
    }
  }

  /** Stop upgraded connections before draining HTTP; Node does not close them for us. */
  public closeWebSockets(): void {
    this.upgradesClosed = true;
    for (const socket of this.webSockets) socket.destroy();
    this.webSockets.clear();
  }

  public close(): void {
    this.closed = true;
    this.closeWebSockets();
    for (const request of this.requests) request.destroy();
    this.requests.clear();
  }

  private request(target: URL, options: RequestOptions): ClientRequest {
    const outgoing = (
      target.protocol === 'https:' ? httpsRequest : httpRequest
    )(target, options);
    this.requests.add(outgoing);
    outgoing.once('close', () => this.requests.delete(outgoing));
    return outgoing;
  }

  private async resolveTarget(request: Request): Promise<URL | null> {
    if (this.closed) return null;
    const origin = await this.options.target();
    if (!origin) return null;
    if (!['http:', 'https:'].includes(origin.protocol))
      throw new Error('Proxy targets must use HTTP or HTTPS.');
    const target = new URL(origin);
    const original = new URL(request.url);
    // Assign the path rather than resolving it as a URL: //host must never change the upstream.
    target.pathname = original.pathname;
    target.search = original.search;
    target.hash = '';
    return target;
  }
}

function forwardedHeaders(request: Request): Headers {
  const headers = new Headers(request.headers);
  const url = new URL(request.url);
  removeHopByHopHeaders(headers);
  headers.set('host', url.host);
  headers.set('x-forwarded-host', url.host);
  if (!headers.has('x-forwarded-proto'))
    headers.set('x-forwarded-proto', url.protocol.slice(0, -1));
  return headers;
}

function readHeaders(message: IncomingMessage): Headers {
  const headers = new Headers();
  for (let index = 0; index < message.rawHeaders.length; index += 2) {
    headers.append(message.rawHeaders[index], message.rawHeaders[index + 1]);
  }
  return headers;
}

function unavailableResponse(): Response {
  return Response.json(
    { error: 'Upstream server is not ready.' },
    { status: 503, headers: retryHeaders() },
  );
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

function retryHeaders(): Headers {
  return new Headers({ 'retry-after': '2', 'cache-control': 'no-store' });
}

function isConnectionFailure(error: unknown): boolean {
  return [
    'ECONNREFUSED',
    'ECONNRESET',
    'EPIPE',
    'ETIMEDOUT',
    'EHOSTUNREACH',
    'ENETUNREACH',
  ].includes((error as NodeJS.ErrnoException | undefined)?.code ?? '');
}
