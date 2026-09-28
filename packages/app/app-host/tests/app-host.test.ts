import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, expect, it } from 'vitest';

import { createAppHost, type AppHost } from '../dist/index.js';

const tempDirs: string[] = [];
const runningHosts: AppHost[] = [];

afterEach(async () => {
  await Promise.all(
    runningHosts.splice(0).map((host) => host.close('test cleanup')),
  );
  await Promise.all(
    tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
  );
});

// Without an explicit volumes directory the host falls back to
// `<cwd>/storage/apps/volumes`, which is this package's tree under Vitest.
async function createVolumesDir(): Promise<string> {
  const volumesDir = await mkdtemp(
    path.join(os.tmpdir(), 'nocobase-app-host-volumes-'),
  );
  tempDirs.push(volumesDir);
  return volumesDir;
}

it('dispatches non-asset requests to the embedded server with the app mount stripped', async () => {
  const deploymentsDir = await mkdtemp(
    path.join(os.tmpdir(), 'nocobase-app-host-'),
  );
  tempDirs.push(deploymentsDir);

  const appRoot = path.join(deploymentsDir, 'customer');
  await mkdir(path.join(appRoot, 'dist', 'client', 'assets'), {
    recursive: true,
  });
  await mkdir(path.join(appRoot, 'dist', 'server'), { recursive: true });
  await writeFile(
    path.join(appRoot, 'package.json'),
    JSON.stringify({
      name: '@example/customer-app',
      version: '1.2.3',
      type: 'module',
    }),
  );
  await writeFile(
    path.join(appRoot, 'dist', 'client', 'index.html'),
    `<!doctype html><html><head><link rel="stylesheet" href="/main/assets/app.css"><meta property="og:image" content="/main/assets/preview.png"><link rel="preload" href="//cdn.example.com/assets/vendor.js"><link rel="preload" href="https://cdn.example.com/assets/vendor.css"><script src="/customer/assets/already.js"></script></head><body><main>Customer App</main><script type="module" src="/main/assets/app.js"></script></body></html>`,
  );
  await writeFile(
    path.join(appRoot, 'dist', 'client', 'assets', 'app.js'),
    `console.log("customer");`,
  );
  await writeFile(
    path.join(appRoot, 'dist', 'server', 'embedded.js'),
    `
      import { readFile } from "node:fs/promises";
      import path from "node:path";

      export function createServer(scope) {
        return {
          async fetch(request) {
            const url = new URL(request.url);
            if (url.pathname === "/") {
              const html = await readFile(path.join(scope.clientDir, "index.html"), "utf8");
              return new Response(html, {
                headers: {
                  "content-type": "text/html; charset=utf-8",
                  "content-length": String(Buffer.byteLength(html)),
                },
              });
            }

            if (url.pathname === "/redirect") {
              return new Response(null, {
                status: 302,
                headers: { Location: "/install" },
              });
            }

            return Response.json({
              id: scope.id,
              basePath: scope.basePath,
              assetsBasePath: scope.assetsBasePath,
              clientDir: scope.clientDir,
              pathname: url.pathname,
              search: url.search,
            });
          },
        };
      }
    `,
  );

  const host = createAppHost({
    host: '127.0.0.1',
    port: 0,
    appRevisionsDir: deploymentsDir,
    appVolumesDir: await createVolumesDir(),
    idleTtlMs: 60_000,
  });
  runningHosts.push(host);
  await host.start();

  const address = host.server.address();
  if (!address || typeof address !== 'object') {
    throw new Error('App host did not expose a TCP address');
  }

  const response = await fetch(
    `http://127.0.0.1:${address.port}/customer/api/hello?x=1`,
  );
  await expect(response.json()).resolves.toMatchObject({
    id: 'customer',
    basePath: '/customer',
    assetsBasePath: '/customer/assets',
    pathname: '/api/hello',
    search: '?x=1',
  });

  const redirect = await fetch(
    `http://127.0.0.1:${address.port}/customer/redirect`,
    { redirect: 'manual' },
  );
  expect(redirect.status).toBe(302);
  expect(redirect.headers.get('location')).toBe('/customer/install');

  const page = await fetch(`http://127.0.0.1:${address.port}/customer/`);
  const pageHtml = await page.text();
  expect(pageHtml).toContain('Customer App');
  expect(pageHtml).toContain('/customer/assets/app.js');
  expect(pageHtml).toContain('/customer/assets/app.css');
  expect(pageHtml).toContain('/customer/assets/preview.png');
  expect(pageHtml).toContain('/customer/assets/already.js');
  expect(pageHtml).toContain('//cdn.example.com/assets/vendor.js');
  expect(pageHtml).toContain('https://cdn.example.com/assets/vendor.css');
  expect(pageHtml).not.toContain('/main/assets/');
  expect(page.headers.get('content-length')).toBeNull();

  const asset = await fetch(
    `http://127.0.0.1:${address.port}/customer/assets/app.js`,
  );
  expect(asset.headers.get('cache-control')).toContain('immutable');
  await expect(asset.text()).resolves.toContain('customer');
});

