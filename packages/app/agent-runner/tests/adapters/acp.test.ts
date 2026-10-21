import { existsSync, readFileSync } from 'node:fs';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, expect, it } from 'vitest';
import { createAcpAdapter } from '../../src/agent/adapters/acp.ts';
import { loadAdapters } from '../../src/agent/adapters/registry.ts';
import type {
  AdapterEvent,
  AdapterSession,
} from '../../src/agent/adapters/types.ts';
import { AGENT_TOOLS } from '../../src/protocol/index.ts';

const roots: string[] = [];
afterEach(async () => {
  await Promise.all(
    roots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
  );
});
async function fixture(variant = '') {
  const root = await mkdtemp(path.join(os.tmpdir(), 'runner-acp-'));
  roots.push(root);
  const trace = path.join(root, 'trace');
  const env = {
    PATH: process.env.PATH!,
    HOME: root,
    ACP_FIXTURE_VARIANT: variant,
    ACP_FIXTURE_TRACE: trace,
  };
  const spec = {
    id: 'gemini',
    name: 'Gemini CLI',
    launchers: [
      {
        command: path.basename(process.execPath),
        dirs: [path.dirname(process.execPath)],
        args: [path.resolve(import.meta.dirname, '../fixtures/acp-agent.mjs')],
      },
    ],
    signIn: 'gemini',
    allowAll: true,
    permissionEnv: { ACP_FIXTURE_PERMISSION_DEFAULT: 'on' },
  };
  const adapter = createAcpAdapter(spec, env);
  const session: AdapterSession = {
    workDir: root,
    env,
    prompt: 'Task input',
    systemPrompt: 'Task instructions',
    permission: async () => 'allow',
    abort: new AbortController().signal,
  };
  return {
    root,
    adapter,
    session,
    trace,
    messages: async () =>
      (await readFile(trace, 'utf8'))
        .trim()
        .split('\n')
        .map(
          (line) =>
            JSON.parse(line) as {
              method: string;
              params: Record<string, unknown>;
            },
        ),
  };
}

it('resolves native adapters first, deduplicates catalog identities and refuses unknown tools', () => {
  const adapters = loadAdapters({ PATH: '' });
  expect([...adapters.keys()]).toEqual(AGENT_TOOLS);
  expect(adapters.get('codex')!.features()).toContain('steer');
  expect(adapters.get('gemini')!.features()).not.toContain('steer');
  expect(() => loadAdapters({}, [], {}, ['unknown-agent'])).toThrow(
    'Unknown coding tool',
  );
  expect(loadAdapters({}, [], {}, [])).toEqual(new Map());
});

it.each(['', 'legacy', 'unsupported', 'auth', 'initializeAuth', 'permission'])(
  'detects %s without a prompt and distinguishes authentication from authMethods',
  async (variant) => {
    const f = await fixture(variant);
    const detected = await f.adapter.detect(new AbortController().signal);
    expect(detected).toMatchObject({
      installed: true,
      authenticated: !['auth', 'initializeAuth'].includes(variant),
      status: ['auth', 'initializeAuth'].includes(variant)
        ? 'needsLogin'
        : 'ready',
    });
    if (!variant || variant === 'legacy')
      expect(detected).toMatchObject({
        models: [
          { id: 'one', name: 'Model One' },
          { id: 'two', name: 'Model Two' },
        ],
      });
    if (variant === 'unsupported')
      expect(detected).toMatchObject({ modelsDetectionStatus: 'unsupported' });
    expect(
      (await f.messages()).find((message) => message.method === 'permissionEnv')
        ?.params.value,
    ).toBe('off');
    expect(
      (await f.messages()).some(
        (message) => message.method === 'session/prompt',
      ),
    ).toBe(false);
  },
);

it('reports a selected missing program without starting anything', async () => {
  const adapter = createAcpAdapter(
    {
      id: 'kimi',
      name: 'Kimi CLI',
      signIn: 'kimi',
      launchers: [{ command: 'missing-acp-fixture', args: [] }],
    },
    { PATH: '' },
  );
  expect(await adapter.detect()).toMatchObject({
    installed: false,
    authenticated: false,
    status: 'notInstalled',
  });
});

