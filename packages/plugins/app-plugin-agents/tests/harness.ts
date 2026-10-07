/**
 * A real database for the service and route tests, this plugin's migrations applied, and the services assembled
 * with a clock the test moves. The database is on the dialect `NOCOBASE_TEST_DB_DIALECT` selects, SQLite when it is
 * unset; each harness provisions its own and drops it again.
 *
 * The domain a run works on is faked: subjects of kind `sample` get a fixed context, and how runs end is recorded.
 */
import {
  createSecretsService,
  type SecretsService,
} from '@nocobase/app-server/secrets';
import { randomUUID } from 'node:crypto';
import path from 'node:path';

import {
  HEADERS,
  PROTOCOL_VERSION,
  ProtocolError,
  RUNNER_ROUTES,
} from '@nocobase/agent-protocol';
import type {
  RegisterRequest,
  RunnerFeature,
  AgentTool,
  ToolInfo,
} from '@nocobase/agent-protocol';
import { createTestDatabase } from '@nocobase/app-testing/server';
import type { DatabaseManager } from '@nocobase/db';
import type { MiddlewareHandler } from 'hono';
import { Hono } from 'hono';

import type {
  BusinessKey,
  Scope,
  Page,
  SettingsAction,
  SettingsItem,
} from '../shared/access.js';
import type { AgentInput } from '../shared/agents.js';
import { composeSkillMarkdown } from '../shared/skills.js';
import type { RunnerTrust } from '../shared/runners.js';
import type { DistConfig } from '../server/distribution/index.js';
import type { Run } from '../shared/runs.js';
import { createAgents, type Agents } from '../server/composition.js';
import { memoryDisk } from '../server/core/skills/index.js';
import type { ChatFileStorage } from '../server/core/conversations/index.js';
import type {
  SubjectAssembly,
  SubjectDir,
  SubjectScope,
} from '../server/core/runs/index.js';
import { createAdminRoutes, type AdminEnv } from '../server/routes/admin.js';
import { createChatRoutes } from '../server/routes/chat.js';
import { createModelRoutes } from '../server/online/routes.js';
import { createRunRoutes } from '../server/routes/run.js';
import { createRosterRoutes } from '../server/routes/roster.js';
import {
  createAdminRoutes as createRunnersAdminRoutes,
  type AdminEnv as RunnersAdminEnv,
} from '../server/routes/runners/admin.js';
import { createDistRoutes } from '../server/routes/runners/dist.js';
import { createRunnerRoutes } from '../server/routes/runners/runner.js';

const MIGRATIONS = path.resolve(import.meta.dirname, '../database/migrations');
const PACKAGE = '@nocobase/app-plugin-agents';

/** A `SKILL.md` naming and describing a skill. */
export function skillMd(
  name: string,
  description: string,
  body: string = `# ${name}\n`,
): string {
  return composeSkillMarkdown({ name, description }, body);
}

export interface FakeClock {
  now(): Date;
  advance(ms: number): void;
}

export interface Harness {
  readonly database: DatabaseManager;
  readonly services: Agents;
  /** The services again, for the runners' side (`runners.runners`, `runners.jobs`, `runners.sweeper`). */
  readonly runners: Agents;
  /** One pass of the sweeper, which marks silent runners offline, then sweeps the runs and the jobs. */
  sweep(): Promise<{
    readonly runnersOffline: number;
    readonly requeued: number;
    readonly failed: number;
    readonly cancelled: number;
    readonly jobs: { requeued: number; failed: number; cancelled: number };
  }>;
  readonly clock: FakeClock;
  /** Where the contents of skills' files are stored. */
  readonly disk: ReturnType<typeof memoryDisk>;
  /** The bytes of files sent in chat, by key (`stored`); `removed` the keys deleted. */
  readonly chatFiles: {
    readonly stored: Map<string, Uint8Array>;
    readonly removed: string[];
  };
  /** The API as mounted under `/api`. */
  readonly app: Hono;
  /** Runs that ended, in order, as the work sink heard them. */
  readonly finished: Run[];
  /** Makes the fake context provider throw, to test failed assembly. */
  failAssembly: boolean;
  /** The working directories the fake subject has. */
  dirs: SubjectDir[];
  /** The scopes (a registered `team`) whose variables and skills the fake subject's runs get. */
  scopes: SubjectScope[];
  createAgent(input?: Partial<AgentInput>): Promise<string>;
  registerRunner(options?: RunnerOptions): Promise<RegisteredRunner>;
  enqueue(
    agentId: string,
    subjectId?: string,
    options?: { actorUserId?: string; text?: string },
  ): Promise<string>;
  /**
   * A request to the API (paths without `/api`): JSON body, runner key or run token, and for the people's routes the
   * caller.
   */
  request(
    method: string,
    path: string,
    options?: RequestOptions,
  ): Promise<{ status: number; body: any; headers: Headers }>;
  close(): Promise<void>;
}