it('does not discover a client-only app without a server artifact', async () => {
  const deploymentsDir = await mkdtemp(
    path.join(os.tmpdir(), 'nocobase-app-host-client-'),
  );
  tempDirs.push(deploymentsDir);

  const appRoot = path.join(deploymentsDir, 'customer');
  await mkdir(path.join(appRoot, 'dist', 'client', 'assets'), {
    recursive: true,
  });
  await writeFile(
    path.join(appRoot, 'package.json'),
    JSON.stringify({
      name: '@example/customer-app',
      version: '1.2.3',
      type: 'module',
    }),
  );
  await writeFile(
    path.join(appRoot, 'dist', 'client', 'index.html'),
    `<!doctype html><main>Client only</main>`,
  );
  await writeFile(
    path.join(appRoot, 'dist', 'client', 'assets', 'app.js'),
    `console.log("client-only");`,
  );

  const host = createAppHost({
    host: '127.0.0.1',
    port: 0,
    appRevisionsDir: deploymentsDir,
    appVolumesDir: await createVolumesDir(),
    idleTtlMs: 60_000,
  });
  runningHosts.push(host);
  await host.start();

  expect(host.registry.listDefinitions()).toEqual([]);

  const address = host.server.address();
  if (!address || typeof address !== 'object') {
    throw new Error('App host did not expose a TCP address');
  }

  const root = await fetch(`http://127.0.0.1:${address.port}/customer/`);
  expect(root.status).toBe(404);
});

it('serves a server-only app from dist/server/embedded.js', async () => {
  const deploymentsDir = await mkdtemp(
    path.join(os.tmpdir(), 'nocobase-app-host-server-'),
  );
  tempDirs.push(deploymentsDir);

  const appRoot = path.join(deploymentsDir, 'customer');
  await mkdir(path.join(appRoot, 'dist', 'server'), { recursive: true });
  await writeFile(
    path.join(appRoot, 'package.json'),
    JSON.stringify({
      name: '@example/customer-app',
      version: '1.2.3',
      type: 'module',
    }),
  );
  await writeFile(
    path.join(appRoot, 'dist', 'server', 'embedded.js'),
    `
      export function createServer(scope) {
        return {
          fetch(request) {
            const url = new URL(request.url);
            return Response.json({
              id: scope.id,
              basePath: scope.basePath,
              pathname: url.pathname,
            });
          },
        };
      }
    `,
  );

  const host = createAppHost({
    host: '127.0.0.1',
    port: 0,
    appRevisionsDir: deploymentsDir,
    appVolumesDir: await createVolumesDir(),
    idleTtlMs: 60_000,
  });
  runningHosts.push(host);
  await host.start();

  const address = host.server.address();
  if (!address || typeof address !== 'object') {
    throw new Error('App host did not expose a TCP address');
  }

  const api = await fetch(`http://127.0.0.1:${address.port}/customer/api/info`);
  await expect(api.json()).resolves.toEqual({
    id: 'customer',
    basePath: '/customer',
    pathname: '/api/info',
  });

  const page = await fetch(
    `http://127.0.0.1:${address.port}/customer/dashboard`,
  );
  await expect(page.json()).resolves.toEqual({
    id: 'customer',
    basePath: '/customer',
    pathname: '/dashboard',
  });
});

