import { chmod, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ClaudeAdapter,
  DEFAULT_MIN_CLAUDE_VERSION,
  compareVersions,
  denialMessage,
} from '../../src/agent/adapters/claude.ts';
import type {
  AdapterEvent,
  AdapterSession,
  PermissionCheck,
} from '../../src/agent/adapters/types.ts';
import { calls, replay, setScript } from './fake-sdk.ts';
import { SESSION_ID, assistant, init, result, toolResult } from './messages.ts';

vi.mock('@anthropic-ai/claude-agent-sdk', async () => ({
  query: (await import('./fake-sdk.ts')).fakeQuery,
}));

async function fakeClaudeDir(): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), 'nocobase-runner-claude-'));
  const bin = path.join(dir, 'claude');
  await writeFile(bin, '#!/bin/sh\n');
  await chmod(bin, 0o755);
  return dir;
}

function adapterWith(
  version: string | undefined,
  dir: string,
  loggedIn = true,
) {
  return new ClaudeAdapter({
    searchPath: dir,
    exec: async (_file, args) => {
      if (args[0] === '--version')
        return version
          ? { code: 0, stdout: `${version} (Claude Code)\n` }
          : { code: 1, stdout: '' };
      return { code: loggedIn ? 0 : 1, stdout: JSON.stringify({ loggedIn }) };
    },
  });
}

function session(overrides: Partial<AdapterSession> = {}): AdapterSession {
  return {
    workDir: '/work',
    prompt: 'Create hello.txt',
    systemPrompt: 'BRIEF',
    env: { PATH: '/usr/bin', HOME: '/home/runner' },
    permission: async () => 'allow',
    abort: new AbortController().signal,
    ...overrides,
  };
}

async function collect(
  events: AsyncIterable<AdapterEvent>,
): Promise<AdapterEvent[]> {
  const out: AdapterEvent[] = [];
  for await (const event of events) out.push(event);
  return out;
}

let dir: string;
beforeEach(async () => {
  calls.length = 0;
  dir = await fakeClaudeDir();
});

describe('detect and executable', () => {
  it('uses the claude on PATH, by its absolute path, with its version', async () => {
    const adapter = adapterWith('9.0.0', dir);
    expect(await adapter.detect()).toEqual({
      installed: true,
      version: '9.0.0',
      path: path.join(dir, 'claude'),
      authenticated: true,
    });
    expect(await adapter.resolveExecutable()).toEqual({
      path: path.join(dir, 'claude'),
      version: '9.0.0',
    });
  });

  it('skips relative PATH entries', async () => {
    const adapter = new ClaudeAdapter({
      searchPath: ['relative/bin', dir].join(path.delimiter),
      exec: async (_file, args) =>
        args[0] === '--version'
          ? { code: 0, stdout: '9.0.0 (Claude Code)\n' }
          : { code: 0, stdout: '{"loggedIn":true}' },
    });
    const detected = await adapter.detect();
    expect(detected.path).toBe(path.join(dir, 'claude'));
    expect(path.isAbsolute(detected.path!)).toBe(true);
  });

  it('reports a claude older than the minimum as not installed, with its version', async () => {
    const adapter = adapterWith('1.0.0', dir);
    expect(await adapter.detect()).toMatchObject({
      installed: false,
      version: '1.0.0',
    });
    expect(await adapter.resolveExecutable()).toBeUndefined();
  });

  it('reports a missing claude and the login state', async () => {
    const empty = await mkdtemp(path.join(tmpdir(), 'nocobase-runner-empty-'));
    const missing = await adapterWith('9.0.0', empty).detect();
    expect(missing).toEqual({ installed: false, authenticated: false });
    expect(
      (await adapterWith('9.0.0', dir, false).detect()).authenticated,
    ).toBe(false);
  });

  it('compares versions numerically', () => {
    expect(compareVersions('2.1.10', '2.1.9')).toBeGreaterThan(0);
    expect(
      compareVersions(DEFAULT_MIN_CLAUDE_VERSION, DEFAULT_MIN_CLAUDE_VERSION),
    ).toBe(0);
  });

  it('declares steering', () => {
    expect(new ClaudeAdapter().features()).toEqual(['steer']);
  });
});