export interface RunnerOptions {
  readonly name?: string;
  readonly features?: readonly RunnerFeature[];
  readonly trust?: RunnerTrust;
  readonly ownerUserId?: string | null;
  readonly tools?: readonly ToolInfo[];
  /** The tools the registration token enables; omitted for every tool. */
  readonly enabledTools?: readonly AgentTool[] | null;
  readonly slots?: number;
  /** What its owner's local policy lets it take, as it reports it. */
  readonly policy?: RegisterRequest['policy'];
}

export interface RegisteredRunner {
  readonly runnerId: string;
  readonly key: string;
}

export interface RequestOptions {
  readonly body?: unknown;
  readonly runnerKey?: string;
  readonly runToken?: string;
  /** For the people's routes: who asks, and which settings actions they hold (`agents.agents/read`). */
  readonly user?: string;
  readonly can?: readonly string[];
  /** For the people's routes: the levels of business actions (`agents.agents/edit=related`). */
  readonly scope?: readonly string[];
  readonly headers?: Readonly<Record<string, string>>;
  /** A multipart body in place of `body`. */
  readonly form?: FormData;
}

/**
 * Chat files in memory, standing in for the file plugin's repository: a row as it inserts one (the file's fixed
 * columns and the uploader), its bytes in `bytes` under the row's key.
 */
function memoryChatFiles(
  database: DatabaseManager,
  clock: FakeClock,
): ChatFileStorage & {
  readonly stored: Map<string, Uint8Array>;
  readonly removed: string[];
} {
  const stored = new Map<string, Uint8Array>();
  const removed: string[] = [];
  const read = (key: string): Uint8Array => {
    const found = stored.get(key);
    if (!found) throw new Error(`No stored file ${key}.`);
    return found;
  };
  return {
    stored,
    removed,
    async store(file, uploaderId) {
      const id = randomUUID();
      const key = `chat/${id}`;
      stored.set(key, new Uint8Array(await file.arrayBuffer()));
      const dot = file.name.lastIndexOf('.');
      const at = clock.now();
      await database
        .connection()
        .repository('agChatAttachments')
        .createOne({
          values: {
            id,
            disk: 'memory',
            key,
            filename: file.name,
            ext: dot > 0 ? file.name.slice(dot + 1).toLowerCase() : '',
            mimeType: file.type || 'application/octet-stream',
            size: file.size,
            uploaderId,
            conversationId: null,
            messageId: null,
            createdAt: at,
            updatedAt: at,
          },
        });
      return id;
    },
    bytes: (object) => Promise.resolve(read(object.key)),
    stream: (object) => {
      const data = read(object.key);
      return Promise.resolve(
        new ReadableStream<Uint8Array>({
          start(controller) {
            controller.enqueue(data);
            controller.close();
          },
        }),
      );
    },
    remove: (object) => {
      stored.delete(object.key);
      removed.push(object.key);
      return Promise.resolve();
    },
  };
}

/** A fresh database on the test dialect, with no migrations applied; `drop` removes it. */
export async function openDatabase(): Promise<{
  database: DatabaseManager;
  drop: () => Promise<void>;
}> {
  const testDatabase = await createTestDatabase();
  return {
    database: testDatabase.database,
    drop: () => testDatabase.destroy(),
  };
}

/** A secrets service over a fixed test key. */
export function testSecrets(
  keys: { version: number; key: string }[] = [
    { version: 1, key: 'a'.repeat(64) },
  ],
): SecretsService {
  return createSecretsService({ keys });
}