it('calls registered app disposers when the app is destroyed', async () => {
  const deploymentsDir = await mkdtemp(
    path.join(os.tmpdir(), 'nocobase-app-host-disposer-'),
  );
  tempDirs.push(deploymentsDir);

  const appRoot = path.join(deploymentsDir, 'customer');
  await mkdir(path.join(appRoot, 'dist', 'server'), { recursive: true });
  await writeFile(
    path.join(appRoot, 'package.json'),
    JSON.stringify({
      name: '@example/customer-app',
      version: '1.2.3',
      type: 'module',
    }),
  );
  await writeFile(
    path.join(appRoot, 'dist', 'server', 'embedded.js'),
    `
      import { writeFile } from "node:fs/promises";
      import path from "node:path";

      export function createServer(scope) {
        scope.registerDisposer("customer", () => {
          return writeFile(path.join(scope.rootDir, "disposed.txt"), "disposed");
        });

        return {
          fetch() {
            return Response.json({ ok: true });
          }
        };
      }
    `,
  );

  const host = createAppHost({
    host: '127.0.0.1',
    port: 0,
    appRevisionsDir: deploymentsDir,
    appVolumesDir: await createVolumesDir(),
    idleTtlMs: 60_000,
  });
  runningHosts.push(host);
  await host.start();

  const address = host.server.address();
  if (!address || typeof address !== 'object') {
    throw new Error('App host did not expose a TCP address');
  }

  const response = await fetch(
    `http://127.0.0.1:${address.port}/customer/api/info`,
  );
  await expect(response.json()).resolves.toEqual({ ok: true });

  await host.close('test disposer');
  await expect(
    readFile(path.join(appRoot, 'disposed.txt'), 'utf8'),
  ).resolves.toBe('disposed');
});

it('keeps serving after a streaming response client disconnects', async () => {
  const deploymentsDir = await mkdtemp(
    path.join(os.tmpdir(), 'nocobase-app-host-stream-'),
  );
  tempDirs.push(deploymentsDir);

  const appRoot = path.join(deploymentsDir, 'customer');
  await mkdir(path.join(appRoot, 'dist', 'server'), { recursive: true });
  await writeFile(
    path.join(appRoot, 'package.json'),
    JSON.stringify({
      name: '@example/customer-app',
      version: '1.2.3',
      type: 'module',
    }),
  );
  await writeFile(
    path.join(appRoot, 'dist', 'server', 'embedded.js'),
    `
      export function createServer() {
        return {
          fetch() {
            const encoder = new TextEncoder();
            let timer;

            return new Response(new ReadableStream({
              start(controller) {
                controller.enqueue(encoder.encode("first chunk"));
                timer = setInterval(() => {
                  controller.enqueue(encoder.encode(" next chunk"));
                }, 10);
              },
              cancel() {
                clearInterval(timer);
              },
            }), {
              headers: { "content-type": "text/plain; charset=utf-8" },
            });
          },
        };
      }
    `,
  );

  const host = createAppHost({
    host: '127.0.0.1',
    port: 0,
    appRevisionsDir: deploymentsDir,
    appVolumesDir: await createVolumesDir(),
    idleTtlMs: 60_000,
  });
  runningHosts.push(host);
  await host.start();

  const address = host.server.address();
  if (!address || typeof address !== 'object') {
    throw new Error('App host did not expose a TCP address');
  }

  await fetchAndDisconnectAfterFirstChunk(
    new URL(`http://127.0.0.1:${address.port}/customer/stream`),
  );
  await new Promise((resolve) => setTimeout(resolve, 50));

  const health = await fetchJson(
    new URL(`http://127.0.0.1:${address.port}/__health`),
  );
  expect(health.registered).toBe(1);
});

