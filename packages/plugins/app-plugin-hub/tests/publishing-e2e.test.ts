// @vitest-environment node

/**
 * End-to-end publishing: the real CLI (`publish`) talks HTTP to the real Hub
 * routes, the real Hub service drives the production `AppHostSupervisor`, and that
 * supervisor spawns a real App Host child process which expands the uploaded
 * artifact and serves the App. No fetch stub and no fake Host controller.
 */

import { createHash } from 'node:crypto';
import http from 'node:http';
import {
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { HubClient, parseRemoteUrl, publish } from '@nocobase/hub-cli';
import { AppHostSupervisor } from '@nocobase/app-host/supervisor';
import { ApiKeyService } from '@nocobase/app-plugin-api-keys/server';
import {
  authenticationToken,
  createAuthentication,
} from '@nocobase/app-plugin-authentication';
import {
  authorizationToken,
  createAppAuthorization,
} from '@nocobase/app-plugin-authorization';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { createMigrator, type DatabaseManager } from '@nocobase/db';
import {
  createTestDatabase,
  type TestDatabase,
} from '@nocobase/app-testing/server';
import { ServiceContainer } from '@nocobase/service-provider';
import { Hono } from 'hono';
import { c as createTar } from 'tar';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  hubApiKeyAuthentication,
  HUB_API_KEY_CONFIG_ID,
} from '../server/api-key-auth.js';
import { registerHubResources } from '../server/authorization.js';
import { apiRoutes } from '../server/routes/index.js';
import {
  HubApiKeyService,
  hubApiKeyServiceToken,
} from '../server/services/api-keys.js';
import { DefaultHubService } from '../server/services/hub.js';
import { hubServiceToken, type HubDeploymentRecord } from '../server/tokens.js';

const AUTH_SECRET = 'test-only-auth-secret-at-least-32-characters';
const APP_ID = 'customer';
const require = createRequire(import.meta.url);

