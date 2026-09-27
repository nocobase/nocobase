// @vitest-environment node

import { createHash, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import http, { type IncomingMessage } from 'node:http';
import net, { type Socket } from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { runInNewContext } from 'node:vm';

import {
  createServer as createViteServer,
  type ServerOptions,
  type ViteDevServer,
} from 'vite';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  DEFAULT_APP_BASE_PATH,
  normalizeBasePath,
} from '@nocobase/app-server/support';

import { resolveDevTrustedOrigins } from '../../src/tools/scripts/dev/trusted-origins.mjs';

import {
  createDevClientConfigPlugin,
  createDevProxy,
  parseProxyTarget,
} from '../../src/tools/scripts/dev/proxy.mjs';

interface ReceivedRequest {
  body: string;
  host: string | undefined;
  method: string;
  origin: string | undefined;
  referer: string | undefined;
  url: string;
}

interface TestBackend {
  httpRequests: ReceivedRequest[];
  server: http.Server;
  upgradedSockets: Socket[];
  upgrades: ReceivedRequest[];
  url: string;
}

type DevProxy = ServerOptions['proxy'];

const backends: TestBackend[] = [];
const viteServers: ViteDevServer[] = [];
const devEntrySource = readFileSync(
  new URL('../../src/tools/scripts/dev/index.mjs', import.meta.url),
  'utf8',
);

afterEach(async () => {
  await Promise.all(viteServers.splice(0).map((server) => server.close()));
  await Promise.all(
    backends.splice(0).map(async ({ server, upgradedSockets }) => {
      upgradedSockets.forEach((socket) => socket.destroy());
      server.closeAllConnections();
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    }),
  );
});