it('reserves /assets for static files and does not fall through to the server', async () => {
  const deploymentsDir = await mkdtemp(
    path.join(os.tmpdir(), 'nocobase-app-host-assets-'),
  );
  tempDirs.push(deploymentsDir);

  const appRoot = path.join(deploymentsDir, 'customer');
  await mkdir(path.join(appRoot, 'dist', 'client', 'assets'), {
    recursive: true,
  });
  await mkdir(path.join(appRoot, 'dist', 'server'), { recursive: true });
  await writeFile(
    path.join(appRoot, 'package.json'),
    JSON.stringify({
      name: '@example/customer-app',
      version: '1.2.3',
      type: 'module',
    }),
  );
  await writeFile(
    path.join(appRoot, 'dist', 'client', 'assets', 'app.js'),
    `console.log("asset");`,
  );
  await writeFile(
    path.join(appRoot, 'dist', 'server', 'embedded.js'),
    `
      export function createServer() {
        return {
          fetch(request) {
            const url = new URL(request.url);
            return Response.json({ handledByServer: true, pathname: url.pathname });
          },
        };
      }
    `,
  );

  const host = createAppHost({
    host: '127.0.0.1',
    port: 0,
    appRevisionsDir: deploymentsDir,
    appVolumesDir: await createVolumesDir(),
    idleTtlMs: 60_000,
  });
  runningHosts.push(host);
  await host.start();

  const address = host.server.address();
  if (!address || typeof address !== 'object') {
    throw new Error('App host did not expose a TCP address');
  }

  const missingAsset = await fetch(
    `http://127.0.0.1:${address.port}/customer/assets/missing.js`,
  );
  expect(missingAsset.status).toBe(404);
  await expect(missingAsset.json()).resolves.toMatchObject({
    error: 'Not found',
  });

  const postAsset = await fetch(
    `http://127.0.0.1:${address.port}/customer/assets/app.js`,
    { method: 'POST' },
  );
  expect(postAsset.status).toBe(405);

  const serverRoute = await fetch(
    `http://127.0.0.1:${address.port}/customer/static/app.js`,
  );
  await expect(serverRoute.json()).resolves.toEqual({
    handledByServer: true,
    pathname: '/static/app.js',
  });
});

