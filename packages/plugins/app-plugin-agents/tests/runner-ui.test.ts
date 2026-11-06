import { measureUIReadCost, measureUIOperationCost } from './ui-read-cost.js';
import { appendFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Chat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { Hono, type MiddlewareHandler } from 'hono';
import type { AuthorizationContext } from '@nocobase/authorization/core';
import { createAgents, type Agents } from '../server/composition.js';
import type { OnlineAgentContext } from '../server/online/agent/types.js';
import type { AdminEnv } from '../server/routes/admin.js';
import { createChatRoutes } from '../server/routes/chat.js';
import { OnlineAgentUIStreams } from '../server/online/agent/transport/streams.js';
import { appUIMessageText, type AppUIMessage } from '../shared/online-agent.js';
import { createHarness, claim, type Harness } from './harness.js';

let h: Harness;
let other: Agents | undefined;
afterEach(async () => {
  await other?.onlineAgent.shutdown();
  other = undefined;
  await h?.services.onlineAgent.shutdown();
  await h?.close();
});
const actor = (id = 'alice'): OnlineAgentContext => ({
  user: { id },
  credentials: { fixture: id },
  authorization: {
    identity: { principal: { type: 'user', id } },
  } as AuthorizationContext,
});
const guard: MiddlewareHandler<AdminEnv> = async (context, next) => {
  const id = context.req.header('x-test-user') ?? 'alice';
  context.set('caller', {
    userId: id,
    can: async () => false,
    opens: async () => true,
    scope: async () => 'none',
    onlineContext: actor(id),
  });
  await next();
};
const timeline = (messages: AppUIMessage[]) =>
  messages
    .flatMap((message) =>
      (message.metadata!.sourceRecords ?? []).map((source) => {
        const part = message.parts[source.partIndex];
        return {
          seq: source.seq,
          key: source.partId,
          messageId: message.id,
          text:
            part.type === 'text'
              ? part.text
              : part.type === 'data-notice'
                ? part.data.title
                : '',
        };
      }),
    )
    .sort((a, b) => a.seq - b.seq);

it('refuses Runner resend through both the SDK and HTTP without creating a run', async () => {
  h = await createHarness();
  await h.registerRunner();
  const agentId = await h.createAgent({ source: 'runner' });
  const agent = await h.services.onlineAgent.realtime(actor(), { agentId });
  await expect(agent.resend()).rejects.toThrow('message resend');
  const app = new Hono().route('/agents', createChatRoutes(h.services, guard));
  const response = await app.request(
    `/agents/conversations/${agent.sessionId}/resend`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{}',
    },
  );
  expect(response.status).toBe(400);
  expect(await agent.history()).toEqual([]);
});

