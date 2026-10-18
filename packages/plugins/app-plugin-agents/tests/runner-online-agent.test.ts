import { afterEach, expect, it, vi } from 'vitest';
import type { AuthorizationContext } from '@nocobase/authorization/core';
import type { OnlineAgentContext } from '../server/online-agent/config.js';
import { appUIMessageText } from '../shared/online-agent.js';
import type { NativeUIChunk as OnlineAgentStreamEvent } from '../server/online-agent/native.js';
import { claim, createHarness, type Harness } from './harness.js';
import { appendFile } from 'node:fs/promises';
import type { Knex } from 'knex';

let h: Harness;
afterEach(async () => {
  await h?.services.onlineAgent.shutdown();
  await h?.close();
});
const context = (id = 'alice'): OnlineAgentContext => ({
  user: { id },
  credentials: { kind: 'test-session', userId: id },
  authorization: {
    identity: { principal: { type: 'user', id } },
  } as AuthorizationContext,
});
async function fixture() {
  h = await createHarness();
  const runner = await h.registerRunner();
  const agentId = await h.createAgent({
    source: 'runner',
    name: 'Runner helper',
  });
  const agent = await h.services.onlineAgent.realtime(context(), { agentId });
  return {
    runner,
    agentId,
    agent,
    report: (runId: string, action: string, body: unknown) =>
      h.request('POST', `/agents/runners/runs/${runId}/${action}`, {
        runnerKey: runner.key,
        body,
      }),
  };
}

it('streams two canonical blocks before completion, deduplicates retransmission and keeps real notice positions', async () => {
  const f = await fixture();
  expect(f.agent.backend).toBe('runner');
  await f.agent.send([{ role: 'user', content: 'Two blocks' }]);
  const stream = await f.agent.receive();
  const events: OnlineAgentStreamEvent[] = [];
  const reader = stream!.getReader();
  const reading = (async () => {
    for (;;) {
      const next = await reader.read();
      if (next.done) break;
      events.push(next.value);
    }
  })();
  const [claimed] = await claim(h, f.runner);
  const runId = claimed.run.id;
  expect(
    (
      await f.report(runId, 'start', {
        workDir: '/work/chat',
        adapter: { kind: 'claude' },
        acceptsInput: true,
      })
    ).status,
  ).toBe(200);
  const block = {
    seq: 2,
    at: h.clock.now().toISOString(),
    type: 'text',
    content: 'First block',
  };
  expect(
    (
      await f.report(runId, 'events', {
        events: [
          {
            seq: 1,
            at: h.clock.now().toISOString(),
            type: 'text',
            content: '   ',
          },
          block,
        ],
      })
    ).status,
  ).toBe(200);
  await vi.waitFor(() =>
    expect(events.filter((event) => event.type === 'text-end')).toHaveLength(1),
  );
  await h.services.tx.run((unit) =>
    h.services.conversations.deliver(unit, f.agent.sessionId, {
      notice: { code: 'news', type: 'fixture', title: 'Notice' },
    }),
  );
  expect(
    (
      await f.report(runId, 'events', {
        events: [
          block,
          {
            seq: 3,
            at: h.clock.now().toISOString(),
            type: 'thinking',
            content: 'Working',
          },
          {
            seq: 4,
            at: h.clock.now().toISOString(),
            type: 'text',
            content: 'Second block',
          },
        ],
      })
    ).status,
  ).toBe(200);
  await vi.waitFor(() =>
    expect(events.filter((event) => event.type === 'text-end')).toHaveLength(2),
  );
  expect(await f.agent.status()).toBe('running');
  expect(events.some((event) => event.type === 'finish')).toBe(false);
  const before = await f.agent.history();
  expect(
    before
      .flatMap((message) =>
        message
          .metadata!.sourceRecords!.filter(
            (source) => message.parts[source.partIndex].type !== 'file',
          )
          .map((source) => {
            const part = message.parts[source.partIndex];
            return [
              source.seq,
              part.type === 'text'
                ? part.text
                : part.type === 'data-notice'
                  ? part.data.title
                  : '',
            ];
          }),
      )
      .sort((a, b) => Number(a[0]) - Number(b[0])),
  ).toEqual([
    [1, 'Two blocks'],
    [2, 'First block'],
    [3, 'Notice'],
    [4, 'Second block'],
  ]);
  const inputs = (await h.services.runs.detail(runId)).inputs.map(
    (input) => input.id,
  );
  expect(
    (
      await f.report(runId, 'complete', {
        summary: 'Done',
        handledInputIds: inputs,
        sessionId: 'fixture-session',
      })
    ).status,
  ).toBe(200);
  await reading;
  expect(events.at(-1)).toMatchObject({ type: 'finish' });
  expect(await f.agent.status()).toBe('idle');
  expect(await f.agent.history()).toEqual(before);
  expect(await f.agent.receive()).toBeNull();
  const stored = await h.database
    .connection()
    .repository('agConversations')
    .findOne({ filter: { id: f.agent.sessionId } });
  expect(stored?.metadata).not.toHaveProperty('onlineAgent');
  expect(stored?.model).toBeNull();
});

