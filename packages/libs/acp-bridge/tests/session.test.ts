import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ResolvedAgent } from '../src/agents.js';
import type {
  BridgeEvent,
  PromptContent,
  SessionStartup,
  SessionTarget,
  SessionState,
} from '../src/protocol.js';
import {
  BridgeSession,
  type SessionContext,
  type WarmAgent,
} from '../src/session.js';

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
  prepareSession?: (
    agentId: string,
    sessionId: string,
  ) => Promise<NodeJS.ProcessEnv>,
  warm?: Promise<WarmAgent | undefined>,
  sessionInstructions?: SessionContext['sessionInstructions'],
  claim?: SessionContext['claim'],
): {
  session: BridgeSession;
  events: BridgeEvent[];
  target: SessionTarget;
  states: (SessionState | null)[];
  startups: (SessionStartup | null)[];
} {
  const events: BridgeEvent[] = [];
  const states: (SessionState | null)[] = [];
  const startups: (SessionStartup | null)[] = [];
  const full: SessionTarget = {
    id: 'session-1',
    agentId: 'fake',
    cwd: root,
    acpSessionId: null,
    settings: {},
    ...target,
  };
  const session = new BridgeSession(full, {
    client: { name: 'test', version: '0.0.0' },
    env,
    discoverySignal,
    prepareSession,
    warm,
    sessionInstructions,
    claim,
    roots: [root],
    resolve: () => Promise.resolve(agent),
    emit: (event) => events.push(event),
    stateChanged: () => {
      states.push(session.state);
      if (startups.at(-1) !== session.startup) startups.push(session.startup);
    },
  });
  sessions.push(session);
  return { session, events, target: full, states, startups };
}

async function traced(log: string): Promise<{ method: string; pid: number }[]> {
  return (await readFile(log, 'utf8'))
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line) as { method: string; pid: number });
}

const prepare = async (
  _agentId: string,
  sessionId: string,
): Promise<NodeJS.ProcessEnv> => ({
  NB_STUDIO_PROFILE: 'owner',
  NB_STUDIO_AGENT_SESSION: sessionId,
});