describe('Hub publishing end to end (CLI → Hub HTTP → App Host)', () => {
  let rootDir: string;
  let testDatabase: TestDatabase | undefined;
  let database: DatabaseManager;
  let service: DefaultHubService;
  let supervisor: AppHostSupervisor;
  let server: http.Server;
  let hubUrl: string;
  let apiKey: string;

  beforeAll(async () => {
    rootDir = await mkdtemp(path.join(os.tmpdir(), 'nocobase-hub-e2e-'));
    testDatabase = await createTestDatabase();
    database = testDatabase.database;
    const migrate = (packageName: string, directory: string) =>
      createMigrator({
        database,
        packageName,
        directory: fileURLToPath(new URL(directory, import.meta.url)),
      }).latest();
    await migrate(
      '@nocobase/app-plugin-authentication',
      '../../app-plugin-authentication/database/migrations',
    );
    await migrate(
      '@nocobase/app-plugin-authorization',
      '../../app-plugin-authorization/database/migrations',
    );
    await migrate(
      '@nocobase/app-plugin-api-keys',
      '../../app-plugin-api-keys/database/migrations',
    );
    await migrate('@nocobase/app-plugin-hub', '../database/migrations');

    const connection = database.connection();
    const now = new Date();
    await connection.query
      .insertInto('user')
      .values({
        id: 'admin',
        name: 'admin',
        email: 'admin@example.com',
        username: 'admin',
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
        disabledAt: null,
      })
      .execute();
    const authorization = createAppAuthorization({ connection });
    registerHubResources(authorization, connection);
    await authorization.permissionSets.assign({
      subject: { type: 'user', id: 'admin' },
      permissionSet: 'hub-administrator',
    });
    const authentication = createAuthentication({
      connection,
      secret: AUTH_SECRET,
      baseURL: 'http://localhost:3000',
      plugins: hubApiKeyAuthentication(),
    });
    const hubApiKeys = new HubApiKeyService(
      database,
      authorization,
      new ApiKeyService(authentication, HUB_API_KEY_CONFIG_ID),
      AUTH_SECRET,
    );

    // The production adapter between Hub and the App Host is the supervisor, which
    // spawns the Host as a managed child. The child runs the App Host sources through
    // tsx so the test needs neither a compiled `dist` nor `tsconfig-paths`.
    const entrypoint = await writeAppHostBootstrap(rootDir);
    const hostConfig = {
      enabled: true,
      driver: 'node' as const,
      entrypoint,
      appRevisionsDir: path.join(rootDir, 'app-revisions'),
      appVolumesDir: path.join(rootDir, 'app-volumes'),
      configPath: path.join(rootDir, 'hub', 'host-config.yml'),
      childOutputDir: path.join(rootDir, 'hub', 'host-output'),
      // The Host would otherwise write its log file under this package's cwd.
      logging: { file: { enabled: false } },
      host: '127.0.0.1',
      autoRestart: false,
      startTimeoutMs: 60_000,
    };
    supervisor = AppHostSupervisor.initialize({
      ...hostConfig,
      mode: 'managed',
    });
    service = new DefaultHubService({
      apiKeys: hubApiKeys,
      database,
      hostController: supervisor,
      config: {
        artifact: {
          driver: 'fs',
          location: path.join(rootDir, 'app-artifacts'),
          visibility: 'private',
        },
        host: hostConfig,
      },
    });
    await service.prepare();

    const container = new ServiceContainer();
    container.instance(authenticationToken, authentication);
    container.instance(authorizationToken, authorization);
    container.instance(hubApiKeyServiceToken, hubApiKeys);
    container.instance(hubServiceToken, service);
    const router = await apiRoutes.createRouter({
      container,
    } as AppPluginApplication);
    const app = new Hono().route('/api', router);
    server = await listen(app);
    const address = server.address();
    if (!address || typeof address !== 'object') {
      throw new Error('Hub HTTP server did not expose a TCP address');
    }
    hubUrl = `http://127.0.0.1:${address.port}`;

    await service.createApp({ id: APP_ID, name: 'Customer' }, 'admin');
    apiKey = (
      await hubApiKeys.create('admin', {
        name: 'CI',
        appIds: [APP_ID],
        scopes: ['upload-release', 'deploy'],
      })
    ).secret;
  }, 120_000);

  afterAll(async () => {
    // Release the database even when stopping the server or a service fails,
    // so a failed run does not leave its connections open.
    try {
      await new Promise<void>((resolve, reject) => {
        if (!server) return resolve();
        server.close((error) => (error ? reject(error) : resolve()));
      });
      await service?.shutdown();
      await supervisor?.shutdown();
    } finally {
      try {
        await testDatabase?.destroy();
      } finally {
        await rm(rootDir, { recursive: true, force: true });
      }
    }
  }, 60_000);

  it('uploads, deploys, stops, starts and rolls back an App through the real chain', async () => {
    const first = await createAppProject(rootDir, '1.0.0');
    const second = await createAppProject(rootDir, '2.0.0');
    const target = parseRemoteUrl(`${hubUrl}/apps/${APP_ID}`);
    const deploy = (
      projectRoot: string,
      options: { releaseId?: string } = {},
    ) =>
      publish({
        target,
        apiKey,
        root: projectRoot,
        deploy: true,
        timeout: 120,
        ...options,
      });
    const upload = (projectRoot: string) =>
      publish({ target, apiKey, root: projectRoot, deploy: false });

    // `hub deploy --no-build`: the CLI uploads the archive, deploys its Release
    // and polls the status route until the Host is serving.
    const { result: uploaded } = await deploy(first.root);
    expect(uploaded).toMatchObject({
      version: '1.0.0',
      checksum: first.checksum,
      operationStatus: 'succeeded',
    });
    const firstDeploymentId = uploaded.operationId;
    const firstReleaseId = uploaded.releaseId;
    const firstDeployment = await service.getDeployment(
      APP_ID,
      firstDeploymentId,
    );
    expect(firstDeployment).toMatchObject({
      kind: 'deploy',
      status: 'succeeded',
      releaseId: firstReleaseId,
    });
    expect(await servedVersion()).toBe('1.0.0');
    expect(await revisionNames(hostRevisionsDir())).toEqual([first.checksum]);

    // `hub upload` then `hub deploy --release-id`: the two-step publishing path.
    const { result: secondUpload } = await upload(second.root);
    expect(secondUpload).toMatchObject({
      version: '2.0.0',
      checksum: second.checksum,
      reused: false,
    });
    const secondReleaseId = secondUpload.releaseId;
    expect(secondReleaseId).not.toBe(firstReleaseId);
    const { result: deployed } = await deploy(second.root, {
      releaseId: secondReleaseId,
    });
    expect(deployed).toMatchObject({
      releaseId: secondReleaseId,
      operationStatus: 'succeeded',
    });
    expect(await servedVersion()).toBe('2.0.0');
    expect((await revisionNames(hostRevisionsDir())).sort()).toEqual(
      [first.checksum, second.checksum].sort(),
    );

    // Lifecycle: stopping evicts the runtime on the Host and keeps the deployment,
    // revisions and configuration; starting resumes the current deployment.
    const stopped = await service.stop(APP_ID);
    expect(stopped.deployment.desiredState).toBe('stopped');
    expect(stopped.app.enabled).toBe(false);
    expect(await hostDeploymentState()).toEqual({
      desiredState: 'stopped',
      observedState: 'stopped',
    });
    const started = await service.start(APP_ID);
    expect(started.deployment.desiredState).toBe('running');
    expect(await hostDeploymentState()).toEqual({
      desiredState: 'running',
      observedState: 'running',
    });
    expect(await servedVersion()).toBe('2.0.0');

    // Rollback: a new deployment record of kind `rollback` that points at the
    // earlier deployment and reactivates its Release on the Host.
    const rollback = await service.rollback(APP_ID, {
      deploymentId: firstDeploymentId,
    });
    const finished = await waitForDeployment(APP_ID, rollback.id);
    expect(finished).toMatchObject({
      kind: 'rollback',
      status: 'succeeded',
      releaseId: firstReleaseId,
      rollbackTargetDeploymentId: firstDeploymentId,
    });
    expect(await servedVersion()).toBe('1.0.0');
    const detail = await service.getApp(APP_ID);
    expect(detail.currentVersion).toBe('1.0.0');
    expect(detail.deployment.observedReleaseId).toBe(firstReleaseId);
    const history = await service.listDeployments(APP_ID);
    expect(history.total).toBe(3);
    expect(history.items.map((item) => item.kind)).toEqual([
      'rollback',
      'deploy',
      'deploy',
    ]);

    // `hub releases` and `hub status`: the same key reads what runs and what ran.
    const client = new HubClient({ target, apiKey, timeout: 30 });
    const releases = await client.listReleases(10);
    expect(releases.map((release) => release.releaseId)).toEqual([
      secondReleaseId,
      firstReleaseId,
    ]);
    expect(releases).toMatchObject([
      { version: '2.0.0', running: false, everDeployed: true },
      { version: '1.0.0', running: true, everDeployed: true },
    ]);
    const app = await client.getApp();
    expect(app).toMatchObject({
      currentVersion: '1.0.0',
      runningReleaseId: firstReleaseId,
    });
    expect(app.buildTarget).toMatchObject({ platform: process.platform });
    expect(await client.listDeployments(1)).toMatchObject([
      { kind: 'rollback', status: 'succeeded', releaseId: firstReleaseId },
    ]);
  }, 240_000);

  // Known gap, kept visible: the Host only evicts a stopped App's runtime and
  // leaves its definition enabled, so the next request through the Host
  // re-activates it. The deployment guide promises a stopped App stops serving.
  // The fix lives in a separate app-host pull request; once it lands this
  // expectation starts failing and should become a plain `it`.
  it.fails(
    'refuses requests for a stopped App until it is started again',
    async () => {
      await service.stop(APP_ID);
      expect(await hostDeploymentState()).toMatchObject({
        observedState: 'stopped',
      });
      expect(await requestApp()).not.toBe(200);
    },
    60_000,
  );

  function hostRevisionsDir(): string {
    return path.join(rootDir, 'app-revisions', APP_ID);
  }

  async function hostDeploymentState(): Promise<{
    desiredState: string;
    observedState: string;
  }> {
    const status = await service.hostStatus();
    const deployment = status.deployments.find(
      (candidate) => candidate.appId === APP_ID,
    );
    if (!deployment) throw new Error('The Host does not know the App');
    return {
      desiredState: deployment.desiredState,
      observedState: deployment.observedState,
    };
  }

  async function requestApp(): Promise<number> {
    const target = supervisor.getInfo().targetUrl;
    if (!target) throw new Error('App Host is not running');
    const response = await fetch(new URL(`/${APP_ID}/api/version`, target));
    await response.arrayBuffer();
    return response.status;
  }

  async function servedVersion(): Promise<string> {
    const target = supervisor.getInfo().targetUrl;
    if (!target) throw new Error('App Host is not running');
    const response = await fetch(new URL(`/${APP_ID}/api/version`, target));
    expect(response.status).toBe(200);
    const payload = (await response.json()) as { version: string };
    return payload.version;
  }

  async function waitForDeployment(
    appId: string,
    deploymentId: string,
  ): Promise<HubDeploymentRecord> {
    const deadline = Date.now() + 120_000;
    while (Date.now() < deadline) {
      const deployment = await service.getDeployment(appId, deploymentId);
      if (deployment.status !== 'queued' && deployment.status !== 'deploying') {
        return deployment;
      }
      await new Promise<void>((resolve) => setTimeout(resolve, 50));
    }
    throw new Error('Deployment did not complete.');
  }
});

