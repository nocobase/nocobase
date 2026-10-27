// @vitest-environment node
import { isToolUIPart } from 'ai';
import { z } from 'zod';
import {
  createCommandContext,
  InMemoryFs,
} from '../server/vendor/just-bash.js';
import { cliCommand } from '../server/online/sandbox/cli-command.js';
import { NativeToolExecution } from '../server/online/sandbox/execution.js';
import type { NativeExecution } from '../server/online/agent/native/types.js';
import type { OnlineAgentToolExecution } from '../server/online/agent/types.js';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MockLanguageModelV4 } from 'ai/test';
type StreamPart =
  Awaited<
    ReturnType<MockLanguageModelV4['doStream']>
  >['stream'] extends ReadableStream<infer Part>
    ? Part
    : never;
import {
  Auth,
  authenticationToken,
  createUserAdministrationService,
} from '@nocobase/app-plugin-authentication/server';
import {
  createAppAuthorization,
  authorizationToken,
} from '@nocobase/app-plugin-authorization';
import {
  ApiDocsService,
  CliService,
  createCliRouter,
} from '@nocobase/app-server/router';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { ServiceContainer } from '@nocobase/service-provider';
import { Hono } from 'hono';
import { claim, createHarness, skillMd, type Harness } from './harness.js';
import { OnlineAgentService } from '../server/online/agent/service.js';
import { createSessionManager } from '../server/online/agent/persistence/manager.js';
import type { OnlineAgentContext } from '../server/online/agent/types.js';
import type { RealtimeOnlineAgent } from '../server/online/agent/contracts.js';
import { createSandboxProvider } from '../server/online/sandbox/provider.js';
import * as sandboxImplementation from '../server/online/sandbox/provider.js';
import { createAgents } from '../server/composition.js';
import type {
  OnlineAgentSandbox,
  OnlineAgentSandboxInput,
  OnlineAgentSandboxProvider,
  OnlineAgentSandboxSkillCatalog,
} from '../server/online/sandbox/types.js';
import { apiRoutes } from '../server/routes/index.js';
import { agentsToken } from '../server/tokens.js';
import { AgentsProvider } from '../server/providers/agents.js';
import {
  OnlineAgentCredentials,
  onlineAgentCredentialsToken,
} from '../server/cli/online-credential.js';
import { HEADERS, redactPatterns } from '@nocobase/agent-protocol';
import {
  runCredentialResolver,
  callerIdentityOf,
  runIdentityOf,
} from '../server/cli/run-credential.js';
import {
  apiDocsToken,
  cliToken,
  describeRoute,
} from '@nocobase/app-server/router';
import { errorHandler } from '../server/kernel/http.js';
import {
  createChatAttachments,
  createChatFileStorage,
} from '../server/core/conversations/attachments.js';

let h: Harness;
let service: OnlineAgentService | undefined;
let agentsProvider: AgentsProvider | undefined;
afterEach(async () => {
  await agentsProvider?.shutdown();
  agentsProvider = undefined;
  await service?.shutdown();
  service = undefined;
  await h?.close();
});
const ref = { modelService: 'fixture', model: 'chat' };
const usage = {
  inputTokens: { total: 1, noCache: 1, cacheRead: 0, cacheWrite: 0 },
  outputTokens: { total: 1, text: 1, reasoning: 0 },
};
const finish = (reason: 'stop' | 'tool-calls'): StreamPart => ({
  type: 'finish',
  usage,
  finishReason: { unified: reason, raw: reason },
});
function stream(parts: StreamPart[]) {
  return {
    stream: new ReadableStream<StreamPart>({
      start(controller) {
        parts.forEach((part) => controller.enqueue(part));
        controller.close();
      },
    }),
  };
}
function answer(value: string) {
  return stream([
    { type: 'text-start', id: 'answer' },
    { type: 'text-delta', id: 'answer', delta: value },
    { type: 'text-end', id: 'answer' },
    finish('stop'),
  ]);
}

async function createPreparedSandbox(
  provider: OnlineAgentSandboxProvider,
  input: OnlineAgentSandboxInput,
): Promise<OnlineAgentSandbox> {
  const prepared = await provider.prepare(input);
  try {
    return await prepared.create();
  } catch (error) {
    prepared.dispose();
    throw error;
  }
}

async function fixture(
  model: MockLanguageModelV4,
  builtinSkills?: OnlineAgentSandboxSkillCatalog,
) {
  h = await createHarness();
  for (const plugin of [
    'app-plugin-authentication',
    'app-plugin-authorization',
  ]) {
    await h.database
      .createMigrator({
        packageName: '@nocobase/' + plugin,
        directory: fileURLToPath(
          new URL('../../' + plugin + '/database/migrations', import.meta.url),
        ),
      })
      .latest();
  }
  const auth = new Auth({
    connection: h.database.connection(),
    secret: 'slice01-isolated-authentication-secret',
    baseURL: 'http://localhost/main/api/auth',
    session: { storeSessionInDatabase: true },
  });
  const authorization = createAppAuthorization({
    database: h.database,
    connection: h.database.connection(),
  });
  const users = createUserAdministrationService({
    auth,
    connection: h.database.connection(),
  });
  async function signIn(name: string) {
    const email = name + '@slice01.invalid';
    const user = await users.create({
      name,
      email,
      password: 'slice01-test-password',
    });
    const response = await auth.handler(
      new Request('http://localhost/main/api/auth/sign-in/email', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          origin: 'http://localhost',
        },
        body: JSON.stringify({ email, password: 'slice01-test-password' }),
      }),
    );
    expect(response.status).toBe(200);
    const cookie = response.headers
      .getSetCookie()
      .map((item) => item.split(';')[0])
      .join('; ');
    const credentials = await auth.getSession(new Headers({ cookie }));
    expect(credentials?.user.id).toBe(user.id);
    return {
      cookie,
      context: {
        user: { id: user.id },
        credentials,
        authorization: authorization.for({
          principal: { type: 'user', id: user.id },
        }),
      } satisfies OnlineAgentContext,
    };
  }
  const alice = await signIn('Alice');
  const bob = await signIn('Bob');
  const attachments = createChatAttachments({
    tx: h.services.tx,
    basePath: () => '/main',
    storage: createChatFileStorage({
      uploader: () => null,
      disks: () => null,
      disk: () => 'local',
    }),
  });
  const sessions = createSessionManager({
    tx: h.services.tx,
    ids: { next: randomUUID },
    attachments: attachments.links,
    now: () => new Date().toISOString(),
  });
  const router = new Hono();
  router.onError(errorHandler);
  const observation: {
    beforeQuery?: () => Promise<void>;
    wrapResponse?: (response: Response) => Response;
    queries: number;
    writes: number;
    loseWriteResponse?: boolean;
  } = {
    queries: 0,
    writes: 0,
  };
  router.use('/api/agents/conversations/:id', async (context, next) => {
    if (context.req.method === 'PATCH') observation.writes++;
    if (context.req.method === 'GET') {
      observation.queries++;
      await observation.beforeQuery?.();
    }
    await next();
    if (context.req.method === 'PATCH' && observation.loseWriteResponse)
      throw new Error('Response lost after the business write committed.');
    if (observation.wrapResponse)
      context.res = observation.wrapResponse(context.res);
  });
  const container = new ServiceContainer();
  const provider = createSandboxProvider({
    skills: h.services.skills,
    builtinSkills,
  });
  const credentials = new OnlineAgentCredentials();
  const wired = createSandboxProvider({
    skills: h.services.skills,
    builtinSkills,
    bin: () => 'acme',
    cli: () => ({
      auth,
      credentials,
      commandsOf: (identity, token) =>
        agentsProvider!['commandsOf'](identity, token),
    }),
  });
  const allocated: OnlineAgentSandbox[] = [];
  const errors: unknown[] = [];
  service = new OnlineAgentService({
    sessions,
    ids: { next: randomUUID },
    model: async () => model,
    defaultModel: async () => ref,
    sandboxProvider: {
      async prepare(input) {
        const prepared = await wired.prepare(input);
        return {
          instructions: prepared.instructions,
          readSkill: (name) => prepared.readSkill(name),
          dispose: () => prepared.dispose(),
          async create() {
            const sandbox = await prepared.create();
            allocated.push(sandbox);
            return sandbox;
          },
        };
      },
    },
    onError: (error) => errors.push(error),
  });
  container.instance(authenticationToken, auth);
  container.instance(authorizationToken, authorization);
  const application = {
    container,
    publicBasePath: '/main',
    appName: 'acme',
    router,
    paths: {
      storage: (...parts: string[]) => '/unused-slice01/' + parts.join('/'),
    },
    config: { get: () => undefined },
  } as unknown as AppPluginApplication;
  const cli = new CliService();
  cli.describe({ bin: 'acme' });
  agentsProvider = new AgentsProvider(application);
  container.instance(onlineAgentCredentialsToken, credentials);
  container.instance(agentsToken, { ...h.services, onlineAgent: service });
  const api = await apiRoutes.createRouter(application);
  api.post(
    '/slice01Echo',
    auth.required({ scopedKeys: true }),
    describeRoute({
      summary: 'Fixture request encoding',
      security: [{ runToken: [] }],
      responses: { 200: { description: 'Encoded request' } },
      'x-cli': false,
    }),
    async (context) =>
      context.json({
        data: {
          contentType: context.req.header('content-type'),
          body: await context.req.text(),
        },
      }),
  );
  const docs = new ApiDocsService();
  docs.attach({
    api,
    describe: () => ({
      info: { title: 'Acme isolated Slice-01', version: '1' },
      servers: [{ url: '/main' }],
    }),
  });
  container.instance(apiDocsToken, docs);
  container.instance(cliToken, cli);
  await agentsProvider.boot();
  router.route('/api', api);
  router.route('/api', createCliRouter(cli, docs));
  // Match production: the public mount owns /main; routerToken exposes app-local paths.
  router.notFound(
    () =>
      new Response('<!doctype html><title>SPA fallback</title>', {
        headers: { 'content-type': 'text/html' },
      }),
  );
  const app = new Hono().route('/main', router);
  async function record() {
    const marker = 'SLICE01_DB_' + randomUUID();
    const target = await service!.realtime(alice.context, { title: marker });
    const row = await h.database
      .connection()
      .query.selectFrom('agConversations')
      .selectAll()
      .where('id', '=', target.sessionId)
      .executeTakeFirstOrThrow();
    expect(row.title).toBe(marker);
    return { marker, id: target.sessionId };
  }
  async function guide(id: string) {
    return h.services.skills.create(alice.context.user.id, {
      content: skillMd(
        'query-record',
        'Query the authorized isolated conversation record.',
        'Read the record using the application CLI: acme conversation get ' +
          id +
          '\nUse its actual title in your answer.',
      ),
    });
  }
  async function send(agent: RealtimeOnlineAgent, cookie: string) {
    const response = await app.request(
      '/main/api/agents/conversations/' + agent.sessionId + '/messages',
      {
        method: 'POST',
        headers: {
          cookie,
          origin: 'http://localhost',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          message: {
            id: randomUUID(),
            role: 'user',
            parts: [
              {
                type: 'text',
                text: 'Follow the selected skill and report the record I may access.',
              },
            ],
          },
        }),
      },
    );
    expect(response.status).toBe(200);
    const output = await response.text();
    await vi.waitFor(async () => expect(await agent.status()).toBe('idle'));
    return output;
  }
  return {
    observation,
    cli,
    app,
    auth,
    credentials: container.resolve(onlineAgentCredentialsToken),
    wired,
    users,
    alice,
    bob,
    service,
    provider,
    allocated,
    sessions,
    errors,
    record,
    guide,
    send,
  };
}

