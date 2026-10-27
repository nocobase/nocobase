import { chmod, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, expect, it, vi } from 'vitest';
import type { AuthorizationContext } from '@nocobase/authorization/core';
import { claim, createHarness, type Harness } from './harness.js';
import { chatMessageSegments } from '../client/chat/message-model.js';
import { RunWorker } from '../../../app/agent-runner/src/agent/worker.ts';
import { ClaudeAdapter } from '../../../app/agent-runner/src/agent/adapters/claude.ts';
import { CodexAdapter } from '../../../app/agent-runner/src/agent/adapters/codex.ts';
import type {
  AgentAdapter,
  AdapterEvent,
  AdapterResult,
} from '../../../app/agent-runner/src/agent/adapters/types.ts';
import { Channel } from '../../../app/agent-runner/src/agent/adapters/codex/util.ts';
import { ApiClient } from '../../../app/agent-runner/src/lib/http.ts';
import { runnerPaths } from '../../../app/agent-runner/src/lib/home.ts';
import { HEADERS, PROTOCOL_VERSION } from '@nocobase/agent-protocol';
import { fakeSpawn } from '../../../app/agent-runner/tests/adapters/fake-codex.ts';
import { setScript } from '../../../app/agent-runner/tests/adapters/fake-sdk.ts';
import {
  assistant,
  init,
} from '../../../app/agent-runner/tests/adapters/messages.ts';

vi.mock(
  '../../../app/agent-runner/node_modules/@anthropic-ai/claude-agent-sdk',
  async (importOriginal) => ({
    ...(await importOriginal<Record<string, unknown>>()),
    query: (
      await import('../../../app/agent-runner/tests/adapters/fake-sdk.ts')
    ).fakeQuery,
  }),
);
// No native credentials or global tool settings are needed by the protocol fixtures.
vi.mock('../../../app/agent-runner/src/agent/codex-home.ts', () => ({
  prepareCodexHome: async (dir: string) => {
    await mkdir(dir, { recursive: true });
    return dir;
  },
}));

let h: Harness;
let root: string;
let worker: RunWorker | undefined;
let running: Promise<unknown> | undefined;
afterEach(async () => {
  worker?.end({ kind: 'cancel' });
  await running;
  await h?.services.onlineAgent.shutdown();
  await h?.close();
  if (root) await rm(root, { recursive: true, force: true });
  worker = undefined;
  running = undefined;
});

const context = {
  user: { id: 'alice' },
  credentials: { kind: 'test-session', userId: 'alice' },
  authorization: {
    identity: { principal: { type: 'user', id: 'alice' } },
  } as AuthorizationContext,
};
const body = 'Partial **reply**\n\n```ts\nconst 中文 = 1;\n';
const completed = 'Completed opening';

async function fixture(
  createAdapter: (bin: string) => AgentAdapter,
  grace = 5_000,
) {
  h = await createHarness();
  root = await mkdtemp(path.join(tmpdir(), 'worker-cancel-history-'));
  const bin = path.join(root, 'bin');
  await mkdir(bin);
  for (const name of ['claude', 'codex']) {
    await writeFile(path.join(bin, name), '#!/bin/sh\n');
    await chmod(path.join(bin, name), 0o755);
  }
  const adapter = createAdapter(bin);
  const cli = path.join(root, 'appcli.mjs');
  await writeFile(cli, 'process.stdout.write("test CLI\\n");\n');
  const runner = await h.registerRunner({
    features: [
      'workspaceKey',
      'input',
      'checkout',
      'directories',
      'attachments',
      'skills',
      'secrets',
      'outputBlocks',
    ],
    tools: [{ kind: adapter.kind, authenticated: true }],
  });
  const agentId = await h.createAgent({
    source: 'runner',
    modelEntries: [{ tool: adapter.kind, model: null }],
  });
  const agent = await h.services.onlineAgent.realtime(context, { agentId });
  await agent.send([{ role: 'user', content: 'Write a long reply' }]);
  const [payload] = await claim(h, runner);
  expect(payload.outputBlocks).toBe(true);
  const registration = {
    key: 'test-app',
    app: payload.app,
    server: 'http://agents.test',
    runnerId: runner.runnerId,
    heartbeatIntervalMs: 60_000,
    pollTimeoutMs: 200,
    variables: {},
    cli: { [payload.cli.name]: cli },
    registeredAt: new Date().toISOString(),
    enabledTools: [adapter.kind],
  };
  const requests: string[] = [];
  const client = new ApiClient({
    server: registration.server,
    headers: {
      [HEADERS.runnerKey]: runner.key,
      [HEADERS.protocol]: String(PROTOCOL_VERSION),
    },
    fetch: async (input, options) => {
      const url = new URL(String(input));
      url.pathname = url.pathname.replace(/^\/api/u, '');
      requests.push(url.pathname);
      return h.app.fetch(new Request(url, options));
    },
  });
  const logs: string[] = [];
  worker = new RunWorker(
    payload,
    { killGraceMs: grace, eventFlushMs: 10, reportTimeoutMs: 2_000 },
    {
      paths: runnerPaths(path.join(root, 'home'), path.join(root, 'work')),
      connection: { registration, runnerKey: runner.key },
      settings: {
        name: 'test-runner',
        agentTools: 'system',
        autoUpdate: false,
      },
      adapters: new Map([[adapter.kind, adapter]]),
      client,
      log: (message) => logs.push(message),
    },
    {
      runId: payload.run.id,
      appKey: registration.key,
      attempt: payload.run.attempt,
      firstSeq: payload.run.firstSeq,
      pid: process.pid,
      startedAt: new Date().toISOString(),
      phase: 'spawned',
      log: path.join(root, 'worker.log'),
    },
  );
  return { agent, agentId, payload, client, bin, requests, logs };
}

