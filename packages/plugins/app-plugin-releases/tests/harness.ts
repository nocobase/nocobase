/**
 * A real database and the plugin's services for tests: a test database with this plugin's migration, a fake access
 * port standing in for the assembling application's roles, an in-memory deployment driver and artifacts on a
 * temporary disk. `createApiServer` serves the HTTP API over a real Node listener with a header-based sign-in.
 */
import {
  createSecretsService,
  type SecretsService,
} from '@nocobase/app-server/secrets';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

import type {
  AuthorizationIdentity,
  KeyScope,
} from '@nocobase/authorization/core';
import { ApiError } from '@nocobase/app-server/router';
import { createTestDatabase } from '@nocobase/app-testing/server';
import type { DatabaseManager } from '@nocobase/db';
import { Hono } from 'hono';
import { c as createTar } from 'tar';

import {
  allPermissions,
  noPermissions,
  type AppAction,
  type BusinessKey,
  type ReleasesPermissions,
  type Scope,
} from '../shared/access.js';
import type { ActorKind, EnvironmentInput } from '../shared/releases.js';
import type { Caller } from '../server/access/caller.js';
import { createReleases, type Releases } from '../server/composition.js';
import {
  createDriverRegistry,
  type AppDeploymentSpec,
  type AppObservedStatus,
  type DeploymentDriver,
  type DriverSession,
} from '../server/drivers/types.js';
import { createReleasesApi } from '../server/routes/api.js';
import type { ReleasesAccess, ReleasesEvent } from '../server/tokens.js';

export const ROOT: string = path.resolve(import.meta.dirname, '..');

/** The roles the fake application knows. */
export type Role = 'admin' | 'contributor' | 'viewer' | 'nobody';

/** What `userId` may do in `role`; a contributor's and a viewer's actions reach the Apps related to them alone. */
export function permissionsFor(
  role: Role,
  userId: string,
): ReleasesPermissions {
  if (role === 'admin') return allPermissions();
  const base = noPermissions();
  if (role === 'nobody') return base;
  const related = (
    actions: readonly AppAction[],
  ): Record<BusinessKey, Scope> => {
    const scopes = { ...base.scopes };
    for (const action of actions)
      scopes[`rel.apps/${action}`] = { users: [userId] };
    return scopes;
  };
  if (role === 'viewer')
    return {
      scopes: related(['view', 'read-logs']),
      settings: { ...base.settings, 'rel.environments/read': true },
      pages: { 'rel-apps': true },
    };
  return {
    scopes: {
      ...related([
        'view',
        'read-logs',
        'configure',
        'upload',
        'deploy',
        'operate',
      ]),
      'rel.apps/create': 'all',
    },
    settings: { ...base.settings, 'rel.environments/read': true },
    pages: { 'rel-apps': true },
  };
}

/** The application side: roles per user, agents, extra related Apps and approvers. */
export interface FakeApplication extends ReleasesAccess {
  readonly roles: Map<string, Role>;
  /** Users whose identities are agents (`principal.id` = user, marked by the identity's subject `agent`). */
  readonly related: Map<string, string[]>;
  approvers?: readonly string[];
}

export function createFakeApplication(): FakeApplication {
  const roles = new Map<string, Role>();
  const related = new Map<string, string[]>();
  const application: FakeApplication = {
    roles,
    related,
    permissionsOf: (identity: AuthorizationIdentity) =>
      Promise.resolve(
        permissionsFor(
          roles.get(identity.principal.id) ?? 'nobody',
          identity.principal.id,
        ),
      ),
    permissionsOfUser: (userId: string) =>
      Promise.resolve(permissionsFor(roles.get(userId) ?? 'nobody', userId)),
    actorKindOf: (identity: AuthorizationIdentity) =>
      identity.subjects.some((subject) => subject.type === 'agent')
        ? 'agent'
        : 'human',
    relatedAppIds: (userIds: readonly string[]) =>
      Promise.resolve(userIds.flatMap((userId) => related.get(userId) ?? [])),
    isRelated: (appId: string, userIds: readonly string[]) =>
      Promise.resolve(
        userIds.some((userId) => (related.get(userId) ?? []).includes(appId)),
      ),
    approversOf: (environment) =>
      Promise.resolve(application.approvers ?? environment.approvers),
  };
  return application;
}