describe('query options', () => {
  it('passes the brief, settings, permission mode, env and executable', async () => {
    setScript(replay([init(), result()]));
    const handle = adapterWith('9.0.0', dir).start(
      session({
        model: 'opus',
        effort: 'high',
        maxTurns: 30,
        resumeSessionId: 'prev',
      }),
    );
    await collect(handle.events);
    const options = calls[0]!.options;
    expect(options.systemPrompt).toEqual({
      type: 'preset',
      preset: 'claude_code',
      append: 'BRIEF',
    });
    expect(options.settingSources).toEqual(['project']);
    expect(options.permissionMode).toBe('acceptEdits');
    expect(options.env).toEqual({ PATH: '/usr/bin', HOME: '/home/runner' });
    expect(options.cwd).toBe('/work');
    expect(options.pathToClaudeCodeExecutable).toBe(path.join(dir, 'claude'));
    expect(options).toMatchObject({
      model: 'opus',
      effort: 'high',
      maxTurns: 30,
      resume: 'prev',
    });
    expect(options.abortController).toBeInstanceOf(AbortController);
    expect(options.canUseTool).toBeTypeOf('function');
    expect(options.hooks?.PreToolUse).toHaveLength(1);
  });

  it('fails a run without a usable claude, without calling the SDK', async () => {
    const empty = await mkdtemp(path.join(tmpdir(), 'nocobase-runner-empty-'));
    const handle = adapterWith('9.0.0', empty).start(session());
    const outcome = await handle.result;
    expect(outcome.error?.message).toContain('is not installed on this runner');
    expect(calls).toHaveLength(0);
  });

  it('omits unknown efforts', async () => {
    setScript(replay([init(), result()]));
    const handle = adapterWith('9.0.0', dir).start(
      session({ effort: 'extreme' }),
    );
    await handle.result;
    const options = calls[0]!.options;
    expect(options).not.toHaveProperty('effort');
    expect(options).not.toHaveProperty('resume');
    expect(options).not.toHaveProperty('plugins');
  });

  it("loads the run's skills folder as a local plugin", async () => {
    setScript(replay([init(), result()]));
    const handle = adapterWith('9.0.0', dir).start(
      session({
        skills: {
          root: '/work/.nocobase-runner/plugin',
          dir: '/work/.nocobase-runner/plugin/skills',
          slugs: ['pr-etiquette'],
        },
      }),
    );
    await handle.result;
    expect(calls[0]!.options.plugins).toEqual([
      { type: 'local', path: '/work/.nocobase-runner/plugin' },
    ]);
  });
});

describe('message mapping', () => {
  it('maps a replayed run to events and a result', async () => {
    setScript(
      replay([
        init(),
        assistant([{ type: 'thinking', thinking: 'Plan it', signature: 'x' }]),
        assistant([{ type: 'text', text: 'Creating the file.' }]),
        assistant([
          {
            type: 'tool_use',
            id: 'toolu_1',
            name: 'Write',
            input: { file_path: '/work/hello.txt', content: 'hi' },
          },
        ]),
        toolResult('toolu_1', [{ type: 'text', text: 'File created' }]),
        result({ result: 'Created hello.txt' }),
      ]),
    );
    const handle = adapterWith('9.0.0', dir).start(session());
    const events = await collect(handle.events);
    expect(events.map((e) => [e.type, e.content ?? e.tool ?? null])).toEqual([
      ['status', 'started'],
      ['thinking', 'Plan it'],
      ['text', 'Creating the file.'],
      ['toolUse', 'Write'],
      ['toolResult', 'Write'],
      ['status', 'turnCompleted'],
      ['usage', null],
    ]);
    expect(events[4]).toMatchObject({
      output: 'File created',
      meta: { toolUseId: 'toolu_1', isError: false },
    });
    expect(events.every((e) => typeof e.at === 'string')).toBe(true);
    expect(await handle.result).toEqual({
      exit: 'completed',
      sessionId: SESSION_ID,
      summary: 'Created hello.txt',
      usage: [
        {
          tool: 'claude',
          model: 'claude-test-1',
          inputTokens: 10,
          outputTokens: 5,
          cacheReadTokens: 100,
          cacheWriteTokens: 20,
        },
      ],
    });
  });

  it('truncates large outputs to 64 KB', async () => {
    const big = 'x'.repeat(70 * 1024);
    setScript(
      replay([
        init(),
        assistant([
          { type: 'tool_use', id: 't', name: 'Bash', input: { command: big } },
        ]),
        toolResult('t', big),
        result(),
      ]),
    );
    const events = await collect(
      adapterWith('9.0.0', dir).start(session()).events,
    );
    const use = events.find((e) => e.type === 'toolUse')!;
    const res = events.find((e) => e.type === 'toolResult')!;
    expect(use.meta).toMatchObject({ truncated: true });
    expect(res.output!.length).toBe(64 * 1024);
    expect(res.meta).toMatchObject({ truncated: true });
  });

  it('sums turn usage for a resumed session', async () => {
    setScript(async function* (ctx) {
      await ctx.nextInput();
      yield init();
      yield result({
        usage: {
          input_tokens: 3,
          output_tokens: 4,
          cache_read_input_tokens: 0,
          cache_creation_input_tokens: 0,
        },
      });
    });
    const res = await adapterWith('9.0.0', dir).start(
      session({ resumeSessionId: 'prev' }),
    ).result;
    expect(res.usage).toEqual([
      {
        tool: 'claude',
        model: 'claude-test-1',
        inputTokens: 3,
        outputTokens: 4,
        cacheReadTokens: 0,
        cacheWriteTokens: 0,
      },
    ]);
  });
});

