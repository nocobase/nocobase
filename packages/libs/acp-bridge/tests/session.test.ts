import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { ResolvedAgent } from '../src/agents.js';
import type {
  BridgeEvent,
  PromptContent,
  SessionTarget,
  SessionState,
} from '../src/protocol.js';
import { BridgeSession } from '../src/session.js';

const FAKE: ResolvedAgent = {
  spec: {
    id: 'fake',
    name: 'Fake',
    launchers: [],
    modes: ['missing', 'full'],
    signIn: 'fake login',
  },
  command: process.execPath,
  args: [path.join(import.meta.dirname, 'fixtures', 'fake-agent.mjs')],
};

let root: string;
let sessions: BridgeSession[];

beforeEach(async () => {
  root = await mkdtemp(path.join(os.tmpdir(), 'acp-bridge-'));
  sessions = [];
});

afterEach(async () => {
  await Promise.all(sessions.map((session) => session.close()));
  await rm(root, { recursive: true, force: true });
});

function start(
  target: Partial<SessionTarget> = {},
  agent: ResolvedAgent = FAKE,
  env: NodeJS.ProcessEnv = process.env,
  discoverySignal?: AbortSignal,
): {
  session: BridgeSession;
  events: BridgeEvent[];
  target: SessionTarget;
  states: (SessionState | null)[];
} {
  const events: BridgeEvent[] = [];
  const states: (SessionState | null)[] = [];
  const full: SessionTarget = {
    id: 'session-1',
    agentId: 'fake',
    cwd: root,
    acpSessionId: null,
    settings: {},
    tools: null,
    ...target,
  };
  const session = new BridgeSession(full, {
    client: { name: 'test', version: '0.0.0' },
    server: 'https://studio.example.com/app/',
    env,
    discoverySignal,
    roots: [root],
    resolve: () => Promise.resolve(agent),
    emit: (event) => events.push(event),
    stateChanged: () => states.push(session.state),
  });
  sessions.push(session);
  return { session, events, target: full, states };
}

function prompt(
  session: BridgeSession,
  target: SessionTarget,
  promptId: string,
  text: string,
): void {
  const content: PromptContent[] = [{ type: 'text', text }];
  session.handle({ type: 'prompt', session: target, promptId, content });
}