describe('remote development proxy', () => {
  it('accepts absolute HTTP app base URLs and rejects unsafe targets', () => {
    expect(parseProxyTarget(undefined)).toBeUndefined();
    expect(parseProxyTarget('   ')).toBeUndefined();
    expect(parseProxyTarget(' https://remote.example.com/nocobase/ ')).toEqual(
      new URL('https://remote.example.com/nocobase/'),
    );

    for (const target of [
      '/remote',
      'ftp://remote.example.com/app',
      'https://user:secret@remote.example.com/app',
      'https://remote.example.com/app?tenant=test',
      'https://remote.example.com/app#settings',
    ]) {
      expect(() => parseProxyTarget(target)).toThrow();
    }
  });

  it('does not configure a proxy without a target', () => {
    expect(createDevProxy('/main', undefined)).toBeUndefined();
    expect(createDevProxy('/main/', '   ')).toBeUndefined();
  });

  it('isolates simultaneous proxies on operating-system-assigned ports', async () => {
    const backend = await startBackend();
    const urls = await Promise.all([
      startVite(createDevProxy('/main', backend.url)),
      startVite(createDevProxy('/main', backend.url)),
    ]);

    expect(new Set(urls).size).toBe(2);
    for (const url of urls) {
      const response = await fetch(`${url}/main/api/healthz`);
      expect(await response.json()).toMatchObject({ url: '/api/healthz' });
    }
  });

  it('forwards API traffic to a different remote app base', async () => {
    const backend = await startBackend();
    const devUrl = await startVite(
      createDevProxy('/main/', `${backend.url}/remote/`),
    );

    const response = await fetch(`${devUrl}/main/api/articles?include=author`, {
      body: JSON.stringify({ title: 'Remote development' }),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    });
    const request = (await response.json()) as ReceivedRequest;

    expect(request).toMatchObject({
      body: JSON.stringify({ title: 'Remote development' }),
      host: new URL(backend.url).host,
      method: 'POST',
      url: '/remote/api/articles?include=author',
    });
    expect(response.headers.get('set-cookie')).toContain('Path=/main/');
    expect(response.headers.get('set-cookie')).not.toMatch(/domain=/i);

    const apiRootResponse = await fetch(`${devUrl}/main/api?schema=1`);
    const apiRootRequest = (await apiRootResponse.json()) as ReceivedRequest;
    expect(apiRootRequest.url).toBe('/remote/api?schema=1');

    const forwardedCount = backend.httpRequests.length;
    expect((await fetch(`${devUrl}/main/apiary`)).status).toBe(404);
    expect((await fetch(`${devUrl}/main/ws-console`)).status).toBe(404);
    expect(backend.httpRequests).toHaveLength(forwardedCount);
  });

  it('supports a remote app mounted at the origin root', async () => {
    const backend = await startBackend();
    const devUrl = await startVite(createDevProxy('/', `${backend.url}/`));

    const response = await fetch(`${devUrl}/api/health?verbose=true`);
    const request = (await response.json()) as ReceivedRequest;

    expect(request.url).toBe('/api/health?verbose=true');
    expect(response.headers.get('set-cookie')).toContain('Path=/');
  });

  it('maps same-origin browser headers to the remote application', async () => {
    const backend = await startBackend();
    const devUrl = await startVite(
      createDevProxy('/main', `${backend.url}/remote`),
    );

    const response = await fetch(`${devUrl}/main/api/session`, {
      headers: {
        origin: devUrl,
        referer: `${devUrl}/main/settings/users?tab=roles`,
      },
    });
    const request = (await response.json()) as ReceivedRequest;

    expect(response.status).toBe(200);
    expect(request.origin).toBe(backend.url);
    expect(request.referer).toBe(
      `${backend.url}/remote/settings/users?tab=roles`,
    );
  });

  it('preserves untrusted origins and does not invent a missing origin', async () => {
    const backend = await startBackend();
    const devUrl = await startVite(
      createDevProxy('/main', `${backend.url}/remote`),
    );
    const origins = [
      'https://foreign.example.com',
      'null',
      'not a valid origin',
      devUrl.replace(/^http:/, 'https:'),
    ];
    const localReferer = `${devUrl}/main/settings/users?tab=roles`;

    for (const origin of origins) {
      const response = await fetch(`${devUrl}/main/api/session`, {
        headers: { origin, referer: localReferer },
      });
      const request = (await response.json()) as ReceivedRequest;

      expect(response.status).toBe(403);
      expect(request.origin).toBe(origin);
      expect(request.referer).toBe(localReferer);
    }

    const refererResponse = await fetch(`${devUrl}/main/api/session`, {
      headers: { referer: localReferer },
    });
    const refererRequest = (await refererResponse.json()) as ReceivedRequest;
    expect(refererResponse.status).toBe(200);
    expect(refererRequest.origin).toBeUndefined();
    expect(refererRequest.referer).toBe(
      `${backend.url}/remote/settings/users?tab=roles`,
    );

    const plainResponse = await fetch(`${devUrl}/main/api/session`);
    const plainRequest = (await plainResponse.json()) as ReceivedRequest;
    expect(plainResponse.status).toBe(200);
    expect(plainRequest.origin).toBeUndefined();
    expect(plainRequest.referer).toBeUndefined();
  });

  it('forwards WebSocket upgrades to the remote app base', async () => {
    const backend = await startBackend();
    const devUrl = await startVite(
      createDevProxy('/main', `${backend.url}/remote`),
    );

    const response = await requestUpgrade(
      `${devUrl}/main/ws?channel=notifications`,
      { Origin: devUrl },
    );

    expect(response).toMatch(/^HTTP\/1\.1 101 /);
    expect(backend.upgrades).toEqual([
      expect.objectContaining({
        host: new URL(backend.url).host,
        origin: backend.url,
        url: '/remote/ws?channel=notifications',
      }),
    ]);
  });

  it('preserves a foreign WebSocket origin for backend rejection', async () => {
    const backend = await startBackend();
    const devUrl = await startVite(
      createDevProxy('/main', `${backend.url}/remote`),
    );
    const foreignOrigin = 'https://foreign.example.com';

    const response = await requestUpgrade(`${devUrl}/main/ws`, {
      Origin: foreignOrigin,
    });

    expect(response).toMatch(/^HTTP\/1\.1 403 /);
    expect(backend.upgrades).toEqual([
      expect.objectContaining({ origin: foreignOrigin, url: '/remote/ws' }),
    ]);
  });
});