describe('failures', () => {
  it('classifies an error result', async () => {
    setScript(
      replay([
        init(),
        assistant([{ type: 'text', text: 'Rate limited' }], {
          error: 'rate_limit',
        }),
        result({
          subtype: 'error_during_execution',
          is_error: true,
          errors: ['API Error: 429'],
        }),
      ]),
    );
    const handle = adapterWith('9.0.0', dir).start(session());
    const events = await collect(handle.events);
    const res = await handle.result;
    expect(res.exit).toBe('error');
    expect(res.error?.reason).toBe('toolRateLimit');
    expect(events.at(-1)).toMatchObject({
      type: 'error',
      meta: { reason: 'toolRateLimit' },
    });
  });

  it('classifies a failed success result', async () => {
    setScript(
      replay([
        init(),
        result({
          is_error: true,
          result: 'Prompt is too long',
          terminal_reason: 'prompt_too_long',
        }),
      ]),
    );
    const res = await adapterWith('9.0.0', dir).start(session()).result;
    expect(res.error?.reason).toBe('contextOverflow');
  });

  it('classifies a thrown process error', async () => {
    // eslint-disable-next-line require-yield -- the process fails before it says anything
    setScript(async function* () {
      throw new Error('spawn /nope/claude ENOENT');
    });
    const res = await adapterWith('9.0.0', dir).start(session()).result;
    expect(res).toMatchObject({
      exit: 'error',
      error: { reason: 'toolProcess' },
    });
  });

  it('reports a missing result', async () => {
    setScript(replay([init()]));
    const res = await adapterWith('9.0.0', dir).start(session()).result;
    expect(res).toMatchObject({
      exit: 'error',
      error: { reason: 'toolProcess' },
      sessionId: SESSION_ID,
    });
  });
});

