/**
 * Online agents' runs on the server: the executor drives a conversation through the run lifecycle with a fake model
 * gateway (scripted model calls); the run reaches the application's commands through the CLI in its shell. The agents' model service is a real
 * one (`mock`), so the catalog offers their model.
 */
import {
  apiValidator,
  cliRoute,
  describeRoute,
} from '@nocobase/app-server/router';
import { Hono } from 'hono';
import { afterEach, describe, expect, it } from 'vitest';
import { z } from 'zod';

import type { ConversationMessage } from '../shared/conversations.js';
import type {
  ModelEvent,
  ServerExecutor,
  ServerExecutorOptions,
} from '../server/online/index.js';
import { createServerExecutor, ModelError } from '../server/online/index.js';
import { createRosterRoutes } from '../server/routes/roster.js';
import { createRunRoutes } from '../server/routes/run.js';
import { createCliApp, personOrRun, runGuard } from './cli-app.js';
import { claim, createHarness, type Harness } from './harness.js';
import {
  scriptedSteps,
  type ScriptedModels,
  type Step,
} from '../server/online/scripted.js';

const ALICE = 'alice';

type FakePort = ScriptedModels;

/** The agents' model service: nothing listens at its address, the fake gateway answers instead. */
const MOCK_SERVICE = {
  title: 'Mock',
  provider: 'openai-compatible',
  baseUrl: 'http://127.0.0.1:9/v1',
  models: [
    { value: 'm1', label: 'Model one' },
    { value: 'm2', label: 'Model two' },
  ],
} as const;

function finish(
  reason: 'stop' | 'toolCalls' = 'stop',
  usage = { inputTokens: 100, outputTokens: 20 },
): ModelEvent {
  return { type: 'finish', reason, model: 'm1', usage };
}

/** A gateway answering `steps` in order, one per model call. */
const fakePort = (steps: Step[]): FakePort => scriptedSteps(steps);

const say = (...parts: string[]): Step =>
  async function* () {
    for (const delta of parts) yield { type: 'text', delta };
    yield finish();
  };

/** A `bash` call running `command`. */
const sh = (command: string, id = `sh-${command}`): Step =>
  async function* () {
    yield { type: 'toolCall', call: { id, name: 'bash', args: { command } } };
    yield finish('toolCalls');
  };

const fail = (
  code: ModelError['code'],
  message = `The model failed (${code}).`,
): Step =>
  // eslint-disable-next-line require-yield -- it fails before streaming anything.
  async function* () {
    throw new ModelError(code, message);
  };