it('accepts exactly one concurrent round, gates shared sends and keeps cancelling busy until acknowledgement', async () => {
  const f = await fixture();
  const other = await h.services.onlineAgent.realtime(context(), {
    sessionId: f.agent.sessionId,
  });
  const results = await Promise.allSettled([
    f.agent.send([{ role: 'user', content: 'One' }]),
    other.send([{ role: 'user', content: 'Two' }]),
  ]);
  expect(
    results.filter((result) => result.status === 'fulfilled'),
  ).toHaveLength(1);
  expect(await f.agent.history()).toHaveLength(1);
  await expect(
    h.services.conversations.send('alice', f.agent.sessionId, {
      content: 'Bypass',
    }),
  ).rejects.toThrow('OnlineAgent');
  const [claimed] = await claim(h, f.runner);
  await f.report(claimed.run.id, 'start', {
    workDir: '/work/chat',
    adapter: { kind: 'claude' },
    acceptsInput: true,
  });
  const stream = await f.agent.receive();
  await stream!.cancel();
  expect(await f.agent.status()).toBe('running');
  expect(
    (await h.services.runs.get(claimed.run.id)).cancelRequestedAt,
  ).toBeNull();
  await f.agent.abort();
  expect(await f.agent.status()).toBe('running');
  await expect(
    f.agent.send([{ role: 'user', content: 'Too early' }]),
  ).rejects.toThrow('busy');
  expect((await f.report(claimed.run.id, 'cancelAck', {})).status).toBe(200);
  await vi.waitFor(async () => expect(await f.agent.status()).toBe('idle'));
  await f.agent.send([{ role: 'user', content: 'Next' }]);
  expect(await f.agent.status()).toBe('running');
});