describe('Native Sandbox without application CLI wiring', () => {
  it('exposes default tools without selected Skills and creates the Sandbox only on the first bash call', async () => {
    let step = 0;
    const model = new MockLanguageModelV4({
      doStream: async ({ tools, prompt }) => {
        expect(tools).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ name: 'bash' }),
            expect.objectContaining({ name: 'skill' }),
          ]),
        );
        if (step++ === 0) {
          expect(f.allocated).toHaveLength(0);
          return stream([
            {
              type: 'tool-call',
              toolCallId: 'empty-skill',
              toolName: 'skill',
              input: '{"name":"missing"}',
            },
            finish('tool-calls'),
          ]);
        }
        if (step === 2) {
          expect(f.allocated).toHaveLength(0);
          expect(JSON.stringify(prompt)).toContain('Unknown selected skill.');
          return stream([
            {
              type: 'tool-call',
              toolCallId: 'default-bash',
              toolName: 'bash',
              input: '{"command":"echo DEFAULT_BASH_OK"}',
            },
            finish('tool-calls'),
          ]);
        }
        expect(f.allocated).toHaveLength(1);
        expect(JSON.stringify(prompt)).toContain('DEFAULT_BASH_OK');
        return answer('Default tools worked.');
      },
    });
    const f = await fixture(model);
    const agent = await f.service.realtime(f.alice.context);
    expect(
      (await f.service.configuration(f.alice.context, agent.sessionId)).tool,
    ).toEqual(['bash', 'skill']);
    await f.send(agent, f.alice.cookie);
    expect(f.errors).toEqual([]);
    expect(step).toBe(3);
    await expect(
      f.allocated[0].exec('echo late', { toolCallId: 'late' }),
    ).rejects.toThrow('closed');
  });
  it('assembles one internal Sandbox provider with its own Skills and resolves CLI dependencies only on creation', async () => {
    const f = await fixture(
      new MockLanguageModelV4({ doStream: async () => answer('unused') }),
    );
    const target = await f.record();
    const selected = await f.guide(target.id);
    const create = vi.spyOn(sandboxImplementation, 'createSandboxProvider');
    const cli = vi.fn(() => {
      throw new Error('CLI dependencies unavailable.');
    });
    const composed = createAgents({
      database: h.database,
      idGenerator: { generateString: randomUUID },
      sandbox: { cli },
    });
    try {
      expect(create).toHaveBeenCalledTimes(1);
      expect(create.mock.calls[0][0].skills).toBe(composed.skills);
      expect(cli).not.toHaveBeenCalled();
      const provider = create.mock.results[0].value;
      expect(provider).not.toHaveProperty('create');
      const prepared = await provider.prepare({
        sessionId: 'composition',
        context: {
          ...f.alice.context,
          sessionId: 'composition',
          signal: new AbortController().signal,
        },
        skill: [selected.id],
      });
      try {
        expect((await prepared.readSkill('query-record')).ok).toBe(true);
        expect(cli).not.toHaveBeenCalled();
        await expect(prepared.create()).rejects.toThrow(
          'CLI dependencies unavailable.',
        );
        expect(cli).toHaveBeenCalledTimes(1);
      } finally {
        prepared.dispose();
      }
      const publicApi = await import('../server/online/agent/index.js');
      expect(publicApi).not.toHaveProperty('createSandboxProvider');
      expect(publicApi).not.toHaveProperty('onlineAgentSandboxProviderToken');
    } finally {
      await composed.onlineAgent.shutdown();
      create.mockRestore();
    }
  });

  it('bounds shell output, loops and real execution time and releases after a deadline', async () => {
    const f = await fixture(
      new MockLanguageModelV4({ doStream: async () => answer('unused') }),
    );
    const sandbox = await createPreparedSandbox(f.provider, {
      sessionId: 'limits',
      context: {
        ...f.alice.context,
        sessionId: 'limits',
        signal: new AbortController().signal,
      },
      skill: [],
    });
    try {
      const output = await sandbox.exec("printf '%30000s' x", {
        toolCallId: 'large-output',
      });
      expect(output.output.length).toBeLessThan(25000);
      expect(output.output).toContain('[Output truncated]');
      const loop = await sandbox.exec('while true; do :; done', {
        toolCallId: 'loop',
      });
      expect(loop.ok).toBe(false);
      const started = performance.now();
      const timed = await sandbox
        .exec('sleep 20', { toolCallId: 'deadline' })
        .catch((error) => {
          expect(error).toMatchObject({ name: 'TimeoutError' });
          return { ok: false, exitCode: 124 };
        });
      expect(timed).toMatchObject({ ok: false, exitCode: 124 });
      expect(performance.now() - started).toBeLessThan(14000);
    } finally {
      await sandbox.dispose();
    }
    await expect(
      sandbox.exec('echo released', { toolCallId: 'closed' }),
    ).rejects.toThrow('closed');
  }, 20000);

  it('isolates writable state, protects Skills and cannot access host environment, files, network or runtimes', async () => {
    const f = await fixture(
      new MockLanguageModelV4({ doStream: async () => answer('plain') }),
    );
    const record = await f.record();
    const selected = await f.guide(record.id);
    const make = (id: string) =>
      createPreparedSandbox(f.provider, {
        sessionId: id,
        context: {
          ...f.alice.context,
          sessionId: id,
          signal: new AbortController().signal,
        },
        skill: [selected.id],
      });
    const hostOnlyValue = randomUUID();
    vi.stubEnv('SLICE01_HOST_ONLY_SECRET', hostOnlyValue);
    const a = await make('a');
    const b = await make('b');
    expect(a.instructions).toContain('No application CLI is configured.');
    try {
      expect(
        (
          await a.exec('echo private > /tmp/only-a; cat /tmp/only-a', {
            toolCallId: 'write',
          })
        ).output,
      ).toContain('private');
      expect(
        (await b.exec('cat /tmp/only-a', { toolCallId: 'isolated' })).ok,
      ).toBe(false);
      expect(
        (
          await a.exec('echo overwritten > /skills/query-record/SKILL.md', {
            toolCallId: 'readonly',
          })
        ).ok,
      ).toBe(false);
      expect((await a.readSkill('query-record')).output).toContain(
        'acme conversation get',
      );
      for (const command of [
        'cat /etc/hosts',
        'node -e 1',
        'python -c 1',
        'python3 -c 1',
        'js-exec -c 1',
        'js -e 1',
        'curl http://localhost',
        'sqlite3 /tmp/probe.db',
        'cat /proc/self/environ',
        'echo blocked > /dev/tcp/127.0.0.1/80',
      ])
        expect(
          (await a.exec(command, { toolCallId: 'host-boundary' })).ok,
        ).toBe(false);
      const environment = await a.exec('env', { toolCallId: 'environment' });
      expect(environment.output).not.toContain('SLICE01_HOST_ONLY_SECRET');
      expect(environment.output).not.toContain(hostOnlyValue);
    } finally {
      vi.unstubAllEnvs();
      await a.dispose();
      await b.dispose();
    }
    const agent = await f.service.realtime(f.alice.context);
    await f.send(agent, f.alice.cookie);
    expect(f.allocated).toHaveLength(0);
  });
});

