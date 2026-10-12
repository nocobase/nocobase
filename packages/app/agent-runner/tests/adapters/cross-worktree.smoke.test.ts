// Real inference is opt-in. Test both new containers and upgrade from the old repository cwd.
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  prepareCodexHome,
  migrateCodexConversation,
} from '../../src/agent/codex-home.ts';
import { repositoryContext } from '../../src/agent/repository-context.ts';
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
  for (const mode of ['persistent', 'legacy'] as const) {
    for (const [tool, create] of [
      ['claude', () => new ClaudeAdapter()],
      ['codex', () => new CodexAdapter()],
      ['opencode', () => new OpencodeAdapter()],
      ['pi', () => new PiAdapter()],
    ] as const) {
      it(`${tool} ${mode}: retains memory, current repository instructions, skills and the correct default cwd`, async (context) => {
        const adapter = create();
        const detected = await adapter.detect();
        if (!detected.installed || !detected.authenticated) {
          console.log(
            `${tool}: installed=${detected.installed}, authenticated=${detected.authenticated}; ${mode} inference not executed`,
          );
          // eslint-disable-next-line vitest/no-disabled-tests -- Requires the corresponding authenticated coding tool.
          context.skip();
        }
        console.log(
          `${tool} ${mode}: version ${detected.version ?? 'unknown'}`,
        );
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
        const markers = {
          agents: randomUUID(),
          claude: randomUUID(),
          skill: randomUUID(),
        };
        const seedInstructions = async (dir: string, prefix: string) => {
          await writeFile(
            path.join(dir, 'AGENTS.md'),
            `The verification agent marker is ${prefix}${markers.agents}.\n`,
          );
          await writeFile(
            path.join(dir, 'CLAUDE.md'),
            `The verification Claude marker is ${prefix}${markers.claude}.\n`,
          );
          const skill = path.join(dir, '.agents/skills/verification');
          await mkdir(skill, { recursive: true });
          await writeFile(
            path.join(skill, 'SKILL.md'),
            `---\nname: verification\ndescription: Read for this continuation verification.\n---\nThe verification skill marker is ${prefix}${markers.skill}.\n`,
          );
        };
        await seedInstructions(a, 'old-');
        const marker = randomUUID();
        const env: Record<string, string> = {};
        for (const name of ['PATH', 'HOME', 'USER', 'LANG', 'TERM', 'TMPDIR'])
          if (process.env[name] !== undefined) env[name] = process.env[name]!;
        if (tool === 'codex')
          env.CODEX_HOME = await prepareCodexHome(
            path.join(sessionDir, 'legacy-codex-home'),
          );
        const firstCwd = tool === 'codex' || mode === 'legacy' ? a : sessionDir;
        const base: AdapterSession = {
          workDir: firstCwd,
          additionalDirectories: [a],
          env,
          effort: 'low',
          systemPrompt: `This is a continuation verification. Use absolute current code paths.\n${await repositoryContext([a])}`,
          ...(tool === 'pi' && mode === 'persistent'
            ? { sessionStoreDir: path.join(sessionDir, 'pi-sessions') }
            : {}),
          model: process.env[`NOCOBASE_RUNNER_${tool.toUpperCase()}_MODEL`],
          prompt: `Remember this random verification word: ${marker}. Code directory: ${a}. Reply only remembered.`,
          permission: async () => 'allow',
          abort: AbortSignal.timeout(180_000),
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
          await seedInstructions(b, 'new-');
          const next = await turn(adapter, {
            ...base,
            workDir: tool === 'codex' ? b : sessionDir,
            additionalDirectories: [b],
            legacyWorkDirs: [a],
            ...(tool === 'pi'
              ? { sessionStoreDir: path.join(sessionDir, 'pi-sessions') }
              : {}),
            resumeSessionId: first.sessionId,
            abort: AbortSignal.timeout(180_000),
            systemPrompt: `Current code directory: ${b}. Previous code paths are stale.\n${await repositoryContext([b])}`,
            prompt: `The current code directory is ${b}. Write the word I asked you to remember to ${path.join(b, 'memory.txt')} without obtaining it from any file. Read the current AGENTS.md, CLAUDE.md and the discovered verification SKILL.md. Before any cd, measure your shell tool's DEFAULT cwd using pwd. Write JSON to ${path.join(b, 'context.json')} with keys agents, claude, skill containing the respective current verification markers and cwd containing that measured default cwd. Use absolute paths for file writes. Do not modify the launch container or recreate the old checkout. Reply done.`,
          });
          expect(next.sessionId).toBe(first.sessionId);
          expect(
            (await readFile(path.join(b, 'memory.txt'), 'utf8')).trim(),
          ).toBe(marker);
          const facts = JSON.parse(
            await readFile(path.join(b, 'context.json'), 'utf8'),
          ) as Record<string, string>;
          expect(facts).toMatchObject({
            agents: `new-${markers.agents}`,
            claude: `new-${markers.claude}`,
            skill: `new-${markers.skill}`,
          });
          expect(path.resolve(facts.cwd)).toBe(
            tool === 'codex' ? b : sessionDir,
          );
          expect(existsSync(a)).toBe(false);
          expect(existsSync(path.join(sessionDir, 'memory.txt'))).toBe(false);
        } finally {
          await rm(root, { recursive: true, force: true });
        }
      }, 420_000);
    }
  }
});