/**
 * A minimal App project as `pnpm build --tar` leaves it: the archive holds the
 * manifest and an in-process server entry, and sits at the CLI's default path.
 */
async function createAppProject(
  rootDir: string,
  version: string,
): Promise<{ root: string; checksum: string }> {
  const root = path.join(rootDir, `project-${version}`);
  const source = path.join(root, 'build');
  await mkdir(path.join(source, 'dist', 'server'), { recursive: true });
  await mkdir(path.join(root, 'storage', 'exports'), { recursive: true });
  await writeFile(
    path.join(source, 'package.json'),
    JSON.stringify({ name: '@example/customer', version, type: 'module' }),
  );
  await writeFile(
    path.join(source, 'dist', 'server', 'embedded.js'),
    `export function createServer() {
  return { fetch() { return Response.json({ version: ${JSON.stringify(version)} }); } };
}
`,
  );
  const archive = path.join(root, 'storage', 'exports', 'dist.tar.gz');
  await createTar({ cwd: source, file: archive, gzip: true, portable: true }, [
    'package.json',
    'dist/server/embedded.js',
  ]);
  const checksum = createHash('sha256')
    .update(await readFile(archive))
    .digest('hex');
  return { root, checksum };
}

/**
 * The supervisor's `node` driver runs an explicit entrypoint. This one loads tsx and
 * then the App Host CLI source, which is what the `tsx` driver does in development
 * minus the `tsconfig-paths` preload that a plugin checkout does not install.
 */