it('serves the packaged app-dist fixture', async () => {
  const deploymentsDir = fileURLToPath(
    new URL('../fixtures/app-dist', import.meta.url),
  );
  const host = createAppHost({
    host: '127.0.0.1',
    port: 0,
    appRevisionsDir: deploymentsDir,
    appVolumesDir: await createVolumesDir(),
    idleTtlMs: 60_000,
  });
  runningHosts.push(host);
  await host.start();

  expect(
    host.registry.listDefinitions().map((definition) => definition.id),
  ).toEqual(
    expect.arrayContaining(['demo', 'koa', 'lifecycle', 'service', 'ws-demo']),
  );

  const address = host.server.address();
  if (!address || typeof address !== 'object') {
    throw new Error('App host did not expose a TCP address');
  }

  const root = await fetch(`http://127.0.0.1:${address.port}/demo/`);
  const rootHtml = await root.text();
  expect(rootHtml).toContain('Demo App');
  expect(rootHtml).toContain('/demo/assets/demo.js');

  const asset = await fetch(
    `http://127.0.0.1:${address.port}/demo/assets/demo.js`,
  );
  await expect(asset.text()).resolves.toContain('demo fixture');

  const api = await fetch(`http://127.0.0.1:${address.port}/demo/api/info`);
  await expect(api.json()).resolves.toMatchObject({
    id: 'demo',
    basePath: '/demo',
    requestPath: '/api/info',
  });

  const service = await fetch(
    `http://127.0.0.1:${address.port}/service/healthz`,
  );
  await expect(service.json()).resolves.toMatchObject({
    id: 'service',
    requestPath: '/healthz',
  });

  const koaInfo = await fetch(
    `http://127.0.0.1:${address.port}/koa/api/info?source=fixture`,
  );
  expect(koaInfo.headers.get('x-koa-middleware')).toBe('active');
  expect(koaInfo.headers.getSetCookie()).toEqual(
    expect.arrayContaining([
      expect.stringContaining('koa-session=fixture'),
      expect.stringContaining('koa-adapter=loopback'),
    ]),
  );
  await expect(koaInfo.json()).resolves.toMatchObject({
    framework: 'koa',
    id: 'koa',
    basePath: '/koa',
    requestPath: '/api/info',
    query: {
      source: 'fixture',
    },
  });

  const koaEcho = await fetch(`http://127.0.0.1:${address.port}/koa/api/echo`, {
    method: 'POST',
    headers: {
      'content-type': 'text/plain; charset=utf-8',
    },
    body: 'hello from app-host',
  });
  expect(koaEcho.status).toBe(201);
  await expect(koaEcho.json()).resolves.toMatchObject({
    body: 'hello from app-host',
    contentType: 'text/plain; charset=utf-8',
    requestPath: '/api/echo',
  });

  const koaRedirect = await fetch(
    `http://127.0.0.1:${address.port}/koa/redirect`,
    {
      redirect: 'manual',
    },
  );
  expect(koaRedirect.status).toBe(302);
  expect(koaRedirect.headers.get('location')).toBe('/koa/api/info');

  const koaStream = await fetch(`http://127.0.0.1:${address.port}/koa/stream`);
  await expect(koaStream.text()).resolves.toBe('Koa stream response');

  const lifecyclePage = await fetch(
    `http://127.0.0.1:${address.port}/lifecycle/`,
  );
  const lifecycleHtml = await lifecyclePage.text();
  expect(lifecycleHtml).toContain('Lifecycle Demo');
  expect(lifecycleHtml).toContain('/lifecycle/assets/lifecycle.js');

  const lifecycle = await fetch(
    `http://127.0.0.1:${address.port}/lifecycle/api/lifecycle`,
  );
  await expect(lifecycle.json()).resolves.toMatchObject({
    id: 'lifecycle',
    basePath: '/lifecycle',
    assetsBasePath: '/lifecycle/assets',
    beforeDestroyHookRegistered: true,
    beforeDestroyCount: 0,
    disposeCount: 0,
    closed: false,
  });

  const wsDemoPage = await fetch(`http://127.0.0.1:${address.port}/ws-demo/`);
  const wsDemoHtml = await wsDemoPage.text();
  expect(wsDemoHtml).toContain('WebSocket Demo App');
  expect(wsDemoHtml).toContain('/ws-demo/assets/ws-demo.js');
  expect(wsDemoHtml).toContain('id="websocket-url"');
  expect(wsDemoHtml).not.toContain('127.0.0.1:3000');

  const wsDemoAsset = await fetch(
    `http://127.0.0.1:${address.port}/ws-demo/assets/ws-demo.js`,
  );
  const wsDemoAssetText = await wsDemoAsset.text();
  expect(wsDemoAssetText).toContain('ws-demo fixture');
  expect(wsDemoAssetText).toContain('targetUrl.protocol');
  expect(wsDemoAssetText).not.toContain('127.0.0.1:3000');

  const wsDemoInfo = await fetch(
    `http://127.0.0.1:${address.port}/ws-demo/api/info`,
  );
  await expect(wsDemoInfo.json()).resolves.toMatchObject({
    id: 'ws-demo',
    basePath: '/ws-demo',
    requestPath: '/api/info',
    websocket: {
      publicUrl: `ws://127.0.0.1:${address.port}/ws-demo/ws`,
      publicPath: '/ws-demo/ws',
      appLocalPath: '/ws',
      status: 'available',
    },
  });

  const wsDemoHealth = await fetch(
    `http://127.0.0.1:${address.port}/ws-demo/healthz`,
  );
  await expect(wsDemoHealth.json()).resolves.toMatchObject({
    ok: true,
    id: 'ws-demo',
    basePath: '/ws-demo',
    requestPath: '/healthz',
  });

  const wsDemoEndpoint = await fetch(
    `http://127.0.0.1:${address.port}/ws-demo/ws`,
  );
  expect(wsDemoEndpoint.status).toBe(426);
  await expect(wsDemoEndpoint.json()).resolves.toMatchObject({
    error: 'WebSocket upgrade required',
    websocket: {
      publicUrl: `ws://127.0.0.1:${address.port}/ws-demo/ws`,
      appLocalPath: '/ws',
    },
  });

  const wsDemoMessage = await readFirstWebSocketMessage(
    `ws://127.0.0.1:${address.port}/ws-demo/ws`,
  );
  expect(wsDemoMessage).toMatch(/\d{4}/);
});

