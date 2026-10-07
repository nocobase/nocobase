// db-test-portability: sqlite-only — not a test: a server run by hand that keeps its state in a SQLite file under RELEASES_DATA across restarts
/**
 * A small application to exercise the plugin by hand: the HTTP API on `RELEASES_PORT` (14200 by default) with a
 * header sign-in (`x-test-user: admin` is an administrator, any other user a contributor, `x-test-agent: true` an
 * agent), a SQLite file and a real App Host on `RELEASES_HOST_PORT` (14201), all under `RELEASES_DATA`. An
 * environment `local` (Host driver) and `production` (protected, requires approval by `wang`)
 * exist from the start.
 *
 *   RELEASES_DATA=/tmp/releases pnpm exec tsx tests/serve.ts
 *   curl -H 'x-test-user: admin' localhost:14200/api/releases/apps
 */
import { mkdir, writeFile } from 'node:fs/promises';
import http from 'node:http';
import { createRequire } from 'node:module';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { pathToFileURL } from 'node:url';

import { AppHostSupervisor } from '@nocobase/app-host/supervisor';
import { ApiError } from '@nocobase/app-server/router';
import { createDatabaseManager } from '@nocobase/db';
import sqlite from '@nocobase/db-sqlite';
import { Hono } from 'hono';

import { createReleases } from '../server/composition.js';
import {
  createHostDriver,
  writeHostConfig,
} from '../server/drivers/host/driver.js';
import { createDriverRegistry } from '../server/drivers/types.js';
import { createReleasesApi } from '../server/routes/api.js';
import { ROOT, TEST_SECRETS, createFakeApplication } from './harness.js';

const require = createRequire(import.meta.url);
const port = Number(process.env.RELEASES_PORT ?? 14200);
const hostPort = Number(process.env.RELEASES_HOST_PORT ?? 14201);
const dataDir = path.resolve(
  process.env.RELEASES_DATA ?? path.join(ROOT, '.releases-dev'),
);

await mkdir(dataDir, { recursive: true });
const database = createDatabaseManager({
  drivers: { sqlite },
  connections: {
    main: {
      dialect: 'sqlite',
      filename: path.join(dataDir, 'releases.sqlite'),
    },
  },
});
await database
  .createMigrator({
    directory: path.join(ROOT, 'database/migrations'),
    packageName: '@nocobase/app-plugin-releases',
  })
  .latest();

const tsxApi = pathToFileURL(
  path.join(
    path.dirname(require.resolve('tsx/package.json')),
    'dist/esm/api/index.mjs',
  ),
).href;
const entrypoint = path.join(dataDir, 'app-host-entry.mjs');
await writeFile(
  entrypoint,
  `import { register } from ${JSON.stringify(tsxApi)};
register();
await import(${JSON.stringify(new URL('../node_modules/@nocobase/app-host/src/cli.ts', import.meta.url).href)});
`,
);
const host = {
  appRevisionsDir: path.join(dataDir, 'app-revisions'),
  appVolumesDir: path.join(dataDir, 'app-volumes'),
  configPath: path.join(dataDir, 'host', 'config.yml'),
};
const supervisor = AppHostSupervisor.initialize({
  mode: 'managed',
  driver: 'node',
  entrypoint,
  ...host,
  childOutputDir: path.join(dataDir, 'host', 'output'),
  host: '127.0.0.1',
  port: hostPort,
  env: { allow: ['NODE_PATH'] },
});
const drivers = createDriverRegistry();
const artifact = {
  driver: 'fs' as const,
  location: path.join(dataDir, 'artifacts'),
  visibility: 'private' as const,
};
drivers.register(
  createHostDriver({
    hosts: {
      'in-process': {
        controller: supervisor,
        prepare: () =>
          writeHostConfig(host.configPath, {
            artifact,
            appVolumesDir: host.appVolumesDir,
            appRevisionsDir: host.appRevisionsDir,
            controlDir: path.join(dataDir, 'host', 'control'),
            logging: {
              file: { directory: path.join(dataDir, 'host', 'logs') },
            },
          }),
        restartAfterChurn: 50,
      },
    },
  }),
);
const application = createFakeApplication();
application.roles.set('admin', 'admin');
const services = createReleases({
  database,
  config: { artifact, dataDir: path.join(dataDir, 'data') },
  drivers,
  access: () => ({
    ...application,
    permissionsOfUser: (userId) => {
      if (!application.roles.has(userId))
        application.roles.set(userId, 'contributor');
      return application.permissionsOfUser(userId);
    },
    permissionsOf: (identity) => {
      if (!application.roles.has(identity.principal.id))
        application.roles.set(identity.principal.id, 'contributor');
      return application.permissionsOf(identity);
    },
  }),
  secrets: TEST_SECRETS,
});
services.events.subscribe((event) => {
  console.log(`[event] ${event.type}`, 'app' in event ? event.app.id : '');
});
for (const environment of [
  {
    id: 'local',
    name: 'Local Host',
    driver: 'host',
    config: { backend: 'in-process' },
  },
  {
    id: 'production',
    name: 'Production',
    driver: 'host',
    config: { backend: 'in-process' },
    protected: true,
    approvers: ['wang'],
  },
])
  if (!(await services.environments.find(environment.id)))
    await services.environments.create(services.system, environment);