describe('permissions', () => {
  async function runWithTool(
    permission: PermissionCheck,
    tool = 'Bash',
    input: Record<string, unknown> = { command: 'rm -rf /' },
  ) {
    const verdicts: string[] = [];
    setScript(async function* (ctx) {
      await ctx.nextInput();
      yield init();
      yield assistant([{ type: 'tool_use', id: 'toolu_9', name: tool, input }]);
      verdicts.push(await ctx.callTool(tool, input, 'toolu_9'));
      yield result();
    });
    const handle = adapterWith('9.0.0', dir).start(session({ permission }));
    const events = await collect(handle.events);
    return {
      verdicts,
      permissionEvents: events.filter((e) => e.type === 'permission'),
    };
  }

  it('the hook hands a policy denial to canUseTool, even when rules would allow it', async () => {
    setScript(replay([init(), result()]));
    adapterWith('9.0.0', dir).start(
      session({ permission: async () => ({ deny: 'nope' }) }),
    );
    await vi.waitFor(() => expect(calls).toHaveLength(1));
    const hook = calls[0]!.options.hooks!.PreToolUse![0]!.hooks[0]!;
    const out = await hook(
      {
        hook_event_name: 'PreToolUse',
        tool_name: 'Bash',
        tool_input: { command: 'rm x' },
        tool_use_id: 'h1',
        session_id: 's',
        transcript_path: '',
        cwd: '/work',
      },
      'h1',
      { signal: new AbortController().signal },
    );
    expect(out).toEqual({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'ask',
        permissionDecisionReason: 'nope',
      },
    });
  });

  it('denies through the hook and records the reason', async () => {
    const permission = vi.fn<PermissionCheck>(async () => ({
      deny: 'rm is not on the allow list',
    }));
    const { verdicts, permissionEvents } = await runWithTool(permission);
    expect(verdicts).toEqual(['deny']);
    expect(permission).toHaveBeenCalledTimes(1);
    expect(permissionEvents).toHaveLength(1);
    expect(permissionEvents[0]).toMatchObject({
      tool: 'Bash',
      input: { command: 'rm -rf /' },
      meta: {
        decision: 'deny',
        reason: 'rm is not on the allow list',
        toolUseId: 'toolu_9',
      },
    });
  });

  it('allows once through hook and canUseTool, consulting the policy once', async () => {
    const permission = vi.fn<PermissionCheck>(async () => 'allow');
    const { verdicts, permissionEvents } = await runWithTool(
      permission,
      'Bash',
      { command: 'git status' },
    );
    expect(verdicts).toEqual(['allow']);
    expect(permission).toHaveBeenCalledTimes(1);
    expect(permission).toHaveBeenCalledWith('Bash', { command: 'git status' });
    expect(permissionEvents).toHaveLength(1);
    expect(permissionEvents[0]!.meta).toMatchObject({ decision: 'allow' });
  });

  it('turns a bare deny and a policy error into denials', async () => {
    expect(
      (await runWithTool(async () => 'deny')).permissionEvents[0]!.meta,
    ).toMatchObject({
      decision: 'deny',
      reason: 'Denied by the runner policy',
    });
    const failing = await runWithTool(async () => {
      throw new Error('boom');
    });
    expect(failing.verdicts).toEqual(['deny']);
    expect(failing.permissionEvents[0]!.meta).toMatchObject({
      reason: 'Policy error: boom',
    });
  });

  it('answers canUseTool with the SDK permission result shape', async () => {
    setScript(replay([init(), result()]));
    adapterWith('9.0.0', dir).start(
      session({
        permission: async (tool) =>
          tool === 'Bash' ? { deny: 'no' } : 'allow',
      }),
    );
    await vi.waitFor(() => expect(calls).toHaveLength(1));
    const canUseTool = calls[0]!.options.canUseTool!;
    const opts = {
      signal: new AbortController().signal,
      toolUseID: 'a',
      requestId: 'r',
    };
    expect(await canUseTool('Bash', { command: 'x' }, opts)).toEqual({
      behavior: 'deny',
      message: denialMessage('no'),
    });
    expect(denialMessage('no')).toContain('do not ask for permission');
    expect(
      await canUseTool('Edit', { file_path: 'y' }, { ...opts, toolUseID: 'b' }),
    ).toEqual({
      behavior: 'allow',
      updatedInput: { file_path: 'y' },
    });
  });

  it('records denials Claude Code made itself', async () => {
    setScript(
      replay([
        init(),
        {
          type: 'system',
          subtype: 'permission_denied',
          tool_name: 'Bash',
          tool_use_id: 'toolu_x',
          decision_reason: 'deny rule',
          message: 'denied',
          uuid: 'u',
          session_id: SESSION_ID,
        } as never,
        result(),
      ]),
    );
    const events = await collect(
      adapterWith('9.0.0', dir).start(session()).events,
    );
    expect(events.filter((e) => e.type === 'permission')).toMatchObject([
      { tool: 'Bash', meta: { decision: 'deny', reason: 'deny rule' } },
    ]);
  });
});

