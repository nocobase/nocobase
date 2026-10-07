/**
 * The runtime of an App in a container, as the App Host's registry holds it. The Host's listener hands it each request
 * as it arrived (`forward`), and it passes the request on to the container over plain HTTP and streams the answer
 * back; WebSocket upgrades are joined end to end (`forwardUpgrade`). Nothing is buffered, so streaming responses
 * (server-sent events, large downloads) and long requests pass through as they are.
 *
 * Destroying the runtime first lets the requests under way finish (bounded), then stops the container; a retired
 * runtime (replaced by a newer deployment, or removed) also removes it. Detaching leaves the container running for the
 * next Host.
 */
import http, { type IncomingMessage, type ServerResponse } from 'node:http';
import type { Duplex } from 'node:stream';

import type {
  ActiveAppHandle,
  AppDefinition,
  AppDestroyOptions,
  AppSnapshot,
  AppState,
} from '@nocobase/app-host';

/** Where the Host reaches the container's HTTP port. */
export interface ContainerEndpoint {
  readonly host: string;
  readonly port: number;
}

export interface DockerAppHandleOptions {
  readonly definition: AppDefinition;
  readonly version: number;
  readonly containerId: string;
  readonly endpoint: ContainerEndpoint;
  /** How long a destroyed runtime waits for its requests before the container stops. */
  readonly drainTimeoutMs: number;
  /** Where the container listens now, after a connection was refused; null when it does not run. */
  readonly locate: () => Promise<ContainerEndpoint | null>;
  /** Stops the container (and with `retire`, removes it). */
  readonly stop: (retire: boolean) => Promise<void>;
  /** Copies the App's configuration file into the container again and restarts it; answers where it listens then. */
  readonly restart: () => Promise<ContainerEndpoint>;
}

/** Headers that belong to one connection and are never forwarded. */
const HOP_BY_HOP = new Set([
  'connection',
  'keep-alive',
  'proxy-connection',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
]);

export class DockerAppHandle implements ActiveAppHandle {
  readonly id: string;
  readonly version: number;
  readonly basePath: string;
  readonly backend: AppDefinition['backend'];
  private readonly controller = new AbortController();
  private readonly agent = new http.Agent({ keepAlive: true });
  private readonly createdAt = new Date();
  private updatedAt = new Date();
  private lastAccessedAt: Date | null = null;
  private lastError: string | null = null;
  private current: AppState = 'active';
  private endpoint: ContainerEndpoint;
  private inFlight = 0;
  private readonly idleWaiters = new Set<() => void>();
  private readonly sockets = new Set<Duplex>();

  constructor(private readonly options: DockerAppHandleOptions) {
    this.id = options.definition.id;
    this.version = options.version;
    this.basePath = options.definition.basePath;
    this.backend = options.definition.backend;
    this.endpoint = options.endpoint;
  }

  get signal(): AbortSignal {
    return this.controller.signal;
  }

  get state(): AppState {
    return this.current;
  }

  /** The container this runtime forwards to. */
  get containerId(): string {
    return this.options.containerId;
  }

  reloadConfig(): ReturnType<ActiveAppHandle['reloadConfig']> {
    // A containerised App reads its configuration file when it starts: copy it in again and restart.
    return this.options.restart().then((endpoint) => {
      this.endpoint = endpoint;
      this.touch();
      return { changedNamespaces: ['*'] };
    });
  }

  /** Forwards one request to the container and streams its answer back. */
  forward(req: IncomingMessage, res: ServerResponse): Promise<void> {
    this.begin();
    return new Promise<void>((resolve) => {
      let settled = false;
      const done = (): void => {
        if (settled) return;
        settled = true;
        this.end();
        resolve();
      };
      res.once('close', done);
      this.send(req, res, true);
    });
  }