describe('Slice-01 authenticated Skill and application CLI', () => {
  it.each(['manifest', 'brand'] as const)(
    'releases the unified provider credential when %s creation fails',
    async (failure) => {
      const f = await fixture(
        new MockLanguageModelV4({ doStream: async () => answer('unused') }),
      );
      const issue = vi.spyOn(f.credentials, 'issue');
      const commandsOf = vi.fn<
        ReturnType<
          NonNullable<Parameters<typeof createSandboxProvider>[0]['cli']>
        >['commandsOf']
      >(async () => {
        if (failure === 'manifest') throw new Error('Manifest unavailable.');
        return {
          bin: 'invalid brand',
          commands: [],
          send: async () => Response.json({ data: null }),
        };
      });
      const provider = createSandboxProvider({
        skills: h.services.skills,
        cli: () => ({ auth: f.auth, credentials: f.credentials, commandsOf }),
      });
      const prepared = await provider.prepare({
        sessionId: 'creation-failure',
        executionId: 'creation-failure',
        context: {
          ...f.alice.context,
          sessionId: 'creation-failure',
          signal: new AbortController().signal,
        },
        skill: [],
      });
      try {
        expect(issue).not.toHaveBeenCalled();
        expect(commandsOf).not.toHaveBeenCalled();
        await expect(prepared.create()).rejects.toThrow(
          failure === 'manifest'
            ? 'Manifest unavailable.'
            : 'Invalid application CLI brand.',
        );
        expect(issue).toHaveBeenCalledExactlyOnceWith(
          f.alice.context.user.id,
          'creation-failure',
        );
        const lease = issue.mock.results[0].value;
        expect(commandsOf).toHaveBeenCalledWith(
          expect.objectContaining({ userId: f.alice.context.user.id }),
          lease.token,
        );
        expect(() =>
          f.credentials.resolve(
            new Headers({ [HEADERS.runToken]: lease.token }),
          ),
        ).toThrow();
      } finally {
        prepared.dispose();
        issue.mockRestore();
      }
    },
  );

  it('retains the credential after filesystem cleanup fails and releases it on retry while remaining closed', async () => {
    const f = await fixture(
      new MockLanguageModelV4({ doStream: async () => answer('unused') }),
    );
    const issue = vi.spyOn(f.credentials, 'issue');
    const sandbox = await createPreparedSandbox(f.wired, {
      sessionId: 'cleanup-retry',
      context: {
        ...f.alice.context,
        sessionId: 'cleanup-retry',
        signal: new AbortController().signal,
      },
      skill: [],
    });
    const headers = new Headers({
      [HEADERS.runToken]: issue.mock.results[0].value.token,
    });
    const remove = vi
      .spyOn(InMemoryFs.prototype, 'rm')
      .mockRejectedValueOnce(new Error('Filesystem cleanup failed.'));
    try {
      await expect(sandbox.dispose()).rejects.toThrow(
        'Filesystem cleanup failed.',
      );
      expect(await f.credentials.resolve(headers)).toMatchObject({
        type: 'online-agent',
      });
      await expect(
        sandbox.exec('echo forbidden', { toolCallId: 'closed' }),
      ).rejects.toThrow('closed');
      await expect(sandbox.readSkill('anything')).rejects.toThrow('closed');
      await sandbox.dispose();
      expect(() => f.credentials.resolve(headers)).toThrow();
    } finally {
      remove.mockRestore();
      await sandbox.dispose();
      issue.mockRestore();
    }
  });

  it('prepares selected tools and reads Skills without allocating a Sandbox or issuing credentials', async () => {
    let step = 0;
    const model = new MockLanguageModelV4({
      doStream: async () =>
        step++ === 0
          ? stream([
              {
                type: 'tool-call',
                toolCallId: 'guide',
                toolName: 'skill',
                input: '{"name":"query-record"}',
              },
              finish('tool-calls'),
            ])
          : answer('Skill read without using the shell.'),
    });
    const f = await fixture(model);
    const target = await f.record();
    const selected = await f.guide(target.id);
    const issue = vi.spyOn(f.credentials, 'issue');
    f.service.configurator.registerOnlineAgentScope('skill-only-use', {
      tool: ['skill', 'bash'],
      skill: [selected.id],
    });
    try {
      const agent = await f.service.realtime(f.alice.context, {
        scope: ['skill-only-use'],
      });
      await f.send(agent, f.alice.cookie);
      expect(f.errors).toEqual([]);
      expect(issue).not.toHaveBeenCalled();
      expect(f.allocated).toHaveLength(0);
    } finally {
      issue.mockRestore();
    }
  });

  it('shares execution access with ordinary tools, reuses the shell and retains it through the final model output', async () => {
    let step = 0;
    const finalStarted = Promise.withResolvers<void>();
    const finalExit = Promise.withResolvers<void>();
    const executions: OnlineAgentToolExecution[] = [];
    const model = new MockLanguageModelV4({
      doStream: async () => {
        const current = step++ % 5;
        if (current === 0)
          return stream([
            {
              type: 'tool-call',
              toolCallId: 'guide-' + step,
              toolName: 'skill',
              input: '{"name":"query-record"}',
            },
            finish('tool-calls'),
          ]);
        if (current === 1) {
          expect(f.allocated).toHaveLength(Math.floor((step - 1) / 5));
          return stream([
            {
              type: 'tool-call',
              toolCallId: 'query-' + step,
              toolName: 'bash',
              input: JSON.stringify({
                command:
                  'test ! -e /tmp/turn-state && printf shared > /tmp/turn-state && acme conversation get ' +
                  target.id +
                  ' --json',
              }),
            },
            finish('tool-calls'),
          ]);
        }
        if (current === 2)
          return stream([
            {
              type: 'tool-call',
              toolCallId: 'repeat-' + step,
              toolName: 'bash',
              input: '{"command":"cat /tmp/turn-state"}',
            },
            finish('tool-calls'),
          ]);
        if (current === 3)
          return stream([
            {
              type: 'tool-call',
              toolCallId: 'business-' + step,
              toolName: 'execution-probe',
              input: '{}',
            },
            finish('tool-calls'),
          ]);
        return {
          stream: new ReadableStream<StreamPart>({
            async start(controller) {
              controller.enqueue({ type: 'text-start', id: 'txt' });
              controller.enqueue({
                type: 'text-delta',
                id: 'txt',
                delta: 'The verified result is ' + target.marker,
              });
              finalStarted.resolve();
              await finalExit.promise;
              controller.enqueue({ type: 'text-end', id: 'txt' });
              controller.enqueue(finish());
              controller.close();
            },
          }),
        };
      },
    });
    const f = await fixture(model);
    const target = await f.record();
    const selected = await f.guide(target.id);
    const issue = vi.spyOn(f.credentials, 'issue');
    f.service.configurator.registerTool('execution-probe', {
      version: '1',
      definition: {
        inputSchema: z.object({}),
        async execute(_input, options) {
          const execution = options.context.execution;
          expect('signal' in execution).toBe(false);
          expect(options.context.signal).toBeInstanceOf(AbortSignal);
          const [a, b] = await Promise.all([
            execution.getSandbox(),
            execution.getSandbox(),
          ]);
          expect(a).toBe(b);
          expect(a).toBe(f.allocated.at(-1));
          expect(
            await a.exec('cat /tmp/turn-state', { toolCallId: 'probe' }),
          ).toMatchObject({ ok: true });
          executions.push(execution);
          return { executionId: execution.id };
        },
      },
    });
    f.service.configurator.registerOnlineAgentScope('lazy-shell', {
      tool: ['skill', 'bash', 'execution-probe'],
      skill: [selected.id],
    });
    const agent = await f.service.realtime(f.alice.context, {
      scope: ['lazy-shell'],
    });
    const sending = f.send(agent, f.alice.cookie);
    try {
      await finalStarted.promise;
      expect(f.allocated).toHaveLength(1);
      expect(issue).toHaveBeenCalledTimes(1);
      const token = issue.mock.results[0].value.token;
      const headers = new Headers({ [HEADERS.runToken]: token });
      expect(await f.credentials.resolve(headers)).toMatchObject({
        type: 'online-agent',
      });
      const dispose = vi.spyOn(f.allocated[0], 'dispose');
      expect(await agent.status()).toBe('running');
      expect(dispose).not.toHaveBeenCalled();
      expect(
        await f.allocated[0].exec('cat /tmp/turn-state', {
          toolCallId: 'during-output',
        }),
      ).toMatchObject({ output: expect.stringContaining('shared') });
      finalExit.resolve();
      expect(await sending).toContain(target.marker);
      expect(dispose).toHaveBeenCalledTimes(1);
      expect(() => f.credentials.resolve(headers)).toThrow();
      await expect(executions[0].getSandbox()).rejects.toThrow('closed');
      await f.send(agent, f.alice.cookie);
      expect(f.allocated).toHaveLength(2);
      expect(issue).toHaveBeenCalledTimes(2);
      expect(executions[1]).not.toBe(executions[0]);
      expect(executions[1].id).not.toBe(executions[0].id);
      expect(f.errors).toEqual([]);
    } finally {
      finalExit.resolve();
      await sending;
      issue.mockRestore();
    }
  });

  it('coalesces concurrent first shell requests into one initialization', async () => {
    const f = await fixture(
      new MockLanguageModelV4({ doStream: async () => answer('unused') }),
    );
    const owner: NativeExecution = { abort: new AbortController() };
    const runtime = new NativeToolExecution(
      'concurrent-init',
      owner,
      {
        sessionId: 'concurrent-init',
        executionId: 'concurrent-init',
        context: {
          ...f.alice.context,
          sessionId: 'concurrent-init',
          signal: owner.abort.signal,
        },
        skill: [],
      },
      f.wired,
    );
    const prepare = vi.spyOn(f.wired, 'prepare');
    const issue = vi.spyOn(f.credentials, 'issue');
    try {
      const [a, b] = await Promise.all([
        runtime.getSandbox(),
        runtime.getSandbox(),
      ]);
      expect(a).toBe(b);
      expect(prepare).toHaveBeenCalledTimes(1);
      expect(issue).toHaveBeenCalledTimes(1);
      await a.exec('printf concurrent > /tmp/shared', { toolCallId: 'first' });
      expect(
        await b.exec('cat /tmp/shared', { toolCallId: 'second' }),
      ).toMatchObject({ output: expect.stringContaining('concurrent') });
    } finally {
      await runtime.dispose();
      prepare.mockRestore();
      issue.mockRestore();
    }
    await expect(runtime.getSandbox()).rejects.toThrow('closed');
  });

  it('shares failed initialization without retrying issuance and cleans the failed execution', async () => {
    const f = await fixture(
      new MockLanguageModelV4({ doStream: async () => answer('unused') }),
    );
    const owner: NativeExecution = { abort: new AbortController() };
    const runtime = new NativeToolExecution(
      'failed-init',
      owner,
      {
        sessionId: 'failed-init',
        executionId: 'failed-init',
        context: {
          ...f.alice.context,
          sessionId: 'failed-init',
          signal: owner.abort.signal,
        },
        skill: [],
      },
      f.wired,
    );
    const issue = vi.spyOn(f.credentials, 'issue');
    await f.users.disable(f.alice.context.user.id);
    try {
      const results = await Promise.allSettled([
        runtime.getSandbox(),
        runtime.getSandbox(),
      ]);
      expect(results.every((result) => result.status === 'rejected')).toBe(
        true,
      );
      await expect(runtime.getSandbox()).rejects.toThrow('unavailable');
      expect(issue).toHaveBeenCalledTimes(1);
      const token = issue.mock.results[0].value.token;
      expect(() =>
        f.credentials.resolve(new Headers({ [HEADERS.runToken]: token })),
      ).toThrow();
      await runtime.dispose();
      await runtime.dispose();
      await expect(runtime.readSkill('anything')).rejects.toThrow('closed');
    } finally {
      await runtime.dispose();
      issue.mockRestore();
    }
  });

  it('waits for initialization to settle before disposing a cancelled execution', async () => {
    const f = await fixture(
      new MockLanguageModelV4({ doStream: async () => answer('unused') }),
    );
    const owner: NativeExecution = { abort: new AbortController() };
    const started = Promise.withResolvers<void>();
    const exit = Promise.withResolvers<void>();
    const runtime = new NativeToolExecution(
      'cancel-init',
      owner,
      {
        sessionId: 'cancel-init',
        executionId: 'cancel-init',
        context: {
          ...f.alice.context,
          sessionId: 'cancel-init',
          signal: owner.abort.signal,
        },
        skill: [],
      },
      {
        async prepare(input) {
          const prepared = await f.wired.prepare(input);
          return {
            instructions: prepared.instructions,
            readSkill: (name) => prepared.readSkill(name),
            dispose: () => prepared.dispose(),
            async create() {
              const sandbox = await prepared.create();
              started.resolve();
              await exit.promise;
              return sandbox;
            },
          };
        },
      },
    );
    const issue = vi.spyOn(f.credentials, 'issue');
    const creating = runtime.getSandbox();
    const rejected = creating.catch((error: unknown) => error);
    await started.promise;
    const token = issue.mock.results[0].value.token;
    const headers = new Headers({ [HEADERS.runToken]: token });
    owner.abort.abort();
    let closed = false;
    const disposal = runtime.dispose().then(() => {
      closed = true;
    });
    try {
      await Promise.resolve();
      expect(closed).toBe(false);
      expect(await f.credentials.resolve(headers)).toMatchObject({
        type: 'online-agent',
      });
    } finally {
      exit.resolve();
      const error = await rejected;
      await disposal;
      expect(error).toMatchObject({ message: 'Execution is closed.' });
      issue.mockRestore();
    }
    expect(closed).toBe(true);
    expect(() => f.credentials.resolve(headers)).toThrow();
  });
  it('reads a random owned database marker through Skill, branded CLI, router and SDK, then reads history without replay', async () => {
    let step = 0;
    const prompts: unknown[] = [];
    const model = new MockLanguageModelV4({
      doStream: async (options) => {
        prompts.push(options.prompt);
        if (step++ === 0)
          return stream([
            {
              type: 'tool-call',
              toolCallId: 'guide',
              toolName: 'skill',
              input: JSON.stringify({ name: 'query-record' }),
            },
            finish('tool-calls'),
          ]);
        const prompt = JSON.stringify(options.prompt);
        if (step === 2) {
          const id = prompt.match(
            /acme conversation get ([a-zA-Z0-9-]+)/u,
          )?.[1];
          expect(id).toBeTruthy();
          return stream([
            {
              type: 'tool-call',
              toolCallId: 'query',
              toolName: 'bash',
              input: JSON.stringify({
                command: 'acme conversation get ' + id + ' --json',
              }),
            },
            finish('tool-calls'),
          ]);
        }
        const marker = prompt.match(/SLICE01_DB_[a-zA-Z0-9-]+/u)?.[0];
        expect(marker).toBeTruthy();
        return answer('The database title is ' + marker);
      },
    });
    const f = await fixture(model);
    const target = await f.record();
    const selected = await f.guide(target.id);
    f.service.configurator.registerOnlineAgentScope('slice01', {
      tool: ['skill', 'bash'],
      skill: [selected.id],
    });
    const agent = await f.service.realtime(f.alice.context, {
      scope: ['slice01'],
    });
    const output = await f.send(agent, f.alice.cookie);
    expect(output).toContain(target.marker);
    expect(f.errors).toEqual([]);
    expect(f.observation.queries).toBe(1);
    expect(JSON.stringify(prompts[0])).not.toContain(target.marker);
    expect(JSON.stringify(prompts[0])).not.toContain('Read the record using');
    const raw = await f.sessions.native.history(
      f.alice.context.user.id,
      agent.sessionId,
    );
    expect(JSON.stringify(raw)).toContain(target.marker);
    const history = await f.app.request(
      '/main/api/agents/conversations/' + agent.sessionId + '/messages',
      { headers: { cookie: f.alice.cookie } },
    );
    expect(history.status).toBe(200);
    const visible = await history.text();
    expect(visible).toContain(target.marker);
    expect(visible).not.toContain('tool-bash');
    expect(f.observation.queries).toBe(1);
    expect(
      JSON.stringify(prompts) + JSON.stringify(raw) + visible + output,
    ).not.toMatch(/fgo_[A-Za-z0-9_-]+/u);
    await expect(
      f.allocated[0].exec('echo late', { toolCallId: 'late' }),
    ).rejects.toThrow('closed');
  });

  it('keeps person identity, owner checks and Run-only boundaries, with real JSON under /main/api', async () => {
    const f = await fixture(
      new MockLanguageModelV4({ doStream: async () => answer('unused') }),
    );
    const target = await f.record();
    const lease = await f.credentials.issue(
      f.alice.context.user.id,
      'alice-execution',
    );
    const other = await f.credentials.issue(
      f.bob.context.user.id,
      'bob-execution',
    );
    const headers = { [HEADERS.runToken]: lease.token };
    try {
      const session = await f.auth.getSession(new Headers(headers));
      expect(callerIdentityOf(session ?? undefined)).toMatchObject({
        kind: 'user',
        userId: f.alice.context.user.id,
      });
      expect(runIdentityOf(session ?? undefined)).toBeUndefined();
      const manifestResponse = await f.app.request('/main/api/cli/manifest', {
        headers,
      });
      expect(manifestResponse.status).toBe(200);
      const manifest: {
        data: import('@nocobase/app-server/router').CliManifest;
      } = await manifestResponse.json();
      const ids = manifest.data.commands.map((command) => command.id);
      expect(ids).toContain('conversation:get');
      expect(ids).not.toContain('run:self');
      const got = await f.app.request(
        '/main/api/agents/conversations/' + target.id,
        { headers },
      );
      expect(got.status).toBe(200);
      expect(await got.json()).toMatchObject({
        data: { title: target.marker },
      });
      const list = await f.app.request('/main/api/agents/conversations', {
        headers,
      });
      expect(list.status).toBe(200);
      expect(await list.text()).toContain(target.marker);
      const denied = await f.app.request(
        '/main/api/agents/conversations/' + target.id,
        { headers: { [HEADERS.runToken]: other.token } },
      );
      expect(denied.status).toBe(404);
      const otherList = await f.app.request('/main/api/agents/conversations', {
        headers: { [HEADERS.runToken]: other.token },
      });
      expect(await otherList.text()).not.toContain(target.marker);
      for (const [path, method] of [
        ['/runs/current', 'GET'],
        ['/runs/current/context', 'GET'],
        ['/runs/current/conversation', 'PATCH'],
      ] as const) {
        const response = await f.app.request('/main/api/agents' + path, {
          method,
          headers,
        });
        expect(response.status).toBe(401);
        expect(await response.text()).toContain('RUN_TOKEN_INVALID');
      }
      const write = await f.app.request('/main/api/agents/conversations', {
        method: 'POST',
        headers: { ...headers, 'content-type': 'application/json' },
        body: '{}',
      });
      expect(write.status).toBe(403);
      expect(redactPatterns(lease.token)).toBe('[REDACTED]');
      await f.users.disable(f.alice.context.user.id);
      expect(await f.auth.getSession(new Headers(headers))).toBeNull();
      await h.database
        .connection()
        .query.deleteFrom('user')
        .where('id', '=', f.bob.context.user.id)
        .execute();
      expect(
        await f.auth.getSession(
          new Headers({ [HEADERS.runToken]: other.token }),
        ),
      ).toBeNull();
    } finally {
      lease.release();
      other.release();
    }
  });

  it('routes independent prefixes in either resolver order and rejects invalid, released, expired and cross-instance credentials', async () => {
    const f = await fixture(
      new MockLanguageModelV4({ doStream: async () => answer('unused') }),
    );
    const run = runCredentialResolver(h.services);
    const lease = await f.credentials.issue(
      f.alice.context.user.id,
      'first-execution',
    );
    const headers = new Headers({ [HEADERS.runToken]: lease.token });
    try {
      expect(await run(headers)).toBeUndefined();
      expect(
        await f.credentials.resolve(
          new Headers({ [HEADERS.runToken]: 'unknown' }),
        ),
      ).toBeUndefined();
      expect(
        await f.credentials.resolve(
          new Headers({ [HEADERS.runToken]: 'fgr_invalid' }),
        ),
      ).toBeUndefined();
      expect(
        await run(new Headers({ [HEADERS.runToken]: 'unknown' })),
      ).toBeUndefined();
      const agentId = await h.createAgent();
      await h.enqueue(agentId, 'prefix-test', {
        actorUserId: f.alice.context.user.id,
      });
      const runner = await h.registerRunner();
      const [payload] = await claim(h, runner);
      const runToken = payload.cli.credential.content.token as string;
      const runSession = await f.auth.getSession(
        new Headers({ [HEADERS.runToken]: runToken }),
      );
      expect(runIdentityOf(runSession ?? undefined)).toBeDefined();
      const target = await f.record();
      for (const [method, suffix] of [
        ['GET', ''],
        ['GET', '/' + target.id],
        ['PATCH', '/' + target.id],
      ] as const) {
        const denied = await f.app.request(
          '/main/api/agents/conversations' + suffix,
          {
            method,
            headers: {
              [HEADERS.runToken]: runToken,
              'content-type': 'application/json',
            },
            ...(method === 'PATCH'
              ? { body: JSON.stringify({ title: 'Run must not write' }) }
              : {}),
          },
        );
        expect(denied.status).toBe(403);
      }
      const runManifest = await f.app.request('/main/api/cli/manifest', {
        headers: { [HEADERS.runToken]: runToken },
      });
      expect(runManifest.status).toBe(200);
      const runCommands = (await runManifest.json()).data.commands.map(
        (command: { id: string }) => command.id,
      );
      expect(runCommands).not.toContain('conversation:get');
      expect(runCommands).not.toContain('conversation:update');
      for (const resolvers of [
        [run, f.credentials.resolve],
        [f.credentials.resolve, run],
      ]) {
        const resolve = async (value: string) => {
          for (const resolver of resolvers) {
            const credential = await resolver(
              new Headers({ [HEADERS.runToken]: value }),
            );
            if (credential) return credential;
          }
          return undefined;
        };
        expect(await resolve(runToken)).toMatchObject({
          type: 'run',
          scheme: 'runToken',
        });
        expect(await resolve(lease.token)).toMatchObject({
          type: 'online-agent',
          id: 'first-execution',
          userId: f.alice.context.user.id,
          scheme: 'runToken',
        });
        await expect(resolve('fgo_invalid')).rejects.toMatchObject({
          reason: 'ONLINE_AGENT_TOKEN_INVALID',
        });
        await expect(resolve('fgr_invalid')).rejects.toMatchObject({
          reason: 'RUN_TOKEN_INVALID',
        });
      }
      const containers = [new ServiceContainer(), new ServiceContainer()];
      for (const container of containers) {
        const provider = new AgentsProvider({
          container,
          config: { get: () => undefined },
        } as unknown as AppPluginApplication);
        provider.register();
      }
      const first = containers[0].resolve(onlineAgentCredentialsToken);
      expect(containers[0].resolve(onlineAgentCredentialsToken)).toBe(first);
      const isolated = await first.issue(f.alice.context.user.id, 'app-one');
      try {
        expect(() =>
          containers[1]
            .resolve(onlineAgentCredentialsToken)
            .resolve(new Headers({ [HEADERS.runToken]: isolated.token })),
        ).toThrow();
      } finally {
        isolated.release();
      }
      expect(() => new OnlineAgentCredentials().resolve(headers)).toThrow();
      lease.release();
      expect(() => f.credentials.resolve(headers)).toThrow();
      const expired = new OnlineAgentCredentials(0);
      const stale = await expired.issue(f.alice.context.user.id, 'expired');
      try {
        expect(() =>
          expired.resolve(new Headers({ [HEADERS.runToken]: stale.token })),
        ).toThrow();
      } finally {
        stale.release();
      }
    } finally {
      lease.release();
    }
  });

  it('retains the credential and environment until an uncooperative handler really exits after cancellation', async () => {
    const f = await fixture(
      new MockLanguageModelV4({ doStream: async () => answer('unused') }),
    );
    const target = await f.record();
    const entered = Promise.withResolvers<void>();
    const exit = Promise.withResolvers<void>();
    // Observe the real in-process request, without replacing its authentication, policy or DB handler.
    const issue = vi.spyOn(f.credentials, 'issue');
    f.observation.beforeQuery = async () => {
      entered.resolve();
      await exit.promise;
    };
    const abort = new AbortController();
    const sandbox = await createPreparedSandbox(f.wired, {
      sessionId: 'cancel',
      context: {
        ...f.alice.context,
        sessionId: 'cancel',
        signal: abort.signal,
      },
      skill: [],
    });
    const token = (await issue.mock.results[0].value).token;
    const headers = new Headers({ [HEADERS.runToken]: token });
    const execution = sandbox.exec(
      'acme conversation get ' + target.id + ' --json',
      { toolCallId: 'query' },
    );
    const settled = execution.catch(() => {});
    await entered.promise;
    abort.abort();
    let disposed = false;
    const disposal = sandbox.dispose().then(() => {
      disposed = true;
    });
    try {
      await Promise.resolve();
      expect(disposed).toBe(false);
      expect(await f.credentials.resolve(headers)).toMatchObject({
        type: 'online-agent',
      });
    } finally {
      exit.resolve();
      await settled;
      await disposal;
      issue.mockRestore();
    }
    expect(() => f.credentials.resolve(headers)).toThrow();
  });

  it.each(['execution', 'command'] as const)(
    'forwards %s cancellation through the historical CLI command shape',
    async (source) => {
      const f = await fixture(
        new MockLanguageModelV4({ doStream: async () => answer('unused') }),
      );
      const target = await f.record();
      const lease = f.credentials.issue(f.alice.context.user.id, 'cli-signal');
      const session = await f.auth.getSession(
        new Headers({ [HEADERS.runToken]: lease.token }),
      );
      const identity = callerIdentityOf(session ?? undefined);
      if (!identity) throw new Error('Expected an authenticated CLI caller.');
      const surface = await agentsProvider!['commandsOf'](
        identity,
        lease.token,
      );
      if (!surface)
        throw new Error('Expected the real application command surface.');
      const send = vi.spyOn(surface, 'send');
      const entered = Promise.withResolvers<void>();
      const exit = Promise.withResolvers<void>();
      f.observation.beforeQuery = async () => {
        entered.resolve();
        await exit.promise;
      };
      const execution = new AbortController();
      const shell = new AbortController();
      const cli = cliCommand(surface, execution.signal);
      expect(cli.name).toBe('acme');
      const work = cli.execute(
        ['conversation', 'get', target.id, '--json'],
        createCommandContext({
          fs: new InMemoryFs(),
          ...(source === 'command' ? { signal: shell.signal } : {}),
        }),
      );
      const settled = work.catch((error: unknown) => error);
      try {
        await entered.promise;
        const controller = source === 'execution' ? execution : shell;
        controller.abort();
        const dispatched = send.mock.calls[0]?.[1];
        expect(dispatched?.aborted).toBe(true);
        expect(dispatched?.reason).toBe(controller.signal.reason);
        exit.resolve();
        expect(await settled).toBe(controller.signal.reason);
        expect(f.observation.queries).toBe(1);
      } finally {
        exit.resolve();
        await settled;
        send.mockRestore();
        lease.release();
      }
    },
  );

  it('does not impose an additional CLI request-count quota', async () => {
    const f = await fixture(
      new MockLanguageModelV4({ doStream: async () => answer('unused') }),
    );
    const target = await f.record();
    const sandbox = await createPreparedSandbox(f.wired, {
      sessionId: 'historical-cli',
      context: {
        ...f.alice.context,
        sessionId: 'historical-cli',
        signal: new AbortController().signal,
      },
      skill: [],
    });
    try {
      const result = await sandbox.exec(
        'for i in $(seq 1 33); do acme conversation get ' +
          target.id +
          ' --json > /tmp/result || exit 1; done; cat /tmp/result',
        { toolCallId: 'historical-requests' },
      );
      expect(result).toMatchObject({
        ok: true,
        output: expect.stringContaining(target.marker),
      });
      expect(f.observation.queries).toBe(33);
    } finally {
      await sandbox.dispose();
    }
  });

  it('keeps CLI help, tables, JSON, errors, environment flags and historical request encoding', async () => {
    const f = await fixture(
      new MockLanguageModelV4({ doStream: async () => answer('unused') }),
    );
    const target = await f.record();
    const sandbox = await createPreparedSandbox(f.wired, {
      sessionId: 'presentation',
      context: {
        ...f.alice.context,
        sessionId: 'presentation',
        signal: new AbortController().signal,
      },
      skill: [],
    });
    try {
      for (const command of [
        'acme --help',
        'acme conversation --help',
        'acme conversation get --help',
        'acme docs conversation get',
      ]) {
        const result = await sandbox.exec(command, { toolCallId: 'help' });
        expect(result.ok).toBe(true);
        expect(result.output).toContain('conversation');
      }
      const table = await sandbox.exec('acme conversation list', {
        toolCallId: 'table',
      });
      expect(table.output).toContain('TITLE');
      expect(table.output).toContain(target.marker);
      const query = await sandbox.exec(
        'export QUERY=' +
          target.marker +
          '; acme conversation list --query "$QUERY" --json',
        { toolCallId: 'env-flag' },
      );
      expect(query.output).toContain(target.marker);
      const missing = await sandbox.exec(
        'acme conversation get missing --json',
        { toolCallId: 'missing' },
      );
      expect(missing.ok).toBe(false);
      expect(missing.output).toContain('CONVERSATION_NOT_FOUND');
      const environment = await sandbox.exec('env; find /tmp /skills -type f', {
        toolCallId: 'secrets',
      });
      expect(environment.output).not.toMatch(/fgo_/u);
      expect(environment.output).not.toContain('x-nocobase-run-token');
    } finally {
      await sandbox.dispose();
    }
    const lease = await f.credentials.issue(
      f.alice.context.user.id,
      'encoding',
    );
    try {
      const session = await f.auth.getSession(
        new Headers({ [HEADERS.runToken]: lease.token }),
      );
      const identity = callerIdentityOf(session ?? undefined)!;
      const surface = await agentsProvider!['commandsOf'](
        identity,
        lease.token,
      );
      expect(surface?.bin).toBe('acme');
      for (const path of ['/main/api/slice01Echo', '/api/slice01Echo']) {
        const response = await surface!.send({
          method: 'POST',
          path,
          body: '{"value":"json"}',
        });
        expect(response.status).toBe(200);
        expect(await response.json()).toMatchObject({
          data: { contentType: 'application/json', body: '{"value":"json"}' },
        });
      }
      const form = new FormData();
      form.append('value', 'multipart');
      const response = await surface!.send({
        method: 'POST',
        path: '/main/api/slice01Echo',
        body: form,
      });
      const body = await response.json();
      expect(body.data.contentType).toContain('multipart/form-data; boundary=');
      expect(body.data.body).toContain('multipart');
    } finally {
      lease.release();
    }
  });

  it('waits for actual response-reader cancellation before releasing its credential', async () => {
    const f = await fixture(
      new MockLanguageModelV4({ doStream: async () => answer('unused') }),
    );
    const target = await f.record();
    const reading = Promise.withResolvers<void>();
    const cancelling = Promise.withResolvers<void>();
    const cancelled = Promise.withResolvers<void>();
    f.observation.wrapResponse = (response) =>
      new Response(
        new ReadableStream({
          async start(controller) {
            controller.enqueue(new Uint8Array(await response.arrayBuffer()));
          },
          pull() {
            reading.resolve();
          },
          async cancel() {
            cancelling.resolve();
            await cancelled.promise;
          },
        }),
        { status: response.status, headers: response.headers },
      );
    const issue = vi.spyOn(f.credentials, 'issue');
    const abort = new AbortController();
    const sandbox = await createPreparedSandbox(f.wired, {
      sessionId: 'reader',
      context: {
        ...f.alice.context,
        sessionId: 'reader',
        signal: abort.signal,
      },
      skill: [],
    });
    const token = (await issue.mock.results[0].value).token;
    const work = sandbox
      .exec('acme conversation get ' + target.id + ' --json', {
        toolCallId: 'reader',
      })
      .catch(() => {});
    await reading.promise;
    abort.abort();
    await cancelling.promise;
    let disposed = false;
    const disposal = sandbox.dispose().then(() => {
      disposed = true;
    });
    try {
      await Promise.resolve();
      expect(disposed).toBe(false);
      expect(
        await f.credentials.resolve(new Headers({ [HEADERS.runToken]: token })),
      ).toMatchObject({ type: 'online-agent' });
    } finally {
      cancelled.resolve();
      await work;
      await disposal;
      issue.mockRestore();
    }
    expect(() =>
      f.credentials.resolve(new Headers({ [HEADERS.runToken]: token })),
    ).toThrow();
  });
});

