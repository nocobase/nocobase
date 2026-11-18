import { test as base } from '@playwright/test';
import { createTestApp, type TestApp } from '@nocobase/app-testing/server';
import { startNodeAppServer } from '@nocobase/app-server/node';
import { createServer as createViteServer, type ViteDevServer } from 'vite';
import { createServer as createPortReservation } from 'node:net';
import type { Server } from 'node:http';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { randomBytes } from 'node:crypto';
import path from 'node:path';
import { createStandaloneServer } from '../../server/standalone.js';

const basePath = '/page-freshness';
interface FreshnessApplication {
  url: string;
  app: TestApp;
  credentials: { username: string; password: string };
}

export const test = base.extend<
  { freshness: FreshnessApplication },
  { frontend: string }
>({
  // Only transformed frontend modules are shared. Every test gets its own server, storage and databases.
  frontend: [
    async ({ browserName }, run) => {
      const directory = await mkdtemp(
        path.join(tmpdir(), `page-freshness-${browserName}-`),
      );
      const root = path.resolve(import.meta.dirname, '../..');
      const environment = {
        APP_BASE_PATH: process.env.APP_BASE_PATH,
        PROXY_TARGET_URL: process.env.PROXY_TARGET_URL,
      };
      process.env.APP_BASE_PATH = basePath;
      delete process.env.PROXY_TARGET_URL;
      let vite: ViteDevServer | undefined;
      try {
        vite = await createViteServer({
          root,
          configFile: path.join(root, 'vite.config.ts'),
          cacheDir: path.join(directory, 'node_modules/.vite'),
          server: {
            host: '127.0.0.1',
            port: 0,
            warmup: {
              clientFiles: [
                './client/index.tsx',
                './client/pages/workflows/*.tsx',
                './client/pages/customer-contacts/*.tsx',
              ],
            },
          },
        });
        await vite.listen();
        await vite.waitForRequestsIdle();
        const address = vite.httpServer!.address();
        if (!address || typeof address === 'string')
          throw new Error('Vite did not bind a TCP port.');
        await run(`http://127.0.0.1:${address.port}`);
      } finally {
        try {
          await vite?.close();
        } finally {
          try {
            await rm(directory, { recursive: true, force: true });
          } finally {
            for (const [name, value] of Object.entries(environment)) {
              if (value === undefined) delete process.env[name];
              else process.env[name] = value;
            }
          }
        }
      }
    },
    { scope: 'worker' },
  ],
  freshness: async ({ browserName, context, frontend }, run) => {
    let app: TestApp | undefined;
    let http: Server | undefined;
    const errors: unknown[] = [];
    try {
      const reservation = createPortReservation();
      await new Promise<void>((resolve) =>
        reservation.listen(0, '127.0.0.1', resolve),
      );
      const address = reservation.address();
      if (!address || typeof address === 'string')
        throw new Error('The application port reservation failed.');
      await new Promise<void>((resolve, reject) =>
        reservation.close((error) => (error ? reject(error) : resolve())),
      );
      const origin = `http://127.0.0.1:${address.port}`;
      const credentials = {
        username: `freshness_${browserName}`,
        password: 'Synthetic-page-freshness-password',
      };
      app = await createTestApp({
        createServer: createStandaloneServer,
        connections: ['main', 'analytics'],
        server: {
          viteDevUrl: frontend,
          env: { APP_BASE_PATH: basePath, APP_PUBLIC_ORIGIN: origin },
        },
        config: {
          secrets: {
            keys: [{ version: 1, key: randomBytes(32).toString('hex') }],
          },
          logging: { enabled: false },
          app: { publicOrigin: origin },
          i18n: { defaultLocale: 'en-US' },
          users: {
            initialAdmin: {
              ...credentials,
              email: 'page-freshness@example.test',
            },
          },
        },
      });
      http = (await startNodeAppServer(app.server, {
        hostname: '127.0.0.1',
        port: address.port,
        registerProcessSignals: false,
      })) as Server;
      await run({ url: `${origin}${app.publicBasePath}`, app, credentials });
    } finally {
      for (const release of [
        () => context.close(),
        () => app?.close(),
        async () => {
          http?.closeAllConnections();
          if (http)
            await new Promise<void>((resolve, reject) =>
              http!.close((error) => (error ? reject(error) : resolve())),
            );
        },
      ]) {
        try {
          await release();
        } catch (error) {
          errors.push(error);
        }
      }
    }
    if (errors.length)
      throw new AggregateError(errors, 'Browser application cleanup failed.');
  },
});
