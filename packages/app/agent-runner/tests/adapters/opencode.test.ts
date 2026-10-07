import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  ASK_EVERYTHING,
  MIN_OPENCODE_VERSION,
  OpencodeAdapter,
  STOP_BUDGET_MS,
  compareVersions,
  parseModel,
  opencodeEnv,
} from '../../src/agent/adapters/opencode.ts';
import { classifyOpencodeFailure } from '../../src/agent/adapters/opencode/classify.ts';
import { parseEventStream } from '../../src/agent/adapters/opencode/client.ts';
import { ServerStartError } from '../../src/agent/adapters/opencode/server.ts';
import { loadAdapters } from '../../src/agent/adapters/registry.ts';
import type {
  AdapterEvent,
  AdapterSession,
  PermissionCheck,
} from '../../src/agent/adapters/types.ts';
import { FakeOpencode, ev } from './opencode-fake-server.ts';
import type { ScriptItem } from './opencode-fake-server.ts';

const SID = 'ses_test';
const MODEL = { id: 'm1', providerID: 'prov' };

function adapterFor(fake: FakeOpencode, version = '2.0.12'): OpencodeAdapter {
  return new OpencodeAdapter({
    launch: fake.launch,
    exec: async (_file, args) =>
      args[0] === '--version'
        ? { code: 0, stdout: `opencode v${version}\n` }
        : { code: 0, stdout: 'Provider  API key  stored\n' },
    searchPath: '',
    fallbackPaths: [process.execPath],
  });
}

