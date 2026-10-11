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
import { migrateLegacySessions } from '../../src/agent/session-migration.ts';

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

describe.skipIf(!enabled)('real conversation upgrades', () => {
  it.each(['codex', 'claude'] as const)(
    'migrates %s context, recovers a deleted conversation, and resumes the replacement',
    async (tool) => {
      const root = await mkdtemp(path.join(tmpdir(), 'real-session-upgrade-'));
      const workDir = path.join(root, 'workspace');
      const runner = path.join(root, '.nocobase-runner');
      const legacy = path.join(runner, 'home');
      const current = path.join(root, 'current-home');
      await Promise.all([
        mkdir(workDir, { recursive: true }),
        mkdir(legacy, { recursive: true }),
        mkdir(current, { recursive: true }),
      ]);
      const adapter =
        tool === 'codex' ? new CodexAdapter() : new ClaudeAdapter();
      expect((await adapter.detect()).installed).toBe(true);
      const token = `remember-${randomUUID()}`;
      const session: AdapterSession = {
        workDir,
        env: {
          ...environment(legacy),
          ...(tool === 'codex'
            ? { CODEX_HOME: path.join(legacy, '.codex') }
            : {}),
        },
        model:
          process.env[
            tool === 'codex'
              ? 'NOCOBASE_RUNNER_CODEX_MODEL'
              : 'NOCOBASE_RUNNER_CLAUDE_MODEL'
          ],
        prompt: `Remember this exact token for the next turn: ${token}. Reply only "remembered".`,
        systemPrompt: 'Answer briefly without calling tools.',
        permission: async () => 'allow',
        abort: AbortSignal.timeout(120_000),
      };
      try {
        const old = await run(adapter, session);
        const migration = await migrateLegacySessions(runner, tool, current);
        expect(migration?.failures).toBe(0);
        expect(migration?.copied).toBeGreaterThan(0);
        const next: AdapterSession = {
          ...session,
          env: {
            ...environment(current),
            ...(tool === 'codex'
              ? { CODEX_HOME: path.join(runner, 'codex-home') }
              : {}),
          },
          abort: AbortSignal.timeout(120_000),
          resumeSessionId: old.result.sessionId,
          prompt:
            'What exact token did I ask you to remember? Reply with the token only.',
        };
        const resumed = await run(adapter, next);
        expect(resumed.result.sessionId).toBe(old.result.sessionId);
        expect(resumed.result.summary).toContain(token);
        expect(
          resumed.events.some((e) => e.content === 'sessionRecovery'),
        ).toBe(false);
        const history =
          tool === 'codex'
            ? path.join(runner, 'codex-home/sessions')
            : path.join(current, '.claude/projects');
        await rm(history, { recursive: true });
        expect(
          await migrateLegacySessions(runner, tool, current),
        ).toMatchObject({ alreadyAttempted: true });
        const recovered = await run(adapter, {
          ...next,
          abort: AbortSignal.timeout(120_000),
          prompt: 'Reply only "recovered".',
        });
        expect(
          recovered.events.some((e) => e.content === 'sessionRecovery'),
        ).toBe(true);
        expect(recovered.result.sessionId).not.toBe(old.result.sessionId);
        const again = await run(adapter, {
          ...next,
          abort: AbortSignal.timeout(120_000),
          resumeSessionId: recovered.result.sessionId,
          prompt:
            'What word did you reply in the previous turn? Reply with that word only.',
        });
        expect(again.result.summary).toContain('recovered');
        expect(again.events.some((e) => e.content === 'sessionRecovery')).toBe(
          false,
        );
      } finally {
        await rm(root, { recursive: true, force: true });
      }
    },
    480_000,
  );

  it('creates a real Pi conversation for a missing id and resumes its history next time', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'real-pi-recovery-'));
    const adapter = new PiAdapter();
    const session: AdapterSession = {
      workDir: root,
      env: environment(root),
      resumeSessionId: randomUUID(),
      model: process.env.NOCOBASE_RUNNER_PI_MODEL,
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
  }, 300_000);
});