it.each(['codex', 'claude'] as const)(
  'keeps %s partial output through worker cancellation, event storage and reloaded history',
  async (tool) => {
    // The real adapters consume native-shaped protocol traffic; only the model transport is scripted.
    let createAdapter: (bin: string) => AgentAdapter;
    if (tool === 'codex') {
      const spawn = fakeSpawn(async (fake) => {
        fake.respond(await fake.nextRequest('initialize'), {});
        fake.respond(await fake.nextRequest('thread/start'), {
          thread: { id: 'thread-1' },
          model: 'test',
        });
        fake.respond(await fake.nextRequest('turn/start'), {
          turn: { id: 'turn-1', status: 'inProgress', error: null },
        });
        fake.notify('turn/started', {
          threadId: 'thread-1',
          turn: { id: 'turn-1', status: 'inProgress', error: null },
        });
        fake.notify('item/completed', {
          threadId: 'thread-1',
          turnId: 'turn-1',
          item: { id: 'opening', type: 'agentMessage', text: completed },
        });
        fake.notify('item/agentMessage/delta', {
          threadId: 'thread-1',
          turnId: 'turn-1',
          itemId: 'partial',
          delta: body,
        });
        const interrupt = await fake.nextRequest('turn/interrupt');
        fake.respond(interrupt, {});
        fake.notify('turn/completed', {
          threadId: 'thread-1',
          turn: { id: 'turn-1', status: 'interrupted', error: null },
        });
      });
      // Detection remains real; point it at the executable prepared by fixture below.
      createAdapter = (bin) =>
        new CodexAdapter({
          spawn,
          searchPath: bin,
          exec: async () => ({ code: 0, stdout: 'codex-cli 0.158.0' }),
        });
    } else {
      setScript(async function* (ctx) {
        await ctx.nextInput();
        yield init();
        const partial = (event: unknown) =>
          ({
            type: 'stream_event',
            event,
            session_id: 'test-session',
            parent_tool_use_id: null,
            uuid: 'test',
          }) as never;
        yield partial({ type: 'message_start', message: { id: 'msg_1' } });
        yield partial({
          type: 'content_block_start',
          index: 0,
          content_block: { type: 'text', text: completed },
        });
        yield partial({ type: 'content_block_stop', index: 0 });
        const snapshot = assistant([{ type: 'text', text: completed }]);
        yield snapshot;
        yield snapshot;
        yield partial({
          type: 'content_block_start',
          index: 7,
          content_block: { type: 'text', text: '' },
        });
        yield partial({
          type: 'content_block_delta',
          index: 7,
          delta: { type: 'text_delta', text: body },
        });
        await ctx.aborted;
        await new Promise(() => {});
      });
      createAdapter = (bin) =>
        new ClaudeAdapter({
          searchPath: bin,
          exec: async () => ({ code: 0, stdout: '9.0.0 (Claude Code)' }),
        });
    }
    const f = await fixture(createAdapter);
    const chunks: { type: string; delta?: string }[] = [];
    let previewSeen!: () => void;
    const preview = new Promise<void>((resolve) => {
      previewSeen = resolve;
    });
    const reader = (await f.agent.receive())!.getReader();
    const reading = (async () => {
      for (;;) {
        const next = await reader.read();
        if (next.done) return;
        chunks.push(next.value as never);
        if (
          chunks
            .filter((c) => c.type === 'text-delta')
            .map((c) => c.delta)
            .join('')
            .includes(body)
        )
          previewSeen();
      }
    })();
    running = worker!.run();
    await preview;
    await f.agent.abort();
    await worker!.pollStatus();
    expect(await running).toBe('cancelled');
    await reading;
    expect(
      chunks
        .filter((c) => c.type === 'text-delta')
        .map((c) => c.delta)
        .join(''),
    ).toBe(completed + body);
    expect(chunks.filter((c) => c.type === 'text-end')).toHaveLength(2);
    const events = (
      await h.services.runs.events(f.payload.run.id, 0, 100)
    ).events.filter((e) => e.type === 'text');
    expect(events.map((e) => e.content)).toEqual([completed, body]);
    expect(events.map((e) => e.meta?.output)).toEqual([
      { blockId: expect.any(String), phase: 'end' },
      { blockId: expect.any(String), phase: 'end' },
    ]);
    expect(events[1].meta?.truncated).toBe(true);
    const reloaded = await h.services.onlineAgent.realtime(context, {
      sessionId: f.agent.sessionId,
    });
    const history = await reloaded.history();
    const answers = chatMessageSegments(history).filter(
      (segment) => segment.message.role === 'assistant',
    );
    const segments = chatMessageSegments(history);
    const logical = history.filter((message) => message.role === 'assistant');
    expect(logical).toHaveLength(1);
    expect(answers).toHaveLength(2);
    expect(answers.every((segment) => segment.message === logical[0])).toBe(
      true,
    );
    // Stop is saved before the worker's truncated body, so it divides this response.
    expect(
      segments
        .filter((segment) => segment.message.role !== 'user')
        .map((segment) => segment.message.role),
    ).toEqual(['assistant', 'system', 'assistant']);
    const stopped = segments.find(
      (segment) => segment.message.role === 'system',
    )!;
    expect(stopped.message.parts).toMatchObject([
      {
        type: 'data-business',
        data: { kind: 'runCancelled', payload: { runId: f.payload.run.id } },
      },
    ]);
    expect(answers[0].seq).toBeLessThan(stopped.seq!);
    expect(stopped.seq).toBeLessThan(answers[1].seq!);
    expect(answers.map((segment) => segment.partIndexes)).toEqual([
      [0],
      [1, 2],
    ]);
    expect(answers.flatMap((segment) => segment.partIndexes)).toEqual([
      0, 1, 2,
    ]);
    expect(
      answers
        .flatMap((segment) =>
          segment.partIndexes.map((index) => segment.message.parts[index]),
        )
        .filter((part) => part.type === 'data-turn'),
    ).toEqual([
      expect.objectContaining({
        type: 'data-turn',
        data: expect.objectContaining({ outcome: 'cancelled' }),
      }),
    ]);
    const savedPage = await reloaded.messages!({ limit: 1 });
    expect(
      chatMessageSegments(savedPage.items).filter(
        (segment) => segment.message.role === 'assistant',
      ),
    ).toEqual(answers);
    expect(
      history
        .filter((m) => m.role === 'assistant')
        .flatMap((m) =>
          m.parts.filter((p) => p.type === 'text').map((p) => p.text),
        ),
    ).toEqual([completed, body]);
    expect((await h.services.runs.get(f.payload.run.id)).status).toBe(
      'cancelled',
    );
    expect(f.requests.filter((p) => p.endsWith('/cancelAck'))).toHaveLength(1);
  },
);