function session(overrides: Partial<AdapterSession> = {}): AdapterSession {
  return {
    workDir: '/work',
    prompt: 'Do the task',
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

function begin(inbox = 'msg_in0'): ScriptItem[] {
  return [
    ev('session.inbox.enqueued', {
      sessionID: SID,
      inboxID: inbox,
      item: { type: 'user', delivery: 'steer' },
    }),
    ev('session.execution.started', { sessionID: SID }),
    ev('session.inbox.delivered', { sessionID: SID, inboxID: inbox }),
  ];
}

function step(n: number): ScriptItem[] {
  return [
    ev('session.step.started', {
      sessionID: SID,
      agent: 'build',
      model: MODEL,
      assistantMessageID: `msg_a${n}`,
    }),
  ];
}

function stepEnd(n: number, finish = 'stop'): ScriptItem {
  return ev('session.step.ended', {
    sessionID: SID,
    assistantMessageID: `msg_a${n}`,
    finish,
    cost: 0,
    tokens: {
      input: 10,
      output: 5,
      reasoning: 1,
      cache: { read: 2, write: 3 },
    },
  });
}

function text(n: number, value: string): ScriptItem {
  return ev('session.text.ended', {
    sessionID: SID,
    assistantMessageID: `msg_a${n}`,
    ordinal: 0,
    text: value,
  });
}

function toolCall(
  id: string,
  name: string,
  input: Record<string, unknown>,
): ScriptItem[] {
  return [
    ev('session.tool.input.started', {
      sessionID: SID,
      assistantMessageID: 'msg_a1',
      id,
      name,
    }),
    ev('session.tool.called', {
      sessionID: SID,
      assistantMessageID: 'msg_a1',
      id,
      input,
      executed: false,
    }),
  ];
}

function ask(
  id: string,
  toolId: string,
  action: string,
  resources: string[],
): ScriptItem {
  return ev('permission.asked', {
    id,
    sessionID: SID,
    action,
    resources,
    save: ['*'],
    source: { type: 'tool', messageID: 'msg_a1', id: toolId },
  });
}

const succeeded = ev('session.execution.succeeded', { sessionID: SID });

describe('detect', () => {
  it('reports an installed, signed-in OpenCode 2.x', async () => {
    const adapter = adapterFor(new FakeOpencode({ script: [] }));
    expect(await adapter.detect()).toEqual({
      installed: true,
      version: '2.0.12',
      path: process.execPath,
      authenticated: true,
    });
  });

  it('treats 1.x as not installed, since it serves another API', async () => {
    const detection = await adapterFor(
      new FakeOpencode({ script: [] }),
      '1.18.34',
    ).detect();
    expect(detection).toMatchObject({ installed: false, version: '1.18.34' });
    expect(detection.path).toBeUndefined();
  });

  it('reports a missing opencode and missing credentials', async () => {
    const empty = await mkdtemp(path.join(tmpdir(), 'nocobase-runner-empty-'));
    expect(
      await new OpencodeAdapter({
        searchPath: empty,
        fallbackPaths: [],
      }).detect(),
    ).toEqual({ installed: false, authenticated: false });
    const noAuth = new OpencodeAdapter({
      searchPath: '',
      fallbackPaths: [process.execPath],
      exec: async (_f, args) =>
        args[0] === '--version'
          ? { code: 0, stdout: 'opencode v2.1.0' }
          : { code: 0, stdout: '' },
    });
    expect((await noAuth.detect()).authenticated).toBe(false);
  });

  it('declares steering and compares versions', () => {
    expect(new OpencodeAdapter().features()).toEqual(['steer']);
    expect(compareVersions('2.0.12', MIN_OPENCODE_VERSION)).toBeGreaterThan(0);
    expect(compareVersions('1.99.0', MIN_OPENCODE_VERSION)).toBeLessThan(0);
  });

  it('is registered for the opencode tool kind', () => {
    expect(loadAdapters({}).get('opencode')).toBeInstanceOf(OpencodeAdapter);
  });
});

describe('skills', () => {
  it("points OpenCode's extra config directory at the run's skills folder", () => {
    expect(opencodeEnv(session())).not.toHaveProperty('OPENCODE_CONFIG_DIR');
    expect(
      opencodeEnv(
        session({
          skills: {
            root: '/work/.nocobase-runner/plugin',
            dir: '/work/.nocobase-runner/plugin/skills',
            slugs: ['a'],
          },
        }),
      ),
    ).toMatchObject({
      PATH: '/usr/bin',
      OPENCODE_CONFIG_DIR: '/work/.nocobase-runner/plugin',
    });
  });

  it("names the person's global config again, which the config directory hides", () => {
    const home = mkdtempSync(path.join(tmpdir(), 'opencode-home-'));
    try {
      mkdirSync(path.join(home, '.config', 'opencode'), { recursive: true });
      const file = path.join(home, '.config', 'opencode', 'opencode.json');
      writeFileSync(file, '{}');
      const skills = {
        root: '/work/.nocobase-runner/plugin',
        dir: '/work/.nocobase-runner/plugin/skills',
        slugs: ['a'],
      };
      expect(
        opencodeEnv(session({ env: { PATH: '/usr/bin', HOME: home }, skills })),
      ).toMatchObject({ OPENCODE_CONFIG: file });
      // A run variable wins; without skills nothing is added.
      expect(
        opencodeEnv(
          session({
            env: { HOME: home, OPENCODE_CONFIG: '/mine.json' },
            skills,
          }),
        ).OPENCODE_CONFIG,
      ).toBe('/mine.json');
      expect(opencodeEnv(session({ env: { HOME: home } }))).not.toHaveProperty(
        'OPENCODE_CONFIG',
      );
    } finally {
      rmSync(home, { recursive: true, force: true });
    }
  });
});

describe('session setup', () => {
  it('starts the server in the work directory with the run env only', async () => {
    const fake = new FakeOpencode({
      script: [...begin(), ...step(1), text(1, 'ok'), stepEnd(1), succeeded],
    });
    const handle = adapterFor(fake).start(session());
    await collect(handle.events);
    expect((await handle.result).exit).toBe('completed');
    expect(fake.launches[0]).toMatchObject({
      binary: process.execPath,
      cwd: '/work',
      env: { PATH: '/usr/bin', HOME: '/home/runner' },
    });
    expect(fake.requestsTo('POST', /^\/api\/session$/)[0].body).toEqual({
      title: 'Agent run',
      location: { directory: '/work' },
      permissions: ASK_EVERYTHING,
    });
    expect(fake.closed).toBe(true);
  });

  it('maps model and effort to a model ref with a known variant', async () => {
    const fake = new FakeOpencode({
      script: [...begin(), succeeded],
      models: [
        {
          id: 'prov/m1',
          modelID: 'm1',
          providerID: 'prov',
          variants: [{ id: 'default' }, { id: 'high' }],
        },
      ],
    });
    const handle = adapterFor(fake).start(
      session({ model: 'prov/m1', effort: 'high' }),
    );
    await collect(handle.events);
    expect(
      (
        fake.requestsTo('POST', /^\/api\/session$/)[0].body as {
          model: unknown;
        }
      ).model,
    ).toEqual({ providerID: 'prov', id: 'm1', variant: 'high' });
    expect(parseModel('a/b/c')).toEqual({ providerID: 'a', id: 'b/c' });
    expect(parseModel('plain')).toBeUndefined();
  });

  it('resumes a session: no new session, ask-everything rules restored', async () => {
    const fake = new FakeOpencode({
      script: [...begin(), succeeded],
      knownSessions: [SID],
    });
    const handle = adapterFor(fake).start(session({ resumeSessionId: SID }));
    await collect(handle.events);
    const result = await handle.result;
    expect(result.sessionId).toBe(SID);
    expect(fake.requestsTo('POST', /^\/api\/session$/)).toHaveLength(0);
    expect(
      fake.requestsTo('PATCH', /^\/api\/session\/ses_test$/)[0].body,
    ).toEqual({ permissions: ASK_EVERYTHING });
  });

  it('prepends the brief to the prompt when instructions are refused', async () => {
    const fake = new FakeOpencode({
      script: [...begin(), succeeded],
      instructionStatus: 404,
    });
    const handle = adapterFor(fake).start(session());
    await collect(handle.events);
    expect(
      (fake.requestsTo('POST', /\/prompt$/)[0].body as { text: string }).text,
    ).toBe('<instructions>\nBRIEF\n</instructions>\n\nDo the task');
  });

  it('fails as toolProcess when the server cannot start', async () => {
    const adapter = new OpencodeAdapter({
      launch: () =>
        Promise.reject(
          new ServerStartError(
            'opencode serve exited before listening (exited with code 1)',
          ),
        ),
      exec: async () => ({ code: 0, stdout: 'opencode v2.0.12' }),
      searchPath: '',
      fallbackPaths: [process.execPath],
    });
    const handle = adapter.start(session());
    const events = await collect(handle.events);
    const result = await handle.result;
    expect(result.exit).toBe('error');
    expect(result.error?.reason).toBe('toolProcess');
    expect(events.at(-1)?.type).toBe('error');
  });

  it('refuses to start without a usable opencode', async () => {
    const handle = new OpencodeAdapter({
      searchPath: '',
      fallbackPaths: [],
    }).start(session());
    await collect(handle.events);
    expect((await handle.result).error?.reason).toBe('toolProcess');
  });
});

describe('permissions', () => {
  it('rejects a denied call with the reason for the model', async () => {
    const fake = new FakeOpencode({
      script: [
        ...begin(),
        ...step(1),
        ...toolCall('call_1', 'shell', { command: 'rm -rf x' }),
        ask('per_1', 'call_1', 'shell', ['rm -rf x']),
        ev('session.tool.failed', {
          sessionID: SID,
          assistantMessageID: 'msg_a1',
          id: 'call_1',
          error: { type: 'permission.rejected', message: 'rejected' },
        }),
        stepEnd(1, 'tool-calls'),
        succeeded,
      ],
    });
    const calls: [string, unknown][] = [];
    const permission: PermissionCheck = async (tool, input) => {
      calls.push([tool, input]);
      return { deny: 'rm is not allowed' };
    };
    const handle = adapterFor(fake).start(session({ permission }));
    const events = await collect(handle.events);
    expect(calls).toEqual([['shell', { command: 'rm -rf x' }]]);
    const reply = fake.requestsTo('POST', /\/permission\/per_1\/reply$/)[0];
    expect(reply.body).toMatchObject({ decision: 'reject' });
    expect((reply.body as { message: string }).message).toContain(
      'rm is not allowed',
    );
    const denied = events.find((e) => e.type === 'permission')!;
    expect(denied).toMatchObject({
      tool: 'shell',
      input: { command: 'rm -rf x' },
      meta: {
        decision: 'deny',
        reason: 'rm is not allowed',
        toolUseId: 'call_1',
        action: 'shell',
      },
    });
    const result = events.find((e) => e.type === 'toolResult')!;
    expect(result.meta?.isError).toBe(true);
  });

  it('checks every file an edit request names, whatever the tool', async () => {
    const fake = new FakeOpencode({
      script: [
        ...begin(),
        ...step(1),
        ...toolCall('call_1', 'apply_patch', { patchText: '...' }),
        ask('per_1', 'call_1', 'edit', ['ok.txt', '../outside.txt']),
        succeeded,
      ],
    });
    const calls: [string, unknown][] = [];
    const permission: PermissionCheck = async (tool, input) => {
      calls.push([tool, input]);
      const file = (input as { path?: string }).path ?? '';
      return file.startsWith('..') ? { deny: 'outside' } : 'allow';
    };
    const handle = adapterFor(fake).start(session({ permission }));
    await collect(handle.events);
    expect(calls).toEqual([
      ['apply_patch', { patchText: '...' }],
      ['edit', { path: 'ok.txt' }],
      ['edit', { path: '../outside.txt' }],
    ]);
    expect(
      fake.requestsTo('POST', /\/permission\/per_1\/reply$/)[0].body,
    ).toMatchObject({ decision: 'reject' });
  });

  it('falls back to the action and resources for an unannounced call', async () => {
    const fake = new FakeOpencode({
      script: [...begin(), ask('per_1', 'call_x', 'shell', ['ls']), succeeded],
    });
    const calls: [string, unknown][] = [];
    const handle = adapterFor(fake).start(
      session({
        permission: async (tool, input) => {
          calls.push([tool, input]);
          return 'allow';
        },
      }),
    );
    await collect(handle.events);
    expect(calls).toEqual([['shell', { command: 'ls' }]]);
  });

  it('denies when the policy throws', async () => {
    const fake = new FakeOpencode({
      script: [...begin(), ask('per_1', 'call_x', 'read', ['a']), succeeded],
    });
    const handle = adapterFor(fake).start(
      session({
        permission: () => Promise.reject(new Error('boom')),
      }),
    );
    const events = await collect(handle.events);
    expect(events.find((e) => e.type === 'permission')?.meta).toMatchObject({
      decision: 'deny',
      reason: 'Policy error: boom',
    });
  });

  it('cancels forms the agent opens, since nobody can answer them', async () => {
    const fake = new FakeOpencode({
      script: [
        ...begin(),
        {
          type: 'form.created',
          data: { form: { id: 'frm_1', sessionID: SID, title: 'Q' } },
        },
        succeeded,
      ],
    });
    const handle = adapterFor(fake).start(session());
    const events = await collect(handle.events);
    expect(fake.requestsTo('DELETE', /\/form\/frm_1$/)).toHaveLength(1);
    expect(events.some((e) => e.content === 'formCancelled')).toBe(true);
  });
});

describe('outcomes', () => {
  it('classifies a failed execution', async () => {
    const fake = new FakeOpencode({
      script: [
        ...begin(),
        ev('session.retry.scheduled', {
          sessionID: SID,
          assistantMessageID: 'msg_a1',
          attempt: 1,
          at: 1,
          error: { type: 'provider.transport', message: 'socket hang up' },
        }),
        ev('session.execution.failed', {
          sessionID: SID,
          error: {
            type: 'provider.auth',
            message: 'Invalid API key',
            status: 401,
          },
        }),
      ],
    });
    const handle = adapterFor(fake).start(session());
    const events = await collect(handle.events);
    const result = await handle.result;
    expect(result.exit).toBe('error');
    expect(result.error).toEqual({
      reason: 'toolAuth',
      message: 'Invalid API key',
    });
    expect(events.find((e) => e.content === 'retrying')?.meta).toMatchObject({
      attempt: 1,
      errorType: 'provider.transport',
    });
    expect(events.at(-1)).toMatchObject({
      type: 'error',
      meta: { reason: 'toolAuth' },
    });
  });

  it('reports a server that dies mid-run as toolProcess', async () => {
    const fake = new FakeOpencode({ script: [...begin(), { crash: true }] });
    const handle = adapterFor(fake).start(session());
    await collect(handle.events);
    const result = await handle.result;
    expect(result.exit).toBe('error');
    expect(result.error?.reason).toBe('toolProcess');
  });

  it('interrupts and fails when the turn limit is exceeded', async () => {
    const fake = new FakeOpencode({
      script: [
        ...begin(),
        ...step(1),
        stepEnd(1, 'tool-calls'),
        ...step(2),
        ev('session.execution.interrupted', { sessionID: SID, reason: 'user' }),
      ],
    });
    const handle = adapterFor(fake).start(session({ maxTurns: 1 }));
    await collect(handle.events);
    const result = await handle.result;
    expect(fake.requestsTo('POST', /\/interrupt$/).length).toBeGreaterThan(0);
    expect(result.exit).toBe('error');
    expect(result.error?.message).toContain('maximum number of turns (1)');
    expect(result.usage[0]).toMatchObject({
      model: 'prov/m1',
      inputTokens: 10,
      cacheWriteTokens: 3,
    });
  });

  it('stop() interrupts, shuts the server down and resolves quickly', async () => {
    const fake = new FakeOpencode({
      script: [...begin(), ...step(1), { pause: true }],
    });
    const handle = adapterFor(fake).start(session());
    const events: AdapterEvent[] = [];
    const reading = (async () => {
      for await (const event of handle.events) {
        events.push(event);
        if (event.type === 'status' && event.content === 'started')
          setTimeout(() => void handle.stop(), 20);
      }
    })();
    const t0 = Date.now();
    await reading;
    const result = await handle.result;
    expect(Date.now() - t0).toBeLessThan(5000);
    expect(STOP_BUDGET_MS).toBeLessThan(5000);
    expect(result.exit).toBe('aborted');
    expect(result.error?.reason).toBe('cancelled');
    expect(fake.requestsTo('POST', /\/interrupt$/)).toHaveLength(1);
    expect(fake.closed).toBe(true);
    expect(await handle.steer('late')).toBe(false);
  });

  it('honours an abort signal that fired before start', async () => {
    const controller = new AbortController();
    controller.abort();
    const fake = new FakeOpencode({ script: [] });
    const handle = adapterFor(fake).start(
      session({ abort: controller.signal }),
    );
    await collect(handle.events);
    expect((await handle.result).exit).toBe('aborted');
    expect(fake.launches).toHaveLength(0);
  });

  it('keeps the run open for a steer queued as the turn ends', async () => {
    const fake = new FakeOpencode({
      script: [
        ...begin(),
        ...step(1),
        text(1, 'first'),
        stepEnd(1),
        ev('session.inbox.enqueued', {
          sessionID: SID,
          inboxID: 'msg_in1',
          item: { type: 'user', delivery: 'steer' },
        }),
        succeeded,
        ev('session.execution.started', { sessionID: SID }),
        ev('session.inbox.delivered', { sessionID: SID, inboxID: 'msg_in1' }),
        ...step(2),
        text(2, 'second'),
        stepEnd(2),
        succeeded,
      ],
    });
    const handle = adapterFor(fake).start(session());
    const events: AdapterEvent[] = [];
    let steered: Promise<boolean> | undefined;
    for await (const event of handle.events) {
      events.push(event);
      if (event.type === 'text' && event.content === 'first')
        steered = handle.steer('more', 'in_9');
    }
    const result = await handle.result;
    expect(await steered).toBe(true);
    expect(events.find((e) => e.type === 'input')?.meta?.inputId).toBe('in_9');
    expect(result.summary).toBe('second');
    expect(events.filter((e) => e.content === 'turnCompleted')).toHaveLength(2);
    expect(await handle.steer('after')).toBe(false);
  });
});

describe('classifyOpencodeFailure', () => {
  it.each([
    [{ errorType: 'provider.rate-limit', error: 'slow down' }, 'toolRateLimit'],
    [{ errorType: 'provider.quota', error: 'x' }, 'toolQuota'],
    [{ errorType: 'provider.transport', error: 'x' }, 'toolNetwork'],
    [{ errorType: 'provider.internal', error: 'x' }, 'toolNetwork'],
    [
      {
        errorType: 'provider.invalid-request',
        error: 'maximum context length exceeded',
      },
      'contextOverflow',
    ],
    [{ errorType: 'unknown', error: 'x', status: 429 }, 'toolRateLimit'],
    [{ errorType: 'unknown', error: 'x', status: 503 }, 'toolNetwork'],
    [{ error: 'insufficient_quota' }, 'toolQuota'],
    [{ error: 'spawn opencode ENOENT' }, 'toolProcess'],
    [{ aborted: true }, 'cancelled'],
    [
      { error: 'Model not found: anthropic/claude-nine', status: 403 },
      'modelUnavailable',
    ],
    [{ error: 'something odd' }, 'unknown'],
  ] as const)('%j -> %s', (signal, reason) => {
    expect(classifyOpencodeFailure(signal).reason).toBe(reason);
  });
});

describe('parseEventStream', () => {
  it('parses events split across chunks and skips comments', async () => {
    const enc = new TextEncoder();
    async function* body() {
      yield enc.encode(': heartbeat\r\n\r\ndata: {"type":"a","da');
      yield enc.encode('ta":{"x":1}}\n\ndata: not json\n\n');
      yield enc.encode('data: {"id":"e2","type":"b"}\n\n');
    }
    const out = [];
    for await (const event of parseEventStream(body())) out.push(event);
    expect(out).toEqual([
      { type: 'a', data: { x: 1 } },
      { id: 'e2', type: 'b', data: {} },
    ]);
  });
});