export async function createHarness(
  options: {
    /** `null` for an application without secrets keys. */
    readonly secrets?: SecretsService | null;
    readonly dist?: DistConfig;
  } = {},
): Promise<Harness> {
  const { database, drop } = await openDatabase();
  await database
    .createMigrator({ directory: MIGRATIONS, packageName: PACKAGE })
    .latest();

  let current = Date.parse('2026-10-01T00:00:00.000Z');
  const clock: FakeClock = {
    now: () => new Date(current),
    advance: (ms) => {
      current += ms;
    },
  };
  let next = 0;
  const idGenerator = {
    generateString: () => String((next += 1)).padStart(8, '0'),
  };
  const disk = memoryDisk();
  const chatFiles = memoryChatFiles(database, clock);
  const services = createAgents({
    database,
    idGenerator,
    chatFiles,
    basePath: () => '/main',
    // The application the tests stand in for: Acme, with its `acme` CLI.
    app: { id: 'acme', name: 'Acme' },
    skillDisk: () => disk,
    ...(options.dist ? { dist: options.dist } : {}),
    ...(options.secrets === null
      ? {}
      : { secrets: options.secrets ?? testSecrets() }),
    clock,
    onError: () => undefined,
  });

  const runners = services;
  const finished: Run[] = [];
  const harness = {
    failAssembly: false,
    dirs: [],
    scopes: [],
  } as {
    failAssembly: boolean;
    dirs: SubjectDir[];
    scopes: SubjectScope[];
  };
  services.subjects.register({
    kind: 'sample',
    title: { key: 'subjects.sample', ns: 'test' },
    path: '/samples/{id}',
    triggers: { nudge: { key: 'triggers.nudge', ns: 'test' } },
    // A made-up sample, rendered as a real one would be.
    preview: {
      assemble: (_conn, claim): Promise<SubjectAssembly> =>
        Promise.resolve({
          subject: {
            key: `SMP-${claim.run.subject.id}`,
            title: '[sample] A sample',
            url: '/samples/sample',
            noun: 'sample',
          },
          task: 'Work on the sample.',
          context: '[sample] Sample context',
          turn: {
            prompt: claim.inputs.map((input) => input.text).join('\n'),
          },
          data: {},
          dirs: [],
          scopes: [],
        }),
    },
    context: {
      assemble(_conn, claim): Promise<SubjectAssembly> {
        if (harness.failAssembly)
          return Promise.reject(new Error('The sample is gone.'));
        return Promise.resolve({
          subject: {
            key: `SMP-${claim.run.subject.id}`,
            url: `/samples/SMP-${claim.run.subject.id}`,
            noun: 'sample',
          },
          task: 'Work on the sample.',
          context: `Sample ${claim.run.subject.id}`,
          turn: {
            prompt: claim.inputs.map((input) => input.text).join('\n'),
          },
          data: { sampleId: claim.run.subject.id },
          dirs: harness.dirs,
          scopes: harness.scopes,
        });
      },
    },
    sink: {
      onRunFinished(_tx, run) {
        finished.push(run);
        return Promise.resolve();
      },
    },
  });

  const guard: MiddlewareHandler<AdminEnv> = async (context, next) => {
    const user = context.req.header('x-test-user');
    if (!user) throw new ProtocolError('UNAUTHORIZED', 'Sign in first.');
    const grants = (context.req.header('x-test-can') ?? '')
      .split(',')
      .filter(Boolean);
    // `agents.agents/edit=related`: the levels of business actions; `related` reaches the caller alone.
    const levels = new Map(
      (context.req.header('x-test-scope') ?? '')
        .split(',')
        .filter(Boolean)
        .map((entry) => entry.split('=') as [string, string]),
    );
    context.set('caller', {
      userId: user,
      can: (item: SettingsItem, action: SettingsAction) =>
        Promise.resolve(
          grants.includes(`${item}/${action}`) ||
            (action === 'read' && grants.includes(`${item}/manage`)),
        ),
      opens: (page: Page) => Promise.resolve(grants.includes(`page/${page}`)),
      scope: (key: BusinessKey) => {
        const level = levels.get(key) ?? 'none';
        return Promise.resolve(
          (level === 'related' ? { users: [user] } : level) as Scope,
        );
      },
    });
    await next();
  };
  // A person as `guard` has it, or a run by its token: the run's owner, and the subject it works on.
  const personOrRun: MiddlewareHandler<AdminEnv> = async (context, next) => {
    const token = context.req.header(HEADERS.runToken);
    if (!token) return guard(context, next);
    const { run } = await services.runs.authenticateToken(token);
    context.set('caller', {
      userId: run.actorUserId,
      can: () => Promise.resolve(false),
      opens: () => Promise.resolve(false),
      scope: () => Promise.resolve('none' as Scope),
      run: { subjectKind: run.subjectKind, subjectId: run.subjectId },
    });
    await next();
  };
  const runnersGuard: MiddlewareHandler<RunnersAdminEnv> = async (
    context,
    next,
  ) => {
    const user = context.req.header('x-test-user');
    if (!user) throw new ProtocolError('UNAUTHORIZED', 'Sign in first.');
    const grants = (context.req.header('x-test-can') ?? '')
      .split(',')
      .filter(Boolean);
    context.set('caller', {
      userId: user,
      can: (item, action) =>
        Promise.resolve(
          grants.includes(`${item}/${action}`) ||
            (action === 'read' && grants.includes(`${item}/manage`)),
        ),
    });
    await next();
  };
  const app = new Hono();
  app.route(
    '/agents/runners',
    createRunnerRoutes(runners, { pollTimeoutMs: 200 }),
  );
  app.route('/agents/runners', createRunnersAdminRoutes(runners, runnersGuard));
  app.route(
    '/agents/dist',
    createDistRoutes(runners, {
      authenticatePerson: async (context, next) => {
        if (!context.req.header('x-test-user'))
          throw new ProtocolError('UNAUTHORIZED', 'Sign in first.');
        await next();
      },
      person: runnersGuard,
    }),
  );
  app.route('/agents', createRunRoutes(services));
  app.route('/agents', createRosterRoutes(services, guard));
  app.route('/agents', createChatRoutes(services, guard, personOrRun));
  app.route('/agents', createModelRoutes(services, guard));
  app.route('/agents', createAdminRoutes(services, guard));

  const request: Harness['request'] = async (method, url, options = {}) => {
    const headers: Record<string, string> = {
      ...(options.form ? {} : { 'content-type': 'application/json' }),
      [HEADERS.protocol]: String(PROTOCOL_VERSION),
      ...(options.headers ?? {}),
    };
    if (options.runnerKey) headers[HEADERS.runnerKey] = options.runnerKey;
    if (options.runToken) headers[HEADERS.runToken] = options.runToken;
    if (options.user) headers['x-test-user'] = options.user;
    if (options.can) headers['x-test-can'] = options.can.join(',');
    if (options.scope) headers['x-test-scope'] = options.scope.join(',');
    const response = await app.request(url, {
      method,
      headers,
      ...(options.form
        ? { body: options.form }
        : options.body === undefined
          ? {}
          : { body: JSON.stringify(options.body) }),
    });
    const text = await response.text();
    const json = (response.headers.get('content-type') ?? '').includes(
      'application/json',
    );
    return {
      status: response.status,
      body: text && json ? (JSON.parse(text) as unknown) : text || null,
      headers: response.headers,
    };
  };

  return Object.assign(harness, {
    database,
    services,
    runners,
    async sweep() {
      return services.sweeper.sweep();
    },
    clock,
    disk,
    chatFiles,
    app,
    finished,
    request,
    async createAgent(input: Partial<AgentInput> = {}) {
      const agent = await services.agents.create('owner', {
        name: 'Coder',
        modelEntries: [{ tool: 'claude', model: null }],
        access: 'everyone',
        ...input,
      });
      return agent.id;
    },
    async registerRunner(options: RunnerOptions = {}) {
      const token = await runners.runners.createRegistrationToken(
        options.ownerUserId === undefined ? 'owner' : options.ownerUserId,
        {
          trust: options.trust ?? 'team',
          ...(options.enabledTools !== undefined
            ? { enabledTools: options.enabledTools }
            : {}),
        },
      );
      const registration: RegisterRequest = {
        registrationToken: token.token,
        name: options.name ?? 'runner',
        hostname: 'host',
        os: 'darwin',
        arch: 'arm64',
        version: '0.0.1',
        protocolVersion: PROTOCOL_VERSION,
        features: [
          ...(options.features ?? [
            'input',
            'checkout',
            'directories',
            'attachments',
            'skills',
            'secrets',
          ]),
        ],
        tools: [
          ...(options.tools ?? [{ kind: 'claude', authenticated: true }]),
        ],
        slots: options.slots ?? 2,
        ...(options.policy ? { policy: options.policy } : {}),
      };
      const response = await request('POST', api(RUNNER_ROUTES.register), {
        body: registration,
      });
      if (response.status !== 200)
        throw new Error(
          `Registration failed: ${JSON.stringify(response.body)}`,
        );
      return {
        runnerId: response.body.data.runnerId as string,
        key: response.body.data.runnerKey as string,
      };
    },
    async enqueue(
      agentId: string,
      subjectId = '1',
      options: { actorUserId?: string; text?: string } = {},
    ) {
      const result = await services.runs.enqueue({
        agentId,
        subject: { kind: 'sample', id: subjectId },
        actorUserId: options.actorUserId ?? 'owner',
        input: {
          type: 'comment',
          actor: { kind: 'user', id: 'owner', name: 'Owner' },
          text: options.text ?? 'Please do it.',
        },
      });
      return result.runId;
    },
    close: drop,
  });
}

/** Claims for a runner without waiting; the run ids claimed. */
export async function claim(
  harness: Harness,
  runner: RegisteredRunner,
  free = 1,
): Promise<any[]> {
  const response = await harness.request('POST', api(RUNNER_ROUTES.claim), {
    runnerKey: runner.key,
    body: { free },
  });
  if (response.status !== 200)
    throw new Error(`Claim failed: ${JSON.stringify(response.body)}`);
  return response.body.data.runs as any[];
}

/** A protocol route as the harness serves it: without the `/api` prefix. */
export function api(route: string): string {
  return route.replace(/^\/api/u, '');
}