describe.skipIf(!process.env.PM481_REDIS_PORT)(
  'Runner SDK projection and Redis recovery across independent compositions',
  () => {
    it('preserves one logical message, source order, independent notices and complete pages during replay and refresh', async () => {
      const recovery = {
        namespace: `pm481:${randomUUID()}`,
        redis: {
          host: '127.0.0.1',
          port: Number(process.env.PM481_REDIS_PORT),
        },
      };
      const measurements: { phase: string; durationMs: number }[] = [];
      h = await createHarness({
        uiRecovery: recovery,
        measureOnlineAgent: (phase, durationMs) =>
          measurements.push({ phase, durationMs }),
      });
      const runner = await h.registerRunner();
      const agentId = await h.createAgent({ source: 'runner' });
      const agent = await h.services.onlineAgent.realtime(actor(), { agentId });
      const id = agent.sessionId;
      other = createAgents({
        database: h.database,
        idGenerator: { generateString: randomUUID },
        uiRecovery: recovery,
        clock: h.clock,
        basePath: () => '/main',
        onError: () => {},
      });
      const appB = new Hono().route('/agents', createChatRoutes(other, guard));
      const admitted = Promise.withResolvers<Response>();
      const chatFor = (app: Hono, messages: AppUIMessage[] = []) =>
        new Chat<AppUIMessage>({
          id,
          messages,
          transport: new DefaultChatTransport<AppUIMessage>({
            api: `http://fixture/agents/conversations/${id}/messages`,
            headers: { 'x-test-user': 'alice' },
            fetch: async (input, init) => {
              const response = await app.request(new Request(input, init));
              admitted.resolve(response);
              return response;
            },
            prepareSendMessagesRequest: ({ messages }) => ({
              body: { message: messages.at(-1) },
            }),
            prepareReconnectToStreamRequest: () => ({
              api: `http://fixture/agents/conversations/${id}/events`,
            }),
          }),
        });
      const chatA = chatFor(h.app);
      const sending = chatA.sendMessage({ text: 'Two source blocks' });
      expect((await admitted.promise).status).toBe(200);
      expect(
        (await h.services.conversations.get('alice', id)).execution.status,
      ).toBe('running');
      const [payload] = await claim(h, runner);
      const runId = payload.run.id;
      const report = (action: string, body: unknown) =>
        h.request('POST', `/agents/runners/runs/${runId}/${action}`, {
          runnerKey: runner.key,
          body,
        });
      await report('start', {
        workDir: '/fixture',
        adapter: { kind: 'claude' },
        acceptsInput: true,
      });
      const block = {
        seq: 1,
        at: h.clock.now().toISOString(),
        type: 'text',
        content: 'First block',
      };
      expect((await report('events', { events: [block] })).status).toBe(200);
      await vi.waitFor(() =>
        expect(appUIMessageText(chatA.messages.at(-1)!)).toBe('First block'),
      );
      await chatA.stop();
      await sending;
      expect((await h.services.runs.get(runId)).cancelRequestedAt).toBeNull();
      const remote = await other.onlineAgent.realtime(actor(), {
        sessionId: id,
      });
      const chatB = chatFor(appB, await remote.history());
      const resuming = chatB.resumeStream();
      await vi.waitFor(() =>
        expect(appUIMessageText(chatB.messages.at(-1)!)).toBe('First block'),
      );
      expect(
        (
          await appB.request(`/agents/conversations/${id}/events`, {
            headers: { 'x-test-user': 'bob' },
          })
        ).status,
      ).toBe(404);
      await h.services.tx.run((unit) =>
        h.services.conversations.deliver(unit, id, {
          notice: {
            code: 'news',
            type: 'fixture',
            title: 'Independent notice',
          },
        }),
      );
      const second = {
        seq: 2,
        at: h.clock.now().toISOString(),
        type: 'text',
        content: 'Second block',
      };
      expect((await report('events', { events: [block, second] })).status).toBe(
        200,
      );
      expect((await report('events', { events: [block, second] })).status).toBe(
        200,
      );
      await vi.waitFor(() =>
        expect(appUIMessageText(chatB.messages.at(-1)!)).toBe(
          'First block\nSecond block',
        ),
      );
      const page = await remote.messages({ limit: 1 });
      expect(page.items).toHaveLength(2);
      expect(timeline(page.items).map((item) => [item.seq, item.text])).toEqual(
        [
          [2, 'First block'],
          [3, 'Independent notice'],
          [4, 'Second block'],
        ],
      );
      expect(new Set(timeline(page.items).map((item) => item.key)).size).toBe(
        3,
      );
      const assistant = page.items.find(
        (message) => message.role === 'assistant',
      )!;
      expect(assistant.id).toBe(`runner:${runId}`);
      expect(assistant.metadata!.sourceRecords).toHaveLength(2);
      const older = await remote.messages({
        limit: 1,
        before: page.items[0].metadata!.seq,
      });
      expect(older.items).toHaveLength(1);
      expect(older.items[0].role).toBe('user');
      const forward = await remote.messages({ limit: 1, after: 2 });
      expect(forward.nextAfter).toBe(3);
      expect(forward.items.map((message) => message.role)).toEqual(['system']);
      const remaining = await remote.messages({
        limit: 1,
        after: forward.nextAfter,
      });
      expect(remaining.items).toEqual([assistant]);
      expect(remaining.nextAfter).toBeUndefined();
      expect(
        (await remote.messages({ limit: 1, ids: [assistant.id] })).items,
      ).toEqual([assistant]);
      const inputs = (await h.services.runs.detail(runId)).inputs.map(
        (input) => input.id,
      );
      expect(
        (
          await report('complete', {
            summary: 'Done',
            handledInputIds: inputs,
            sessionId: 'fixture',
          })
        ).status,
      ).toBe(200);
      await resuming;
      expect(chatB.error).toBeUndefined();
      expect(
        chatB.messages.filter((message) => message.role === 'assistant'),
      ).toHaveLength(1);
      expect(chatB.messages.at(-1)).toEqual(assistant);
      expect(await remote.status()).toBe('idle');
      await measureUIReadCost(h, 'runner', {
        history: () => appB.request(`/agents/conversations/${id}/messages`),
        forward: () =>
          appB.request(`/agents/conversations/${id}/messages?after=4`),
        revision: () =>
          appB.request(
            `/agents/conversations/${id}/messages?ids=${encodeURIComponent(assistant.id)}`,
          ),
        detail: () => appB.request(`/agents/conversations/${id}`),
      });

      expect(timeline(await remote.history()).map((item) => item.text)).toEqual(
        [
          'Two source blocks',
          'First block',
          'Independent notice',
          'Second block',
        ],
      );
      expect(
        (await appB.request(`/agents/conversations/${id}/events`)).status,
      ).toBe(204);
      expect(
        await h.services.tx
          .read()
          .repository('agConversationMessages')
          .count({ filter: { conversationId: id } }),
      ).toBe(4);
      if (process.env.PM481_C_REPORT)
        await appendFile(
          process.env.PM481_C_REPORT,
          JSON.stringify({ kind: 'runner-recovery', measurements }) + '\n',
        );
      expect(
        await h.services.tx
          .read()
          .repository('agRuns')
          .count({ filter: { subjectId: id } }),
      ).toBe(1);
    });
    it('finalizes a completed Run after restart through concurrent ordinary HTTP reads without redispatch', async () => {
      const recovery = {
        namespace: `pm481:${randomUUID()}`,
        redis: {
          host: '127.0.0.1',
          port: Number(process.env.PM481_REDIS_PORT),
        },
      };
      h = await createHarness({ uiRecovery: recovery });
      const runner = await h.registerRunner();
      const agentId = await h.createAgent({ source: 'runner' });
      const local = await h.services.onlineAgent.realtime(actor(), { agentId });
      await local.send([
        { role: 'user', content: 'Finish after producer restart' },
      ]);
      const [payload] = await claim(h, runner);
      expect(
        (
          await h.request(
            'POST',
            `/agents/runners/runs/${payload.run.id}/start`,
            {
              runnerKey: runner.key,
              body: {
                workDir: '/fixture',
                adapter: { kind: 'claude' },
                acceptsInput: true,
              },
            },
          )
        ).status,
      ).toBe(200);
      await h.services.onlineAgent.shutdown();
      expect(
        (
          await h.request(
            'POST',
            `/agents/runners/runs/${payload.run.id}/events`,
            {
              runnerKey: runner.key,
              body: {
                events: [
                  {
                    seq: 1,
                    at: h.clock.now().toISOString(),
                    type: 'text',
                    content: 'Saved before completion',
                  },
                ],
              },
            },
          )
        ).status,
      ).toBe(200);
      expect(
        (
          await h.request(
            'POST',
            `/agents/runners/runs/${payload.run.id}/complete`,
            {
              runnerKey: runner.key,
              body: {
                summary: 'Finished',
                handledInputIds: (
                  await h.services.runs.detail(payload.run.id)
                ).inputs.map((input) => input.id),
                sessionId: 'fixture',
              },
            },
          )
        ).status,
      ).toBe(200);
      other = createAgents({
        database: h.database,
        idGenerator: { generateString: randomUUID },
        uiRecovery: recovery,
        clock: h.clock,
        onError: () => {},
      });
      const finalizer = createAgents({
        database: h.database,
        idGenerator: { generateString: randomUUID },
        uiRecovery: recovery,
        clock: h.clock,
        onError: () => {},
      });
      try {
        const a = new Hono().route('/agents', createChatRoutes(other, guard));
        const b = new Hono().route(
          '/agents',
          createChatRoutes(finalizer, guard),
        );
        const path = `/agents/conversations/${local.sessionId}`;
        const answers = await Promise.all([
          a.request(`${path}/messages`),
          b.request(`${path}/messages`),
        ]);
        for (const answer of answers) expect(answer.status).toBe(200);
        for (const app of [a, b])
          expect(
            (await (await app.request(path)).json()).data.execution.status,
          ).toBe('idle');
        const page = (await (await a.request(`${path}/messages`)).json())
          .data as AppUIMessage[];
        expect(
          page.filter((message) => message.role === 'assistant'),
        ).toHaveLength(1);
        expect(appUIMessageText(page.at(-1)!)).toBe('Saved before completion');
        expect((await b.request(`${path}/events`)).status).toBe(204);
        expect(
          await h.services.tx
            .read()
            .repository('agRuns')
            .count({ filter: { subjectId: local.sessionId } }),
        ).toBe(1);
      } finally {
        await finalizer.onlineAgent.shutdown();
      }
    });

    it('keeps a lost producer busy, stops independently and automatically finalizes only a synchronized terminal Run', async () => {
      const recovery = {
        namespace: `pm481:${randomUUID()}`,
        redis: {
          host: '127.0.0.1',
          port: Number(process.env.PM481_REDIS_PORT),
        },
      };
      h = await createHarness({ uiRecovery: recovery });
      const runner = await h.registerRunner();
      const agentId = await h.createAgent({ source: 'runner' });
      const local = await h.services.onlineAgent.realtime(actor(), { agentId });
      await local.send([{ role: 'user', content: 'Existing run only' }]);
      const [payload] = await claim(h, runner);
      await h.services.onlineAgent.shutdown();
      other = createAgents({
        database: h.database,
        idGenerator: { generateString: randomUUID },
        uiRecovery: recovery,
        clock: h.clock,
        onError: () => {},
      });
      const remote = await measureUIOperationCost(
        h,
        'runner-reopen-running',
        () =>
          other!.onlineAgent.realtime(actor(), {
            sessionId: local.sessionId,
          }),
      );
      expect(await remote.status()).toBe('running');
      await expect(remote.receive()).rejects.toThrow(
        /expired|finished|interrupted/,
      );
      await remote.abort();
      expect(
        (await h.services.runs.get(payload.run.id)).cancelRequestedAt,
      ).not.toBeNull();
      expect(await remote.status()).toBe('running');
      await h.request(
        'POST',
        `/agents/runners/runs/${payload.run.id}/cancelAck`,
        { runnerKey: runner.key, body: {} },
      );
      const finalizer = createAgents({
        database: h.database,
        idGenerator: { generateString: randomUUID },
        uiRecovery: recovery,
        clock: h.clock,
        onError: () => {},
      });
      try {
        await expect(
          finalizer.onlineAgent.realtime(actor('bob'), {
            sessionId: local.sessionId,
          }),
        ).rejects.toThrow();
        const sync = vi
          .spyOn(finalizer.conversations, 'syncRun')
          .mockRejectedValueOnce(new Error('Final synchronization failed'));
        await expect(
          finalizer.onlineAgent.realtime(actor(), {
            sessionId: local.sessionId,
          }),
        ).rejects.toThrow('Final synchronization failed');
        expect(await remote.status()).toBe('running');
        const cleanup = vi
          .spyOn(OnlineAgentUIStreams.prototype, 'forgetCompleted')
          .mockRejectedValueOnce(new Error('Association cleanup failed'));
        try {
          await expect(
            finalizer.onlineAgent.realtime(actor(), {
              sessionId: local.sessionId,
            }),
          ).rejects.toThrow('Association cleanup failed');
          expect(await remote.status()).toBe('running');
        } finally {
          cleanup.mockRestore();
        }
        const reopened = await measureUIOperationCost(
          h,
          'runner-reopen-terminal',
          () =>
            finalizer.onlineAgent.realtime(actor(), {
              sessionId: local.sessionId,
            }),
        );
        expect(await reopened.status()).toBe('idle');
        expect(await reopened.receive()).toBeNull();
        expect(
          await (
            await finalizer.onlineAgent.realtime(actor(), {
              sessionId: local.sessionId,
            })
          ).status(),
        ).toBe('idle');
        expect(sync).toHaveBeenCalledTimes(3);
      } finally {
        await finalizer.onlineAgent.shutdown();
      }
      expect(await remote.status()).toBe('idle');
      expect(await remote.receive()).toBeNull();
      expect(
        await h.services.tx
          .read()
          .repository('agRuns')
          .count({ filter: { subjectId: local.sessionId } }),
      ).toBe(1);
    });
  },
);