  /**
   * Sends the request on. A refused connection to a request without a body is tried once more where the container
   * listens now: Docker may have restarted it on another published port.
   */
  private send(
    req: IncomingMessage,
    res: ServerResponse,
    retry: boolean,
  ): void {
    const upstream = http.request(
      {
        host: this.endpoint.host,
        port: this.endpoint.port,
        method: req.method,
        path: req.url,
        headers: forwardedHeaders(req),
        agent: this.agent,
      },
      (answer) => {
        res.writeHead(
          answer.statusCode ?? 502,
          answer.statusMessage,
          responseHeaders(answer),
        );
        answer.pipe(res);
        answer.once('error', () => res.destroy());
      },
    );
    upstream.once('error', (error: NodeJS.ErrnoException) => {
      this.lastError = error.message;
      const bodyless = req.method === 'GET' || req.method === 'HEAD';
      if (
        retry &&
        bodyless &&
        error.code === 'ECONNREFUSED' &&
        !res.headersSent
      ) {
        void this.options
          .locate()
          .catch(() => null)
          .then((endpoint) => {
            if (endpoint) {
              this.endpoint = endpoint;
              this.send(req, res, false);
            } else this.unreachable(res, error);
          });
        return;
      }
      this.unreachable(res, error);
    });
    // A client that goes away takes the forwarded request with it.
    res.once('close', () => {
      if (!res.writableFinished) upstream.destroy();
    });
    req.pipe(upstream);
  }

  private unreachable(res: ServerResponse, error: Error): void {
    if (res.headersSent) {
      res.destroy(error);
      return;
    }
    res.writeHead(502, { 'content-type': 'application/json' });
    res.end(
      JSON.stringify({
        error: `The App's container did not answer: ${error.message}`,
        code: 'APP_UNREACHABLE',
      }),
    );
  }

  /** Joins a WebSocket upgrade to the container, or answers with what the container answered instead. */
  forwardUpgrade(
    req: IncomingMessage,
    socket: Duplex,
    head: Buffer,
  ): Promise<void> {
    this.touch();
    if (head.length) socket.unshift(head);
    return new Promise<void>((resolve) => {
      const upstream = http.request({
        host: this.endpoint.host,
        port: this.endpoint.port,
        method: req.method,
        path: req.url,
        headers: { ...forwardedHeaders(req), ...upgradeHeaders(req) },
      });
      upstream.once('upgrade', (answer, upstreamSocket, upstreamHead) => {
        socket.write(
          `HTTP/1.1 101 ${answer.statusMessage ?? 'Switching Protocols'}\r\n${rawHeaderLines(answer.rawHeaders)}\r\n`,
        );
        if (upstreamHead.length) upstreamSocket.unshift(upstreamHead);
        this.begin();
        this.sockets.add(socket);
        let closed = false;
        const close = (): void => {
          if (closed) return;
          closed = true;
          this.sockets.delete(socket);
          upstreamSocket.destroy();
          socket.destroy();
          this.end();
        };
        socket.once('close', close);
        socket.once('error', close);
        upstreamSocket.once('close', close);
        upstreamSocket.once('error', close);
        upstreamSocket.pipe(socket).pipe(upstreamSocket);
        resolve();
      });
      upstream.once('response', (answer) => {
        socket.write(
          `HTTP/1.1 ${answer.statusCode ?? 502} ${answer.statusMessage ?? ''}\r\n${rawHeaderLines(answer.rawHeaders)}\r\n`,
        );
        answer.pipe(socket);
        answer.once('end', () => socket.end());
        resolve();
      });
      upstream.once('error', (error) => {
        this.lastError = error.message;
        socket.end(
          'HTTP/1.1 502 Bad Gateway\r\nconnection: close\r\ncontent-length: 0\r\n\r\n',
        );
        resolve();
      });
      upstream.end();
    });
  }

  /** A Fetch request with the path inside the App (as `AppRuntimeRegistry.dispatch` passes it), sent to the container. */
  async dispatch(request: Request): Promise<Response> {
    this.begin();
    try {
      const url = new URL(request.url);
      // An App at its own host name runs at `/`; one under a path runs at its base path, which the request lost.
      const prefix = this.options.definition.hostname ? '' : this.basePath;
      const target = `http://${formatHost(this.endpoint.host)}:${this.endpoint.port}${prefix}${url.pathname}${url.search}`;
      return await fetch(target, {
        method: request.method,
        headers: request.headers,
        body: request.body,
        redirect: 'manual',
        signal: request.signal,
        ...(request.body ? { duplex: 'half' } : {}),
      });
    } finally {
      this.end();
    }
  }

  acceptWebSocket: ActiveAppHandle['acceptWebSocket'] = () =>
    // The Host joins upgrades to the container itself (`forwardUpgrade`).
    Promise.resolve(new Response(null, { status: 501 }));

