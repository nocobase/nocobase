/**
 * Replays a recorded real run (opencode 2.0.12, `opencode serve`, model
 * deepseek/deepseek-flash, recorded 2026-10-01; paths sanitized): the agent
 * reads a missing README.md and runs `ls`, a steer sent at the first
 * permission request reaches it at the next step boundary, it writes
 * hello.txt, runs `ls` again and ends its reply with DONE as the steer asked.
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { expect, it } from 'vitest';

import {
  ASK_EVERYTHING,
  OpencodeAdapter,
} from '../../src/agent/adapters/opencode.ts';
import type {
  AdapterEvent,
  AdapterHandle,
} from '../../src/agent/adapters/types.ts';
import { FakeOpencode } from './opencode-fake-server.ts';
import type { BusEvent } from './opencode-fake-server.ts';

interface Fixture {
  events: BusEvent[];
}

it('replays a recorded run with permissions and a steer', async () => {
  const fixture = JSON.parse(
    await readFile(
      path.join(import.meta.dirname, 'fixtures/opencode-steer.json'),
      'utf8',
    ),
  ) as Fixture;
  const sessionId = String(
    fixture.events.find((e) => e.type === 'session.created')!.data.sessionID,
  );
  const fake = new FakeOpencode({ script: fixture.events, sessionId });
  const adapter = new OpencodeAdapter({
    launch: fake.launch,
    exec: async (_file, args) =>
      args[0] === '--version'
        ? { code: 0, stdout: 'opencode v2.0.12\n' }
        : { code: 0, stdout: 'DeepSeek  API key  stored\n' },
    // The fake never runs the binary; detection only needs an executable.
    searchPath: '',
    fallbackPaths: [process.execPath],
  });
  const policyCalls: [string, unknown][] = [];
  let steered: Promise<boolean> | undefined;
  const handle: AdapterHandle = adapter.start({
    workDir: '/work',
    prompt:
      'Read README.md if it exists, then create hello.txt containing the word hi, then run the shell command `ls` and report the result.',
    systemPrompt: 'BRIEF',
    model: 'deepseek/deepseek-flash',
    env: { PATH: '/usr/bin', HOME: '/home/runner' },
    permission: async (tool, input) => {
      policyCalls.push([tool, input]);
      steered ??= handle.steer(
        'Also, end your final reply with the word DONE.',
        'in_1',
      );
      return 'allow';
    },
    abort: new AbortController().signal,
  });
  const events: AdapterEvent[] = [];
  for await (const event of handle.events) events.push(event);
  const result = await handle.result;
  expect(await steered).toBe(true);

  // Session, brief and prompts.
  expect(fake.requestsTo('POST', /^\/api\/session$/)[0].body).toEqual({
    title: 'Agent run',
    location: { directory: '/work' },
    permissions: ASK_EVERYTHING,
    model: { providerID: 'deepseek', id: 'deepseek-flash' },
  });
  expect(
    fake.requestsTo('PUT', /instructions\/entries\/nocobase-runner-brief$/)[0]
      .body,
  ).toEqual({ value: 'BRIEF' });
  expect(fake.requestsTo('POST', /\/prompt$/).map((r) => r.body)).toEqual([
    {
      text: 'Read README.md if it exists, then create hello.txt containing the word hi, then run the shell command `ls` and report the result.',
    },
    {
      text: 'Also, end your final reply with the word DONE.',
      delivery: 'steer',
    },
  ]);

  // Every tool call went through the policy with OpenCode's tool name and input.
  expect(policyCalls).toEqual(
    expect.arrayContaining([
      ['read', { path: 'README.md' }],
      ['shell', { command: 'ls' }],
      ['write', { path: 'hello.txt', content: 'hi\n' }],
      ['edit', { path: 'hello.txt' }],
    ]),
  );
  const replies = fake.requestsTo('POST', /\/permission\/[^/]+\/reply$/);
  expect(replies).toHaveLength(4);
  expect(
    replies.every((r) => (r.body as { decision: string }).decision === 'once'),
  ).toBe(true);
  const permissions = events.filter((e) => e.type === 'permission');
  expect(permissions.map((e) => [e.tool, e.meta?.decision])).toEqual(
    expect.arrayContaining([
      ['read', 'allow'],
      ['shell', 'allow'],
      ['write', 'allow'],
    ]),
  );
  expect(permissions).toHaveLength(4);

  // Transcript.
  const kinds = events.map((e) => e.type);
  expect(kinds[0]).toBe('status');
  expect(events[0].meta).toMatchObject({
    sessionId,
    opencodeVersion: '2.0.12',
  });
  expect(events.filter((e) => e.type === 'toolUse').map((e) => e.tool)).toEqual(
    ['read', 'shell', 'write', 'shell'],
  );
  const readResult = events.find(
    (e) => e.type === 'toolResult' && e.tool === 'read',
  )!;
  expect(readResult.meta?.isError).toBe(true);
  expect(readResult.output).toContain('File not found: README.md');
  expect(
    events.find(
      (e) => e.type === 'toolResult' && e.output?.startsWith('hello.txt'),
    ),
  ).toBeDefined();
  const input = events.find((e) => e.type === 'input')!;
  expect(input.content).toBe('Also, end your final reply with the word DONE.');
  expect(input.meta?.inputId).toBe('in_1');
  expect(kinds.indexOf('input')).toBeLessThan(kinds.lastIndexOf('text'));
  expect(events.filter((e) => e.type === 'thinking').length).toBeGreaterThan(0);
  expect(kinds).toContain('usage');
  expect(events.find((e) => e.content === 'turnCompleted')?.meta?.outcome).toBe(
    'succeeded',
  );

  // Result.
  expect(result.exit).toBe('completed');
  expect(result.sessionId).toBe(sessionId);
  expect(result.summary).toMatch(/DONE$/);
  expect(result.usage).toEqual([
    {
      tool: 'opencode',
      model: 'deepseek/deepseek-flash',
      inputTokens: 15108 + 150 + 180,
      // OpenCode's output leaves reasoning out; Usage's includes it.
      outputTokens: 65 + 82 + 41 + 17 + 41,
      cacheReadTokens: 256 + 15360 + 15488,
      cacheWriteTokens: 0,
      reasoningTokens: 17 + 41,
    },
  ]);
  expect(fake.closed).toBe(true);
});
