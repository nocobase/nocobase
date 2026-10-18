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
  readonly delay?: number;
};

let root: string;
let server: Server;
let seen: Seen[];
let answer: (request: Seen) => Answer;
let claimAnswer: ((request: Seen) => Answer) | undefined;
let commands: BridgeCommand[];
let activeRegistrations: number;
let maxRegistrations: number;

beforeEach(async () => {
  root = await mkdtemp(path.join(os.tmpdir(), 'acp-bridge-run-'));
  // No agent is found: the bridge looks in the home directory and on PATH, both empty here.
  vi.stubEnv('HOME', root);
  seen = [];
  commands = [];
  claimAnswer = undefined;
  activeRegistrations = 0;
  maxRegistrations = 0;
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
        delay,
      }: Answer = one.path.endsWith('/poll')
        ? { data: { commands: commands.splice(0) } }
        : one.path.endsWith('/claim')
          ? (claimAnswer?.(one) ?? { data: { execute: true } })
          : answer(one);
      const body = JSON.stringify(
        status === 200
          ? { data }
          : {
              error: error ?? { reason: 'AGENT_SESSIONS_COMPUTER_KEY_INVALID' },
            },
      );
      // A poll waits a little, as the application's does.
      const registration = one.path.endsWith('/register');
      if (registration) {
        activeRegistrations++;
        maxRegistrations = Math.max(maxRegistrations, activeRegistrations);
      }
      setTimeout(
        () => {
          if (registration) activeRegistrations--;
          response.writeHead(status).end(body);
        },
        delay ?? (one.path.endsWith('/poll') ? 30 : 0),
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
  it('withdraws a queued message and confirms turn reports while another agent installation is pending', async () => {
    let release!: () => void;
    const installation = new Promise<void>((resolve) => {
      release = resolve;
    });
    let installing = false;
    vi.spyOn(agents, 'resolveAgent').mockImplementation(
      async (spec, _env, _platform, options) => {
        if (spec.id === 'claude' && options?.waitForInstall) {
          installing = true;
          options.installing?.('Installation in progress');
          await installation;
          installing = false;
        }
        return spec.id === 'opencode'
          ? {
              spec,
              command: process.execPath,
              args: [path.join(import.meta.dirname, 'fixtures/fake-agent.mjs')],
            }
          : undefined;
      },
    );
    answer = (request) => ({
      data: request.path.endsWith('/register')
        ? { computerId: 'c1', key: 'k1' }
        : { open: true },
    });
    const session = {
      id: 'session',
      agentId: 'opencode',
      cwd: root,
      acpSessionId: null,
      settings: {},
    };
    for (const [index, text] of ['permission', 'withdraw me', 'next'].entries())
      commands.push({
        type: 'prompt',
        session,
        promptId: `p${index + 1}`,
        seq: index + 1,
        content: [{ type: 'text', text }],
      });
    const eventsOf = (request: Seen) =>
      request.path.endsWith('/report')
        ? (request.body.events as {
            kind: string;
            promptId?: string;
            requestId?: string;
          }[])
        : [];
    const claimed = () =>
      seen
        .filter((request) => request.path.endsWith('/claim'))
        .map((request) => request.body.promptId);
    const { done, stop } = await run();
    try {
      await until(() =>
        seen.some((request) =>
          eventsOf(request).some(
            (event) => event.kind === 'permissionRequested',
          ),
        ),
      );
      const permission = seen
        .flatMap(eventsOf)
        .find((event) => event.kind === 'permissionRequested')!;
      commands.push({
        type: 'withdrawPrompt',
        sessionId: session.id,
        promptId: 'p2',
        seq: 2,
      });
      await until(() =>
        seen.some((request) => request.path.endsWith('/withdrawn')),
      );
      expect(installing).toBe(true);
      expect(claimed()).toEqual(['p1']);
      commands.push({
        type: 'permission',
        session,
        requestId: permission.requestId!,
        optionId: 'yes',
      });
      await until(() =>
        seen.some((request) =>
          eventsOf(request).some(
            (event) => event.kind === 'turnEnded' && event.promptId === 'p3',
          ),
        ),
      );
      expect(installing).toBe(true);
      expect(claimed()).toEqual(['p1', 'p3']);
      const firstEnd = seen.findIndex((request) =>
        eventsOf(request).some(
          (event) => event.kind === 'turnEnded' && event.promptId === 'p1',
        ),
      );
      const nextClaim = seen.findIndex(
        (request) =>
          request.path.endsWith('/claim') && request.body.promptId === 'p3',
      );
      expect(firstEnd).toBeGreaterThanOrEqual(0);
      expect(nextClaim).toBeGreaterThan(firstEnd);
    } finally {
      release();
      stop();
      await done;
    }
  });

  it('does not claim a successor after the application permanently refuses its preceding report', async () => {
    const close = vi.spyOn(BridgeSession.prototype, 'close');
    answer = (request) =>
      request.path.endsWith('/report')
        ? {
            status: 400,
            error: { reason: 'INVALID_REPORT', message: 'Report refused.' },
          }
        : { data: { computerId: 'c1', key: 'k1' } };
    const session = {
      id: 'session',
      agentId: 'opencode',
      cwd: root,
      acpSessionId: null,
      settings: {},
    };
    commands.push(
      {
        type: 'prompt',
        session,
        promptId: 'first',
        seq: 1,
        content: [{ type: 'text', text: 'first' }],
      },
      {
        type: 'prompt',
        session,
        promptId: 'second',
        seq: 2,
        content: [{ type: 'text', text: 'second' }],
      },
    );
    const { done, stop } = await run();
    try {
      await until(() => close.mock.calls.length > 0);
      expect(
        seen
          .filter((request) => request.path.endsWith('/claim'))
          .map((request) => request.body.promptId),
      ).toEqual(['first']);
    } finally {
      stop();
      await done;
    }
  });
  it('explains an unsequenced pre-upgrade command instead of silently dropping or executing it', async () => {
    answer = () => ({ data: { computerId: 'c1', key: 'k1', open: true } });
    commands.push({
      type: 'prompt',
      session: {
        id: 'legacy',
        agentId: 'opencode',
        cwd: root,
        acpSessionId: null,
        settings: {},
      },
      promptId: 'old',
      content: [{ type: 'text', text: 'Legacy' }],
    });
    const { done, stop } = await run();
    try {
      await until(() =>
        seen.some(
          (one) =>
            one.path.endsWith('/report') &&
            (one.body.events as { kind: string }[]).some(
              (event) => event.kind === 'notice',
            ),
        ),
      );
    } finally {
      stop();
      await done;
    }
    expect(seen.some((one) => one.path.endsWith('/claim'))).toBe(false);
  });
  it('propagates a claim protocol refusal so the CLI can upgrade and restart', async () => {
    const { BridgeUpgradeRequired } = await import('../src/bridge.js');
    answer = () => ({ data: { computerId: 'c1', key: 'k1' } });
    claimAnswer = () => ({
      status: 400,
      error: {
        reason: 'AGENT_SESSIONS_UPGRADE_REQUIRED',
        message: 'Upgrade the bridge.',
        metadata: { protocol: BRIDGE_PROTOCOL_VERSION + 1 },
      },
    });
    commands.push({
      type: 'prompt',
      session: {
        id: 'session',
        agentId: 'opencode',
        cwd: root,
        acpSessionId: null,
        settings: {},
      },
      promptId: 'p1',
      seq: 1,
      content: [{ type: 'text', text: 'Must not execute' }],
    });
    const { done, stop } = await run();
    try {
      await expect(done).rejects.toBeInstanceOf(BridgeUpgradeRequired);
    } finally {
      stop();
    }
    expect(
      seen.some(
        (one) =>
          one.path.endsWith('/report') &&
          (one.body.events as unknown[]).length > 0,
      ),
    ).toBe(false);
  });
  it.each([
    { damageAt: 1, installationMs: 15_000, budgetMs: 180_000 },
    { damageAt: 59_999, installationMs: 15_000, budgetMs: 180_000 },
    { damageAt: 1, installationMs: 300_000, budgetMs: 480_000 },
    { damageAt: 59_999, installationMs: 300_000, budgetMs: 480_000 },
  ])(
    'detects damage at $damageAt ms and resumes immediately after a $installationMs ms installation',
    async ({ damageAt, installationMs, budgetMs }) => {
      vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] });
      let damaged = false;
      let release: (() => void) | undefined;
      let detectedAt = 0;
      vi.spyOn(agents, 'resolveAgent').mockImplementation(
        async (spec, _env, _platform, options) => {
          if (spec.id !== 'claude') return undefined;
          if (damaged) {
            detectedAt = Date.now();
            options?.installing?.(
              'Command: npm install adapter\nInstallation in progress',
            );
            await new Promise<void>((resolve) => {
              release = resolve;
            });
            damaged = false;
          }
          return { spec, command: process.execPath, args: [] };
        },
      );
      vi.spyOn(AgentProcess, 'start').mockImplementation(
        async () =>
          ({
            initialize: { agentInfo: { version: 'ready' } },
            stop: async () => {},
          }) as unknown as AgentProcess,
      );
      answer = () => ({ data: { computerId: 'c1', key: 'k1' } });
      const isReady = () =>
        (
          registers().at(-1)?.body.computer as
            | { agents: { id: string; problem?: string; version: string }[] }
            | undefined
        )?.agents.some(
          (a) => a.id === 'claude' && !a.problem && a.version === 'ready',
        );
      const { done, stop } = await run();
      try {
        await until(isReady);
        await vi.advanceTimersByTimeAsync(damageAt);
        damaged = true;
        const brokenAt = Date.now();
        await vi.advanceTimersByTimeAsync(60_000 - damageAt);
        await until(() => release !== undefined);
        expect(detectedAt - brokenAt).toBeLessThanOrEqual(60_000);
        await until(() => !isReady());
        await vi.advanceTimersByTimeAsync(installationMs);
        const installedAt = Date.now();
        release!();
        await until(isReady);
        // No extra scan is needed after installation; reserve the full documented probe/report/page budgets.
        expect(Date.now()).toBe(installedAt);
        expect(
          Date.now() - brokenAt + 33_000 + 30_150 + 30_000 + 10_000,
        ).toBeLessThanOrEqual(budgetMs);
      } finally {
        release?.();
        stop();
        await done;
      }
    },
  );

  it('serializes registrations and merges agent results that finish during a request', async () => {
    const releases = new Map<string, () => void>();
    vi.spyOn(agents, 'resolveAgent').mockImplementation(async (spec) =>
      ['codex', 'claude', 'gemini', 'opencode'].includes(spec.id)
        ? { spec, command: process.execPath, args: [] }
        : undefined,
    );
    vi.spyOn(AgentProcess, 'start').mockImplementation(
      (resolved) =>
        new Promise((resolve) =>
          releases.set(resolved.spec.id, () =>
            resolve({
              initialize: { agentInfo: { version: 'complete' } },
              stop: async () => {},
            } as unknown as AgentProcess),
          ),
        ),
    );
    answer = () => ({ data: { computerId: 'c1', key: 'k1' }, delay: 300 });
    const { done, stop } = await run();
    try {
      await until(() => releases.size === 4);
      releases.get('codex')!();
      await until(() => activeRegistrations === 1 && registers().length >= 2);
      for (const id of ['claude', 'gemini', 'opencode']) releases.get(id)!();
      await until(
        () =>
          (
            registers().at(-1)?.body.computer as
              { agents: { version: string }[] } | undefined
          )?.agents.filter((info) => info.version === 'complete').length === 4,
      );
      expect(maxRegistrations).toBe(1);
      expect(registers()).toHaveLength(3);
    } finally {
      for (const release of releases.values()) release();
      stop();
      await done;
    }
  });
  it('keeps probing and reporting other agents across ticks while one install remains pending', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    let release: (() => void) | undefined;
    const installation = new Promise<void>((resolve) => {
      release = resolve;
    });
    let claudeInspections = 0;
    let version = 'ready-1';
    vi.spyOn(agents, 'resolveAgent').mockImplementation(
      async (spec, _env, _platform, options) => {
        if (spec.id === 'claude') {
          if (options?.waitForInstall === false)
            throw new Error('installation pending');
          claudeInspections++;
          options?.installing?.(
            'Command: npm install claude-adapter\nInstallation in progress',
          );
          await installation;
        } else if (spec.id !== 'codex') return undefined;
        return { spec, command: process.execPath, args: [] };
      },
    );
    const probes = vi.spyOn(AgentProcess, 'start').mockImplementation(
      async () =>
        ({
          initialize: { agentInfo: { version } },
          stop: async () => {},
        }) as unknown as AgentProcess,
    );
    answer = () => ({ data: { computerId: 'c1', key: 'k1' } });
    const latest = (id: string) =>
      (
        registers().at(-1)?.body.computer as
          | {
              agents: {
                id: string;
                version: string;
                problem?: string;
                detail?: string;
              }[];
            }
          | undefined
      )?.agents.find((one) => one.id === id);
    const { done, stop } = await run();
    try {
      await until(() => latest('codex')?.version === 'ready-1');
      expect(latest('claude')?.detail).toContain('Installation in progress');
      version = 'ready-2';
      await vi.advanceTimersByTimeAsync(120_000);
      await until(() => latest('codex')?.version === 'ready-2');
      expect(claudeInspections).toBe(1);
      expect(
        probes.mock.calls.filter(([resolved]) => resolved.spec.id === 'codex'),
      ).toHaveLength(3);
      expect(
        probes.mock.calls.some(([resolved]) => resolved.spec.id === 'claude'),
      ).toBe(false);
      release!();
      await until(() => latest('claude')?.version === 'ready-2');
      expect(latest('claude')?.problem).toBeUndefined();
      expect(claudeInspections).toBe(1);
    } finally {
      release!();
      stop();
      await done;
    }
  });

  it('registers installation failures and recovers on the next minute without blocking other agents', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    let broken = true;
    vi.spyOn(agents, 'resolveAgent').mockImplementation(async (spec) => {
      if (spec.id === 'claude' && broken)
        throw new Error(
          'Command: npm install pinned-adapter\nnpm error registry unavailable',
        );
      return spec.id === 'claude' || spec.id === 'codex'
        ? {
            spec,
            command: process.execPath,
            args: [path.join(import.meta.dirname, 'fixtures/fake-agent.mjs')],
          }
        : undefined;
    });
    answer = () => ({ data: { computerId: 'c1', key: 'k1' } });
    const { done, stop } = await run();
    const latest = () =>
      (
        registers().at(-1)?.body.computer as {
          agents: { id: string; problem?: string; detail?: string }[];
        }
      ).agents;
    try {
      await until(() => registers().length >= 2);
      expect(latest().find((info) => info.id === 'claude')).toMatchObject({
        problem: 'failed',
        detail: expect.stringContaining('npm error registry unavailable'),
      });
      expect(
        latest().find((info) => info.id === 'codex')?.problem,
      ).toBeUndefined();
      broken = false;
      const before = registers().length;
      await vi.advanceTimersByTimeAsync(60_000);
      await until(() => registers().length > before);
      await until(
        () =>
          latest().find((info) => info.id === 'claude')?.problem === undefined,
      );
      expect(
        latest().find((info) => info.id === 'claude')?.problem,
      ).toBeUndefined();
    } finally {
      stop();
      await done;
    }
  });

  it('registers the actual startup command and stderr tail within the protocol limit', async () => {
    const script =
      'process.stderr.write("first line\\nlast failure line\\n"); process.exit(1)';
    vi.spyOn(agents, 'resolveAgent').mockImplementation(async (spec) =>
      spec.id === 'claude'
        ? {
            spec,
            command: process.execPath,
            args: ['-e', script],
          }
        : undefined,
    );
    answer = () => ({ data: { computerId: 'c1', key: 'k1' } });
    const { done, stop } = await run();
    try {
      const latest = () =>
        (
          registers().at(-1)?.body.computer as
            | { agents: { id: string; detail?: string; problem?: string }[] }
            | undefined
        )?.agents.find((one) => one.id === 'claude');
      // A coalesced registration may precede the probe's completion.
      await until(() => latest()?.problem === 'failed');
      const info = latest()!;
      expect(info.problem).toBe('failed');
      expect(info.detail).toContain(`Command: ${process.execPath} -e `);
      expect(info.detail).toContain('first line\nlast failure line');
      expect(info.detail!.length).toBeLessThanOrEqual(2000);
    } finally {
      stop();
      await done;
    }
  });

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
    };
    commands.push({
      type: 'prompt',
      session,
      promptId: 'p1',
      seq: 1,
      content: [{ type: 'text', text: 'hang' }],
    });
    const { done, stop } = await run();
    try {
      await until(
        () =>
          registers().length >= 2 &&
          processes.some((entry) => !entry.probe) &&
          processes.some((entry) => entry.probe && !entry.process.alive),
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
      await until(() => processes.filter((entry) => entry.probe).length === 2);
      await until(() =>
        processes
          .filter((entry) => entry.probe)
          .every((entry) => !entry.process.alive),
      );
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

  it('hands the agent a discovery started for a new session to that session’s first prompt', async () => {
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
    let started = 0;
    vi.spyOn(AgentProcess, 'start').mockImplementation(
      async (resolved, options) => {
        // Probes initialize on a shorter budget; sessions and discoveries do not.
        if (options.initializeTimeoutMs !== 30_000) started += 1;
        return original(resolved, options);
      },
    );
    answer = (request) => ({
      data: request.path.endsWith('/report')
        ? { open: true }
        : request.path.endsWith('/register')
          ? { computerId: 'c1', key: 'k1' }
          : {},
    });
    const prepared: string[] = [];
    const instructed: string[] = [];
    const { runBridge } = await import('../src/bridge.js');
    const stop = new AbortController();
    commands.push({
      type: 'discoverChoices',
      requestId: 'r1',
      agentId: 'opencode',
      cwd: root,
      settings: {},
      sessionId: 's1',
    });
    const done = runBridge({
      server: `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
      headers: { authorization: 'Bearer person' },
      client: { name: 'test', version: '0.0.0' },
      stateFile: path.join(root, 'state.json'),
      env: { PATH: '' },
      prepareSession: async (_agentId, sessionId) => {
        prepared.push(sessionId);
        return {};
      },
      sessionInstructions: async (agentId, sessionId) => {
        instructed.push(`${agentId}:${sessionId}`);
        return 'Shared CLI instructions';
      },
      signal: stop.signal,
      log: () => undefined,
    });
    const reports = (): Record<string, unknown>[] =>
      seen
        .filter((request) => request.path.endsWith('/report'))
        .map((request) => request.body);
    try {
      await until(() =>
        seen.some((request) => request.body.requestId === 'r1'),
      );
      commands.push({
        type: 'prompt',
        session: {
          id: 's1',
          agentId: 'opencode',
          cwd: root,
          acpSessionId: null,
          settings: {},
        },
        promptId: 'p1',
        seq: 1,
        content: [{ type: 'text', text: 'hi' }],
      });
      await until(() =>
        reports().some((body) =>
          JSON.stringify(body.events).includes('"turnEnded"'),
        ),
      );
      expect(started).toBe(1);
      expect(prepared).toEqual(['s1']);
      expect(instructed).toEqual(['opencode:s1']);
      expect(
        reports()
          .map((body) => body.startup)
          .filter((startup) => startup !== undefined)
          .at(-1),
      ).toBeNull();
    } finally {
      stop.abort();
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
            agents: {
              id: string;
              version: string | null;
              problem?: string;
              detail?: string;
            }[];
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
      expect(latest()?.detail).toBe(
        'Command: /second/opencode acp\nProbe failed',
      );
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

  it('installs managed adapters beside its state without waiting to connect, and runs a session on its managed adapter', async () => {
    const calls: { id: string; options: agents.ResolveOptions | undefined }[] =
      [];
    const fake = path.join(import.meta.dirname, 'fixtures/fake-agent.mjs');
    vi.spyOn(agents, 'resolveAgent').mockImplementation(
      async (spec, _env, _platform, options) => {
        calls.push({ id: spec.id, options });
        if (spec.id !== 'codex') return undefined;
        // Installed once something waits for it, which takes a while; until then Codex is found another way.
        if (!options?.waitForInstall)
          return { spec, command: process.execPath, args: [fake, 'fallback'] };
        await new Promise((resolve) => setTimeout(resolve, 500));
        return { spec, command: process.execPath, args: [fake], managed: true };
      },
    );
    const original = AgentProcess.start;
    const sessions: agents.ResolvedAgent[] = [];
    vi.spyOn(AgentProcess, 'start').mockImplementation(
      async (resolved, options) => {
        if (options.initializeTimeoutMs !== 30_000) sessions.push(resolved);
        return original(resolved, options);
      },
    );
    answer = (request) => ({
      data: request.path.endsWith('/report')
        ? { open: true }
        : { computerId: 'c1', key: 'k1' },
    });
    commands.push({
      type: 'prompt',
      session: {
        id: 's1',
        agentId: 'codex',
        cwd: root,
        acpSessionId: null,
        settings: {},
      },
      promptId: 'p1',
      seq: 1,
      content: [{ type: 'text', text: 'hang' }],
    });
    const { done, stop } = await run();
    try {
      await until(() => registers().length >= 2 && sessions.length > 0);
      const first = calls.slice(0, agents.AGENTS.length);
      expect(first.every((call) => !call.options?.waitForInstall)).toBe(true);
      expect(
        calls.every(
          (call) => call.options?.adapters === path.join(root, 'adapters'),
        ),
      ).toBe(true);
      expect(
        calls
          .slice(agents.AGENTS.length)
          .every((call) => call.options?.waitForInstall),
      ).toBe(true);
      expect(sessions[0]).toMatchObject({ args: [fake], managed: true });
    } finally {
      stop();
      await done;
    }
  });
});
