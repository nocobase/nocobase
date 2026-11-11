import {
  createServer,
  request as httpRequest,
  type Server,
  type IncomingMessage,
} from 'node:http';
import { once } from 'node:events';
import { gzipSync, gunzipSync } from 'node:zlib';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';
import { objectProvider } from '@nocobase/config/providers/object';
import { Application } from '../src/application/index.js';
import { defineServerPlugins } from '../src/plugins/index.js';
import { AppConfig, createAppPaths } from '../src/config/index.js';
import {
  defineAppRuntime,
  startApplicationInScope,
} from '../src/runtime/index.js';
import {
  defineStandaloneServer,
  startNodeAppServer,
  shutdownNodeAppServer,
  type StandaloneServer,
} from '../src/node/index.js';

const servers: Server[] = [];
const apps: StandaloneServer[] = [];
const directories: string[] = [];

afterEach(async () => {
  for (const app of apps.splice(0)) await app.close();
  for (const server of servers.splice(0)) {
    server.closeAllConnections();
    if (server.listening)
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
  }
  for (const directory of directories.splice(0))
    rmSync(directory, { recursive: true, force: true });
  vi.restoreAllMocks();
});

describe('standalone proxy', () => {
  it('routes before the app mount and preserves bodies, public headers, cookies and redirects', async () => {
    const upstream = createServer(async (req, res) => {
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(Buffer.from(chunk));
      res.setHeader('set-cookie', ['a=1; Path=/crm/', 'b=2; Path=/crm/']);
      if (req.url === '/crm/redirect') {
        res.writeHead(302, { location: '/crm/login' });
        res.end();
        return;
      }
      res.setHeader('connection', 'keep-alive, x-upstream-private');
      res.setHeader('x-upstream-private', 'remove');
      res.end(
        JSON.stringify({
          url: req.url,
          method: req.method,
          headers: req.headers,
          body: Buffer.concat(chunks).toString(),
        }),
      );
    });
    const target = await listen(upstream);
    const { app, url } = await startProxy(() => target);
    for (const pathname of ['/hub', '/hub/', '/hub/status']) {
      expect(await (await fetch(`${url}${pathname}`)).text()).toBe('hub');
    }
    expect((await fetch(`${url}/hub/missing`)).status).toBe(404);
    for (const pathname of ['/crm/orders?a=1&a=2', '/hubble', '/']) {
      const response = await app.fetch(
        new Request(`${url}${pathname}`, {
          method: 'POST',
          body: 'payload',
          headers: {
            origin: url,
            cookie: 'a=1',
            authorization: 'Bearer demo',
            'x-forwarded-proto': 'https',
            connection: 'keep-alive, x-client-private',
            'x-client-private': 'remove',
          },
        }),
      );
      expect(response.headers.getSetCookie()).toEqual([
        'a=1; Path=/crm/',
        'b=2; Path=/crm/',
      ]);
      expect(response.headers.has('x-upstream-private')).toBe(false);
      const value = await response.json();
      expect(value).toMatchObject({
        url: pathname,
        method: 'POST',
        body: 'payload',
        headers: {
          host: new URL(url).host,
          origin: url,
          cookie: 'a=1',
          authorization: 'Bearer demo',
          'x-forwarded-proto': 'https',
        },
      });
      expect(value.headers['x-client-private']).toBeUndefined();
    }
    const redirect = await app.fetch(new Request(`${url}/crm/redirect`));
    expect(redirect.status).toBe(302);
    expect(redirect.headers.get('location')).toBe('/crm/login');
  });

  it('returns retryable responses across unavailable targets and connection failures, then recovers', async () => {
    let target: URL | null = null;
    const { url } = await startProxy(() => target);
    const unavailable = await fetch(`${url}/crm/`);
    expect(unavailable.status).toBe(503);
    expect(unavailable.headers.get('retry-after')).toBe('2');
    expect(unavailable.headers.get('cache-control')).toBe('no-store');
    target = await listen(createServer((_req, res) => res.end('first')));
    expect(await (await fetch(`${url}/crm/`)).text()).toBe('first');
    const second = createServer((_req, res) => res.end('second'));
    target = await listen(second);
    expect(await (await fetch(`${url}/crm/`)).text()).toBe('second');
    await new Promise<void>((resolve) => second.close(() => resolve()));
    const failed = await fetch(`${url}/crm/`);
    expect(failed.status).toBe(503);
    expect(failed.headers.get('retry-after')).toBe('2');
    target = await listen(createServer((_req, res) => res.end('recovered')));
    expect(await (await fetch(`${url}/crm/`)).text()).toBe('recovered');
    expect(await (await fetch(`${url}/hub/status`)).text()).toBe('hub');
  });

  it('streams responses, propagates cancellation and preserves encoded response bytes', async () => {
    let streamClosed = false;
    const upstream = createServer((req, res) => {
      if (req.url === '/crm/gzip') {
        const bytes = gzipSync('compressed download');
        res.writeHead(200, {
          'content-encoding': 'gzip',
          'content-length': bytes.length,
        });
        res.end(bytes);
        return;
      }
      res.writeHead(200, { 'content-type': 'text/event-stream' });
      res.write('data: first\n\n');
      res.once('close', () => {
        streamClosed = true;
      });
    });
    const target = await listen(upstream);
    const { app, url } = await startProxy(() => target);
    const response = await fetch(`${url}/crm/events`);
    const reader = response.body!.getReader();
    const first = await reader.read();
    expect(new TextDecoder().decode(first.value)).toBe('data: first\n\n');
    await reader.cancel();
    await vi.waitFor(() => expect(streamClosed).toBe(true));
    const download = await app.fetch(new Request(`${url}/crm/gzip`));
    expect(download.headers.get('content-encoding')).toBe('gzip');
    expect(
      gunzipSync(Buffer.from(await download.arrayBuffer())).toString(),
    ).toBe('compressed download');
  });

  it('preserves empty responses and handles invalid upstream status codes without crashing', async () => {
    const target = await listen(
      createServer((req, res) => {
        res.statusCode = Number(req.url?.slice(1)) || 200;
        res.end();
      }),
    );
    const { app, url } = await startProxy(() => target);
    for (const status of [204, 205, 304]) {
      const response = await app.fetch(new Request(`${url}/${status}`));
      expect(response.status).toBe(status);
      expect(response.body).toBeNull();
    }
    const head = await app.fetch(new Request(`${url}/200`, { method: 'HEAD' }));
    expect(head.status).toBe(200);
    expect(head.body).toBeNull();
    expect((await fetch(`${url}/600`)).status).toBe(502);
    expect(await (await fetch(`${url}/hub/status`)).text()).toBe('hub');
  });

  it('rejects an unexpected HTTP upgrade and closes its upstream connection', async () => {
    let upstreamClosed = false;
    const target = await listen(
      createServer((req, res) => {
        req.socket.once('close', () => {
          upstreamClosed = true;
        });
        res.writeHead(101, { connection: 'Upgrade', upgrade: 'websocket' });
        res.end();
      }),
    );
    const { url } = await startProxy(() => target);
    const response = await fetch(`${url}/crm/`, {
      signal: AbortSignal.timeout(1000),
    });
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      error: 'Upstream server is unavailable.',
    });
    await vi.waitFor(() => expect(upstreamClosed).toBe(true));
    expect(await (await fetch(`${url}/hub/status`)).text()).toBe('hub');
  });

  it('uses the same routing for WebSocket upgrades and keeps upstream handshake decisions', async () => {
    const upstream = createServer();
    let received: IncomingMessage | undefined;
    upstream.on('upgrade', (req, socket, head) => {
      received = req;
      if (req.headers.origin !== 'https://apps.example.com') {
        socket.end(
          'HTTP/1.1 403 Forbidden\r\nConnection: close\r\nContent-Length: 0\r\n\r\n',
        );
        return;
      }
      socket.write(
        'HTTP/1.1 101 Switching Protocols\r\nConnection: Upgrade\r\nUpgrade: websocket\r\nSec-WebSocket-Protocol: test\r\n\r\n',
      );
      if (head.length) socket.write(head);
      socket.pipe(socket);
    });
    const target = await listen(upstream);
    const { app, server, url } = await startProxy(() => target);
    const local = new WebSocket(`${url}/hub/ws`);
    await once(local, 'open');
    const localMessage = once(local, 'message');
    local.send('hello');
    expect((await localMessage)[0].data).toBe('hub:hello');
    local.close();
    await once(local, 'close');

    const rejected = await upgrade(
      url,
      '/crm/ws',
      'https://foreign.example.com',
    );
    expect(rejected.status).toBe(403);
    const accepted = await upgrade(
      url,
      '/crm/ws?channel=1',
      'https://apps.example.com',
    );
    expect(accepted.status).toBe(101);
    expect(accepted.protocol).toBe('test');
    expect(received?.url).toBe('/crm/ws?channel=1');
    expect(received?.headers).toMatchObject({
      host: new URL(url).host,
      origin: 'https://apps.example.com',
      cookie: 'session=demo',
      'x-forwarded-proto': 'https',
    });
    expect(accepted.socket).toBeDefined();
    const data = once(accepted.socket!, 'data');
    accepted.socket!.write('tunnel');
    expect((await data)[0].toString()).toBe('tunnel');
    const closed = once(accepted.socket!, 'close');
    await shutdownNodeAppServer(app, server, 'SIGTERM', {
      httpDrainTimeoutMs: 100,
      forceExitTimeoutMs: 1000,
    });
    await closed;
    expect(server.listening).toBe(false);
  });

  it('returns retryable 503 for unavailable WebSocket targets without falling through to the local handler', async () => {
    let target: URL | null = null;
    const { url } = await startProxy(() => target);
    const unavailable = await upgrade(url, '/crm/ws', url);
    expect(unavailable.status).toBe(503);
    expect(unavailable.headers['retry-after']).toBe('2');
    const upstream = createServer();
    target = await listen(upstream);
    await new Promise<void>((resolve) => upstream.close(() => resolve()));
    const failed = await upgrade(url, '/crm/ws', url);
    expect(failed.status).toBe(503);
    expect(failed.headers['retry-after']).toBe('2');
  });
});

