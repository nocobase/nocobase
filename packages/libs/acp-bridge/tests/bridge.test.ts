import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BRIDGE_HEADERS, BRIDGE_PROTOCOL_VERSION } from '../src/protocol.js';
import * as agents from '../src/agents.js';
import { BridgeSession } from '../src/session.js';
import { AgentProcess } from '../src/agent-process.js';
import type { BridgeCommand } from '../src/protocol.js';

interface Seen {
  readonly path: string;
  readonly key: string | undefined;
  readonly person: string | undefined;
  readonly body: Record<string, unknown>;
}

type Answer = {
  readonly status?: number;
  readonly data?: unknown;
  readonly error?: Record<string, unknown>;
};

let root: string;
let server: Server;
let seen: Seen[];
let answer: (request: Seen) => Answer;
let commands: BridgeCommand[];

beforeEach(async () => {
  root = await mkdtemp(path.join(os.tmpdir(), 'acp-bridge-run-'));
  // No agent is found: the bridge looks in the home directory and on PATH, both empty here.
  vi.stubEnv('HOME', root);
  seen = [];
  commands = [];
  server = createServer((request, response) => {
    let text = '';
    request.on('data', (chunk: Buffer) => (text += chunk.toString()));
    request.on('end', () => {
      const one: Seen = {
        path: request.url ?? '',
        key: request.headers[BRIDGE_HEADERS.computerKey] as string | undefined,
        person: request.headers.authorization,
        body: JSON.parse(text || '{}') as Record<string, unknown>,
      };
      seen.push(one);
      const {
        status = 200,
        data,
        error,
      }: Answer = one.path.endsWith('/poll')
        ? { data: { commands: commands.splice(0) } }
        : answer(one);
      const body = JSON.stringify(
        status === 200
          ? { data }
          : {
              error: error ?? { reason: 'AGENT_SESSIONS_COMPUTER_KEY_INVALID' },
            },
      );
      // A poll waits a little, as the application's does.
      setTimeout(
        () => response.writeHead(status).end(body),
        one.path.endsWith('/poll') ? 30 : 0,
      );
    });
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
});

afterEach(async () => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
  await rm(root, { recursive: true, force: true });
});

async function run(
  reconnect?: boolean,
): Promise<{ readonly done: Promise<void>; readonly stop: () => void }> {
  const { runBridge } = await import('../src/bridge.js');
  const stop = new AbortController();
  const done = runBridge({
    server: `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
    headers: { authorization: 'Bearer person' },
    client: { name: 'test', version: '0.0.0' },
    stateFile: path.join(root, 'state.json'),
    env: { PATH: '' },
    ...(reconnect === undefined ? {} : { reconnect }),
    signal: stop.signal,
    log: () => undefined,
  });
  return { done, stop: () => stop.abort() };
}

async function until(test: () => boolean): Promise<void> {
  for (let waited = 0; waited < 5_000; waited += 10) {
    if (test()) return;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error('It did not happen.');
}

const registers = (): Seen[] =>
  seen.filter((request) => request.path.endsWith('/register'));

describe('runBridge', () => {
  it('delivers discovered choices before slow cleanup and awaits cleanup during shutdown', async () => {
    let release: (() => void) | undefined;
    vi.spyOn(BridgeSession.prototype, 'discover').mockResolvedValue({
      status: 'available',
      choices: [],
    });
    vi.spyOn(BridgeSession.prototype, 'close').mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          release = resolve;
        }),
    );
    answer = () => ({ data: { computerId: 'c1', key: 'k1' } });
    commands.push({
      type: 'discoverChoices',
      requestId: 'd1',
      agentId: 'opencode',
      cwd: root,
      settings: {},
    });
    const { done, stop } = await run();
    try {
      await until(() => seen.some((one) => one.path.endsWith('/reply')));
      expect(release).toBeDefined();
      expect(
        seen.find((one) => one.path.endsWith('/reply'))?.body,
      ).toMatchObject({ requestId: 'd1', discovery: { status: 'available' } });
      let settled = false;
      void done.then(() => {
        settled = true;
      });
      stop();
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(settled).toBe(false);
    } finally {
      release?.();
      stop();
      await done;
    }
  });

  it('refreshes with separate probe processes while an active session keeps running', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    vi.spyOn(agents, 'resolveAgent').mockImplementation(async (spec) =>
      spec.id === 'opencode'
        ? {
            spec: { ...spec, modes: ['full'] },
            command: process.execPath,
            args: [path.join(import.meta.dirname, 'fixtures/fake-agent.mjs')],
          }
        : undefined,
    );
    const original = AgentProcess.start;
    const processes: { process: AgentProcess; probe: boolean }[] = [];
    vi.spyOn(AgentProcess, 'start').mockImplementation(
      async (resolved, options) => {
        const process = await original(resolved, options);
        processes.push({
          process,
          probe: options.initializeTimeoutMs === 30_000,
        });
        return process;
      },
    );
    answer = (request) => ({
      data: request.path.endsWith('/report')
        ? { open: true }
        : { computerId: 'c1', key: 'k1' },
    });
    const session = {
      id: 's1',
      agentId: 'opencode',
      cwd: root,
      acpSessionId: null,
      settings: {},
      tools: null,
    };
    commands.push({
      type: 'prompt',
      session,
      promptId: 'p1',
      content: [{ type: 'text', text: 'hang' }],
    });
    const { done, stop } = await run();
    try {
      await until(
        () =>
          registers().length >= 2 && processes.some((entry) => !entry.probe),
      );
      const active = processes.find((entry) => !entry.probe)!.process;
      const polls = seen.filter((request) =>
        request.path.endsWith('/poll'),
      ).length;
      await until(
        () =>
          seen.filter((request) => request.path.endsWith('/poll')).length >=
          polls + 2,
      );
      const before = registers().length;
      await vi.advanceTimersByTimeAsync(60_000);
      await until(() => registers().length > before);
      expect(processes.filter((entry) => entry.probe)).toHaveLength(2);
      expect(
        processes
          .filter((entry) => entry.probe)
          .every((entry) => !entry.process.alive),
      ).toBe(true);
      expect(active.alive).toBe(true);
      commands.push({ type: 'cancel', session });
      await until(() =>
        seen.some(
          (request) =>
            request.path.endsWith('/report') &&
            JSON.stringify(request.body).includes('cancelled'),
        ),
      );
      expect(active.alive).toBe(true);
    } finally {
      stop();
      await done;
    }
  });

  it('reprobes existing paths and changed paths, recovers failures and retries registration without overlapping', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    let command: string | undefined;
    let version = '2.0.28';
    let failProbe = false;
    let release: (() => void) | undefined;
    let hold = false;
    let registerFails = false;
    const stopProbe = vi.fn(async () => {});
    vi.spyOn(agents, 'resolveAgent').mockImplementation(async (spec) =>
      spec.id === 'opencode' && command
        ? { spec, command, args: ['acp'] }
        : undefined,
    );
    const probe = vi
      .spyOn(AgentProcess, 'start')
      .mockImplementation(async (_resolved, options) => {
        expect(options.initializeTimeoutMs).toBe(30_000);
        expect(options.signal).toBeDefined();
        if (hold)
          await new Promise<void>((resolve) => {
            release = resolve;
          });
        if (failProbe) throw new Error('Probe failed');
        return {
          initialize: { agentInfo: { version } },
          stop: stopProbe,
        } as unknown as AgentProcess;
      });
    answer = () =>
      registerFails
        ? { status: 500 }
        : { data: { computerId: 'c1', key: 'k1' } };
    const { done, stop } = await run();
    try {
      await until(() => registers().length >= 2);
      let polls = seen.filter((request) =>
        request.path.endsWith('/poll'),
      ).length;
      await until(
        () =>
          seen.filter((request) => request.path.endsWith('/poll')).length >=
          polls + 2,
      );
      const latest = () =>
        (
          registers().at(-1)?.body.computer as {
            agents: { id: string; version: string | null; problem?: string }[];
          }
        ).agents.find((info) => info.id === 'opencode');
      expect(latest()?.problem).toBe('notInstalled');
      command = '/first/opencode';
      const refresh = async () => {
        const count = registers().length;
        await vi.advanceTimersByTimeAsync(60_000);
        await until(() => registers().length > count);
        polls = seen.filter((request) => request.path.endsWith('/poll')).length;
        await until(
          () =>
            seen.filter((request) => request.path.endsWith('/poll')).length >=
            polls + 2,
        );
      };
      await refresh();
      expect(latest()).toMatchObject({ version: '2.0.28' });
      version = '2.0.29';
      await refresh();
      expect(latest()).toMatchObject({ version: '2.0.29' });
      command = '/second/opencode';
      hold = true;
      const count = probe.mock.calls.length;
      await vi.advanceTimersByTimeAsync(60_000);
      await until(() => release !== undefined);
      await vi.advanceTimersByTimeAsync(120_000);
      expect(probe).toHaveBeenCalledTimes(count + 1);
      expect(probe.mock.calls.at(-1)?.[0].command).toBe('/second/opencode');
      hold = false;
      release!();
      await until(() => stopProbe.mock.calls.length === count + 1);
      await until(() => latest()?.version === version);
      polls = seen.filter((request) => request.path.endsWith('/poll')).length;
      await until(
        () =>
          seen.filter((request) => request.path.endsWith('/poll')).length >=
          polls + 2,
      );
      failProbe = true;
      await refresh();
      expect(latest()?.problem).toBe('failed');
      failProbe = false;
      registerFails = true;
      await refresh();
      registerFails = false;
      await refresh();
      expect(latest()).toMatchObject({ version });
      expect(latest()).not.toHaveProperty('authenticated');
    } finally {
      stop();
      await done;
    }
  });

  it('connects as the person once, then with the computer’s key kept for its owner only', async () => {
    answer = (request) => ({
      data: {
        computerId: 'c1',
        ...(request.person && !request.key ? { key: 'k1' } : {}),
      },
    });
    const { done, stop } = await run();
    await until(
      () =>
        registers().length >= 2 &&
        seen.some((request) => request.path.endsWith('/poll')),
    );
    stop();
    await done;

    expect(registers()[0]).toMatchObject({
      person: 'Bearer person',
      key: undefined,
      body: { computerId: null, bridgeStartedAt: expect.any(String) },
    });
    for (const later of seen.slice(1))
      expect(later).toMatchObject({ key: 'k1', person: undefined });
    const file = path.join(root, 'state.json');
    expect(JSON.parse(await readFile(file, 'utf8'))).toEqual({
      computerId: 'c1',
      key: 'k1',
    });
    expect((await stat(file)).mode & 0o777).toBe(0o600);
  });

  it('stops when the application no longer accepts the key, if it may not connect again', async () => {
    await writeFile(
      path.join(root, 'state.json'),
      JSON.stringify({ computerId: 'c1', key: 'old' }),
    );
    answer = (request) =>
      request.key ? { status: 401 } : { data: { computerId: 'c2', key: 'k2' } };
    const { done } = await run(false);
    await expect(done).rejects.toMatchObject({
      name: 'BridgeStopped',
      message: expect.stringMatching(/no longer connected/u),
    });
    expect(registers().every((request) => request.key === 'old')).toBe(true);
  });

  it('stops for an update when the application refuses its protocol, saying which one it speaks', async () => {
    const { BridgeUpgradeRequired } = await import('../src/bridge.js');
    const refused = (metadata?: Record<string, unknown>): Answer => ({
      status: 400,
      error: {
        reason: 'AGENT_SESSIONS_UPGRADE_REQUIRED',
        message: 'The bridge speaks another protocol version.',
        ...(metadata ? { metadata } : {}),
      },
    });

    answer = () =>
      refused({
        bridgeProtocol: BRIDGE_PROTOCOL_VERSION,
        protocol: BRIDGE_PROTOCOL_VERSION + 1,
        supportedProtocols: [BRIDGE_PROTOCOL_VERSION + 1],
      });
    let failure: unknown = await (await run()).done.catch((error) => error);
    expect(failure).toBeInstanceOf(BridgeUpgradeRequired);
    expect(failure).toMatchObject({
      protocol: BRIDGE_PROTOCOL_VERSION + 1,
      bridgeProtocol: BRIDGE_PROTOCOL_VERSION,
      bridgeIsOlder: true,
    });

    // An application older than the bridge: updating the bridge does not help.
    answer = () => refused({ protocol: BRIDGE_PROTOCOL_VERSION - 1 });
    failure = await (await run()).done.catch((error) => error);
    expect(failure).toMatchObject({ bridgeIsOlder: false });

    // An application from before it said which protocol it speaks.
    answer = () => refused();
    failure = await (await run()).done.catch((error) => error);
    expect(failure).toMatchObject({ protocol: undefined, bridgeIsOlder: true });

    // Refused when it registers again while running, as after the application was updated under it.
    let accepted = 0;
    answer = () =>
      accepted++ === 0 ? { data: { computerId: 'c1', key: 'k1' } } : refused();
    failure = await (await run()).done.catch((error) => error);
    expect(failure).toBeInstanceOf(BridgeUpgradeRequired);
  });

  it('connects again as the person when the key is refused at start', async () => {
    await writeFile(
      path.join(root, 'state.json'),
      JSON.stringify({ computerId: 'c1', key: 'old' }),
    );
    answer = (request) =>
      request.key === 'old'
        ? { status: 401 }
        : {
            data: {
              computerId: 'c1',
              ...(request.key ? {} : { key: 'new' }),
            },
          };
    const { done, stop } = await run();
    await until(() => seen.some((request) => request.key === 'new'));
    stop();
    await done;

    expect(registers()[1]).toMatchObject({
      person: 'Bearer person',
      key: undefined,
      body: { computerId: 'c1' },
    });
    expect(
      JSON.parse(await readFile(path.join(root, 'state.json'), 'utf8')),
    ).toEqual({ computerId: 'c1', key: 'new' });
  });
});