it('selects scoped Runner configuration before native model lookup and restores without providers', async () => {
  const f = await fixture();
  const provider = vi.fn(() => ({ agentId: f.agentId }));
  h.services.onlineAgent.configurer.registerOnlineAgentScope(
    'coding',
    provider,
  );
  const agent = await h.services.onlineAgent.realtime(context(), {
    scope: ['coding'],
  });
  expect(agent.backend).toBe('runner');
  await h.services.onlineAgent.realtime(context(), {
    sessionId: agent.sessionId,
  });
  expect(provider).toHaveBeenCalledTimes(1);
  await expect(
    h.services.onlineAgent.realtime(context(), {
      sessionId: agent.sessionId,
      agentId: 'online',
    }),
  ).rejects.toThrow('new conversation');
  await expect(
    h.services.onlineAgent.realtime(context('bob'), {
      sessionId: agent.sessionId,
    }),
  ).rejects.toThrow('not found');
  await expect(
    h.services.onlineAgent.realtime(context(), {
      agentId: f.agentId,
      model: ['native/model'],
    }),
  ).rejects.toThrow('native models');
  await expect(
    h.services.onlineAgent.background(context(), { agentId: f.agentId }),
  ).rejects.toThrow('Runner realtime');
  const created = await h.request('POST', '/agents/conversations', {
    user: 'alice',
    body: { agentId: f.agentId },
  });
  expect(created.status).toBe(201);
  const sent = await h.app.request(
    `/agents/conversations/${created.body.data.id}/messages`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-test-user': 'alice' },
      body: JSON.stringify({
        message: {
          id: 'no-native-model',
          role: 'user',
          parts: [{ type: 'text', text: 'No application model needed' }],
        },
      }),
    },
  );
  expect(sent.status).toBe(200);
  expect(sent.headers.get('x-vercel-ai-ui-message-stream')).toBe('v1');
  await sent.body!.cancel();
  expect(
    (await h.services.conversations.get('alice', created.body.data.id))
      .execution.status,
  ).toBe('running');
});
it('applies explicit pending scopes to the latest saved configuration and freezes providers while busy', async () => {
  const f = await fixture();
  const provider = vi.fn(() => ({ systemPromptTemplate: 'Pending prompt' }));
  h.services.onlineAgent.configurer.registerOnlineAgentScope(
    'pending',
    provider,
  );
  const pending = await h.services.onlineAgent.realtime(context(), {
    sessionId: f.agent.sessionId,
    scope: ['pending'],
  });
  expect(provider).not.toHaveBeenCalled();
  await h.services.onlineAgent.configure(context(), f.agent.sessionId, {
    context: { variable: { retained: true } },
  });
  await pending.send([{ role: 'user', content: 'Apply pending scope' }]);
  expect(provider).toHaveBeenCalledTimes(1);
  expect(
    await h.services.onlineAgent.configuration(context(), f.agent.sessionId),
  ).toMatchObject({
    systemPrompt: 'Pending prompt',
    variable: { retained: true },
  });
  await expect(
    pending.send([{ role: 'user', content: 'Busy override' }], {
      overrides: { scope: ['pending'] },
    }),
  ).rejects.toThrow('busy');
  expect(provider).toHaveBeenCalledTimes(1);
});
it('keeps retry backoff and the next attempt busy, without saved or contamination from a late report', async () => {
  const f = await fixture();
  await f.agent.send([{ role: 'user', content: 'Retry' }]);
  const events: OnlineAgentStreamEvent[] = [];
  const reader = (await f.agent.receive())!.getReader();
  const reading = (async () => {
    for (;;) {
      const next = await reader.read();
      if (next.done) break;
      events.push(next.value);
    }
  })();
  const [first] = await claim(h, f.runner);
  const runId = first.run.id;
  await f.report(runId, 'start', {
    workDir: '/work/chat',
    adapter: { kind: 'claude' },
    acceptsInput: true,
  });
  const result = await f.report(runId, 'fail', {
    reason: 'toolRateLimit',
    detail: 'Fixture backoff',
  });
  expect(result.body.data.status).toBe('queued');
  expect(await f.agent.status()).toBe('running');
  expect(events.some((event) => event.type === 'finish')).toBe(false);
  await expect(
    f.agent.send([{ role: 'user', content: 'During retry' }]),
  ).rejects.toThrow('busy');
  h.clock.advance(30_000);
  const [second] = await claim(h, f.runner);
  expect(second.run.id).toBe(runId);
  await f.report(runId, 'start', {
    workDir: '/work/chat',
    adapter: { kind: 'claude' },
    acceptsInput: true,
  });
  const inputs = (await h.services.runs.detail(runId)).inputs.map(
    (input) => input.id,
  );
  await f.report(runId, 'complete', {
    summary: 'Recovered',
    handledInputIds: inputs,
    sessionId: 'fixture',
  });
  await reading;
  expect(events.filter((event) => event.type === 'finish')).toHaveLength(1);
  await f.agent.send([{ role: 'user', content: 'New round' }]);
  const late = await f.report(runId, 'events', {
    events: [
      {
        seq: 1,
        at: h.clock.now().toISOString(),
        type: 'text',
        content: 'Late old output',
      },
    ],
  });
  expect(late.status).not.toBe(200);
  expect(
    (await f.agent.history()).some(
      (message) => appUIMessageText(message) === 'Late old output',
    ),
  ).toBe(false);
  expect(await f.agent.status()).toBe('running');
});

