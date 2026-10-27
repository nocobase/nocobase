import {
  mkdtemp,
  mkdir,
  writeFile,
  chmod,
  readFile,
  rm,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { expect, it, vi } from 'vitest';
import type { SDKMessage } from '@anthropic-ai/claude-agent-sdk';
import { RunWorker } from '../../src/agent/worker.ts';
import { ClaudeAdapter } from '../../src/agent/adapters/claude.ts';
import { CodexAdapter } from '../../src/agent/adapters/codex.ts';
import { fakeSpawn } from '../adapters/fake-codex.ts';
import { runnerPaths } from '../../src/lib/home.ts';
import { ApiClient } from '../../src/lib/http.ts';
import { FakeServer } from '../fake-server.ts';
import { init, assistant, result, SESSION_ID } from '../adapters/messages.ts';
import { setScript } from '../adapters/fake-sdk.ts';

vi.mock('@anthropic-ai/claude-agent-sdk', async (original) => ({
  ...(await original<typeof import('@anthropic-ai/claude-agent-sdk')>()),
  query: (await import('../adapters/fake-sdk.ts')).fakeQuery,
}));

// Controlled transports need no real tool login or shared plugin cache.
vi.mock('../../src/agent/codex-home.ts', () => ({
  prepareCodexHome: async (directory: string) => {
    await mkdir(directory, { recursive: true });
    return directory;
  },
}));

// Isolate workspace/CLI installation. The worker loop, real SDK adapter, output writer, spool and reports stay intact.
vi.mock('../../src/agent/prepare/index.ts', async (original) => ({
  ...(await original<typeof import('../../src/agent/prepare/index.ts')>()),
  PREPARE_STEPS: [
    {
      name: 'fixture',
      failure: 'setupFailed',
      async run(
        context: import('../../src/agent/prepare/types.ts').PrepareContext,
      ) {
        const workDir = path.join(context.paths.home, 'work');
        const privateDir = path.join(context.paths.home, 'private');
        await mkdir(workDir, { recursive: true });
        await mkdir(privateDir, { recursive: true });
        Object.assign(context, { workspace: { workDir }, privateDir });
      },
    },
  ],
}));

it.each([
  ['claude', true],
  ['codex', true],
  ['claude', false],
] as const)(
  'worker-cancel-regression: native %s outputBlocks=%s survives the worker loop, spool, reporting and stored-history reread',
  async (tool, streaming) => {
    const root = await mkdtemp(path.join(tmpdir(), 'native-worker-cancel-'));
    try {
      const executable = path.join(root, tool);
      await writeFile(executable, '#!/bin/sh\nexit 0\n');
      await chmod(executable, 0o755);
      let ready!: () => void;
      const started = new Promise<void>((resolve) => {
        ready = resolve;
      });
      const partial = (event: unknown) =>
        ({
          type: 'stream_event',
          event,
          parent_tool_use_id: null,
          session_id: SESSION_ID,
          uuid: crypto.randomUUID(),
        }) as SDKMessage;
      setScript(async function* (context) {
        await context.nextInput();
        yield init();
        yield partial({
          type: 'message_start',
          message: { id: 'native-worker-message' },
        });
        yield partial({
          type: 'content_block_start',
          index: 7,
          content_block: { type: 'text', text: '' },
        });
        yield partial({
          type: 'content_block_delta',
          index: 7,
          delta: {
            type: 'text_delta',
            text: 'Persist this native partial reply.',
          },
        });
        ready();
        if (!streaming) {
          yield assistant([{ type: 'text', text: 'Ordinary task response.' }]);
          yield result({ result: 'Ordinary task summary.' });
          return;
        }
        await context.aborted;
        await new Promise(() => {});
      });
      const paths = runnerPaths(
        path.join(root, 'runner'),
        path.join(root, 'workspaces'),
      );
      const run = new FakeServer().enqueue({ outputBlocks: streaming });
      const stored: {
        path: string;
        body: {
          events?: {
            type: string;
            content?: string;
            meta?: { output?: { phase?: string }; status?: string };
          }[];
        };
      }[] = [];
      const storageFile = path.join(root, 'server-events.json');
      const client = new ApiClient({
        server: 'http://fixture.test/',
        headers: {},
        fetch: async (url, request) => {
          stored.push({
            path: String(url),
            body: JSON.parse(String(request?.body ?? '{}')),
          });
          await writeFile(storageFile, JSON.stringify(stored));
          return Response.json({
            data: { cancelRequested: false, inputs: [] },
          });
        },
      });
      const adapter =
        tool === 'claude'
          ? new ClaudeAdapter({
              searchPath: root,
              exec: async () => ({ code: 0, stdout: '9.0.0' }),
            })
          : new CodexAdapter({
              searchPath: root,
              exec: async () => ({ code: 0, stdout: 'codex-cli 9.0.0' }),
              spawn: fakeSpawn(async (fake) => {
                fake.respond(await fake.nextRequest('initialize'), {
                  userAgent: 'test',
                });
                await fake.next((message) => message.method === 'initialized');
                fake.respond(await fake.nextRequest('thread/start'), {
                  thread: { id: 'thread-1' },
                  model: 'test-model',
                });
                fake.respond(await fake.nextRequest('turn/start'), {
                  turn: { id: 'turn-1', status: 'inProgress', error: null },
                });
                fake.notify('turn/started', {
                  threadId: 'thread-1',
                  turn: { id: 'turn-1', status: 'inProgress', error: null },
                });
                fake.notify('item/agentMessage/delta', {
                  threadId: 'thread-1',
                  turnId: 'turn-1',
                  itemId: 'partial',
                  delta: 'Persist this native partial reply.',
                });
                ready();
                fake.respond(await fake.nextRequest('turn/interrupt'), {});
                fake.notify('turn/completed', {
                  threadId: 'thread-1',
                  turn: { id: 'turn-1', status: 'interrupted', error: null },
                });
              }),
            });
      const worker = new RunWorker(
        { ...run.payload, tool: { ...run.payload.tool, kind: tool } },
        {
          leaseIntervalMs: 60_000,
          statusIntervalMs: 60_000,
          killGraceMs: 1000,
          eventFlushMs: 10,
          reportTimeoutMs: 1000,
        },
        {
          paths,
          client,
          adapters: new Map([[tool, adapter]]),
          log: () => undefined,
          settings: {
            name: 'Fixture runner',
            agentTools: 'system',
            autoUpdate: false,
          },
          connection: {
            runnerKey: 'fixture-runner-key',
            registration: {
              key: 'fixture-app',
              app: run.payload.app,
              server: 'http://fixture.test/',
              runnerId: 'fixture-runner',
              enabledTools: [tool],
              heartbeatIntervalMs: 60_000,
              pollTimeoutMs: 60_000,
              variables: {},
              cli: {},
              registeredAt: new Date().toISOString(),
            },
          },
        },
        {
          runId: run.payload.run.id,
          appKey: 'fixture-app',
          attempt: 1,
          firstSeq: 1,
          pid: process.pid,
          startedAt: new Date().toISOString(),
          phase: 'spawned',
          log: path.join(root, 'worker.log'),
        },
      );
      const running = worker.run();
      await started;
      if (streaming) worker.end({ kind: 'cancel' });
      expect(await running).toBe(streaming ? 'cancelled' : 'completed');
      const reloaded = JSON.parse(
        await readFile(storageFile, 'utf8'),
      ) as typeof stored;
      const events = reloaded.flatMap((request) => request.body.events ?? []);
      const final = events.filter(
        (event) => event.type === 'text' && event.meta?.output?.phase === 'end',
      );
      if (streaming) {
        expect(final).toHaveLength(1);
        expect(final[0]?.content).toBe('Persist this native partial reply.');
        expect(
          events.findIndex((event) => event.meta?.status === 'cancelled'),
        ).toBeGreaterThan(events.indexOf(final[0]!));
        expect(reloaded.at(-1)?.path).toMatch(/\/cancelAck$/u);
      } else {
        expect(final).toEqual([]);
        expect(
          events
            .filter((event) => event.type === 'text')
            .map((event) => event.content),
        ).toEqual(['Ordinary task response.']);
        expect(reloaded.at(-1)?.path).toMatch(/\/complete$/u);
        expect(reloaded.at(-1)?.body).toMatchObject({
          summary: 'Ordinary task summary.',
        });
      }
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  },
);
