// @vitest-environment node
/**
 * The plugin on its own: an application with only authentication, authorization and agents (their
 * migrations, no other plugin's tables), with nothing registered by an application. A person chats with an agent, a runner takes the
 * conversation's run and answers it the way the runner's echo adapter does, and the answer becomes a message. The
 * run names its conversation through the run routes.
 */
import { createSecretsService } from '@nocobase/app-server/secrets';
import { createRequire } from 'node:module';
import path from 'node:path';

import {
  HEADERS,
  PROTOCOL_VERSION,
  ProtocolError,
  type RegisterRequest,
} from '@nocobase/agent-protocol';
import {
  createTestDatabase,
  type TestDatabase,
} from '@nocobase/app-testing/server';
import { Hono, type MiddlewareHandler } from 'hono';
import { afterEach, expect, it } from 'vitest';

import type { SettingsAction, SettingsItem } from '../shared/access.js';
import {
  AGENTS_MIGRATIONS,
  AGENTS_PACKAGE,
  createAgents,
  createRunnerRoutes,
} from '../server/testing.js';
import { createAdminRoutes, type AdminEnv } from '../server/routes/admin.js';
import { createChatRoutes } from '../server/routes/chat.js';
import { createRunRoutes } from '../server/routes/run.js';
import { createModelRoutes } from '../server/online/routes.js';

const require = createRequire(import.meta.url);
const migrationsOf = (name: string) =>
  path.join(
    path.dirname(require.resolve(`${name}/package.json`)),
    'database/migrations',
  );

let testDatabase: TestDatabase | undefined;
afterEach(async () => {
  await testDatabase?.destroy();
  testDatabase = undefined;
});

