// Real inference is opt-in. Each tool must keep its conversation after worktree A is deleted, then write in B.
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  prepareCodexHome,
  migrateCodexConversation,
} from '../../src/agent/codex-home.ts';
import { ClaudeAdapter } from '../../src/agent/adapters/claude.ts';
import { CodexAdapter } from '../../src/agent/adapters/codex.ts';
import { OpencodeAdapter } from '../../src/agent/adapters/opencode.ts';
import { PiAdapter } from '../../src/agent/adapters/pi.ts';
import type {
  AdapterSession,
  AgentAdapter,
} from '../../src/agent/adapters/types.ts';

const enabled = process.env.NOCOBASE_RUNNER_WORKTREE_SMOKE === '1';
async function turn(adapter: AgentAdapter, session: AdapterSession) {
  const handle = adapter.start(session);
  let recovered = false;
  for await (const event of handle.events)
    if (event.content === 'sessionRecovery') recovered = true;
  const result = await handle.result;
  expect(result.exit).toBe('completed');
  expect(recovered).toBe(false);
  expect(result.sessionId).toBeTruthy();
  return result;
}

describe.skipIf(!enabled)('real tools across worktree paths', () => {
  for (const [tool, create] of [
    ['claude', () => new ClaudeAdapter()],
    ['codex', () => new CodexAdapter()],
    ['opencode', () => new OpencodeAdapter()],
    ['pi', () => new PiAdapter()],
  ] as const)
    it(`resumes ${tool} with memory and edits in the new checkout`, async (context) => {
      const adapter = create();
      const detected = await adapter.detect();
      if (!detected.installed || !detected.authenticated) {
        console.log(
          `${tool}: unavailable or not authenticated; cross-worktree inference not executed`,
        );
        // eslint-disable-next-line vitest/no-disabled-tests -- Real inference needs an installed authenticated tool.
        context.skip();
      }
      console.log(`${tool}: version ${detected.version ?? 'unknown'}`);
      const root = await mkdtemp(path.join(tmpdir(), 'cross-worktree-'));
      const repository = path.join(root, 'repository');
      const sessionDir = path.join(root, 'conversation');
      const a = path.join(root, 'a');
      const b = path.join(root, 'b');
      const runGit = (args: string[], cwd = root) =>
        execFileSync('git', args, { cwd, stdio: 'pipe' });
      await mkdir(sessionDir);
      runGit(['init', '--quiet', repository]);
      runGit(
        [
          '-c',
          'user.name=Test',
          '-c',
          'user.email=test@example.com',
          '-c',
          'commit.gpgsign=false',
          'commit',
          '--allow-empty',
          '-m',
          'seed',
        ],
        repository,
      );
      runGit(['worktree', 'add', '--detach', a, 'HEAD'], repository);
      const marker = randomUUID();
      const env: Record<string, string> = {};
      for (const name of ['PATH', 'HOME', 'USER', 'LANG', 'TERM', 'TMPDIR'])
        if (process.env[name] !== undefined) env[name] = process.env[name]!;
      if (tool === 'codex')
        env.CODEX_HOME = await prepareCodexHome(
          path.join(sessionDir, 'legacy-codex-home'),
        );
      const base: AdapterSession = {
        workDir: tool === 'codex' ? a : sessionDir,
        additionalDirectories: [a],
        env,
        effort: 'low',
        systemPrompt:
          'This is a conversation continuation test. Follow the absolute code directory given in the newest user turn. Keep replies brief.',
        model: process.env[`NOCOBASE_RUNNER_${tool.toUpperCase()}_MODEL`],
        prompt: `Remember this secret test word: ${marker}. Code directory: ${a}. Reply only remembered.`,
        permission: async () => 'allow',
        abort: AbortSignal.timeout(120_000),
      };
      try {
        const first = await turn(adapter, base);
        if (tool === 'codex') {
          const persistent = await prepareCodexHome(
            path.join(sessionDir, 'codex-home'),
          );
          await migrateCodexConversation(
            persistent,
            base.env.CODEX_HOME!,
            first.sessionId,
          );
          base.env.CODEX_HOME = persistent;
        }
        runGit(['worktree', 'remove', '--force', a], repository);
        runGit(['worktree', 'add', '--detach', b, 'HEAD'], repository);
        const next = await turn(adapter, {
          ...base,
          workDir: tool === 'codex' ? b : sessionDir,
          additionalDirectories: [b],
          resumeSessionId: first.sessionId,
          abort: AbortSignal.timeout(120_000),
          prompt: `The old code directory was removed. The current code directory is ${b}. Write the test word I asked you to remember into ${path.join(b, 'memory.txt')}. Do not obtain it from any file or external source. Reply done.`,
        });
        expect(next.sessionId).toBe(first.sessionId);
        expect(
          (await readFile(path.join(b, 'memory.txt'), 'utf8')).trim(),
        ).toBe(marker);
        expect(existsSync(a)).toBe(false);
      } finally {
        await rm(root, { recursive: true, force: true });
      }
    }, 300_000);
});