await services.releases.restore();
const sweep = setInterval(() => void services.releases.removeExpired(), 60_000);

const api = createReleasesApi(services, {
  authenticate: async (context, next) => {
    if (!context.req.header('x-test-user'))
      throw new ApiError({
        status: 'UNAUTHENTICATED',
        reason: 'UNAUTHENTICATED',
        domain: 'app',
        message: 'Send x-test-user.',
      });
    await next();
  },
  callerOf: (context) =>
    services.callerOf({
      principal: { type: 'user', id: context.req.header('x-test-user')! },
      subjects:
        context.req.header('x-test-agent') === 'true'
          ? [{ type: 'agent', id: 'agent' }]
          : [{ type: 'authenticated', id: '*' }],
    }),
  securityLog: (event, details) =>
    console.log(`[security] ${event}`, JSON.stringify(details)),
});
const app = new Hono().route('/api/releases', api);
const server = http.createServer((incoming, outgoing) => {
  const url = new URL(
    incoming.url ?? '/',
    `http://${incoming.headers.host ?? '127.0.0.1'}`,
  );
  const headers = new Headers();
  for (let index = 0; index < incoming.rawHeaders.length; index += 2)
    headers.append(
      incoming.rawHeaders[index]!,
      incoming.rawHeaders[index + 1]!,
    );
  const method = incoming.method ?? 'GET';
  const hasBody = method !== 'GET' && method !== 'HEAD';
  void Promise.resolve(
    app.fetch(
      new Request(url, {
        method,
        headers,
        body: hasBody
          ? (Readable.toWeb(incoming) as ReadableStream<Uint8Array>)
          : undefined,
        ...(hasBody ? { duplex: 'half' } : {}),
      } as RequestInit),
    ),
  )
    .then(async (response) => {
      outgoing.writeHead(
        response.status,
        Object.fromEntries(response.headers.entries()),
      );
      if (response.body)
        await pipeline(
          Readable.fromWeb(
            response.body as import('node:stream/web').ReadableStream,
          ),
          outgoing,
        );
      else outgoing.end();
    })
    .catch((error: unknown) => outgoing.destroy(error as Error));
});
server.listen(port, '127.0.0.1', () => {
  console.log(
    `Release management API on http://127.0.0.1:${port}/api/releases`,
  );
  console.log(`App Host on http://127.0.0.1:${hostPort}/<appId>/`);
});

const stop = async (): Promise<void> => {
  clearInterval(sweep);
  server.close();
  await services.releases.shutdown();
  await supervisor.shutdown();
  await database.destroy();
  process.exit(0);
};
process.once('SIGINT', () => void stop());
process.once('SIGTERM', () => void stop());