  async destroy(options: string | AppDestroyOptions = {}): Promise<void> {
    if (this.current === 'destroyed') return;
    const settings = typeof options === 'string' ? {} : options;
    this.transition('draining');
    await this.idle(settings.timeoutMs ?? this.options.drainTimeoutMs);
    this.transition('destroying');
    for (const socket of this.sockets) socket.destroy();
    try {
      await this.options.stop(settings.retire === true);
    } finally {
      this.agent.destroy();
      this.controller.abort();
      this.transition('destroyed');
    }
  }

  detach(): Promise<void> {
    this.agent.destroy();
    this.controller.abort();
    this.transition('destroyed');
    return Promise.resolve();
  }

  snapshot(): AppSnapshot {
    const definition = this.options.definition;
    return {
      id: this.id,
      ...(definition.appName ? { appName: definition.appName } : {}),
      version: this.version,
      basePath: this.basePath,
      backend: this.backend,
      configVersion: definition.configVersion,
      desiredVersion: definition.desiredVersion,
      codeVersion: definition.desiredVersion,
      isolation: definition.isolation,
      tier: definition.tier,
      state: this.current,
      endpoint: {
        kind: 'external-http',
        host: this.endpoint.host,
        port: this.endpoint.port,
        url: `http://${formatHost(this.endpoint.host)}:${this.endpoint.port}`,
      },
      activeRequests: this.inFlight,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      lastAccessedAt: this.lastAccessedAt?.toISOString() ?? null,
      lastError: this.lastError,
      disposerCount: 0,
    };
  }

  private begin(): void {
    this.inFlight += 1;
    this.touch();
  }

  private end(): void {
    this.inFlight = Math.max(0, this.inFlight - 1);
    this.touch();
    if (this.inFlight === 0) {
      for (const resolve of this.idleWaiters) resolve();
      this.idleWaiters.clear();
    }
  }

  private touch(): void {
    this.lastAccessedAt = new Date();
  }

  private transition(state: AppState): void {
    this.current = state;
    this.updatedAt = new Date();
  }

  /** Resolves once no request is under way, or after `timeoutMs`. */
  private idle(timeoutMs: number): Promise<void> {
    if (this.inFlight === 0) return Promise.resolve();
    return new Promise<void>((resolve) => {
      const timer = setTimeout(() => {
        this.idleWaiters.delete(finish);
        resolve();
      }, timeoutMs);
      timer.unref?.();
      const finish = (): void => {
        clearTimeout(timer);
        resolve();
      };
      this.idleWaiters.add(finish);
    });
  }
}

/** The request's headers for the container: hop-by-hop ones dropped, the client's address and scheme recorded. */
function forwardedHeaders(req: IncomingMessage): http.OutgoingHttpHeaders {
  const headers: http.OutgoingHttpHeaders = {};
  for (const [name, value] of Object.entries(req.headers))
    if (value !== undefined && !HOP_BY_HOP.has(name)) headers[name] = value;
  const address = req.socket.remoteAddress;
  if (address) {
    const before = req.headers['x-forwarded-for'];
    headers['x-forwarded-for'] = before
      ? `${Array.isArray(before) ? before.join(', ') : before}, ${address}`
      : address;
  }
  headers['x-forwarded-proto'] ??= 'encrypted' in req.socket ? 'https' : 'http';
  if (req.headers.host) headers['x-forwarded-host'] ??= req.headers.host;
  return headers;
}

function upgradeHeaders(req: IncomingMessage): http.OutgoingHttpHeaders {
  return {
    connection: 'Upgrade',
    upgrade: req.headers.upgrade ?? 'websocket',
  };
}

function responseHeaders(answer: IncomingMessage): http.OutgoingHttpHeaders {
  const headers: http.OutgoingHttpHeaders = {};
  for (const [name, value] of Object.entries(answer.headers))
    if (value !== undefined && !HOP_BY_HOP.has(name)) headers[name] = value;
  return headers;
}

function rawHeaderLines(raw: readonly string[]): string {
  let lines = '';
  for (let index = 0; index + 1 < raw.length; index += 2)
    lines += `${raw[index]}: ${raw[index + 1]}\r\n`;
  return lines;
}

function formatHost(host: string): string {
  return host.includes(':') ? `[${host}]` : host;
}