describe('remote development runner', () => {
  it('uses APP_SERVER_PORT for the local Vite entry in proxy mode', async () => {
    const run = await runDevMode('http://remote.example.com/remote', {
      appServerPort: '13399',
    });

    expect(run.findAvailablePort).toHaveBeenCalledExactlyOnceWith({
      host: '0.0.0.0',
      label: 'Vite dev',
      preferredPort: 13399,
    });
    expect(run.spawnDevProcess).toHaveBeenCalledWith(
      'client',
      'vite',
      ['--host', '0.0.0.0', '--port', '13399', '--strictPort'],
      expect.objectContaining({
        APP_VITE_DEV_PORT: '13399',
        APP_VITE_DEV_URL: 'http://127.0.0.1:13399',
        PROXY_TARGET_URL: 'http://remote.example.com/remote',
      }),
      expect.anything(),
    );
    expect(run.waitForHttpReady).toHaveBeenCalledWith(
      expect.objectContaining({ url: 'http://127.0.0.1:13399/main/' }),
    );
    expect(run.log).toHaveBeenCalledWith(
      '  Local:     http://127.0.0.1:13399/main/',
    );
  });

  it('uses the allocated Vite port everywhere when the preferred port is busy', async () => {
    const run = await runDevMode('http://remote.example.com/remote', {
      appServerPort: '13399',
      vitePortOffset: 1,
    });

    expect(run.spawnDevProcess.mock.calls[0]?.[2]).toContain('13400');
    expect(run.spawnDevProcess.mock.calls[0]?.[3]).toMatchObject({
      APP_VITE_DEV_PORT: '13400',
      APP_VITE_DEV_URL: 'http://127.0.0.1:13400',
    });
    expect(run.waitForHttpReady).toHaveBeenCalledWith(
      expect.objectContaining({ url: 'http://127.0.0.1:13400/main/' }),
    );
    expect(run.log).toHaveBeenCalledWith(
      '  Local:     http://127.0.0.1:13400/main/',
    );
    expect(run.log).toHaveBeenCalledWith(
      '  Vite port 13399 is unavailable; using 13400.',
    );
  });

  it('keeps APP_SERVER_PORT on the backend in normal development', async () => {
    const run = await runDevMode(undefined, { appServerPort: '13399' });

    expect(
      run.findAvailablePort.mock.calls.map(
        ([options]) => options.preferredPort,
      ),
    ).toEqual([5173, 13399]);
    expect(run.spawnDevProcess.mock.calls[0]?.[3]).toMatchObject({
      APP_VITE_DEV_PORT: '5173',
    });
    expect(run.spawnDevProcess.mock.calls[1]?.[3]).toMatchObject({
      APP_SERVER_PORT: '13399',
      BETTER_AUTH_TRUSTED_ORIGINS:
        'http://localhost:13399,http://127.0.0.1:13399',
    });
    expect(run.spawnDevProcess.mock.calls[0]?.[3]).not.toHaveProperty(
      'BETTER_AUTH_TRUSTED_ORIGINS',
    );
    expect(run.log).toHaveBeenCalledWith(
      '  Local:     http://127.0.0.1:13399/main/',
    );
  });

  it('keeps preflight hooks but omits the local backend lifecycle', async () => {
    const run = await runDevMode('http://remote.example.com/remote');

    expect(run.findAvailablePort).toHaveBeenCalledWith(
      expect.objectContaining({ preferredPort: 5173 }),
    );

    expect(
      run.findAvailablePort.mock.calls.map(([options]) => options.label),
    ).toEqual(['Vite dev']);
    expect(
      run.spawnDevProcess.mock.calls.map(([label, command]) => [
        label,
        command,
      ]),
    ).toEqual([['client', 'vite']]);
    expect(run.resolvePluginWatchIncludes).not.toHaveBeenCalled();
    expect(run.resolveConfigWatch).not.toHaveBeenCalled();
    expect(run.watch).not.toHaveBeenCalled();
    expect(
      run.waitForHttpReady.mock.calls.map(([options]) => options.label),
    ).toEqual(['Vite dev server']);
    expect(run.sync).toHaveBeenCalledTimes(1);
  });

  it('starts, watches, and probes the local backend by default', async () => {
    const run = await runDevMode(undefined);

    expect(
      run.findAvailablePort.mock.calls.map(([options]) => options.label),
    ).toEqual(['Vite dev', 'application server']);
    expect(
      run.spawnDevProcess.mock.calls.map(([label, command]) => [
        label,
        command,
      ]),
    ).toEqual([
      ['client', 'vite'],
      ['server', 'tsx'],
    ]);
    expect(run.resolvePluginWatchIncludes).toHaveBeenCalledTimes(1);
    expect(run.resolveConfigWatch).toHaveBeenCalledTimes(1);
    // The configuration file, plus the dependency files an install rewrites.
    expect(run.watch).toHaveBeenCalledTimes(2);
    expect(
      run.waitForHttpReady.mock.calls.map(([options]) => options.label),
    ).toEqual(['Vite dev server', 'Application server']);
    expect(run.sync).toHaveBeenCalledTimes(1);
  });
});

