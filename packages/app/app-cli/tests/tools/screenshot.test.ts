import { spawn, type ChildProcess } from 'node:child_process';
import { once } from 'node:events';
import {
  access,
  mkdir,
  mkdtemp,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';

import { expect, it } from 'vitest';

import { appRelativeURL } from '../../src/lib/screenshot/server.ts';

const cli = fileURLToPath(new URL('../../bin/run.js', import.meta.url));
const nodeModules = fileURLToPath(
  new URL('../../node_modules/', import.meta.url),
);

function serve(root: string, name: string) {
  const child = spawn(
    process.execPath,
    [cli, 'screenshot', '--serve', '--out', name, '--sample-data'],
    {
      cwd: root,
      env: {
        ...process.env,
        APP_BASE_PATH: '/team/preview',
        APP_STORAGE_DIR: path.join(root, 'ordinary-storage'),
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  const exited = once(child, 'close');
  let stderr = '';
  child.stderr.setEncoding('utf8').on('data', (chunk: string) => {
    stderr += chunk;
  });
  const lines = createInterface({ input: child.stdout });
  const ready = (async () => {
    let url: URL | undefined;
    for await (const line of lines) {
      if (line.startsWith('Local: '))
        url = new URL(line.slice('Local: '.length));
      if (url && line.startsWith('Session: ')) {
        return { url, directory: path.dirname(line.slice('Session: '.length)) };
      }
    }
    throw new Error(`Screenshot server did not start. ${stderr}`);
  })();
  return { child, exited, ready };
}

interface InstanceState {
  pid: number;
  group: number;
  cache: string;
  config: string;
  storage: string;
  adminExists: boolean;
  sampleData: boolean;
  rateLimit: boolean;
  inheritedIntegration?: string;
  extensionFlag?: string;
  viteURL: string;
}

async function state(url: URL): Promise<InstanceState> {
  const response = await fetch(new URL('api/healthz', url));
  expect(response.ok).toBe(true);
  return (await response.json()) as InstanceState;
}

async function stop(
  child: ChildProcess,
  exited: Promise<unknown>,
  signal: NodeJS.Signals,
) {
  if (child.exitCode === null && child.signalCode === null) child.kill(signal);
  return exited;
}

it.skipIf(process.platform === 'win32')(
  'starts two instances on distinct ports and caches, and SIGINT reaps only its own process group',
  { timeout: 30_000 },
  async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'screenshot-app-'));
    try {
      await mkdir(path.join(root, 'server'));
      await symlink(nodeModules, path.join(root, 'node_modules'), 'dir');
      await Promise.all([
        writeFile(
          path.join(root, 'package.json'),
          JSON.stringify({
            type: 'module',
            nocobase: {
              templateKind: 'test',
              screenshot: {
                env: { SCREENSHOT_EXTENSION_FLAG: 'enabled' },
                readyPath: '/api/ready',
              },
            },
          }),
        ),
        writeFile(
          path.join(root, '.env'),
          'APP_BASE_PATH=/dotenv\nDB_DIALECT=postgres\nSCREENSHOT_ORDINARY_INTEGRATION=enabled\n',
        ),
        writeFile(path.join(root, 'config.yml'), 'ordinary: true\n'),
        writeFile(path.join(root, 'tsconfig.server.json'), '{}'),
        writeFile(
          path.join(root, 'index.html'),
          '<html><body>Vite fixture</body></html>',
        ),
        writeFile(
          path.join(root, 'vite.config.mjs'),
          `
import { mkdirSync } from 'node:fs';
export default {
  base: process.env.APP_BASE_PATH + '/',
  cacheDir: 'ordinary-vite-cache',
  plugins: [{
    name: 'cache-observer',
    configResolved(config) { mkdirSync(config.cacheDir, { recursive: true }); },
    configureServer(server) {
      server.middlewares.use('/cache', (_, response) => {
        response.end(JSON.stringify({ pid: process.pid, cache: server.config.cacheDir }));
      });
    },
  }],
};
`,
        ),
        writeFile(
          path.join(root, 'server/standalone.ts'),
          `
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { loadStandaloneAppEnv } from '@nocobase/app-server/node';
const env = loadStandaloneAppEnv({ rootDir: process.cwd() });
const config = JSON.parse(readFileSync(env.APP_CONFIG_FILE, 'utf8'));
const connection = config.database.connections.main;
const health = {
  ok: connection.dialect === 'sqlite' && env.DB_DIALECT === 'sqlite',
  pid: process.pid,
  group: process.ppid,
  cache: env.NOCOBASE_SCREENSHOT_VITE_CACHE,
  config: env.APP_CONFIG_FILE,
  storage: env.APP_STORAGE_DIR,
  adminExists: Boolean(config.users.initialAdmin.email && config.users.initialAdmin.password),
  sampleData: config.app.sampleData,
  rateLimit: config.auth.rateLimit.enabled,
  inheritedIntegration: env.SCREENSHOT_ORDINARY_INTEGRATION,
  extensionFlag: env.SCREENSHOT_EXTENSION_FLAG,
  viteURL: env.APP_VITE_DEV_URL,
};
const server = createServer((request, response) => {
  if (request.url === '/team/preview/api/healthz' || request.url === '/team/preview/api/ready') response.end(JSON.stringify(health));
  else { response.statusCode = 404; response.end(); }
});
server.listen(Number(env.APP_SERVER_PORT), env.APP_SERVER_HOST);
`,
        ),
      ]);
      const first = serve(root, 'first');
      const second = serve(root, 'second');
      try {
        const [a, b] = await Promise.all([first.ready, second.ready]);
        expect(a.url.pathname).toBe('/team/preview/');
        expect(b.url.pathname).toBe(a.url.pathname);
        const [stateA, stateB] = await Promise.all([
          state(a.url),
          state(b.url),
        ]);
        expect(
          new Set([
            a.url.port,
            b.url.port,
            new URL(stateA.viteURL).port,
            new URL(stateB.viteURL).port,
          ]).size,
        ).toBe(4);
        expect(stateA).toMatchObject({
          cache: path.join(a.directory, 'vite'),
          config: path.join(a.directory, 'config.yml'),
          storage: path.join(a.directory, 'storage'),
          adminExists: true,
          sampleData: true,
          rateLimit: false,
          extensionFlag: 'enabled',
        });
        expect(stateA.inheritedIntegration).toBeUndefined();
        expect(stateB.cache).toBe(path.join(b.directory, 'vite'));
        const response = await fetch(new URL('/cache', stateA.viteURL));
        const vite = (await response.json()) as { pid: number; cache: string };
        expect(vite.cache).toBe(stateA.cache);
        await expect(
          access(path.join(root, 'ordinary-vite-cache')),
        ).rejects.toMatchObject({ code: 'ENOENT' });
        await expect(
          access(path.join(root, 'ordinary-storage')),
        ).rejects.toMatchObject({ code: 'ENOENT' });

        await expect(
          stop(first.child, first.exited, 'SIGINT'),
        ).resolves.toEqual([130, null]);
        await expect(access(a.directory)).rejects.toMatchObject({
          code: 'ENOENT',
        });
        for (const pid of [stateA.pid, stateA.group, vite.pid]) {
          expect(() => process.kill(pid, 0)).toThrow(/ESRCH/u);
        }
        expect(await state(b.url)).toEqual(stateB);
        await expect(access(stateB.cache)).resolves.toBeUndefined();

        await expect(
          stop(second.child, second.exited, 'SIGTERM'),
        ).resolves.toEqual([143, null]);
        await expect(access(b.directory)).rejects.toMatchObject({
          code: 'ENOENT',
        });
      } finally {
        await Promise.all([
          stop(first.child, first.exited, 'SIGTERM'),
          stop(second.child, second.exited, 'SIGTERM'),
        ]);
      }
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  },
);

it('keeps screenshot and hook request paths under the application mount', () => {
  const base = new URL('http://127.0.0.1:33127/team/preview/');
  expect(appRelativeURL(base, '/details?id=1').href).toBe(
    `${base.href}details?id=1`,
  );
  for (const route of [
    'https://example.com',
    '//example.com',
    '/..',
    '/%2e%2e/',
    '\\evil',
  ]) {
    expect(() => appRelativeURL(base, route)).toThrow();
  }
});
