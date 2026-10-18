import { ApiDocsService, CliService } from '@nocobase/app-server/router';
import { appendFile } from 'node:fs/promises';
import { afterEach, expect, it, vi } from 'vitest';
import { Hono, type MiddlewareHandler } from 'hono';
import { MockLanguageModelV4 } from 'ai/test';
import type { AuthorizationContext } from '@nocobase/authorization/core';
import type { Knex } from 'knex';
import { z } from 'zod';
import { claim, createHarness, type Harness } from './harness.js';
import { createChatRoutes } from '../server/routes/chat.js';
import type { AdminEnv } from '../server/routes/admin.js';
import { OnlineAgentService } from '../server/online-agent/service.js';
import { createSessionManager } from '../server/online-agent/sessions.js';
import { createChatAttachments } from '../server/core/conversations/attachments.js';
import { ProtocolError } from '../server/kernel/errors.js';

let h: Harness;
let service: OnlineAgentService;
afterEach(async () => {
  await service?.shutdown();
  await h?.close();
});
const usage = {
  inputTokens: { total: 1, noCache: 1, cacheRead: 0, cacheWrite: 0 },
  outputTokens: { total: 1, text: 1, reasoning: 0 },
};
const finish = (reason = 'stop') => ({
  type: 'finish' as const,
  usage,
  finishReason: { unified: reason as 'stop', raw: reason },
});
async function fixture() {
  h = await createHarness();
  let counter = 0,
    step = 0;
  const sql: string[] = [];
  const measurements: { phase: string; durationMs: number }[] = [];
  const client = await h.database.connection().client<Knex>();
  client.on('query', (query: { sql: string }) => sql.push(query.sql));
  const model = new MockLanguageModelV4({
    doStream: async () => ({
      stream: new ReadableStream({
        start(controller) {
          const chunks =
            step++ === 0
              ? [
                  {
                    type: 'tool-call',
                    toolCallId: 'business',
                    toolName: 'business',
                    input: '{}',
                  },
                  finish('tool-calls'),
                ]
              : [
                  { type: 'text-start', id: 'a' },
                  {
                    type: 'text-delta',
                    id: 'a',
                    delta: 'The business result is ready.',
                  },
                  { type: 'text-end', id: 'a' },
                  finish(),
                ];
          for (const chunk of chunks) controller.enqueue(chunk);
          controller.close();
        },
      }),
    }),
  });
  const attachments = createChatAttachments({
    tx: h.services.tx,
    basePath: () => '',
    storage: {
      store: async () => {
        throw new Error('Use fixture uploads.');
      },
      bytes: async () => new Uint8Array(),
      stream: async () => new ReadableStream(),
      remove: async () => {},
    },
  });
  const ids = { next: () => `http-${++counter}` };
  service = new OnlineAgentService({
    ids,
    sessions: createSessionManager({
      ids,
      tx: h.services.tx,
      attachments: attachments.links,
      now: () => new Date().toISOString(),
      measure: (phase, durationMs) => measurements.push({ phase, durationMs }),
    }),
    defaultModel: async () => ({ modelService: 'fixture', model: 'chat' }),
    model: async () => model,
    onError: () => {},
  });
  let release!: () => void;
  const wait = new Promise<void>((done) => {
    release = done;
  });
  const execute = vi.fn(async (_input, options) => {
    await wait;
    return { actor: options.context.user.id, value: 7 };
  });
  service.configurer.registerTool('business', {
    version: '1',
    definition: { inputSchema: z.object({}), execute },
  });
  const guard: MiddlewareHandler<AdminEnv> = async (c, next) => {
    const id = c.req.header('x-user');
    if (!id) throw new ProtocolError('UNAUTHORIZED', 'Sign in first.');
    c.set('caller', {
      userId: id,
      can: async () => false,
      opens: async () => true,
      scope: async () => 'none',
      onlineContext: {
        user: { id },
        authorization: {
          identity: { principal: { type: 'user', id } },
        } as AuthorizationContext,
        credentials: { fixture: id },
      },
    });
    await next();
  };
  const app = new Hono().route(
    '/agents',
    createChatRoutes({ ...h.services, onlineAgent: service }, guard),
  );
  const request = (
    path: string,
    method = 'GET',
    body?: unknown,
    user = 'alice',
  ) =>
    app.request(`/agents${path}`, {
      method,
      headers: {
        ...(user ? { 'x-user': user } : {}),
        'content-type': 'application/json',
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  return { app, request, execute, release, model, sql, measurements };
}

it('uses the original API for authenticated SDK tools, cached first receive, safe history and continued input', async () => {
  const f = await fixture();
  expect((await f.request('/conversations', 'POST', {}, '')).status).toBe(401);
  expect(
    (await f.request('/conversations', 'POST', { title: 'x'.repeat(201) }))
      .status,
  ).toBe(400);
  service.configurer.registerOnlineAgentScope('business', {
    tool: ['business'],
  });
  const created = await f.request('/conversations', 'POST', {
    config: { scope: ['business'] },
    title: 'Fixture chat',
  });
  expect(created.status).toBe(201);
  const { data: conversation } = await created.json();
  expect(conversation).toMatchObject({
    mode: 'online',
    title: 'Fixture chat',
    source: 'panel',
  });
  expect(
    (
      await f.request(
        `/conversations/${conversation.id}`,
        'GET',
        undefined,
        'bob',
      )
    ).status,
  ).toBe(404);
  expect(
    (
      await f.request(
        `/conversations/${conversation.id}/events`,
        'GET',
        undefined,
        'bob',
      )
    ).status,
  ).toBe(404);
  const upload = async (user: string, name: string) => {
    const form = new FormData();
    form.set('file', new File(['Fixture bytes'], name, { type: 'text/plain' }));
    const response = await f.app.request('/agents/chatAttachments', {
      method: 'POST',
      headers: { 'x-user': user },
      body: form,
    });
    expect(response.status).toBe(201);
    return (await response.json()).data.id as string;
  };
  const ownFile = await upload('alice', 'fixture.txt');
  const foreignFile = await upload('bob', 'private.txt');
  expect(
    (
      await f.request(`/conversations/${conversation.id}/messages`, 'POST', {
        content: 'Refused',
        attachmentIds: [ownFile, foreignFile],
      })
    ).status,
  ).toBe(404);
  expect(
    (
      await (
        await f.request(`/conversations/${conversation.id}/messages`)
      ).json()
    ).data,
  ).toHaveLength(0);
  const sent = await f.request(
    `/conversations/${conversation.id}/messages`,
    'POST',
    {
      content: 'Run',
      attachmentIds: [ownFile],
      clientId: 'display-only',
      context: { route: '/safe', items: [{ kind: 'secret', id: 'hidden' }] },
    },
  );
  expect(sent.status).toBe(201);
  expect((await sent.json()).data.message).toMatchObject({
    metadata: { clientId: 'display-only' },
    attachments: [{ id: ownFile }],
    workContext: { items: [] },
  });
  expect(
    (
      await f.request(`/conversations/${conversation.id}/messages`, 'POST', {
        content: 'Duplicate',
      })
    ).status,
  ).toBe(409);
  expect(
    (
      await f.request(`/conversations/${conversation.id}/config`, 'PATCH', {
        config: { thinking: 'high' },
      })
    ).status,
  ).toBe(409);
  const events = await f.request(`/conversations/${conversation.id}/events`);
  f.release();
  expect(await events.text()).toContain('event: saved');
  const agent = await service.realtime(
    {
      user: { id: 'alice' },
      authorization: {
        identity: { principal: { type: 'user', id: 'alice' } },
      } as AuthorizationContext,
      credentials: {},
    },
    { sessionId: conversation.id },
  );
  await vi.waitFor(async () => expect(await agent.status()).toBe('idle'));
  const history = await (
    await f.request(`/conversations/${conversation.id}/messages`)
  ).json();
  expect(JSON.stringify(history)).not.toContain('original');
  expect(JSON.stringify(history)).not.toContain('tool-result');
  expect(JSON.stringify(history)).toContain('The business result is ready.');
  expect(f.execute).toHaveBeenCalledTimes(1);
  expect(
    (await f.request(`/conversations/${conversation.id}/events`)).status,
  ).toBe(204);
  expect(
    (
      await f.request(`/conversations/${conversation.id}/messages`, 'POST', {
        content: 'Continue',
      })
    ).status,
  ).toBe(201);
  await vi.waitFor(async () => expect(await agent.status()).toBe('idle'));
  expect(
    (
      await f.request(`/conversations/${conversation.id}/config`, 'PATCH', {
        config: { thinking: 'high' },
      })
    ).status,
  ).toBe(200);
  expect(
    (await f.request(`/conversations/${conversation.id}/stop`, 'POST')).status,
  ).toBe(200);
  expect((await (await f.request('/conversations')).json()).data).toHaveLength(
    1,
  );
  expect(
    (await (await f.request('/conversations?agentId=online')).json()).data,
  ).toHaveLength(1);
  if (process.env.PM438_HTTP_SQL_REPORT)
    await appendFile(
      process.env.PM438_HTTP_SQL_REPORT,
      JSON.stringify({
        scenario: 'online-chat-http',
        sql: f.sql,
        measurements: f.measurements,
      }) + '\n',
    );
});

it.each(['static', 'provider'])(
  'atomically selects the resolved Scope model through HTTP (%s)',
  async (kind) => {
    const f = await fixture();
    const scope = { model: ['alternate/other'] };
    const provider = vi.fn(() => scope);
    service.configurer.registerOnlineAgentScope(
      'alternate',
      kind === 'static' ? scope : provider,
    );
    const { data: created } = await (
      await f.request('/conversations', 'POST', {})
    ).json();
    const changed = await f.request(
      `/conversations/${created.id}/config`,
      'PATCH',
      { config: { scope: ['alternate'] } },
    );
    expect(changed.status).toBe(200);
    expect((await changed.json()).data).toMatchObject({
      model: ['alternate/other'],
      selectedModel: { modelService: 'alternate', model: 'other' },
    });
    const row = await h.database
      .connection()
      .repository('agConversations')
      .findOne({ filter: { id: created.id } });
    expect(row).toMatchObject({ modelService: 'alternate', model: 'other' });
    expect(row?.metadata.onlineAgent.config.model).toEqual(['alternate/other']);
    expect(
      (
        await f.request(`/conversations/${created.id}/config`, 'PATCH', {
          config: { model: [] },
        })
      ).status,
    ).toBe(400);
    expect(
      (await (await f.request(`/conversations/${created.id}/config`)).json())
        .data.selectedModel,
    ).toEqual({ modelService: 'alternate', model: 'other' });
    expect(provider).toHaveBeenCalledTimes(kind === 'provider' ? 1 : 0);
    expect(f.measurements.map((measurement) => measurement.phase)).toEqual([
      'configure',
    ]);
    if (process.env.PM438_CONFIG_SQL_REPORT)
      await appendFile(
        process.env.PM438_CONFIG_SQL_REPORT,
        JSON.stringify({
          scenario: `configure-${kind}`,
          sql: f.sql,
          measurements: f.measurements,
        }) + '\n',
      );
  },
);

it('lets only the owner stop an unbound historical run even after its agent becomes unavailable', async () => {
  const f = await fixture();
  const runner = await h.registerRunner();
  const agentId = await h.createAgent({ source: 'runner' });
  const old = await h.services.conversations.create('alice', {
    agentId,
    source: 'panel',
  });
  await h.services.conversations.send('alice', old.id, {
    content: 'Upgrade-era work',
  });
  const [payload] = await claim(h, runner);
  const runId = payload.run.id;
  await h.request('POST', `/agents/runners/runs/${runId}/start`, {
    runnerKey: runner.key,
    body: {
      workDir: '/work/old',
      adapter: { kind: 'claude' },
      acceptsInput: true,
    },
  });
  await h.disableAgent(agentId);
  const path = `/conversations/${old.id}`;
  expect((await f.request(`${path}/stop`, 'POST', {}, '')).status).toBe(401);
  expect((await f.request(`${path}/stop`, 'POST', {}, 'bob')).status).toBe(404);
  expect((await h.services.runs.detail(runId)).cancelRequestedAt).toBeNull();
  const stopped = await f.request(`${path}/stop`, 'POST', {});
  expect(stopped.status).toBe(200);
  const detail = (await stopped.json()).data;
  expect(detail.execution).toBeUndefined();
  expect(detail.run.id).toBe(runId);
  expect(
    (await h.services.runs.detail(runId)).cancelRequestedAt,
  ).not.toBeNull();
  expect(
    (await f.request(`${path}/messages`, 'POST', { content: 'Continue' }))
      .status,
  ).toBe(400);
  expect((await f.request(`${path}/stop`, 'POST', {})).status).toBe(200);
  const idle = await h.services.conversations.create('alice', {
    agentId: await h.createAgent({ source: 'runner' }),
    source: 'panel',
  });
  expect(
    (await f.request(`/conversations/${idle.id}/stop`, 'POST', {})).status,
  ).toBe(200);
  expect(
    (
      await f.request(`/conversations/${idle.id}/messages`, 'POST', {
        content: 'Continue',
      })
    ).status,
  ).toBe(400);
});

it('accepts declared business variables but rejects browser policy overrides on create and configure', async () => {
  const f = await fixture();
  const actors: unknown[] = [];
  service.configurer.registerOnlineAgentScope('business-input', (actor) => {
    actors.push(actor);
    return {
      tool: ['business'],
      model: ['fixture/chat', 'fixture/second'],
      context: { variable: { count: 0 } },
      systemPromptTemplate: {
        variableSchema: z.strictObject({ count: z.number().int().min(0) }),
        template: (value) =>
          `Count ${(value.variable as { count: number }).count}`,
      },
    };
  });
  const configuration = {
    scope: ['business-input'],
    context: { variable: { count: 2 } },
    thinking: 'unregistered-level',
  };
  const created = await f.request('/conversations', 'POST', {
    config: configuration,
  });
  expect(created.status).toBe(201);
  const id = (await created.json()).data.id;
  const path = `/conversations/${id}/config`;
  expect((await (await f.request(path)).json()).data).toMatchObject({
    systemPrompt: 'Count 2',
    variable: { count: 2 },
    tool: ['business'],
    thinking: 'unregistered-level',
  });
  for (const config of [
    { tool: [] },
    { model: ['fixture/forged'] },
    { systemPromptTemplate: 'forged' },
    { context: { systemPrompt: 'forged' } },
    { permissions: [] },
    { unknown: true },
    { scope: ['business-input'], context: { variable: { count: '2' } } },
    {
      scope: ['business-input'],
      context: { variable: { count: 2, isAdmin: true } },
    },
    { scope: [], context: { variable: {} } },
    { scope: ['not-registered'] },
    { context: { variable: null } },
  ]) {
    expect((await f.request('/conversations', 'POST', { config })).status).toBe(
      400,
    );
    expect((await f.request(path, 'PATCH', { config })).status).toBe(400);
  }
  const denied = await f.request(
    path,
    'PATCH',
    { config: { scope: ['business-input'] } },
    'bob',
  );
  expect(denied.status).toBe(404);
  expect(
    (
      await f.request(path, 'PATCH', {
        config: {},
        selectedModel: { modelService: 'fixture', model: 'forged' },
      })
    ).status,
  ).toBe(400);
  expect(
    (
      await f.request(path, 'PATCH', {
        config: { context: { variable: { count: 3 } } },
        selectedModel: { modelService: 'fixture', model: 'second' },
      })
    ).status,
  ).toBe(200);
  expect((await (await f.request(path)).json()).data).toMatchObject({
    systemPrompt: 'Count 3',
    variable: { count: 3 },
    selectedModel: { modelService: 'fixture', model: 'second' },
  });
  expect(actors).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        user: { id: 'alice' },
        credentials: { fixture: 'alice' },
      }),
    ]),
  );
});