async function startBackend(): Promise<TestBackend> {
  const httpRequests: ReceivedRequest[] = [];
  const upgrades: ReceivedRequest[] = [];
  const upgradedSockets: Socket[] = [];
  const server = http.createServer(async (request, response) => {
    const received = await readRequest(request);
    httpRequests.push(received);
    response.statusCode = acceptsRemoteOrigin(request) ? 200 : 403;
    response.setHeader(
      'set-cookie',
      'nocobase-session=test; Domain=remote.example.com; Path=/remote/',
    );
    response.setHeader('content-type', 'application/json');
    response.end(JSON.stringify(received));
  });
  const backend: TestBackend = {
    httpRequests,
    server,
    upgradedSockets,
    upgrades,
    url: '',
  };
  backends.push(backend);

  server.on('upgrade', (request, socket) => {
    upgradedSockets.push(socket);
    upgrades.push({
      body: '',
      host: request.headers.host,
      method: request.method ?? '',
      origin: request.headers.origin,
      referer: request.headers.referer,
      url: request.url ?? '',
    });

    if (!acceptsRemoteOrigin(request)) {
      socket.end(
        'HTTP/1.1 403 Forbidden\r\nConnection: close\r\nContent-Length: 0\r\n\r\n',
      );
      return;
    }

    const key = request.headers['sec-websocket-key'];
    if (typeof key !== 'string') {
      socket.destroy(new Error('Missing WebSocket key.'));
      return;
    }
    const accept = createHash('sha1')
      .update(`${key}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`)
      .digest('base64');
    socket.write(
      'HTTP/1.1 101 Switching Protocols\r\n' +
        'Upgrade: websocket\r\n' +
        'Connection: Upgrade\r\n' +
        `Sec-WebSocket-Accept: ${accept}\r\n\r\n`,
    );
  });

  backend.url = await listen(server);
  return backend;
}

async function startVite(proxy: DevProxy): Promise<string> {
  const server = await createViteServer({
    appType: 'custom',
    cacheDir: path.join(tmpdir(), `nocobase-dev-proxy-test-${randomUUID()}`),
    configFile: false,
    logLevel: 'silent',
    optimizeDeps: { include: [], noDiscovery: true },
    server: {
      host: '127.0.0.1',
      proxy,
    },
  });
  viteServers.push(server);
  if (!server.httpServer) {
    throw new Error('Expected a standalone Vite HTTP server.');
  }
  // Vite 6's listen() replaces port 0 with 5173. Bind the underlying HTTP
  // server directly so the OS allocates an independent port for each test.
  return listen(server.httpServer);
}

async function listen(server: http.Server): Promise<string> {
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        reject(new Error('Unable to resolve the backend test port.'));
        return;
      }
      resolve(`http://127.0.0.1:${address.port}`);
    });
  });
}

async function readRequest(request: IncomingMessage): Promise<ReceivedRequest> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return {
    body: Buffer.concat(chunks).toString('utf8'),
    host: request.headers.host,
    method: request.method ?? '',
    origin: request.headers.origin,
    referer: request.headers.referer,
    url: request.url ?? '',
  };
}

function acceptsRemoteOrigin(request: IncomingMessage): boolean {
  const expectedOrigin = request.headers.host
    ? `http://${request.headers.host}`
    : undefined;
  if (
    request.headers.origin !== undefined &&
    request.headers.origin !== expectedOrigin
  ) {
    return false;
  }
  if (request.headers.referer !== undefined) {
    try {
      return new URL(request.headers.referer).origin === expectedOrigin;
    } catch {
      return false;
    }
  }
  return true;
}

