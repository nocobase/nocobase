import { chmod, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { beforeAll, describe, expect, it } from 'vitest';

import { CodexAdapter } from '../../src/agent/adapters/codex.ts';
import { classifyCodexFailure } from '../../src/agent/adapters/codex/classify.ts';
import {
  shellWords,
  unwrapShell,
} from '../../src/agent/adapters/codex/util.ts';
import type {
  AdapterEvent,
  AdapterHandle,
  AdapterSession,
} from '../../src/agent/adapters/types.ts';
import { fakeSpawn } from './fake-codex.ts';
import type { FakeCodex } from './fake-codex.ts';

let binDir: string;

beforeAll(async () => {
  binDir = await mkdtemp(path.join(tmpdir(), 'nocobase-runner-codex-bin-'));
  await writeFile(path.join(binDir, 'codex'), '#!/bin/sh\n');
  await chmod(path.join(binDir, 'codex'), 0o755);
});

function execFor(version: string, loggedIn = true) {
  return async (_file: string, args: string[]) =>
    args[0] === '--version'
      ? { code: 0, stdout: `codex-cli ${version}\n` }
      : { code: loggedIn ? 0 : 1, stdout: '' };
}

function adapterWith(script: (fake: FakeCodex) => void | Promise<void>) {
  const spawn = fakeSpawn(script);
  const adapter = new CodexAdapter({
    spawn,
    searchPath: binDir,
    exec: execFor('0.158.0'),
  });
  return { adapter, spawn };
}

function session(overrides: Partial<AdapterSession> = {}): AdapterSession {
  return {
    workDir: '/work',
    prompt: 'do it',
    systemPrompt: 'brief',
    env: {},
    abort: new AbortController().signal,
    permission: async () => 'allow',
    ...overrides,
  };
}

async function drain(handle: AdapterHandle): Promise<AdapterEvent[]> {
  const events: AdapterEvent[] = [];
  for await (const event of handle.events) events.push(event);
  return events;
}

/** initialize, thread/start (or resume) and the first turn/start. */
async function handshake(
  fake: FakeCodex,
  turnId = 'turn-1',
): Promise<Record<string, unknown>> {
  fake.respond(await fake.nextRequest('initialize'), {
    userAgent: 'test',
  });
  await fake.next((m) => m.method === 'initialized');
  const thread = await fake.next(
    (m) => m.method === 'thread/start' || m.method === 'thread/resume',
  );
  fake.respond(thread, { thread: { id: 'thread-1' }, model: 'gpt-test' });
  const turn = await fake.nextRequest('turn/start');
  fake.respond(turn, {
    turn: { id: turnId, status: 'inProgress', error: null },
  });
  fake.notify('turn/started', {
    threadId: 'thread-1',
    turn: { id: turnId, status: 'inProgress', error: null },
  });
  return turn.params as Record<string, unknown>;
}

function completeTurn(
  fake: FakeCodex,
  turnId = 'turn-1',
  status = 'completed',
  error: unknown = null,
): void {
  fake.notify('turn/completed', {
    threadId: 'thread-1',
    turn: { id: turnId, status, error, durationMs: 5 },
  });
}

function item(
  fake: FakeCodex,
  phase: 'started' | 'completed',
  value: Record<string, unknown>,
): void {
  fake.notify(`item/${phase}`, {
    threadId: 'thread-1',
    turnId: 'turn-1',
    item: value,
  });
}

describe('detect', () => {
  it('reports the installed version and login state', async () => {
    const adapter = new CodexAdapter({
      searchPath: binDir,
      exec: execFor('0.158.0'),
    });
    expect(await adapter.detect()).toEqual({
      installed: true,
      version: '0.158.0',
      path: path.join(binDir, 'codex'),
      authenticated: true,
    });
    expect(adapter.features()).toEqual(['steer']);
  });

  it('treats an old codex as not installed and reads the login exit code', async () => {
    const adapter = new CodexAdapter({
      searchPath: binDir,
      exec: execFor('0.120.0', false),
    });
    expect(await adapter.detect()).toMatchObject({
      installed: false,
      version: '0.120.0',
      authenticated: false,
    });
  });

  it('finds no codex on an empty path', async () => {
    const adapter = new CodexAdapter({ searchPath: '' });
    expect((await adapter.detect()).installed).toBe(false);
  });

  it('fails the run as toolProcess when codex is missing', async () => {
    const adapter = new CodexAdapter({ searchPath: '' });
    const handle = adapter.start(session());
    await drain(handle);
    expect((await handle.result).error?.reason).toBe('toolProcess');
  });
});

describe('skills', () => {
  const skills = {
    root: '/work/.nocobase-runner/plugin',
    dir: '/work/.nocobase-runner/plugin/skills',
    slugs: ['pr-etiquette'],
  };

  it("adds the run's skills folder as an extra skills root before the thread starts", async () => {
    let roots: unknown;
    const { adapter } = adapterWith(async (fake) => {
      fake.respond(await fake.nextRequest('initialize'), { userAgent: 't' });
      const set = await fake.nextRequest('skills/extraRoots/set');
      roots = set.params;
      fake.respond(set, {});
      const thread = await fake.nextRequest('thread/start');
      fake.respond(thread, { thread: { id: 'thread-1' }, model: 'gpt-test' });
      const turn = await fake.nextRequest('turn/start');
      fake.respond(turn, {
        turn: { id: 'turn-1', status: 'inProgress', error: null },
      });
      completeTurn(fake);
    });
    const handle = adapter.start(session({ skills }));
    await drain(handle);
    expect(roots).toEqual({ extraRoots: [skills.dir] });
    expect((await handle.result).exit).toBe('completed');
  });

  it('goes on when the app-server does not know the method', async () => {
    const { adapter } = adapterWith(async (fake) => {
      fake.respond(await fake.nextRequest('initialize'), { userAgent: 't' });
      const set = await fake.nextRequest('skills/extraRoots/set');
      fake.emit({
        id: set.id,
        error: { code: -32601, message: 'Method not found' },
      });
      const thread = await fake.nextRequest('thread/start');
      fake.respond(thread, { thread: { id: 'thread-1' }, model: 'gpt-test' });
      const turn = await fake.nextRequest('turn/start');
      fake.respond(turn, {
        turn: { id: 'turn-1', status: 'inProgress', error: null },
      });
      completeTurn(fake);
    });
    const handle = adapter.start(session({ skills }));
    const events = await drain(handle);
    expect(
      events.some((event) => event.content === 'skillsNotRegistered'),
    ).toBe(true);
    expect((await handle.result).exit).toBe('completed');
  });
});

describe('shell commands', () => {
  it('unwraps the shell Codex runs commands in', () => {
    expect(unwrapShell("/bin/zsh -lc 'printf hello > hello.txt'")).toBe(
      'printf hello > hello.txt',
    );
    expect(unwrapShell('/bin/zsh -lc ls')).toBe('ls');
    expect(unwrapShell(`bash -c "echo \\"hi\\" && rm -rf x"`)).toBe(
      'echo "hi" && rm -rf x',
    );
    expect(unwrapShell(`/bin/zsh -lc 'echo '"'"'q'"'"''`)).toBe("echo 'q'");
    expect(unwrapShell('git status')).toBe('git status');
    expect(unwrapShell("python -c 'print(1)'")).toBe("python -c 'print(1)'");
    expect(shellWords("a 'b")).toBeUndefined();
  });
});

describe('permissions', () => {
  it('answers file changes from the policy, per file', async () => {
    const seen: [string, unknown][] = [];
    const { adapter } = adapterWith(async (fake) => {
      await handshake(fake);
      const change = {
        type: 'fileChange',
        id: 'patch-1',
        changes: [
          { path: '/work/a.txt', kind: { type: 'add' }, diff: '' },
          { path: '/etc/hosts', kind: { type: 'update' }, diff: '' },
        ],
        status: 'inProgress',
      };
      item(fake, 'started', change);
      fake.emit({
        id: 7,
        method: 'item/fileChange/requestApproval',
        params: { threadId: 'thread-1', turnId: 'turn-1', itemId: 'patch-1' },
      });
      expect((await fake.nextAnswer(7)).result).toEqual({
        decision: 'decline',
      });
      item(fake, 'completed', { ...change, status: 'declined' });
      completeTurn(fake);
    });
    const handle = adapter.start(
      session({
        permission: async (tool, input) => {
          seen.push([tool, input]);
          return String(input.path).startsWith('/work/')
            ? 'allow'
            : { deny: 'outside the work directory' };
        },
      }),
    );
    const events = await drain(handle);
    expect(seen).toEqual([
      ['edit', { path: '/work/a.txt', kind: 'add' }],
      ['edit', { path: '/etc/hosts', kind: 'update' }],
    ]);
    expect(events.filter((e) => e.type === 'permission')).toMatchObject([
      {
        tool: 'edit',
        meta: { decision: 'deny', reason: 'outside the work directory' },
      },
    ]);
    expect(events.find((e) => e.type === 'toolResult')?.meta?.isError).toBe(
      true,
    );
    expect((await handle.result).exit).toBe('completed');
  });

  it('checks commands Codex ran without asking, and refuses sandbox widening', async () => {
    const { adapter } = adapterWith(async (fake) => {
      await handshake(fake);
      const command = {
        type: 'commandExecution',
        id: 'exec-1',
        command: "/bin/zsh -lc 'cat .acme/run.json'",
        cwd: '/work',
        status: 'completed',
        aggregatedOutput: '{}',
        exitCode: 0,
        durationMs: 1,
      };
      item(fake, 'started', { ...command, status: 'inProgress' });
      item(fake, 'completed', command);
      fake.emit({
        id: 8,
        method: 'item/permissions/requestApproval',
        params: {
          threadId: 'thread-1',
          turnId: 'turn-1',
          itemId: 'perm-1',
          reason: 'need network',
          permissions: { network: { enabled: true } },
        },
      });
      expect((await fake.nextAnswer(8)).result).toEqual({
        permissions: {},
        scope: 'turn',
      });
      fake.emit({ id: 9, method: 'item/tool/call', params: {} });
      expect((await fake.nextAnswer(9)).error?.message).toMatch(
        /Unsupported request/,
      );
      completeTurn(fake);
    });
    const handle = adapter.start(
      session({
        permission: async (_tool, input) =>
          String(input.command).includes('.acme')
            ? { deny: 'credentials' }
            : 'allow',
      }),
    );
    const events = await drain(handle);
    // The unprompted check runs after the fact, so its order is not fixed.
    const permissions = events.filter((e) => e.type === 'permission');
    expect(permissions).toHaveLength(2);
    expect(permissions.find((e) => e.tool === 'shell')).toMatchObject({
      input: { command: 'cat .acme/run.json', cwd: '/work' },
      meta: { decision: 'deny', reason: 'credentials', unprompted: true },
    });
    expect(
      permissions.find((e) => e.tool === 'requestPermissions')?.meta,
    ).toMatchObject({ decision: 'deny' });
    expect(
      events.some(
        (e) => e.type === 'error' && /without asking/.test(e.content ?? ''),
      ),
    ).toBe(true);
  });

  it('denies when the policy throws', async () => {
    const { adapter } = adapterWith(async (fake) => {
      await handshake(fake);
      fake.emit({
        id: 3,
        method: 'item/commandExecution/requestApproval',
        params: {
          threadId: 'thread-1',
          turnId: 'turn-1',
          itemId: 'exec-1',
          command: 'ls',
        },
      });
      expect((await fake.nextAnswer(3)).result).toEqual({
        decision: 'decline',
      });
      completeTurn(fake);
    });
    const handle = adapter.start(
      session({
        permission: async () => {
          throw new Error('broken');
        },
      }),
    );
    const events = await drain(handle);
    expect(events.find((e) => e.type === 'permission')?.meta).toMatchObject({
      decision: 'deny',
      reason: 'Policy error: broken',
    });
  });
});

describe('steering', () => {
  it('carries input sent before the turn starts into the first turn', async () => {
    let turnParams: Record<string, unknown> | undefined;
    const { adapter } = adapterWith(async (fake) => {
      turnParams = await handshake(fake);
      completeTurn(fake);
    });
    const handle = adapter.start(session());
    expect(await handle.steer('early', 'in-0')).toBe(true);
    const events = await drain(handle);
    expect(turnParams?.input).toEqual([
      { type: 'text', text: 'do it', text_elements: [] },
      { type: 'text', text: 'early', text_elements: [] },
    ]);
    expect(events.filter((e) => e.type === 'input')).toMatchObject([
      { content: 'early', meta: { inputId: 'in-0' } },
    ]);
    expect(await handle.steer('late')).toBe(false);
  });

  it('starts a new turn when the active turn can no longer be steered', async () => {
    let steered: Promise<boolean> | undefined;
    const { adapter } = adapterWith(async (fake) => {
      await handshake(fake);
      steered = handle.steer('more', 'in-1');
      const steer = await fake.nextRequest('turn/steer');
      expect(steer.params).toMatchObject({ expectedTurnId: 'turn-1' });
      completeTurn(fake);
      fake.emit({
        id: steer.id,
        error: { code: -32600, message: 'no active turn' },
      });
      const next = await fake.nextRequest('turn/start');
      const params = next.params as {
        input: { text: string }[];
        clientUserMessageId: string;
      };
      expect(params.input.map((i) => i.text)).toEqual(['more']);
      fake.respond(next, {
        turn: { id: 'turn-2', status: 'inProgress', error: null },
      });
      item(fake, 'completed', {
        type: 'userMessage',
        id: 'u-2',
        clientId: params.clientUserMessageId,
        content: [],
      });
      item(fake, 'completed', {
        type: 'agentMessage',
        id: 'm-2',
        text: 'all done',
      });
      completeTurn(fake, 'turn-2');
    });
    const handle = adapter.start(session());
    const events = await drain(handle);
    expect(await steered).toBe(true);
    expect(events.filter((e) => e.type === 'input')).toMatchObject([
      { content: 'more', meta: { inputId: 'in-1' } },
    ]);
    const result = await handle.result;
    expect(result.exit).toBe('completed');
    expect(result.summary).toBe('all done');
  });
});

describe('failures', () => {
  it('classifies a failed turn by its codexErrorInfo', async () => {
    const { adapter } = adapterWith(async (fake) => {
      await handshake(fake);
      completeTurn(fake, 'turn-1', 'failed', {
        message: 'You have hit your usage limit',
        codexErrorInfo: 'usageLimitExceeded',
        additionalDetails: null,
      });
    });
    const handle = adapter.start(session());
    const events = await drain(handle);
    const result = await handle.result;
    expect(result.exit).toBe('error');
    expect(result.error).toEqual({
      reason: 'toolQuota',
      message: 'You have hit your usage limit',
    });
    expect(events.at(-1)).toMatchObject({
      type: 'error',
      meta: { reason: 'toolQuota' },
    });
  });

  it('reports a crashed app-server as toolProcess with its stderr', async () => {
    const { adapter } = adapterWith(async (fake) => {
      await handshake(fake);
      fake.stderr('thread panicked: boom');
      fake.exit(101);
    });
    const handle = adapter.start(session());
    await drain(handle);
    const result = await handle.result;
    expect(result.error?.reason).toBe('toolProcess');
    expect(result.error?.message).toMatch(/code 101.*boom/);
  });

  it('reports an app-server that cannot start', async () => {
    const { adapter } = adapterWith((fake) => {
      fake.failToStart(
        Object.assign(new Error('spawn codex ENOENT'), { code: 'ENOENT' }),
      );
    });
    const handle = adapter.start(session());
    await drain(handle);
    expect((await handle.result).error?.reason).toBe('toolProcess');
  });

  it('classifies RPC errors by their text', async () => {
    const { adapter } = adapterWith(async (fake) => {
      fake.respond(await fake.nextRequest('initialize'), { userAgent: 't' });
      const start = await fake.nextRequest('thread/start');
      fake.emit({
        id: start.id,
        error: {
          code: -32000,
          message: 'Not logged in: authentication required',
        },
      });
    });
    const handle = adapter.start(session());
    await drain(handle);
    expect((await handle.result).error?.reason).toBe('toolAuth');
  });

  it('maps codexErrorInfo variants', () => {
    expect(
      classifyCodexFailure({
        codexErrorInfo: { responseStreamDisconnected: { httpStatusCode: 401 } },
        message: 'x',
      }).reason,
    ).toBe('toolAuth');
    expect(
      classifyCodexFailure({ codexErrorInfo: 'contextWindowExceeded' }).reason,
    ).toBe('contextOverflow');
    expect(
      classifyCodexFailure({
        codexErrorInfo: { httpConnectionFailed: { httpStatusCode: null } },
      }).reason,
    ).toBe('toolNetwork');
    expect(classifyCodexFailure({ message: 'odd' }).reason).toBe('unknown');
    expect(
      classifyCodexFailure({
        message:
          "The model 'gpt-6' does not exist or you do not have access to it.",
      }).reason,
    ).toBe('modelUnavailable');
  });
});

describe('stopping and resuming', () => {
  it('stops a process that ignores its input and SIGTERM within five seconds', async () => {
    let running!: () => void;
    const turnRunning = new Promise<void>((resolve) => (running = resolve));
    const { adapter, spawn } = adapterWith(async (fake) => {
      fake.exitOnEnd = false;
      fake.exitOnTerm = false;
      await handshake(fake);
      running();
    });
    const handle = adapter.start(session());
    const drained = drain(handle);
    await turnRunning;
    const started = Date.now();
    await handle.stop();
    expect(Date.now() - started).toBeLessThan(5000);
    expect(spawn.processes[0]!.signals).toContain('SIGKILL');
    expect(spawn.processes[0]!.received.at(-1)?.method).toBe('turn/interrupt');
    expect((await handle.result).exit).toBe('aborted');
    await drained;
  }, 10_000);

  it('does not start when aborted already', async () => {
    const controller = new AbortController();
    controller.abort();
    const { adapter, spawn } = adapterWith(() => {});
    const handle = adapter.start(session({ abort: controller.signal }));
    await drain(handle);
    expect((await handle.result).exit).toBe('aborted');
    expect(spawn.processes).toHaveLength(0);
  });

  it('resumes a thread and counts only this run’s usage', async () => {
    let resume: Record<string, unknown> | undefined;
    const { adapter } = adapterWith(async (fake) => {
      fake.respond(await fake.nextRequest('initialize'), { userAgent: 't' });
      const request = await fake.nextRequest('thread/resume');
      resume = request.params as Record<string, unknown>;
      fake.respond(request, { thread: { id: 'thread-1' }, model: 'gpt-test' });
      fake.respond(await fake.nextRequest('turn/start'), {
        turn: { id: 'turn-1', status: 'inProgress', error: null },
      });
      const usage = (
        input: number,
        cached: number,
        output: number,
        written = 0,
      ) => ({
        totalTokens: input + output,
        inputTokens: input,
        cachedInputTokens: cached,
        cacheWriteInputTokens: written,
        outputTokens: output,
        reasoningOutputTokens: 0,
      });
      fake.notify('thread/tokenUsage/updated', {
        threadId: 'thread-1',
        turnId: 'turn-1',
        tokenUsage: { total: usage(1000, 500, 50), last: usage(200, 100, 10) },
      });
      fake.notify('thread/tokenUsage/updated', {
        threadId: 'thread-1',
        turnId: 'turn-1',
        tokenUsage: {
          total: usage(1400, 700, 80, 50),
          last: usage(400, 200, 30, 50),
        },
      });
      completeTurn(fake);
    });
    const handle = adapter.start(
      session({ resumeSessionId: 'thread-1', model: 'gpt-test' }),
    );
    await drain(handle);
    const result = await handle.result;
    expect(resume).toMatchObject({
      threadId: 'thread-1',
      model: 'gpt-test',
      approvalPolicy: 'untrusted',
    });
    // Baseline before this run: 800 input (400 cached), 40 output. Cached input and cache writes are part of
    // OpenAI's input tokens; Usage keeps them apart.
    expect(result.usage).toEqual([
      {
        tool: 'codex',
        model: 'gpt-test',
        inputTokens: 250,
        outputTokens: 40,
        cacheReadTokens: 300,
        cacheWriteTokens: 50,
        reasoningTokens: 0,
      },
    ]);
  });
});
