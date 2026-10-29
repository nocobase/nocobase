import { connect, type AddressInfo } from 'node:net';

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  closeNodeServer,
  closeNodeServerWithGracePeriod,
  disposeAfterStartupFailure,
  resolveNodeShutdownTimeouts,
  shutdownNodeAppServer,
  startNodeAppServer,
  SHUTDOWN_TIMEOUT_ENV,
  type ClosableNodeAppServer,
  type NodeAppHttpServer,
} from '../src/node/index.js';

const servers: NodeAppHttpServer[] = [];

afterEach(async () => {
  await Promise.all(
    servers.splice(0).map(async (server) => {
      if (server.listening) {
        await closeNodeServer(server);
      }
    }),
  );
});

describe('Node app server', () => {
  it('serves Fetch requests and framework-neutral WebSocket handlers', async () => {
    const controller = new AbortController();
    const websocketEnvironments: unknown[] = [];
    const close = vi.fn(async () => controller.abort());
    const app: ClosableNodeAppServer = {
      signal: controller.signal,
      close,
      fetch: (request) =>
        Response.json({ path: new URL(request.url).pathname }),
      websocket: (request, env) => {
        websocketEnvironments.push(env);
        if (new URL(request.url).pathname !== '/ws') return null;

        return {
          onMessage: (event, websocket) => {
            websocket.send(`echo:${String(event.data)}`);
          },
        };
      },
    };
    const { server, url } = await listen(app);

    const response = await fetch(`${url}/healthz`);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ path: '/healthz' });

    const websocket = new WebSocket(`${url.replace('http:', 'ws:')}/ws`);
    await waitForWebSocketOpen(websocket);
    const message = waitForWebSocketMessage(websocket);
    websocket.send('hello');

    await expect(message).resolves.toBe('echo:hello');
    const closed = waitForWebSocketClose(websocket);
    websocket.close();
    await closed;
    await closeNodeServer(server);

    expect(websocketEnvironments).toEqual([{ signal: controller.signal }]);
    expect(close).not.toHaveBeenCalled();
  });

  it('leaves the connection headers to Node, so a client never reuses a connection being closed', async () => {
    const app: ClosableNodeAppServer = {
      close: async () => undefined,
      // As the AI SDK's streams answer: an event stream that says `connection: keep-alive` itself.
      fetch: () =>
        new Response(
          new ReadableStream({
            start(controller) {
              controller.enqueue(new TextEncoder().encode('data: ok\n\n'));
              controller.close();
            },
          }),
          {
            headers: {
              'content-type': 'text/event-stream',
              connection: 'keep-alive',
              'keep-alive': 'timeout=600',
            },
          },
        ),
    };
    const { url } = await listen(app);
    const { port, hostname } = new URL(url);
    const raw = (connection: string) =>
      new Promise<string>((resolve, reject) => {
        const socket = connect(Number(port), hostname);
        let text = '';
        socket.on('data', (chunk) => (text += String(chunk)));
        socket.on('error', reject);
        socket.on('close', () => resolve(text));
        socket.write(
          `GET /events HTTP/1.1\r\nHost: ${hostname}\r\nConnection: ${connection}\r\n\r\n`,
        );
        if (connection !== 'close') setTimeout(() => socket.end(), 200);
      });
    const closing = (await raw('close')).toLowerCase();
    expect(closing).toContain('connection: close');
    expect(closing).not.toContain('keep-alive');
    const kept = (await raw('keep-alive')).toLowerCase();
    expect(kept).toContain('connection: keep-alive');
    expect(kept).not.toContain('timeout=600');
  });

  it('drains the HTTP server before closing application resources', async () => {
    const close = vi.fn(async () => undefined);
    const logger = createTestLogger();
    const app: ClosableNodeAppServer = {
      close,
      fetch: () => new Response('ok'),
    };
    const { server } = await listen(app);

    await shutdownNodeAppServer(app, server, 'SIGTERM', {
      httpDrainTimeoutMs: 100,
      forceExitTimeoutMs: 1_000,
      logger,
    });

    expect(server.listening).toBe(false);
    expect(close).toHaveBeenCalledOnce();
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('can close an HTTP server without closing the owning application', async () => {
    const close = vi.fn(async () => undefined);
    const app: ClosableNodeAppServer = {
      close,
      fetch: () => new Response('ok'),
    };
    const { server } = await listen(app);

    await closeNodeServerWithGracePeriod(server, 100, createTestLogger());

    expect(server.listening).toBe(false);
    expect(close).not.toHaveBeenCalled();
  });

  it('rejects when the listener cannot start', async () => {
    const first = await listen({
      close: async () => undefined,
      fetch: () => new Response('first'),
    });
    const address = first.server.address();
    if (!address || typeof address === 'string') {
      throw new Error('Failed to resolve the first server address.');
    }
    const close = vi.fn(async () => undefined);

    await expect(
      startNodeAppServer(
        {
          close,
          fetch: () => new Response('second'),
        },
        {
          hostname: '127.0.0.1',
          port: address.port,
          registerProcessSignals: false,
        },
      ),
    ).rejects.toMatchObject({ code: 'EADDRINUSE' });
    expect(close).not.toHaveBeenCalled();
  });

  it('removes process signal handlers when the HTTP server closes', async () => {
    const initialSigintListeners = process.listenerCount('SIGINT');
    const initialSigtermListeners = process.listenerCount('SIGTERM');
    const server = await startNodeAppServer(
      {
        close: async () => undefined,
        fetch: () => new Response('ok'),
      },
      {
        hostname: '127.0.0.1',
        port: 0,
      },
    );
    servers.push(server);

    expect(process.listenerCount('SIGINT')).toBe(initialSigintListeners + 1);
    expect(process.listenerCount('SIGTERM')).toBe(initialSigtermListeners + 1);

    await closeNodeServer(server);

    expect(process.listenerCount('SIGINT')).toBe(initialSigintListeners);
    expect(process.listenerCount('SIGTERM')).toBe(initialSigtermListeners);
  });
});