async function writeAppHostBootstrap(rootDir: string): Promise<string> {
  const tsxApi = pathToFileURL(
    path.join(
      path.dirname(require.resolve('tsx/package.json')),
      'dist/esm/api/index.mjs',
    ),
  ).href;
  // `@nocobase/app-host` does not export its manifest, so resolve the linked
  // workspace package through this plugin's own node_modules.
  const appHostCli = new URL(
    '../node_modules/@nocobase/app-host/src/cli.ts',
    import.meta.url,
  ).href;
  const entrypoint = path.join(rootDir, 'app-host-entry.mjs');
  await writeFile(
    entrypoint,
    `import { register } from ${JSON.stringify(tsxApi)};
register();
await import(${JSON.stringify(appHostCli)});
`,
  );
  return entrypoint;
}

async function revisionNames(directory: string): Promise<string[]> {
  return (await readdir(directory, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() && /^[a-f0-9]{64}$/.test(entry.name))
    .map((entry) => entry.name);
}

/** Serve a Hono app over a real Node listener so the CLI's streamed upload is real HTTP. */
function listen(app: Hono): Promise<http.Server> {
  const server = http.createServer((incoming, outgoing) => {
    const handle = async (): Promise<void> => {
      const url = new URL(
        incoming.url ?? '/',
        `http://${incoming.headers.host ?? '127.0.0.1'}`,
      );
      const headers = new Headers();
      for (let index = 0; index < incoming.rawHeaders.length; index += 2) {
        headers.append(
          incoming.rawHeaders[index],
          incoming.rawHeaders[index + 1],
        );
      }
      const method = incoming.method ?? 'GET';
      const hasBody = method !== 'GET' && method !== 'HEAD';
      const request = new Request(url, {
        method,
        headers,
        body: hasBody
          ? (Readable.toWeb(incoming) as ReadableStream<Uint8Array>)
          : undefined,
        ...(hasBody ? { duplex: 'half' } : {}),
      } as RequestInit);
      const response = await app.fetch(request);
      outgoing.writeHead(
        response.status,
        Object.fromEntries(response.headers.entries()),
      );
      if (response.body) {
        await pipeline(
          Readable.fromWeb(
            response.body as import('node:stream/web').ReadableStream,
          ),
          outgoing,
        );
      } else {
        outgoing.end();
      }
    };
    handle().catch((error: unknown) => {
      outgoing.destroy(
        error instanceof Error ? error : new Error(String(error)),
      );
    });
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}