/**
 * A key's scope as the API keys plugin would compile it: the business actions (`rel.apps/upload`, at each of its
 * levels), pages and settings actions it covers, and the Apps it is limited to (all by default).
 */
export function testKeyScope(input: {
  readonly actions?: readonly string[];
  readonly pages?: readonly string[];
  readonly settings?: readonly string[];
  readonly apps?: readonly string[];
}): KeyScope {
  const allowed = new Set<string>([
    ...(input.actions ?? []).flatMap((key) =>
      ['', '.related', '.all'].map((level) => `rel:${key}${level}`),
    ),
    ...(input.pages ?? []).map((page) => `page:${page}/access`),
    ...(input.settings ?? []).map((key) => `settings:${key}`),
  ]);
  return {
    keyId: 'test-key',
    allows: (resource, action) =>
      allowed.has(`${resource.type}:${resource.id}/${action}`),
    objects: (business) =>
      business === 'rel.apps' && input.apps ? input.apps : 'all',
    permissions: [],
  };
}

/** What the fake driver did, for assertions. */
export interface FakeDriverState {
  readonly applied: AppDeploymentSpec[];
  readonly running: Map<string, AppDeploymentSpec>;
  readonly removed: string[];
  readonly restored: AppDeploymentSpec[][];
  /** Versions whose deployment fails. */
  readonly failing: Set<string>;
  /** Outcomes `operation` reports for deployments a previous process left running, by deployment ID. */
  readonly resumable: Map<string, AppObservedStatus>;
  /** What `status` reports instead for an App (an on-demand App stopped or dormant, say). */
  readonly reported: Map<string, Partial<AppObservedStatus>>;
  /** The configuration each App was last asked to reload, as the runtime received it. */
  readonly reloaded: Map<string, string>;
}

/**
 * An in-memory driver: a deployment of a version listed in `failing` fails, others run. It reports what a previous
 * process left `deploying` the way a Host's operation log does (`operation`).
 */
export function createFakeDriver(kind: string = 'fake'): {
  readonly driver: DeploymentDriver;
  readonly state: FakeDriverState;
} {
  const state: FakeDriverState = {
    applied: [],
    running: new Map(),
    removed: [],
    restored: [],
    failing: new Set(),
    resumable: new Map(),
    reported: new Map(),
    reloaded: new Map(),
  };
  const observed = (
    spec: AppDeploymentSpec | undefined,
  ): AppObservedStatus => ({
    state: spec ? 'running' : 'stopped',
    version: spec?.release.version ?? null,
    deploymentId: spec?.deploymentId ?? null,
    startedAt: spec ? new Date().toISOString() : null,
    error: null,
  });
  const driver: DeploymentDriver = {
    kind,
    title: { key: 'drivers.fake', ns: 'test' },
    configSchema: { type: 'object' },
    secretSchema: { type: 'object', properties: { token: { type: 'string' } } },
    capabilities: {
      onDemand: true,
      logs: false,
      urlModes: ['subdomain'],
    },
    validate(config) {
      if (config.invalid) throw new Error('Invalid fake settings.');
    },
    open(environment): Promise<DriverSession> {
      return Promise.resolve({
        check: () =>
          Promise.resolve({
            ok: true,
            details: { secret: environment.secret },
          }),
        async apply(spec, onEvent) {
          state.applied.push(spec);
          // The archive is readable through the artifact source.
          const chunks: Buffer[] = [];
          if (!spec.artifact) throw new Error('The fake runs archives only.');
          for await (const chunk of await spec.artifact.open())
            chunks.push(chunk as Buffer);
          if (
            createHash('sha256').update(Buffer.concat(chunks)).digest('hex') !==
            spec.release.checksum
          )
            throw new Error('Artifact checksum mismatch.');
          onEvent?.({ phase: 'starting', msg: 'starting', sequence: 1 });
          if (state.failing.has(spec.release.version))
            return {
              ...observed(state.running.get(spec.appId)),
              state: 'failed',
              error: 'boom',
            };
          state.running.set(spec.appId, spec);
          onEvent?.({ phase: 'health_check', msg: 'healthy', sequence: 2 });
          return observed(spec);
        },
        start(spec) {
          state.running.set(spec.appId, spec);
          return Promise.resolve(observed(spec));
        },
        stop(appId) {
          state.running.delete(appId);
          return Promise.resolve(observed(undefined));
        },
        restart(appId) {
          return Promise.resolve(observed(state.running.get(appId)));
        },
        reloadConfig(appId, content) {
          state.reloaded.set(appId, content);
          return Promise.resolve();
        },
        remove(appId) {
          state.running.delete(appId);
          state.removed.push(appId);
          return Promise.resolve();
        },
        status(appIds) {
          const result = new Map<string, AppObservedStatus>();
          for (const [appId, spec] of state.running)
            if (!appIds || appIds.includes(appId))
              result.set(appId, {
                ...observed(spec),
                ...state.reported.get(appId),
              });
          return Promise.resolve(result);
        },
        restore(desired) {
          state.restored.push([...desired]);
          for (const spec of desired)
            if (spec.desiredState === 'running')
              state.running.set(spec.appId, spec);
          return Promise.resolve();
        },
        logs: () =>
          Promise.resolve({
            entries: [],
            cursor: '',
            hasMore: false,
            available: false,
            reset: false,
          }),
        operation: ({ deploymentId }) =>
          Promise.resolve(state.resumable.get(deploymentId) ?? null),
        url: (appId) =>
          environment.publicUrl
            ? environment.publicUrl.replace('{appId}', appId)
            : `https://${appId}.fake.test/`,
        close: () => Promise.resolve(),
      });
    },
  };
  return { driver, state };
}