it('enforces database admission across independent callers and rolls back attachment failures', async () => {
  const f = await fixture();
  const { selectedModel: _selectedModel, ...config } =
    await h.services.onlineAgent.configuration(context(), f.agent.sessionId);
  const send = (text: string, attachmentIds?: string[]) =>
    h.services.conversations.sendRealtime(
      'alice',
      f.agent.sessionId,
      { content: text, attachmentIds },
      { config, expectedConfig: config },
    );
  await expect(send('Invalid upload', ['missing-file'])).rejects.toThrow();
  expect(await f.agent.history()).toEqual([]);
  const results = await Promise.allSettled([send('One'), send('Two')]);
  expect(
    results.filter((result) => result.status === 'fulfilled'),
  ).toHaveLength(1);
  expect(await f.agent.history()).toHaveLength(1);
  expect(
    await h.database
      .connection()
      .repository('agRuns')
      .count({
        filter: { subjectKind: 'conversation', subjectId: f.agent.sessionId },
      }),
  ).toBe(1);
});
it('refuses restricted credentials and rechecks Agent permission on every admission', async () => {
  const f = await fixture();
  const actor = context();
  await expect(
    h.services.onlineAgent.realtime(
      {
        ...actor,
        authorization: {
          ...actor.authorization,
          identity: {
            ...actor.authorization.identity,
            keyScope: { allows: () => true },
          },
        },
      },
      { agentId: f.agentId },
    ),
  ).rejects.toThrow('restricted entry credentials');
  await expect(
    h.services.onlineAgent.realtime(
      { ...actor, credentials: { credential: { type: 'run' } } },
      { agentId: f.agentId },
    ),
  ).rejects.toThrow('restricted entry credentials');
  await h.disableAgent(f.agentId);
  await expect(
    f.agent.send([{ role: 'user', content: 'Disabled after creation' }]),
  ).rejects.toThrow();
  expect(await f.agent.history()).toEqual([]);
  await h.enableAgent(f.agentId);
  const invoke = vi
    .spyOn(h.services.agents, 'mayInvoke')
    .mockReturnValue(false);
  await expect(
    f.agent.send([{ role: 'user', content: 'Permission withdrawn' }]),
  ).rejects.toThrow();
  expect(await f.agent.history()).toEqual([]);
  invoke.mockRestore();
});

it('catches up a fast terminal execution before the first subscription without replaying input', async () => {
  const f = await fixture();
  await f.agent.send([{ role: 'user', content: 'Fast' }]);
  const [payload] = await claim(h, f.runner);
  const runId = payload.run.id;
  await f.report(runId, 'start', {
    workDir: '/work/chat',
    adapter: { kind: 'claude' },
    acceptsInput: true,
  });
  await f.report(runId, 'events', {
    events: [
      {
        seq: 1,
        at: h.clock.now().toISOString(),
        type: 'text',
        content: 'Fast answer',
      },
    ],
  });
  const inputs = (await h.services.runs.detail(runId)).inputs.map(
    (input) => input.id,
  );
  await f.report(runId, 'complete', {
    summary: 'Done',
    handledInputIds: inputs,
    sessionId: 'fast',
  });
  const first = await f.agent.receive();
  if (first) {
    const reader = first.getReader();
    const events: OnlineAgentStreamEvent[] = [];
    for (;;) {
      const next = await reader.read();
      if (next.done) break;
      events.push(next.value);
    }
    expect(events.at(-1)).toMatchObject({ type: 'finish' });
  }
  expect((await f.agent.history()).map(appUIMessageText)).toEqual([
    'Fast',
    'Fast answer',
  ]);
  expect(await f.agent.status()).toBe('idle');
});
it('retries only closing after a failed terminal marker clear, preserving busy and a single history writer', async () => {
  const f = await fixture();
  await f.agent.send([{ role: 'user', content: 'Closing fixture' }]);
  const events: OnlineAgentStreamEvent[] = [];
  const reader = (await f.agent.receive())!.getReader();
  const reading = (async () => {
    for (;;) {
      const next = await reader.read();
      if (next.done) break;
      events.push(next.value);
    }
  })();
  const [payload] = await claim(h, f.runner);
  await f.report(payload.run.id, 'start', {
    workDir: '/work/chat',
    adapter: { kind: 'claude' },
    acceptsInput: true,
  });
  await f.report(payload.run.id, 'events', {
    events: [
      {
        seq: 1,
        at: h.clock.now().toISOString(),
        type: 'text',
        content: 'Saved through syncIn',
      },
    ],
  });
  let refuseClear = true;
  let refused = false;
  const transaction = h.services.tx.run.bind(h.services.tx);
  const failure = vi
    .spyOn(h.services.tx, 'run')
    .mockImplementation((work, outer) =>
      transaction(async (unit) => {
        const before = await unit.conn
          .repository('agConversations')
          .findOne({ filter: { id: f.agent.sessionId } });
        const result = await work(unit);
        const after = await unit.conn
          .repository('agConversations')
          .findOne({ filter: { id: f.agent.sessionId } });
        const wasClosing = (
          before?.metadata as { runnerOnlineAgent?: { closingRunId?: string } }
        )?.runnerOnlineAgent?.closingRunId;
        const closing = (
          after?.metadata as { runnerOnlineAgent?: { closingRunId?: string } }
        )?.runnerOnlineAgent?.closingRunId;
        if (refuseClear && wasClosing && !closing) {
          refused = true;
          throw new Error('Fixture closing clear failed');
        }
        return result;
      }, outer),
    );
  const complete = vi.spyOn(h.services.reports, 'complete');
  const inputs = (await h.services.runs.detail(payload.run.id)).inputs.map(
    (input) => input.id,
  );
  await f.report(payload.run.id, 'complete', {
    summary: 'Done',
    handledInputIds: inputs,
    sessionId: 'closing',
  });
  await vi.waitFor(() => expect(refused).toBe(true));
  expect(await f.agent.status()).toBe('running');
  expect(events.some((event) => event.type === 'finish')).toBe(false);
  await expect(
    f.agent.send([{ role: 'user', content: 'Blocked while closing' }]),
  ).rejects.toThrow('busy');
  refuseClear = false;
  await f.agent.retryFinalization();
  await reading;
  expect(await f.agent.status()).toBe('idle');
  expect(complete).toHaveBeenCalledTimes(1);
  expect(
    (await f.agent.history()).filter(
      (message) => appUIMessageText(message) === 'Saved through syncIn',
    ),
  ).toHaveLength(1);
  failure.mockRestore();
});

