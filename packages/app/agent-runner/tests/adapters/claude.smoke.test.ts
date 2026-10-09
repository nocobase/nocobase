/**
 * Real Claude Code smoke test. Skipped unless NOCOBASE_RUNNER_CLAUDE_SMOKE=1; needs a
 * logged-in `claude` and spends a few cents. With NOCOBASE_RUNNER_CLAUDE_RECORD=<dir>
 * it also writes the raw SDK messages of each run there; sanitize paths,
 * ids, signatures and account details before committing one as a fixture.
 * The tool environment is the runner's whitelist; on macOS it must include
 * USER, or Claude Code cannot read its keychain login ("Not logged in").
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import type { SDKMessage } from '@anthropic-ai/claude-agent-sdk';
import { describe, expect, it, vi } from 'vitest';

import { ClaudeAdapter } from '../../src/agent/adapters/claude.ts';
import { createPolicy } from '../../src/core/command-policy.ts';
import type {
  AdapterEvent,
  AdapterHandle,
  AdapterSession,
} from '../../src/agent/adapters/types.ts';

const recorded: SDKMessage[][] = [];

vi.mock('@anthropic-ai/claude-agent-sdk', async (importOriginal) => {
  const real =
    await importOriginal<typeof import('@anthropic-ai/claude-agent-sdk')>();
  return {
    ...real,
    query: (args: Parameters<typeof real.query>[0]) => {
      const q = real.query(args);
      const log: SDKMessage[] = [];
      recorded.push(log);
      const wrapped = (async function* () {
        for await (const message of q) {
          log.push(message);
          yield message;
        }
      })();
      return Object.assign(wrapped, { close: () => q.close() });
    },
  };
});

const enabled = process.env.NOCOBASE_RUNNER_CLAUDE_SMOKE === '1';
const MODEL = process.env.NOCOBASE_RUNNER_CLAUDE_MODEL ?? 'haiku';

async function repo(): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), 'nocobase-runner-smoke-'));
  execFileSync('git', ['init', '-q'], { cwd: dir });
  return dir;
}

function whitelistedEnv(): Record<string, string> {
  const env: Record<string, string> = {};
  for (const name of (
    process.env.NOCOBASE_RUNNER_SMOKE_ENV ?? 'PATH,HOME,USER,LANG,TERM,TMPDIR'
  ).split(',')) {
    const value = process.env[name];
    if (value) env[name] = value;
  }
  return env;
}

function sessionFor(
  workDir: string,
  prompt: string,
  overrides: Partial<AdapterSession> = {},
): AdapterSession {
  return {
    workDir,
    prompt,
    systemPrompt: 'You are a Acme test agent. Keep answers to one sentence.',
    model: MODEL,
    env: whitelistedEnv(),
    permission: async (tool, input) => {
      const command = typeof input.command === 'string' ? input.command : '';
      if (tool === 'Bash' && /^\s*rm\b/.test(command))
        return { deny: 'rm is not allowed in this run' };
      return 'allow';
    },
    abort: new AbortController().signal,
    maxTurns: 20,
    ...overrides,
  };
}

async function drain(
  handle: AdapterHandle,
  onEvent?: (e: AdapterEvent) => void,
): Promise<AdapterEvent[]> {
  const events: AdapterEvent[] = [];
  for await (const event of handle.events) {
    events.push(event);
    onEvent?.(event);
  }
  return events;
}

async function save(name: string): Promise<void> {
  const dir = process.env.NOCOBASE_RUNNER_CLAUDE_RECORD;
  if (dir)
    await writeFile(
      path.join(dir, `${name}.raw.json`),
      JSON.stringify(recorded.at(-1), null, 2),
    );
}

describe.skipIf(!enabled)('claude adapter against a real Claude Code', () => {
  const adapter = new ClaudeAdapter();

  it('detects the installed claude', async () => {
    const detection = await adapter.detect();
    console.log('detect', {
      ...detection,
      path: detection.path ? '<path>' : undefined,
    });
    console.log('executable', await adapter.resolveExecutable());
    expect(detection.authenticated).toBe(true);
  });

  it('creates a file, is denied rm, and takes a steer between tool calls', async () => {
    const workDir = await repo();
    const handle = adapter.start(
      sessionFor(
        workDir,
        [
          'Do these steps one at a time, one tool call per step:',
          '1. Create hello.txt containing exactly "hello".',
          '2. Run the shell command `rm -f nothing.tmp`.',
          '3. Run the shell command `ls`.',
          'Then reply "done".',
        ].join('\n'),
      ),
    );
    let steered: Promise<boolean> | undefined;
    const events = await drain(handle, (event) => {
      if (event.type === 'toolUse' && !steered) {
        steered = handle.steer(
          'Additional instruction: also create world.txt containing exactly "world".',
          'steer-1',
        );
      }
    });
    const result = await handle.result;
    await save('create-file');
    console.log(
      events
        .map(
          (e) =>
            `${e.type}${e.tool ? `:${e.tool}` : ''}${e.content ? ` ${e.content.slice(0, 60)}` : ''}`,
        )
        .join('\n'),
    );
    console.log('result', {
      ...result,
      sessionId: result.sessionId ? '<id>' : undefined,
    });

    expect(result.exit).toBe('completed');
    expect(await steered).toBe(true);
    expect(
      (await readFile(path.join(workDir, 'hello.txt'), 'utf8')).trim(),
    ).toBe('hello');
    expect(
      events.some(
        (e) => e.type === 'permission' && e.meta?.decision === 'deny',
      ),
    ).toBe(true);
    expect(
      events.some((e) => e.type === 'input' && e.meta?.inputId === 'steer-1'),
    ).toBe(true);
    expect(existsSync(path.join(workDir, 'world.txt'))).toBe(true);
    expect(result.usage.length).toBeGreaterThan(0);
  }, 240_000);

  it('stops within five seconds', async () => {
    const workDir = await repo();
    const handle = adapter.start(
      sessionFor(
        workDir,
        'Run the shell command `node -e "setTimeout(() => {}, 60000)"` in the foreground, then reply "done".',
      ),
    );
    let stopAt = 0;
    const drained = drain(handle, (event) => {
      if (event.type === 'toolUse' && !stopAt) {
        stopAt = Date.now();
        void handle.stop();
      }
    });
    await drained;
    const result = await handle.result;
    const elapsed = Date.now() - stopAt;
    await save('stop');
    console.log('stop took', elapsed, 'ms');
    expect(result.exit).toBe('aborted');
    expect(elapsed).toBeLessThan(5000);
  }, 120_000);

  it('continues inside the workspace after an outside-file read is denied', async () => {
    const root = await repo();
    const workDir = path.join(root, 'work');
    await mkdir(workDir);
    await writeFile(path.join(root, 'full-test.log'), 'outside fixture');
    const policy = createPolicy({
      workDir,
      policy: {
        permissionMode: 'acceptEdits',
        allowedCommands: ['^cat\\b', '^printf\\b'],
        deniedPatterns: [],
        idleTimeoutMs: 60_000,
      },
    });
    const handle = adapter.start(
      sessionFor(
        workDir,
        'First use Read to read ../full-test.log. Then create result.txt in the working directory containing exactly "done" and reply "done".',
        {
          permission: async (tool, input) => {
            const decision = policy(tool, input);
            return decision.decision === 'allow'
              ? 'allow'
              : { deny: decision.reason };
          },
        },
      ),
    );
    const events = await drain(handle);
    await save('outside-file-denial');
    const denialIndex = events.findIndex(
      (e) =>
        e.type === 'permission' &&
        e.meta?.decision === 'deny' &&
        String(e.meta.reason).includes('outside the work directory'),
    );
    expect(denialIndex).toBeGreaterThanOrEqual(0);
    expect(
      events.slice(denialIndex + 1).some((e) => e.type === 'toolUse'),
    ).toBe(true);
    expect(
      events.some(
        (e) =>
          e.type === 'toolResult' &&
          String(e.output).includes('not a user instruction to stop'),
      ),
    ).toBe(true);
    expect(
      (await readFile(path.join(workDir, 'result.txt'), 'utf8')).trim(),
    ).toBe('done');
    expect((await handle.result).exit).toBe('completed');
  }, 240_000);

  it.each([false, true])(
    'keeps permissions working after a background turn (resumed=%s)',
    async (resumed) => {
      const workDir = await repo();
      let resumeSessionId: string | undefined;
      if (resumed) {
        const seed = adapter.start(
          sessionFor(workDir, 'Reply "ready" without using tools.'),
        );
        await drain(seed);
        const seedResult = await seed.result;
        expect(seedResult.exit).toBe('completed');
        resumeSessionId = seedResult.sessionId;
        expect(resumeSessionId).toBeTruthy();
      }
      const handle = adapter.start(
        sessionFor(
          workDir,
          'Use Bash with run_in_background=true to run `sleep 2`. End this turn immediately with "waiting". When notified that the task finished, use Write to create result.txt containing exactly "done", then reply "done". Do not schedule a wakeup.',
          { resumeSessionId },
        ),
      );
      const events = await drain(handle);
      await save(
        resumed ? 'resumed-background-continuation' : 'background-continuation',
      );
      const firstResult = events.findIndex(
        (event) => event.type === 'status' && event.content === 'turnCompleted',
      );
      expect(firstResult).toBeGreaterThanOrEqual(0);
      expect(
        events
          .slice(firstResult + 1)
          .some(
            (event) =>
              event.type === 'permission' &&
              event.tool === 'Write' &&
              event.meta?.decision === 'allow',
          ),
      ).toBe(true);
      expect(
        events
          .filter((event) => event.type === 'toolResult')
          .some((event) =>
            String(event.output).includes("The user doesn't want"),
          ),
      ).toBe(false);
      expect(
        (await readFile(path.join(workDir, 'result.txt'), 'utf8')).trim(),
      ).toBe('done');
      expect((await handle.result).exit).toBe('completed');
    },
    240000,
  );
});