it('runs a conversation on a runner with nothing but authentication, authorization and agents', async () => {
  testDatabase = await createTestDatabase();
  const database = testDatabase.database;
  for (const [directory, packageName] of [
    [
      migrationsOf('@nocobase/app-plugin-authentication'),
      '@nocobase/app-plugin-authentication',
    ],
    [
      migrationsOf('@nocobase/app-plugin-authorization'),
      '@nocobase/app-plugin-authorization',
    ],
    [AGENTS_MIGRATIONS, AGENTS_PACKAGE],
  ] as const)
    await database.createMigrator({ directory, packageName }).latest();
  const collections = database.connection().collections;
  expect(await collections.get('agConversations')).toBeTruthy();
  expect(await collections.get('pmIssues')).toBeFalsy();

  let next = 0;
  const idGenerator = { generateString: () => `s-${(next += 1)}` };
  const agents = createAgents({
    database,
    idGenerator,
    secrets: createSecretsService({
      keys: [{ version: 1, key: 'b'.repeat(64) }],
    }),
    onError: () => undefined,
  });

  // A signed-in person, as the application's authentication and authorization would set them.
  const guard: MiddlewareHandler<AdminEnv> = async (context, nextHandler) => {
    const user = context.req.header('x-test-user');
    if (!user) throw new ProtocolError('UNAUTHORIZED', 'Sign in first.');
    context.set('caller', {
      userId: user,
      can: (_item: SettingsItem, _action: SettingsAction) =>
        Promise.resolve(user === 'admin'),
    });
    await nextHandler();
  };
  const app = new Hono();
  app.route(
    '/agents/runners',
    createRunnerRoutes(agents, { pollTimeoutMs: 50 }),
  );
  app.route('/agents', createRunRoutes(agents));
  app.route('/agents', createChatRoutes(agents, guard));
  app.route('/agents', createModelRoutes(agents, guard));
  app.route('/agents', createAdminRoutes(agents, guard));
  const call = async (
    method: string,
    url: string,
    options: {
      body?: unknown;
      user?: string;
      runnerKey?: string;
      runToken?: string;
    } = {},
  ) => {
    const response = await app.request(url, {
      method,
      headers: {
        'content-type': 'application/json',
        [HEADERS.protocol]: String(PROTOCOL_VERSION),
        ...(options.user ? { 'x-test-user': options.user } : {}),
        ...(options.runnerKey
          ? { [HEADERS.runnerKey]: options.runnerKey }
          : {}),
        ...(options.runToken ? { [HEADERS.runToken]: options.runToken } : {}),
      },
      ...(options.body === undefined
        ? {}
        : { body: JSON.stringify(options.body) }),
    });
    const text = await response.text();
    return {
      status: response.status,
      body: text ? (JSON.parse(text) as any) : null,
    };
  };

  // An administrator creates an agent; nobody offers business actions, subjects or scopes beyond this plugin's.
  const agent = await call('POST', '/agents', {
    user: 'admin',
    body: {
      name: 'Echo',
      modelEntries: [{ tool: 'claude' }],
      access: 'everyone',
    },
  });
  expect(agent.status).toBe(201);
  expect(
    (await call('GET', '/agents/actions', { user: 'admin' })).body,
  ).toEqual({ data: [], meta: { total: 0 } });
  const vocabulary = await call('GET', '/agents/vocabulary', {
    user: 'admin',
  });
  expect(
    vocabulary.body.data.subjects.map(
      (subject: { kind: string }) => subject.kind,
    ),
  ).toEqual(['consultation', 'conversation']);
  expect(
    vocabulary.body.data.scopes.map((scope: { key: string }) => scope.key),
  ).toEqual(['workdir']);

  // A runner connects with the echo tool.
  const token = await agents.runners.createRegistrationToken('admin', {
    trust: 'team',
  });
  const registration: RegisterRequest = {
    registrationToken: token.token,
    name: 'echo-runner',
    hostname: 'host',
    os: 'linux',
    arch: 'x64',
    version: '0.0.1',
    protocolVersion: PROTOCOL_VERSION,
    features: ['input', 'skills', 'secrets'],
    tools: [{ kind: 'claude', authenticated: true, version: 'echo' }],
    slots: 1,
  };
  const registered = await call('POST', '/agents/runners/register', {
    body: registration,
  });
  expect(registered.status).toBe(200);
  const runnerKey = registered.body.data.runnerKey as string;

  // A person chats with the agent.
  const conversation = await call('POST', '/agents/conversations', {
    user: 'alice',
    body: { agentId: agent.body.data.id },
  });
  expect(conversation.status).toBe(201);
  const id = conversation.body.data.id as string;
  const sent = await call('POST', `/agents/conversations/${id}/messages`, {
    user: 'alice',
    body: { content: 'ping' },
  });
  expect(sent.status).toBe(201);
  expect(sent.body.data.run).toMatchObject({ outcome: 'created' });

  // The runner claims the run and answers it as the echo adapter does: the message, as text.
  const claimed = await call('POST', '/agents/runners/claim', {
    runnerKey,
    body: { free: 1 },
  });
  expect(claimed.status).toBe(200);
  const [payload] = claimed.body.data.runs;
  expect(payload.subject.key).toBe(`chat-${id}`);
  expect(payload.prompt.system).toContain('private conversation');
  const runId = payload.run.id as string;
  const runToken = payload.cli.credential.content.token as string;

  // The run's CLI reads the application's manifest; `conversation title set` is a run route.
  expect(payload.cli.credential.content.manifestUrl).toBe('/api/cli/manifest');
  const titled = await call('PATCH', '/agents/runs/current/conversation', {
    runToken,
    body: { title: 'Ping' },
  });
  expect(titled.status).toBe(200);

  const runner = (action: string, body: unknown) =>
    call('POST', `/agents/runners/runs/${runId}/${action}`, {
      runnerKey,
      body,
    });
  expect(
    (
      await runner('start', {
        workDir: '/work/chat',
        adapter: { kind: 'claude', version: 'echo' },
        acceptsInput: true,
      })
    ).status,
  ).toBe(200);
  const echoed = payload.inputs
    .map((input: { text: string }) => input.text)
    .join('\n');
  expect(
    (
      await runner('events', {
        events: [
          {
            seq: payload.run.firstSeq,
            at: new Date().toISOString(),
            type: 'text',
            content: echoed,
          },
        ],
      })
    ).status,
  ).toBe(200);
  expect(
    (
      await runner('complete', {
        summary: 'Echoed.',
        handledInputIds: payload.inputs.map(
          (input: { id: string }) => input.id,
        ),
      })
    ).status,
  ).toBe(200);

  const messages = await call('GET', `/agents/conversations/${id}/messages`, {
    user: 'alice',
  });
  expect(
    messages.body.data.map((message: { role: string; content: any }) => [
      message.role,
      message.content.content,
    ]),
  ).toEqual([
    ['user', 'ping'],
    ['assistant', 'ping'],
  ]);
  const detail = await call('GET', `/agents/conversations/${id}`, {
    user: 'alice',
  });
  expect(detail.body.data).toMatchObject({ title: 'Ping', run: null });
});