describe('steering', () => {
  it('delivers a steer into the running turn and ends after it is consumed', async () => {
    const seen: string[] = [];
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    setScript(async function* (ctx) {
      const first = await ctx.nextInput();
      seen.push(String(first!.message.content));
      yield init();
      yield assistant([
        { type: 'tool_use', id: 't1', name: 'Bash', input: { command: 'ls' } },
      ]);
      await gate;
      const steer = await ctx.nextInput();
      seen.push(String(steer!.message.content));
      yield toolResult('t1', 'ok');
      yield assistant([{ type: 'text', text: 'Noted.' }], {
        user_message_uuid: steer!.uuid,
        user_message_uuids: [steer!.uuid],
      });
      yield result({ queued_turn_count: 0 });
      seen.push(
        (await ctx.nextInput()) === undefined ? 'input closed' : 'more input',
      );
    });
    const handle = adapterWith('9.0.0', dir).start(session());
    const eventsPromise = collect(handle.events);
    await vi.waitFor(() => expect(calls).toHaveLength(1));
    expect(await handle.steer('Also add a README', 'input-1')).toBe(true);
    release();
    const events = await eventsPromise;
    expect(seen).toEqual([
      'Create hello.txt',
      'Also add a README',
      'input closed',
    ]);
    expect(events.filter((e) => e.type === 'input')).toEqual([
      expect.objectContaining({
        content: 'Also add a README',
        meta: { inputId: 'input-1' },
      }),
    ]);
    expect((await handle.result).exit).toBe('completed');
    expect(await handle.steer('too late')).toBe(false);
  });

  it('keeps the session open for a steer that arrives as the turn ends', async () => {
    let afterFirstResult!: () => void;
    const firstResultSeen = new Promise<void>(
      (resolve) => (afterFirstResult = resolve),
    );
    const turns: string[] = [];
    setScript(async function* (ctx) {
      turns.push(String((await ctx.nextInput())!.message.content));
      yield init();
      await firstResultSeen;
      yield result({ queued_turn_count: 0 });
      const next = await ctx.nextInput();
      if (!next) return;
      turns.push(String(next.message.content));
      yield assistant([{ type: 'text', text: 'ok' }], {
        user_message_uuid: next.uuid,
        user_message_uuids: [next.uuid],
      });
      yield result({ result: 'second' });
    });
    const handle = adapterWith('9.0.0', dir).start(session());
    const eventsPromise = collect(handle.events);
    await vi.waitFor(() => expect(calls).toHaveLength(1));
    expect(await handle.steer('late comment')).toBe(true);
    afterFirstResult();
    await eventsPromise;
    expect(turns).toEqual(['Create hello.txt', 'late comment']);
    expect((await handle.result).summary).toBe('second');
  });
});

describe('stopping', () => {
  function hangingScript() {
    setScript(async function* (ctx) {
      await ctx.nextInput();
      yield init();
      await new Promise(() => {});
    });
  }

  it('stop() aborts the query and reports a cancelled run', async () => {
    hangingScript();
    const handle = adapterWith('9.0.0', dir).start(session());
    const eventsPromise = collect(handle.events);
    await vi.waitFor(() => expect(calls).toHaveLength(1));
    await handle.stop();
    expect(calls[0]!.options.abortController!.signal.aborted).toBe(true);
    expect(await handle.result).toMatchObject({
      exit: 'aborted',
      error: { reason: 'cancelled' },
      sessionId: SESSION_ID,
    });
    expect((await eventsPromise).at(-1)).toMatchObject({
      type: 'error',
      meta: { reason: 'cancelled' },
    });
    expect(await handle.steer('x')).toBe(false);
  });

  it('the session abort signal stops the run', async () => {
    hangingScript();
    const controller = new AbortController();
    const handle = adapterWith('9.0.0', dir).start(
      session({ abort: controller.signal }),
    );
    await vi.waitFor(() => expect(calls).toHaveLength(1));
    controller.abort();
    expect((await handle.result).exit).toBe('aborted');
  });

  it('an already aborted signal never starts claude', async () => {
    const controller = new AbortController();
    controller.abort();
    const res = await adapterWith('9.0.0', dir).start(
      session({ abort: controller.signal }),
    ).result;
    expect(res.exit).toBe('aborted');
    expect(calls).toHaveLength(0);
  });
});