async function requestUpgrade(
  url: string,
  headers: Record<string, string> = {},
): Promise<string> {
  const target = new URL(url);
  const additionalHeaders = Object.entries(headers)
    .map(([name, value]) => `${name}: ${value}\r\n`)
    .join('');

  return new Promise((resolve, reject) => {
    const socket = net.connect(Number(target.port), target.hostname, () => {
      socket.write(
        `GET ${target.pathname}${target.search} HTTP/1.1\r\n` +
          `Host: ${target.host}\r\n` +
          'Connection: Upgrade\r\n' +
          'Upgrade: websocket\r\n' +
          'Sec-WebSocket-Version: 13\r\n' +
          'Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==\r\n' +
          additionalHeaders +
          '\r\n',
      );
    });
    let response = '';
    const timeout = setTimeout(() => {
      socket.destroy();
      reject(new Error(`Timed out waiting for an upgrade from ${url}.`));
    }, 2_000);

    socket.setEncoding('utf8');
    socket.on('data', (chunk) => {
      response += chunk;
      if (!response.includes('\r\n\r\n')) {
        return;
      }
      clearTimeout(timeout);
      socket.destroy();
      resolve(response);
    });
    socket.once('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

interface DevHook {
  command: string[];
  label: string;
}

async function runDevMode(
  proxyTarget: string | undefined,
  options: {
    appServerPort?: string;
    vitePortOffset?: number;
    watchEnvironment?: Record<string, string>;
  } = {},
) {
  const helpersSource = devEntrySource.slice(
    devEntrySource.indexOf('const toUrlHost ='),
    devEntrySource.indexOf('const pipeViteOutput ='),
  );
  const runtimeSource = devEntrySource.slice(
    devEntrySource.indexOf('const env = loadEnv();'),
  );
  const findAvailablePort = vi.fn(
    async ({
      label,
      preferredPort,
    }: {
      label: string;
      preferredPort: number;
    }) =>
      preferredPort +
      (label === 'Vite dev' ? (options.vitePortOffset ?? 0) : 0),
  );
  const resolvePluginWatchIncludes = vi.fn(() => ['plugins/**']);
  const resolveConfigWatch = vi.fn(() => ({
    directory: '/app',
    filenames: new Set(['config.yml']),
  }));
  const serverStdin = { write: vi.fn() };
  const spawnDevProcess = vi.fn(
    (
      label: string,
      _command: string,
      _args: string[],
      _env: Record<string, string | undefined>,
      _options: unknown,
    ) => ({
      stdin: label === 'server' ? serverStdin : undefined,
    }),
  );
  const sync = vi.fn(
    (_command: string, _args: string[], _options: unknown) => ({ status: 0 }),
  );
  const waitForHttpReady = vi.fn(
    async (options: { label: string; url: string }) => options,
  );
  const watch = vi.fn(() => ({ close: vi.fn() }));
  const hook: DevHook = {
    command: ['pnpm', 'nocobase', 'demo', 'build'],
    label: 'Build plugin artifacts',
  };
  const log = vi.fn();
  const execution = runInNewContext(
    `(async () => {${helpersSource}\n${runtimeSource}})()`,
    {
      console: { error: vi.fn(), log },
      path,
      progress: vi.fn(),
      performance,
      startedAt: performance.now(),
      setInterval,
      clearInterval,
      findAvailablePort,
      resolveDevTrustedOrigins,
      DEFAULT_APP_BASE_PATH,
      normalizeBasePath,
      watchConfigFiles: watch,
      resolveWatchEnvironment: async (env: Record<string, string>) => ({
        ...env,
        ...options.watchEnvironment,
      }),
      loadEnv: () => ({
        APP_BASE_PATH: '/main',
        APP_SERVER_PORT: options.appServerPort,
        PROXY_TARGET_URL: proxyTarget,
      }),
      parseProxyTarget: (value: string | undefined) =>
        value ? new URL(value) : undefined,
      process: {
        exit: vi.fn(),
        stdin: { pipe: vi.fn() },
      },
      readCliHooks: () => ({ dev: { beforeDev: [hook] } }),
      resolveConfigWatch,
      resolveDependencyWatch: () => [
        { directory: '/app', filenames: new Set(['package.json']) },
      ],
      DEPENDENCY_SETTLE_MS: 3000,
      acquireDevInstanceLock: () => ({ acquired: true, release: vi.fn() }),
      // Configuration presence is covered on its own; here it only has to not stop the run.
      assertConfigurationPresent: vi.fn(),
      resolveDevShutdownEnv: () => ({ APP_SHUTDOWN_TIMEOUT_MS: '4000' }),
      setTimeout,
      clearTimeout,
      resolvePluginWatchIncludes,
      rootDir: '/app',
      runHookStage: (
        hooks: { beforeDev: DevHook[] },
        stage: 'beforeDev',
        run: (label: string, command: string, args: string[]) => void,
      ) => {
        for (const entry of hooks[stage]) {
          run(entry.label, entry.command[0], entry.command.slice(1));
        }
      },
      shuttingDown: false,
      spawn: { sync },
      spawnDevProcess,
      viteDevPreferredPort: 5173,
      waitForHttpReady,
    },
  ) as Promise<void>;
  await execution;

  return {
    log,
    findAvailablePort,
    resolveConfigWatch,
    resolvePluginWatchIncludes,
    spawnDevProcess,
    sync,
    waitForHttpReady,
    watch,
  };
}

it('passes polling fallback settings to both development children', async () => {
  const watchEnvironment = {
    CHOKIDAR_USEPOLLING: 'true',
    AGENT_ANNOTATIONS_ENABLED: 'false',
  };
  const run = await runDevMode(undefined, { watchEnvironment });
  expect(run.spawnDevProcess).toHaveBeenCalledTimes(2);
  for (const [, , , env] of run.spawnDevProcess.mock.calls) {
    expect(env).toMatchObject(watchEnvironment);
  }
});

it('passes one resolved mount path to both development children', async () => {
  const run = await runDevMode(undefined, {});
  expect(run.spawnDevProcess).toHaveBeenCalledTimes(2);
  for (const [, , , env] of run.spawnDevProcess.mock.calls) {
    expect(env).toMatchObject({ APP_BASE_PATH: '/main' });
  }
});

describe('the proxy-mode client configuration', () => {
  const remotePage = (config: unknown): string =>
    `<html><head><script id="nocobase-runtime-config" type="application/json">${JSON.stringify(
      config,
    ).replace(/</g, '\\u003C')}</script></head></html>`;

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('is not added without a proxy target', () => {
    expect(createDevClientConfigPlugin('/main', undefined)).toBeUndefined();
  });

  it("renders the remote page's configuration with the local mount path and API", async () => {
    const fetch = vi.fn().mockResolvedValue(
      new Response(
        remotePage({
          version: 1,
          config: {
            app: { basePath: '/crm', title: '</script>' },
            api: { baseURL: '/crm/api' },
          },
          public: { i18n: { defaultLocale: 'zh-CN' } },
        }),
      ),
    );
    vi.stubGlobal('fetch', fetch);
    const plugin = createDevClientConfigPlugin(
      '/main/',
      'https://remote.example.com/crm',
    );

    const tags = (await (
      plugin?.transformIndexHtml as () => Promise<
        { attrs: Record<string, string>; children: string; injectTo: string }[]
      >
    )()) as {
      attrs: Record<string, string>;
      children: string;
      injectTo: string;
    }[];

    expect(fetch).toHaveBeenCalledWith(
      'https://remote.example.com/crm',
      expect.anything(),
    );
    expect(tags[0]?.attrs).toEqual({
      id: 'nocobase-runtime-config',
      type: 'application/json',
    });
    expect(tags[0]?.injectTo).toBe('head-prepend');
    expect(tags[0]?.children).not.toContain('</script>');
    expect(JSON.parse(tags[0]!.children)).toEqual({
      version: 1,
      config: {
        app: { basePath: '/main', title: '</script>' },
        api: { baseURL: '/main/api' },
      },
      public: { i18n: { defaultLocale: 'zh-CN' } },
    });
  });

  it('names the status when the proxy target does not answer with its page', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('<html>maintenance</html>', {
          status: 502,
          statusText: 'Bad Gateway',
        }),
      ),
    );
    const plugin = createDevClientConfigPlugin(
      '/main',
      'https://remote.example.com/crm',
    );

    await expect(
      (plugin?.transformIndexHtml as () => Promise<unknown>)(),
    ).rejects.toThrow('answered 502 Bad Gateway');
  });

  it('names where a redirect to another origin landed', async () => {
    const response = new Response('<html>sign in</html>');
    Object.defineProperty(response, 'url', {
      value: 'https://login.example.com/?return=%2Fcrm',
    });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));
    const plugin = createDevClientConfigPlugin(
      '/main',
      'https://remote.example.com/crm',
    );

    await expect(
      (plugin?.transformIndexHtml as () => Promise<unknown>)(),
    ).rejects.toThrow('redirected to https://login.example.com/?return=%2Fcrm');
  });

  it('refuses a proxy target that serves no client configuration', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('<html></html>')),
    );
    const plugin = createDevClientConfigPlugin(
      '/main',
      'https://remote.example.com/crm',
    );

    await expect(
      (plugin?.transformIndexHtml as () => Promise<unknown>)(),
    ).rejects.toThrow('served no client configuration');
  });
});
