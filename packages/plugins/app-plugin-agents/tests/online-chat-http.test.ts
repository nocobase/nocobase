import { appendFile } from 'node:fs/promises';
import { afterEach, expect, it, vi } from 'vitest';
import { Hono, type MiddlewareHandler } from 'hono';
import { MockLanguageModelV4 } from 'ai/test';
import type { AuthorizationContext } from '@nocobase/authorization/core';
import type { Knex } from 'knex';
import { z } from 'zod';
import { createHarness, type Harness } from './harness.js';
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
  const created = await f.request('/conversations', 'POST', {
    config: { tool: ['business'] },
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