describe('Slice-02 current support trees through the authenticated chat chain', () => {
  it.each(['stored', 'builtin'] as const)(
    'processes CLI results with %s support templates and reloads the next segment',
    async (kind) => {
      let template = '{"label":"first"}';
      let step = 0;
      const catalog = new Map([
        [
          'builtin-report',
          async () => ({
            slug: 'report-guide',
            name: 'report-guide',
            description: 'Format the authorized query.',
            content: skillMd(
              'report-guide',
              'Format the authorized query.',
              'Read assets/template.json and query the record.',
            ),
            files: [{ path: 'assets/template.json', content: template }],
          }),
        ],
      ]);
      const model = new MockLanguageModelV4({
        doStream: async ({ prompt }) => {
          const stage = step++ % 4;
          if (stage === 0)
            return stream([
              {
                type: 'tool-call',
                toolCallId: 'guide-' + step,
                toolName: 'skill',
                input: '{"name":"report-guide"}',
              },
              finish('tool-calls'),
            ]);
          if (stage === 1)
            return stream([
              {
                type: 'tool-call',
                toolCallId: 'query-' + step,
                toolName: 'bash',
                input: JSON.stringify({
                  command:
                    'test ! -e /tmp/report.json && acme conversation get ' +
                    target.id +
                    ' --json > /tmp/record.json; label=$(jq -r .label /skills/report-guide/assets/template.json); jq --arg label "$label" \'{title: .result.data.title, label: $label}\' /tmp/record.json > /tmp/report.json',
                }),
              },
              finish('tool-calls'),
            ]);
          if (stage === 2)
            return stream([
              {
                type: 'tool-call',
                toolCallId: 'read-' + step,
                toolName: 'bash',
                input: '{"command":"cat /tmp/report.json"}',
              },
              finish('tool-calls'),
            ]);
          const seen = JSON.stringify(prompt);
          expect(seen).toContain(target.marker);
          expect(seen).toContain(
            template === '{"label":"first"}' ? 'first' : 'updated',
          );
          return answer(
            'Verified ' + target.marker + ' ' + JSON.parse(template).label,
          );
        },
      });
      const f = await fixture(model, catalog);
      const target = await f.record();
      const stored =
        kind === 'stored'
          ? await h.services.skills.create(f.alice.context.user.id, {
              content: skillMd(
                'report-guide',
                'Format the authorized query.',
                'Read assets/template.json and query the record.',
              ),
              files: [{ path: 'assets/template.json', content: template }],
            })
          : undefined;
      f.service.configurator.registerOnlineAgentScope('reports', {
        tool: ['bash', 'skill'],
        skill: [stored?.id ?? 'builtin-report'],
      });
      const agent = await f.service.realtime(f.alice.context, {
        scope: ['reports'],
      });
      expect(await f.send(agent, f.alice.cookie)).toContain(target.marker);
      template = '{"label":"updated"}';
      if (stored)
        await h.services.skills.save(stored.id, f.alice.context.user.id, {
          content: stored.content,
          expectedRevision: stored.version,
          files: [{ path: 'assets/template.json', content: template }],
        });
      expect(await f.send(agent, f.alice.cookie)).toContain('updated');
      expect(f.observation.queries).toBe(2);
      expect(f.allocated).toHaveLength(2);
      expect(f.errors).toEqual([]);
      const history = JSON.stringify(await agent.history());
      expect(history).toContain(target.marker);
      expect(history).not.toContain('/tmp/report.json');
      expect(f.observation.queries).toBe(2);
    },
  );

  it('reports binary and oversized support resources without mounting readable placeholders', async () => {
    const f = await fixture(
      new MockLanguageModelV4({ doStream: async () => answer('unused') }),
      new Map([
        [
          'unreadable',
          async () => ({
            slug: 'unreadable',
            name: 'unreadable',
            description: 'Unreadable resources.',
            content: skillMd('unreadable', 'Unreadable resources.'),
            files: [
              { path: 'assets/binary.dat', content: null },
              {
                path: 'assets/large.txt',
                content: 'x'.repeat(5 * 1024 * 1024),
              },
            ],
          }),
        ],
      ]),
    );
    const sandbox = await createPreparedSandbox(f.wired, {
      sessionId: 'unreadable',
      context: {
        ...f.alice.context,
        sessionId: 'unreadable',
        signal: new AbortController().signal,
      },
      skill: ['unreadable'],
    });
    try {
      expect((await sandbox.readSkill('unreadable')).output).toContain(
        'Binary skill file',
      );
      for (const command of [
        'cat /skills/unreadable/assets/binary.dat',
        'cp /skills/unreadable/assets/binary.dat /tmp/copy',
        'cat /skills/unreadable/assets/large.txt',
      ])
        expect(
          (await sandbox.exec(command, { toolCallId: randomUUID() })).ok,
        ).toBe(false);
      expect(
        (
          await sandbox.exec('test ! -e /tmp/copy', {
            toolCallId: 'no-placeholder',
          })
        ).ok,
      ).toBe(true);
    } finally {
      await sandbox.dispose();
    }
    await expect(
      f.provider.prepare({
        sessionId: 'missing',
        context: {
          ...f.alice.context,
          sessionId: 'missing',
          signal: new AbortController().signal,
        },
        skill: ['missing'],
      }),
    ).rejects.toThrow();
  });
});