export interface Harness {
  readonly database: DatabaseManager;
  readonly services: Releases;
  readonly application: FakeApplication;
  readonly fake: FakeDriverState;
  readonly events: ReleasesEvent[];
  readonly rootDir: string;
  /** A caller for a user with a role, as a person unless `kind` says otherwise. */
  as(userId: string, role?: Role, kind?: ActorKind): Promise<Caller>;
  environment(input: EnvironmentInput): Promise<void>;
  close(): Promise<void>;
}

/** The secrets service credentials are sealed with in tests. */
export const TEST_SECRETS: SecretsService = createSecretsService({
  keys: [{ version: 1, key: 'f'.repeat(64) }],
});

export async function createHarness(
  options: {
    readonly drivers?: readonly DeploymentDriver[];
    readonly maxArtifactSizeMB?: number;
    readonly rootDir?: string;
    readonly secrets?: SecretsService;
  } = {},
): Promise<Harness> {
  const rootDir =
    options.rootDir ??
    (await mkdtemp(path.join(os.tmpdir(), 'releases-test-')));
  const testDatabase = await createTestDatabase();
  const database = testDatabase.database;
  await database
    .createMigrator({
      directory: path.join(ROOT, 'database/migrations'),
      packageName: '@nocobase/app-plugin-releases',
    })
    .latest();
  const application = createFakeApplication();
  const drivers = createDriverRegistry();
  const fake = createFakeDriver();
  drivers.register(fake.driver);
  for (const driver of options.drivers ?? []) drivers.register(driver);
  const services = createReleases({
    database,
    config: {
      artifact: {
        driver: 'fs',
        location: path.join(rootDir, 'artifacts'),
        visibility: 'private',
      },
      dataDir: path.join(rootDir, 'data'),
      maxArtifactSizeMB: options.maxArtifactSizeMB,
    },
    drivers,
    access: () => application,
    secrets: options.secrets ?? TEST_SECRETS,
  });
  const events: ReleasesEvent[] = [];
  services.events.subscribe((event) => {
    events.push(event);
  });
  return {
    database,
    services,
    application,
    fake: fake.state,
    events,
    rootDir,
    async as(userId, role, kind = 'human') {
      if (role) application.roles.set(userId, role);
      return await services.callerForUser(userId, kind);
    },
    async environment(input) {
      await services.environments.create(services.system, input);
    },
    async close() {
      await services.releases.shutdown();
      await testDatabase.destroy();
      if (!options.rootDir) await rm(rootDir, { recursive: true, force: true });
    },
  };
}

