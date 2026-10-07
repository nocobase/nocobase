/**
 * Online agents consulting each other (`ask_agent`): the agent asked answers in a run of its own, a child of the run
 * that asked, taken at once by the same instance; the asking model reads only its answer; the conversation shows a card
 * of it; its usage is its own. A consultation only reads, goes two deep at most, never back to an agent already asked,
 * only to online agents the person may use, and within its time and token budget.
 */
import {
  apiValidator,
  cliRoute,
  describeRoute,
} from '@nocobase/app-server/router';
import { Hono } from 'hono';
import { afterEach, describe, expect, it } from 'vitest';
import { z } from 'zod';

import type {
  ConsultationNotice,
  ConversationMessage,
} from '../shared/conversations.js';
import {
  createServerExecutor,
  type ModelEvent,
  type ModelRequest,
  type ServerExecutor,
  type ServerExecutorOptions,
} from '../server/online/index.js';
import { scriptedModels, type Step } from '../server/online/scripted.js';
import { createCliApp, personOrRun, runGuard } from './cli-app.js';
import { createHarness, type Harness } from './harness.js';

const ALICE = 'alice';

const MOCK_SERVICE = {
  title: 'Mock',
  provider: 'openai-compatible',
  baseUrl: 'http://127.0.0.1:9/v1',
  models: [{ value: 'm1', label: 'Model one' }],
} as const;

const finish = (
  reason: 'stop' | 'toolCalls' = 'stop',
  usage = { inputTokens: 100, outputTokens: 20 },
): ModelEvent => ({ type: 'finish', reason, model: 'm1', usage });

const say = (
  text: string,
  usage?: { inputTokens: number; outputTokens: number },
): Step =>
  async function* () {
    yield { type: 'text', delta: text };
    yield finish('stop', usage);
  };

const call = (
  name: string,
  args: unknown,
  id = `${name}-${JSON.stringify(args)}`,
): Step =>
  async function* () {
    yield { type: 'toolCall', call: { id, name, args } };
    yield finish('toolCalls');
  };

const ask = (agent: string, question: string, id = `ask-${agent}`) =>
  call('ask_agent', { agent, question, context: 'Alice is asking.' }, id);

/** The agent a request is for, from its system prompt's first line. */
const agentOf = (request: ModelRequest): string =>
  /^You are ([^,]+),/u.exec(String(request.messages[0]?.content))?.[1] ?? '';

