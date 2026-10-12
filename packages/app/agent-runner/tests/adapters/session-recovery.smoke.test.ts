// Real tools and inference, opt-in because this requires test API credentials and spends tokens.
import { randomUUID } from 'node:crypto';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { CodexAdapter } from '../../src/agent/adapters/codex.ts';
import { ClaudeAdapter } from '../../src/agent/adapters/claude.ts';
import { PiAdapter } from '../../src/agent/adapters/pi.ts';
import type {
  AdapterEvent,
  AdapterSession,
  AgentAdapter,
} from '../../src/agent/adapters/types.ts';

const enabled = process.env.NOCOBASE_RUNNER_UPGRADE_SMOKE === '1';

function environment(home: string): Record<string, string> {
  const env: Record<string, string> = { HOME: home };
  for (const name of [
    'PATH',
    'USER',
    'LANG',
    'TERM',
    'TMPDIR',
    'OPENAI_API_KEY',
    'CODEX_API_KEY',
    'ANTHROPIC_API_KEY',
    'ANTHROPIC_BASE_URL',
    'OPENAI_BASE_URL',
  ]) {
    const value = process.env[name];
    if (value !== undefined) env[name] = value;
  }
  return env;
}

async function run(adapter: AgentAdapter, session: AdapterSession) {
  const handle = adapter.start(session);
  const events: AdapterEvent[] = [];
  for await (const event of handle.events) events.push(event);
  const result = await handle.result;
  expect(result.exit).toBe('completed');
  expect(result.sessionId).toBeTruthy();
  return { result, events };
}

describe.skipIf(!enabled)('real conversation recovery', () => {
  it.each([
    ['codex', () => new CodexAdapter()],
    ['claude', () => new ClaudeAdapter()],
    ['pi', () => new PiAdapter()],
  ] as const)(
    'recovers %s from a missing conversation and resumes the replacement next time',
    async (tool, create) => {
      const root = await mkdtemp(path.join(tmpdir(), 'real-session-recovery-'));
      const workDir = path.join(root, 'workspace');
      const home = path.join(root, 'home');
      await Promise.all([
        mkdir(workDir, { recursive: true }),
        mkdir(home, { recursive: true }),
      ]);
      const adapter: AgentAdapter = create();
      expect((await adapter.detect()).installed).toBe(true);
      const session: AdapterSession = {
        workDir,
        env: {
          ...environment(home),
          ...(tool === 'codex'
            ? { CODEX_HOME: path.join(home, '.codex') }
            : {}),
        },
        resumeSessionId: randomUUID(),
        model: process.env[`NOCOBASE_RUNNER_${tool.toUpperCase()}_MODEL`],
        prompt: 'Reply only "recovered".',
        systemPrompt: 'Answer briefly without calling tools.',
        permission: async () => 'allow',
        abort: AbortSignal.timeout(120_000),
      };
      try {
        const first = await run(adapter, session);
        expect(first.events.some((e) => e.content === 'sessionRecovery')).toBe(
          true,
        );
        // Pi keeps the id of the empty conversation it created for it.
        if (tool !== 'pi')
          expect(first.result.sessionId).not.toBe(session.resumeSessionId);
        const next = await run(adapter, {
          ...session,
          resumeSessionId: first.result.sessionId,
          abort: AbortSignal.timeout(120_000),
          prompt:
            'What word did you reply in the previous turn? Reply with that word only.',
        });
        expect(next.result.summary).toContain('recovered');
        expect(next.events.some((e) => e.content === 'sessionRecovery')).toBe(
          false,
        );
      } finally {
        await rm(root, { recursive: true, force: true });
      }
    },
    300_000,
  );
});