it.each(['stop', 'result', 'events'] as const)(
  'bounds a stuck %s during cancellation and ignores events after the deadline',
  async (stuck) => {
    const events = new Channel<AdapterEvent>();
    let resolveResult!: (result: AdapterResult) => void;
    const result = new Promise<AdapterResult>((resolve) => {
      resolveResult = resolve;
    });
    let started!: () => void;
    const ready = new Promise<void>((resolve) => {
      started = resolve;
    });
    let released!: () => void;
    const release = new Promise<void>((resolve) => {
      released = resolve;
    });
    let stopped!: () => void;
    const stopping = new Promise<void>((resolve) => {
      stopped = resolve;
    });
    const stop = vi.fn(async () => {
      stopped();
      if (stuck === 'stop') await release;
      if (stuck !== 'result') resolveResult({ exit: 'aborted', usage: [] });
      if (stuck !== 'events') events.close();
    });
    const adapter: AgentAdapter = {
      kind: 'claude',
      features: () => [],
      detect: async () => ({ installed: true, authenticated: true }),
      start() {
        started();
        return { events, result, stop, steer: async () => false };
      },
    };
    const f = await fixture(() => adapter, 25);
    running = worker!.run();
    await ready;
    // Observe the actual deadline firing, without a timing-sensitive wall-clock assertion or test sleep.
    const deadline = new Promise<void>((resolve) => {
      const log = worker!['deps'].log;
      vi.spyOn(worker!['deps'], 'log').mockImplementation((message) => {
        log(message);
        if (message.includes('tool stop timed out')) resolve();
      });
    });
    await f.agent.abort();
    await worker!.pollStatus();
    await stopping;
    await deadline;
    expect(await running).toBe('cancelled');
    expect(stop).toHaveBeenCalledTimes(1);
    const before = (await h.services.runs.events(f.payload.run.id, 0, 100))
      .events;
    events.push({
      type: 'text',
      at: new Date().toISOString(),
      content: 'Too late',
      meta: { output: { blockId: 'late', phase: 'end' } },
    });
    events.close();
    resolveResult({
      exit: 'aborted',
      sessionId: 'too-late-session',
      usage: [],
    });
    released();
    await result;
    await release;
    expect(
      (await h.services.runs.events(f.payload.run.id, 0, 100)).events,
    ).toEqual(before);
    expect((await h.services.runs.get(f.payload.run.id)).status).toBe(
      'cancelled',
    );
    expect(f.requests.filter((p) => p.endsWith('/cancelAck'))).toHaveLength(1);
  },
);