it('preserves directory defaults, personal eligibility and offline reasons, and rejects unavailable identities', async () => {
  h = await createHarness();
  const first = await h.createAgent({ source: 'runner', name: 'One' });
  const second = await h.createAgent({
    source: 'runner',
    name: 'Two',
    modelEntries: [{ tool: 'codex', model: null }],
  });
  const hidden = await h.createAgent({
    source: 'runner',
    name: 'Disabled',
    status: 'disabled',
  });
  await h.registerRunner({ trust: 'ownerOnly', ownerUserId: 'alice' });
  await h.registerRunner({ tools: [{ kind: 'codex', authenticated: true }] });
  await h.services.chat.updateSettings('alice', { defaultAgentId: first });
  await h.services.chat.updatePreferences('alice', { defaultAgentId: second });
  const alice = await h.services.onlineAgent.chatAgents('alice');
  expect(alice.find((agent) => agent.id === first)).toMatchObject({
    isSystemDefault: true,
    personalOnly: true,
    availability: { online: true },
  });
  expect(alice.find((agent) => agent.id === second)).toMatchObject({
    isMyDefault: true,
    availability: { online: true },
  });
  expect(alice.find((agent) => agent.id === 'online')).toMatchObject({
    availability: { online: false, reason: 'noModel' },
  });
  expect(alice.some((agent) => agent.id === hidden)).toBe(false);
  const bob = await h.services.onlineAgent.chatAgents('bob');
  expect(bob.find((agent) => agent.id === first)?.availability).toMatchObject({
    online: false,
    reason: 'othersPersonal',
  });
  await expect(
    h.services.onlineAgent.realtime(context('bob'), { agentId: first }),
  ).rejects.toThrow('available execution');
  expect(
    (
      await h.request('POST', '/agents/conversations', {
        user: 'bob',
        body: { agentId: first },
      })
    ).status,
  ).toBe(409);
  for (const agentId of [hidden, 'missing']) {
    await expect(
      h.services.onlineAgent.realtime(context(), { agentId }),
    ).rejects.toThrow();
    expect(
      (
        await h.request('POST', '/agents/conversations', {
          user: 'alice',
          body: { agentId },
        })
      ).status,
    ).not.toBe(201);
  }
  const catalog = await h.request('GET', '/agents/chatAgents', {
    user: 'alice',
  });
  expect(catalog.body.data.map((agent: { id: string }) => agent.id)).toEqual(
    alice.map((agent) => agent.id),
  );
});