describe('consultations', () => {
  let h: Harness;
  let executor: ServerExecutor;
  let api: Hono | undefined;
  const requests: ModelRequest[] = [];
  afterEach(async () => {
    await h?.close();
    api = undefined;
    requests.length = 0;
  });

  /** An executor whose model answers each agent from its own script, one step per call. */
  async function answerWith(
    scripts: Record<string, Step[]>,
    options: ServerExecutorOptions = {},
  ): Promise<void> {
    if ((await h.services.online.services.list()).length === 0)
      await h.services.online.services.create(MOCK_SERVICE);
    const at = new Map<string, number>();
    executor = createServerExecutor(
      {
        clock: h.services.clock,
        claims: h.services.claims,
        reports: h.services.reports,
        runs: h.services.runs,
        conversations: h.services.conversations,
        consultations: h.services.consultations,
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
        gateway: scriptedModels((request) => {
          requests.push(request);
          const name = agentOf(request);
          const steps = scripts[name] ?? [say('?')];
          const index = at.get(name) ?? 0;
          at.set(name, index + 1);
          return steps[Math.min(index, steps.length - 1)]!(request);
        }),
        signal: h.services.runners.signal,
      },
      { holderId: 'server:test', ...options },
    );
  }

  const online = (name: string, extra: Record<string, unknown> = {}) =>
    h.createAgent({
      name,
      type: 'online',
      description: `${name} knows things.\nA second line.`,
      modelEntries: [{ modelService: 'mock', model: 'm1' }],
      ...extra,
    });

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

  const cards = async (id: string): Promise<ConsultationNotice[]> =>
    (await messages(id)).flatMap((message) =>
      message.metadata.notice?.code === 'consultation'
        ? [message.metadata.notice]
        : [],
    );

  const results = async (runId: string) =>
    (await h.services.runs.events(runId, 0, 100)).events.filter(
      (event) => event.type === 'toolResult',
    );

  it('asks another agent, waits for its answer and reads only that, in a child run of its own', async () => {
    h = await createHarness();
    await answerWith({
      PM: [ask('Analyst', 'How many open issues?'), say('Analyst says 42.')],
      Analyst: [
        async function* () {
          yield { type: 'text', delta: 'There are ' };
          await new Promise((resolve) => setTimeout(resolve, 50));
          yield { type: 'text', delta: '42 open issues.' };
          yield finish('stop', { inputTokens: 30, outputTokens: 7 });
        },
      ],
    });
    const pm = await online('PM');
    const analyst = await online('Analyst');
    const { id, runId } = await converse(pm, 'How busy are we?');

    expect(await executor.drain()).toBe(1);

    const parent = await h.services.runs.detail(runId);
    expect(parent).toMatchObject({
      status: 'completed',
      summary: 'Analyst says 42.',
      parentRunId: null,
    });
    // The child: its own run, on the consultation, recorded under the parent, with its own usage.
    expect(parent.children).toEqual([
      expect.objectContaining({
        agentId: analyst,
        agentName: 'Analyst',
        status: 'completed',
        summary: 'There are 42 open issues.',
      }),
    ]);
    const child = await h.services.runs.detail(parent.children[0]!.id);
    expect(child).toMatchObject({
      parentRunId: runId,
      subject: { kind: 'consultation', id: runId },
      maxAttempts: 1,
      actorUserId: ALICE,
      agentType: 'online',
    });
    expect(child.inputs[0]).toMatchObject({
      type: 'custom',
      actor: { kind: 'agent', id: pm, name: 'PM' },
      payload: { trigger: 'consultation', question: 'How many open issues?' },
    });
    expect(child.usage).toEqual([
      expect.objectContaining({ inputTokens: 30, outputTokens: 7 }),
    ]);
    expect(parent.usage).toEqual([
      expect.objectContaining({ inputTokens: 200, outputTokens: 40 }),
    ]);

    // The asking model got the answer only.
    const [result] = await results(runId);
    expect(result).toMatchObject({
      tool: 'ask_agent',
      output: 'There are 42 open issues.',
      meta: { ok: true, runId: child.id },
    });
    const second = requests.filter((request) => agentOf(request) === 'PM')[1]!;
    expect(second.messages.at(-1)).toMatchObject({
      role: 'tool',
      content: 'There are 42 open issues.',
    });
    // The asking prompt lists who it may consult, and the tool; the consulted one may consult nobody else here.
    const first = requests.find((request) => agentOf(request) === 'PM')!;
    expect(String(first.messages[0]!.content)).toContain(
      'Agents you may consult:',
    );
    expect(String(first.messages[0]!.content)).toContain(
      '- Analyst: Analyst knows things.',
    );
    expect(first.tools?.map((tool) => tool.name)).toContain('ask_agent');
    const consulted = requests.find(
      (request) => agentOf(request) === 'Analyst',
    )!;
    expect(String(consulted.messages[0]!.content)).toContain(
      'PM, another agent, is consulting you',
    );
    expect(String(consulted.messages[0]!.content)).not.toContain(
      'Agents you may consult',
    );
    expect(consulted.tools?.map((tool) => tool.name)).not.toContain(
      'ask_agent',
    );
    expect(String(consulted.messages[1]!.content)).toContain(
      'How many open issues?',
    );

    // The conversation shows one card, before the reply, now final.
    const all = await messages(id);
    const card = all.findIndex(
      (message) => message.metadata.notice?.code === 'consultation',
    );
    expect(all[card + 1]).toMatchObject({
      role: 'assistant',
      content: { content: 'Analyst says 42.' },
    });
    expect(all[card]!.metadata.streaming).toBeUndefined();
    expect(await cards(id)).toEqual([
      expect.objectContaining({
        agentId: analyst,
        agentName: 'Analyst',
        runId: child.id,
        question: 'How many open issues?',
        state: 'completed',
        answer: 'There are 42 open issues.',
        usage: { inputTokens: 30, outputTokens: 7 },
        plans: 0,
      }),
    ]);
  });

  it('keeps a consulted agent to reading, but lets it propose what the gate allows it', async () => {
    h = await createHarness();
    h.services.gate.set({
      allowed: (identity) =>
        Promise.resolve(
          new Set(
            identity.kind === 'run'
              ? (identity.agent?.actions ?? [])
              : ['test.notes/read', 'test.notes/write', 'test.notes/propose'],
          ),
        ),
      consultable: (action) => action === 'test.notes/propose',
    });
    const ran: string[] = [];
    api = new Hono();
    for (const [name, action] of [
      ['read', 'test.notes/read'],
      ['write', 'test.notes/write'],
      ['propose', 'test.notes/propose'],
    ] as const)
      api.post(
        `/notes/${name}`,
        runGuard(h.services, action),
        describeRoute({
          tags: ['Notes'],
          summary: `note ${name}`,
          security: personOrRun,
          responses: { 200: { description: 'OK' } },
          ...cliRoute({ command: `note ${name}`, action }),
        }),
        apiValidator('json', z.strictObject({})),
        (context) => {
          ran.push(name);
          return context.json({ data: { id: name } });
        },
      );
    await answerWith({
      PM: [ask('Analyst', 'Tidy the notes?'), say('Done asking.')],
      Analyst: [
        call('bash', { command: 'acme note read --json' }, 'r'),
        call('bash', { command: 'acme note write --json' }, 'w'),
        call('bash', { command: 'acme note propose --json' }, 'p'),
        say('I read them and proposed a change.'),
      ],
    });
    const actions = [
      'test.notes/read',
      'test.notes/write',
      'test.notes/propose',
    ];
    const pm = await online('PM', { actions });
    await online('Analyst', { actions });
    const { runId } = await converse(pm, 'Tidy up.');
    await executor.drain();

    // The asking run may write; the consulted one may not.
    expect(ran).toEqual(['read', 'propose']);
    const child = (await h.services.runs.detail(runId)).children[0]!;
    const outputs = (await results(child.id)).map((event) => event.meta?.ok);
    expect(outputs).toEqual([true, false, true]);
    const write = (await results(child.id))[1]!.output ?? '';
    expect(write).toMatch(/^exit code 4\n/u);
    expect(write).toContain('COMMAND_UNKNOWN');
  });

  it('goes two deep at most and never back to an agent already asked', async () => {
    h = await createHarness();
    await answerWith({
      A: [ask('B', 'Question one?'), say('A is done.')],
      B: [
        ask('A', 'Back to you?', 'b-a'),
        ask('C', 'Deeper?', 'b-c'),
        say('B answers.'),
      ],
      C: [say('C answers.')],
    });
    const a = await online('A');
    await online('B');
    await online('C');
    const { runId } = await converse(a, 'Go.');
    await executor.drain();

    const b = (await h.services.runs.detail(runId)).children[0]!;
    expect(b).toMatchObject({ status: 'completed', summary: 'B answers.' });
    const [cycle, deeper] = await results(b.id);
    expect(cycle!.meta).toMatchObject({ ok: false });
    expect(JSON.parse(cycle!.output!).error).toMatchObject({
      code: 'CONFLICT',
      details: { reason: 'CYCLE' },
    });
    expect(deeper!.output).toBe('C answers.');
    const c = (await h.services.runs.detail(b.id)).children[0]!;
    expect(c).toMatchObject({ agentName: 'C', status: 'completed' });

    // C is two deep: it is told of nobody to consult, and has no tool for it.
    const cRequest = requests.find((request) => agentOf(request) === 'C')!;
    expect(cRequest.tools?.map((tool) => tool.name)).not.toContain('ask_agent');
    // Asked anyway, the domain refuses.
    await expect(
      h.services.consultations.start(c.id, 'x', {
        agent: 'D',
        question: 'Deeper still?',
      }),
    ).rejects.toMatchObject({ code: 'AGENT_NOT_FOUND' });
    await online('D');
    await expect(
      h.services.consultations.start(c.id, 'x', {
        agent: 'D',
        question: 'Deeper still?',
      }),
    ).rejects.toMatchObject({ details: { reason: 'DEPTH' } });
  });

  it('refuses agents the person may not use and runner agents, and lists neither', async () => {
    h = await createHarness();
    await answerWith({
      PM: [
        ask('Secret', 'Anything?', 's'),
        ask('Coder', 'Build it?', 'c'),
        say('Nobody else to ask.'),
      ],
    });
    const pm = await online('PM');
    await online('Secret', { access: 'ownerOnly' });
    await h.createAgent({ name: 'Coder' });
    await online('Helper');
    const { id, runId } = await converse(pm, 'Ask around.');
    await executor.drain();

    const system = String(requests[0]!.messages[0]!.content);
    expect(system).toContain('- Helper:');
    expect(system).not.toContain('- Secret');
    expect(system).not.toContain('- Coder');
    const [secret, coder] = await results(runId);
    expect(JSON.parse(secret!.output!).error).toMatchObject({
      code: 'FORBIDDEN',
      details: { reason: 'FORBIDDEN' },
    });
    expect(JSON.parse(coder!.output!).error).toMatchObject({
      details: { reason: 'RUNNER_AGENT' },
    });
    expect(JSON.parse(coder!.output!).error.message).toContain(
      'Use a task to delegate to a runner agent.',
    );
    expect((await h.services.runs.detail(runId)).children).toEqual([]);
    expect(
      (await cards(id)).map((card) => [card.agentName, card.state]),
    ).toEqual([
      ['Secret', 'refused'],
      ['Coder', 'refused'],
    ]);
  });

  it('ends a consultation over its token budget or its time, and the asking agent hears it failed', async () => {
    h = await createHarness();
    await answerWith(
      {
        PM: [
          ask('Spender', 'Think hard?', 'spend'),
          ask('Sleeper', 'Take your time?', 'sleep'),
          say('Neither answered.'),
        ],
        Spender: [
          call('bash', { command: 'echo thinking' }, 'e'),
          say('Never reached.'),
        ],
        Sleeper: [
          async function* (request) {
            await new Promise<void>((_resolve, reject) =>
              request.signal?.addEventListener('abort', () =>
                reject(new Error('Aborted')),
              ),
            );
            yield finish();
          },
        ],
      },
      { consult: { tokenBudget: 100, timeoutMs: 300 } },
    );
    const pm = await online('PM');
    await online('Spender');
    await online('Sleeper');
    const { id, runId } = await converse(pm, 'Ask both.');
    await executor.drain();

    const parent = await h.services.runs.detail(runId);
    expect(parent.status).toBe('completed');
    const [spender, sleeper] = parent.children;
    expect(await h.services.runs.get(spender!.id)).toMatchObject({
      status: 'failed',
      failureDetail: 'The consultation used more than 100 tokens.',
    });
    expect(await h.services.runs.get(sleeper!.id)).toMatchObject({
      status: 'failed',
      failureDetail: 'The consultation took longer than 1 second.',
    });
    const [first, second] = await results(runId);
    expect(JSON.parse(first!.output!).error.code).toBe('CONSULTATION_FAILED');
    expect(JSON.parse(second!.output!).error.code).toBe('CONSULTATION_FAILED');
    expect((await cards(id)).map((card) => card.state)).toEqual([
      'failed',
      'failed',
    ]);
  });
});