async function until(
  events: BridgeEvent[],
  test: (event: BridgeEvent) => boolean,
): Promise<BridgeEvent> {
  for (let waited = 0; waited < 10_000; waited += 20) {
    const found = events.find(test);
    if (found) return found;
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  throw new Error('The event did not arrive.');
}

const ended = (promptId: string) => (event: BridgeEvent) =>
  event.kind === 'turnEnded' && event.promptId === promptId;

function texts(events: readonly BridgeEvent[]): string[] {
  return events.flatMap((event) =>
    event.kind === 'update' &&
    event.update.sessionUpdate === 'agent_message_chunk'
      ? [(event.update.content as { text: string }).text]
      : [],
  );
}

describe('BridgeSession', () => {
  it.each(['permission', 'modes', 'fixed', 'empty', 'unsupported'])(
    'discovers %s without prompts, MCP servers or granted permissions',
    async (variant) => {
      const log = path.join(root, 'trace.jsonl');
      const { session, events } = start(
        {},
        { ...FAKE, spec: { ...FAKE.spec, allowAll: true } },
        { ...process.env, FAKE_VARIANT: variant, FAKE_LOG: log },
        AbortSignal.timeout(5000),
      );
      const discovered = await session.discover();
      expect(discovered.status).toBe(
        variant === 'unsupported' ? 'unsupported' : 'available',
      );
      expect(discovered.choices.length).toBe(
        ['empty', 'unsupported'].includes(variant) ? 0 : 1,
      );
      if (variant === 'fixed')
        expect(discovered.choices[0]?.options).toHaveLength(1);
      if (variant === 'modes')
        expect(discovered.choices[0]?.currentValue).toBe('full');
      expect(events).toEqual([]);
      await session.close();
      const lines = (await readFile(log, 'utf8'))
        .trim()
        .split('\n')
        .map((line) => JSON.parse(line));
      expect(
        lines.find((line) => line.method === 'new').params.mcpServers,
      ).toEqual([]);
      expect(lines.some((line) => line.method === 'prompt')).toBe(false);
      if (variant === 'permission')
        expect(
          lines.find((line) => line.method === 'permission').params.outcome
            .outcome,
        ).toBe('cancelled');
      expect(() => process.kill(lines[0].pid, 0)).toThrow();
    },
  );

  it.each(['auth', 'hang'])(
    'cleans up failed %s discovery',
    async (variant) => {
      const { session } = start(
        {},
        FAKE,
        { ...process.env, FAKE_VARIANT: variant },
        AbortSignal.timeout(variant === 'auth' ? 5000 : 500),
      );
      await expect(session.discover()).rejects.toThrow(
        variant === 'auth' ? 'not signed in' : undefined,
      );
      await session.close();
      expect(session.state).toBeNull();
    },
  );

  it.each([
    { settings: { unknown: 'value' }, variant: '' },
    { settings: { mode: 'missing' }, variant: '' },
    { settings: { mode: 'full' }, variant: 'reject' },
    { settings: { mode: 'full' }, variant: 'ignore' },
  ])(
    'sends zero prompts when explicit settings cannot apply: %j',
    async ({ settings, variant }) => {
      const log = path.join(root, 'trace.jsonl');
      const { session, target, events, states } = start({ settings }, FAKE, {
        ...process.env,
        FAKE_VARIANT: variant,
        FAKE_LOG: log,
      });
      prompt(session, target, 'p1', 'first');
      expect(await until(events, ended('p1'))).toMatchObject({
        kind: 'turnEnded',
        error: expect.any(String),
      });
      prompt(session, target, 'p2', 'retry');
      expect(await until(events, ended('p2'))).toMatchObject({
        kind: 'turnEnded',
        error: expect.any(String),
      });
      expect(await readFile(log, 'utf8')).not.toContain('"method":"prompt"');
      expect(states.every((state) => state === null)).toBe(true);
    },
  );

  it('applies explicit settings before the first prompt', async () => {
    const log = path.join(root, 'trace.jsonl');
    const { session, target, events } = start(
      { settings: { mode: 'full' } },
      FAKE,
      { ...process.env, FAKE_LOG: log },
    );
    prompt(session, target, 'p1', 'first');
    await until(events, ended('p1'));
    const methods = (await readFile(log, 'utf8'))
      .trim()
      .split('\n')
      .map((line) => JSON.parse(line).method);
    expect(methods).toEqual(['new', 'set', 'prompt']);
  });

  it('applies the model first and uses its updated dependent choices before prompting', async () => {
    const log = path.join(root, 'trace.jsonl');
    const { session, target, events } = start(
      { settings: { effort: 'max', model: 'second' } },
      FAKE,
      { ...process.env, FAKE_VARIANT: 'dependent', FAKE_LOG: log },
    );
    prompt(session, target, 'p1', 'first');
    expect(await until(events, ended('p1'))).toMatchObject({ error: null });
    expect(session.state?.choices).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'model', currentValue: 'second' }),
        expect.objectContaining({ id: 'effort', currentValue: 'max' }),
      ]),
    );
    const lines = (await readFile(log, 'utf8'))
      .trim()
      .split('\n')
      .map((line) => JSON.parse(line));
    const sets = lines.filter((line) => line.method === 'set');
    expect(sets[0].params).toMatchObject({
      configId: 'model',
      value: 'second',
    });
    expect(lines.at(-1).method).toBe('prompt');
  });
  it('opens a session in the first full-access mode the agent offers and reports a turn', async () => {
    const { session, events, target } = start();
    prompt(session, target, 'p1', 'hi');
    const end = await until(events, ended('p1'));

    expect(events[0]).toMatchObject({ kind: 'turnStarted', promptId: 'p1' });
    expect(texts(events).join('')).toBe('Hello (full) world');
    expect(end).toMatchObject({
      stopReason: 'end_turn',
      usage: {
        inputTokens: 10,
        outputTokens: 2,
        cachedReadTokens: 5,
        totalTokens: 12,
      },
      error: null,
    });
    expect(session.state).toMatchObject({
      acpSessionId: 's-1',
      agent: 'Fake 1.2.3',
      choices: [{ id: 'mode', category: 'mode', currentValue: 'full' }],
    });
  });

  it('applies the choices the person made over the full-access mode', async () => {
    const { session, events, target } = start({ settings: { mode: 'ask' } });
    prompt(session, target, 'p1', 'hi');
    await until(events, ended('p1'));
    expect(texts(events).join('')).toBe('Hello (ask) world');
  });

  it('waits for a person to answer a permission request', async () => {
    const { session, events, target } = start();
    prompt(session, target, 'p1', 'permission');
    const asked = await until(
      events,
      (event) => event.kind === 'permissionRequested',
    );
    expect(asked).toMatchObject({
      toolCall: { title: 'Run rm', rawInput: { command: 'rm -rf build' } },
      options: [{ optionId: 'yes' }, { optionId: 'no' }],
    });

    session.handle({
      type: 'permission',
      session: target,
      requestId: (
        asked as Extract<BridgeEvent, { kind: 'permissionRequested' }>
      ).requestId,
      optionId: 'yes',
    });
    await until(events, ended('p1'));
    expect(texts(events)).toContain('permission: yes');
  });

  it('allows what an agent without a full-access mode asks, always when it offers to', async () => {
    const allowAll: ResolvedAgent = {
      ...FAKE,
      spec: { ...FAKE.spec, modes: [], allowAll: true },
    };
    const { session, events, target } = start({}, allowAll);
    prompt(session, target, 'p1', 'permission');
    prompt(session, target, 'p2', 'permission always');
    await until(events, ended('p2'));
    expect(texts(events)).toEqual(['permission: yes', 'permission: always']);
    expect(events.some((event) => event.kind === 'permissionRequested')).toBe(
      false,
    );
  });

  it('cancels the running turn and drops the prompts waiting behind it', async () => {
    const { session, events, target } = start();
    prompt(session, target, 'p1', 'hang');
    prompt(session, target, 'p2', 'hi');
    await until(events, (event) => event.kind === 'turnStarted');
    await new Promise((resolve) => setTimeout(resolve, 200));
    session.handle({ type: 'cancel', session: target });

    expect(await until(events, ended('p2'))).toMatchObject({
      stopReason: 'cancelled',
    });
    expect(await until(events, ended('p1'))).toMatchObject({
      stopReason: 'cancelled',
    });
    expect(events.filter((event) => event.kind === 'turnStarted')).toHaveLength(
      1,
    );
  });

  it('cancels a turn whose agent is still starting, and answers the next prompt', async () => {
    const { session, events, target } = start();
    prompt(session, target, 'p1', 'hang');
    session.handle({ type: 'cancel', session: target });

    expect(await until(events, ended('p1'))).toMatchObject({
      stopReason: 'cancelled',
      error: null,
    });
    prompt(session, target, 'p2', 'hi');
    expect(await until(events, ended('p2'))).toMatchObject({
      stopReason: 'end_turn',
    });
    expect(texts(events).join('')).toBe('Hello (full) world');
  });

  it('continues an earlier session without reporting the history it replays', async () => {
    const { session, events, target } = start({ acpSessionId: 's-earlier' });
    prompt(session, target, 'p1', 'hi');
    await until(events, ended('p1'));

    expect(texts(events).join('')).toBe('Hello (full) world');
    expect(
      events.some(
        (event) =>
          event.kind === 'update' &&
          event.update.sessionUpdate === 'user_message_chunk',
      ),
    ).toBe(false);
    expect(session.state?.acpSessionId).toBe('s-earlier');
  });

  it('gives the agent the application’s tools under the address the bridge talks to', async () => {
    const { session, events, target } = start({
      tools: { name: 'studio', path: '/mcp/agent-sessions', token: 't0k' },
    });
    prompt(session, target, 'p1', 'mcp');
    await until(events, ended('p1'));
    expect(JSON.parse(texts(events)[0]!)).toEqual([
      {
        type: 'http',
        name: 'studio',
        url: 'https://studio.example.com/app/mcp/agent-sessions',
        headers: [{ name: 'authorization', value: 'Bearer t0k' }],
      },
    ]);
  });

  it('refuses a directory outside the computer’s roots', async () => {
    const { session, events, target } = start({
      cwd: os.homedir() === root ? '/' : os.homedir(),
    });
    prompt(session, target, 'p1', 'hi');
    const end = await until(events, ended('p1'));
    expect(end).toMatchObject({ stopReason: null });
    expect((end as Extract<BridgeEvent, { kind: 'turnEnded' }>).error).toMatch(
      /work only under/u,
    );
  });
});