describe('Slice-03 authorized writes through virtual parameter files', () => {
  it.each([false, true])(
    'writes once through the owner Policy and checks back (lost response: %s)',
    async (lostResponse) => {
      const title = 'updated-' + randomUUID().slice(0, 16);
      let step = 0;
      const model = new MockLanguageModelV4({
        doStream: async ({ prompt }) => {
          const stage = step++;
          if (stage === 0)
            return stream([
              {
                type: 'tool-call',
                toolCallId: 'write-guide',
                toolName: 'skill',
                input: '{"name":"write-guide"}',
              },
              finish('tool-calls'),
            ]);
          if (stage === 1)
            return stream([
              {
                type: 'tool-call',
                toolCallId: 'write-once',
                toolName: 'bash',
                input: JSON.stringify({
                  command:
                    'cp /skills/write-guide/assets/request.json /tmp/request.json; acme conversation update ' +
                    target.id +
                    ' --file /tmp/request.json --json',
                }),
              },
              finish('tool-calls'),
            ]);
          if (stage === 2)
            return stream([
              {
                type: 'tool-call',
                toolCallId: 'verify-write',
                toolName: 'bash',
                input: JSON.stringify({
                  command: 'acme conversation get ' + target.id + ' --json',
                }),
              },
              finish('tool-calls'),
            ]);
          expect(JSON.stringify(prompt)).toContain(title);
          return answer('Verified stored title: ' + title);
        },
      });
      const f = await fixture(model);
      const target = await f.record();
      f.observation.loseWriteResponse = lostResponse;
      const selected = await h.services.skills.create(f.alice.context.user.id, {
        content: skillMd(
          'write-guide',
          'Rename an owned record.',
          'Use assets/request.json then query back.',
        ),
        files: [
          { path: 'assets/request.json', content: JSON.stringify({ title }) },
        ],
      });
      f.service.configurator.registerOnlineAgentScope('writes', {
        tool: ['bash', 'skill'],
        skill: [selected.id],
      });
      const agent = await f.service.realtime(f.alice.context, {
        scope: ['writes'],
      });
      const result = await f.send(agent, f.alice.cookie);
      expect(f.errors).toEqual([]);
      expect(result).toContain(title);
      expect(f.errors).toEqual([]);
      expect(f.observation.writes).toBe(1);
      expect(
        (
          await h.database
            .connection()
            .query.selectFrom('agConversations')
            .select('title')
            .where('id', '=', target.id)
            .executeTakeFirstOrThrow()
        ).title,
      ).toBe(title);
      expect(JSON.stringify(await agent.history())).toContain(title);
      expect(f.observation.writes).toBe(1);
      const bob = await createPreparedSandbox(f.wired, {
        sessionId: 'bob-write',
        context: {
          ...f.bob.context,
          sessionId: 'bob-write',
          signal: new AbortController().signal,
        },
        skill: [],
      });
      try {
        const denied = await bob.exec(
          'acme conversation update ' + target.id + ' --title forbidden --json',
          { toolCallId: 'owner-denied' },
        );
        expect(denied.ok).toBe(false);
        expect(denied.output).not.toContain('"title":"forbidden"');
        expect(
          (
            await h.database
              .connection()
              .query.selectFrom('agConversations')
              .select('title')
              .where('id', '=', target.id)
              .executeTakeFirstOrThrow()
          ).title,
        ).toBe(title);
      } finally {
        await bob.dispose();
      }
    },
  );
});