it('filters visibility before pagination for HTTP and its derived CLI, preserving owned direct reads', async () => {
  const f = await fixture();
  const create = async (visible?: boolean) => {
    const response = await f.request('/conversations', 'POST', {
      title: 'Needle',
      ...(visible === undefined ? {} : { showInChatList: visible }),
    });
    expect(response.status).toBe(201);
    const row = (await response.json()).data;
    expect(row.showInChatList).toBe(visible ?? true);
    return row.id as string;
  };
  const first = await create();
  const hidden = await create(false);
  const second = await create(true);
  const repo = h.database.connection().repository('agConversations');
  for (const [index, id] of [first, second, hidden].entries())
    await repo.updateMany({
      filter: { id },
      values: { lastMessageAt: new Date(1000 + index * 1000) },
    });
  for (const suffix of [
    '',
    '&q=needle',
    '&agentId=online',
    '&source=panel',
    '&archived=all',
  ]) {
    const page = await (
      await f.request(`/conversations?pageSize=1${suffix}`)
    ).json();
    expect(page.data.map((row: { id: string }) => row.id)).toEqual([second]);
    const next = await (
      await f.request(
        `/conversations?pageSize=1${suffix}&pageToken=${encodeURIComponent(page.meta.nextPageToken)}`,
      )
    ).json();
    expect(next.data.map((row: { id: string }) => row.id)).toEqual([first]);
    expect(next.meta.nextPageToken).toBeUndefined();
  }
  expect((await f.request(`/conversations/${hidden}`)).status).toBe(200);
  expect((await f.request(`/conversations/${hidden}/messages`)).status).toBe(
    200,
  );
  expect(
    (await f.request(`/conversations/${hidden}`, 'GET', undefined, 'bob'))
      .status,
  ).toBe(404);
  expect(
    (
      await f.request(`/conversations/${hidden}`, 'PATCH', {
        showInChatList: true,
      })
    ).status,
  ).toBe(400);
  for (const id of [first, hidden])
    await f.request(`/conversations/${id}`, 'PATCH', { archived: true });
  expect(
    (
      await (
        await f.request(
          '/conversations?archived=true&q=needle&agentId=online&source=panel',
        )
      ).json()
    ).data.map((row: { id: string }) => row.id),
  ).toEqual([first]);
  const docs = new ApiDocsService();
  docs.attach({
    api: f.app,
    describe: () => ({ info: { title: 'Chat', version: 'test' } }),
  });
  const cli = new CliService();
  const manifest = cli.manifestFor(await docs.getDocument(), {
    kind: 'person',
    userId: 'alice',
    displayName: 'Alice',
  });
  const command = manifest.commands.find(
    (item) => item.id === 'conversation:list',
  )!;
  expect(command.method).toBe('GET');
  const cliApp = new Hono().route('/api', f.app);
  const page = await cliApp.request(`${command.path}?pageSize=1&archived=all`, {
    headers: { 'x-user': 'alice' },
  });
  const cliPage = await page.json();
  expect(cliPage.data.map((row: { id: string }) => row.id)).toEqual([second]);
  const cliNext = await cliApp.request(
    `${command.path}?pageSize=1&archived=all&pageToken=${encodeURIComponent(cliPage.meta.nextPageToken)}`,
    { headers: { 'x-user': 'alice' } },
  );
  expect(
    (await cliNext.json()).data.map((row: { id: string }) => row.id),
  ).toEqual([first]);
  const createCommand = manifest.commands.find(
    (item) => item.id === 'conversation:create',
  )!;
  expect(createCommand.parameters).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        name: 'show-in-chat-list',
        field: 'showInChatList',
        type: 'boolean',
      }),
    ]),
  );
  const cliCreated = await cliApp.request(createCommand.path, {
    method: createCommand.method,
    headers: { 'x-user': 'alice', 'content-type': 'application/json' },
    body: JSON.stringify({ showInChatList: false }),
  });
  expect(cliCreated.status).toBe(201);
  expect((await cliCreated.json()).data.showInChatList).toBe(false);
});

