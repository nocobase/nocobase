import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { ResolvedAgent } from '../src/agents.js';
import type {
  BridgeEvent,
  PromptContent,
  SessionTarget,
} from '../src/protocol.js';
import { BridgeSession } from '../src/session.js';

const FAKE: ResolvedAgent = {
  spec: {
    id: 'fake',
    name: 'Fake',
    launchers: [],
    mode: 'full',
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

function start(target: Partial<SessionTarget> = {}): {
  session: BridgeSession;
  events: BridgeEvent[];
  target: SessionTarget;
} {
  const events: BridgeEvent[] = [];
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
    env: process.env,
    roots: [root],
    resolve: () => Promise.resolve(FAKE),
    emit: (event) => events.push(event),
    stateChanged: () => undefined,
  });
  sessions.push(session);
  return { session, events, target: full };
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
  it('opens a session in the agent’s default mode and reports a turn', async () => {
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

  it('applies the choices the person made over the default mode', async () => {
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