describe('Slice-04 retryable cleanup and persistence', () => {
  it.each(['dispose', 'save'] as const)(
    'holds the gate after %s failure and retries only finalization',
    async (failure) => {
      let step = 0;
      let disposal: ReturnType<typeof vi.spyOn> | undefined;
      const model = new MockLanguageModelV4({
        doStream: async () => {
          if (step++ === 0)
            return stream([
              {
                type: 'tool-call',
                toolCallId: 'one-query',
                toolName: 'bash',
                input: JSON.stringify({
                  command: 'acme conversation get ' + target.id + ' --json',
                }),
              },
              finish('tool-calls'),
            ]);
          if (failure === 'dispose')
            disposal = vi
              .spyOn(f.allocated[0], 'dispose')
              .mockRejectedValueOnce(new Error('Injected disposal failure.'));
          return answer('Verified ' + target.marker);
        },
      });
      const f = await fixture(model);
      const target = await f.record();
      const selected = await f.guide(target.id);
      f.service.configurator.registerOnlineAgentScope('cleanup', {
        tool: ['bash', 'skill'],
        skill: [selected.id],
      });
      const agent = await f.service.realtime(f.alice.context, {
        scope: ['cleanup'],
      });
      const issue = vi.spyOn(f.credentials, 'issue');
      const save =
        failure === 'save'
          ? vi
              .spyOn(f.sessions.native, 'save')
              .mockRejectedValueOnce(new Error('Injected save failure.'))
          : undefined;
      try {
        await agent.send([{ role: 'user', content: 'Query once.' }]);
        await vi.waitFor(() => expect(f.errors.length).toBeGreaterThan(0));
        expect(await agent.status()).toBe('running');
        await expect(
          agent.send([{ role: 'user', content: 'Do not race finalization.' }]),
        ).rejects.toThrow();
        expect(f.observation.queries).toBe(1);
        expect(f.allocated).toHaveLength(1);
        await agent.retryFinalization();
        expect(await agent.status()).toBe('idle');
        expect(JSON.stringify(await agent.history())).toContain(target.marker);
        expect(f.observation.queries).toBe(1);
        expect(issue).toHaveBeenCalledTimes(1);
        await expect(
          f.allocated[0].exec('echo late', { toolCallId: 'closed' }),
        ).rejects.toThrow('closed');
      } finally {
        disposal?.mockRestore();
        save?.mockRestore();
        issue.mockRestore();
        await agent.retryFinalization();
      }
    },
  );
});