describe('startup failure disposal', () => {
  it('rethrows the startup error after successful disposal', async () => {
    const startupError = new Error('startup failed');
    const dispose = vi.fn(async () => undefined);

    await expect(
      disposeAfterStartupFailure(dispose, startupError),
    ).rejects.toBe(startupError);
    expect(dispose).toHaveBeenCalledOnce();
  });

  it('preserves startup and disposal errors when cleanup also fails', async () => {
    const startupError = new Error('startup failed');
    const disposalError = new Error('disposal failed');

    const result = disposeAfterStartupFailure(
      async () => Promise.reject(disposalError),
      startupError,
    );

    await expect(result).rejects.toMatchObject({
      message: 'Failed to start server and dispose resources',
      cause: disposalError,
      errors: [startupError, disposalError],
    });
  });
});

async function listen(
  app: ClosableNodeAppServer,
): Promise<{ server: NodeAppHttpServer; url: string }> {
  let listenInfo: AddressInfo | undefined;
  const server = await startNodeAppServer(app, {
    hostname: '127.0.0.1',
    port: 0,
    registerProcessSignals: false,
    onListen: (info) => {
      listenInfo = info;
    },
  });
  servers.push(server);

  if (!listenInfo) {
    throw new Error('Node app server started without listen information.');
  }

  return {
    server,
    url: `http://${normalizeListenAddress(listenInfo)}:${listenInfo.port}`,
  };
}

function normalizeListenAddress(info: AddressInfo): string {
  return info.address === '::' ? '127.0.0.1' : info.address;
}

function createTestLogger() {
  return {
    error: vi.fn(),
  };
}

function waitForWebSocketOpen(websocket: WebSocket): Promise<void> {
  if (websocket.readyState === WebSocket.OPEN) return Promise.resolve();

  return new Promise((resolve, reject) => {
    websocket.addEventListener('open', () => resolve(), { once: true });
    websocket.addEventListener(
      'error',
      () => reject(new Error('WebSocket failed to open.')),
      { once: true },
    );
  });
}

function waitForWebSocketMessage(websocket: WebSocket): Promise<string> {
  return new Promise((resolve, reject) => {
    websocket.addEventListener(
      'message',
      (event) => resolve(String(event.data)),
      { once: true },
    );
    websocket.addEventListener(
      'error',
      () => reject(new Error('WebSocket message failed.')),
      { once: true },
    );
  });
}

function waitForWebSocketClose(websocket: WebSocket): Promise<void> {
  if (websocket.readyState === WebSocket.CLOSED) return Promise.resolve();

  return new Promise((resolve) => {
    websocket.addEventListener('close', () => resolve(), { once: true });
  });
}

describe('shutdown budget', () => {
  it('derives both timeouts from the environment', () => {
    // A supervisor that kills the process after a fixed wait makes the
    // deployment defaults unreachable; the drain has to end before the force
    // exit, and both before the supervisor's own deadline.
    expect(
      resolveNodeShutdownTimeouts({ [SHUTDOWN_TIMEOUT_ENV]: '4000' }),
    ).toEqual({
      forceExitTimeoutMs: 4000,
      httpDrainTimeoutMs: 3000,
    });
  });

  it('keeps the drain positive for a budget smaller than the margin', () => {
    const resolved = resolveNodeShutdownTimeouts({
      [SHUTDOWN_TIMEOUT_ENV]: '300',
    });
    expect(resolved.forceExitTimeoutMs).toBe(300);
    expect(resolved.httpDrainTimeoutMs).toBeGreaterThan(0);
  });

  it('keeps the defaults when nothing usable is set', () => {
    for (const value of [undefined, '', 'soon', '0', '-1'])
      expect(
        resolveNodeShutdownTimeouts(
          value === undefined ? {} : { [SHUTDOWN_TIMEOUT_ENV]: value },
        ),
      ).toEqual({});
  });
});