/**
 * A release archive as `pnpm build --tar` leaves it: a manifest and an in-process server entry that answers with its
 * version, optionally with a config template.
 */
export async function createArtifact(
  rootDir: string,
  version: string,
  options: {
    readonly configTemplate?: string;
    readonly body?: string;
    /** Written to `dist/variables.json`, as `pnpm build` does. */
    readonly variables?: unknown;
  } = {},
): Promise<{ readonly bytes: Buffer; readonly checksum: string }> {
  const source = path.join(
    rootDir,
    'sources',
    `${version}-${Math.random().toString(36).slice(2)}`,
  );
  await mkdir(path.join(source, 'dist', 'server'), { recursive: true });
  await writeFile(
    path.join(source, 'package.json'),
    JSON.stringify({ name: '@example/app', version, type: 'module' }),
  );
  await writeFile(
    path.join(source, 'dist', 'server', 'embedded.js'),
    options.body ??
      `export function createServer() {
  return { fetch() { return Response.json({ version: ${JSON.stringify(version)} }); } };
}
`,
  );
  const files = ['package.json', 'dist/server/embedded.js'];
  if (options.variables !== undefined) {
    await writeFile(
      path.join(source, 'dist', 'variables.json'),
      JSON.stringify(options.variables),
    );
    files.push('dist/variables.json');
  }
  if (options.configTemplate !== undefined) {
    await writeFile(
      path.join(source, 'config.example.yml'),
      options.configTemplate,
    );
    files.push('config.example.yml');
  }
  const archive = path.join(source, 'dist.tar.gz');
  await createTar(
    { cwd: source, file: archive, gzip: true, portable: true },
    files,
  );
  const bytes = await readFile(archive);
  return { bytes, checksum: createHash('sha256').update(bytes).digest('hex') };
}

export function streamOf(bytes: Uint8Array): AsyncIterable<Uint8Array> {
  return Readable.from([bytes]);
}

/**
 * Serves the HTTP API with a header sign-in: `x-test-user` is the user, `x-test-agent: true` marks the request as an
 * agent's, and `x-test-key` (JSON, `testKeyScope`'s input) as one made with a scoped API key. Without `x-test-user`
 * the request is unauthenticated (401).
 */
export async function createApiServer(services: Releases): Promise<{
  readonly url: string;
  close(): Promise<void>;
}> {
  const api = createReleasesApi(services, {
    authenticate: async (context, next) => {
      const userId = context.req.header('x-test-user');
      if (!userId)
        throw new ApiError({
          status: 'UNAUTHENTICATED',
          reason: 'UNAUTHENTICATED',
          domain: 'app',
          message: 'Sign in first.',
        });
      await next();
    },
    callerOf: (context) => {
      const scope = context.req.header('x-test-key');
      return services.callerOf({
        principal: { type: 'user', id: context.req.header('x-test-user')! },
        subjects:
          context.req.header('x-test-agent') === 'true'
            ? [{ type: 'agent', id: 'test-agent' }]
            : [{ type: 'authenticated', id: '*' }],
        ...(scope
          ? {
              keyScope: testKeyScope(
                JSON.parse(scope) as Parameters<typeof testKeyScope>[0],
              ),
            }
          : {}),
      });
    },
  });
  const app = new Hono().route('/api/releases', api);
  const server = http.createServer((incoming, outgoing) => {
    const handle = async (): Promise<void> => {
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
      if (response.body)
        await pipeline(
          Readable.fromWeb(
            response.body as import('node:stream/web').ReadableStream,
          ),
          outgoing,
        );
      else outgoing.end();
    };
    handle().catch((error: unknown) => {
      outgoing.destroy(
        error instanceof Error ? error : new Error(String(error)),
      );
    });
  });
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve());
  });
  const address = server.address();
  if (!address || typeof address !== 'object') throw new Error('No address.');
  return {
    url: `http://127.0.0.1:${address.port}/api/releases`,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      }),
  };
}