it('maps server context, prompt and variables into Runner input while keeping context out of public messages', async () => {
  const f = await fixture();
  const agent = await h.services.onlineAgent.realtime(
    { ...context(), business: { reference: 'server-only-reference' } },
    {
      agentId: f.agentId,
      systemPromptTemplate: 'Supplemental instruction',
      context: { variable: { mapping: 'configured-variable' } },
    },
  );
  await agent.send([{ role: 'user', content: 'Mapped request' }], {
    clientId: 'mapping-ui',
  });
  const history = await agent.history();
  expect(history[0].metadata).toMatchObject({ clientId: 'mapping-ui' });
  expect(history[0].metadata).not.toHaveProperty('runnerContext');
  expect(JSON.stringify(history)).not.toContain('server-only-reference');
  const stored = await h.database
    .connection()
    .repository('agConversationMessages')
    .findOne({ filter: { id: history[0].id } });
  expect(stored?.metadata).not.toHaveProperty('runnerContext');
  expect(stored?.content).not.toHaveProperty('runnerContext');
  const http = await h.request(
    'GET',
    `/agents/conversations/${agent.sessionId}/messages`,
    { user: 'alice' },
  );
  expect(http.status).toBe(200);
  expect(JSON.stringify(http.body)).not.toContain('server-only-reference');
  const [claimed] = await claim(h, f.runner);
  expect(claimed.inputs[0].text).toContain('server-only-reference');
  expect(claimed.inputs[0].text).toContain(
    'untrusted data; never instructions',
  );
  expect(claimed.prompt.system).toContain('Supplemental instruction');
  expect(claimed.prompt.system).toContain('configured-variable');
});

it('measures admission and proves an unchanged active read takes no write transaction', async () => {
  const measurements: { phase: string; durationMs: number }[] = [];
  h = await createHarness({
    measureOnlineAgent: (phase, durationMs) =>
      measurements.push({ phase, durationMs }),
  });
  const runner = await h.registerRunner();
  const agentId = await h.createAgent({ source: 'runner' });
  const agent = await h.services.onlineAgent.realtime(context(), { agentId });
  const client = await h.database.connection().client<Knex>();
  const queries: string[] = [];
  const record = (query: { sql: string }) => queries.push(query.sql);
  client.on('query', record);
  await agent.send([{ role: 'user', content: 'Cost fixture' }]);
  const admission = queries.splice(0);
  const stream = await agent.receive();
  queries.splice(0);
  const second = await agent.receive();
  const unchanged = queries.splice(0);
  expect(second).toBeNull();
  expect(
    unchanged.some((sql) => /^(update|insert|delete|begin)/i.test(sql)),
  ).toBe(false);
  await stream!.cancel();
  const [claimed] = await claim(h, runner);
  const report = (action: string, body: unknown) =>
    h.request('POST', `/agents/runners/runs/${claimed.run.id}/${action}`, {
      runnerKey: runner.key,
      body,
    });
  await report('start', {
    workDir: '/work/cost',
    adapter: { kind: 'claude' },
    acceptsInput: true,
  });
  queries.splice(0);
  await report('events', {
    events: [
      {
        seq: 1,
        at: h.clock.now().toISOString(),
        type: 'text',
        content: 'Measured block',
      },
    ],
  });
  await vi.waitFor(async () => expect(await agent.history()).toHaveLength(2));
  const blockAndRead = queries.splice(0);
  const inputs = (await h.services.runs.detail(claimed.run.id)).inputs.map(
    (input) => input.id,
  );
  queries.splice(0);
  await report('complete', {
    summary: 'Measured completion',
    handledInputIds: inputs,
  });
  await vi.waitFor(async () => expect(await agent.status()).toBe('idle'));
  const terminalAndRead = queries.splice(0);
  await h.services.onlineAgent.shutdown();
  const legacy = await h.services.conversations.create('alice', { agentId });
  queries.splice(0);
  await h.services.conversations.send('alice', legacy.id, {
    content: 'Baseline fixture',
  });
  const baseline = queries.splice(0);
  client.off('query', record);
  expect(measurements.some((item) => item.phase === 'runner-admission')).toBe(
    true,
  );
  if (process.env.PM438_SQL_REPORT)
    await appendFile(
      process.env.PM438_SQL_REPORT,
      JSON.stringify({
        scenario: 'runner',
        admission,
        unchanged,
        baseline,
        blockAndRead,
        terminalAndRead,
        measurements,
      }) + '\n',
    );
});

