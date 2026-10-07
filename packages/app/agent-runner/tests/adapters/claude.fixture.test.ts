/**
 * Replays a recorded real run (Claude Code 2.1.280, SDK 0.3.285, haiku;
 * paths, ids and signatures sanitized): the agent writes hello.txt, the
 * policy denies `rm`, a steer sent at the first tool call is folded into the
 * running turn and the agent writes world.txt before finishing.
 */
import { chmod, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import type { SDKMessage } from '@anthropic-ai/claude-agent-sdk';
import { beforeEach, expect, it, vi } from 'vitest';

import { ClaudeAdapter } from '../../src/agent/adapters/claude.ts';
import type { AdapterEvent } from '../../src/agent/adapters/types.ts';
import { calls, setScript } from './fake-sdk.ts';

vi.mock('@anthropic-ai/claude-agent-sdk', async () => ({
  query: (await import('./fake-sdk.ts')).fakeQuery,
}));

const PROMPT_UUID = '00000000-0000-4000-8000-000000000001';
const STEER_UUID = '00000000-0000-4000-8000-000000000011';

beforeEach(() => {
  calls.length = 0;
});

it('replays a recorded run with a denial and a steer', async () => {
  const fixture = JSON.parse(
    await readFile(
      path.join(import.meta.dirname, 'fixtures/claude-steer-deny.json'),
      'utf8',
    ),
  ) as SDKMessage[];

  setScript(async function* (ctx) {
    const prompt = await ctx.nextInput();
    let steerUuid: string | undefined;
    const rewrite = (uuid: string) =>
      uuid === PROMPT_UUID
        ? prompt!.uuid!
        : uuid === STEER_UUID
          ? steerUuid!
          : uuid;
    for (const raw of fixture) {
      const message = structuredClone(raw) as SDKMessage & {
        user_message_uuid?: string;
        user_message_uuids?: string[];
      };
      if (message.user_message_uuid)
        message.user_message_uuid = rewrite(message.user_message_uuid);
      if (message.user_message_uuids)
        message.user_message_uuids = message.user_message_uuids.map(rewrite);
      if (message.type === 'user' && !steerUuid)
        steerUuid = (await ctx.nextInput())!.uuid;
      if (message.type === 'assistant') {
        for (const block of message.message.content) {
          if (block.type === 'tool_use') {
            yield message;
            await ctx.callTool(
              block.name,
              block.input as Record<string, unknown>,
              block.id,
            );
            continue;
          }
        }
        if (message.message.content.some((b) => b.type === 'tool_use'))
          continue;
      }
      yield message;
    }
  });

  // A stand-in `claude` on the adapter's PATH: the SDK is faked, so it never runs.
  const bin = await mkdtemp(path.join(tmpdir(), 'nocobase-runner-claude-'));
  await writeFile(path.join(bin, 'claude'), '#!/bin/sh\n');
  await chmod(path.join(bin, 'claude'), 0o755);
  const adapter = new ClaudeAdapter({
    searchPath: bin,
    exec: async (_file, args) =>
      args[0] === '--version'
        ? { code: 0, stdout: '9.0.0 (Claude Code)\n' }
        : { code: 0, stdout: '{"loggedIn":true}' },
  });
  const handle = adapter.start({
    workDir: '/work',
    prompt: 'steps',
    systemPrompt: 'brief',
    env: {},
    abort: new AbortController().signal,
    permission: async (tool, input) =>
      tool === 'Bash' && String(input.command).startsWith('rm')
        ? { deny: 'rm is not allowed in this run' }
        : 'allow',
  });
  const events: AdapterEvent[] = [];
  for await (const event of handle.events) {
    events.push(event);
    if (
      event.type === 'toolUse' &&
      events.filter((e) => e.type === 'toolUse').length === 1
    ) {
      expect(await handle.steer('also create world.txt', 'in-1')).toBe(true);
    }
  }
  const result = await handle.result;

  expect(events.filter((e) => e.type === 'toolUse').map((e) => e.tool)).toEqual(
    ['Write', 'Bash', 'Bash', 'Write'],
  );
  expect(
    events
      .filter((e) => e.type === 'permission')
      .map((e) => [e.tool, e.meta?.decision]),
  ).toEqual([
    ['Write', 'allow'],
    ['Bash', 'deny'],
    ['Bash', 'allow'],
    ['Write', 'allow'],
  ]);
  const denied = events.find((e) => e.type === 'toolResult' && e.meta?.isError);
  expect(denied?.output).toContain('runner policy denied');
  expect(events.filter((e) => e.type === 'input')).toMatchObject([
    { meta: { inputId: 'in-1' } },
  ]);
  expect(result.exit).toBe('completed');
  expect(result.summary).toMatch(/^Done/);
  expect(result.usage).toHaveLength(1);
  expect(result.usage[0]).toMatchObject({
    tool: 'claude',
    model: expect.stringContaining('haiku'),
  });
  expect(result.usage[0]!.outputTokens).toBeGreaterThan(0);
});
