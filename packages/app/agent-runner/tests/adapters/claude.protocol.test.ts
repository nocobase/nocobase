import { chmod, copyFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { query } from '@anthropic-ai/claude-agent-sdk';
import { describe, expect, it } from 'vitest';

import { ClaudeAdapter } from '../../src/agent/adapters/claude.ts';
import type { AdapterEvent } from '../../src/agent/adapters/types.ts';

async function fixtureExecutable(workDir: string): Promise<string> {
  const executable = path.join(workDir, 'claude');
  await copyFile(
    path.join(import.meta.dirname, 'fake-claude-cli.mjs'),
    executable,
  );
  await chmod(executable, 0o755);
  return executable;
}

describe('Claude permissions over the real SDK control transport', () => {
  it.each([
    { resumeSessionId: undefined, background: true },
    { resumeSessionId: 'previous-session', background: true },
    { resumeSessionId: undefined, background: false },
  ])(
    'completes with live permissions (resume=$resumeSessionId, background=$background)',
    async ({ resumeSessionId, background }) => {
      const workDir = await mkdtemp(path.join(tmpdir(), 'claude-control-'));
      try {
        await fixtureExecutable(workDir);
        const adapter = new ClaudeAdapter({
          searchPath: workDir,
          exec: async (_file, args) => ({
            code: 0,
            stdout: args[0] === '--version' ? '2.1.284' : '{"loggedIn":true}',
          }),
        });
        const calls: string[] = [];
        const handle = adapter.start({
          workDir,
          prompt: background ? 'run background fixture' : 'plain',
          systemPrompt: '',
          env: { PATH: process.env.PATH ?? '' },
          resumeSessionId,
          permission: async (tool, input) => {
            calls.push(`${tool}:${input.command}`);
            return input.command === 'cat ../outside.log'
              ? { deny: 'Read outside the work directory' }
              : 'allow';
          },
          abort: new AbortController().signal,
        });
        const events: AdapterEvent[] = [];
        for await (const event of handle.events) events.push(event);
        expect(calls).toEqual(
          background
            ? ['Bash:git status', 'Bash:cat ../outside.log', 'Bash:git status']
            : ['Bash:git status'],
        );
        expect(
          events
            .filter((event) => event.type === 'toolResult')
            .map((event) => event.output),
        ).toEqual(
          background
            ? [
                'ok',
                expect.stringContaining('not a user instruction to stop'),
                'ok',
              ]
            : ['ok'],
        );
        expect(
          events.filter(
            (event) =>
              event.type === 'permission' && event.meta?.decision === 'deny',
          ),
        ).toHaveLength(background ? 1 : 0);
        expect(await handle.result).toMatchObject({
          exit: 'completed',
          summary: background
            ? 'continued after background task'
            : 'plain turn finished',
        });
      } finally {
        await rm(workDir, { recursive: true, force: true });
      }
    },
    15000,
  );

  it('reproduces default STOP denials when the input is closed at the first result', async () => {
    const workDir = await mkdtemp(path.join(tmpdir(), 'claude-eof-repro-'));
    let release!: () => void;
    const done = new Promise<void>((resolve) => {
      release = resolve;
    });
    const executable = await fixtureExecutable(workDir);
    async function* prompt() {
      yield {
        type: 'user' as const,
        message: { role: 'user' as const, content: 'background' },
        parent_tool_use_id: null,
      };
      await done;
    }
    const q = query({
      prompt: prompt(),
      options: {
        cwd: workDir,
        pathToClaudeCodeExecutable: executable,
        env: {
          PATH: process.env.PATH ?? '',
          CLAUDE_CODE_EMIT_SESSION_STATE_EVENTS: '1',
        },
        settingSources: [],
        canUseTool: async (_tool, input) => ({
          behavior: 'allow',
          updatedInput: input,
        }),
        hooks: { PreToolUse: [{ hooks: [async () => ({})] }] },
      },
    });
    try {
      const outputs: string[] = [];
      for await (const message of q) {
        if (message.type === 'result') release();
        if (message.type === 'user' && Array.isArray(message.message.content))
          for (const block of message.message.content)
            if (block.type === 'tool_result')
              outputs.push(String(block.content));
      }
      expect(outputs).toEqual([
        'ok',
        expect.stringContaining("The user doesn't want"),
        expect.stringContaining("The user doesn't want"),
      ]);
    } finally {
      release();
      q.close();
      await rm(workDir, { recursive: true, force: true });
    }
  }, 15000);
});