it('serves health information without discovered apps', async () => {
  const deploymentsDir = await mkdtemp(
    path.join(os.tmpdir(), 'nocobase-app-host-empty-'),
  );
  tempDirs.push(deploymentsDir);

  const host = createAppHost({
    host: '127.0.0.1',
    port: 0,
    appRevisionsDir: deploymentsDir,
    appVolumesDir: await createVolumesDir(),
  });
  runningHosts.push(host);
  await host.start();

  const address = host.server.address();
  if (!address || typeof address !== 'object') {
    throw new Error('App host did not expose a TCP address');
  }

  const response = await fetchJson(
    new URL(`http://127.0.0.1:${address.port}/__health`),
  );
  expect(response.registered).toBe(0);
  expect(response.activeTotal).toBe(0);
  expect(response.mode).toBe('standalone');
});

it('does not discover directory apps or expose management HTTP in managed mode', async () => {
  const deploymentsDir = await mkdtemp(
    path.join(os.tmpdir(), 'nocobase-app-host-managed-'),
  );
  tempDirs.push(deploymentsDir);

  await mkdir(path.join(deploymentsDir, 'customer', 'dist', 'server'), {
    recursive: true,
  });
  await writeFile(
    path.join(deploymentsDir, 'customer', 'dist', 'server', 'embedded.js'),
    'export function createServer() { return { fetch() { return new Response("ok"); } }; }',
  );

  const host = createAppHost({
    mode: 'managed',
    host: '127.0.0.1',
    port: 0,
    appRevisionsDir: deploymentsDir,
    appVolumesDir: await createVolumesDir(),
  });
  runningHosts.push(host);
  await host.start();

  expect(host.mode).toBe('managed');
  expect(host.registry.listDefinitions()).toEqual([]);

  const address = host.server.address();
  if (!address || typeof address !== 'object') {
    throw new Error('App host did not expose a TCP address');
  }

  const health = await fetchJson(
    new URL(`http://127.0.0.1:${address.port}/__health`),
  );
  expect(health).toEqual({ status: 'not-ready' });

  const rescan = await fetch(`http://127.0.0.1:${address.port}/__apps/rescan`, {
    method: 'POST',
  });
  expect(rescan.status).toBe(404);
  expect(host.registry.listDefinitions()).toEqual([]);
});

it('exposes app management through /__apps', async () => {
  const deploymentsDir = await mkdtemp(
    path.join(os.tmpdir(), 'nocobase-app-host-management-'),
  );
  tempDirs.push(deploymentsDir);

  const host = createAppHost({
    host: '127.0.0.1',
    port: 0,
    appRevisionsDir: deploymentsDir,
    appVolumesDir: await createVolumesDir(),
  });
  runningHosts.push(host);
  await host.start();

  const address = host.server.address();
  if (!address || typeof address !== 'object') {
    throw new Error('App host did not expose a TCP address');
  }

  const apps = await fetchJson(
    new URL(`http://127.0.0.1:${address.port}/__apps`),
  );
  expect(apps).toEqual({
    active: [],
    definitions: [],
  });
});

function fetchJson(url: URL): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    http
      .get(url, (response) => {
        const chunks: Buffer[] = [];
        response.on('data', (chunk) => {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        });
        response.on('end', () => {
          try {
            resolve(
              JSON.parse(Buffer.concat(chunks).toString('utf8')) as Record<
                string,
                unknown
              >,
            );
          } catch (error) {
            reject(error);
          }
        });
      })
      .once('error', reject);
  });
}

function readFirstWebSocketMessage(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(url);
    const timeout = setTimeout(() => {
      socket.close();
      reject(new Error(`Timed out waiting for WebSocket message from ${url}`));
    }, 2_000);

    socket.addEventListener(
      'message',
      (event) => {
        clearTimeout(timeout);
        socket.close();
        resolve(
          typeof event.data === 'string' ? event.data : String(event.data),
        );
      },
      { once: true },
    );
    socket.addEventListener(
      'error',
      () => {
        clearTimeout(timeout);
        reject(new Error(`WebSocket connection failed for ${url}`));
      },
      { once: true },
    );
  });
}

function fetchAndDisconnectAfterFirstChunk(url: URL): Promise<void> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const request = http
      .get(url, (response) => {
        response.once('data', () => {
          settled = true;
          request.destroy();
          resolve();
        });
      })
      .once('error', (error: NodeJS.ErrnoException) => {
        if (!settled) {
          reject(error);
        }
      });
  });
}