it('exposes create then send without the removed start or executor-switch routes and commands', async () => {
  const f = await fixture();
  const created = await f.request('/conversations', 'POST', {});
  const id = (await created.json()).data.id;
  for (const path of [
    '/conversations/start',
    `/conversations/${id}/fallback`,
    `/conversations/${id}/restore`,
  ]) {
    expect((await f.request(path, 'POST', {})).status).toBe(404);
  }
  for (const context of [
    {
      route: '/',
      items: Array.from({ length: 11 }, (_, n) => ({
        kind: 'ticket',
        id: String(n),
      })),
    },
    { route: 'x'.repeat(501), items: [] },
    {
      route: '/',
      items: [],
      filter: {
        page: 'tickets',
        params: Object.fromEntries(
          Array.from({ length: 21 }, (_, n) => [`k${n}`, 'v']),
        ),
      },
    },
    { route: '/', items: [], selection: { text: 'x'.repeat(2001) } },
  ]) {
    expect(
      (
        await f.request(`/conversations/${id}/messages`, 'POST', {
          content: 'Check this page',
          context,
        })
      ).status,
    ).toBe(400);
  }
  const docs = new ApiDocsService();
  docs.attach({
    api: f.app,
    describe: () => ({ info: { title: 'Chat', version: 'test' } }),
  });
  const document = await docs.getDocument();
  const cli = new CliService();
  const ids = cli
    .manifestFor(document, {
      kind: 'person',
      userId: 'alice',
      displayName: 'Alice',
    })
    .commands.map((x) => x.id);
  expect(ids).toEqual(
    expect.arrayContaining([
      'conversation:create',
      'conversation:message:send',
    ]),
  );
  for (const id of [
    'conversation:start',
    'conversation:fallback',
    'conversation:restore',
  ])
    expect(ids).not.toContain(id);
  for (const path of Object.keys(document.paths ?? {}))
    expect(path).not.toMatch(
      /conversations\/(?:start|[^/]+\/(?:fallback|restore))$/,
    );
});