describe('Slice-04 parallel execution isolation', () => {
  it('runs two users concurrently with private files, queues and credentials', async () => {
    const model = new MockLanguageModelV4({
      doStream: async ({ prompt }) => {
        const encoded = JSON.stringify(prompt);
        const id = encoded.match(/probe ([a-z0-9-]+)/u)?.[1];
        expect(id).toBeTruthy();
        const results = prompt.filter((message) => message.role === 'tool');
        if (results.length === 0)
          return stream([
            {
              type: 'tool-call',
              toolCallId: 'parallel-query',
              toolName: 'bash',
              input: JSON.stringify({
                command:
                  'test ! -e /tmp/private; echo ' +
                  id +
                  ' > /tmp/private; acme conversation get ' +
                  id +
                  ' --json',
              }),
            },
            finish('tool-calls'),
          ]);
        if (results.length === 1)
          return stream([
            {
              type: 'tool-call',
              toolCallId: 'parallel-file',
              toolName: 'bash',
              input: '{"command":"cat /tmp/private"}',
            },
            finish('tool-calls'),
          ]);
        expect(JSON.stringify(results.at(-1))).toContain(id);
        return answer('Verified isolated ' + id);
      },
    });
    const f = await fixture(model);
    f.service.configurator.registerOnlineAgentScope('parallel', {
      tool: ['bash'],
    });
    const alice = await f.service.realtime(f.alice.context, {
      scope: ['parallel'],
      title: 'Alice only',
    });
    const bob = await f.service.realtime(f.bob.context, {
      scope: ['parallel'],
      title: 'Bob only',
    });
    await Promise.all([
      alice.send([{ role: 'user', content: 'probe ' + alice.sessionId }]),
      bob.send([{ role: 'user', content: 'probe ' + bob.sessionId }]),
    ]);
    await vi.waitFor(async () => {
      expect(await alice.status()).toBe('idle');
      expect(await bob.status()).toBe('idle');
    });
    expect(f.errors).toEqual([]);
    expect(f.allocated).toHaveLength(2);
    expect(f.observation.queries).toBe(2);
    expect(JSON.stringify(await alice.history())).not.toContain(bob.sessionId);
    expect(JSON.stringify(await bob.history())).not.toContain(alice.sessionId);
    for (const environment of f.allocated)
      await expect(
        environment.exec('cat /tmp/private', { toolCallId: 'late' }),
      ).rejects.toThrow('closed');
  });
});

describe('Slice-05 structured approval starts a new current environment', () => {
  it.each([true, false])(
    'keeps partial decisions and resumes without restoring files (approved: %s)',
    async (approved) => {
      let step = 0;
      const execute = vi.fn(async () => ({ done: true }));
      const model = new MockLanguageModelV4({
        doStream: async ({ prompt }) => {
          if (step++ === 0)
            return stream([
              {
                type: 'tool-call',
                toolCallId: 'before-approval',
                toolName: 'bash',
                input:
                  '{"command":"echo before > /tmp/before; cat /skills/approval-guide/assets/current.txt; acme conversation get --help"}',
              },
              finish('tool-calls'),
            ]);
          if (step === 2)
            return stream([
              {
                type: 'tool-call',
                toolCallId: 'decision-0',
                toolName: 'decision',
                input: '{}',
              },
              {
                type: 'tool-call',
                toolCallId: 'decision-1',
                toolName: 'decision',
                input: '{}',
              },
              finish('tool-calls'),
            ]);
          if (step === 3)
            return stream([
              {
                type: 'tool-call',
                toolCallId: 'after-approval',
                toolName: 'bash',
                input:
                  '{"command":"test ! -e /tmp/before && cat /skills/approval-guide/assets/current.txt; acme conversation get ignored --json"}',
              },
              finish('tool-calls'),
            ]);
          expect(JSON.stringify(prompt)).toContain('current-after');
          expect(JSON.stringify(prompt)).toContain('COMMAND_UNKNOWN');
          return answer(
            approved
              ? 'Approved with current resources.'
              : 'Denied; current resources loaded without replay.',
          );
        },
      });
      const f = await fixture(model);
      const selected = await h.services.skills.create(f.alice.context.user.id, {
        content: skillMd('approval-guide', 'Approval resources.'),
        files: [{ path: 'assets/current.txt', content: 'current-before' }],
      });
      f.service.configurator.registerTool('decision', {
        version: '1',
        definition: {
          inputSchema: z.object({}),
          needsApproval: true,
          public: { input: () => ({}), output: () => ({ done: true }) },
          execute,
        },
      });
      f.service.configurator.registerOnlineAgentScope('approvals', {
        tool: ['bash', 'skill', 'decision'],
        skill: [selected.id],
      });
      const agent = await f.service.realtime(f.alice.context, {
        scope: ['approvals'],
      });
      await agent.send([
        { role: 'user', content: 'Use the Skill, then request decisions.' },
      ]);
      await vi.waitFor(async () =>
        expect(JSON.stringify(await agent.history())).toContain(
          'approval-requested',
        ),
      );
      const waiting = (await agent.history()).find((message) =>
        message.parts.some(
          (part) => isToolUIPart(part) && part.state === 'approval-requested',
        ),
      )!;
      expect(waiting).toBeDefined();
      const parts = waiting.parts.filter(isToolUIPart);
      expect(parts).toHaveLength(2);
      expect(f.allocated).toHaveLength(1);
      await expect(
        f.allocated[0].exec('cat /tmp/before', { toolCallId: 'old' }),
      ).rejects.toThrow('closed');
      await h.services.skills.save(selected.id, f.alice.context.user.id, {
        content: selected.content,
        expectedRevision: selected.version,
        files: [{ path: 'assets/current.txt', content: 'current-after' }],
      });
      async function decide(index: number) {
        const response = await f.app.request(
          '/main/api/agents/conversations/' + agent.sessionId + '/approval',
          {
            method: 'POST',
            headers: {
              cookie: f.alice.cookie,
              origin: 'http://localhost',
              'content-type': 'application/json',
            },
            body: JSON.stringify({
              messageId: waiting.id,
              executionId: waiting.metadata!.executionId,
              approval: { id: parts[index].approval!.id, approved },
            }),
          },
        );
        expect(response.status).toBe(200);
        await response.text();
        if (index === 1)
          await vi.waitFor(async () =>
            expect(await agent.status()).toBe('idle'),
          );
      }
      f.cli.exclude({ operationIds: ['agentsGetConversation'] });
      await decide(0);
      expect(f.allocated).toHaveLength(1);
      expect(model.doStreamCalls).toHaveLength(2);
      expect(execute).not.toHaveBeenCalled();
      await decide(1);
      expect(f.errors).toEqual([]);
      expect(f.allocated).toHaveLength(2);
      expect(execute).toHaveBeenCalledTimes(approved ? 2 : 0);
      expect(JSON.stringify(await agent.history())).toContain(
        approved
          ? 'Approved with current resources.'
          : 'Denied; current resources',
      );
      expect(model.doStreamCalls).toHaveLength(4);
    },
  );
});