it('does not create a phantom SDK assistant when a Run ends without saved output', async () => {
  h = await createHarness();
  const runner = await h.registerRunner();
  const agentId = await h.createAgent({ source: 'runner' });
  const agent = await h.services.onlineAgent.realtime(actor(), { agentId });
  const admitted = Promise.withResolvers<Response>();
  const chat = new Chat<AppUIMessage>({
    id: agent.sessionId,
    transport: new DefaultChatTransport<AppUIMessage>({
      api: `http://fixture/agents/conversations/${agent.sessionId}/messages`,
      headers: { 'x-test-user': 'alice' },
      fetch: async (input, init) => {
        const response = await h.app.request(new Request(input, init));
        admitted.resolve(response);
        return response;
      },
      prepareSendMessagesRequest: ({ messages }) => ({
        body: { message: messages.at(-1) },
      }),
    }),
  });
  const sending = chat.sendMessage({ text: 'No saved output' });
  expect((await admitted.promise).status).toBe(200);
  expect(chat.messages.map((message) => message.role)).toEqual(['user']);
  const [payload] = await claim(h, runner);
  const runId = payload.run.id;
  expect(
    (
      await h.request('POST', `/agents/runners/runs/${runId}/start`, {
        runnerKey: runner.key,
        body: {
          workDir: '/fixture',
          adapter: { kind: 'claude' },
          acceptsInput: true,
        },
      })
    ).status,
  ).toBe(200);
  const inputs = (await h.services.runs.detail(runId)).inputs.map(
    (input) => input.id,
  );
  expect(
    (
      await h.request('POST', `/agents/runners/runs/${runId}/complete`, {
        runnerKey: runner.key,
        body: {
          summary: 'No reply',
          handledInputIds: inputs,
          sessionId: 'fixture',
        },
      })
    ).status,
  ).toBe(200);
  await sending;
  expect(chat.error).toBeUndefined();
  // The live response only said where it stood (`data-phase`); it shows nothing once the run ended.
  expect(
    chat.messages
      .filter((message) =>
        message.parts.some((part) => part.type !== 'data-phase'),
      )
      .map((message) => message.role),
  ).toEqual(['user']);
  const history = await agent.history();
  expect(history.map((message) => message.role)).toEqual(['user']);
  expect(history[0].metadata!.clientId).toBe(chat.messages[0].id);
  expect(await agent.status()).toBe('idle');
});