async function startProxy(target: () => URL | null) {
  const directory = mkdtempSync(path.join(tmpdir(), 'nocobase-proxy-'));
  directories.push(directory);
  const definition = defineStandaloneServer({
    rootDir: directory,
    appRuntime: defineAppRuntime({
      createAppConfig: () => new AppConfig(),
      plugins: defineServerPlugins([]),
      serviceProviders: [],
      routes: [],
    }),
    createServer: async (scope) => {
      const config = new AppConfig();
      config.load(
        objectProvider({ app: { name: 'hub', publicBasePath: '/hub' } }),
      );
      await config.loadAll();
      const app = new Application({
        config,
        paths: createAppPaths({ rootDir: directory }),
        websocket: () => () => ({
          onMessage: (event, socket) =>
            socket.send(`hub:${String(event.data)}`),
        }),
      });
      app.addRoutes({
        scope: 'root',
        createRouter: () => {
          const router = new Hono();
          router.get('/', (context) => context.text('hub'));
          router.get('/status', (context) => context.text('hub'));
          return router;
        },
      });
      return startApplicationInScope(scope, app);
    },
    proxy: ({ application }) => ({
      match: (pathname) =>
        pathname !== application.publicBasePath &&
        !pathname.startsWith(`${application.publicBasePath}/`),
      target,
    }),
  });
  const app = await definition.create();
  apps.push(app);
  const server = await startNodeAppServer(app, {
    hostname: '127.0.0.1',
    port: 0,
    registerProcessSignals: false,
  });
  servers.push(server);
  return {
    app,
    server,
    url: `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
  };
}

async function listen(server: Server): Promise<URL> {
  servers.push(server);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  return new URL(`http://127.0.0.1:${(server.address() as AddressInfo).port}`);
}

function upgrade(
  origin: string,
  pathname: string,
  browserOrigin: string,
): Promise<{
  status: number;
  headers: IncomingMessage['headers'];
  socket?: import('node:stream').Duplex;
  protocol?: string;
}> {
  return new Promise((resolve, reject) => {
    const req = httpRequest(new URL(pathname, origin), {
      headers: {
        connection: 'Upgrade',
        upgrade: 'websocket',
        'sec-websocket-key': 'dGhlIHNhbXBsZSBub25jZQ==',
        'sec-websocket-version': '13',
        'sec-websocket-protocol': 'test',
        origin: browserOrigin,
        cookie: 'session=demo',
        'x-forwarded-proto': 'https',
      },
    });
    req.once('error', reject);
    req.once('response', (res) => {
      res.resume();
      resolve({ status: res.statusCode!, headers: res.headers });
    });
    req.once('upgrade', (res, socket) =>
      resolve({
        status: res.statusCode!,
        headers: res.headers,
        socket,
        protocol: res.headers['sec-websocket-protocol'] as string,
      }),
    );
    req.end();
  });
}