describe('online runs', () => {
  let h: Harness;
  let executor: ServerExecutor;
  /** The application's routes under `/api` whose commands become the run's tools; none unless a test adds them. */
  let api: Hono | undefined;
  afterEach(async () => {
    await h?.close();
    api = undefined;
  });

  /** An executor whose model calls `port` answers. */
  const executorWith = (port: FakePort, options: ServerExecutorOptions = {}) =>
    createServerExecutor(
      {
        clock: h.services.clock,
        claims: h.services.claims,
        reports: h.services.reports,
        runs: h.services.runs,
        conversations: h.services.conversations,
        commands: (identity, token) =>
          createCliApp(h.services, api ?? new Hono()).commandsOf(
            identity,
            token,
          ),
        skill: async (skill) => ({
          ...(await h.services.skills.snapshot(skill.slug, skill.hash)),
          name: skill.name,
          description: skill.description,
        }),
        gateway: port,
        signal: h.services.runners.signal,
      },
      { holderId: 'server:test', ...options },
    );

  /** Adds the `mock` service and makes `executor` answer through `port`. */
  async function answerWith(
    port: FakePort,
    options: ServerExecutorOptions = {},
  ): Promise<void> {
    if ((await h.services.online.services.list()).length === 0)
      await h.services.online.services.create(MOCK_SERVICE);
    executor = executorWith(port, options);
  }

  async function onlineAgent(extra: Record<string, unknown> = {}) {
    return h.createAgent({
      name: 'PM',
      type: 'online',
      modelEntries: [{ modelService: 'mock', model: 'm1' }],
      ...extra,
    });
  }

  async function converse(agentId: string, text: string) {
    const conversation = await h.services.conversations.create(ALICE, {
      agentId,
    });
    const sent = await h.services.conversations.send(ALICE, conversation.id, {
      content: text,
    });
    return { id: conversation.id, runId: sent.run!.id };
  }

  async function messages(id: string): Promise<ConversationMessage[]> {
    return [
      ...(await h.services.conversations.messages(ALICE, id, { limit: 50 }))
        .items,
    ];
  }

  it('answers a conversation with a tool call, streaming a draft that becomes the reply', async () => {
    h = await createHarness();
    // The plugin's own routes, which every run may call: `agent list`, and what a run does about itself.
    api = new Hono();
    api.route('/agents', createRunRoutes(h.services));
    api.route(
      '/agents',
      createRosterRoutes(h.services, runGuard(h.services) as never),
    );
    const drafts: ConversationMessage[][] = [];
    let conversationId = '';
    const port = fakePort([
      sh('acme agent list --json', 'call-agent'),
      async function* () {
        yield { type: 'text', delta: 'There is ' };
        // The draft is written while the reply streams.
        await new Promise((resolve) => setTimeout(resolve, 50));
        drafts.push(await messages(conversationId));
        yield { type: 'text', delta: 'one agent: PM.' };
        yield finish('stop', { inputTokens: 300, outputTokens: 12 });
      },
    ]);
    await answerWith(port);
    const agentId = await onlineAgent();
    const { id, runId } = await converse(agentId, 'Who can help?');
    conversationId = id;

    expect(await executor.drain()).toBe(1);

    const run = await h.services.runs.detail(runId);
    expect(run.status).toBe('completed');
    expect(run.agentType).toBe('online');
    expect(run.summary).toBe('There is one agent: PM.');
    // Usage: one row per model call, as the chat tool.
    expect(run.usage).toEqual([
      expect.objectContaining({
        tool: 'online',
        model: 'm1',
        inputTokens: 400,
        outputTokens: 32,
      }),
    ]);
    // The transcript holds the tool call and its result.
    const events = (await h.services.runs.events(runId, 0, 100)).events;
    expect(events.map((event) => event.type)).toEqual([
      'toolUse',
      'toolResult',
      'text',
    ]);
    expect(events[1]).toMatchObject({ tool: 'bash', meta: { ok: true } });
    const output = events[1].output ?? '';
    expect(output).toMatch(/^exit code 0\n/u);
    const envelope = JSON.parse(output.slice(output.indexOf('\n') + 1));
    expect(envelope).toMatchObject({ ok: true, command: 'agent list' });
    expect(envelope.result.data[0]).toMatchObject({
      name: 'PM',
      type: 'online',
    });
    // The model got its shell (no skills, so no skill tool), the system layer in the tools dialect, and the result.
    const [first, second] = port.requests;
    expect(first.tools?.map((tool) => tool.name)).toEqual(['bash']);
    expect(first.messages[0].content).toContain(
      'Reach Acme only through the `acme` command',
    );
    expect(first.messages[1].content).toContain('Who can help?');
    expect(second.messages.at(-1)).toMatchObject({
      role: 'tool',
      toolCallId: 'call-agent',
    });
    // While it streamed, the reply was a draft; now it is final, in the same place.
    const draft = drafts[0].find((message) => message.role === 'assistant');
    expect(draft).toMatchObject({
      content: { content: 'There is ' },
      metadata: { streaming: true },
    });
    const final = (await messages(id)).filter(
      (message) => message.role === 'assistant',
    );
    expect(final).toHaveLength(1);
    expect(final[0]).toMatchObject({
      id: draft!.id,
      seq: draft!.seq,
      content: { content: 'There is one agent: PM.' },
    });
    expect(final[0].metadata.streaming).toBeUndefined();
  });

  it('offers only the commands the run may run, and refuses the others', async () => {
    h = await createHarness();
    const held = new Set(['test.read', 'test.write']);
    h.services.gate.set({
      allowed: (identity) =>
        Promise.resolve(
          new Set(
            identity.kind === 'run'
              ? (identity.agent?.actions ?? []).filter((key) => held.has(key))
              : held,
          ),
        ),
    });
    const ran: string[] = [];
    api = new Hono();
    for (const [name, action] of [
      ['read', 'test.read'],
      ['write', 'test.write'],
      ['delete', 'test.delete'],
    ] as const)
      api.post(
        `/notes/${name}`,
        // The route checks the run's actions again, as the application bounds a run's requests.
        runGuard(h.services, action),
        describeRoute({
          tags: ['Notes'],
          summary: `note ${name}`,
          security: personOrRun,
          responses: { 200: { description: 'OK' } },
          ...cliRoute({ command: `note ${name}`, action }),
        }),
        apiValidator('json', z.object({ text: z.string().optional() })),
        (context) => {
          const id = `note:${name}`;
          ran.push(id);
          if (name === 'write') held.delete('test.write');
          return context.json({
            data: { id, text: context.req.valid('json').text },
          });
        },
      );
    const port = fakePort([
      sh('acme --help', 'help'),
      sh('acme note write --text one --json', 'w1'),
      // Taken away by the first write: refused when it runs again.
      sh('acme note write --text two --json', 'w2'),
      // Never offered: the person does not hold it.
      sh('acme note delete --json', 'd1'),
      say('Done.'),
    ]);
    await answerWith(port);
    // The agent is configured with delete, but the person who wakes it does not hold it.
    const agentId = await onlineAgent({
      actions: ['test.read', 'test.write', 'test.delete'],
    });
    const { runId } = await converse(agentId, 'Write twice.');
    await executor.drain();

    expect(ran).toEqual(['note:write']);
    const results = (await h.services.runs.events(runId, 0, 100)).events.filter(
      (event) => event.type === 'toolResult',
    );
    expect(results.map((event) => event.meta?.ok)).toEqual([
      true,
      true,
      false,
      false,
    ]);
    // Help lists what the run may run, offline from the manifest.
    expect(results[0].output).toContain('note read');
    expect(results[0].output).toContain('note write');
    expect(results[0].output).not.toContain('note delete');
    const envelopeOf = (output: string | undefined) =>
      JSON.parse((output ?? '').slice((output ?? '').indexOf('\n') + 1));
    expect(envelopeOf(results[1].output).result.data).toMatchObject({
      id: 'note:write',
      text: 'one',
    });
    expect(results[2].output).toMatch(/^exit code 3\n/u);
    expect(envelopeOf(results[2].output).error.code).toBe('FORBIDDEN');
    expect(results[3].output).toMatch(/^exit code 4\n/u);
    expect(envelopeOf(results[3].output).error.code).toBe('COMMAND_UNKNOWN');
    expect((await h.services.runs.get(runId)).status).toBe('completed');
  });

  it.each([
    ['config', 'modelUnavailable'],
    ['auth', 'toolAuth'],
    ['quota', 'toolQuota'],
    ['rateLimit', 'toolRateLimit'],
    ['network', 'toolNetwork'],
    ['contextOverflow', 'contextOverflow'],
    ['badResponse', 'unknown'],
  ])(
    'fails a run whose model call fails with %s as %s',
    async (code, reason) => {
      h = await createHarness();
      await answerWith(fakePort([fail(code)]));
      const agentId = await onlineAgent({ maxAttempts: 1 });
      const { id, runId } = await converse(agentId, 'Hello?');
      await executor.drain();
      const run = await h.services.runs.get(runId);
      expect(run).toMatchObject({ status: 'failed', failureReason: reason });
      expect(run.failureDetail).toContain(code);
      // The conversation says why, as for any failed run.
      expect((await messages(id)).at(-1)?.metadata.notice).toEqual({
        code: 'runFailed',
        runId,
        reason,
      });
    },
  );

  it("answers with the model the conversation's owner chose, and remembers it", async () => {
    h = await createHarness();
    const port = fakePort([say('One.'), say('Two.'), say('Three.')]);
    await answerWith(port);
    const agentId = await onlineAgent({
      modelEntries: [
        { modelService: 'mock', model: 'm1', effort: 'low' },
        { modelService: 'mock', model: 'm2' },
      ],
    });
    const first = await converse(agentId, 'Hello?');
    const opened = await h.services.conversations.get(ALICE, first.id);
    expect(opened.model).toEqual({
      modelService: 'mock',
      model: 'm1',
      effort: 'low',
    });
    // Each named as the person reads it: the service's title and the model's label.
    expect(opened.models).toEqual([
      {
        modelService: 'mock',
        model: 'm1',
        effort: 'low',
        serviceTitle: 'Mock',
        modelLabel: 'Model one',
      },
      {
        modelService: 'mock',
        model: 'm2',
        effort: null,
        serviceTitle: 'Mock',
        modelLabel: 'Model two',
      },
    ]);
    await executor.drain();
    // The entry's effort goes to the model call, and the run records it.
    expect(port.requests[0]?.model).toMatchObject({
      model: 'm1',
      reasoning: 'low',
    });
    expect(await h.services.runs.get(first.runId)).toMatchObject({
      tool: null,
      modelService: 'mock',
      model: 'm1',
      effort: 'low',
    });

    // The owner picks the second entry: the conversation keeps it, and the next run uses it.
    const chosen = await h.services.conversations.update(ALICE, first.id, {
      model: { modelService: 'mock', model: 'm2' },
    });
    expect(chosen.model).toEqual({
      modelService: 'mock',
      model: 'm2',
      effort: null,
    });
    expect(
      (await h.services.conversations.get(ALICE, first.id)).model,
    ).toMatchObject({ modelService: 'mock', model: 'm2' });
    const sent = await h.services.conversations.send(ALICE, first.id, {
      content: 'Again?',
    });
    await executor.drain();
    expect(port.requests[1]?.model).toMatchObject({
      model: 'm2',
      reasoning: null,
    });
    expect(await h.services.runs.get(sent.run!.id)).toMatchObject({
      modelService: 'mock',
      model: 'm2',
      effort: null,
    });

    // A model the agent does not list is refused; null goes back to the default.
    await expect(
      h.services.conversations.update(ALICE, first.id, {
        model: { modelService: 'mock', model: 'nope' },
      }),
    ).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
    const reset = await h.services.conversations.update(ALICE, first.id, {
      model: null,
    });
    expect(reset.model).toMatchObject({ modelService: 'mock', model: 'm1' });

    // Another conversation starts on the default.
    const other = await converse(agentId, 'New one.');
    expect(
      (await h.services.conversations.get(ALICE, other.id)).model,
    ).toMatchObject({ modelService: 'mock', model: 'm1' });
  });

  it('starts a conversation on the model chosen before its first message', async () => {
    h = await createHarness();
    const port = fakePort([say('Hi.')]);
    await answerWith(port);
    const agentId = await onlineAgent({
      modelEntries: [
        { modelService: 'mock', model: 'm1' },
        { modelService: 'mock', model: 'm2' },
      ],
    });
    // The agent offers its list to a new chat, the default first; a runner agent offers none.
    const runnerId = await h.createAgent({ name: 'Coder' });
    const listed = await h.request('GET', '/agents/chatAgents', {
      user: ALICE,
    });
    const models = (id: string) =>
      listed.body.data.find((agent: { id: string }) => agent.id === id)?.models;
    expect(models(agentId)).toEqual([
      {
        modelService: 'mock',
        model: 'm1',
        effort: null,
        serviceTitle: 'Mock',
        modelLabel: 'Model one',
      },
      {
        modelService: 'mock',
        model: 'm2',
        effort: null,
        serviceTitle: 'Mock',
        modelLabel: 'Model two',
      },
    ]);
    expect(models(runnerId)).toEqual([]);

    const created = await h.request('POST', '/agents/conversations', {
      user: ALICE,
      body: { agentId, model: { modelService: 'mock', model: 'm2' } },
    });
    expect(created.status).toBe(201);
    expect(created.body.data.model).toMatchObject({ model: 'm2' });
    await h.services.conversations.send(ALICE, created.body.data.id, {
      content: 'Hello?',
    });
    await executor.drain();
    expect(port.requests[0]?.model).toMatchObject({ model: 'm2' });

    // A model the agent does not list, or any model for a runner agent, is refused.
    for (const body of [
      { agentId, model: { modelService: 'mock', model: 'nope' } },
      { agentId: runnerId, model: { modelService: 'mock', model: 'm1' } },
    ]) {
      const refused = await h.request('POST', '/agents/conversations', {
        user: ALICE,
        body,
      });
      expect(refused.status).toBe(400);
      expect(refused.body.error.metadata).toMatchObject({
        reason: 'MODEL_NOT_LISTED',
      });
    }
  });

  it('retries a rate-limited run while attempts remain', async () => {
    h = await createHarness();
    await answerWith(fakePort([fail('rateLimit'), say('Hi.')]));
    const agentId = await onlineAgent({ maxAttempts: 2 });
    const { runId } = await converse(agentId, 'Hello?');
    await executor.drain();
    expect(await h.services.runs.get(runId)).toMatchObject({
      status: 'queued',
      attempt: 2,
      failureReason: 'toolRateLimit',
    });
  });

  it('fails a run that keeps calling tools without answering (stepLimit)', async () => {
    h = await createHarness();
    await answerWith(fakePort([sh('ls /')]), { maxSteps: 3 });
    const agentId = await onlineAgent();
    const { runId } = await converse(agentId, 'Loop.');
    await executor.drain();
    expect(await h.services.runs.get(runId)).toMatchObject({
      status: 'failed',
      failureReason: 'stepLimit',
    });
  });

  it('fails an online run when its model service is switched off', async () => {
    h = await createHarness();
    await answerWith(fakePort([say('Hi.')]));
    const agentId = await onlineAgent({ maxAttempts: 1 });
    const { runId } = await converse(agentId, 'Hello?');
    await h.services.online.services.update('mock', { enabled: false });
    // The plugin's own gateway reads the service, and finds it off.
    await h.services.online.executor.drain();
    expect(await h.services.runs.get(runId)).toMatchObject({
      status: 'failed',
      failureReason: 'modelUnavailable',
    });
  });

  it('stops a reply when the person stops the conversation, keeping what it wrote', async () => {
    h = await createHarness();
    let started!: () => void;
    const streaming = new Promise<void>((resolve) => (started = resolve));
    await answerWith(
      fakePort([
        async function* (request) {
          yield { type: 'text', delta: 'Let me think' };
          await new Promise((resolve) => setTimeout(resolve, 400));
          started();
          await new Promise<void>((_resolve, reject) =>
            request.signal?.addEventListener('abort', () =>
              reject(Object.assign(new Error('Aborted'), { code: 'aborted' })),
            ),
          );
          yield finish();
        },
      ]),
    );
    const agentId = await onlineAgent();
    const { id, runId } = await converse(agentId, 'Take your time.');
    const drained = executor.drain();
    await streaming;
    await h.services.conversations.stop(ALICE, id);
    await drained;
    const run = await h.services.runs.get(runId);
    expect(run.status).toBe('cancelled');
    const assistant = (await messages(id)).find(
      (message) => message.role === 'assistant',
    );
    expect(assistant).toMatchObject({
      content: { content: 'Let me think' },
      metadata: { interrupted: true },
    });
    expect(assistant?.metadata.streaming).toBeUndefined();
  });

  it('answers a message sent while it works in the same run', async () => {
    h = await createHarness();
    let conversationId = '';
    const port = fakePort([
      async function* () {
        await h.services.conversations.send(ALICE, conversationId, {
          content: 'And one more thing.',
        });
        yield { type: 'text', delta: 'First answer.' };
        yield finish();
      },
      say('Second answer.'),
    ]);
    await answerWith(port);
    const agentId = await onlineAgent();
    const { id, runId } = await converse(agentId, 'First question.');
    conversationId = id;
    await executor.drain();
    expect((await h.services.runs.get(runId)).status).toBe('completed');
    expect(port.requests).toHaveLength(2);
    expect(port.requests[1].messages.at(-1)?.content).toContain(
      'And one more thing.',
    );
    expect(
      (await messages(id))
        .filter((message) => message.role === 'assistant')
        .map((message) => message.content.content),
    ).toEqual(['First answer.', 'Second answer.']);
  });

  it('never lets two instances take the same run', async () => {
    h = await createHarness();
    const port = fakePort([say('Hi.')]);
    await answerWith(port);
    const agentId = await onlineAgent();
    const runIds: string[] = [];
    for (let index = 0; index < 6; index += 1)
      runIds.push((await converse(agentId, `Question ${index}`)).runId);
    const instance = (holderId: string) => executorWith(port, { holderId });
    const taken = await Promise.all([
      instance('server:a').drain(),
      instance('server:b').drain(),
      executor.drain(),
    ]);
    expect(taken.reduce((sum, count) => sum + count, 0)).toBe(6);
    expect(port.requests).toHaveLength(6);
    for (const runId of runIds)
      expect((await h.services.runs.get(runId)).status).toBe('completed');
  });

  it('prices chat usage and reports it by agent type', async () => {
    h = await createHarness();
    await answerWith(
      fakePort([
        async function* () {
          yield { type: 'text', delta: 'Hi.' };
          yield finish('stop', {
            inputTokens: 1_000_000,
            outputTokens: 500_000,
            cacheReadTokens: 200_000,
          } as never);
        },
      ]),
    );
    await h.services.prices.replace({
      subscriptions: [],
      prices: [
        // The same model through another service, or a coding tool, costs something else.
        {
          tool: 'online',
          modelService: 'other',
          model: 'm1',
          inputPerM: 9,
          outputPerM: 9,
        },
        { tool: 'claude', model: 'm1', inputPerM: 9, outputPerM: 9 },
        {
          tool: 'online',
          modelService: 'mock',
          model: 'm1',
          inputPerM: 2,
          outputPerM: 8,
          cacheReadPerM: 0.5,
        },
      ],
    });
    const agentId = await onlineAgent();
    await converse(agentId, 'Hello?');
    await executor.drain();
    const caller = { userId: ALICE, allRuns: true };
    const report = await h.services.reporting.usage(caller, {
      groupBy: 'type',
      from: '2026-09-30',
      to: '2026-10-02',
    });
    expect(report.rows).toEqual([
      expect.objectContaining({
        key: 'online',
        name: null,
        runs: 1,
        inputTokens: 1_000_000,
        outputTokens: 500_000,
        cacheReadTokens: 200_000,
        cost: { USD: 2 + 4 + 0.1 },
      }),
    ]);
    const figures = await h.services.reporting.runFigures(caller, {
      ...h.services.reporting.range({ from: '2026-09-30', to: '2026-10-02' }),
      groupId: null,
    });
    expect(figures.usageByType).toEqual([
      expect.objectContaining({ type: 'online', runs: 1, cost: { USD: 6.1 } }),
    ]);
  });

  it('keeps an agent of a type to what its type takes', async () => {
    h = await createHarness();
    await answerWith(fakePort([say('Hi.')]));
    const admin = { user: 'admin', can: ['agents.agents/manage'] };
    const create = (body: object) =>
      h.request('POST', '/agents', {
        ...admin,
        body: { name: 'PM', access: 'everyone', ...body },
      });
    // An online agent needs a model its service offers, and takes nothing a runner uses.
    expect(
      (
        await create({
          type: 'online',
          modelEntries: [{ modelService: 'mock' }],
        })
      ).status,
    ).toBe(400);
    // An effort the service does not take is refused.
    const effort = await create({
      type: 'online',
      modelEntries: [{ modelService: 'mock', model: 'm1', effort: 'max' }],
    });
    expect(effort.status).toBe(400);
    expect(effort.body.error.metadata).toMatchObject({
      reason: 'EFFORT_UNSUPPORTED',
    });
    const unknownModel = await create({
      type: 'online',
      modelEntries: [{ modelService: 'mock', model: 'nope' }],
    });
    expect(unknownModel.status).toBe(400);
    expect(unknownModel.body.error.metadata).toMatchObject({
      reason: 'MODEL_UNAVAILABLE',
    });
    expect(
      (
        await create({
          type: 'online',
          modelEntries: [{ tool: 'claude', model: null }],
        })
      ).status,
    ).toBe(400);
    expect(
      (
        await create({
          modelEntries: [{ modelService: 'mock', model: 'm1' }],
        })
      ).status,
    ).toBe(400);
    // The same entry twice is refused.
    expect(
      (
        await create({
          type: 'online',
          modelEntries: [
            { modelService: 'mock', model: 'm1' },
            { modelService: 'mock', model: 'm1' },
          ],
        })
      ).status,
    ).toBe(400);
    const created = await create({
      type: 'online',
      modelEntries: [{ modelService: 'mock', model: 'm1', effort: 'xhigh' }],
    });
    expect(created.status).toBe(201);
    expect(created.body.data).toMatchObject({
      type: 'online',
      modelEntries: [{ modelService: 'mock', model: 'm1', effort: 'xhigh' }],
    });
    // Its type never changes.
    const patched = await h.request(
      'PATCH',
      `/agents/${created.body.data.id}`,
      { ...admin, body: { type: 'runner', expectedRevision: 1 } },
    );
    expect(patched.status).toBe(400);
    expect(
      (
        await h.request('PATCH', `/agents/${created.body.data.id}`, {
          ...admin,
          body: { runnerIds: ['r1'], expectedRevision: 1 },
        })
      ).status,
    ).toBe(400);
    // Listed as online while its model is offered.
    const listed = await h.request('GET', '/agents', admin);
    expect(listed.body.data[0]).toMatchObject({
      type: 'online',
      onlineRunners: 1,
    });
    const catalog = await h.request('GET', '/agents/models', admin);
    expect(catalog.body).toEqual({
      data: [
        {
          name: 'mock',
          title: 'Mock',
          provider: 'openai-compatible',
          models: [
            { value: 'm1', label: 'Model one', kind: 'chat', dimensions: null },
            { value: 'm2', label: 'Model two', kind: 'chat', dimensions: null },
          ],
        },
      ],
      meta: { total: 1 },
    });
  });

  it('answers with the system default chat model when an online agent lists none', async () => {
    h = await createHarness();
    const admin = { user: 'admin', can: ['agents.agents/manage'] };
    const created = await h.request('POST', '/agents', {
      ...admin,
      body: {
        name: 'Assistant',
        type: 'online',
        modelEntries: [],
        access: 'everyone',
      },
    });
    expect(created.status).toBe(201);
    const agentId = created.body.data.id as string;
    expect(created.body.data).toMatchObject({
      type: 'online',
      modelEntries: [],
    });
    // No chat model anywhere: it needs one, and is offered no work.
    expect(
      (await h.request('GET', '/agents', admin)).body.data[0],
    ).toMatchObject({ onlineRunners: 0 });
    expect(
      (await h.request('GET', '/agents/available', { user: ALICE })).body.data,
    ).toEqual([]);

    // The first chat model enabled becomes the default, and the agent answers with it.
    const port = fakePort([say('Hi.')]);
    await answerWith(port);
    expect(await h.services.online.services.defaults()).toEqual({
      chat: { modelService: 'mock', model: 'm1' },
      effectiveChat: {
        modelService: 'mock',
        model: 'm1',
        serviceTitle: 'Mock',
        modelLabel: 'Model one',
      },
    });
    expect(
      (await h.request('GET', '/agents', admin)).body.data[0],
    ).toMatchObject({ onlineRunners: 1 });
    expect(
      (await h.request('GET', '/agents/available', { user: ALICE })).body.data,
    ).toEqual([expect.objectContaining({ id: agentId, online: true })]);
    const { id, runId } = await converse(agentId, 'Hello?');
    const opened = await h.services.conversations.get(ALICE, id);
    expect(opened.availability.online).toBe(true);
    expect(opened.model).toMatchObject({ modelService: 'mock', model: 'm1' });
    expect(opened.models).toEqual([
      {
        modelService: 'mock',
        model: 'm1',
        serviceTitle: 'Mock',
        modelLabel: 'Model one',
      },
    ]);
    await executor.drain();
    expect(port.requests[0]?.model).toMatchObject({ model: 'm1' });
    // The run records the model it used.
    expect(await h.services.runs.get(runId)).toMatchObject({
      status: 'completed',
      modelService: 'mock',
      model: 'm1',
    });

    // Another default is used from then on; one no service offers is refused.
    const manager = {
      user: 'admin',
      can: ['agents.services/read', 'agents.services/manage'],
    };
    const set = await h.request('PUT', '/agents/defaultModels/chat', {
      ...manager,
      body: { modelService: 'mock', model: 'm2' },
    });
    expect(set.status).toBe(200);
    expect(set.body.data.effectiveChat).toMatchObject({ model: 'm2' });
    expect(
      (await h.request('GET', '/agents/defaultModels', { user: ALICE })).body
        .data,
    ).toMatchObject({ chat: { modelService: 'mock', model: 'm2' } });
    expect(
      (
        await h.request('PUT', '/agents/defaultModels/chat', {
          ...manager,
          body: { modelService: 'mock', model: 'nope' },
        })
      ).status,
    ).toBe(400);
    expect(
      (
        await h.request('PUT', '/agents/defaultModels/chat', {
          user: ALICE,
          body: { modelService: 'mock', model: 'm1' },
        })
      ).status,
    ).toBe(403);
    expect((await h.services.conversations.get(ALICE, id)).model).toMatchObject(
      { model: 'm2' },
    );

    // With the service off there is no default either.
    await h.services.online.services.update('mock', { enabled: false });
    expect(
      (await h.services.online.services.defaults()).effectiveChat,
    ).toBeNull();
    expect(
      (await h.request('GET', '/agents', admin)).body.data[0],
    ).toMatchObject({ onlineRunners: 0 });

    // A runner agent always needs a coding tool.
    expect(
      (
        await h.request('POST', '/agents', {
          ...admin,
          body: { name: 'Coder', modelEntries: [] },
        })
      ).status,
    ).toBe(400);
  });

  it('runs an online agent only on subjects that take it, and never on a runner', async () => {
    h = await createHarness();
    await answerWith(fakePort([say('Hi.')]));
    const agentId = await onlineAgent();
    // The sample subject needs a working directory's kind of agent.
    await expect(h.enqueue(agentId)).rejects.toMatchObject({
      details: { reason: 'AGENT_TYPE_NOT_ALLOWED' },
    });
    const runner = await h.registerRunner();
    const { runId } = await converse(agentId, 'Hello?');
    expect(await claim(h, runner, 2)).toEqual([]);
    expect((await h.services.runs.get(runId)).status).toBe('queued');
    await executor.drain();
    expect((await h.services.runs.get(runId)).runnerId).toMatch(/^server:/u);
  });

  it('keeps a conversation in its mode: no fallback to an agent of the other type', async () => {
    h = await createHarness();
    await answerWith(fakePort([say('Hi.')]));
    const chatId = await onlineAgent();
    const workId = await h.createAgent({ name: 'Coder' });
    await h.services.chat.updateSettings('admin', { defaultAgentId: workId });
    const conversation = await h.services.conversations.create(ALICE, {
      agentId: chatId,
    });
    expect(conversation.mode).toBe('online');
    expect(conversation.canFallback).toBe(false);
    await expect(
      h.services.conversations.fallback(ALICE, conversation.id),
    ).rejects.toMatchObject({ details: { reason: 'noFallback' } });
    const work = await h.services.conversations.create(ALICE, {
      agentId: workId,
    });
    expect(work.mode).toBe('runner');
    const agents = await h.services.conversations.chatAgents(ALICE);
    expect(
      agents.map((agent) => [
        agent.name,
        agent.type,
        agent.availability.online,
      ]),
    ).toEqual([
      ['Coder', 'runner', false],
      ['PM', 'online', true],
    ]);
  });
});