/** The agent a discovery started for `session-1`, handed out for that session to take over. */
async function discovered(env: NodeJS.ProcessEnv): Promise<WarmAgent> {
  const discovery = start({}, FAKE, env, AbortSignal.timeout(5000), prepare);
  await discovery.session.discover();
  const warm = discovery.session.release();
  // Closing the discovery leaves the agent it handed out running.
  await discovery.session.close();
  expect(warm?.process.alive).toBe(true);
  return warm!;
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
  it('withdraws only B while A awaits permission and C remains queued, deduplicating delayed delivery', async () => {
    const claim = vi.fn(async () => true);
    const { session, target, events } = start(
      {},
      FAKE,
      process.env,
      undefined,
      undefined,
      undefined,
      undefined,
      claim,
    );
    prompt(session, target, 'a', 'permission');
    const asked = await until(
      events,
      (event) => event.kind === 'permissionRequested',
    );
    if (asked.kind !== 'permissionRequested')
      throw new Error('Expected permission');
    prompt(session, target, 'b', 'never execute');
    prompt(session, target, 'c', 'next');
    expect(session.withdraw('a')).toBe(false);
    expect(session.withdraw('b')).toBe(true);
    expect(session.withdraw('b')).toBe(true);
    prompt(session, target, 'b', 'late duplicate');
    session.handle({
      type: 'permission',
      session: target,
      requestId: asked.requestId,
      optionId: 'yes',
    });
    await until(
      events,
      (event) => event.kind === 'turnEnded' && event.promptId === 'c',
    );
    expect(claim.mock.calls.map((call) => call[0])).toEqual(['a', 'c']);
    expect(
      events
        .filter((event) => event.kind === 'turnEnded')
        .map((event) => event.promptId),
    ).toEqual(['a', 'c']);
    expect(texts(events)).toContain('permission: yes');
  });

  it('removes a head awaiting a claim response before opening an agent, then runs the next prompt once', async () => {
    let release!: (execute: boolean) => void;
    const pending = new Promise<boolean>((resolve) => {
      release = resolve;
    });
    const claim = vi.fn((promptId: string) =>
      promptId === 'b' ? pending : Promise.resolve(true),
    );
    const { session, target, events } = start(
      {},
      FAKE,
      process.env,
      undefined,
      undefined,
      undefined,
      undefined,
      claim,
    );
    prompt(session, target, 'b', 'never execute');
    prompt(session, target, 'c', 'next');
    expect(session.state).toBeNull();
    expect(session.withdraw('b')).toBe(true);
    release(false);
    await until(
      events,
      (event) => event.kind === 'turnEnded' && event.promptId === 'c',
    );
    prompt(session, target, 'c', 'duplicate');
    expect(
      events
        .filter((event) => event.kind === 'turnStarted')
        .map((event) => event.promptId),
    ).toEqual(['c']);
    expect(claim.mock.calls.map((call) => call[0])).toEqual(['b', 'c']);
  });
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
  it.each(['new', 'load', 'resume', 'prompt'])(
    'retries after %s requires authentication, without replaying the failed message',
    async (stage) => {
      const marker = path.join(root, 'signed-in-marker');
      const agent = {
        ...FAKE,
        spec: {
          ...FAKE.spec,
          env: { FAKE_AUTH_STAGE: stage, FAKE_AUTH_MARKER: marker },
        },
      };
      const { session, events, target } = start(
        stage === 'load' || stage === 'resume'
          ? { acpSessionId: 's-earlier' }
          : {},
        agent,
      );
      prompt(session, target, 'p1', 'hi');
      expect(await until(events, ended('p1'))).toMatchObject({
        stopReason: null,
        error: expect.any(String),
      });
      await writeFile(marker, 'ready');
      prompt(session, target, 'p2', 'hi');
      expect(await until(events, ended('p2'))).toMatchObject({
        stopReason: 'end_turn',
        error: null,
      });
      expect(texts(events).join('')).toBe('Hello (full) world');
      expect(events.filter(ended('p1'))).toHaveLength(1);
      expect(session.state?.acpSessionId).toBe(
        stage === 'load' || stage === 'resume' ? 's-earlier' : 's-1',
      );
    },
  );

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

  it('cancels only the selected turn and preserves other queued prompts', async () => {
    const { session, events, target } = start();
    prompt(session, target, 'p1', 'hang');
    prompt(session, target, 'p2', 'hi');
    await until(events, (event) => event.kind === 'turnStarted');
    await new Promise((resolve) => setTimeout(resolve, 200));
    session.handle({ type: 'cancel', session: target, promptId: 'p1' });

    expect(await until(events, ended('p2'))).toMatchObject({
      stopReason: 'end_turn',
    });
    expect(await until(events, ended('p1'))).toMatchObject({
      stopReason: 'cancelled',
    });
    expect(events.filter((event) => event.kind === 'turnStarted')).toHaveLength(
      2,
    );
  });

  it('cancels a turn whose agent is still starting, and answers the next prompt', async () => {
    const { session, events, target } = start();
    prompt(session, target, 'p1', 'hang');
    session.handle({ type: 'cancel', session: target, promptId: 'p1' });

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

  it('prepares the shared Skill before new and restored sessions, and stops on a preparation failure', async () => {
    const calls: string[] = [];
    const prepare = async (agentId: string, sessionId: string) => {
      calls.push(`${agentId}:${sessionId}`);
      return { NB_STUDIO_PROFILE: 'owner', NB_STUDIO_AGENT_SESSION: sessionId };
    };
    for (const acpSessionId of [null, 's-earlier']) {
      const { session, events, target } = start(
        { acpSessionId },
        FAKE,
        process.env,
        undefined,
        prepare,
      );
      prompt(session, target, 'p1', 'session-env');
      await until(events, ended('p1'));
      expect(JSON.parse(texts(events)[0]!)).toEqual({
        profile: 'owner',
        sessionId: 'session-1',
        mcpServers: [],
      });
    }
    expect(calls).toEqual(['fake:session-1', 'fake:session-1']);
    const { session, events, target } = start(
      {},
      FAKE,
      process.env,
      undefined,
      async () => {
        throw new Error('Install the shared Skill first.');
      },
    );
    prompt(session, target, 'p2', 'hi');
    await expect(until(events, ended('p2'))).resolves.toMatchObject({
      error: 'Install the shared Skill first.',
    });
    expect(texts(events)).toEqual([]);
  });

  it.each(['new', 'resume', 'load', 'warm'])(
    'delivers local instructions with the user content on every turn after %s',
    async (opening) => {
      const log = path.join(root, 'instructions.jsonl');
      const env = {
        ...process.env,
        FAKE_LOG: log,
        ...(['load', 'resume'].includes(opening)
          ? { FAKE_VARIANT: opening }
          : {}),
      };
      const warm = opening === 'warm' ? await discovered(env) : undefined;
      const calls: string[] = [];
      const { session, target, events } = start(
        {
          acpSessionId: ['load', 'resume'].includes(opening)
            ? 's-earlier'
            : null,
        },
        FAKE,
        env,
        undefined,
        prepare,
        warm ? Promise.resolve(warm) : undefined,
        async (agentId, sessionId) => {
          calls.push(`${agentId}:${sessionId}`);
          return `shared instructions ${calls.length}`;
        },
      );
      const content: PromptContent[] = [
        { type: 'text', text: 'user message' },
        { type: 'image', data: 'aW1hZ2U=', mimeType: 'image/png' },
      ];
      for (const promptId of ['p1', 'p2']) {
        session.handle({ type: 'prompt', session: target, promptId, content });
        expect(await until(events, ended(promptId))).toMatchObject({
          error: null,
        });
      }
      const trace = (await readFile(log, 'utf8'))
        .trim()
        .split('\n')
        .map((line) => JSON.parse(line));
      const prompts = trace.filter((entry) => entry.method === 'prompt');
      expect(prompts).toHaveLength(2);
      for (const [index, entry] of prompts.entries()) {
        expect(entry.params.prompt).toEqual([
          { type: 'text', text: `shared instructions ${index + 1}` },
          ...content,
        ]);
      }
      expect(calls).toEqual(['fake:session-1', 'fake:session-1']);
      expect(
        events.filter((event) => event.kind === 'turnStarted'),
      ).toHaveLength(2);
      expect(JSON.stringify(events)).not.toContain('shared instructions');
      expect(
        trace.some(
          (entry) => entry.method === (opening === 'warm' ? 'new' : opening),
        ),
      ).toBe(true);
    },
  );

  it('does not silently send a prompt without required local instructions', async () => {
    const log = path.join(root, 'instructions-error.jsonl');
    const { session, target, events } = start(
      {},
      FAKE,
      { ...process.env, FAKE_LOG: log },
      undefined,
      prepare,
      undefined,
      async () => {
        throw new Error('Reinstall the CLI and resend the message.');
      },
    );
    prompt(session, target, 'p1', 'hi');
    expect(await until(events, ended('p1'))).toMatchObject({
      error: 'Reinstall the CLI and resend the message.',
    });
    expect((await traced(log)).some((entry) => entry.method === 'prompt')).toBe(
      false,
    );
  });

  it('says what it is doing while the agent opens', async () => {
    const { session, target, events, startups } = start({
      settings: { mode: 'full' },
    });
    prompt(session, target, 'p1', 'first');
    await until(events, ended('p1'));
    expect(startups).toEqual(['starting', 'opening', 'configuring', null]);
  });

  it('takes over the agent its discovery started, with the session’s environment, and starts no other', async () => {
    const log = path.join(root, 'trace.jsonl');
    const env = { ...process.env, FAKE_LOG: log };
    const warm = await discovered(env);
    const { session, target, events, startups } = start(
      { settings: { mode: 'full' } },
      FAKE,
      env,
      undefined,
      prepare,
      Promise.resolve(warm),
    );
    prompt(session, target, 'p1', 'session-env');
    expect(await until(events, ended('p1'))).toMatchObject({ error: null });
    expect(JSON.parse(texts(events)[0]!)).toEqual({
      profile: 'owner',
      sessionId: 'session-1',
      mcpServers: [],
    });
    const lines = await traced(log);
    expect(new Set(lines.map((line) => line.pid))).toEqual(
      new Set([lines[0]!.pid]),
    );
    expect(lines.filter((line) => line.method === 'new')).toHaveLength(1);
    expect(session.state?.acpSessionId).toBe(warm.acpSessionId);
    expect(startups).toEqual(['starting', 'configuring', null]);
  });

  it('applies its own choices to the agent it takes over', async () => {
    const env = { ...process.env, FAKE_VARIANT: 'dependent' };
    const warm = await discovered(env);
    const { session, target, events } = start(
      { settings: { model: 'second', effort: 'max' } },
      FAKE,
      env,
      undefined,
      prepare,
      Promise.resolve(warm),
    );
    prompt(session, target, 'p1', 'first');
    expect(await until(events, ended('p1'))).toMatchObject({ error: null });
    expect(session.state?.choices).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'model', currentValue: 'second' }),
        expect.objectContaining({ id: 'effort', currentValue: 'max' }),
      ]),
    );
  });

  it('stops a kept agent it cannot use and starts its own', async () => {
    const log = path.join(root, 'trace.jsonl');
    const env = { ...process.env, FAKE_LOG: log };
    const warm = await discovered(env);
    const { session, target, events } = start(
      { agentId: 'other' },
      FAKE,
      env,
      undefined,
      prepare,
      Promise.resolve(warm),
    );
    prompt(session, target, 'p1', 'first');
    expect(await until(events, ended('p1'))).toMatchObject({ error: null });
    expect(warm.process.alive).toBe(false);
    expect(new Set((await traced(log)).map((line) => line.pid)).size).toBe(2);
  });

  it('stops the agent kept for it when it closes before its first prompt', async () => {
    const warm = await discovered(process.env);
    const { session } = start(
      {},
      FAKE,
      process.env,
      undefined,
      prepare,
      Promise.resolve(warm),
    );
    await session.close();
    expect(warm.process.alive).toBe(false);
  });

  it('opens a session with no MCP servers', async () => {
    const { session, events, target } = start();
    prompt(session, target, 'p1', 'mcp');
    await until(events, ended('p1'));
    expect(JSON.parse(texts(events)[0]!)).toEqual([]);
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