describe('Slice-06 background JSON Schema shares the real Skills and CLI execution', () => {
  it('observes without cancelling, consumes real DB results and returns the same get/try result', async () => {
    let step = 0;
    const entered = Promise.withResolvers<void>();
    const release = Promise.withResolvers<void>();
    const model = new MockLanguageModelV4({
      doStream: async ({ prompt }) => {
        if (step++ === 0)
          return stream([
            {
              type: 'tool-call',
              toolCallId: 'background-skill',
              toolName: 'skill',
              input: '{"name":"query-record"}',
            },
            finish('tool-calls'),
          ]);
        if (step === 2)
          return stream([
            {
              type: 'tool-call',
              toolCallId: 'background-query',
              toolName: 'bash',
              input: JSON.stringify({
                command:
                  'test ! -e /tmp/previous && acme conversation get ' +
                  target.id +
                  ' --json',
              }),
            },
            finish('tool-calls'),
          ]);
        expect(JSON.stringify(prompt)).toContain(target.marker);
        entered.resolve();
        await release.promise;
        return answer(JSON.stringify({ title: target.marker }));
      },
    });
    const f = await fixture(model);
    const target = await f.record();
    const selected = await f.guide(target.id);
    const agent = await f.service.background(f.alice.context, {
      tool: ['bash', 'skill'],
      skill: [selected.id],
    });
    try {
      await agent.run(
        [
          {
            role: 'user',
            content: 'Follow the Skill and return the actual stored title.',
          },
        ],
        {
          type: 'object',
          properties: { title: { type: 'string' } },
          required: ['title'],
          additionalProperties: false,
        },
      );
      await entered.promise;
      expect(await agent.try({ wait: 1 })).toMatchObject({
        ok: false,
        reason: 'pending',
      });
      expect(await agent.status()).toBe('running');
      release.resolve();
      expect(await agent.get()).toEqual({ title: target.marker });
      expect(await agent.try()).toMatchObject({
        ok: true,
        data: { title: target.marker },
      });
      expect(f.observation.queries).toBe(1);
      expect(f.allocated).toHaveLength(1);
      expect(f.errors).toEqual([]);
      await expect(
        f.allocated[0].exec('echo late', { toolCallId: 'late' }),
      ).rejects.toThrow('closed');
      expect(JSON.stringify(await agent.history())).not.toContain('tool-bash');
      expect(f.observation.queries).toBe(1);
    } finally {
      release.resolve();
      await agent.abort();
    }
  });
});

describe('Slice-06 background failure and stop ownership', () => {
  it.each(['invalid-output', 'cancel', 'late-save'] as const)(
    'retains real CLI lifecycle for %s',
    async (mode) => {
      let step = 0;
      const entered = Promise.withResolvers<void>();
      const exit = Promise.withResolvers<void>();
      const model = new MockLanguageModelV4({
        doStream: async () => {
          if (step++ === 0)
            return stream([
              {
                type: 'tool-call',
                toolCallId: 'background-query',
                toolName: 'bash',
                input: JSON.stringify({
                  command: 'acme conversation get ' + target.id + ' --json',
                }),
              },
              finish('tool-calls'),
            ]);
          return answer(
            JSON.stringify({
              title: mode === 'invalid-output' ? 42 : target.marker,
            }),
          );
        },
      });
      const f = await fixture(model);
      const target = await f.record();
      f.observation.beforeQuery = async () => {
        entered.resolve();
        if (mode === 'cancel') await exit.promise;
      };
      const agent = await f.service.background(f.alice.context, {
        tool: ['bash'],
      });
      const save =
        mode === 'late-save'
          ? vi
              .spyOn(f.sessions.native, 'save')
              .mockRejectedValueOnce(
                new Error('Injected background save failure.'),
              )
          : undefined;
      try {
        await agent.run([{ role: 'user', content: 'Query actual data.' }], {
          type: 'object',
          properties: { title: { type: 'string' } },
          required: ['title'],
          additionalProperties: false,
        });
        await entered.promise;
        if (mode === 'cancel') {
          let stopped = false;
          const stopping = agent.abort().then(() => {
            stopped = true;
          });
          await new Promise((resolve) => setTimeout(resolve, 30));
          expect(stopped).toBe(false);
          expect(await agent.status()).toBe('running');
          expect(await agent.try()).toEqual({ ok: false, reason: 'pending' });
          exit.resolve();
          await stopping;
          expect(await agent.try()).toMatchObject({
            ok: false,
            reason: 'cancelled',
          });
        } else if (mode === 'invalid-output') {
          await expect(agent.get()).rejects.toMatchObject({
            code: 'OUTPUT_INVALID',
          });
          expect(await agent.try()).toMatchObject({
            ok: false,
            reason: 'failed',
          });
        } else {
          await vi.waitFor(() => expect(f.errors.length).toBeGreaterThan(0));
          expect(await agent.status()).toBe('running');
          await agent.retryFinalization();
          expect(await agent.get()).toEqual({ title: target.marker });
        }
        expect(f.observation.queries).toBe(1);
        expect(f.allocated).toHaveLength(1);
        expect(await agent.status()).toBe('idle');
      } finally {
        exit.resolve();
        save?.mockRestore();
        await agent.abort();
      }
    },
  );
});

describe('Current Skill loading rejection and consistency semantics', () => {
  it('retains one preparation across a save, reloads a new preparation and rejects duplicate resources', async () => {
    const f = await fixture(
      new MockLanguageModelV4({ doStream: async () => answer('unused') }),
    );
    const selected = await h.services.skills.create(f.alice.context.user.id, {
      content: skillMd('consistent-guide', 'Current guide.', 'old body'),
      files: [{ path: 'assets/current.txt', content: 'old-file' }],
    });
    const input = {
      sessionId: 'consistent',
      context: {
        ...f.alice.context,
        sessionId: 'consistent',
        signal: new AbortController().signal,
      },
      skill: [selected.id],
    };
    const prepared = await f.provider.prepare(input);
    await h.services.skills.save(selected.id, f.alice.context.user.id, {
      content: skillMd('consistent-guide', 'Current guide.', 'new body'),
      expectedRevision: selected.version,
      files: [{ path: 'assets/current.txt', content: 'new-file' }],
    });
    expect((await prepared.readSkill('consistent-guide')).output).toContain(
      'old body',
    );
    const old = await prepared.create();
    const current = await createPreparedSandbox(f.provider, input);
    try {
      expect(
        (
          await old.exec('cat /skills/consistent-guide/assets/current.txt', {
            toolCallId: 'old-content',
          })
        ).output,
      ).toContain('old-file');
      expect((await current.readSkill('consistent-guide')).output).toContain(
        'new body',
      );
      expect(
        (
          await current.exec(
            'cat /skills/consistent-guide/assets/current.txt',
            { toolCallId: 'new-content' },
          )
        ).output,
      ).toContain('new-file');
    } finally {
      await old.dispose();
      await current.dispose();
      prepared.dispose();
    }
    const builtin = {
      slug: 'consistent-guide',
      name: 'consistent-guide',
      description: 'Conflicting slug.',
      content: skillMd('consistent-guide', 'Conflicting slug.'),
      files: [],
    };
    const provider = createSandboxProvider({
      skills: h.services.skills,
      builtinSkills: new Map([['builtin', async () => builtin]]),
    });
    await expect(
      provider.prepare({ ...input, skill: [selected.id, 'builtin'] }),
    ).rejects.toThrow('duplicate');
    await expect(
      createSandboxProvider({
        skills: h.services.skills,
        builtinSkills: new Map([
          [
            'bad',
            async () => ({
              ...builtin,
              files: [{ path: '../outside', content: 'never' }],
            }),
          ],
        ]),
      }).prepare({ ...input, skill: ['bad'] }),
    ).rejects.toThrow('support path');
    await expect(
      provider.prepare({ ...input, skill: ['not-present'] }),
    ).rejects.toThrow();
  });
});