it.each(['', 'legacy', 'resume', 'unsupported', 'usage'])(
  'runs %s in the task directory, applies the model and suppresses load replay',
  async (variant) => {
    const f = await fixture(variant);
    const handle = f.adapter.start({
      ...f.session,
      resumeSessionId: 'fixture-session',
      ...(variant === 'unsupported' ? {} : { model: 'two' }),
    });
    const events: AdapterEvent[] = [];
    for await (const event of handle.events) events.push(event);
    expect(await handle.result).toMatchObject({
      exit: 'completed',
      sessionId: 'fixture-session',
      usage:
        variant === 'usage'
          ? [{ tool: 'gemini', model: 'two', inputTokens: 5, outputTokens: 3 }]
          : [],
    });
    const transcript = JSON.stringify(events);
    expect(transcript).toContain('Task instructions');
    expect(transcript).toContain('Task input');
    expect(transcript).toContain(`cwd=${f.root}`);
    expect(transcript).not.toContain('REPLAY MUST NOT APPEAR');
    expect(events.filter((event) => event.type === 'toolUse')).toHaveLength(1);
    expect(events.filter((event) => event.type === 'toolResult')).toHaveLength(
      1,
    );
    expect(await handle.steer('later')).toBe(false);
    const methods = (await f.messages()).map((message) => message.method);
    expect(methods).toContain(
      variant === 'resume' ? 'session/resume' : 'session/load',
    );
    if (variant === 'unsupported')
      expect(methods).not.toContain('session/set_model');
  },
);

it.each(['misapply', 'network', 'auth', 'promptAuth'])(
  'stops %s without a silent model or session fallback',
  async (variant) => {
    const f = await fixture(variant);
    const handle = f.adapter.start({
      ...f.session,
      model: 'two',
      ...(variant === 'network' ? { resumeSessionId: 'previous' } : {}),
    });
    expect(await handle.result).toMatchObject({
      exit: 'error',
      error: {
        reason:
          variant === 'misapply'
            ? 'modelUnavailable'
            : variant.includes('Auth') || variant === 'auth'
              ? 'toolAuth'
              : 'toolProcess',
      },
    });
    const methods = (await f.messages()).map((message) => message.method);
    if (variant !== 'promptAuth')
      expect(methods).not.toContain('session/prompt');
    if (variant === 'network') expect(methods).not.toContain('session/new');
  },
);

it('cancels a running turn before reaping its process', async () => {
  const f = await fixture('hang');
  const handle = f.adapter.start(f.session);
  for await (const event of handle.events) {
    if (event.type === 'text') {
      await handle.stop();
      break;
    }
  }
  expect(await handle.result).toMatchObject({ exit: 'aborted' });
  expect((await f.messages()).map((message) => message.method)).toContain(
    'session/cancel',
  );
});

it('declines permissions during detection', async () => {
  const f = await fixture('permission');
  expect(await f.adapter.detect()).toMatchObject({ authenticated: true });
  const trace = (await readFile(f.trace, 'utf8'))
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line));
  expect(
    trace.find((message) => message.id === 'permission-1').result.outcome,
  ).toEqual({ outcome: 'cancelled' });
});

it('aborts detection while the agent ignores session creation', async () => {
  const f = await fixture('hangOpen');
  const controller = new AbortController();
  const detected = f.adapter.detect(controller.signal);
  const { waitFor } = await import('../fake-server.ts');
  await waitFor(
    () =>
      existsSync(f.trace) &&
      readFileSync(f.trace, 'utf8').includes('session/new'),
    3_000,
    'inspection session request',
  );
  controller.abort();
  expect(await detected).toMatchObject({
    status: 'failed',
    authenticated: false,
  });
  expect(
    (await f.messages()).some((message) => message.method === 'session/prompt'),
  ).toBe(false);
});