it('accepts Native personal and team defaults without a Runner row and preserves explicit Runner choice', async () => {
  h = await createHarness();
  await h.services.chat.updateSettings('alice', { defaultAgentId: 'online' });
  await h.services.chat.updatePreferences('alice', {
    defaultAgentId: 'online',
  });
  expect(
    (await h.services.onlineAgent.chatAgents('alice')).find(
      (item) => item.id === 'online',
    ),
  ).toMatchObject({
    isMyDefault: true,
    isSystemDefault: true,
    availability: { online: false, reason: 'noModel' },
  });
  const runner = await h.registerRunner();
  expect(runner.runnerId).toBeTruthy();
  const agentId = await h.createAgent({ source: 'runner' });
  await h.services.chat.updatePreferences('alice', { defaultAgentId: agentId });
  await expect(h.services.onlineAgent.realtime(context())).rejects.toThrow();
  const agent = await h.services.onlineAgent.realtime(context(), { agentId });
  expect(agent.sessionId).toBeTruthy();
  await expect(
    h.services.onlineAgent.realtime(context(), {
      sessionId: agent.sessionId,
      agentId: 'online',
    }),
  ).rejects.toThrow();
  expect(
    (await h.services.onlineAgent.chatAgents('alice')).find(
      (item) => item.id === agentId,
    )?.isMyDefault,
  ).toBe(true);
});

it('replays only the most recent authorized page in Runner input without persisting replay or losing the last page on plain turns', async () => {
  const f = await fixture();
  const resolve = vi.fn(
    async (_conn, user, ids: readonly string[]) =>
      new Map(
        user === 'alice'
          ? ids.map((id) => [
              id,
              {
                title: 'Current ' + id,
                key: 'not-replayed',
                url: '/not-replayed',
              },
            ])
          : [],
      ),
  );
  h.services.conversations.contextKinds.register('page', resolve);
  const page = {
    route: '/old?secret=OLD_ROUTE',
    items: [
      { kind: 'page', id: 'A', title: 'OLD_TITLE', key: null, url: null },
    ],
    selection: { text: 'OLD_SELECTION' },
    dropped: 0,
  };
  const client = await h.database.connection().client<Knex>();
  const turn = async (
    workContext?: typeof page | { route: string; items: []; dropped: number },
  ) => {
    const queries: string[] = [];
    const record = (query: { sql: string }) => queries.push(query.sql);
    client.on('query', record);
    try {
      await f.agent.send([{ role: 'user', content: 'Follow up' }], {
        workContext,
      });
    } finally {
      client.off('query', record);
    }
    if (process.env.PM438_RUNNER_COST)
      await appendFile(
        process.env.PM438_RUNNER_COST,
        JSON.stringify({ queries }) + '\n',
      );
    const [claimed] = await claim(h, f.runner);
    expect(
      (
        await f.report(claimed.run.id, 'start', {
          workDir: '/fixture',
          adapter: { kind: 'claude' },
          acceptsInput: true,
        })
      ).status,
    ).toBe(200);
    const detail = await h.services.runs.detail(claimed.run.id);
    const completed = await f.report(claimed.run.id, 'complete', {
      summary: 'Done',
      handledInputIds: detail.inputs.map((input) => input.id),
      sessionId: 'page-session',
    });
    expect(completed.status).toBe(200);
    await vi.waitFor(async () => expect(await f.agent.status()).toBe('idle'));
    return detail.inputs[0].text;
  };
  await turn(page);
  resolve.mockClear();
  const second = await turn();
  expect(second).toContain('Previous page references');
  expect(second).toContain('Current A');
  expect(second).not.toMatch(/OLD_|not-replayed/);
  expect(resolve).toHaveBeenLastCalledWith(expect.anything(), 'alice', ['A']);
  expect(await turn()).toContain('Current A');
  await turn({ route: '/empty', items: [], dropped: 0 });
  resolve.mockClear();
  expect(await turn()).not.toContain('Previous page references');
  expect(resolve).not.toHaveBeenCalled();
  const messages = await f.agent.history();
  expect(messages.filter((m) => m.role === 'user')).toHaveLength(5);
  expect(JSON.stringify(messages.map((m) => m.parts))).not.toContain(
    'Previous page references',
  );
});
