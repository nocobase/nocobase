/**
 * Replays recorded real runs (Codex CLI 0.158.0, app-server over stdio,
 * 2026-10-01; paths and the user agent sanitized):
 * - steer-deny: the agent writes hello.txt, the policy denies `rm`, a steer
 *   sent at the first tool call joins the running turn and the agent also
 *   writes world.txt before finishing.
 * - stop: the run is stopped while `sleep 60` waits for approval; the turn
 *   is interrupted.
 */
import { chmod, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { beforeAll, expect, it } from 'vitest';

import { CodexAdapter } from '../../src/agent/adapters/codex.ts';
import type {
  AdapterEvent,
  AdapterHandle,
  AdapterSession,
} from '../../src/agent/adapters/types.ts';
import { fakeSpawn, replay } from './fake-codex.ts';
import type { TrafficLine } from './fake-codex.ts';

async function fixture(name: string): Promise<TrafficLine[]> {
  return JSON.parse(
    await readFile(path.join(import.meta.dirname, 'fixtures', name), 'utf8'),
  ) as TrafficLine[];
}

function session(prompt: string): AdapterSession {
  return {
    workDir: '/work',
    prompt,
    systemPrompt: 'brief',
    effort: 'low',
    env: { PATH: '/usr/bin' },
    abort: new AbortController().signal,
    permission: async (tool, input) =>
      tool === 'shell' && String(input.command).startsWith('rm')
        ? { deny: 'rm is not allowed in this run' }
        : 'allow',
  };
}

const installed = {
  exec: async (_file: string, args: string[]) =>
    args[0] === '--version'
      ? { code: 0, stdout: 'codex-cli 0.158.0\n' }
      : { code: 0, stdout: 'Logged in using ChatGPT\n' },
  searchPath: '',
};

beforeAll(async () => {
  // detect() looks for an executable `codex`; a stub stands in for it.
  const bin = await mkdtemp(path.join(tmpdir(), 'nocobase-runner-codex-bin-'));
  await writeFile(path.join(bin, 'codex'), '#!/bin/sh\n');
  await chmod(path.join(bin, 'codex'), 0o755);
  installed.searchPath = bin;
});

async function drain(
  handle: AdapterHandle,
  onEvent: (event: AdapterEvent, all: AdapterEvent[]) => void = () => {},
): Promise<AdapterEvent[]> {
  const events: AdapterEvent[] = [];
  for await (const event of handle.events) {
    events.push(event);
    onEvent(event, events);
  }
  return events;
}

it('replays a recorded run with a denial and a steer', async () => {
  const traffic = await fixture('codex-steer-deny.json');
  let answers: ReturnType<typeof replay> | undefined;
  const spawn = fakeSpawn((fake) => {
    answers = replay(fake, traffic);
  });
  const adapter = new CodexAdapter({ spawn, ...installed });
  const handle = adapter.start(session('steps'));
  let steered: Promise<boolean> | undefined;
  const events = await drain(handle, (event) => {
    if (event.type === 'toolUse' && !steered)
      steered = handle.steer('also create world.txt', 'in-1');
  });
  const result = await handle.result;
  const fake = spawn.processes[0]!;

  expect(fake.options.args).toEqual([
    '-c',
    'allow_login_shell=false',
    'app-server',
    '--listen',
    'stdio://',
  ]);
  expect(fake.options.env).toEqual({ PATH: '/usr/bin' });
  const threadStart = fake.received.find((m) => m.method === 'thread/start');
  expect(threadStart?.params).toMatchObject({
    cwd: '/work',
    approvalPolicy: 'untrusted',
    sandbox: 'workspace-write',
    developerInstructions: 'brief',
  });
  const turnStart = fake.received.find((m) => m.method === 'turn/start');
  expect(turnStart?.params).toMatchObject({
    effort: 'low',
    sandboxPolicy: { type: 'workspaceWrite', writableRoots: ['/work'] },
  });
  const steer = fake.received.find((m) => m.method === 'turn/steer');
  expect(steer?.params).toMatchObject({
    expectedTurnId: '01a0f65d-9d80-7382-a1b8-58f4a916d698',
  });
  expect(await steered).toBe(true);

  const recorded = await answers!;
  expect([...recorded.values()].map((m) => m.result)).toEqual([
    { decision: 'accept' },
    { decision: 'decline' },
    { decision: 'accept' },
    { decision: 'accept' },
  ]);
  expect(
    events
      .filter((e) => e.type === 'toolUse')
      .map((e) => (e.input as { command: string }).command),
  ).toEqual([
    'printf hello > hello.txt',
    'rm -f nothing.tmp',
    'ls',
    'printf world > world.txt',
  ]);
  expect(
    events
      .filter((e) => e.type === 'permission')
      .map((e) => [e.tool, e.meta?.decision, e.meta?.reason]),
  ).toEqual([
    ['shell', 'allow', undefined],
    ['shell', 'deny', 'rm is not allowed in this run'],
    ['shell', 'allow', undefined],
    ['shell', 'allow', undefined],
  ]);
  const declined = events.find(
    (e) => e.type === 'toolResult' && e.meta?.status === 'declined',
  );
  expect(declined?.meta?.isError).toBe(true);
  expect(events.filter((e) => e.type === 'input')).toMatchObject([
    { content: 'also create world.txt', meta: { inputId: 'in-1' } },
  ]);
  // The input event follows the first tool call, which carried the steer.
  const kinds = events.map((e) => e.type);
  expect(kinds.indexOf('input')).toBeGreaterThan(kinds.indexOf('toolUse'));
  expect(events[0]).toMatchObject({
    type: 'status',
    content: 'started',
    meta: { model: 'gpt-6-astra' },
  });
  expect(events.filter((e) => e.type === 'status').at(-1)).toMatchObject({
    content: 'turnCompleted',
    meta: { status: 'completed' },
  });

  expect(result.exit).toBe('completed');
  expect(result.sessionId).toBe('01a0f65d-88eb-71f3-b0ae-cd2a8ef6a819');
  expect(result.summary).toMatch(/^Created both files/);
  expect(result.usage).toEqual([
    {
      tool: 'codex',
      model: 'gpt-6-astra',
      inputTokens: 105284 - 83328,
      outputTokens: 173,
      cacheReadTokens: 83328,
      reasoningTokens: 12,
    },
  ]);
  expect(fake.ended).toBe(true);
});

it('replays a recorded stop', async () => {
  const traffic = await fixture('codex-stop.json');
  let answers: ReturnType<typeof replay> | undefined;
  const spawn = fakeSpawn((fake) => {
    answers = replay(fake, traffic);
  });
  const adapter = new CodexAdapter({ spawn, ...installed });
  const handle = adapter.start(session('sleep'));
  let stopped: Promise<void> | undefined;
  const started = Date.now();
  const events = await drain(handle, (event) => {
    if (event.type === 'toolUse' && !stopped) stopped = handle.stop();
  });
  await stopped;
  const result = await handle.result;
  const fake = spawn.processes[0]!;

  expect(Date.now() - started).toBeLessThan(5000);
  expect(fake.received.some((m) => m.method === 'turn/interrupt')).toBe(true);
  // The approval that arrived after the stop is cancelled.
  expect([...(await answers!).values()].map((m) => m.result)).toEqual([
    { decision: 'cancel' },
  ]);
  expect(result.exit).toBe('aborted');
  expect(result.error).toEqual({
    reason: 'cancelled',
    message: 'Stopped by the runner',
  });
  expect(events.at(-1)).toMatchObject({
    type: 'error',
    meta: { reason: 'cancelled' },
  });
  expect(fake.ended).toBe(true);
});
